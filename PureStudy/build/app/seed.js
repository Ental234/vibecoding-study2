// 미리보기용 가짜 데이터 — 실제 파일에는 넣지 않는다
(function () {
  const SUBJ = [
    { id: "s1", name: "국어", color: "--subj-7", order: 0, archived: false },
    { id: "s2", name: "수학", color: "--subj-6", order: 1, archived: false },
    { id: "s3", name: "영어", color: "--subj-3", order: 2, archived: false },
    { id: "s4", name: "과학", color: "--subj-2", order: 3, archived: false },
  ];
  localStorage.setItem("study:subjects", JSON.stringify(SUBJ));
  localStorage.setItem("study:settings", JSON.stringify({
    dayBoundaryHour: 5, pauseTimeoutMin: 30, theme: "light",
    lastBackupAt: null, version: 1,
  }));

  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = new Date();
  const firstKey = keyOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 20));
  localStorage.setItem("study:goal", JSON.stringify([
    { targetMinutes: 480, effectiveFrom: firstKey },
  ]));

  // 최근 9일치. 요일마다 다른 양, 오늘은 목표의 45% 언저리
  const plan = [7.2, 5.4, 6.4, 4.6, 8.6, 5.2, 6.9, 3.9, 3.6];
  const segs = [];
  for (let back = 8; back >= 0; back--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const hours = plan[back];
    if (hours === 0) continue;
    const key = keyOf(day);
    let cursor = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0, 0).getTime();
    let left = hours * 3600000;
    let i = 0;
    while (left > 60000) {
      const chunk = Math.min(left, (45 + (i % 3) * 15) * 60000);
      segs.push({
        id: `g${back}-${i}`, sessionId: `sess${back}`,
        subjectId: SUBJ[(back + i) % SUBJ.length].id,
        kind: "study", startedAt: cursor, endedAt: cursor + chunk, studyDate: key,
      });
      cursor += chunk;
      left -= chunk;
      const rest = 15 * 60000;
      segs.push({
        id: `p${back}-${i}`, sessionId: `sess${back}`, subjectId: null,
        kind: "pause", startedAt: cursor, endedAt: cursor + rest, studyDate: key,
      });
      cursor += rest;
      i++;
    }
  }
  localStorage.setItem("study:segments", JSON.stringify(segs));
})();
