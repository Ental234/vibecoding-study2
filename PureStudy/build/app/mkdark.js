// 다크 규칙은 두 경로에서 같아야 한다: 설정에서 '다크'를 고른 경우와,
// '시스템'이라 data-theme 자체가 없는데 기기가 다크인 경우.
// 손으로 두 번 적으면 어긋나므로 한 벌만 적고 여기서 복제한다.
const RULES = [
  [".bg-surface", "background-color: #1E1B17"],
  [".bg-paper-card", "background-color: #262119"],
  [".bg-paper-bg", "background-color: #211D18"],
  [".bg-surface-container-low", "background-color: #221E18"],
  [".bg-surface-container", "background-color: #2F281F"],
  [".bg-surface-container-lowest", "background-color: #1A1713"],
  [".bg-surface-variant", "background-color: #3A332A"],
  [".bg-primary", "background-color: #6E6B64"],
  [".bg-ink-primary", "background-color: #EDE6DA"],
  [".bg-border-sep", "background-color: #3A332A"],
  [".bg-ink-muted", "background-color: #9A9082"],
  [".bg-secondary-container", "background-color: #C4763F"],
  [".bg-stop-fill", "background-color: #3B2823"],
  [".border-border-sep", "border-color: #3A332A"],
  [".border-secondary", "border-color: #E0A16E"],
  [".border-stop-ink", "border-color: #E0A192"],
  [".text-ink-primary, %.text-on-surface", "color: #EDE6DA"],
  [".text-ink-muted, %.text-on-surface-variant", "color: #9A9082"],
  [".text-ink-whisper", "color: #6A6156"],
  [".text-terracotta", "color: #D28250"],
  [".text-secondary", "color: #E0A16E"],
  [".text-on-primary", "color: #1E1B17"],
  [".text-stop-ink", "color: #E0A192"],
  [".text-error", "color: #FFB4AB"],
  [".is-done .runner", "color: #E0A16E"],
  [".is-done #bar-fill", "background-color: #E0A16E"],
  // 시안의 종이 광택 그라디언트는 밝은 색만으로 되어 있어 어두운 배경에서 카드를 씻어낸다
  [".grad-sheen", "opacity: 0"],
  // color-scheme만으로 팝업을 다시 칠하지 않는 플랫폼이 있어 항목 색을 직접 지정한다
  ["select option", "background-color: #262119; color: #EDE6DA"],
];

function block(prefix, indent) {
  return RULES.map(([sel, decl]) => {
    const full = sel.split(", ").map((s) => prefix + " " + s.replace(/^%/, "")).join(",\n" + indent);
    return `${indent}${full} { ${decl}; }`;
  }).join("\n");
}

module.exports = () =>
  block('[data-theme="dark"]', "") +
  "\n\n/* '시스템' 설정은 data-theme 속성을 아예 지운다. 그 경우를 여기서 받는다 */\n" +
  "@media (prefers-color-scheme: dark) {\n" +
  block(':root:not([data-theme="light"])', "  ") +
  "\n}";

if (require.main === module) console.log(module.exports());
