const AXES = ["M", "S", "D"];
const API_SOURCES = new Set(["openai", "motif"]);
const VALID_AXIS_VALUES = {
  M: new Set(["M1", "M2", "M3", "M4", "MIXED", "UNKNOWN", "SKIP"]),
  S: new Set(["S1", "S2", "S3", "S4", "MIXED", "UNKNOWN", "SKIP"]),
  D: new Set(["D1", "D2", "D3", "D4", "MIXED", "UNKNOWN", "SKIP"]),
};

const AXIS_LABELS = {
  M1: "감각과 정서", M2: "삶과 기억과 정체성", M3: "탐구와 창작과 성취", M4: "관계와 공공세계",
  S1: "확장", S2: "지속", S3: "전환", S4: "거리와 한계",
  D1: "접근과 참여", D2: "개인의 기반", D3: "관계와 매개", D4: "제도와 구조",
};

export const DEPTH_PUBLIC_INTENTS = {
  M: "앞선 답변에서 무엇이 가장 중요하게 남아 있는지 조금 더 살펴봅니다.",
  S: "그 경험이 지금 어떤 방향으로 이어지고 있는지 살펴봅니다.",
  D: "다음 변화가 어느 자리에서 필요하다고 느끼는지 살펴봅니다.",
};

export const DEPTH_INTERNAL_PURPOSES = {
  M: "고정응답에서 형성된 M 가설을 참여자의 자기보고로 확인한다.",
  S: "응답자 자신의 현재 관계와 움직임에 관한 S 가설을 확인한다.",
  D: "다음 변화가 필요한 자리인 D 가설을 참여자의 우선순위로 확인한다.",
};

export const DEPTH_PROMPT_VERSION = "over39-depth-rc1.1-2026-08-03";

function decorateDepthQuestion(question, axis, context, source) {
  return {
    id: question.id || `AI-${axis}-01`,
    axis,
    prompt: question.prompt,
    intent: DEPTH_PUBLIC_INTENTS[axis],
    analysis_purpose: DEPTH_INTERNAL_PURPOSES[axis],
    source,
    referenced_answers: context.referenced_answers || [],
    temporary_axis: context.temporary_axes?.[axis.toLowerCase()] || null,
    candidate_axes: context.candidate_axes?.[axis.toLowerCase()] || [],
    prompt_version: DEPTH_PROMPT_VERSION,
    exposed: true,
  };
}

export const DEPTH_AXIS_OPTIONS = {
  M: [["M1", "느낌과 분위기"], ["M2", "삶의 경험과 나를 이루는 기억"], ["M3", "창작의 생각과 새로운 시도"], ["M4", "사람, 지역, 사회와의 관계"], ["MIXED", "두 가지 이상이 함께 있다"], ["UNKNOWN", "아직 잘 모르겠다"], ["SKIP", "건너뛰기"]],
  S: [["S1", "더 넓어지는 중"], ["S2", "비슷한 리듬으로 이어지는 중"], ["S3", "다른 의미나 방식으로 바뀌는 중"], ["S4", "잠시 거리를 두거나 한계를 살피는 중"], ["MIXED", "두 가지 이상이 함께 있다"], ["UNKNOWN", "아직 잘 모르겠다"], ["SKIP", "건너뛰기"]],
  D: [["D1", "만날 기회와 접근"], ["D2", "시간, 소득, 공간 같은 개인의 기반"], ["D3", "대화, 비평, 기록 같은 관계와 매개"], ["D4", "기관, 지원, 정책 같은 제도와 구조"], ["MIXED", "두 가지 이상이 함께 있다"], ["UNKNOWN", "아직 잘 모르겠다"], ["SKIP", "건너뛰기"]],
};

function hash(text) {
  return [...String(text || "")].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

export function validateDepthQuestion(question, expectedAxis) {
  if (!question || question.axis !== expectedAxis) return false;
  if (typeof question.prompt !== "string" || question.prompt.trim().length < 12 || question.prompt.length > 220) return false;
  if (typeof question.intent !== "string" || question.intent.trim().length < 12 || question.intent.length > 260) return false;
  if (typeof question.analysis_purpose !== "string" || question.analysis_purpose.trim().length < 8) return false;
  if (/[\w.+-]+@[\w.-]+|전화번호|주민등록|정확한 주소/.test(question.prompt)) return false;
  return true;
}

export function validateDepthPlan(plan) {
  if (!Array.isArray(plan) || plan.length !== 3) return false;
  return AXES.every((axis, index) => validateDepthQuestion(plan[index], axis));
}

export function selectApprovedQuestions(bank, context = {}) {
  return AXES.map((axis) => {
    const candidates = bank.questions.filter((item) => item.axis === axis
      && item.status !== "draft"
      && (!item.routes?.length || item.routes.includes(context.route)));
    const selected = candidates[hash(`${context.response_id}:${axis}:${context.role || ""}`) % candidates.length];
    return decorateDepthQuestion(selected, axis, context, "approved_question_bank");
  });
}

export function buildMockDepthPlan(context = {}) {
  return AXES.map((axis) => decorateDepthQuestion({
    id: `MOCK-${axis}-01`,
    prompt: ({ M: "지금까지 남긴 답변에서 가장 중요한 의미는 무엇에 가깝나요?", S: "그 의미와 활동은 지금 어떤 움직임 안에 있나요?", D: "다음 변화는 어디에서 먼저 시작되어야 할까요?" })[axis],
  }, axis, context, "mock_api"));
}

export function buildMinimalDepthContext(response) {
  const allowed = new Set(["P05", "P06", "P07", "M01", "M04", "M05", "D01", "D02", "D03", "R01"]);
  const selectedAnswers = (response.fixed_questions || [])
    .filter((item) => allowed.has(item.id) && item.answer !== null && item.answer !== "")
    .map((item) => ({
      question_id: item.id,
      answer: item.answer,
      answer_label: AXIS_LABELS[item.answer] || null,
    }));
  return {
    response_id: response.response_id,
    route: response.route,
    coordinate_scope: response.coordinate_scope,
    role_group: response.answers?.role_group_primary || null,
    role: response.answers?.role_primary || null,
    memory_type: response.answers?.memory_type || null,
    response_position: response.answers?.response_position || null,
    d_scope: response.answers?.d_scope || null,
    referenced_answers: selectedAnswers.map((item) => item.question_id),
    selected_answers: selectedAnswers,
    temporary_axes: {
      m: response.coordinate_snapshots?.fixed?.m_primary || null,
      s: response.coordinate_snapshots?.fixed?.s_primary || null,
      d: response.coordinate_snapshots?.fixed?.d_primary || null,
    },
    temporary_axis_labels: {
      m: AXIS_LABELS[response.coordinate_snapshots?.fixed?.m_primary] || null,
      s: AXIS_LABELS[response.coordinate_snapshots?.fixed?.s_primary] || null,
      d: AXIS_LABELS[response.coordinate_snapshots?.fixed?.d_primary] || null,
    },
    candidate_axes: {},
    prompt_version: DEPTH_PROMPT_VERSION,
  };
}

export function buildMinimalSummaryContext({ responseId, route, coordinateScope, questions = [], answers = {} }) {
  return {
    response_id: responseId,
    route,
    coordinate_scope: coordinateScope,
    prompt_version: DEPTH_PROMPT_VERSION,
    questions: questions.map(({ id, axis, prompt, source }) => ({ id, axis, prompt, source })),
    depth_answers: AXES.map((axis) => ({
      axis,
      selected_value: answers[`depth_${axis.toLowerCase()}`] || null,
      selected_label: AXIS_LABELS[answers[`depth_${axis.toLowerCase()}`]] || null,
    })),
  };
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs)),
  ]);
}

export async function createDepthPlan({ endpoint, anonKey, mode = "fallback", context, bank, fetchImpl = fetch, timeoutMs = 12000 }) {
  const fallback = () => ({ questions: selectApprovedQuestions(bank, context), source: "approved_question_bank", run: { status: "fallback", error_code: null } });
  if (mode === "mock") return { questions: buildMockDepthPlan(context), source: "mock_api", run: { status: "success", provider: "mock" } };
  if (mode !== "live" || !endpoint) return fallback();
  const started = performance.now();
  try {
    const response = await withTimeout(fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}) },
      body: JSON.stringify({ operation: "generate_questions", context }),
    }), timeoutMs);
    if (!response.ok) throw new Error(`AI_HTTP_${response.status}`);
    const body = await response.json();
    if (!Array.isArray(body.questions) || body.questions.length !== 3 || !AXES.every((axis, index) => body.questions[index]?.axis === axis)) {
      throw new Error("AI_INVALID_QUESTION_ORDER");
    }
    const provider = API_SOURCES.has(body.provider) ? body.provider : "api";
    const questions = AXES.map((axis, index) => decorateDepthQuestion(body.questions?.[index] || {}, axis, context, provider));
    if (!validateDepthPlan(questions)) throw new Error("AI_INVALID_QUESTION_PLAN");
    return { questions, source: provider, run: { status: "success", provider, model: body.model || null, prompt_version: DEPTH_PROMPT_VERSION, latency_ms: Math.round(performance.now() - started), usage: body.usage || null } };
  } catch (error) {
    const result = fallback();
    result.run = { status: "fallback", provider: "api", error_code: error.message, latency_ms: Math.round(performance.now() - started) };
    return result;
  }
}

const axisLabel = {
  M1: "감각과 정서", M2: "삶과 기억", M3: "탐구와 창작", M4: "관계와 공공세계",
  S1: "확장", S2: "지속", S3: "전환", S4: "거리와 한계",
  D1: "접근과 참여", D2: "개인의 기반", D3: "관계와 매개", D4: "제도와 구조",
};

export function buildRuleSummary(answers = {}) {
  const m = VALID_AXIS_VALUES.M.has(answers.depth_m) && axisLabel[answers.depth_m] ? answers.depth_m : answers.m_declared;
  const s = VALID_AXIS_VALUES.S.has(answers.depth_s) && axisLabel[answers.depth_s] ? answers.depth_s : null;
  const d = VALID_AXIS_VALUES.D.has(answers.depth_d) && axisLabel[answers.depth_d] ? answers.depth_d : answers.d_desired_change_primary;
  const complete = Boolean(axisLabel[m] && axisLabel[s] && axisLabel[d]);
  return {
    summary: complete
      ? `이번 응답에서는 ${axisLabel[m]}의 의미가 중요하게 남아 있고, 현재는 ${axisLabel[s]}의 흐름에 있으며, 다음 변화는 ${axisLabel[d]}의 자리에서 먼저 필요하다고 읽혔습니다.`
      : "이번 응답에는 하나의 방향으로 묶기 어려운 의미와 조건이 함께 남아 있습니다. 정리문을 수정하거나 남기지 않아도 응답은 그대로 보존됩니다.",
    axes: { m: axisLabel[m] ? m : null, s: axisLabel[s] ? s : null, d: axisLabel[d] ? d : null },
    evidence: { m: ["M04", "M05", "AI_M1"], s: ["P06", "P07", "AI_S1"], d: ["D01", "D02", "D03", "AI_D1"] },
    source: "rules",
  };
}

export async function createDepthSummary({ endpoint, anonKey, mode = "fallback", context, fetchImpl = fetch, timeoutMs = 12000 }) {
  const fallbackAnswers = context.answers || Object.fromEntries((context.depth_answers || []).map((item) => [`depth_${String(item.axis).toLowerCase()}`, item.selected_value]));
  const fallback = () => ({ ...buildRuleSummary(fallbackAnswers), run: { status: "fallback" } });
  if (mode === "mock") return { ...buildRuleSummary(fallbackAnswers), source: "mock_api", run: { status: "success", provider: "mock" } };
  if (mode !== "live" || !endpoint) return fallback();
  const started = performance.now();
  try {
    const response = await withTimeout(fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}) },
      body: JSON.stringify({ operation: "summarize", context }),
    }), timeoutMs);
    if (!response.ok) throw new Error(`AI_HTTP_${response.status}`);
    const body = await response.json();
    if (!body.summary || !body.axes) throw new Error("AI_INVALID_SUMMARY");
    const provider = API_SOURCES.has(body.provider) ? body.provider : "api";
    return { summary: body.summary, axes: body.axes, evidence: body.evidence || {}, source: provider, run: { status: "success", provider, model: body.model || null, latency_ms: Math.round(performance.now() - started), usage: body.usage || null } };
  } catch (error) {
    const result = fallback();
    result.run = { status: "fallback", provider: "api", error_code: error.message, latency_ms: Math.round(performance.now() - started) };
    return result;
  }
}
