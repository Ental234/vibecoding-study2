// 미리보기 생성기: 시드 주입 → 탭별 스크린샷
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "..", "PureStudy.html");
const DIR = __dirname;
const seed = fs.readFileSync(path.join(DIR, "seed.js"), "utf8");

const tab = process.argv[2] || "timer";
const extra = process.argv[3] || "";

let html = fs.readFileSync(SRC, "utf8");
html = html.replace('<script>\n"use strict";', `<script>${seed}</script>\n<script>\n"use strict";`);
html = html.replace("boot();", `boot();\nshowTab(${JSON.stringify(tab)});\n${extra}`);

const outDir = path.join(DIR, ".gen");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `preview_${tab}.html`);
fs.writeFileSync(out, html);
console.log(out);
