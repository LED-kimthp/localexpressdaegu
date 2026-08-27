// Reads `over39_ai_runs` and answers one question: is it safe to widen the distribution?
//
// A rate-limited or failed AI call is invisible to the participant - the follow-up simply
// never appears, or the summary quietly falls back to "write it yourself". At five people
// that is nothing; at two thousand it is a few hundred records that came out thinner than
// they should have, and nobody can be asked again. So the failure has to be counted rather
// than noticed. These are counts over completed runs, not a live health check.

export const OPERATIONS = ["anchor_followup", "summarize_adaptive"];

// Chosen to be readable rather than clever: a launch is widened when almost everyone got the
// AI they were supposed to get. `warn` is "look before widening", `stop` is "do not widen".
export const THRESHOLDS = {
  anchor_followup: { warn: 0.1, stop: 0.2 },
  summarize_adaptive: { warn: 0.05, stop: 0.12 },
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
export function aiHealthSummary(runs = []) {
  const rows = Array.isArray(runs) ? runs : [];
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

    const bucket = operations[row?.operation];
    if (!bucket) continue;
    bucket.total += 1;
    if (isRateLimited) bucket.rateLimited += 1;
    if (Number.isFinite(attempts) && attempts > 1) bucket.retried += 1;
    if (Number.isFinite(row?.latency_ms)) bucket.latencies.push(row.latency_ms);
    if (row?.status !== "success") bucket.failed += 1;
    else if (row?.source && row.source !== "motif") bucket.degraded += 1;
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

  const rateLimitedRate = ratio(rateLimited, rows.length);
  const grades = [
    ...OPERATIONS.map((name) => byOperation[name].grade),
    rows.length ? gradeFor("rate_limited", rateLimitedRate) : "unknown",
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
