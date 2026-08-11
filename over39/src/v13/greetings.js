const values = (value) => Array.isArray(value) ? value : value ? [value] : [];

export const GREETING_STATES = ["STORED", "WAITING_RECEIVER", "QUEUED", "EMAIL_PENDING", "DELIVERED", "OPENED", "REPLIED", "PASSED", "WITHDRAWN"];

export const GREETING_DIRECTIONS = {
  SIMILAR_CONDITIONS: "나와 비슷한 조건을 지나온 사람",
  ROLE_BRIDGE: "다른 역할에서 나의 기록을 읽는 사람",
  CONTINUING_OR_RESTARTING: "작업을 이어가거나 다시 시작한 사람",
  ACROSS_REGION_LANGUAGE: "다른 지역·언어권에서 비슷한 질문을 가진 사람",
};

const roleBridges = new Set([
  "G1:G3", "G1:G2", "G1:AUDIENCE", "G3:G1", "G2:G1", "AUDIENCE:G1",
  "G6:G1", "G7:G1", "G8:G1", "G1:G6", "G1:G7", "G1:G8",
]);

function axisNumber(code) { return Number(String(code || "").slice(1)) || null; }
function coordinates(profile) { return profile?.coordinate?.axes || profile?.coordinate_axes || {}; }
function samePair(left, right, pair) {
  const ids = [left.response_id, right.response_id].sort().join(":");
  return [pair.sender_record_id, pair.receiver_record_id].sort().join(":") === ids;
}

export function languageCompatibility(sender, receiver) {
  const senderLanguages = values(sender.languages).filter(Boolean);
  const receiverLanguages = values(receiver.languages).filter(Boolean);
  if (senderLanguages.some((language) => receiverLanguages.includes(language))) return { compatible: true, translated: false };
  return { compatible: Boolean(sender.translation_allowed && receiver.translation_allowed), translated: true };
}

export function hardGateGreetingCandidate(sender, receiver, { pairs = [], flags = [], now = Date.now(), recentDays = 180 } = {}) {
  const reasons = [];
  if (!sender?.response_id || !receiver?.response_id || sender.response_id === receiver.response_id) reasons.push("same_participant");
  if (!receiver?.receive_opt_in || !receiver?.opt_in) reasons.push("receiver_not_opted_in");
  if (sender?.withdrawn || receiver?.withdrawn) reasons.push("withdrawn");
  if (sender?.reported || receiver?.reported || sender?.blocked || receiver?.blocked) reasons.push("blocked_or_reported");
  if (flags.some((flag) => {
    if (flag.active === false) return false;
    const participants = [flag.source_record_id, flag.target_record_id];
    if (flag.action === "REPORTED") return participants.includes(sender.response_id) || participants.includes(receiver.response_id);
    return participants.includes(sender.response_id) && participants.includes(receiver.response_id);
  })) reasons.push("blocked_or_reported_pair");
  const recentThreshold = now - recentDays * 86400000;
  if (pairs.some((pair) => samePair(sender, receiver, pair) && new Date(pair.created_at || 0).getTime() >= recentThreshold && pair.status !== "WITHDRAWN")) reasons.push("recent_or_repeat_pair");
  if (!languageCompatibility(sender, receiver).compatible) reasons.push("language_incompatible");
  return { allowed: reasons.length === 0, reasons };
}

export function scoreGreetingCandidate(sender, receiver) {
  let score = 0;
  const evidence = [];
  const left = coordinates(sender);
  const right = coordinates(receiver);
  const sameAxes = ["m", "s", "d"].filter((axis) => left[axis]?.code && left[axis].code === right[axis]?.code);
  const adjacentAxes = ["m", "s", "d"].filter((axis) => {
    const a = axisNumber(left[axis]?.code); const b = axisNumber(right[axis]?.code);
    return a && b && Math.abs(a - b) === 1;
  });
  if (sameAxes.length) { score += sameAxes.length * 14; evidence.push(`${sameAxes.length}개의 방향이 가깝습니다`); }
  if (adjacentAxes.length) { score += adjacentAxes.length * 6; evidence.push(`${adjacentAxes.length}개의 방향이 이웃합니다`); }
  if (roleBridges.has(`${sender.role_group}:${receiver.role_group}`)) { score += 18; evidence.push("서로 다른 역할의 관점이 이어집니다"); }
  const preference = receiver.greeting_connection_preference || sender.greeting_connection_preference;
  if (preference === "SIMILAR_CONDITIONS" && sameAxes.length) score += 16;
  if (preference === "ROLE_BRIDGE" && sender.role_group !== receiver.role_group) score += 16;
  if (preference === "CONTINUING_OR_RESTARTING" && ["S2", "S3"].includes(right.s?.code)) score += 16;
  const language = languageCompatibility(sender, receiver);
  if (!language.translated) score += 8;
  else if (preference === "ACROSS_REGION_LANGUAGE") score += 14;
  if (sender.region && receiver.region && sender.region !== receiver.region) score += 4;
  return { score, evidence: evidence.slice(0, 2), translated: language.translated };
}

export function curatedGreetingCandidates(sender, candidates, context = {}) {
  return candidates.map((receiver) => ({ receiver, gate: hardGateGreetingCandidate(sender, receiver, context) }))
    .filter((item) => item.gate.allowed)
    .map((item) => ({ ...item, relevance: scoreGreetingCandidate(sender, item.receiver) }))
    .filter((item) => item.relevance.score > 0)
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, 5);
}

export function controlledWeightedSelection(shortlist, random = Math.random) {
  if (!shortlist.length) return null;
  const floor = Math.max(1, shortlist.at(-1).relevance.score);
  const weights = shortlist.map((item) => Math.max(1, item.relevance.score - floor + 3));
  let cursor = random() * weights.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < shortlist.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return shortlist[index];
  }
  return shortlist.at(-1);
}

export function connectionReasonSnapshot(sender, receiver, relevance) {
  const directions = ["m", "s", "d"].flatMap((axis) => {
    const left = coordinates(sender)[axis]; const right = coordinates(receiver)[axis];
    return left?.code && left.code === right?.code ? [left.label || left.sentence].filter(Boolean) : [];
  });
  return {
    version: "global-greetings-reason-v1",
    summary: "이 안부는 당신의 기록이 닿은 세 방향과 지금의 역할, 그리고 당신이 고른 연결 방향을 함께 읽어 전했습니다.",
    evidence: [directions[0] ? `두 기록 모두 ‘${directions[0]}’의 방향이 강하게 남았습니다.` : null, ...(relevance?.evidence || [])].filter(Boolean).slice(0, 2),
    sender_point: sender.coordinate?.axes || null,
    receiver_point: receiver.coordinate?.axes || null,
  };
}
