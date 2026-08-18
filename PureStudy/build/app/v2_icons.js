/* Material Symbols는 웹폰트다. 오프라인에서는 글리프가 오지 않아
   아이콘 자리에 "expand_more" 같은 글자가 그대로 드러난다.
   같은 모양의 인라인 SVG로 바꿔 폰트 의존을 없앤다. 색은 currentColor로 물려받는다. */
const PATHS = {
  timer: '<path d="M9 2h6M12 6v7l4 2"/><circle cx="12" cy="13" r="8"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/>',
  expand_more: '<path d="M6 9.5 12 15.5 18 9.5"/>',
  play_arrow: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none"/>',
  chevron_left: '<path d="M14.5 6 8.5 12l6 6"/>',
  chevron_right: '<path d="M9.5 6l6 6-6 6"/>',
  trending_up: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
};

/* 시안은 text-[18px] 같은 폰트 크기로 아이콘 크기를 정했다.
   SVG는 글자가 아니므로 그 값을 width/height로 옮긴다. */
const RE = /<span class="material-symbols-outlined([^"]*)">([a-z_]+)<\/span>/g;

module.exports = (html) =>
  html.replace(RE, (whole, rest, name) => {
    const body = PATHS[name];
    if (!body) throw new Error("아이콘 매핑이 없습니다: " + name);
    const size = (rest.match(/text-\[(\d+)px\]/) || [, "24"])[1];
    const cls = rest.replace(/\s*text-\[\d+px\]/, "").trim();
    return (
      `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
      `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ` +
      `aria-hidden="true">${body}</svg>`
    );
  });
