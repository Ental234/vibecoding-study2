# build — 산출물을 만드는 곳

`index.html`과 `PureStudy.html`은 **직접 고치지 마세요.** 둘 다 여기서 생성되는 산출물이라
다음 빌드에 통째로 덮어써집니다.

두 파일 모두 Tailwind를 로컬에서 빌드해 CSS를 인라인하고, 아이콘 폰트를 SVG로 바꾼 결과입니다.
그래서 완성본은 **외부 네트워크 요청이 0개**입니다. 오프라인에서 그대로 열립니다.

## 고치는 곳

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 랜딩 페이지 내용·레이아웃 | `index/idx_body.html` |
| 랜딩 페이지 `<head>`·커스텀 CSS·Tailwind 토큰 | `index/idx_head.html` |
| 타이머 앱 화면 | `app/v2_body.html` |
| 타이머 앱 `<head>`·다크 팔레트 | `app/v2_head.html`, `app/mkdark.js` |

## 빌드

프로젝트 루트에서:

```
node build/index/idx_build.js     # → index.html
node build/app/v2_build.js        # → PureStudy.html
```

`npm install` 필요 없습니다. `tw/node_modules`에 Tailwind가 들어 있습니다.
지웠다면 `cd build/tw && npm install`로 복원됩니다.

## 폴더

```
index/   랜딩 페이지 소스
  idx_head.html   시안 head + tailwind.config + 커스텀 스타일
  idx_body.html   마크업
  idx_build.js    조립 · Tailwind 빌드 · CDN 인라인화 · 검증
  idx_icons.js    Material Symbols 이름 → 인라인 SVG
  .gen/           빌드 중간 산출물 (자동 생성, 지워도 됨)

app/     타이머 앱 소스
  v2_head.html    head + tailwind.config + 러너 애니메이션 + rounded-DEFAULT 보정
  v2_body.html    마크업
  v2_build.js     PureStudy.backup.html에서 앱 JS를 떼어내 재조립
  v2_icons.js     아이콘 → SVG
  mkdark.js       다크 규칙 생성 (명시 선택 / 시스템 두 벌을 같은 정의에서)
  preview.js      시드 데이터를 주입한 미리보기 HTML 생성 (개발용)
  seed.js         가짜 학습 기록
  .gen/           빌드 중간 산출물

tw/      Tailwind CLI + 의존성
```

## 주의

- **앱 로직은 `PureStudy.backup.html`에 있습니다.** `v2_build.js`가 그 파일에서 `<script>` 본문을
  떼어내 재사용합니다. 지우면 `PureStudy.html`을 다시 만들 수 없습니다.
- **Tailwind는 `content`에 등록된 파일만 스캔합니다.** 클래스를 새로 쓰면 반드시 위 소스 파일 안이어야
  합니다. 다른 곳에 쓰면 CSS가 조용히 빠진 채 빌드됩니다.
- **`index.html`은 같은 폴더의 `v2_awv-928ef7c622ca02ac.mp4`를 참조합니다.** 히어로 배경 영상입니다.
  옮길 때 같이 옮기세요.
- 빌드 스크립트에 검증 가드가 들어 있습니다. 외부 요청(`href`/`src`가 `http`)이나 남은 아이콘 폰트
  참조가 있으면 빌드가 실패합니다.
