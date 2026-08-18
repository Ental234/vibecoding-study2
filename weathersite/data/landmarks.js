/* ============================================================
   랜드마크 데이터셋 (PRD 5.3)

   여기에 항목만 추가하면 지도 마커·사이드패널 리스트·필터가
   자동으로 늘어납니다. 대륙(continent) 값은 아래 6종만 사용하세요.

     asia / europe / north-america / south-america / africa / oceania

   좌표(lat, lng)는 소수점 4자리면 충분합니다.
   ============================================================ */
window.LANDMARKS = [
  { id: "great-wall",   name: "만리장성",           country: "중국",     continent: "asia",          lat:  40.4319, lng: 116.5704 },
  { id: "angkor-wat",   name: "앙코르와트",         country: "캄보디아", continent: "asia",          lat:  13.4125, lng: 103.8670 },
  { id: "taj-mahal",    name: "타지마할",           country: "인도",     continent: "asia",          lat:  27.1751, lng:  78.0421 },
  { id: "eiffel",       name: "에펠탑",             country: "프랑스",   continent: "europe",        lat:  48.8584, lng:   2.2945 },
  { id: "colosseum",    name: "콜로세움",           country: "이탈리아", continent: "europe",        lat:  41.8902, lng:  12.4922 },
  { id: "santorini",    name: "산토리니",           country: "그리스",   continent: "europe",        lat:  36.4618, lng:  25.3753 },
  { id: "liberty",      name: "자유의 여신상",      country: "미국",     continent: "north-america", lat:  40.6892, lng: -74.0445 },
  { id: "grand-canyon", name: "그랜드캐니언",       country: "미국",     continent: "north-america", lat:  36.0544, lng:-112.1401 },
  { id: "christ",       name: "예수상",             country: "브라질",   continent: "south-america", lat: -22.9519, lng: -43.2105 },
  { id: "machu-picchu", name: "마추픽추",           country: "페루",     continent: "south-america", lat: -13.1631, lng: -72.5450 },
  { id: "giza",         name: "기자 피라미드",      country: "이집트",   continent: "africa",        lat:  29.9792, lng:  31.1342 },
  { id: "opera-house",  name: "시드니 오페라하우스", country: "호주",     continent: "oceania",       lat: -33.8568, lng: 151.2153 }
];

/* 대륙 코드 → 화면에 보여줄 한국어 이름 */
window.CONTINENT_LABELS = {
  "asia": "아시아",
  "europe": "유럽",
  "north-america": "북아메리카",
  "south-america": "남아메리카",
  "africa": "아프리카",
  "oceania": "오세아니아"
};
