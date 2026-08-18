/* ============================================================
   지금, 그곳 — 애플리케이션 로직

   구성 순서
     1. 상수 (API, 날씨 카테고리, 아이콘)
     2. 상태
     3. DOM 참조 · 유틸
     4. API 레이어
     5. 배경 전환
     6. 지도
     7. 렌더 (리스트 / 상세)
     8. 필터
     9. 검색
    10. 선택 플로우
    11. 시작
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     1. 상수
     ============================================================ */
  var WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
  var GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';

  /* 현재 날씨로 받아올 항목. weather_code와 is_day가 배경 전환의 기준이다. */
  var CURRENT_FIELDS = 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day';

  var TEMP_MIN = -40;
  var TEMP_MAX = 50;

  /* PRD 4절 — weathercode를 5개 대표 카테고리로 묶는다. */
  var CATEGORIES = [
    { id: 'clear',  label: '맑음' },
    { id: 'cloudy', label: '흐림' },
    { id: 'rain',   label: '비' },
    { id: 'snow',   label: '눈' },
    { id: 'storm',  label: '뇌우' }
  ];

  function weatherCategory(code) {
    if (code === 0 || code === 1) return 'clear';
    if ([2, 3, 45, 48].indexOf(code) !== -1) return 'cloudy';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].indexOf(code) !== -1) return 'rain';
    if ([71, 73, 75, 77, 85, 86].indexOf(code) !== -1) return 'snow';
    if ([95, 96, 99].indexOf(code) !== -1) return 'storm';
    return 'cloudy';   /* 분류 밖의 코드는 흐림으로 본다 */
  }

  function categoryLabel(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i].label;
    }
    return '알 수 없음';
  }

  /* 아이콘은 외부 라이브러리 없이 인라인 SVG. currentColor로 색을 물려받는다. */
  var SVG_HEAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
                 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var CLOUD_PATH = '<path d="M7.4 16.6h9.2a3.8 3.8 0 0 0 .4-7.6 5.6 5.6 0 0 0-10.8-1 4.3 4.3 0 0 0 1.2 8.6z"/>';

  var ICONS = {
    'clear-day': SVG_HEAD + '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2' +
      'M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
    'clear-night': SVG_HEAD + '<path d="M20.2 14.6A8.3 8.3 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8z"/></svg>',
    'cloudy': SVG_HEAD + CLOUD_PATH + '</svg>',
    'rain': SVG_HEAD + CLOUD_PATH + '<path d="M9.2 19.2l-1 2.6M13 19.2l-1 2.6M16.8 19.2l-1 2.6"/></svg>',
    'snow': SVG_HEAD + CLOUD_PATH + '<path d="M9 20h.01M12.9 20h.01M16.8 20h.01M11 22.6h.01M14.9 22.6h.01"/></svg>',
    'storm': SVG_HEAD + CLOUD_PATH + '<path d="M13.2 18.2l-3.4 4.4h3l-.9 2.6"/></svg>'
  };

  function iconFor(category, isDay) {
    if (category === 'clear') return isDay ? ICONS['clear-day'] : ICONS['clear-night'];
    return ICONS[category] || ICONS.cloudy;
  }

  /* ============================================================
     2. 상태
     ============================================================ */
  var state = {
    landmarks: [],          /* LANDMARKS 사본 + weather 필드 */
    searchPin: null,        /* 검색으로 추가된 위치 (항상 1개만 유지) */
    selectedId: null,
    visibleIds: [],         /* 필터를 통과한 랜드마크 id 목록 */
    filters: { continent: 'all', weather: [], tempMin: TEMP_MIN, tempMax: TEMP_MAX },
    initialLoading: true,
    initialFailed: false
  };

  var map = null;
  var markers = {};          /* id -> L.Marker (랜드마크) */
  var searchMarker = null;
  var detailToken = 0;       /* 늦게 도착한 응답이 최신 화면을 덮어쓰지 않도록 */
  var searchController = null;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     3. DOM 참조 · 유틸
     ============================================================ */
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    bgA: $('bgA'),
    bgB: $('bgB'),
    search: $('search'),
    searchClear: $('searchClear'),
    searchSpinner: $('searchSpinner'),
    searchResults: $('searchResults'),
    continent: $('continent'),
    weatherChips: $('weatherChips'),
    tempMin: $('tempMin'),
    tempMax: $('tempMax'),
    tempFill: $('tempFill'),
    tempValue: $('tempValue'),
    filterReset: $('filterReset'),
    filterNotice: $('filterNotice'),
    list: $('list'),
    listCount: $('listCount'),
    detail: $('detail')
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  function deg(v) {
    return (v === null || v === undefined) ? '—' : Math.round(v) + '°';
  }

  /* ============================================================
     4. API 레이어
     ============================================================ */
  function fetchJSON(url, signal) {
    return fetch(url, { signal: signal }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  /* 응답의 current 객체를 화면에서 쓰기 좋은 형태로 통일한다.
     좌표는 유효하지만 값이 비어 있으면 null을 돌려준다 (PRD 3.6). */
  function normalizeCurrent(cur) {
    if (!cur || cur.temperature_2m === null || cur.temperature_2m === undefined) return null;
    return {
      temp: cur.temperature_2m,
      feels: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
      wind: cur.wind_speed_10m,
      code: cur.weather_code,
      isDay: cur.is_day === 1 || cur.is_day === true,
      category: weatherCategory(cur.weather_code)
    };
  }

  /* 좌표를 콤마로 이어 붙이면 Open-Meteo가 한 번의 요청으로 배열을 돌려준다.
     랜드마크가 12개여도 요청은 1건이다. */
  function fetchWeatherBatch(list) {
    var lats = list.map(function (l) { return l.lat; }).join(',');
    var lngs = list.map(function (l) { return l.lng; }).join(',');
    var url = WEATHER_API + '?latitude=' + lats + '&longitude=' + lngs +
              '&current=' + CURRENT_FIELDS + '&timezone=auto';

    return fetchJSON(url).then(function (data) {
      var arr = Array.isArray(data) ? data : [data];
      return arr.map(function (d) { return normalizeCurrent(d && d.current); });
    });
  }

  function fetchWeatherOne(lat, lng) {
    var url = WEATHER_API + '?latitude=' + lat + '&longitude=' + lng +
              '&current=' + CURRENT_FIELDS + '&timezone=auto';

    return fetchJSON(url).then(function (data) {
      var d = Array.isArray(data) ? data[0] : data;
      return normalizeCurrent(d && d.current);
    });
  }

  function searchCity(q, signal) {
    var url = GEO_API + '?name=' + encodeURIComponent(q) + '&count=6&language=ko&format=json';
    return fetchJSON(url, signal).then(function (data) {
      /* 결과가 없으면 results 키 자체가 없다 */
      return (data && data.results) ? data.results : [];
    });
  }

  /* ============================================================
     5. 배경 전환 (PRD 4절)
     레이어 2장을 번갈아 쓰며 교차시킨다. 새 날씨를 불러오는 동안에는
     이전 배경이 그대로 남아 있어 화면이 급하게 바뀌지 않는다.
     ============================================================ */
  var currentTheme = 'theme-clear-night';

  function setTheme(category, isDay) {
    var theme = 'theme-' + category + '-' + (isDay ? 'day' : 'night');
    if (theme === currentTheme) return;

    var front = els.bgA.classList.contains('is-on') ? els.bgA : els.bgB;
    var back = front === els.bgA ? els.bgB : els.bgA;

    back.className = 'bg__layer ' + theme;
    void back.offsetWidth;              /* 클래스 적용을 확정시킨 뒤 전환 */
    back.classList.add('is-on');
    front.classList.remove('is-on');

    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }

  /* ============================================================
     6. 지도
     ============================================================ */
  function initMap() {
    map = L.map('map', {
      center: [24, 12],
      zoom: 2,
      minZoom: 2,
      worldCopyJump: true,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    state.landmarks.forEach(function (l) {
      var marker = L.marker([l.lat, l.lng], {
        /* 보이는 점은 16px이지만 클릭 영역(divIcon 크기)은 34px로 잡는다.
           지도 위에서 작은 점을 정확히 누르기는 어렵기 때문. */
        icon: L.divIcon({
          className: 'pin-hit',
          html: '<span class="pin"></span>',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        }),
        title: l.name + ' · ' + l.country,
        alt: l.name,
        riseOnHover: true
      });
      marker.on('click', function () { selectLocation(l); });
      markers[l.id] = marker;
    });
  }

  function flyTo(lat, lng) {
    var zoom = Math.max(map.getZoom(), 5);
    if (reduceMotion) map.setView([lat, lng], zoom, { animate: false });
    else map.flyTo([lat, lng], zoom, { duration: 0.9 });
  }

  /* 마커 표시 여부는 필터 결과를 그대로 따른다 (PRD 3.4) */
  function renderMarkers() {
    state.landmarks.forEach(function (l) {
      var marker = markers[l.id];
      var visible = state.visibleIds.indexOf(l.id) !== -1;

      if (visible && !map.hasLayer(marker)) marker.addTo(map);
      else if (!visible && map.hasLayer(marker)) map.removeLayer(marker);
    });
    updateMarkerStates();
  }

  function updateMarkerStates() {
    Object.keys(markers).forEach(function (id) {
      var el = markers[id].getElement();
      if (!el) return;
      var pin = el.querySelector('.pin');
      if (pin) pin.classList.toggle('is-selected', state.selectedId === id);
    });

    if (searchMarker) {
      var sel = searchMarker.getElement();
      var spin = sel && sel.querySelector('.pin');
      if (spin) spin.classList.toggle('is-selected', state.searchPin && state.selectedId === state.searchPin.id);
    }
  }

  /* ============================================================
     7. 렌더 — 리스트
     ============================================================ */
  function renderList() {
    if (state.initialLoading) {
      els.list.innerHTML = state.landmarks.map(function () {
        return '<li class="skeleton"></li>';
      }).join('');
      els.listCount.textContent = '불러오는 중';
      return;
    }

    var items = state.landmarks.filter(function (l) {
      return state.visibleIds.indexOf(l.id) !== -1;
    });

    els.listCount.textContent = items.length + ' / ' + state.landmarks.length + '곳';

    /* 필터 결과가 없는 것은 에러가 아니라 빈 상태다 (PRD 3.4) */
    if (!items.length) {
      els.list.innerHTML = '<li class="list__empty">조건에 맞는 결과가 없습니다.<br>필터를 넓혀보세요.</li>';
      return;
    }

    els.list.innerHTML = items.map(function (l) {
      var w = l.weather;
      var badge = w
        ? '<span class="list__temp">' + deg(w.temp) + '</span>' + iconFor(w.category, w.isDay)
        : '<span class="list__temp">—</span>';

      return '<li>' +
        '<button type="button" class="list__item' + (state.selectedId === l.id ? ' is-selected' : '') + '" ' +
                'data-id="' + esc(l.id) + '"' + (state.selectedId === l.id ? ' aria-current="true"' : '') + '>' +
          '<span class="list__text">' +
            '<span class="list__name">' + esc(l.name) + '</span>' +
            '<span class="list__country">' + esc(l.country) + ' · ' +
              esc(window.CONTINENT_LABELS[l.continent] || l.continent) + '</span>' +
          '</span>' +
          '<span class="list__weather">' + badge + '</span>' +
        '</button></li>';
    }).join('');
  }

  /* 초기 일괄 로딩이 실패해도 지도·리스트·지역 필터는 계속 쓸 수 있어야 한다 (PRD 3.6) */
  function renderInitialError() {
    els.listCount.textContent = '';
    els.list.innerHTML =
      '<li class="list__empty"><div class="error">' +
        '<p class="error__msg">날씨 정보를 불러오지 못했습니다.</p>' +
        '<button type="button" class="btn btn--sm" id="retryInitial">다시 시도</button>' +
      '</div></li>';

    var btn = $('retryInitial');
    if (btn) btn.addEventListener('click', loadInitialWeather);
  }

  /* ============================================================
     7. 렌더 — 상세 카드
     ============================================================ */
  function renderDetailHint() {
    els.detail.innerHTML =
      '<p class="detail__hint">지도의 마커나 목록에서 장소를 선택하면 그곳의 지금 날씨를 보여줍니다.</p>';
  }

  function showDetailLoading() {
    clearDetailOverlay();
    var ov = document.createElement('div');
    ov.className = 'detail__overlay';
    ov.innerHTML = '<span class="spinner" role="status" aria-label="날씨를 불러오는 중"></span>';
    els.detail.appendChild(ov);
  }

  function clearDetailOverlay() {
    var ov = els.detail.querySelector('.detail__overlay');
    if (ov) ov.parentNode.removeChild(ov);
  }

  function renderDetail(loc, w) {
    var badge = loc.kind === 'search' ? '<span class="detail__badge">검색한 위치</span>' : '';

    els.detail.innerHTML =
      '<p class="detail__place">' + esc(loc.name) + badge + '</p>' +
      '<p class="detail__country">' + esc(loc.country || '') + '</p>' +
      '<div class="detail__main">' +
        '<span class="detail__icon">' + iconFor(w.category, w.isDay) + '</span>' +
        '<span class="detail__temp">' + deg(w.temp) + '</span>' +
      '</div>' +
      '<p class="detail__cond">' + esc(categoryLabel(w.category)) +
        ' <span>· 현지 ' + (w.isDay ? '낮' : '밤') + '</span></p>' +
      '<dl class="detail__meta">' +
        '<div><dt>체감</dt><dd>' + deg(w.feels) + '</dd></div>' +
        '<div><dt>습도</dt><dd>' + (w.humidity === null || w.humidity === undefined ? '—' : Math.round(w.humidity) + '%') + '</dd></div>' +
        '<div><dt>바람</dt><dd>' + (w.wind === null || w.wind === undefined ? '—' : Math.round(w.wind) + '<small> km/h</small>') + '</dd></div>' +
      '</dl>';
  }

  /* 에러가 나도 지도·리스트·필터는 그대로 살아 있다 (PRD 3.6) */
  function renderDetailError(message, onRetry) {
    els.detail.innerHTML =
      '<div class="error">' +
        '<p class="error__msg">' + esc(message) + '</p>' +
        (onRetry ? '<button type="button" class="btn btn--sm" id="retryDetail">다시 시도</button>' : '') +
      '</div>';

    if (onRetry) {
      var btn = $('retryDetail');
      if (btn) btn.addEventListener('click', onRetry);
    }
  }

  /* ============================================================
     8. 필터 (PRD 3.4 — 지역 / 날씨 / 기온을 AND로 조합)
     ============================================================ */
  function buildFilterControls() {
    /* 지역: 데이터에 실제로 존재하는 대륙만 넣는다 */
    var seen = {};
    state.landmarks.forEach(function (l) { seen[l.continent] = true; });

    Object.keys(window.CONTINENT_LABELS).forEach(function (key) {
      if (!seen[key]) return;
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = window.CONTINENT_LABELS[key];
      els.continent.appendChild(opt);
    });

    /* 날씨: 여러 개를 고르면 그중 하나라도 맞으면 통과(OR), 다른 필터와는 AND */
    els.weatherChips.innerHTML = CATEGORIES.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="false">' +
             esc(c.label) + '</button>';
    }).join('');

    updateRangeUI();
  }

  function updateRangeUI() {
    var lo = Number(els.tempMin.value);
    var hi = Number(els.tempMax.value);
    var span = TEMP_MAX - TEMP_MIN;

    els.tempFill.style.left = ((lo - TEMP_MIN) / span * 100) + '%';
    els.tempFill.style.width = ((hi - lo) / span * 100) + '%';
    els.tempValue.textContent = lo + '° ~ ' + hi + '°';
  }

  function passesFilter(l) {
    var f = state.filters;

    if (f.continent !== 'all' && l.continent !== f.continent) return false;

    var usingWeather = f.weather.length > 0;
    var usingTemp = (f.tempMin > TEMP_MIN || f.tempMax < TEMP_MAX);

    /* 날씨를 아직 모르는 항목은 날씨/기온 기준으로 거를 수 없다 */
    if ((usingWeather || usingTemp) && !l.weather) return false;
    if (usingWeather && f.weather.indexOf(l.weather.category) === -1) return false;
    if (usingTemp && (l.weather.temp < f.tempMin || l.weather.temp > f.tempMax)) return false;

    return true;
  }

  function applyFilters() {
    state.visibleIds = state.landmarks.filter(passesFilter).map(function (l) { return l.id; });
    renderList();
    renderMarkers();
  }

  function bindFilters() {
    els.continent.addEventListener('change', function () {
      state.filters.continent = els.continent.value;
      applyFilters();
    });

    els.weatherChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip || chip.disabled) return;

      var cat = chip.getAttribute('data-cat');
      var i = state.filters.weather.indexOf(cat);
      if (i === -1) state.filters.weather.push(cat);
      else state.filters.weather.splice(i, 1);

      chip.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
      applyFilters();
    });

    function onRange() {
      var lo = Number(els.tempMin.value);
      var hi = Number(els.tempMax.value);

      /* 두 엄지가 서로를 넘지 않게 잡아둔다 */
      if (lo > hi) {
        if (this === els.tempMin) { lo = hi; els.tempMin.value = lo; }
        else { hi = lo; els.tempMax.value = hi; }
      }

      state.filters.tempMin = lo;
      state.filters.tempMax = hi;
      updateRangeUI();
      applyFilters();
    }

    els.tempMin.addEventListener('input', onRange);
    els.tempMax.addEventListener('input', onRange);

    els.filterReset.addEventListener('click', function () {
      state.filters = { continent: 'all', weather: [], tempMin: TEMP_MIN, tempMax: TEMP_MAX };
      els.continent.value = 'all';
      els.tempMin.value = TEMP_MIN;
      els.tempMax.value = TEMP_MAX;
      Array.prototype.forEach.call(els.weatherChips.querySelectorAll('.chip'), function (c) {
        c.setAttribute('aria-pressed', 'false');
      });
      updateRangeUI();
      applyFilters();
    });
  }

  /* 초기 일괄 로딩이 실패하면 날씨·기온 필터는 기준 데이터가 없으므로 잠근다 */
  function setWeatherFiltersEnabled(enabled) {
    Array.prototype.forEach.call(els.weatherChips.querySelectorAll('.chip'), function (c) {
      c.disabled = !enabled;
    });
    els.tempMin.disabled = !enabled;
    els.tempMax.disabled = !enabled;

    if (enabled) {
      els.filterNotice.hidden = true;
      els.filterNotice.textContent = '';
    } else {
      els.filterNotice.hidden = false;
      els.filterNotice.textContent = '날씨 데이터를 불러오지 못해 날씨·기온 필터는 사용할 수 없습니다. 지역 필터는 그대로 쓸 수 있습니다.';
    }
  }

  /* ============================================================
     9. 검색 (PRD 3.3)
     ============================================================ */
  var searchResults = [];
  var activeIndex = -1;

  function closeResults() {
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = '';
    els.search.setAttribute('aria-expanded', 'false');
    searchResults = [];
    activeIndex = -1;
  }

  function renderResults(list, query) {
    searchResults = list;
    activeIndex = -1;

    if (!list.length) {
      els.searchResults.innerHTML =
        /* Open-Meteo의 검색 색인은 로마자 기준이라 한글로는 안 잡히는 도시가 있다.
           그래서 영문 이름을 함께 안내한다. */
        '<li class="search__empty">검색 결과가 없습니다.<br>도시명을 다시 확인해주세요. (영문 이름으로도 검색해보세요)</li>';
    } else {
      els.searchResults.innerHTML = list.map(function (r, i) {
        var sub = [r.admin1, r.country].filter(Boolean).join(' · ');
        return '<li role="option" aria-selected="false">' +
          '<button type="button" class="search__item" data-idx="' + i + '">' +
            esc(r.name) + (sub ? '<small>' + esc(sub) + '</small>' : '') +
          '</button></li>';
      }).join('');
    }

    els.searchResults.hidden = false;
    els.search.setAttribute('aria-expanded', 'true');
  }

  function highlightResult(next) {
    var items = els.searchResults.querySelectorAll('.search__item');
    if (!items.length) return;

    activeIndex = (next + items.length) % items.length;
    Array.prototype.forEach.call(items, function (el, i) {
      el.classList.toggle('is-active', i === activeIndex);
      el.parentNode.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function pickResult(idx) {
    var r = searchResults[idx];
    if (!r) return;

    var loc = {
      id: 'search-pin',
      kind: 'search',
      name: r.name,
      country: [r.admin1, r.country].filter(Boolean).join(' · '),
      lat: r.latitude,
      lng: r.longitude
    };

    /* 검색 위치는 항상 1개만 유지한다 (영구 저장은 범위 밖 — PRD 7절) */
    state.searchPin = loc;
    if (searchMarker) map.removeLayer(searchMarker);

    searchMarker = L.marker([loc.lat, loc.lng], {
      icon: L.divIcon({
        className: 'pin-hit',
        html: '<span class="pin pin--search"></span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      }),
      title: loc.name + ' (검색한 위치)',
      alt: loc.name,
      riseOnHover: true,
      zIndexOffset: 500
    }).addTo(map);

    searchMarker.on('click', function () { selectLocation(state.searchPin); });

    els.search.value = r.name;
    els.searchClear.hidden = false;
    closeResults();
    selectLocation(loc);
  }

  var runSearch = debounce(function (q) {
    if (searchController) searchController.abort();
    searchController = ('AbortController' in window) ? new AbortController() : null;

    els.searchSpinner.hidden = false;

    searchCity(q, searchController ? searchController.signal : undefined)
      .then(function (list) {
        els.searchSpinner.hidden = true;
        if (els.search.value.trim() !== q) return;   /* 입력이 이미 바뀌었으면 버린다 */
        renderResults(list, q);
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        els.searchSpinner.hidden = true;
        els.searchResults.innerHTML =
          '<li class="search__empty">검색에 실패했습니다. 잠시 후 다시 시도해주세요.</li>';
        els.searchResults.hidden = false;
        els.search.setAttribute('aria-expanded', 'true');
      });
  }, 300);

  function bindSearch() {
    els.search.addEventListener('input', function () {
      var q = els.search.value.trim();
      els.searchClear.hidden = !q;

      if (!q) {
        if (searchController) searchController.abort();
        els.searchSpinner.hidden = true;
        closeResults();
        return;
      }
      runSearch(q);
    });

    els.search.addEventListener('keydown', function (e) {
      if (els.searchResults.hidden) return;

      if (e.key === 'ArrowDown') { e.preventDefault(); highlightResult(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlightResult(activeIndex - 1); }
      else if (e.key === 'Enter') {
        if (activeIndex >= 0) { e.preventDefault(); pickResult(activeIndex); }
      } else if (e.key === 'Escape') { closeResults(); }
    });

    els.searchResults.addEventListener('click', function (e) {
      var btn = e.target.closest('.search__item');
      if (btn) pickResult(Number(btn.getAttribute('data-idx')));
    });

    els.searchClear.addEventListener('click', function () {
      els.search.value = '';
      els.searchClear.hidden = true;
      closeResults();
      els.search.focus();
    });

    document.addEventListener('click', function (e) {
      if (!els.searchResults.hidden && !e.target.closest('.search')) closeResults();
    });
  }

  /* ============================================================
     10. 선택 플로우 — 마커 / 리스트 / 검색 결과가 모두 이 길로 들어온다
     ============================================================ */
  function selectLocation(loc) {
    state.selectedId = loc.id;

    renderList();          /* 리스트 하이라이트 */
    updateMarkerStates();  /* 마커 강조 */
    scrollSelectedIntoView();
    flyTo(loc.lat, loc.lng);

    loadWeatherFor(loc);
  }

  function scrollSelectedIntoView() {
    var el = els.list.querySelector('.list__item.is-selected');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function loadWeatherFor(loc) {
    var token = ++detailToken;
    showDetailLoading();

    fetchWeatherOne(loc.lat, loc.lng).then(function (w) {
      if (token !== detailToken) return;   /* 그 사이 다른 곳을 골랐으면 버린다 */
      clearDetailOverlay();

      if (!w) {
        renderDetailError('해당 위치의 날씨 정보를 지원하지 않습니다.', null);
        return;
      }

      loc.weather = w;
      if (loc.kind === 'landmark') renderList();   /* 리스트의 온도 배지 갱신 */

      renderDetail(loc, w);
      setTheme(w.category, w.isDay);
    }).catch(function () {
      if (token !== detailToken) return;
      clearDetailOverlay();
      renderDetailError('날씨 정보를 불러오지 못했습니다.', function () { loadWeatherFor(loc); });
    });
  }

  /* ============================================================
     11. 시작
     ============================================================ */
  function loadInitialWeather() {
    state.initialLoading = true;
    state.initialFailed = false;
    setWeatherFiltersEnabled(true);
    renderList();

    fetchWeatherBatch(state.landmarks).then(function (weathers) {
      state.initialLoading = false;
      state.landmarks.forEach(function (l, i) { l.weather = weathers[i] || null; });
      applyFilters();
    }).catch(function () {
      state.initialLoading = false;
      state.initialFailed = true;

      /* 이름·국가만이라도 보이도록 리스트와 마커는 유지한다 */
      state.visibleIds = state.landmarks.map(function (l) { return l.id; });
      renderMarkers();
      setWeatherFiltersEnabled(false);
      renderInitialError();
    });
  }

  function init() {
    state.landmarks = (window.LANDMARKS || []).map(function (l) {
      return {
        id: l.id, kind: 'landmark',
        name: l.name, country: l.country, continent: l.continent,
        lat: l.lat, lng: l.lng, weather: null
      };
    });

    buildFilterControls();
    bindFilters();
    bindSearch();

    initMap();
    state.visibleIds = state.landmarks.map(function (l) { return l.id; });
    renderMarkers();

    renderDetailHint();

    els.list.addEventListener('click', function (e) {
      var btn = e.target.closest('.list__item');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      for (var i = 0; i < state.landmarks.length; i++) {
        if (state.landmarks[i].id === id) { selectLocation(state.landmarks[i]); return; }
      }
    });

    loadInitialWeather();
  }

  init();
})();
