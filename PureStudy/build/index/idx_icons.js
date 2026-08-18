/* Material Symbols는 웹폰트다. 오프라인이면 아이콘 자리에 "arrow_forward" 같은
   글자가 그대로 드러난다. 같은 모양의 인라인 SVG로 바꿔 폰트 의존을 없앤다. */
const PATHS = {
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" fill="currentColor" stroke="none"/>',
  arrow_forward: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  schedule: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  filter_alt: '<path d="M3.5 5h17l-6.7 7.8V19l-3.6 2v-8.2z" fill="currentColor" stroke="none"/>',
  trending_up: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  check_circle: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/>',
};

/* 시안은 text-sm 같은 글자 크기로 아이콘 크기를 정했다.
   SVG는 글자가 아니므로 그 값을 width/height로 옮긴다.
   크기 지정이 없으면 Material Symbols 기본값 24px이다. */
const SIZES = { "text-xs": 12, "text-sm": 14, "text-base": 16, "text-lg": 18, "text-xl": 20 };

const RE = /<span class="material-symbols-outlined([^"]*)"[^>]*>([a-z_]+)<\/span>/g;

module.exports = (html) =>
  html.replace(RE, (whole, rest, name) => {
    const body = PATHS[name];
    if (!body) throw new Error("아이콘 매핑이 없습니다: " + name);
    const key = Object.keys(SIZES).find((k) => new RegExp("(^|\\s)" + k + "(\\s|$)").test(rest));
    const size = key ? SIZES[key] : 24;
    const cls = key ? rest.replace(new RegExp("(^|\\s)" + key + "(?=\\s|$)"), "").trim() : rest.trim();
    return (
      `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
      `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ` +
      `aria-hidden="true">${body}</svg>`
    );
  });
