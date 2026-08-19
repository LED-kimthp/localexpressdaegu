import { safeFinalSummaryFailure } from "./integration-r2-helpers.js";
import { compactParticipantContext } from "./participant-context.js";

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

const ROLE_LABELS = {
  R01: "시각예술가",
  R02: "사진·영상·미디어 작가",
  R03: "공예·디자인 창작자",
  R04: "큐레이터·전시기획자",
  R05: "독립기획자·프로듀서",
  R06: "비평가",
  R07: "연구자",
  R08: "문화예술 기자",
  R09: "독립미디어 관계자",
  R10: "편집자·출판기획자",
  R11: "아키비스트·기록연구자",
  R12: "사진·영상 기록자",
  R13: "디자인·홍보·커뮤니케이션 담당자",
  R14: "독립공간 운영자",
  R15: "미술관·문화기관 실무자",
  R16: "대학교수·예술교육자·강사",
  R17: "문화행정·정책 관계자",
  R18: "제작·설치·기술 인력",
  R19: "갤러리·유통·후원 관계자",
  R20: "보존·수복·소장품 관리 관계자",
};

function roleLabel(value, answers = {}, { parallel = false } = {}) {
  const code = String(value || "").trim();
  if (!code) return null;
  if (code === "OTHER") {
    const custom = String(parallel ? answers.roles_parallel_other : answers.role_primary_other || "").trim();
    return custom || "기타 역할";
  }
  if (code === "NON_ARTS") return "문화예술 외 역할";
  return ROLE_LABELS[code] || code;
}

const CONTEXT_LABELS = {
  STEADY: "작품 제작이나 핵심 활동을 비교적 꾸준히 이어가고 있다",
  SEASONAL: "작품 제작이나 핵심 활동을 시기와 상황에 따라 이어가고 있다",
  RESEARCH_RECORD: "준비·조사·기록을 중심으로 활동을 이어가고 있다",
  PAUSED: "현재 작품 제작이나 핵심 활동을 잠시 쉬고 있다",
  SHIFTED: "이전과 다른 역할이나 방식으로 이동하고 있다",
  CLOSED: "작품 제작이나 해당 활동을 마무리했다고 느낀다",
  MAKING_AND_SHOWING: "제작과 공개 활동이 함께 이어지고 있다",
  MAKING_NOT_SHOWING: "제작이나 핵심 활동은 이어지지만 공개 활동은 쉬고 있다",
  SHOWING_PROJECT_BASED: "프로젝트가 있을 때 공개 활동을 이어가고 있다",
  PUBLIC_ROLE_SHIFT: "발표·전시 외의 역할로 공개 활동이 달라졌다",
  BOTH_PAUSED: "제작과 공개 활동 모두 잠시 쉬고 있다",
  NOT_WANTED: "현재는 공개 활동을 계획하지 않고 있다",
  AUDIENCE_ACTIVE: "문화예술을 비교적 꾸준히 찾아보고 참여하고 있다",
  AUDIENCE_OCCASIONAL: "문화예술을 시기와 상황에 따라 찾아보고 참여하고 있다",
  AUDIENCE_DISTANCED: "현재는 문화예술 현장과 거리를 두고 있다",
  AUDIENCE_REGULAR: "전시·프로그램에 비교적 꾸준히 참여하고 있다",
  AUDIENCE_ONLINE: "온라인·출판·기록을 중심으로 문화예술을 만나고 있다",
  AUDIENCE_PAUSED: "현재는 관람과 참여를 쉬고 있다",
  REST: "회복을 위한 휴식",
  PREPARATION: "다음 작업을 위한 준비",
  LONG_RESEARCH: "장기 조사와 제작의 일부",
  TRANSITION: "역할과 방식의 전환",
  DISTANCE: "현장과의 거리를 다시 살피는 상태",
  CLOSURE: "한 활동을 마무리하는 과정",
  UNDECIDED: "여러 상태가 함께 있어 아직 한 이름으로 정하기 어려움",
  CLEAR: "분명한 전환 시점이 있었다",
  GRADUAL: "서서히 달라졌다",
  MULTIPLE: "여러 번 변화했다",
  CONTINUED: "비슷한 흐름으로 이어졌다",
  YES: "밖에서 잘 보이지 않은 시간에도 이어진 것이 있었다",
  NO: "그 시기에 이어진 것을 떠올리기 어렵다",
  UNSURE: "지금은 잘 모르겠다",
  PEOPLE: "함께한 사람과 동료",
  AUDIENCE: "관객과 참여자",
  SPACE: "활동할 수 있는 공간",
  INCOME: "생활을 지탱하는 소득",
  OTHER_WORK: "다른 일과 역할",
  INSTITUTION: "기관과 지원",
  REGION: "지역의 관계와 환경",
  EDUCATION: "교육·연구·배움",
  RECORD: "기록·자료·아카이브",
  FAMILY_CARE: "가족·돌봄 관계",
  MEMORY: "기억과 오래 이어진 질문",
  SELF_PACE: "스스로 조절한 속도와 선택",
  NONE: "특별히 떠오르는 조건이 없다",
  MIXED: "한 가지 상태로 말하기 어렵다",
};

function contextLabel(value) {
  return CONTEXT_LABELS[value] || AXIS_LABELS[value] || String(value || "").trim();
}

export const DEPTH_PUBLIC_INTENTS = {
  M: "앞선 답변에서 무엇이 가장 중요하게 남아 있는지 조금 더 살펴봅니다.",
  S: "그 경험이 지금 어떤 자리에 놓여 있는지 함께 봅니다.",
  D: "다음 변화가 어느 자리에서 필요하다고 느끼는지 살펴봅니다.",
};

export const DEPTH_INTERNAL_PURPOSES = {
  M: "고정응답에서 형성된 M 가설을 참여자의 자기보고로 확인한다.",
  S: "응답자 자신의 현재 관계와 움직임에 관한 S 가설을 확인한다.",
  D: "다음 변화가 필요한 자리인 D 가설을 참여자의 우선순위로 확인한다.",
};

export const DEPTH_PROMPT_VERSION = "over39-depth-rc2.0-2026-08-04";
export const ADAPTIVE_PROMPT_VERSION = "over39-adaptive-v0.4.9-2026-08-11";

export const ADAPTIVE_CHECKPOINTS = {
  memory_object: {
    axis: "M",
    label: "기억의 대상",
    intent: "앞에서 떠올린 대상이 사람, 작품, 전시, 공간, 장면 가운데 어디에 가까운지 확인합니다.",
    analysisPurpose: "기억 대상을 단정하지 않고 참여자가 기억하는 범주와 불확실성을 확인한다.",
  },
  memory_scene: {
    axis: "M",
    label: "남아 있는 장면",
    intent: "길거나 여러 갈래인 답변에서 지금도 선명한 한 장면을 조금 더 구체적으로 듣습니다.",
    analysisPurpose: "참여자의 원문을 보존하면서 감각·행동·공간 단서를 구체화한다.",
  },
  memory_reason: {
    axis: "M",
    label: "현재와 이어진 기억",
    intent: "기억이 지금의 생각, 선택, 활동 또는 관람과 어떻게 이어져 있는지 살펴봅니다.",
    analysisPurpose: "기억의 의미와 현재의 자기해석을 구분해 기록한다.",
  },
  present: {
    axis: "S",
    label: "현재의 흐름",
    intent: "현재의 움직임, 전환, 밖에서 보이지 않았던 지속 가운데 필요한 한 지점을 더 묻습니다.",
    analysisPurpose: "공식 가시성과 실제 지속을 구분하고, 응답자 자신의 현재 움직임을 경험 중심으로 탐색한다.",
  },
  conditions: {
    axis: "D",
    label: "다음에 필요한 변화",
    intent: "바라는 변화와 이미 작동한 조건 가운데 아직 열리지 않은 한 지점을 더 묻습니다.",
    analysisPurpose: "필요의 목록을 반복하지 않고 변화가 필요한 자리와 관계의 방향을 구체화한다.",
  },
};

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
    language: question.language || context.response_language || "ko",
    exposed: true,
  };
}

export const DEPTH_AXIS_OPTIONS = {
  M: [["M1", "느낌과 분위기 — 색과 소리, 공간감과 정서가 이번 기록의 중심에 가깝습니다."], ["M2", "삶·기억·정체성 — 개인의 삶과 관계, 오래 남은 기억이 이번 기록의 중심에 가깝습니다."], ["M3", "탐구·창작·성취 — 작품의 생각과 표현 방식, 새로운 시도가 이번 기록의 중심에 가깝습니다."], ["M4", "관계·공공세계 — 사람과 지역, 공동체와 사회에 관한 의미가 이번 기록의 중심에 가깝습니다."], ["MIXED", "두 흐름이 함께 있음 — 한 방향으로 정하기보다 두 가지 이상의 의미가 함께 나타납니다."], ["UNKNOWN", "아직 정하기 어려움 — 지금은 한 방향을 고르기 어렵습니다."], ["SKIP", "건너뛰기"]],
  S: [["S1", "확장 — 활동과 관심이 새로운 방향으로 넓어지고 있습니다."], ["S2", "지속 — 익숙한 활동과 관계가 비슷한 리듬으로 이어지고 있습니다."], ["S3", "전환 — 역할과 방식, 활동의 의미가 달라지는 흐름에 있습니다."], ["S4", "거리·한계 — 속도를 조절하며 거리와 현실의 조건을 함께 살피고 있습니다."], ["MIXED", "두 흐름이 함께 있음 — 한 가지 현재로 정하기보다 두 가지 이상의 흐름이 함께 나타납니다."], ["UNKNOWN", "아직 정하기 어려움 — 지금의 흐름을 한 방향으로 고르기 어렵습니다."], ["SKIP", "건너뛰기"]],
  D: [["D1", "접근·참여 — 정보, 이동, 관람과 참여 기회가 중요한 조건으로 나타납니다."], ["D2", "개인의 기반 — 시간, 공간, 생활과 경제적 자원이 중요한 조건으로 나타납니다."], ["D3", "관계·매개 — 동료, 기획자, 비평가, 교육자와 관객의 연결이 중요한 조건으로 나타납니다."], ["D4", "제도·구조 — 지원, 심사, 보상과 지속적인 운영이 중요한 조건으로 나타납니다."], ["MIXED", "두 조건이 함께 필요함 — 한 조건으로 정하기보다 두 가지 이상의 조건이 함께 나타납니다."], ["UNKNOWN", "아직 정하기 어려움 — 지금은 한 조건을 고르기 어렵습니다."], ["SKIP", "건너뛰기"]],
};

function hash(text) {
  return [...String(text || "")].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function redactExcerpt(value, max = 1000) {
  return String(value || "")
    .trim()
    .slice(0, max)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?82[- ]?)?0?1[016789][- ]?\d{3,4}[- ]?\d{4}/g, "[phone removed]");
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs)),
  ]);
}

async function requestAiJson({ endpoint, anonKey, operation, context, fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: authHeaders(anonKey),
      body: JSON.stringify({ operation, context }),
      signal: controller.signal,
    });
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    return {
      ok: Boolean(response.ok),
      status: Number(response.status || (response.ok ? 200 : 500)),
      body,
      request_id: body.request_id || response.headers?.get?.("x-request-id") || null,
    };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("AI_TIMEOUT_ABORTED");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function apiResponseError(result) {
  const code = String(result?.body?.error_code || result?.body?.code || result?.body?.error?.code || "").trim();
  return new Error(code ? `AI_HTTP_${result.status}_${code}` : `AI_HTTP_${result.status}`);
}

function shouldTryLegacyOperation(result) {
  if (!result || result.ok) return false;
  const code = String(result.body?.error_code || result.body?.code || "").toUpperCase();
  return result.status === 400 || code === "UNKNOWN_OPERATION" || code === "INVALID_OPERATION";
}

function authHeaders(anonKey) {
  return { "Content-Type": "application/json", ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}) };
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

export function selectApprovedQuestion(bank, axis, context = {}) {
  const candidates = bank.questions.filter((item) => item.axis === axis
    && item.status !== "draft"
    && (!item.routes?.length || item.routes.includes(context.route)));
  const selected = candidates[hash(`${context.response_id}:${axis}:${context.role || ""}`) % candidates.length];
  return decorateDepthQuestion(selected, axis, context, "approved_question_bank");
}

export function buildMockDepthPlan(context = {}) {
  return AXES.map((axis) => decorateDepthQuestion({
    id: `MOCK-${axis}-01`,
    prompt: ({ M: "지금까지 남긴 답변에서 가장 중요한 의미는 무엇에 가깝나요?", S: "그 의미와 활동은 지금 어떤 움직임 안에 있나요?", D: "다음 변화는 어디에서 먼저 시작되어야 할까요?" })[axis],
  }, axis, context, "mock_api"));
}

function fixedResponsesForAI(response) {
  return (response.fixed_questions || [])
    .filter((item) => item && item.answer !== null && item.answer !== undefined && item.answer !== "")
    .map((item) => ({
      id: item.id,
      axis: item.axis || null,
      evidence: item.evidence || null,
      purpose: item.purpose || null,
      question_text: redactExcerpt(item.question_text || item.intent || item.purpose || item.id, 520),
      answer: Array.isArray(item.answer) ? item.answer.slice(0, 8) : item.answer,
      answer_display: redactExcerpt(item.answer_display || (Array.isArray(item.answer) ? item.answer.join(" / ") : item.answer), 1600),
    }))
    .filter((item) => !isLowInformationText(item.answer_display))
    .slice(0, 40);
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
    role_primary: response.answers?.role_primary || null,
    role_primary_label: response.answers?.role_primary_local_title || roleLabel(response.answers?.role_primary, response.answers || {}),
    roles_parallel: Array.isArray(response.answers?.roles_parallel) ? response.answers.roles_parallel.slice(0, 3) : [],
    roles_parallel_labels: Array.isArray(response.answers?.roles_parallel) ? response.answers.roles_parallel.slice(0, 3).map((value) => roleLabel(value, response.answers || {}, { parallel: true })).filter(Boolean) : [],
    memory_type: response.answers?.memory_type || null,
    response_position: response.answers?.response_position || null,
    d_scope: response.answers?.d_scope || null,
    participant_context: response.participant_context || compactParticipantContext(response.answers || {}),
    referenced_answers: selectedAnswers.map((item) => item.question_id),
    selected_answers: selectedAnswers,
    fixed_responses: fixedResponsesForAI(response),
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
    response_language: response.source_language || "ko",
  };
}

export function buildDepthTurnContext({ response, axis, questions = [], answers = {} }) {
  const base = buildMinimalDepthContext(response);
  const previousAxes = AXES.slice(0, AXES.indexOf(axis));
  return {
    ...base,
    operation: "generate_followup",
    requested_axis: axis,
    question_history: previousAxes.map((previousAxis) => {
      const question = questions.find((item) => item.axis === previousAxis);
      const key = `depth_${previousAxis.toLowerCase()}`;
      return {
        axis: previousAxis,
        question_id: question?.id || null,
        question: question?.prompt || null,
        selected_value: answers[key] || null,
        selected_label: AXIS_LABELS[answers[key]] || null,
        response_text: redactExcerpt(answers[`${key}_text`]),
        response_language: question?.language || null,
      };
    }),
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
      response_text: redactExcerpt(answers[`depth_${axis.toLowerCase()}_text`]),
      response_language: questions.find((item) => item.axis === axis)?.language || null,
    })),
    response_language: questions[0]?.language || "ko",
  };
}

export async function createDepthPlan({ endpoint, anonKey, mode = "fallback", context, bank, fetchImpl = fetch, timeoutMs = 12000 }) {
  const fallback = () => ({ questions: selectApprovedQuestions(bank, context), source: "approved_question_bank", run: { status: "fallback", error_code: null } });
  if (mode === "mock") return { questions: buildMockDepthPlan(context), source: "mock_api", run: { status: "success", provider: "mock" } };
  if (mode !== "live" || !endpoint) return fallback();
  const started = performance.now();
  try {
    const response = await withTimeout(fetchImpl(endpoint, {
      method: "POST",
      headers: authHeaders(anonKey),
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

export async function createDepthQuestion({ endpoint, anonKey, mode = "fallback", context, bank, axis, fetchImpl = fetch, timeoutMs = 12000 }) {
  const fallback = () => ({ question: selectApprovedQuestion(bank, axis, context), source: "approved_question_bank", run: { status: "fallback", error_code: null } });
  if (mode === "mock") return { question: decorateDepthQuestion({ id: `MOCK-${axis}-01`, axis, prompt: ({ M: "지금까지 떠올린 경험에서 가장 오래 남아 있는 의미는 무엇인가요?", S: "방금 고른 의미는 지금의 경험에서 어떤 자리에 놓여 있나요?", D: "지금까지의 이야기를 생각할 때, 다음 변화는 어디에서 먼저 시작되면 좋을까요?" })[axis], language: context.response_language || "ko" }, axis, context, "mock_api"), source: "mock_api", run: { status: "success", provider: "mock" } };
  if (mode !== "live" || !endpoint) return fallback();
  const started = performance.now();
  try {
    const response = await withTimeout(fetchImpl(endpoint, {
      method: "POST",
      headers: authHeaders(anonKey),
      body: JSON.stringify({ operation: "generate_followup", context }),
    }), timeoutMs);
    if (!response.ok) throw new Error(`AI_HTTP_${response.status}`);
    const body = await response.json();
    if (!body.question || body.question.axis !== axis) throw new Error("AI_INVALID_FOLLOWUP");
    const provider = API_SOURCES.has(body.provider) ? body.provider : "api";
    const question = decorateDepthQuestion(body.question, axis, context, provider);
    if (!validateDepthQuestion(question, axis)) throw new Error("AI_INVALID_FOLLOWUP");
    return { question, source: provider, run: { status: "success", provider, model: body.model || null, prompt_version: body.prompt_version || DEPTH_PROMPT_VERSION, latency_ms: Math.round(performance.now() - started), usage: body.usage || null } };
  } catch (error) {
    const result = fallback();
    result.run = { status: "fallback", provider: "api", error_code: error.message, latency_ms: Math.round(performance.now() - started) };
    return result;
  }
}

function checkpointSpec(checkpoint) {
  return ADAPTIVE_CHECKPOINTS[checkpoint] || ADAPTIVE_CHECKPOINTS.memory_reason;
}

function fallbackContextText(context = {}) {
  return [
    ...(context.fixed_narratives || []).map((item) => item?.text),
    ...(context.question_history || []).map((item) => item?.answer_text),
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function hasAny(text, words = []) {
  return words.some((word) => text.includes(word));
}

function fallbackAdaptiveQuestion(checkpoint, context = {}) {
  const turnIndex = Number(context.checkpoint_turn_count || 0);
  const route = context.route || "";
  const role = context.role || "";
  const text = fallbackContextText(context);
  const isAudience = route === "AUDIENCE" || context.response_position === "AUDIENCE_CITIZEN";
  const hasExplicitRole = /^R\d{2}$/.test(role);
  const isProfessor = role === "R16" || (!hasExplicitRole && hasAny(text, ["대학교수", "교수", "정교수", "승진", "학과", "입시", "행정", "대학 평가"]));
  const isCritic = role === "R06" || (!hasExplicitRole && hasAny(text, ["비평", "비평가", "작가성", "상업화랑", "미술시장", "제도", "생태계", "작가의 태도"]));
  const isCurator = role === "R04";
  const isJournalist = role === "R08";
  const language = String(context.response_language || "ko").toLowerCase();
  const hasAuthorityProcess = hasAny(text, ["비엔날레", "초청", "선정", "중개", "계약", "공식 확인", "참가비", "출품료", "비용을 지급", "돈을 주", "대관"]);
  const hasPromotionActivity = hasAny(text, ["협회", "인스타", "홍보", "사람들을 초대", "비평문", "대관 전시"]);

  if (turnIndex > 0) {
    if (isAudience) return { focus: "경험의 순환", prompt: "그 경험을 다른 사람에게 이야기하거나 다시 찾아본 적이 있나요?" };
    if (hasAuthorityProcess) return { focus: "확인 자료", prompt: "그 과정에서 기관이나 주최 측으로부터 직접 받은 확인 자료가 있었나요?" };
    if (isProfessor) return { focus: "창작 시간", prompt: "그 일을 마친 뒤 작업의 감각으로 돌아가기까지 어떤 시간이 필요했나요?" };
    if (isCritic) return { focus: "판단의 근거", prompt: "그 판단이 분명해진 작품이나 전시의 한 장면을 들려주세요." };
  }

  if (checkpoint === "memory_object") {
    if (context.memory_type === "NO_RECALL") return { focus: "현재의 감각", prompt: "지금 떠오르는 것은 사람, 작품, 공간, 장면, 또는 이름 붙이기 어려운 감각 가운데 어디에 가까운가요?" };
    if (isAudience) return { focus: "기억의 대상", prompt: "앞에서 떠올린 기억은 작품 한 점, 전시 전체, 공간의 분위기, 사람의 모습 가운데 어디에 더 가까운가요?" };
    return { focus: "기억의 대상", prompt: "앞에서 떠올린 대상은 사람, 작품, 전시, 공간, 장면 가운데 어디에 가장 가까운가요?" };
  }

  if (checkpoint === "memory_scene") {
    if (isAudience) return { focus: "선명한 장면", prompt: "그 순간에 가장 선명했던 색, 소리, 움직임 또는 사람의 모습은 무엇이었나요?" };
    if (isCurator) return { focus: "기획의 장면", prompt: "그 기억에서 전시나 작가와의 관계가 가장 선명하게 드러난 한 장면을 들려주세요." };
    if (isCritic) return { focus: "판단의 장면", prompt: "그 장면에서 작품이나 작가를 바라보는 판단이 움직인 지점은 무엇이었나요?" };
    return { focus: "선명한 장면", prompt: "방금 적은 내용 가운데 지금도 가장 선명한 한 장면을 조금 더 들려주세요." };
  }

  if (checkpoint === "memory_reason") {
    if (isAudience) return { focus: "현재와의 연결", prompt: "이 기억은 지금의 취향, 선택, 대화 또는 다시 보고 싶은 마음과 어떻게 이어져 있나요?" };
    if (isCritic && hasAny(text, ["기준", "달라", "회의", "상업화랑", "작가성"])) return { focus: "판단의 전환", prompt: "이 기억은 지금 작가와 작품을 바라보는 기준에 어떤 영향을 주었나요?" };
    if (isProfessor) return { focus: "현재와의 연결", prompt: "이 기억은 지금의 작업, 수업 또는 역할을 바라보는 생각과 어떻게 이어져 있나요?" };
    return route === "SELF"
      ? { focus: "현재와의 연결", prompt: "이 기억은 지금의 작업이나 선택에 어떤 모습으로 이어져 있나요?" }
      : { focus: "현재와의 연결", prompt: "이 기억은 지금의 생각이나 선택과 어떻게 이어져 있나요?" };
  }

  if (checkpoint === "present") {
    if (isCurator) return { focus: "기획과 연구의 현재", prompt: "최근 기획에서 조사나 작가와의 대화에 충분한 시간을 쓰기 어려웠던 장면이 있었나요?" };
    if (isJournalist && language.startsWith("ja")) return { focus: "取材の現在", prompt: "最近、現場での取材や記事を書く方法が変わったと感じた場面はありますか？" };
    if (isJournalist) return { focus: "취재의 현재", prompt: "최근 현장 취재나 기사 작성 방식이 달라졌다고 느낀 장면이 있었나요?" };
    if (hasAuthorityProcess) return { focus: "참여 절차", prompt: "참여가 확정되었다고 안내받은 절차를 순서대로 들려주세요." };
    if (isProfessor && hasAny(text, ["정교수", "승진"])) return { focus: "승진 과정의 실제 노동", prompt: "정교수 승진을 준비하며 실제로 가장 많은 시간을 들인 일은 무엇이었나요?" };
    if (isProfessor) return { focus: "교육과 행정의 시간", prompt: "수업과 행정 업무 가운데 가장 많은 시간을 사용한 일은 무엇이었나요?" };
    if (isCritic && hasAny(text, ["인성", "태도", "생태계", "기준"])) return { focus: "평가 기준의 변화", prompt: "작품과 함께 작가의 태도와 관계를 살피게 된 계기는 무엇이었나요?" };
    if (isCritic) return { focus: "비평의 현재", prompt: "비평과 작가 연구의 의미를 다시 생각하게 된 장면은 무엇이었나요?" };
    if (hasPromotionActivity) return { focus: "작업 과정", prompt: "최근 전시에서 처음 계획과 가장 크게 달라진 작품 한 점은 무엇이었나요?" };
    if (isAudience) return { focus: "관람의 지속", prompt: "전시장이나 행사에 가지 않는 시기에도 계속 찾아보거나 기억한 것이 있었나요?" };
    return { focus: "보이지 않는 지속", prompt: "밖에서 잘 보이지 않았던 시간에도 실제로 이어지고 있던 활동이나 생각이 있다면 한 장면으로 들려주세요." };
  }

  if (isCurator) return { focus: "기획과 연구의 조건", prompt: "조사와 기획을 충분히 이어가기 위해 지금 가장 먼저 달라져야 할 조건은 무엇인가요?" };
  if (isJournalist && language.startsWith("ja")) return { focus: "取材を続ける条件", prompt: "文化芸術の取材を続けるために、今いちばん必要だと感じる条件は何ですか？" };
  if (isJournalist) return { focus: "취재를 이어갈 조건", prompt: "문화예술 취재를 이어가기 위해 지금 가장 필요하다고 느끼는 조건은 무엇인가요?" };
  if (hasAuthorityProcess && hasAny(text, ["비용", "돈", "참가비", "출품료", "대관"])) return { focus: "비용의 내용", prompt: "지급한 비용에 포함된 업무와 제공 내용은 무엇이었나요?" };
  if (isProfessor) return { focus: "작업과 교육의 조건", prompt: "작업과 교육을 함께 이어가기 위해 가장 먼저 조정되어야 할 일은 무엇인가요?" };
  if (isCritic) return { focus: "비평과 연구의 조건", prompt: "비평과 작가 연구가 오래 이어지기 위해 지금 필요한 조건은 무엇인가요?" };
  if (isAudience) return { focus: "다시 만날 조건", prompt: "비슷한 경험을 다시 만나게 하는 가장 작은 조건은 무엇인가요?" };
  return { focus: "변화의 첫 장면", prompt: "지금 바라는 변화가 시작되었다고 느낄 수 있는 가장 작은 장면은 무엇인가요?" };
}

function decorateAdaptiveQuestion(question, checkpoint, context, source) {
  const spec = checkpointSpec(checkpoint);
  const turnIndex = Number(context.checkpoint_turn_count || 0);
  return {
    id: question.id || `AI-${checkpoint.toUpperCase()}-${turnIndex + 1}`,
    checkpoint,
    axis: spec.axis,
    focus: question.focus || checkpoint,
    prompt: String(question.prompt || "").trim(),
    intent: String(question.intent || spec.intent).trim(),
    analysis_purpose: spec.analysisPurpose,
    source,
    referenced_answers: question.referenced_answers || context.referenced_answers || [],
    prompt_version: question.prompt_version || ADAPTIVE_PROMPT_VERSION,
    language: question.language || context.response_language || "ko",
    exposed: true,
    answer_field: `adaptive_answer_${checkpoint}_${turnIndex + 1}`,
    self_check_field: `adaptive_check_${checkpoint}_${turnIndex + 1}`,
    turn_index: turnIndex + 1,
  };
}

export function validateAdaptiveQuestion(question, checkpoint) {
  if (!question || question.checkpoint !== checkpoint) return false;
  if (question.axis !== checkpointSpec(checkpoint).axis) return false;
  if (typeof question.prompt !== "string" || question.prompt.trim().length < 12 || question.prompt.length > 260) return false;
  if (typeof question.intent !== "string" || question.intent.trim().length < 12 || question.intent.length > 320) return false;
  if (/[\w.+-]+@[\w.-]+|전화번호|주민등록|정확한 주소/.test(question.prompt)) return false;
  return true;
}

function adaptiveHistory(turns = [], answers = {}) {
  return turns.map((turn) => ({
    id: turn.id,
    checkpoint: turn.checkpoint,
    axis: turn.axis,
    focus: turn.focus,
    question: turn.prompt,
    intent: turn.intent,
    answer_text: redactExcerpt(answers[turn.answer_field], 1400),
    self_check_value: answers[turn.self_check_field] || null,
    self_check_label: AXIS_LABELS[answers[turn.self_check_field]] || null,
    language: turn.language || null,
  }));
}

export function buildAdaptiveContext({ response, checkpoint, turns = [], answers = {} }) {
  const spec = checkpointSpec(checkpoint);
  const history = adaptiveHistory(turns, answers);
  const checkpointHistory = history.filter((turn) => turn.checkpoint === checkpoint);
  const narrativeFields = [
    ["memory_scene", answers.memory_clue_text],
    ["memory_meaning", answers.memory_meaning_text],
    ["current_core_state", contextLabel(answers.creative_work_state)],
    ["current_public_state", contextLabel(answers.public_activity_state)],
    ["state_meaning", contextLabel(answers.pause_meaning)],
    ["state_background", answers.pause_context_text],
    ["transition_signal", contextLabel(answers.transition_state)],
    ["transition", answers.transition_text],
    ["continuity_signal", contextLabel(answers.invisible_continuity_state)],
    ["invisible_continuity", answers.invisible_continuity_text],
    ["support_condition_choices", Array.isArray(answers.support_conditions) ? answers.support_conditions.map(contextLabel).filter(Boolean).join(", ") : ""],
    ["support_conditions", answers.support_conditions_text],
    ["desired_change_direction", contextLabel(answers.d_desired_change_primary)],
    ["desired_change", answers.desired_change_text],
    ["condition_impact", answers.d_context_evidence_text || answers.d_context_impact_text],
  ].map(([id, value]) => ({ id, text: redactExcerpt(value, 1400) })).filter((item) => item.text);
  const base = buildMinimalDepthContext(response);
  return {
    ...base,
    interview_mode: "adaptive_contextual",
    operation: "adaptive_next",
    checkpoint,
    checkpoint_label: spec.label,
    requested_axis: spec.axis,
    checkpoint_turn_count: checkpointHistory.length,
    min_turns: 1,
    max_turns: 2,
    allow_complete: checkpointHistory.length >= 1,
    fixed_narratives: narrativeFields,
    fixed_signals: {
      activity_state: answers.activity_state || null,
      visibility_state: answers.visibility_state || null,
      transition_state: answers.transition_state || null,
      invisible_continuity_state: answers.invisible_continuity_state || null,
      m_declared: answers.m_declared || null,
      d_current_gap: answers.d_current_gap || null,
      d_desired_change_primary: answers.d_desired_change_primary || null,
      reconnect_preferences: answers.reconnect_preferences || [],
    },
    adaptive_turns: history,
    question_history: history,
    response_language: response.source_language || "ko",
    prompt_version: ADAPTIVE_PROMPT_VERSION,
  };
}

function legacyFollowupContext(context, checkpoint) {
  const spec = checkpointSpec(checkpoint);
  const narratives = Array.isArray(context.fixed_narratives) ? context.fixed_narratives : [];
  const history = Array.isArray(context.question_history) ? context.question_history : [];
  const referenced = [
    ...narratives.map((item) => item.id),
    ...history.flatMap((item) => [item.id, ...(Array.isArray(item.referenced_answers) ? item.referenced_answers : [])]),
  ].filter(Boolean);
  return {
    ...context,
    operation: "generate_followup",
    requested_axis: spec.axis,
    referenced_answers: [...new Set(referenced)].slice(0, 20),
    selected_answers: narratives.map((item) => ({
      question_id: item.id,
      answer: item.text,
      answer_label: null,
    })),
    question_history: history.map((item) => ({
      axis: item.axis || spec.axis,
      question_id: item.id || null,
      question: item.question || null,
      selected_value: item.self_check_value || null,
      selected_label: item.self_check_label || null,
      response_text: item.answer_text || "",
      response_language: item.language || context.response_language || "ko",
    })),
  };
}

function legacyQuestionPlanContext(context, checkpoint) {
  const followup = legacyFollowupContext(context, checkpoint);
  return {
    ...followup,
    operation: "generate_questions",
    coordinate_scope: context.coordinate_scope || "respondent_self",
    requested_checkpoint: checkpoint,
    requested_axis: checkpointSpec(checkpoint).axis,
  };
}

function adaptiveLegacySummaryContext(context, answers = {}, turns = []) {
  const narratives = new Map((context.fixed_narratives || []).map((item) => [item.id, item.text]));
  const history = adaptiveHistory(turns, answers);
  const textFor = (checkpoint, ids) => {
    const pieces = ids.map((id) => narratives.get(id)).filter(Boolean);
    history.filter((item) => item.checkpoint === checkpoint && item.answer_text).forEach((item) => pieces.push(item.answer_text));
    return pieces.join("\n").slice(0, 4200);
  };
  const selectedFor = (axis) => adaptiveAxisFromTurns(axis, turns, answers)
    || (axis === "M" ? answers.m_declared : axis === "S" ? inferredS(answers) : answers.d_desired_change_primary)
    || null;
  return {
    response_id: context.response_id,
    route: context.route,
    coordinate_scope: context.coordinate_scope,
    response_language: context.response_language || "ko",
    prompt_version: DEPTH_PROMPT_VERSION,
    questions: turns.map((turn) => ({ id: turn.id, axis: turn.axis, prompt: turn.prompt, source: turn.source })),
    depth_answers: [
      { axis: "M", selected_value: selectedFor("M"), selected_label: AXIS_LABELS[selectedFor("M")] || null, response_text: textFor("memory", ["memory_scene", "memory_meaning"]), response_language: context.response_language || "ko" },
      { axis: "S", selected_value: selectedFor("S"), selected_label: AXIS_LABELS[selectedFor("S")] || null, response_text: textFor("present", ["transition", "invisible_continuity"]), response_language: context.response_language || "ko" },
      { axis: "D", selected_value: selectedFor("D"), selected_label: AXIS_LABELS[selectedFor("D")] || null, response_text: textFor("conditions", ["support_conditions", "desired_change", "condition_impact"]), response_language: context.response_language || "ko" },
    ],
  };
}

function fallbackAdaptiveDecision(checkpoint, context) {
  const turnCount = Number(context.checkpoint_turn_count || 0);
  const last = context.question_history?.filter((item) => item.checkpoint === checkpoint).at(-1);
  const needsClarification = turnCount === 1 && String(last?.answer_text || "").trim().length < 24;
  if (context.allow_complete && !needsClarification) {
    return { decision: "complete", question: null, coverage: { checkpoint, sufficient: true }, reason: "fallback_one_turn_complete" };
  }
  return {
    decision: "ask",
    question: {
      id: `FB-${checkpoint.toUpperCase()}-${turnCount + 1}`,
      checkpoint,
      ...fallbackAdaptiveQuestion(checkpoint, context),
      intent: checkpointSpec(checkpoint).intent,
      language: context.response_language || "ko",
    },
    coverage: { checkpoint, sufficient: false },
    reason: "fallback_question",
  };
}

export async function createAdaptiveTurn({ endpoint, anonKey, mode = "fallback", context, checkpoint, fetchImpl = fetch, timeoutMs = 20000 }) {
  const fallback = () => {
    const decision = fallbackAdaptiveDecision(checkpoint, context);
    return {
      ...decision,
      question: decision.question ? decorateAdaptiveQuestion(decision.question, checkpoint, context, "approved_context_fallback") : null,
      source: "approved_context_fallback",
      run: { status: "fallback", error_code: null, checkpoint },
    };
  };
  if (mode === "mock") {
    const decision = fallbackAdaptiveDecision(checkpoint, { ...context, allow_complete: false });
    return { ...decision, question: decorateAdaptiveQuestion(decision.question, checkpoint, context, "mock_api"), source: "mock_api", run: { status: "success", provider: "mock", checkpoint } };
  }
  if (mode !== "live" || !endpoint) return fallback();
  const started = performance.now();
  try {
    const adaptiveResult = await requestAiJson({ endpoint, anonKey, operation: "adaptive_next", context, fetchImpl, timeoutMs });
    let body = adaptiveResult.body;
    let compatibilityMode = null;
    let effectiveOperation = "adaptive_next";

    if (!adaptiveResult.ok && shouldTryLegacyOperation(adaptiveResult)) {
      const localDecision = fallbackAdaptiveDecision(checkpoint, context);
      if (localDecision.decision === "complete") {
        return {
          decision: "complete",
          question: null,
          coverage: localDecision.coverage || {},
          reason: "legacy_endpoint_one_turn_complete",
          source: "rules",
          run: {
            status: "success",
            provider: "rules",
            checkpoint,
            operation: "adaptive_next",
            compatibility_mode: "legacy_endpoint",
            latency_ms: Math.round(performance.now() - started),
          },
        };
      }
      const legacyResult = await requestAiJson({
        endpoint,
        anonKey,
        operation: "generate_followup",
        context: legacyFollowupContext(context, checkpoint),
        fetchImpl,
        timeoutMs,
      });
      if (legacyResult.ok) {
        body = legacyResult.body;
        compatibilityMode = "legacy_generate_followup";
        effectiveOperation = "generate_followup";
      } else if (shouldTryLegacyOperation(legacyResult)) {
        const questionPlanResult = await requestAiJson({
          endpoint,
          anonKey,
          operation: "generate_questions",
          context: legacyQuestionPlanContext(context, checkpoint),
          fetchImpl,
          timeoutMs,
        });
        if (!questionPlanResult.ok) throw apiResponseError(questionPlanResult);
        body = questionPlanResult.body;
        compatibilityMode = "legacy_generate_questions";
        effectiveOperation = "generate_questions";
      } else {
        throw apiResponseError(legacyResult);
      }
    } else if (!adaptiveResult.ok) {
      throw apiResponseError(adaptiveResult);
    }

    const provider = API_SOURCES.has(body.provider) ? body.provider : "api";
    if (effectiveOperation === "adaptive_next") {
      const normalizedDecision = ["ask", "complete"].includes(body.decision)
        ? body.decision
        : body.done === true
          ? "complete"
          : body.done === false
            ? "ask"
            : null;
      if (!normalizedDecision) throw new Error("AI_INVALID_ADAPTIVE_DECISION");
      body = { ...body, decision: normalizedDecision };
      if (normalizedDecision === "complete") {
        return {
          decision: "complete",
          question: null,
          coverage: body.coverage || {},
          reason: body.reason || null,
          source: provider,
          run: {
            status: "success",
            provider,
            model: body.model || null,
            checkpoint,
            operation: effectiveOperation,
            prompt_version: body.prompt_version || ADAPTIVE_PROMPT_VERSION,
            latency_ms: Math.round(performance.now() - started),
            usage: body.usage || null,
          },
        };
      }
    } else if (effectiveOperation === "generate_followup" && !body.question) {
      throw new Error("AI_INVALID_LEGACY_FOLLOWUP");
    } else if (effectiveOperation === "generate_questions" && !Array.isArray(body.questions)) {
      throw new Error("AI_INVALID_LEGACY_QUESTION_PLAN");
    }

    const legacyPlanQuestion = effectiveOperation === "generate_questions"
      ? body.questions.find((item) => item?.axis === checkpointSpec(checkpoint).axis)
      : null;
    const nestedQuestion = body.question && typeof body.question === "object" ? body.question : {};
    const rawQuestion = effectiveOperation === "adaptive_next"
      ? {
          ...nestedQuestion,
          id: nestedQuestion.id || nestedQuestion.question_id || body.question_id || null,
          checkpoint: nestedQuestion.checkpoint || body.checkpoint || checkpoint,
          prompt: nestedQuestion.prompt || nestedQuestion.question_text || body.prompt || body.question_text || "",
          question_text: nestedQuestion.question_text || nestedQuestion.prompt || body.question_text || body.prompt || "",
          focus: nestedQuestion.focus || body.focus || checkpoint,
          intent: nestedQuestion.intent || body.intent || checkpointSpec(checkpoint).intent,
          language: nestedQuestion.language || body.language || context.response_language || "ko",
          referenced_answers: nestedQuestion.referenced_answers || body.evidence_fields || body.source_evidence || [],
        }
      : {
          ...(effectiveOperation === "generate_questions" ? legacyPlanQuestion : body.question),
          checkpoint,
          focus: checkpoint,
          language: (effectiveOperation === "generate_questions" ? legacyPlanQuestion?.language : body.question?.language) || context.response_language || "ko",
          referenced_answers: context.fixed_narratives?.map((item) => item.id) || [],
        };
    const question = decorateAdaptiveQuestion(rawQuestion, checkpoint, context, provider);
    if (!validateAdaptiveQuestion(question, checkpoint)) throw new Error("AI_INVALID_ADAPTIVE_QUESTION");
    return {
      decision: "ask",
      question,
      coverage: body.coverage || { checkpoint, sufficient: false },
      reason: body.reason || compatibilityMode,
      source: provider,
      run: {
        status: "success",
        provider,
        model: body.model || null,
        checkpoint,
        operation: effectiveOperation,
        compatibility_mode: compatibilityMode,
        prompt_version: body.prompt_version || ADAPTIVE_PROMPT_VERSION,
        latency_ms: Math.round(performance.now() - started),
        usage: body.usage || null,
      },
    };
  } catch (error) {
    const result = fallback();
    result.run = { status: "fallback", provider: "api", checkpoint, error_code: error.message, latency_ms: Math.round(performance.now() - started) };
    return result;
  }
}

function inferredS(answers = {}) {
  const direct = answers.depth_s;
  if (VALID_AXIS_VALUES.S.has(direct) && AXIS_LABELS[direct]) return direct;
  if (["SHIFTED"].includes(answers.creative_work_state) || ["PUBLIC_ROLE_SHIFT"].includes(answers.public_activity_state)) return "S3";
  if (["PAUSED", "CLOSED", "AUDIENCE_DISTANCED"].includes(answers.creative_work_state) || ["BOTH_PAUSED", "NOT_WANTED", "AUDIENCE_PAUSED"].includes(answers.public_activity_state)) return "S4";
  if (["STEADY", "SEASONAL", "RESEARCH_RECORD", "AUDIENCE_ACTIVE", "AUDIENCE_OCCASIONAL"].includes(answers.creative_work_state) || ["MAKING_AND_SHOWING", "MAKING_NOT_SHOWING", "SHOWING_PROJECT_BASED", "AUDIENCE_REGULAR", "AUDIENCE_OCCASIONAL", "AUDIENCE_ONLINE"].includes(answers.public_activity_state)) return "S2";
  if (["AUDIENCE_DISCOVERY"].includes(answers.pause_meaning)) return "S1";
  if (["TRANSITION", "AUDIENCE_CHANGE"].includes(answers.pause_meaning)) return "S3";
  if (["REST", "DISTANCE", "CLOSURE"].includes(answers.pause_meaning)) return "S4";
  if (["PREPARATION", "LONG_RESEARCH", "AUDIENCE_DAILY_INTEREST", "AUDIENCE_SHARED", "AUDIENCE_HYBRID"].includes(answers.pause_meaning)) return "S2";
  if (["ROLE_CHANGED", "ROLE_SHIFT"].includes(answers.activity_state) || answers.visibility_state === "ROLE_SHIFT") return "S3";
  if (["PACE_ADJUSTED", "DISTANCED"].includes(answers.activity_state) || ["LIFE_ADJUSTED", "DISTANCED"].includes(answers.visibility_state)) return "S4";
  if (["ACTIVE_MAIN", "ACTIVE_PARALLEL", "PROJECT_BASED"].includes(answers.activity_state) || ["VISIBLE_ACTIVE", "ACTIVE_LESS_VISIBLE", "PROJECT_ONLY"].includes(answers.visibility_state)) return "S2";
  return null;
}

function adaptiveAxisFromTurns(axis, turns = [], answers = {}) {
  const values = turns
    .filter((turn) => turn.axis === axis)
    .map((turn) => answers[turn.self_check_field])
    .filter((value) => VALID_AXIS_VALUES[axis].has(value) && AXIS_LABELS[value]);
  return values.at(-1) || null;
}

function isLowInformationText(value) {
  const text = redactExcerpt(value, 260).replace(/\s+/g, " ").trim();
  if (!text) return true;
  if (text.length < 5) return true;
  if (/^(없음|없어요|모름|모르겠음|잘 모르겠어요|해당 없음|ㅇ+|ㅋ+|ㅎ+|[.·,_-]+)$/i.test(text)) return true;
  const compact = text.replace(/[^가-힣A-Za-z0-9]/g, "");
  return compact.length < 4 || new Set(compact).size < 2;
}

function sentenceExcerpt(value, fallback = "") {
  const text = redactExcerpt(value, 220).replace(/\s+/g, " ").trim();
  return isLowInformationText(text) ? fallback : text;
}

export function buildAdaptiveRuleSummary({ answers = {}, turns = [] } = {}) {
  const isAudience = answers.route === "AUDIENCE" || answers.response_position === "AUDIENCE_CITIZEN";
  const m = answers.memory_type === "NO_RECALL" ? null : (adaptiveAxisFromTurns("M", turns, answers) || (AXIS_LABELS[answers.m_declared] ? answers.m_declared : null));
  const s = adaptiveAxisFromTurns("S", turns, answers) || inferredS(answers);
  const d = adaptiveAxisFromTurns("D", turns, answers) || (AXIS_LABELS[answers.d_desired_change_primary] ? answers.d_desired_change_primary : null);
  const firstInformative = (...candidates) => {
    for (const candidate of candidates) {
      const excerpt = sentenceExcerpt(candidate);
      if (excerpt) return excerpt;
    }
    return "";
  };
  const memory = firstInformative(answers.memory_meaning_text, answers.memory_clue_text);
  // NO_RECALL is not an absent answer: it can contain the participant's present
  // relationship to culture and the arts, without inventing a recalled work.
  const present = firstInformative(answers.no_recall_relation_text, answers.pause_context_text, answers.transition_text, answers.invisible_continuity_text);
  const condition = firstInformative(answers.desired_change_text, answers.support_conditions_text, answers.d_context_evidence_text, answers.d_context_impact_text);
  const parts = [];
  if (memory && present) parts.push(isAudience
    ? `“${memory}”로 남은 기억은 지금 “${present}”라고 표현한 문화예술과의 관계 변화로 이어져 있습니다.`
    : `“${memory}”로 남은 기억은 지금 “${present}”라고 표현한 활동과 역할의 변화로 이어져 있습니다.`);
  else if (memory) parts.push(`“${memory}”로 남은 장면이 이번 기록의 출발점입니다.`);
  else if (present) parts.push(isAudience
    ? `현재에는 “${present}”라고 표현한 문화예술과의 관계 변화가 중심에 있습니다.`
    : `현재에는 “${present}”라고 표현한 활동과 역할의 변화가 중심에 있습니다.`);
  if (condition) parts.push(`이 흐름을 앞으로 이어가기 위해서는 “${condition}”라고 적은 조건이 중요합니다.`);
  if (!parts.length && [m, s, d].some(Boolean)) {
    const axisText = [m && AXIS_LABELS[m], s && AXIS_LABELS[s], d && AXIS_LABELS[d]].filter(Boolean).join(", ");
    parts.push(`이번 응답에서는 ${axisText}에 가까운 판단이 함께 나타났습니다.`);
  }
  const summary = parts.slice(0, 4).join(" ") || "응답에서 반복된 단서와 선택을 한 문장으로 단정하기 어려워, 참여자가 직접 확인할 수 있도록 원래 답변을 중심으로 남겨두었습니다.";
  return {
    summary,
    summary_ko: summary,
    axes: { m, s, d },
    secondary_axes: { m: null, s: null, d: null },
    evidence: {
      m: ["M02", "M04_TEXT", ...turns.filter((turn) => turn.axis === "M").map((turn) => turn.id)],
      s: ["NO_RECALL_RELATION", "P14", "P15", "P16", "P11", "P12", "P13_TEXT", "P19", "P19_TEXT", ...turns.filter((turn) => turn.axis === "S").map((turn) => turn.id)],
      d: ["D02_TEXT", "D04", ...turns.filter((turn) => turn.axis === "D").map((turn) => turn.id)],
    },
    uncertainty: [m, s, d].some((value) => !value) ? "일부 방향은 참여자의 추가 확인이 필요해요." : null,
    source: "rules",
  };
}

export function buildAdaptiveSummaryContext({ response, turns = [], answers = {} }) {
  const fixedResponses = fixedResponsesForAI(response);
  const narratives = [
    ["memory_scene", answers.memory_clue_text],
    ["memory_meaning", answers.memory_meaning_text],
    ["current_cultural_relation", answers.no_recall_relation_text],
    ["state_background", answers.pause_context_text],
    ["transition", answers.transition_text],
    ["invisible_continuity", answers.invisible_continuity_text],
    ["support_conditions", answers.support_conditions_text],
    ["desired_change", answers.desired_change_text],
    ["condition_impact", answers.d_context_evidence_text || answers.d_context_impact_text],
  ].map(([id, value]) => ({ id, text: redactExcerpt(value, 1600) })).filter((item) => !isLowInformationText(item.text));
  return {
    response_id: response.response_id,
    client_request_id: crypto.randomUUID(),
    route: response.route,
    coordinate_scope: response.coordinate_scope,
    interview_mode: "adaptive_contextual",
    prompt_version: ADAPTIVE_PROMPT_VERSION,
    response_language: response.source_language || "ko",
    role_group: response.answers?.role_group_primary || null,
    role: response.answers?.role_primary || null,
    role_primary: response.answers?.role_primary || null,
    role_primary_label: response.answers?.role_primary_local_title || roleLabel(response.answers?.role_primary, response.answers || {}),
    roles_parallel: Array.isArray(response.answers?.roles_parallel) ? response.answers.roles_parallel.slice(0, 3) : [],
    roles_parallel_labels: Array.isArray(response.answers?.roles_parallel) ? response.answers.roles_parallel.slice(0, 3).map((value) => roleLabel(value, response.answers || {}, { parallel: true })).filter(Boolean) : [],
    response_position: response.answers?.response_position || null,
    d_scope: response.answers?.d_scope || null,
    participant_context: response.participant_context || compactParticipantContext(response.answers || {}),
    // Preserve every fixed-question ID for strict evidence validation without
    // sending the same narrative again as question, answer, and display text.
    evidence_ids: fixedResponses.map((item) => item.id),
    summary_purpose: "participant_record",
    fixed_narratives: narratives,
    fixed_signals: {
      m_declared: answers.m_declared || null,
      activity_state: answers.activity_state || null,
      visibility_state: answers.visibility_state || null,
      creative_work_state: answers.creative_work_state || null,
      public_activity_state: answers.public_activity_state || null,
      pause_context_tags: Array.isArray(answers.pause_context_tags) ? answers.pause_context_tags : [],
      pause_meaning: answers.pause_meaning || null,
      transition_state: answers.transition_state || null,
      invisible_continuity_state: answers.invisible_continuity_state || null,
      support_conditions: Array.isArray(answers.support_conditions) ? answers.support_conditions : [],
      d_current_gap: answers.d_current_gap || null,
      d_desired_change_primary: answers.d_desired_change_primary || null,
    },
    adaptive_turns: adaptiveHistory(turns, answers),
  };
}

function compactSummaryText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").replace(/[“”"'‘’,.?!;:()[\]{}-]/g, "").trim();
}

export function isTranscriptLikeAdaptiveSummary(summary, context = {}) {
  const compactSummary = compactSummaryText(summary);
  if (!compactSummary) return false;
  const sourceNarratives = Array.isArray(context.fixed_narratives) ? context.fixed_narratives : [];
  const copiedNarratives = sourceNarratives
    .map((item) => compactSummaryText(item?.text))
    .filter((text) => text.length >= 60 && compactSummary.includes(text));
  return copiedNarratives.length >= 2;
}

export async function createAdaptiveSummary({ endpoint, anonKey, mode = "fallback", context, answers = {}, turns = [], fetchImpl = fetch, timeoutMs = 20000 }) {
  if (mode === "mock") return { ...buildAdaptiveRuleSummary({ answers, turns }), source: "mock_api", run: { status: "success", provider: "mock", operation: "summarize_adaptive", real_motif_pass: false } };
  if (mode !== "live" || !endpoint) return safeFinalSummaryFailure("FINAL_SUMMARY_NOT_CONFIGURED");
  const started = performance.now();
  const clientRequestId = String(context?.client_request_id || "").trim() || null;
  try {
    const adaptiveResult = await requestAiJson({ endpoint, anonKey, operation: "summarize_adaptive", context, fetchImpl, timeoutMs });
    let body = adaptiveResult.body;
    let compatibilityMode = null;
    let effectiveOperation = "summarize_adaptive";

    if (!adaptiveResult.ok && shouldTryLegacyOperation(adaptiveResult)) {
      const legacyResult = await requestAiJson({
        endpoint,
        anonKey,
        operation: "summarize",
        context: adaptiveLegacySummaryContext(context, answers, turns),
        fetchImpl,
        timeoutMs,
      });
      if (!legacyResult.ok) throw apiResponseError(legacyResult);
      body = legacyResult.body;
      compatibilityMode = "legacy_summarize";
      effectiveOperation = "summarize";
    } else if (!adaptiveResult.ok) {
      throw apiResponseError(adaptiveResult);
    }

    const summary = String(body.summary || "").trim();
    if (summary.length < 20 || !/[가-힣A-Za-z0-9]/.test(summary)) throw new Error("AI_INVALID_ADAPTIVE_SUMMARY");
    if (isTranscriptLikeAdaptiveSummary(summary, context)) throw new Error("AI_SUMMARY_TRANSCRIPT_LIKE");
    const axes = Object.fromEntries(["m", "s", "d"].map((key) => {
      const axis = key.toUpperCase();
      const value = body.axes?.[key];
      return [key, VALID_AXIS_VALUES[axis].has(value) && AXIS_LABELS[value] ? value : null];
    }));
    const provider = API_SOURCES.has(body.provider) ? body.provider : "api";
    const serverSource = String(body.source || provider || "api").toLowerCase();
    const requestId = body.request_id || adaptiveResult.request_id || null;
    const verifiedMotif = provider === "motif" && serverSource === "motif";
    return {
      summary,
      summary_ko: body.summary_ko || body.korean_translation || (context.response_language === "ko" ? summary : null),
      axes,
      secondary_axes: body.secondary_axes || {},
      evidence: body.evidence || {},
      uncertainty: body.uncertainty || null,
      source: verifiedMotif ? "motif" : serverSource,
      request_id: requestId,
      run: {
        status: "success",
        source: verifiedMotif ? "motif" : serverSource,
        provider,
        model: body.model || null,
        request_id: requestId,
        client_request_id: clientRequestId,
        client_request_id_sent: clientRequestId,
        client_request_id_returned: body.client_request_id || null,
        client_request_id_match: Boolean(clientRequestId && body.client_request_id === clientRequestId),
        operation: effectiveOperation,
        compatibility_mode: compatibilityMode,
        prompt_version: body.prompt_version || ADAPTIVE_PROMPT_VERSION,
        http_status: adaptiveResult.status,
        latency_ms: body.latency_ms ?? Math.round(performance.now() - started),
        usage: body.usage || null,
        real_motif_pass: Boolean(verifiedMotif && requestId && clientRequestId && body.client_request_id === clientRequestId),
      },
    };
  } catch (error) {
    const result = safeFinalSummaryFailure(error?.message || "FINAL_SUMMARY_FAILED");
    result.run = {
      ...result.run,
      status: "failed",
      source: "safe_failure",
      provider: null,
      error_code: error?.message || "FINAL_SUMMARY_FAILED",
      latency_ms: Math.round(performance.now() - started),
      operation: "summarize_adaptive",
      real_motif_pass: false,
    };
    return result;
  }
}

export async function translateResponseSummary({ endpoint, anonKey, mode = "fallback", text, sourceLanguage = "ko", fetchImpl = fetch, timeoutMs = 20000 }) {
  const original = redactExcerpt(text, 1800);
  if (!original) return { translation_ko: "", run: { status: "skipped", provider: "rules" } };
  if (sourceLanguage === "ko") return { translation_ko: original, run: { status: "success", provider: "identity" } };
  if (mode !== "live" || !endpoint) return { translation_ko: "", run: { status: "fallback", provider: "unavailable", error_code: "TRANSLATION_NOT_CONFIGURED" } };
  const started = performance.now();
  try {
    const response = await withTimeout(fetchImpl(endpoint, {
      method: "POST",
      headers: authHeaders(anonKey),
      body: JSON.stringify({ operation: "translate_summary", context: { source_language: sourceLanguage, target_language: "ko", text: original, prompt_version: ADAPTIVE_PROMPT_VERSION } }),
    }), timeoutMs);
    if (!response.ok) throw new Error(`AI_HTTP_${response.status}`);
    const body = await response.json();
    const translation = String(body.translation_ko || body.korean_translation || body.summary_ko || "").trim();
    if (!translation) throw new Error("AI_INVALID_TRANSLATION");
    const provider = String(body.provider || "api").toLowerCase();
    const serverSource = String(body.source || provider || "api").toLowerCase();
    const verifiedMotif = provider === "motif" && serverSource === "motif";
    return {
      translation_ko: translation,
      run: {
        status: "success",
        source: verifiedMotif ? "motif" : serverSource,
        provider,
        model: body.model || null,
        prompt_version: body.prompt_version || ADAPTIVE_PROMPT_VERSION,
        latency_ms: Math.round(performance.now() - started),
        usage: body.usage || null,
        operation: "translate_summary",
      },
    };
  } catch (error) {
    return { translation_ko: "", run: { status: "fallback", provider: "api", error_code: error.message, latency_ms: Math.round(performance.now() - started), operation: "translate_summary" } };
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
      headers: authHeaders(anonKey),
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
