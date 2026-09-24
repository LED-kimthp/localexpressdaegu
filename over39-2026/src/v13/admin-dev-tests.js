// 개발 과정 시험 기록(TK 2026-09-24). 개발하면서 서버와 화면을 시험하느라 만든 응답을 한곳에 둔다 —
// 나중에 「개발하면서 응답을 이렇게 시험했다」는 보고서를 쓸 때의 근거다.
//
// 자동 시험은 시험이 끝난 뒤 정리해서 DB 에는 없다. 무엇을 만들고 확인했는지는 시험 장부에 남아 있고
// (원드라이브 15_만39세이상/20_리서치·설문·작가선정/97_앱_참고자료_아카이브/results-2026-08/), 장부는 브라우저가
// 읽을 수 없어 여기에 옮겨 적는다. 남은 건수는 지금 목록에서 센다.

const text = (value) => String(value ?? "").trim();

const abc = (run) => ["A", "B", "C"].map((part) => `${run}_${part}`);

export const DEV_TEST_LEDGER_PLACE = "원드라이브 15_만39세이상/20_리서치·설문·작가선정/97_앱_참고자료_아카이브/results-2026-08/";

// started_at 은 장부의 시작 시각(UTC). 화면에는 한국 시각으로 보인다.
export const DEV_TEST_RUNS = Object.freeze([
  {
    id: "QA_STAGE2_20260814",
    startedAt: "2026-08-14T06:25:40.004Z",
    title: "Stage 2 · 실제 서버에 저장하고 되읽기",
    checked: ["설문 응답을 실제 서버에 저장하고 다시 읽기", "AI 이어지는 질문 3번(Motif)", "공모 신청 PDF 비공개 보관과 10분 링크", "A → B → C 안부 잇기"],
    responseIds: abc("QA_STAGE2_20260814"),
    extra: "공모 신청 시험 1건",
    result: "통과",
    ledger: "STAGE2_QA_LEDGER_QA_STAGE2_20260814.json",
  },
  {
    id: "QA_STAGE2_20260814_P0",
    startedAt: "2026-08-14T07:09:34.147Z",
    title: "Stage 2 · 안부와 접근의 경계",
    checked: ["두 사람이 한 안부를 동시에 받으려 할 때 한 사람만", "넘기기와 알림 설정", "보낸 사람 표기(이름·역할·익명)", "서로 차단한 두 사람", "같은 사람의 반복 참여", "잘못된 열쇠·다른 사람의 열쇠", "익명 응답의 이름·연락처", "소개 경로", "공모 신청 오류 6가지"],
    responseIds: ["RACE_A", "RACE_B", "RACE_C", "NAMED_S", "NAMED_R", "CONTEXT_S", "CONTEXT_R", "ANON_S", "ANON_R", "BLOCK_S", "BLOCK_R", "REPEAT_A", "REPEAT_B"].map((part) => `QA_STAGE2_20260814_${part}`),
    result: "통과",
    ledger: "STAGE2_P0_QA_QA_STAGE2_20260814_P0.json",
  },
  {
    id: "QA_TASK9_20260818_1787042094706",
    startedAt: "2026-08-18T08:34:54.708Z",
    title: "Task 9 · 실제 저장과 연락처 분리 (1차)",
    checked: ["연구 DB 저장과 되읽기", "「나중에 연락」 연락처를 따로 보관"],
    responseIds: abc("QA_TASK9_20260818_1787042094706"),
    result: "멈춤 — 안부를 신청하기 전에도 받을 사람으로 정해지는 것을 찾음. 고친 뒤 다시 시험",
    ledger: "TASK9_LIVE_QA_QA_TASK9_20260818_1787042094706.json",
  },
  {
    id: "QA_TASK9_20260818_1787042145459",
    startedAt: "2026-08-18T08:35:45.460Z",
    title: "Task 9 · 실제 저장과 연락처 분리 (2차)",
    checked: ["연구 DB 저장과 되읽기", "「나중에 연락」 연락처를 따로 보관", "먼저 받고 나서 남기는 안부"],
    responseIds: abc("QA_TASK9_20260818_1787042145459"),
    result: "멈춤 — AI 이어지는 질문 기록에 어느 문항에서 물었는지가 빠진 것을 찾음. 고친 뒤 다시 시험",
    ledger: "TASK9_LIVE_QA_QA_TASK9_20260818_1787042145459.json",
  },
  {
    id: "QA_TASK9_20260818_YPHBVDRL",
    startedAt: "2026-08-18T08:36:36.374Z",
    title: "Task 9 · 실제 저장과 연락처 분리 (3차)",
    checked: ["연구 DB 저장과 되읽기", "「나중에 연락」 연락처를 따로 보관", "먼저 받고 나서 남기는 안부", "AI 에 보내는 글에서 연락처 빼기", "공개 수집이 꺼져 있는지"],
    responseIds: abc("QA_TASK9_20260818_YPHBVDRL"),
    result: "통과",
    ledger: "TASK9_LIVE_QA_QA_TASK9_20260818_YPHBVDRL.json",
  },
  {
    id: "QA_TASK9_20260818_MGMEHEBJ",
    startedAt: "2026-08-24T04:49:34.336Z",
    title: "Task 9 · 다시 시험",
    checked: ["연구 DB 저장과 되읽기", "「나중에 연락」 연락처를 따로 보관", "먼저 받고 나서 남기는 안부", "AI 에 보내는 글에서 연락처 빼기", "공개 수집이 꺼져 있는지"],
    responseIds: abc("QA_TASK9_20260818_MGMEHEBJ"),
    result: "통과",
    ledger: "TASK9_LIVE_QA_QA_TASK9_20260818_MGMEHEBJ.json",
  },
]);

export const koreaTime = (iso) => {
  const time = Date.parse(text(iso));
  if (!Number.isFinite(time)) return "";
  return new Date(time + 9 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
};

/**
 * 자동 시험 합계와, 지금 DB 에 남아 있는 테스트 표본. sessions 는 관리자 목록이 받은 세션 행이다.
 */
export function devTestSummary(sessions = []) {
  const rows = Array.isArray(sessions) ? sessions : [];
  const present = new Set(rows.map((row) => text(row?.response_id)));
  const runs = DEV_TEST_RUNS.map((run) => {
    const remaining = run.responseIds.filter((id) => present.has(id));
    return { ...run, remaining, cleaned: run.responseIds.length - remaining.length };
  });
  const responses = runs.reduce((sum, run) => sum + run.responseIds.length, 0);
  const remaining = runs.reduce((sum, run) => sum + run.remaining.length, 0);
  const autoIds = new Set(runs.flatMap((run) => run.responseIds));

  // 지금 남아 있는 테스트 표본(자동 시험에서 남은 것 포함). 날짜는 처음 기록된 날(한국 시각).
  const tests = rows.filter((row) => text(row?.sample_type) === "test");
  const day = (row) => koreaTime(row?.first_seen_at || row?.updated_at).slice(0, 10);
  const byDay = new Map();
  for (const row of tests) {
    const key = day(row) || "날짜 미기록";
    const entry = byDay.get(key) || { date: key, total: 0, completed: 0 };
    entry.total += 1;
    if (text(row?.status) === "completed") entry.completed += 1;
    byDay.set(key, entry);
  }
  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    runs,
    totals: { runs: runs.length, responses, cleaned: responses - remaining, remaining, from: koreaTime(runs[0]?.startedAt).slice(0, 10), to: koreaTime(runs.at(-1)?.startedAt).slice(0, 10) },
    tests: {
      total: tests.length,
      completed: tests.filter((row) => text(row?.status) === "completed").length,
      fromAuto: tests.filter((row) => autoIds.has(text(row?.response_id))).length,
      first: days.find((item) => item.date !== "날짜 미기록")?.date || "",
      last: [...days].reverse().find((item) => item.date !== "날짜 미기록")?.date || "",
      days,
    },
    institutionReview: rows.filter((row) => text(row?.sample_type) === "institution_review").length,
  };
}
