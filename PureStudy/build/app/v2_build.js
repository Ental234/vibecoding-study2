/* PureStudy.html 재조립.
   시안(_2/_3/_4 code.html) 마크업을 그대로 쓰기로 했으므로,
   JS가 '생성'하는 요소의 클래스 문자열도 같은 Tailwind 어휘로 맞춘다.
   로직은 건드리지 않는다 — 바뀌는 것은 className 문자열과 클래스 토글뿐. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DIR = __dirname;
const ORIG = fs.readFileSync(path.join(__dirname, "..", "..", "PureStudy.backup.html"), "utf8");

/* --- 원본에서 <script> 본문만 떼어낸다 --- */
const start = ORIG.indexOf("<script>\n\"use strict\";");
const end = ORIG.lastIndexOf("</script>");
if (start < 0 || end < 0) throw new Error("script 경계를 찾지 못했습니다");
let js = ORIG.slice(start + "<script>".length, end);

/* --- 클래스 문자열 치환 --- */
const TW = {
  barCol: "bar-col flex flex-col items-center gap-s1 relative z-10 group cursor-pointer h-full justify-end bg-transparent border-0 p-0",
  barColToday: "",
  barSlot: "relative w-full flex-1 flex items-end justify-center",
  goalTick: "absolute left-[6px] right-[6px] border-t border-dashed border-ink-muted opacity-70 pointer-events-none z-0",
  bar: "w-full max-w-[40px] min-h-[2px] border rounded-t-sm transition-all duration-500 ease-out z-10",
  barDone: " bg-secondary-container border-secondary",
  barMiss: " bg-surface-variant border-border-sep",
  barEmpty: " bg-transparent border-transparent",
  barLabel: "font-label-caption text-label-caption text-ink-primary mt-s1",
  barLabelToday: " text-terracotta font-bold",
  barValue: "font-label-caption text-label-caption text-ink-muted text-[11px] tnum whitespace-nowrap",

  tlSeg: "absolute top-0 bottom-0",
  tlSegPause: " bg-ink-whisper",

  emptyNote: "font-body-main text-body-main text-ink-whisper text-center py-s4",
  segRow: "flex items-center gap-s2 px-s3 py-s2 border-b border-border-sep last:border-0 hover:bg-surface/50 transition-colors",
  segDot: "w-[10px] h-[10px] rounded-full shrink-0",
  segTime: "flex-1 font-body-main text-body-main text-on-surface tnum",
  segDur: "font-label-caption text-label-caption text-ink-muted tnum",
  segPause: "font-label-caption text-label-caption text-ink-whisper w-[132px] text-right",
  segSelect: "w-[132px] appearance-none bg-surface-container-lowest border border-border-sep rounded-DEFAULT px-s1 py-1 font-label-caption text-label-caption text-on-surface focus:border-terracotta focus:outline-none transition-colors cursor-pointer",

  distRow: "flex items-center gap-s2",
  distName: "w-[96px] shrink-0 font-body-main text-body-main text-on-surface",
  distBar: "flex-1 h-2 bg-surface border border-border-sep rounded-full overflow-hidden",
  distFill: "block h-full rounded-full",
  distVal: "w-[88px] text-right font-label-caption text-label-caption text-ink-muted tnum",

  subjRow: "flex items-center gap-s2 p-s3 border-b border-border-sep last:border-0 hover:bg-surface/50 transition-colors",
  subjRowArchived: " opacity-50",
  subjDot: "w-4 h-4 rounded-full shrink-0",
  subjName: "flex-1 max-w-sm bg-transparent font-body-main text-body-main text-on-surface border-b border-transparent focus:border-terracotta focus:outline-none py-1 transition-colors",
  subjColor: "appearance-none bg-surface-container-lowest border border-border-sep rounded-DEFAULT px-s1 py-1 font-label-caption text-label-caption text-on-surface focus:border-terracotta focus:outline-none transition-colors cursor-pointer",
  subjToggle: "font-label-caption text-label-caption text-ink-muted hover:text-on-surface hover:bg-surface-container transition-colors px-s2 py-1 rounded-DEFAULT border-0 bg-transparent cursor-pointer",
};

const swaps = [
  // 비교 배지 — 뒤처졌을 때도 붉은 마이너스를 쓰지 않는다 (§6.5)
  [
    'el.className = `delta ${ahead ? "ahead" : "behind"}`;',
    'el.className = "ml-s1 px-s1 rounded-full border font-label-caption text-label-caption tnum " +\n    (ahead ? "text-secondary border-secondary-container bg-surface-container-low"\n           : "text-ink-muted border-border-sep bg-surface-container-low");',
  ],
  // 요일 막대
  [
    'const col = elem("button", "bar-col" + (key === today ? " is-today" : ""));',
    `const col = elem("button", ${JSON.stringify(TW.barCol)} + (key === today ? ${JSON.stringify(TW.barColToday)} : ""));`,
  ],
  ['const slot = elem("div", "bar-slot");', `const slot = elem("div", ${JSON.stringify(TW.barSlot)});`],
  ['const tick = elem("div", "goal-tick");', `const tick = elem("div", ${JSON.stringify(TW.goalTick)});`],
  [
    'const bar = elem("div", "bar" + (ms === 0 ? " is-empty" : done ? " is-done" : ""));',
    `const bar = elem("div", ${JSON.stringify(TW.bar)} + (ms === 0 ? ${JSON.stringify(TW.barEmpty)} : done ? ${JSON.stringify(TW.barDone)} : ${JSON.stringify(TW.barMiss)}));`,
  ],
  [
    'col.append(slot, elem("div", "bar-label", WEEKDAYS[i]),\n                     elem("div", "bar-value", ms === 0 ? "—" : fmtHM(ms)));',
    `col.append(slot, elem("div", ${JSON.stringify(TW.barLabel)} + (key === today ? ${JSON.stringify(TW.barLabelToday)} : ""), WEEKDAYS[i]),\n                     elem("div", ${JSON.stringify(TW.barValue)}, ms === 0 ? "—" : fmtHM(ms)));`,
  ],
  // 타임라인
  [
    'const bar = elem("div", "tl-seg" + (s.kind === "pause" ? " pause" : ""));',
    `const bar = elem("div", ${JSON.stringify(TW.tlSeg)} + (s.kind === "pause" ? ${JSON.stringify(TW.tlSegPause)} : ""));`,
  ],
  // 구간 목록
  ['elem("p", "empty-note", "이 날은 기록이 없습니다")', `elem("p", ${JSON.stringify(TW.emptyNote)}, "이 날은 기록이 없습니다")`],
  ['elem("p", "empty-note", "—")', `elem("p", ${JSON.stringify(TW.emptyNote)}, "—")`],
  [
    'st.subjectList.append(elem("p", "empty-note", "과목 없이도 시작할 수 있습니다. 그 시간은 미분류로 쌓입니다."));',
    `st.subjectList.append(elem("p", ${JSON.stringify(TW.emptyNote)}, "과목 없이도 시작할 수 있습니다. 그 시간은 미분류로 쌓입니다."));`,
  ],
  ['const row = elem("div", "seg-row");', `const row = elem("div", ${JSON.stringify(TW.segRow)});`],
  [
    'row.append(dot, elem("span", "seg-time", timeText), elem("span", "seg-dur", fmtHM(durationOf(s))));\n    row.append(s.kind === "pause" ? elem("span", "seg-pause", "일시정지") : buildSegmentSubjectSelect(s));',
    `row.append(dot, elem("span", ${JSON.stringify(TW.segTime)}, timeText), elem("span", ${JSON.stringify(TW.segDur)}, fmtHM(durationOf(s))));\n    row.append(s.kind === "pause" ? elem("span", ${JSON.stringify(TW.segPause)}, "일시정지") : buildSegmentSubjectSelect(s));`,
  ],
  // 과목별 분포
  ['const row = elem("div", "dist-row");', `const row = elem("div", ${JSON.stringify(TW.distRow)});`],
  ['const track = elem("span", "dist-bar");', `const track = elem("span", ${JSON.stringify(TW.distBar)});`],
  ['const fill = elem("i");', `const fill = elem("i", ${JSON.stringify(TW.distFill)});`],
  [
    'row.append(dot, elem("span", "dist-name", subjectNameOf(item.subjectId)), track,\n               elem("span", "dist-val", fmtHM(item.ms)));',
    `row.append(dot, elem("span", ${JSON.stringify(TW.distName)}, subjectNameOf(item.subjectId)), track,\n               elem("span", ${JSON.stringify(TW.distVal)}, fmtHM(item.ms)));`,
  ],
  // 과목 행
  [
    'const row = elem("div", "subject-row" + (subject.archived ? " archived" : ""));',
    `const row = elem("div", ${JSON.stringify(TW.subjRow)} + (subject.archived ? ${JSON.stringify(TW.subjRowArchived)} : ""));`,
  ],
  ['name.className = "subj-name";', `name.className = ${JSON.stringify(TW.subjName)};`],
  [
    'const toggle = elem("button", "btn-quiet", subject.archived ? "복원" : "보관");',
    `const toggle = elem("button", ${JSON.stringify(TW.subjToggle)}, subject.archived ? "복원" : "보관");`,
  ],
  // 테마 토글 — 한 토큰만 다루는 classList.toggle로는 여러 유틸리티를 못 바꾼다
  [
    '    btn.classList.toggle("on", btn.dataset.themeValue === db.settings.theme);',
    '    const on = btn.dataset.themeValue === db.settings.theme;\n' +
      '    btn.classList.toggle("bg-ink-primary", on);\n' +
      '    btn.classList.toggle("text-on-primary", on);\n' +
      '    btn.classList.toggle("font-bold", on);\n' +
      '    btn.classList.toggle("text-ink-muted", !on);\n' +
      '    btn.classList.toggle("hover:bg-surface-container", !on);',
  ],
  [
    'st.backupNote.classList.toggle("backup-due", due);',
    'st.backupNote.classList.toggle("text-secondary", due);\n  st.backupNote.classList.toggle("text-ink-muted", !due);',
  ],
];

for (const [from, to] of swaps) {
  if (!js.includes(from)) throw new Error("치환 대상을 찾지 못했습니다:\n" + from);
  js = js.split(from).join(to);
}

/* seg 과목 select · 과목 색 select 는 createElement 직후 클래스를 붙인다 */
js = js.replace(
  'function buildSegmentSubjectSelect(seg) {\n  const sel = document.createElement("select");',
  `function buildSegmentSubjectSelect(seg) {\n  const sel = document.createElement("select");\n  sel.className = ${JSON.stringify(TW.segSelect)};`
);
js = js.replace(
  '  const color = document.createElement("select");\n  for (const p of SUBJECT_PALETTE)',
  `  const color = document.createElement("select");\n  color.className = ${JSON.stringify(TW.subjColor)};\n  for (const p of SUBJECT_PALETTE)`
);
js = js.replace(
  '  const dot = elem("span", "seg-dot");\n  dot.style.background = resolveColor(subject.color);',
  `  const dot = elem("span", ${JSON.stringify(TW.subjDot)});\n  dot.style.background = resolveColor(subject.color);`
);
js = js.split('const dot = elem("span", "seg-dot");').join(`const dot = elem("span", ${JSON.stringify(TW.segDot)});`);

/* 시안 설정 화면의 '+ 과목 추가'를 입력란으로 연결한다 */
js = js.replace(
  'document.getElementById("add-subject").addEventListener("click", addSubjectFromInput);',
  'document.getElementById("add-subject").addEventListener("click", addSubjectFromInput);\n' +
    'document.getElementById("add-subject-focus").addEventListener("click", () => st.newSubject.focus());'
);

if (js.includes('"seg-dot"') || js.includes('"bar-col"') || js.includes('"empty-note"')) {
  throw new Error("남은 예전 클래스 문자열이 있습니다");
}

/* --- Tailwind 빌드 ---
   시안 config를 v2_head.html에서 직접 뽑아 쓴다. 손으로 옮겨 적으면 어긋난다.
   content에 잡힌 파일만 스캔하므로, 클래스를 새로 쓰는 곳은 반드시 여기 있어야 한다. */
function buildCss() {
  const GEN = path.join(DIR, ".gen");
  const head0 = fs.readFileSync(path.join(DIR, "v2_head.html"), "utf8");
  const KEY = '<script id="tailwind-config">tailwind.config=';
  const i0 = head0.indexOf(KEY);
  if (i0 < 0) throw new Error("tailwind.config를 찾지 못했습니다");
  const i1 = head0.indexOf("</script>", i0);

  // 키가 따옴표 없는 자바스크립트 객체 리터럴이라 JSON.parse로는 못 읽는다
  const config = new Function("return (" + head0.slice(i0 + KEY.length, i1) + ");")();
  config.content = [
    path.join(DIR, "v2_head.html"),
    path.join(DIR, "v2_body.html"),
    path.join(DIR, "v2_build.js"),
  ];

  fs.mkdirSync(GEN, { recursive: true });
  fs.writeFileSync(path.join(GEN, "tailwind.config.js"), "module.exports = " + JSON.stringify(config, null, 2) + ";\n");
  fs.writeFileSync(path.join(GEN, "input.css"), "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");

  // npx.cmd는 셸을 타야 해서 윈도우에서 EINVAL이 난다. CLI를 노드로 직접 부른다
  execFileSync(
    process.execPath,
    [
      path.join(DIR, "..", "tw", "node_modules", "tailwindcss", "lib", "cli.js"),
      "-c", path.join(GEN, "tailwind.config.js"),
      "-i", path.join(GEN, "input.css"),
      "-o", path.join(GEN, "out.css"),
      "--minify",
    ],
    { cwd: path.join(DIR, "..", "tw"), stdio: "inherit" }
  );
  return fs.readFileSync(path.join(GEN, "out.css"), "utf8").trim();
}

/* --- 조립 --- */
let head = fs.readFileSync(path.join(DIR, "v2_head.html"), "utf8")
  .replace("/*DARK*/", require("./mkdark.js")());

/* 오프라인 — 바깥으로 나가는 요청을 하나도 남기지 않는다.
   1) Tailwind CDN + config 스크립트 → 로컬에서 빌드한 CSS를 그대로 박는다
   2) 웹폰트 링크 → 제거. 아이콘은 SVG로 바꿨고, 한글은 시스템 폰트로 떨어진다 */
const css = buildCss();
const cdn = head.indexOf('<script src="https://cdn.tailwindcss.com">');
const cfgEnd = head.indexOf("</script>", head.indexOf('<script id="tailwind-config">')) + "</script>".length;
if (cdn < 0 || cfgEnd < cdn) throw new Error("Tailwind 스크립트 자리를 찾지 못했습니다");
head =
  head.slice(0, cdn) +
  "<!-- Tailwind — 시안의 tailwind.config로 로컬 빌드해 박아 넣었다. 외부 요청 없음 -->\n" +
  "<style>" + css + "</style>" +
  head.slice(cfgEnd);

head = head.replace(/^<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/gm, "");
head = head.replace(/^<link href="https:\/\/cdn\.jsdelivr\.net[^>]*>\n?/gm, "");
// 주석 속 URL은 요청을 만들지 않는다. 실제로 네트워크를 타는 형태만 본다
const FETCHES = /(?:href|src)\s*=\s*["']https?:|url\(\s*["']?https?:/i;
if (FETCHES.test(head)) throw new Error("head에 남은 외부 요청이 있습니다");

const body = require("./v2_icons.js")(fs.readFileSync(path.join(DIR, "v2_body.html"), "utf8"));
if (body.includes("material-symbols-outlined")) throw new Error("아이콘 폰트 참조가 남았습니다");

fs.writeFileSync(
  path.join(DIR, "..", "..", "PureStudy.html"),
  head + "\n" + body + "\n<script>" + js + "</script>\n\n</body>\n</html>\n"
);
console.log("완료");
