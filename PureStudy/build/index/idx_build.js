/* index.html 재조립 — stitch_/code.html 마크업을 그대로 쓰되 오프라인으로 만든다.
   1) Tailwind CDN + config → 그 config로 로컬 빌드한 CSS를 인라인
   2) 웹폰트 링크 제거, 아이콘은 인라인 SVG로
   외부 요청을 하나도 남기지 않는다. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DIR = __dirname;
const TW = path.join(DIR, ".gen");           // 빌드 중간 산출물 (매번 재생성)

/* --- 시안 config를 head에서 직접 뽑아 빌드 설정으로 쓴다 --- */
let head = fs.readFileSync(path.join(DIR, "idx_head.html"), "utf8");
const m = head.match(/<script id="tailwind-config">tailwind\.config=([\s\S]*?)<\/script>/);
if (!m) throw new Error("tailwind.config를 찾지 못했습니다");

// 키가 따옴표 없는 자바스크립트 객체 리터럴이라 JSON.parse로는 못 읽는다
const config = new Function("return (" + m[1] + ");")();
config.content = [path.join(DIR, "idx_head.html"), path.join(DIR, "idx_body.html")];

fs.mkdirSync(TW, { recursive: true });
fs.writeFileSync(path.join(TW, "tailwind.config.js"), "module.exports = " + JSON.stringify(config, null, 2) + ";\n");
fs.writeFileSync(path.join(TW, "input.css"), "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");

// npx.cmd는 셸을 타야 해서 윈도우에서 EINVAL이 난다. CLI를 노드로 직접 부른다
execFileSync(
  process.execPath,
  [
    path.join(DIR, "..", "tw", "node_modules", "tailwindcss", "lib", "cli.js"),
    "-c", path.join(TW, "tailwind.config.js"),
    "-i", path.join(TW, "input.css"),
    "-o", path.join(TW, "out.css"),
    "--minify",
  ],
  { cwd: path.join(DIR, "..", "tw"), stdio: "inherit" }
);

/* --- CDN 스크립트 두 개를 빌드된 CSS로 갈아끼운다 --- */
const css = fs.readFileSync(path.join(TW, "out.css"), "utf8").trim();
const cdn = head.indexOf('<script src="https://cdn.tailwindcss.com">');
const cfgEnd = head.indexOf("</script>", head.indexOf('<script id="tailwind-config">')) + "</script>".length;
if (cdn < 0 || cfgEnd < cdn) throw new Error("Tailwind 스크립트 자리를 찾지 못했습니다");
head =
  head.slice(0, cdn) +
  "<!-- Tailwind — 시안의 tailwind.config로 로컬 빌드해 박아 넣었다. 외부 요청 없음 -->\n" +
  "<style>" + css + "</style>" +
  head.slice(cfgEnd);

head = head.replace(/^<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/gm, "");

// 주석 속 URL은 요청을 만들지 않는다. 실제로 네트워크를 타는 형태만 본다
const FETCHES = /(?:href|src)\s*=\s*["']https?:|url\(\s*["']?https?:/i;
if (FETCHES.test(head)) throw new Error("head에 남은 외부 요청이 있습니다");

const body = require("./idx_icons.js")(fs.readFileSync(path.join(DIR, "idx_body.html"), "utf8"));
if (body.includes("material-symbols-outlined")) throw new Error("아이콘 폰트 참조가 남았습니다");
if (FETCHES.test(body)) throw new Error("body에 남은 외부 요청이 있습니다");

fs.writeFileSync(path.join(DIR, "..", "..", "index.html"), head + "\n" + body);
console.log("완료");
