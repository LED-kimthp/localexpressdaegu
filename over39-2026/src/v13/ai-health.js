import { isLiveModelSource } from "./depth.js?v=v7-20260924-r84";
// Reads `over39_ai_runs` and answers one question: is it safe to widen the distribution?
//
// A rate-limited or failed AI call is invisible to the participant - the follow-up simply
// never appears, or the summary quietly falls back to "write it yourself". At five people
// that is nothing; at two thousand it is a few hundred records that came out thinner than
// they should have, and nobody can be asked again. So the failure has to be counted rather
// than noticed. These are counts over completed runs, not a live health check.

// 참여자가 받아야 하는 것 셋. 이 화면이 답해야 하는 물음은 하나다 —
// **실제 참여자가 받아야 할 것을 받았는가.**
export const OPERATIONS = ["anchor_followup", "summarize_adaptive", "closing_offer"];

export const OPERATION_LABEL = {
  anchor_followup: "이어 묻는 질문",
  summarize_adaptive: "참여 기록 정리",
  closing_offer: "마지막 제안",
};

// 실행 기록의 operation 은 「anchor_followup:P13_TEXT」, 「summarize_adaptive:axes」처럼 뒤에
// 꼬리가 붙어 저장된다. 예전에는 꼬리 없는 이름만 표에 세어서, 꼬리 붙은 것들이 표에서 통째로
// 빠졌다 — 표의 분모와 위의 「AI 호출」 수가 서로 달랐다(2026-09-23).
export function baseOperation(name) {
  const value = String(name || "").split(":")[0];
  return OPERATIONS.includes(value) ? value : "";
}

// 「문장 다듬기」(r73~). 참여자가 「다음」을 누를 때 서술 칸마다 부르고(칸당 최대 5번), 실패해도
// 참여자가 쓴 글 그대로 넘어간다 — 「받아야 할 것을 못 받은」 사람이 생기지 않는다. 그래서 위 셋과
// 같은 판정에 넣지 않고, 호출 수·한도 초과·오류 코드 합계에서도 뺀다. 섞으면 1인당 호출이 몇 배로
// 부풀고, 다듬기의 한도 초과가 질문·정리의 판정을 움직인다. 따로 센다.
export const POLISH_OPERATION = "polish_text";
export const POLISH_LABEL = "문장 다듬기";
export const isPolishRun = (row) => String(row?.operation || "").split(":")[0] === POLISH_OPERATION;
// 고칠 곳이 없던 것은 실패가 아니다(text-polish.js 의 POLISH_NO_CHANGE).
const POLISH_NOT_A_FAILURE = new Set(["POLISH_NO_CHANGE"]);

export function polishSummary(rows = []) {
  const people = new Set();
  const errorCodes = new Map();
  const latencies = [];
  let succeeded = 0;
  let noChange = 0;
  let failed = 0;
  for (const row of rows) {
    if (row?.response_id) people.add(row.response_id);
    if (Number.isFinite(row?.latency_ms)) latencies.push(row.latency_ms);
    const code = String(row?.error_code || "");
    if (POLISH_NOT_A_FAILURE.has(code)) noChange += 1;
    else if (row?.status === "success") succeeded += 1;
    else failed += 1;
    if (code && !POLISH_NOT_A_FAILURE.has(code)) errorCodes.set(code, (errorCodes.get(code) || 0) + 1);
  }
  const sorted = latencies.sort((a, b) => a - b);
  return {
    runs: rows.length,
    participants: people.size,
    succeeded,
    noChange,
    failed,
    latencyP50: percentile(sorted, 0.5),
    errorCodes: [...errorCodes.entries()].sort((a, b) => b[1] - a[1]).map(([errorCode, count]) => ({ code: errorCode, count })),
  };
}

// 표본을 가른다. 테스트는 우리가 확인하며 만든 것이라 참여자의 경험이 아니다.
export function sampleTypeIndex(sessions = []) {
  const index = new Map();
  for (const row of Array.isArray(sessions) ? sessions : []) {
    if (row?.response_id) index.set(row.response_id, row.sample_type || "test");
  }
  return index;
}

// Chosen to be readable rather than clever: a launch is widened when almost everyone got the
// AI they were supposed to get. `warn` is "look before widening", `stop` is "do not widen".
export const THRESHOLDS = {
  anchor_followup: { warn: 0.1, stop: 0.2 },
  summarize_adaptive: { warn: 0.05, stop: 0.12 },
  closing_offer: { warn: 0.1, stop: 0.25 },
  rate_limited: { warn: 0.02, stop: 0.08 },
};

function percentile(sorted, fraction) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index];
}

function ratio(part, whole) {
  return whole > 0 ? part / whole : 0;
}

function gradeFor(key, value) {
  const limits = THRESHOLDS[key];
  if (!limits) return "ok";
  if (value >= limits.stop) return "stop";
  if (value >= limits.warn) return "warn";
  return "ok";
}

function emptyOperation() {
  return { total: 0, delivered: 0, degraded: 0, failed: 0, rateLimited: 0, retried: 0, latencies: [] };
}

/**
 * @param {Array<object>} runs rows from `over39_ai_runs`
 * @returns aggregate counts plus a widen/hold verdict
 */
export function aiHealthSummary(runs = [], { sampleTypes = null, sampleType = "" } = {}) {
  const all = Array.isArray(runs) ? runs : [];
  // 표본을 고르면 그 표본의 응답만 센다. 표본을 알 수 없는 실행(참여 기록 목록 밖의 옛 응답)은
  // 「연구」로 셈해 놓고 없는 셈 치지 않는다 — 빠뜨리는 쪽이 더 나쁘다.
  const sampled = sampleType && sampleTypes
    ? all.filter((row) => (sampleTypes.get(row?.response_id) || "research") === sampleType)
    : all;
  // 문장 다듬기는 따로 센다(위 POLISH_OPERATION 설명). 아래의 모든 합계는 다듬기를 뺀 것이다.
  const polishRows = sampled.filter(isPolishRun);
  const rows = sampled.filter((row) => !isPolishRun(row));
  const participants = new Set();
  const errorCodes = new Map();
  const operations = Object.fromEntries(OPERATIONS.map((name) => [name, emptyOperation()]));
  let rateLimited = 0;
  let retried = 0;

  for (const row of rows) {
    if (row?.response_id) participants.add(row.response_id);
    const isRateLimited = row?.http_status === 429 || /_HTTP_429$/.test(String(row?.error_code || ""));
    if (isRateLimited) rateLimited += 1;
    // `upstream_attempts` only exists on runs logged after the retry shipped; older rows
    // simply do not count as retried rather than being treated as missing data.
    const attempts = Number(row?.output_raw?.upstream_attempts ?? 1);
    if (Number.isFinite(attempts) && attempts > 1) retried += 1;
    if (row?.error_code) errorCodes.set(row.error_code, (errorCodes.get(row.error_code) || 0) + 1);

    const bucket = operations[baseOperation(row?.operation)];
    if (!bucket) continue;
    bucket.total += 1;
    if (isRateLimited) bucket.rateLimited += 1;
    if (Number.isFinite(attempts) && attempts > 1) bucket.retried += 1;
    if (Number.isFinite(row?.latency_ms)) bucket.latencies.push(row.latency_ms);
    if (row?.status !== "success") bucket.failed += 1;
    // 「motif가 아니면 성능 저하」는 제공자를 하나로 가정한 계산이었다. 두 번째
    // 제공자가 받아낸 응답은 저하가 아니라 정상 배달이다 — 인계 사실은 fallback_reason에
    // 따로 남으므로 여기서 저하로 세면 같은 사건을 두 번 세게 된다.
    else if (row?.source && !isLiveModelSource(row.source)) bucket.degraded += 1;
    else bucket.delivered += 1;
  }

  const byOperation = {};
  for (const name of OPERATIONS) {
    const bucket = operations[name];
    const sorted = [...bucket.latencies].sort((a, b) => a - b);
    // Degraded and failed are both "the participant did not get the AI they should have".
    const missRate = ratio(bucket.degraded + bucket.failed, bucket.total);
    byOperation[name] = {
      total: bucket.total,
      delivered: bucket.delivered,
      degraded: bucket.degraded,
      failed: bucket.failed,
      rateLimited: bucket.rateLimited,
      retried: bucket.retried,
      missRate,
      grade: bucket.total ? gradeFor(name, missRate) : "unknown",
      latencyP50: percentile(sorted, 0.5),
      latencyP95: percentile(sorted, 0.95),
    };
  }

  // 사람 수로도 센다. 「호출 398회 중 147회 실패」보다 「13명 중 3명이 못 받음」이 판단하기 쉽다.
  const peopleMissing = {};
  for (const name of OPERATIONS) peopleMissing[name] = { expected: new Set(), missed: new Set() };
  for (const row of rows) {
    const name = baseOperation(row?.operation);
    if (!name || !row?.response_id) continue;
    peopleMissing[name].expected.add(row.response_id);
    const delivered = row?.status === "success" && (!row?.source || isLiveModelSource(row.source));
    if (!delivered) peopleMissing[name].missed.add(row.response_id);
  }
  // 한 사람이 같은 단계를 여러 번 부를 수 있다. 한 번이라도 받았으면 받은 것으로 센다.
  for (const name of OPERATIONS) {
    for (const row of rows) {
      if (baseOperation(row?.operation) !== name || !row?.response_id) continue;
      const delivered = row?.status === "success" && (!row?.source || isLiveModelSource(row.source));
      if (delivered) peopleMissing[name].missed.delete(row.response_id);
    }
    byOperation[name].peopleExpected = peopleMissing[name].expected.size;
    byOperation[name].peopleMissed = peopleMissing[name].missed.size;
  }

  const rateLimitedRate = ratio(rateLimited, rows.length);
  // 정리문이 한 번도 안 돌았다면 아무도 끝까지 가지 않은 것이므로 판단할 수 없다 — 그 규칙은
  // 그대로 둔다. 다른 단계는 부른 적이 있을 때만 판정에 넣는다. 제안문을 표에 넣은 뒤
  // (2026-09-23) 제안문이 없던 옛 회차가 통째로 「자료 부족」이 되어 나머지를 덮었다.
  const grades = [
    byOperation.summarize_adaptive.grade,
    ...OPERATIONS.filter((name) => name !== "summarize_adaptive")
      .map((name) => byOperation[name].grade)
      .filter((grade) => grade !== "unknown"),
    ...(rows.length ? [gradeFor("rate_limited", rateLimitedRate)] : []),
  ];

  return {
    runs: rows.length,
    participants: participants.size,
    callsPerParticipant: participants.size ? rows.length / participants.size : 0,
    rateLimited,
    rateLimitedRate,
    rateLimitedGrade: rows.length ? gradeFor("rate_limited", rateLimitedRate) : "unknown",
    retried,
    byOperation,
    polish: polishSummary(polishRows),
    errorCodes: [...errorCodes.entries()].sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, count })),
    verdict: grades.includes("stop") ? "stop" : grades.includes("warn") ? "warn" : grades.includes("unknown") ? "unknown" : "ok",
  };
}

export const VERDICT_COPY = {
  ok: "확대 가능 — 지금까지의 응답에서 AI가 정상 작동했어요.",
  warn: "확대 전 확인 필요 — 일부 참여자가 받아야 할 질문이나 정리를 받지 못했어요.",
  stop: "확대 보류 — 실패가 이미 눈에 띄는 비율이에요. 원인을 먼저 확인해 주세요.",
  unknown: "판단할 응답이 아직 부족해요.",
};
