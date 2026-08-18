# vibecoding-study2

바이브 코딩으로 만들어 본 것들을 한 저장소에 모아둔 아카이브입니다.

## 시작점

`Intro/index.html` 을 브라우저로 열면 됩니다. ENTER → 프로젝트 목록 → 각 프로젝트로 이어집니다.

```
Intro/index.html  →  Intro/projects.html  ─┬→  PureStudy/index.html
                                           ├→  FoodReview/index.html
                                           └→  weathersite/index.html
```

전부 정적 HTML이라 서버 없이 파일을 그대로 열어도 동작합니다.

## 프로젝트

| 폴더 | 이름 | 내용 |
|---|---|---|
| `Intro/` | Project Hub | 아카이브 인트로 + 프로젝트 카드 목록. GSAP 기반 등장·자석 버튼·카드 3D 기울기. |
| `PureStudy/` | 순공 | 켜두면 오늘의 순수 공부시간이 쌓이는 브라우저 타이머. localStorage 저장. |
| `FoodReview/` | FoodReview | 다녀온 맛집을 별점 한 줄로 남기는 리뷰 서비스. 현재는 랜딩 페이지 목업 단계. |
| `weathersite/` | 지금, 그곳 | 세계 랜드마크를 지도에서 고르면 그곳의 현재 날씨를 보여주고, 날씨와 낮·밤에 맞춰 배경이 바뀝니다. Leaflet + Open-Meteo, 인터넷 연결 필요. |

각 폴더의 `PRD.md` / `DESIGN.md` 에 기획과 디자인 규칙이 정리되어 있습니다.

## 프로젝트를 추가하려면

`Intro/projects.html` 의 `projects` 배열에 항목 하나만 추가하면 카드가 자동으로 늘어납니다.

```js
{
  id: "project-03",
  title: "프로젝트 제목",
  description: "한두 줄 설명.",
  thumbnail: "",                    // 없으면 빈 문자열 — 대체 블록이 그려집니다
  url: "../폴더명/index.html",
  tags: ["태그1", "태그2"]
}
```
