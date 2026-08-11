import { localizeQuestion, translate } from "./i18n.js";
import { COORDINATE_SCOPE_LABELS, buildCoordinateSnapshots, deriveCoordinateScope, deriveSContextTags } from "./classification.js";
import { buildConnectionProfile, connectionTopics } from "./connection.js";
import { applicableFixedQuestionIds, buildActiveScreens, fixedQuestionIdsForScreen, flowCounts, needsPauseContext, normalizedDScope, resetForRouteChange, sanitizeAnswersForRoute } from "./flow.js";
import { ANCHOR_AXES, ANCHOR_ORDER, ANCHOR_SCREEN_MAP, aggregateAnchorSource, anchorAnswerFingerprint, anchorContextFingerprint, anchorSourceText, anchorsAffectedByChangedQuestion, buildAnchorContext, createAnchorFollowup, isLowInformationText, isStrictRealMotifPass, lowInformationReason, reconcileAnchorTurnsAfterQuestionEdit, upsertAnchorTurn, verifyDomQuestion } from "./anchor-live.js";
import { normalizeIntegratedRoleRecord, shouldShowP13Text, shouldShowP19Text, translationReuseDecision } from "./integration-r2-helpers.js";
import { ADAPTIVE_CHECKPOINTS, DEPTH_AXIS_OPTIONS, buildAdaptiveContext, buildAdaptiveSummaryContext, buildDepthTurnContext, buildMinimalDepthContext, buildMinimalSummaryContext, createAdaptiveSummary, createAdaptiveTurn, createDepthPlan, createDepthQuestion, createDepthSummary, translateResponseSummary } from "./depth.js";
import { QUESTION_METADATA } from "./question-map.js";
import { createEnvelope, readOutbox, retryOutbox, sendEnvelope, splitResearchAndContact } from "./storage.js";
import { RESPONSE_DOCUMENT_VERSION, buildResponseDocument, renderResponseDocument } from "./response-document.js";
import { EXHIBITION_OPEN_CALL, buildExhibitionApplicationPayload, createDefaultExhibitionApplication, validateExhibitionApplication } from "./exhibition-application.js";
import { ledWordmark, mohoHouseMark } from "../brand-lockup.js";

const root = document.querySelector("#root");
const schemaUrl = "./src/v13/over39_questionnaire_schema_v1.3.1-draft.json";
const depthBankUrl = "./src/v13/approved-depth-question-bank.json";
const edition = document.body.dataset.edition || "pilot";
const isRc2 = edition === "rc2";
const releaseVersion = isRc2 ? "rc2-v0.4.5-5anchor-realapi-integrated-r2-2026-08-09" : "rc1-2026-08-03";
const draftKey = `over39-${edition}-draft`;
const pendingKey = `over39-${edition}-pending-submission`;
const connectionKey = (responseId) => `over39-v13-connection-${responseId}`;
const exhibitionKey = (responseId) => `over39-v13-exhibition-${responseId}`;
const referralKey = (responseId) => `over39-v13-referral-${responseId}`;
const googleAppsScriptUrl = String(window.OVER39_GOOGLE_APPS_SCRIPT_URL || "").trim();
const submitFunctionUrl = String(window.OVER39_SUPABASE_SUBMIT_URL || "").trim();
const aiFunctionUrl = String(window.OVER39_SUPABASE_AI_URL || "").trim();
const supabaseAnonKey = String(window.OVER39_SUPABASE_ANON_KEY || "").trim();
const globalGreetingsEnabled = window.OVER39_GLOBAL_GREETINGS_ENABLED === true;
const aiMode = String(window.OVER39_AI_MODE || "fallback").trim();
const liveAiEnabled = aiMode === "live" && Boolean(aiFunctionUrl);
const isApiDepthSource = (source) => ["openai", "motif", "api"].includes(source);
const query = new URLSearchParams(window.location.search);
const institutionCode = String(query.get("institution") || "").trim().slice(0, 80);
const acquisitionSource = String(query.get("source") || "direct").trim().slice(0, 80);
const sampleType = institutionCode ? "institution_review" : query.get("sample") === "research" ? "research" : "test";

let schema;
let depthBank;
let state = { phase: "loading", step: 0, answers: {}, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId: null, language: "ko", feedback: {}, referralStatus: null };

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const values = (value) => Array.isArray(value) ? value : value ? [value] : [];
const question = (id) => localizeQuestion(state.language, schema.questions.find((item) => item.id === id));
const storedField = (item) => item?.store?.[0] || item?.id;
const answerFor = (id) => state.answers[storedField(question(id)) || id];
const setAnswer = (id, value) => { state.answers[storedField(question(id)) || id] = value; saveDraft(); };
const optionLabel = (option) => Array.isArray(option) ? option[1] : option?.label || option;
const optionValue = (option) => Array.isArray(option) ? option[0] : option?.value || option;
const depthOutcomeFields = ["depth_plan", "depth_source", "depth_m", "depth_m_text", "depth_s", "depth_s_text", "depth_d", "depth_d_text", "depth_summary", "depth_ai_runs", "adaptive_turns", "adaptive_checkpoint_status", "adaptive_ai_runs", "adaptive_detected_language", "reflection_action", "participant_revision", "participant_approved_text", "participant_approved_text_ko", "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "document_confirmation_ack", "document_confirmed_at", "response_document_draft"];
function clearDepthOutcome() { depthOutcomeFields.forEach((field) => delete state.answers[field]); }
function clearReflectionOutcome() {
  ["depth_summary", "depth_ai_runs", "reflection_action", "participant_revision", "participant_approved_text", "participant_approved_text_ko", "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "document_confirmation_ack", "document_confirmed_at", "response_document_draft"].forEach((field) => delete state.answers[field]);
}
function clearAdaptiveAnchor(checkpoint, { clearReflection = true } = {}) {
  if (!isRc2) { clearDepthOutcome(); return; }
  const removedTurns = adaptiveTurns().filter((turn) => turn.checkpoint === checkpoint);
  removedTurns.forEach((turn) => {
    if (turn.answer_field) delete state.answers[turn.answer_field];
    if (turn.self_check_field) delete state.answers[turn.self_check_field];
  });
  const keptTurns = adaptiveTurns().filter((turn) => turn.checkpoint !== checkpoint);
  if (keptTurns.length) state.answers.adaptive_turns = keptTurns;
  else delete state.answers.adaptive_turns;
  const statuses = Object.fromEntries(Object.entries(state.answers.adaptive_checkpoint_status || {}).filter(([key]) => key !== checkpoint));
  if (Object.keys(statuses).length) state.answers.adaptive_checkpoint_status = statuses;
  else delete state.answers.adaptive_checkpoint_status;
  const runs = values(state.answers.adaptive_ai_runs).filter((run) => (run.checkpoint || run.anchor_id) !== checkpoint);
  if (runs.length) state.answers.adaptive_ai_runs = runs;
  else delete state.answers.adaptive_ai_runs;
  state.answers.depth_source = aggregateAnchorSource(values(state.answers.adaptive_ai_runs)) || null;
  if (clearReflection) clearReflectionOutcome();
}


// The local language comes first. The remaining languages follow ISO language-code order.
const languages = [
  ["ko", "한국어"],
  ["en", "English"],
  ["ja", "日本語"],
  ["zh-Hans", "简体中文"],
  ["zh-Hant", "繁體中文"],
  ["nl", "Nederlands"],
  ["es", "Español"],
  ["fr", "Français"],
  ["ms", "Bahasa Melayu"],
];
const researchContactEmail = "over39@localexpressdaegu.org";
const greetingSenderName = "〈만 39세 이상〉 안부의 좌표";
const greetingSenderEmail = "hello@localexpressdaegu.org";
const creditRows = [["주최·주관", "북성로사진관(대안공간 모호주택)"], ["총괄기획", "이생강"], ["연구 협력", "Local Express Daegu"], ["후원", "한국문화예술위원회"]];
const t = (text) => translate(state.language, text);


// Conceptual choices use a short heading followed by one complete sentence.
// Factual choices such as age, language, names and yes/no remain compact.
const CHOICE_COPY_KO = {
  P06: {
    ACTIVE_MAIN: "주된 활동 — 현재 이 활동을 생활의 중심에 두고 이어가고 있습니다.",
    ACTIVE_PARALLEL: "다른 일과 함께 — 다른 일과 역할을 함께 맡으며 이 활동을 이어가고 있습니다.",
    PROJECT_BASED: "프로젝트 중심 — 프로젝트가 열리는 시기에 맞추어 활동을 이어가고 있습니다.",
    ROLE_CHANGED: "역할의 변화 — 이전과 다른 역할이나 방식으로 활동을 이어가고 있습니다.",
    PACE_ADJUSTED: "속도 조절 — 잠시 쉬거나 생활의 리듬에 맞추어 활동의 속도를 조절하고 있습니다.",
    DISTANCED: "현장과의 거리 — 현재는 문화예술 현장과 조금 거리를 두며 관계를 다시 살피고 있습니다.",
    AUDIENCE_SELF_DIRECTED: "스스로 찾아보기 — 관심이 생긴 작품과 프로그램을 직접 찾아보며 문화예술을 만나고 있습니다.",
    AUDIENCE_WITH_OTHERS: "사람을 따라 만나기 — 친구와 가족, 수업과 추천을 통해 문화예술을 만나고 있습니다.",
    AUDIENCE_CROSS_MEDIA: "여러 매체로 만나기 — 영화와 공연, 웹툰과 디자인, 온라인 콘텐츠를 오가며 문화예술을 만나고 있습니다.",
    AUDIENCE_EVENT_BASED: "행사가 있을 때 참여 — 전시와 프로그램이 열리는 시기에 맞추어 참여하고 있습니다.",
    AUDIENCE_PACE_ADJUSTED: "관람 속도 조절 — 한동안 자주 찾았고, 지금은 생활의 리듬에 맞추어 속도를 조절하고 있습니다.",
    AUDIENCE_RELATION_CHANGED: "만나는 방식의 변화 — 이전과 다른 경로와 태도로 문화예술을 만나고 있습니다.",
    MIXED: "여러 상태가 함께 있음 — 지금의 상태를 한 가지 흐름으로 정하기 어렵습니다.",
  },
  P07: {
    VISIBLE_ACTIVE: "활동과 발표 — 활동과 외부 발표가 함께 이어졌습니다.",
    ACTIVE_LESS_VISIBLE: "보이지 않는 지속 — 활동은 이어졌고 외부 발표의 횟수는 줄었습니다.",
    ROLE_SHIFT: "역할과 방식의 변화 — 역할과 매체, 활동 방식이 이전과 다르게 움직였습니다.",
    PROJECT_ONLY: "프로젝트 단위의 활동 — 특정 프로젝트가 열리는 시기에 활동했습니다.",
    LIFE_ADJUSTED: "생활에 맞춘 속도 — 생활과 돌봄, 건강과 다른 일에 맞추어 활동의 속도를 조절했습니다.",
    DISTANCED: "현장과의 거리 — 한동안 문화예술 현장과 거리를 두며 다른 생활과 역할에 무게를 두었습니다.",
    AUDIENCE_VISIBLE_ACTIVE: "관심과 현장 참여 — 관심과 실제 현장 참여가 함께 이어졌습니다.",
    AUDIENCE_INTEREST_LESS_VISIT: "이어진 관심 — 관심은 이어졌고 실제 방문의 횟수는 줄었습니다.",
    AUDIENCE_ONLINE_SHIFT: "온라인과 기록 — 온라인과 출판, 영상을 통해 만나는 비중이 커졌습니다.",
    AUDIENCE_COMPANION_BASED: "함께하는 참여 — 친구와 가족, 학교와 함께할 때 주로 참여했습니다.",
    AUDIENCE_CONDITION_ADJUSTED: "조건에 맞춘 참여 — 비용과 일정, 이동 여건에 맞추어 참여했습니다.",
    AUDIENCE_DISTANCED: "현장과의 거리 — 한동안 문화예술 현장과 거리를 두며 다른 생활과 역할에 무게를 두었습니다.",
    UNKNOWN: "여러 흐름이 함께 있음 — 지금까지의 변화를 한 가지 흐름으로 정하기 어렵습니다.",
  },
  P11: {
    CLEAR: "분명한 시점 — 활동이나 역할이 달라졌다고 느낀 구체적인 시점이 있습니다.",
    GRADUAL: "서서히 달라짐 — 여러 경험과 변화가 겹치며 조금씩 달라졌습니다.",
    MULTIPLE: "여러 번의 변화 — 활동과 역할이 서로 다른 시기에 여러 차례 바뀌었습니다.",
    CONTINUED: "비슷한 흐름 — 큰 전환 없이 익숙한 방식과 리듬이 이어졌습니다.",
    UNSURE: "아직 정하기 어려움 — 지금은 변화의 시점이나 방향을 한 가지로 말하기 어렵습니다.",
    SKIP: "건너뛰기",
  },
  P13: {
    YES: "보이지 않는 지속 — 밖에서 잘 보이지 않은 시기에도 이어온 일이 있었습니다.",
    MIXED: "이어짐과 멈춤 — 이어간 일과 멈춘 시기가 함께 있었습니다.",
    NO: "떠오르기 어려움 — 그 시기에 이어온 일을 지금은 구체적으로 떠올리기 어렵습니다.",
    UNSURE: "아직 정하기 어려움 — 지금은 그 이어짐을 한 가지 상태로 말하기 어렵습니다.",
  },
  P14: {
    STEADY: "꾸준한 지속 — 작업이나 핵심 활동을 비교적 꾸준히 이어가고 있습니다.",
    SEASONAL: "상황에 따른 지속 — 시기와 생활의 상황에 맞추어 활동을 이어가고 있습니다.",
    RESEARCH_RECORD: "준비와 기록 — 준비와 조사, 기록을 중심으로 활동이나 관심을 이어가고 있습니다.",
    PAUSED: "잠시 쉬는 상태 — 현재는 작업이나 핵심 활동의 속도를 낮추고 있습니다.",
    SHIFTED: "다른 역할과 방식 — 이전과 다른 역할이나 방식으로 활동과 관심을 이어가고 있습니다.",
    CLOSED: "한 활동의 마무리 — 작품 제작이나 해당 활동을 한 차례 마무리했다고 느낍니다.",
    AUDIENCE_ACTIVE: "꾸준한 관람과 참여 — 문화예술을 비교적 꾸준히 찾아보고 참여하고 있습니다.",
    AUDIENCE_OCCASIONAL: "상황에 따른 참여 — 시기와 생활의 상황에 맞추어 문화예술을 만나고 있습니다.",
    AUDIENCE_DISTANCED: "현장과의 거리 — 현재는 문화예술 현장과 거리를 두고 있습니다.",
    MIXED: "여러 상태가 함께 있음 — 지금의 상태를 한 가지 흐름으로 정하기 어렵습니다.",
  },
  P15: {
    MAKING_AND_SHOWING: "제작과 공개 — 제작과 외부 공개 활동이 함께 이어지고 있습니다.",
    MAKING_NOT_SHOWING: "공개 밖의 제작 — 제작이나 핵심 활동은 이어지고, 외부 공개 활동은 쉬고 있습니다.",
    SHOWING_PROJECT_BASED: "프로젝트 단위의 공개 — 프로젝트가 열리는 시기에 공개 활동을 이어가고 있습니다.",
    PUBLIC_ROLE_SHIFT: "공개 역할의 변화 — 발표와 전시 외의 역할을 통해 활동이 밖으로 드러나고 있습니다.",
    BOTH_PAUSED: "제작과 공개의 휴식 — 제작과 공개 활동을 모두 잠시 쉬고 있습니다.",
    NOT_WANTED: "개인적인 지속 — 현재는 공개 일정을 두지 않고 자신의 방식으로 활동을 이어가고 있습니다.",
    AUDIENCE_REGULAR: "꾸준한 현장 참여 — 전시와 프로그램에 비교적 꾸준히 참여하고 있습니다.",
    AUDIENCE_OCCASIONAL: "상황에 따른 현장 참여 — 시기와 생활의 상황에 맞추어 참여하고 있습니다.",
    AUDIENCE_ONLINE: "온라인과 기록 — 온라인과 출판, 기록을 중심으로 문화예술을 만나고 있습니다.",
    AUDIENCE_PAUSED: "관람과 참여의 휴식 — 현재는 관람과 참여를 잠시 쉬고 있습니다.",
    MIXED: "여러 상태가 함께 있음 — 지금의 공개와 참여 상태를 한 가지 흐름으로 정하기 어렵습니다.",
  },
  P16: {
    LIVELIHOOD: "생계와 다른 일 — 생계와 다른 일의 비중이 현재 활동 방식에 영향을 주고 있습니다.",
    CARE: "돌봄과 가족 — 돌봄과 가족을 함께 돌보는 생활이 현재 활동 방식에 영향을 주고 있습니다.",
    HEALTH: "건강과 에너지 — 건강과 회복에 필요한 에너지가 현재 활동과 참여에 영향을 주고 있습니다.",
    COST: "비용 — 제작과 발표, 이동에 필요한 비용이 현재 활동 방식에 영향을 주고 있습니다.",
    SPACE: "공간 — 작업과 연습, 보관에 필요한 공간이 현재 활동 방식에 영향을 주고 있습니다.",
    ADMIN: "행정과 역할 부담 — 행정과 여러 역할의 비중이 현재 활동 방식에 영향을 주고 있습니다.",
    OPPORTUNITY: "발표와 참여 기회 — 전시와 발표, 참여 기회의 범위가 현재 활동 방식에 영향을 주고 있습니다.",
    RELATIONSHIP: "관계와 협업 — 관계망과 협업의 조건이 현재 활동 방식에 영향을 주고 있습니다.",
    REGION: "지역과 이동 — 지역의 문화환경과 이동 가능성이 현재의 활동과 경험에 영향을 주고 있습니다.",
    DIRECTION: "방향을 살필 여유 — 작업의 방향을 충분히 생각할 수 있는 여유가 현재 활동에 영향을 주고 있습니다.",
    CHOICE: "개인의 우선순위 — 개인이 선택한 관심과 우선순위가 현재의 활동과 경험에 영향을 주고 있습니다.",
    DAILY_SCHEDULE: "일상의 일정 — 일과 학업, 생활의 일정이 문화예술 참여에 영향을 주고 있습니다.",
    COST_MOVE: "비용과 이동 — 관람 비용과 이동 여건이 문화예술 참여에 영향을 주고 있습니다.",
    COMPANION: "함께 갈 사람 — 문화예술을 함께 만날 사람의 유무가 참여 방식에 영향을 주고 있습니다.",
    INFORMATION: "정보 — 작품과 프로그램을 알게 되는 정보의 범위가 참여에 영향을 주고 있습니다.",
    LANGUAGE_GUIDE: "언어와 설명 — 작품을 이해할 수 있는 언어와 안내 방식이 참여에 영향을 주고 있습니다.",
    COMFORT: "공간의 편안함 — 낯선 공간에 들어갈 때 느끼는 편안함이 참여에 영향을 주고 있습니다.",
    ONLINE: "온라인 경로 — 온라인에서 작품과 프로그램을 만날 수 있는 경로가 참여에 영향을 주고 있습니다.",
    OTHER: "다른 조건 — 목록에 없는 다른 조건을 직접 적을 수 있습니다.",
  },
  P17: {
    REST: "회복과 정비 — 활동의 속도를 낮추며 몸과 생활, 작업의 균형을 다시 살피고 있습니다.",
    PREPARATION: "준비와 탐구 — 다음 작업이나 활동을 위해 조사하고 기록하며 방향을 다듬고 있습니다.",
    LONG_RESEARCH: "지속과 축적 — 바깥에 자주 드러나지 않아도 조사와 제작, 관심을 꾸준히 쌓고 있습니다.",
    TRANSITION: "전환 — 역할과 방식, 관심의 중심이 달라지며 새로운 방향을 만들어가고 있습니다.",
    DISTANCE: "거리와 재조정 — 문화예술 현장과의 거리를 두며 앞으로의 관계를 다시 살피고 있습니다.",
    CLOSURE: "마무리와 이동 — 한 활동을 정리하고 다른 역할이나 관심으로 이동하고 있습니다.",
    UNDECIDED: "여러 상태가 함께 있음 — 지금의 관계를 한 가지 상태로 정하기 어렵습니다.",
    AUDIENCE_DAILY_INTEREST: "일상 속 관심 — 전시장을 자주 찾지 않아도 문화예술에 대한 관심이 생활 속에서 이어지고 있습니다.",
    AUDIENCE_DISCOVERY: "새로운 발견 — 익숙한 분야에서 벗어나 새로운 작품과 장르를 찾아보고 있습니다.",
    AUDIENCE_SHARED: "함께 나누는 관계 — 다른 사람과 보고 이야기하고 추천하며 문화예술을 만나고 있습니다.",
    AUDIENCE_HYBRID: "온라인과 현장의 교차 — 온라인, 출판, 영상과 실제 현장을 오가며 문화예술을 만나고 있습니다.",
    AUDIENCE_CHANGE: "취향과 관점의 변화 — 좋아하는 것과 바라보는 기준이 달라지며 새로운 관심이 생기고 있습니다.",
  },
  P19: {
    PEOPLE: "사람과 동료 — 함께한 사람과 동료가 활동과 관심을 이어가는 기반이 되었습니다.",
    AUDIENCE: "관객과 참여자 — 관객과 참여자의 반응과 만남이 활동을 이어가는 기반이 되었습니다.",
    SPACE: "공간과 프로그램 — 활동하거나 문화예술을 만날 수 있는 공간과 프로그램이 기반이 되었습니다.",
    INCOME: "생활을 지탱하는 소득 — 생활을 이어갈 수 있는 소득이 활동의 기반이 되었습니다.",
    OTHER_WORK: "다른 일과 역할 — 함께 맡아온 다른 일과 역할이 생활과 활동을 지탱했습니다.",
    INSTITUTION: "기관과 지원 — 기관과 지원의 기회가 활동을 이어가는 기반이 되었습니다.",
    REGION: "지역의 관계와 환경 — 지역의 사람과 공간, 환경이 활동과 관심을 이어가는 기반이 되었습니다.",
    EDUCATION: "교육과 배움 — 교육과 연구, 배움의 경험이 활동과 관심을 이어가는 기반이 되었습니다.",
    RECORD: "기록과 자료 — 사진과 글, 자료와 아카이브가 기억과 활동을 이어가는 기반이 되었습니다.",
    FAMILY_CARE: "가족과 돌봄 — 가족과 돌봄의 관계가 생활과 활동을 지탱했습니다.",
    MEMORY: "오래 남은 기억 — 기억에 남은 작품과 질문이 관심과 활동을 이어가는 기반이 되었습니다.",
    SELF_PACE: "스스로 지킨 속도 — 자신의 상황에 맞추어 조절한 속도와 선택이 지속의 기반이 되었습니다.",
    TIME_COST_MOVE: "일정과 비용, 이동 — 일정과 비용, 이동의 여유가 문화예술 참여를 이어가는 기반이 되었습니다.",
    GUIDE: "정보와 안내 — 이해하기 쉬운 정보와 안내가 문화예술을 다시 찾는 기반이 되었습니다.",
    ONLINE_MEDIA: "온라인과 매체 — 온라인과 출판, 영상이 문화예술을 이어서 만나는 기반이 되었습니다.",
    RECOMMENDATION: "다른 사람의 추천 — 다른 사람이 건넨 추천이 새로운 작품과 공간을 만나는 계기가 되었습니다.",
    NONE: "지금은 떠오르지 않음 — 현재는 특별히 떠오르는 기반을 정하기 어렵습니다.",
    OTHER: "다른 기반 — 목록에 없는 다른 기반을 직접 적을 수 있습니다.",
  },
  M01: {
    ARTIST: "한 명의 작가 — 지금 가장 먼저 떠오르는 한 사람에서 이야기를 시작합니다.",
    WORK_OBJECT: "한 작품·물건·이미지 — 형태나 이미지가 선명하게 남아 있는 대상에서 시작합니다.",
    SPACE: "하나의 공간 — 오래 남아 있는 전시장과 작업실, 거리와 장소에서 시작합니다.",
    EXHIBITION: "하나의 전시·프로그램 — 전시와 공연, 프로그램 전체에 관한 기억에서 시작합니다.",
    SCENE: "하나의 장면 — 사람의 모습과 움직임, 빛과 소리가 남아 있는 순간에서 시작합니다.",
    PHRASE: "남아 있는 문장 — 작품이나 사람에게서 들은 말과 글에서 시작합니다.",
    SENSATION: "이름 붙이기 어려운 감각 — 정확한 이름보다 먼저 떠오르는 느낌에서 시작합니다.",
    PRACTICE: "오래 이어진 태도와 관심 — 나의 작업과 활동, 취향 속에서 오래 남아 있는 것에서 시작합니다.",
    NO_RECALL: "지금의 거리감 — 특별한 대상이 떠오르지 않는 현재의 느낌에서 시작합니다.",
  },
  M05: {
    WORK: "작품과 이미지 — 작품의 형태나 이미지가 이 기억과 함께 남아 있습니다.",
    ATTITUDE: "작가의 태도 — 작업을 대하는 사람의 태도가 이 기억과 함께 남아 있습니다.",
    DIALOGUE: "당시의 대화 — 그때 나눈 말과 대화가 이 기억과 함께 남아 있습니다.",
    SPACE: "공간의 분위기 — 장소의 빛과 소리, 분위기가 이 기억과 함께 남아 있습니다.",
    PEOPLE: "함께 있던 사람 — 그 순간을 함께 경험한 사람이 이 기억과 함께 남아 있습니다.",
    RECORD: "기록과 자료 — 사진과 도록, 포스터와 기사가 이 기억과 함께 남아 있습니다.",
    SOCIAL: "지역과 사회의 상황 — 당시 지역과 사회의 상황이 이 기억과 함께 남아 있습니다.",
    LIFE: "그때의 삶 — 당시 나의 생활과 관계가 이 기억과 함께 남아 있습니다.",
    SENSORY: "설명하기 어려운 감각 — 말로 정리하기 어려운 감각이 이 기억과 함께 남아 있습니다.",
    UNKNOWN: "아직 정하기 어려움 — 지금은 함께 남아 있는 것을 한 가지로 정하기 어렵습니다.",
  },
  M08: {
    DIRECT: "현장에서 직접 — 그 장소에서 작품이나 사건을 직접 경험했습니다.",
    HEARD: "사람의 이야기를 통해 — 작가나 관계자가 들려준 이야기를 통해 경험했습니다.",
    RECORD: "기록을 통해 — 사진과 도록, 기사와 영상을 통해 경험했습니다.",
    ONLINE: "온라인을 통해 — 웹사이트와 온라인 플랫폼을 통해 경험했습니다.",
    MIXED: "여러 방식으로 — 직접 경험과 여러 기록이 함께 남아 있습니다.",
    UNCLEAR: "기억의 방식이 흐림 — 기억이 흐려져 경험한 경로를 분명하게 나누기 어렵습니다.",
  },
  M09: {
    OWN_ACTIVITY: "나의 활동과 연결 — 이 기억은 나의 활동이나 작업과 직접 이어져 있습니다.",
    COLLAB: "함께한 작업 — 이 사람이나 대상과 함께 작업하거나 협업한 경험이 있습니다.",
    PEER: "동료의 자리 — 동료나 같은 현장의 관계에서 활동을 지켜보았습니다.",
    EDU_RESEARCH_MEDIA: "교육·연구·취재 — 교육과 연구, 취재의 과정에서 이 대상을 만났습니다.",
    AUDIENCE: "관객과 참여자의 자리 — 관객이나 프로그램 참여자로 이 경험을 만났습니다.",
    RECORD_ONLY: "기록과 전언 — 기록이나 다른 사람의 이야기를 통해 이 대상을 알게 되었습니다.",
    PERSONAL: "개인적인 관계 — 문화예술 활동과 함께 개인적인 관계도 이어져 있습니다.",
    MIXED: "여러 관계가 함께 있음 — 이 기억과의 관계를 한 가지로 정하기 어렵습니다.",
  },
  R01: {
    INTERVIEW: "인터뷰 — 대화를 통해 경험과 기억을 조금 더 자세히 이어갑니다.",
    EXHIBITION: "전시 — 작품과 기록을 전시의 자리에서 다시 만납니다.",
    PUBLICATION: "출판 — 글과 이미지, 자료를 출판물의 형태로 이어갑니다.",
    CRITIC_RESEARCH: "비평과 연구 — 작품과 경험을 비평과 연구의 언어로 이어갑니다.",
    ARCHIVE: "온라인 아카이브 — 자료와 이야기를 온라인에서 찾아볼 수 있도록 이어갑니다.",
    ROUNDTABLE: "라운드테이블 — 여러 참여자가 함께 모여 경험과 조건을 이야기합니다.",
    AUDIO_VIDEO: "음성·영상 기록 — 목소리와 장면을 음성과 영상의 형태로 이어갑니다.",
    INTERNATIONAL_DIALOGUE: "다른 지역과의 대화 — 다른 지역과 국가의 사람들과 경험을 나눕니다.",
    UNKNOWN: "아직 정하기 어려움 — 다음에 이어질 모습을 지금은 한 가지로 정하기 어렵습니다.",
  },
};

const CONDITION_AXIS_TITLES = {
  D1: "접근·참여",
  D2: "개인의 기반",
  D3: "관계·매개",
  D4: "제도·구조",
};

function choiceDisplayLabel(id, value, rawLabel) {
  if (state.language !== "ko") return String(t(rawLabel) || "");
  const override = CHOICE_COPY_KO[id]?.[value];
  if (override) return override;
  if ((id === "D01" || id === "D02") && CONDITION_AXIS_TITLES[value]) {
    const title = CONDITION_AXIS_TITLES[value];
    const clean = String(rawLabel || "").trim().replace(/[.。]$/, "");
    const sentence = id === "D01"
      ? `현재 활동과 참여에서 ${clean} 조건을 크게 체감하고 있습니다.`
      : `가장 바라는 변화는 ${clean}입니다.`;
    return `${title} — ${sentence}`;
  }
  return String(rawLabel || "");
}

// API에는 내부 코드만 보내지 않고, 참여자가 실제로 본 질문과 선택 문장을 함께 보냅니다.
function apiQuestionText(id, q) {
  if (!q) return id;
  if (id === "M02" && noRecall()) return q.text_no_recall || q.text;
  if (id === "M04" && noRecall()) return q.text_no_recall || q.text;
  if (["M05", "M06", "M07", "M08", "M09", "M10"].includes(id) && noRecall()) return q.text_no_recall || q.text_audience || q.text;
  if (isAudienceContext()) return q.text_audience || q.text || q.text_professional || id;
  return q.text_professional || q.text || id;
}

function apiOptionsForQuestion(id, q) {
  if (!q) return [];
  if (id === "D01") return dOptions("gap");
  if (id === "D02") return dOptions("desired");
  if (id === "D03") return realityOptions();
  if (id === "M03") return schema.branch_followup?.[state.answers.memory_type]?.options || q.options || [];
  if (id === "M04") return noRecall() ? (q.options_no_recall || q.options || []) : (q.options || []);
  if (id === "M01") return isAudienceContext() ? (q.options_audience || q.options || []) : (q.options || []);
  if (id === "R01") return isAudienceContext() ? (q.options_audience || q.options || []) : (q.options || []);
  if (q.options_audience || q.options_professional) return isAudienceContext() ? (q.options_audience || q.options_professional || []) : (q.options_professional || q.options_audience || []);
  return Array.isArray(q.options) ? q.options : [];
}

function apiAnswerDisplay(id, answer) {
  if (answer === null || answer === undefined || answer === "") return null;
  const q = question(id);
  const options = apiOptionsForQuestion(id, q);
  const displayOne = (value) => {
    if (value && typeof value === "object") return String(value.label || value.name || value.value || JSON.stringify(value));
    const found = options.find((option) => String(optionValue(option)) === String(value));
    if (found) return choiceDisplayLabel(id, optionValue(found), optionLabel(found));
    return String(value);
  };
  return Array.isArray(answer) ? answer.map(displayOne).filter(Boolean).join(" / ") : displayOne(answer);
}

const rc2QuestionPurposes = {
  P01: "오늘 이야기를 어디에서 시작할지 고릅니다. 진행하면서 다른 경험도 함께 이야기할 수 있어요.",
  DOCUMENT_IDENTITY: "참여 기록에 사용할 표기를 직접 정합니다.",
  P01_CONTEXT: "이 기억을 어떤 자리에서 말하고 있는지 이해하면 뒤의 질문이 더 정확하게 이어집니다.",
  ROLE_GROUP: "지금의 경험을 어떤 역할과 위치에서 말하고 있는지 기록합니다.",
  ROLE_PRIMARY: "이번 답변의 중심이 되는 역할을 함께 남깁니다.",
  ROLE_PARALLEL: "한 사람 안에 함께 이어지는 역할과 경험의 폭을 살핍니다.",
  PROFILE: "응답이 놓인 생활과 지역의 맥락을 함께 기록합니다.",
  M01: "오늘 이야기의 출발점이 될 사람, 작업, 공간, 장면 또는 감각을 고릅니다.",
  M02: "정확한 이름보다 먼저 남아 있는 장면을 참여자의 언어로 기록합니다.",
  M03: "선택한 대상에서 무엇이 먼저 떠오르는지 조금 더 구체화합니다.",
  M04: "선택지를 고르기 전에, 이 기억이 오래 남은 이유를 자신의 말로 먼저 남깁니다.",
  M05: "하나의 의미로 다 설명되지 않는 경험도 함께 기록합니다.",
  AI_ANCHOR_M04_TEXT: "방금 적은 기억의 이유에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
  MEMORY_TIME: "기억이 놓인 시간과 지역을 함께 기록합니다.",
  MEMORY_EVIDENCE: "그 경험을 어떤 거리와 방식으로 만났는지 살핍니다.",
  MEMORY_TO_PRESENT: "기억의 대상을 묻던 흐름이 왜 지금의 당신에게 이어지는지 설명합니다.",
  ACTIVITY: "지금 문화예술과 연결되는 방식과 활동의 리듬을 기록합니다.",
  PRACTICE_PUBLIC_STATE: "평소 이어지는 관심과 실제 활동·관람·참여의 상태를 나누어 기록합니다.",
  STATE_BACKGROUND: "현재의 활동과 참여 방식에 함께 작용한 생활·관계·환경을 살핍니다.",
  TRANSITION: "연령, 지원, 역할 또는 참여 방식이 달라진 시점과 실제 변화를 듣습니다.",
  CONTINUITY: "공개된 자리 밖에서도 이어진 작업, 관심, 기억과 관계를 남깁니다.",
  SUPPORT_CONDITIONS: "활동과 참여, 기억을 이어지게 한 사람·공간·경제적 기반·기록의 조건을 남깁니다.",
  AI_ANCHOR_P12: "달라진 장면에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
  AI_ANCHOR_P13_TEXT: "보이지 않는 지속의 문장에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
  AI_ANCHOR_P19_TEXT: "실제로 작동한 조건의 문장에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
  D01: "현재 가장 크게 체감하고 있는 조건을 확인합니다.",
  D02: "현재 조건과 구분해, 앞으로 먼저 달라지기를 바라는 변화를 기록합니다.",
  D03: "선택한 변화가 어떤 현실에서 비롯되는지 살핍니다.",
  D04: "그 조건이 실제 활동과 기억, 관계에 남긴 영향을 듣습니다.",
  AI_ANCHOR_D02_TEXT: "바라는 변화의 문장에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
  R01: "이 기억과 경험이 연구 이후 어떤 모습으로 이어지면 좋을지 살핍니다.",
  COMMUNITY: "이번 응답에서 함께 남기고 싶은 다른 이름이나 장면이 있는지 선택해서 기록합니다.",
  REFLECTION_REVIEW: "앞선 답변을 바탕으로 정리한 문장을 참여자가 직접 확인하고 고치는 자리입니다.",
  SUBMIT: "참여 기록이 닿은 세 방향을 직접 확인하는 자리입니다.",
  USE_SCOPE: "정책연구에서 사용할 범위를 참여자가 직접 선택합니다.",
};

const rc2QuestionTopics = {
  CONSENT: "참여 안내", P01: "시작 위치", DOCUMENT_IDENTITY: "참여자 표기", P01_CONTEXT: "기억의 위치",
  ROLE_GROUP: "역할 범주", ROLE_PRIMARY: "주요 역할", ROLE_PARALLEL: "함께하는 역할", PROFILE: "생활과 지역",
  M01: "기억", M02: "장면", M03: "초점", M04: "이유", AI_ANCHOR_M04_TEXT: "한 걸음 더", M05: "남은 단서",
  MEMORY_TIME: "시간", MEMORY_EVIDENCE: "경험 방식", MEMORY_TO_PRESENT: "현재",
  ACTIVITY: "현재의 연결", PRACTICE_PUBLIC_STATE: "현재 상태", STATE_BACKGROUND: "현재에 작용한 현실",
  TRANSITION: "변화", AI_ANCHOR_P12: "한 걸음 더", CONTINUITY: "보이지 않는 지속", AI_ANCHOR_P13_TEXT: "한 걸음 더", SUPPORT_CONDITIONS: "이어지게 한 기반", AI_ANCHOR_P19_TEXT: "한 걸음 더", D01: "현재 조건", D02: "바라는 변화", AI_ANCHOR_D02_TEXT: "한 걸음 더",
  D03: "현실 경험", D04: "영향", R01: "이어갈 방식", COMMUNITY: "다른 이름",
  REFLECTION_REVIEW: "응답 정리", SUBMIT: "세 방향 확인", USE_SCOPE: "활용 범위",
};

const rc2Phases = {
  CONSENT: "참여 안내와 선택",
  P01: "기록의 출발점",
  DOCUMENT_IDENTITY: "참여 기록의 표기",
  P01_CONTEXT: "기억을 말하는 자리",
  ROLE_GROUP: "현재 역할의 범위",
  ROLE_PRIMARY: "이번 응답의 중심 역할",
  ROLE_PARALLEL: "함께 이어지는 역할",
  PROFILE: "생활과 지역의 배경",
  M01: "기억의 출발점",
  AI_ANCHOR_M04_TEXT: "기억의 이유에서 이어진 질문",
  M02: "남아 있는 한 장면",
  M03: "장면의 초점",
  M04: "오래 남은 이유",
  M05: "함께 남은 단서",
  MEMORY_TIME: "기억의 시간과 지역",
  MEMORY_EVIDENCE: "경험한 방식과 관계",
  MEMORY_TO_PRESENT: "기억에서 현재로",
  ACTIVITY: "현재의 연결 방식",
  PRACTICE_PUBLIC_STATE: "활동과 참여의 현재",
  STATE_BACKGROUND: "현재 상태를 만든 조건",
  AI_ANCHOR_P12: "달라진 장면에서 이어진 질문",
  AI_ANCHOR_P13_TEXT: "보이지 않는 지속에서 이어진 질문",
  AI_ANCHOR_P19_TEXT: "실제로 작동한 조건에서 이어진 질문",
  TRANSITION: "달라진 시점과 장면",
  CONTINUITY: "보이지 않는 지속",
  SUPPORT_CONDITIONS: "실제로 지지해 온 조건",
  D01: "먼저 살펴볼 조건",
  D02: "먼저 달라졌으면 하는 장면",
  AI_ANCHOR_D02_TEXT: "바라는 변화에서 이어진 질문",
  D03: "변화가 필요한 현실의 맥락",
  D04: "그 조건이 남긴 영향",
  R01: "다음에 이어질 모습",
  COMMUNITY: "다른 이름이나 장면을 더 남길지 선택",
  REFLECTION_REVIEW: "응답 요지 확인과 수정",
  SUBMIT: "세 방향과 참여 기록 확인",
  USE_SCOPE: "정책연구 활용 범위",
};

const RC2_STAGES = [
  { id: "start", label: "시작" },
  { id: "memory", label: "기억" },
  { id: "present", label: "현재" },
  { id: "conditions", label: "조건" },
  { id: "document", label: "참여 기록" },
];


function saveDraft() {
  if (state.phase === "survey") {
    localStorage.setItem(draftKey, JSON.stringify({
      answers: state.answers,
      step: state.step,
      screenId: activeScreens()[state.step] || null,
      releaseVersion,
      language: state.language,
      responseId: state.responseId,
      feedback: state.feedback,
      savedAt: new Date().toISOString(),
    }));
  }
}

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(draftKey) || "null"); } catch { return null; }
}

function clearDraft() { localStorage.removeItem(draftKey); }
function savePending(response) { localStorage.setItem(pendingKey, JSON.stringify(response)); }
function loadPending() { try { return JSON.parse(localStorage.getItem(pendingKey) || "null"); } catch { return null; } }
function defaultConnection() {
  return {
    greeting_id: crypto.randomUUID(),
    opt_in: "",
    message_audience: "",
    message_text: "",
    receive_opt_in: "",
    receive_scopes: [],
    greeting_connection_preference: "",
    translation_allowed: "YES",
    needs: [],
    offers: [],
    reply_modes: [],
    visibility: "RESEARCHER_ONLY",
    contact_permission: "",
    contact_email: "",
    introduction: "",
  };
}

function loadConnection() { try { return JSON.parse(localStorage.getItem(connectionKey(state.responseId || state.submitted?.response_id)) || "null") || defaultConnection(); } catch { return defaultConnection(); } }
function getConnection() { state.connection = state.connection || loadConnection(); return state.connection; }
function saveConnection() { if (state.responseId || state.submitted?.response_id) localStorage.setItem(connectionKey(state.responseId || state.submitted?.response_id), JSON.stringify(getConnection())); }

function loadExhibitionApplication() {
  try {
    return JSON.parse(localStorage.getItem(exhibitionKey(state.responseId || state.submitted?.response_id)) || "null") || createDefaultExhibitionApplication();
  } catch {
    return createDefaultExhibitionApplication();
  }
}
function getExhibitionApplication() { state.exhibition = state.exhibition || loadExhibitionApplication(); return state.exhibition; }
function saveExhibitionApplication() {
  if (state.responseId || state.submitted?.response_id) {
    localStorage.setItem(exhibitionKey(state.responseId || state.submitted?.response_id), JSON.stringify(getExhibitionApplication()));
  }
}

function locationValues(value, max = 3) {
  return String(value || "").split(/[\n;]/).map((item) => item.trim()).filter(Boolean).slice(0, max).map((label) => {
    if (/^(online|온라인)$/i.test(label)) return { country_code: "", city: "", online: true, label };
    const [country, city = ""] = label.split(",").map((part) => part.trim());
    return { country_code: country, city, online: false, label };
  });
}

function isProfessionalContext() {
  return ["SELF", "BOTH"].includes(state.answers.route) || state.answers.response_position === "PROFESSIONAL";
}
function isAudienceContext() {
  return state.answers.route === "AUDIENCE" || state.answers.response_position === "AUDIENCE_CITIZEN";
}
function isCreatorApplicant(answers = state.answers) {
  const creatorRoles = new Set(["R01", "R02", "R03"]);
  return creatorRoles.has(answers.role_primary) || values(answers.roles_parallel).some((role) => creatorRoles.has(role));
}
function noRecall() { return state.answers.memory_type === "NO_RECALL"; }
function hasDContext() { return values(state.answers.d_context_tags).some((value) => value !== "NONE"); }

function activeScreens() {
  return buildActiveScreens(state.answers, { adaptive: isRc2 });
}

function rc2StageIndex(id) {
  const startScreens = new Set(["CONSENT", "P01", "DOCUMENT_IDENTITY", "P01_CONTEXT", "ROLE_GROUP", "ROLE_PRIMARY", "ROLE_PARALLEL", "PROFILE"]);
  const memoryScreens = new Set(["M01", "M02", "M03", "M04", "AI_ANCHOR_M04_TEXT", "M05", "MEMORY_TIME", "MEMORY_EVIDENCE"]);
  const presentScreens = new Set(["MEMORY_TO_PRESENT", "ACTIVITY", "PRACTICE_PUBLIC_STATE", "STATE_BACKGROUND", "TRANSITION", "AI_ANCHOR_P12", "CONTINUITY", "AI_ANCHOR_P13_TEXT", "SUPPORT_CONDITIONS", "AI_ANCHOR_P19_TEXT"]);
  const conditionScreens = new Set(["D01", "D02", "AI_ANCHOR_D02_TEXT", "D03", "D04", "R01", "COMMUNITY"]);
  if (startScreens.has(id)) return 1;
  if (memoryScreens.has(id)) return 2;
  if (presentScreens.has(id)) return 3;
  if (conditionScreens.has(id)) return 4;
  return 5;
}

function progressMeta(id) {
  const screens = activeScreens();
  const fixedIds = applicableFixedQuestionIds(state.answers, { adaptive: isRc2 });
  if (isRc2) {
    const currentIndex = Math.max(0, screens.indexOf(id));
    const priorFixed = screens.slice(0, currentIndex).flatMap((screen) => fixedQuestionIdsForScreen(screen, state.answers, { adaptive: true }));
    const currentFixed = fixedQuestionIdsForScreen(id, state.answers, { adaptive: true });
    const startNumber = priorFixed.length + 1;
    const endNumber = priorFixed.length + currentFixed.length;
    const count = currentFixed.length
      ? `${t("질문")} ${startNumber}${currentFixed.length > 1 ? `–${endNumber}` : ""} / ${fixedIds.length}`
      : adaptiveScreenCheckpoint[id]
        ? t("연결 질문")
        : id === "REFLECTION_REVIEW" || id === "SUBMIT" || id === "USE_SCOPE" ? t("기록 정리") : "";
    const progressBase = currentFixed.length ? endNumber : priorFixed.length;
    return {
      label: rc2QuestionTopics[id] || rc2Phases[id] || "기록",
      count,
      progress: Math.min(100, Math.round((progressBase / Math.max(1, fixedIds.length)) * 100)),
      stageIndex: rc2StageIndex(id),
      stageCount: RC2_STAGES.length,
      stageLabel: RC2_STAGES[rc2StageIndex(id) - 1]?.label || "참여 기록",
    };
  }
  const depthStage = { DEPTH_M: 1, DEPTH_S: 2, DEPTH_D: 3 }[id];
  if (depthStage) return { label: "DEPTH INTERVIEW", count: `${depthStage} / 3`, progress: 100 };
  const currentIndex = screens.indexOf(id);
  const completedIds = screens.slice(0, currentIndex + 1).flatMap((screen) => fixedQuestionIdsForScreen(screen, state.answers, { adaptive: false }));
  const count = completedIds.filter((questionId) => fixedIds.includes(questionId)).length;
  return { label: "FIXED RESEARCH", count: `${count} / ${fixedIds.length}`, progress: Math.round((count / Math.max(1, fixedIds.length)) * 100) };
}

function renderRc2StageProgress(meta) {
  if (!isRc2) return "";
  const items = RC2_STAGES.map((stage, index) => {
    const number = index + 1;
    const status = number < meta.stageIndex ? "complete" : number === meta.stageIndex ? "current" : "upcoming";
    return `<li class="${status}" ${status === "current" ? 'aria-current="step"' : ""}><span>${number}</span><strong>${esc(t(stage.label))}</strong></li>`;
  }).join("");
  return `<nav class="rc2-stage-progress" aria-label="${esc(t("전체 설문 진행 단계"))}"><div class="rc2-stage-summary"><strong>${esc(t(meta.stageLabel))}</strong><span>${esc(t("기억 · 현재 · 조건"))}</span></div><ol>${items}</ol></nav>`;
}

function dScope() {
  return normalizedDScope(state.answers);
}

function dOptions(kind) {
  const scope = dScope();
  if (scope === "SELF_ROLE") {
    const role = state.answers.role_primary;
    const bank = schema.role_question_bank?.[role];
    const labels = bank?.[kind === "gap" ? "d01_options" : "d02_options"];
    return (labels || []).map((label, index) => [`D${index + 1}`, label]);
  }
  return schema.d_scope_bank?.[scope]?.[kind] || [];
}

function roleOptions(groupCode) {
  return schema.roles.filter((role) => role.group === groupCode).map((role) => [role.value, role.label]);
}

function realityOptions() {
  const scope = dScope();
  const key = scope === "SELF_ROLE" ? state.answers.role_primary || "OTHER" : scope;
  const indicators = (schema.role_reality_indicator_bank?.[key] || schema.role_reality_indicator_bank?.OTHER || []).filter((label) => !/기타.*직접/.test(label));
  return indicators.map((label, index) => [`${key}_${String(index + 1).padStart(2, "0")}`, label]).concat([["NONE", "해당 없음"], ["OTHER", "기타"]]);
}

function renderChoices(id, options, { multi = false, max = 0, exclusive = [] } = {}) {
  const current = values(answerFor(id));
  const atMax = multi && max && current.length >= max;
  return `<div class="choice-list">${options.map((option) => {
    const value = optionValue(option);
    const selected = current.includes(value);
    const blocked = Boolean(atMax && !selected && !exclusive.includes(value));
    const rawLabel = String(optionLabel(option) || "");
    const localizedLabel = t(choiceDisplayLabel(id, value, rawLabel));
    const parts = localizedLabel.split(/\s+—\s+/, 2);
    const copy = parts.length > 1
      ? `<div class="choice-copy"><strong>${esc(parts[0])}</strong><small>${esc(parts[1])}</small></div>`
      : `<div class="choice-copy"><strong>${esc(localizedLabel)}</strong></div>`;
    return `<button class="choice ${selected ? "selected" : ""} ${blocked ? "blocked" : ""}" type="button" data-choice-id="${esc(id)}" data-choice="${esc(value)}" data-multi="${multi}" data-max="${max}" data-exclusive="${esc(exclusive.join(","))}" aria-pressed="${selected}" aria-disabled="${blocked}"><span aria-hidden="true">${selected ? "✓" : ""}</span>${copy}</button>`;
  }).join("")}</div>`;
}

function renderText(id, { placeholder = "짧게 적어도 괜찮습니다.", multiline = true, label = "", field = "", value = undefined, maxChars = null } = {}) {
  const inputId = `input-${id}-${field || "default"}`.replaceAll(".", "-");
  const item = question(id);
  const limit = Number(maxChars || item?.max_chars || 800);
  const currentValue = value === undefined ? answerFor(id) || "" : value;
  const fieldAttr = field ? ` data-input-field="${esc(field)}"` : "";
  const input = multiline
    ? `<textarea id="${esc(inputId)}" class="text-input" data-input-id="${esc(id)}"${fieldAttr} maxlength="${limit}" placeholder="${esc(t(placeholder))}">${esc(currentValue)}</textarea>`
    : `<input id="${esc(inputId)}" class="text-input text-input-single" data-input-id="${esc(id)}"${fieldAttr} value="${esc(currentValue)}" placeholder="${esc(t(placeholder))}" />`;
  return `<div class="text-field">${label ? `<label class="text-field-label" for="${esc(inputId)}">${esc(t(label))}</label>` : ""}${input}${multiline ? `<span class="text-field-meta">${esc(t(`최대 ${limit}자`))}</span>` : ""}</div>`;
}

function renderOtherInput(id, label = "기타 내용을 짧게 적어주세요.") {
  const item = question(id);
  const selected = values(answerFor(id));
  if (!selected.includes("OTHER")) return "";
  const field = item?.store?.[1];
  return field ? renderText(id, { multiline: false, label, field, value: state.answers[field] || "" }) : "";
}

function approvedReflectionText(answers = state.answers) {
  const summary = answers.depth_summary?.summary?.trim() || "";
  if (answers.reflection_action === "ACCEPT") return summary;
  if (["EDIT", "REWRITE"].includes(answers.reflection_action)) return answers.participant_revision?.trim() || "";
  return answers.participant_approved_text?.trim() || summary;
}

function responseSourceLanguage(answers = state.answers) {
  return answers.adaptive_detected_language || answers.depth_detected_language || state.language || "ko";
}

function clearDocumentConfirmation() {
  ["participant_approved_text", "participant_approved_text_ko", "document_confirmation_ack", "document_confirmed_at", "response_document_draft"].forEach((field) => delete state.answers[field]);
}

function buildCurrentResponseDocument({ final = false, confirmedAt = null } = {}) {
  const approvedOriginal = state.answers.participant_approved_text || approvedReflectionText();
  const sourceLanguage = responseSourceLanguage();
  return buildResponseDocument({
    responseId: state.responseId,
    answers: sanitizeAnswersForRoute(state.answers),
    sourceLanguage,
    releaseVersion,
    approvedOriginal,
    approvedKorean: state.answers.participant_approved_text_ko || (sourceLanguage === "ko" ? approvedOriginal : ""),
    createdAt: state.answers.response_document_created_at || new Date().toISOString(),
    confirmedAt,
    final,
  });
}

function processingSignal(label = "답변을 정리하고 있어요") {
  return `<div class="quiet-processing" role="status" aria-live="polite"><span class="quiet-processing-mark" aria-hidden="true"><i></i><i></i><i></i></span><p>${esc(t(label))}</p></div>`;
}

async function prepareApprovedTranslation() {
  const original = approvedReflectionText();
  if (!original) return;
  state.answers.participant_approved_text = original;
  const sourceLanguage = responseSourceLanguage();
  const reuse = translationReuseDecision({
    action: state.answers.reflection_action,
    sourceLanguage,
    approvedText: original,
    summary: state.answers.depth_summary?.summary,
    summaryKo: state.answers.depth_summary?.summary_ko,
  });
  if (reuse.reuse) {
    state.answers.participant_approved_text_ko = reuse.translation;
    state.answers.response_document_created_at = state.answers.response_document_created_at || new Date().toISOString();
    saveDraft();
    return;
  }
  state.translationGenerating = true;
  render(false);
  const translated = await translateResponseSummary({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, text: original, sourceLanguage });
  state.answers.participant_approved_text_ko = translated.translation_ko || "";
  state.answers.depth_ai_runs = [...values(state.answers.depth_ai_runs), { ...translated.run, operation: "translate_summary" }];
  state.answers.response_document_created_at = state.answers.response_document_created_at || new Date().toISOString();
  state.translationGenerating = false;
  saveDraft();
}

function purposeForScreen(id = activeScreens()[state.step]) {
  return isRc2 ? rc2QuestionPurposes[id] || "" : "";
}

function screenHeading(title, help = "", purpose = purposeForScreen()) {
  const id = activeScreens()[state.step];
  const topic = isRc2 ? rc2QuestionTopics[id] : "";
  const localizedTitle = t(title);
  const heading = topic && !String(title).includes("—") ? `${t(topic)} — ${localizedTitle}` : localizedTitle;
  const kicker = isRc2 ? "" : `<div class="interview-kicker">PUBLIC MEMORY INTERVIEW · INSTITUTION RC1</div>`;
  const purposeBlock = !isRc2 && purpose ? `<div class="question-purpose"><span>이 질문이 살피는 내용</span><p>${esc(t(purpose))}</p></div>` : "";
  return `<div class="interview-head"><div class="interview-copy">${kicker}<h2 id="question-title" tabindex="-1">${esc(heading)}</h2>${help ? `<p>${esc(t(help))}</p>` : ""}${purposeBlock}</div></div><div class="answer-panel">`;
}

function renderConsent() {
  if (isRc2) {
    const recordGuide = t("답변은 마지막에 〈만 39세 이상〉 참여 기록으로 정리됩니다. 정리된 문장은 직접 읽고 고칠 수 있습니다.");
    const policyGuide = t("정책연구 활용 범위는 마지막 화면에서 선택합니다. 전시 공모와 안부·연락은 별도의 경로로 이어집니다.");
    return `${screenHeading("설문의 흐름과 기록 방식을 먼저 살펴봅니다.", "기억·현재·조건의 세 구간을 지나며, 앞선 답변에서 이어지는 질문이 함께 나타납니다.")}
      <div class="participation-guide">
        <p>${esc(recordGuide)}</p>
        <p>${esc(policyGuide)}</p>
      </div>
      ${renderChoices("RC01", [["YES", "안내 내용을 확인했습니다. 이 설문에 참여합니다."]])}`;
  }
  return `${screenHeading("이 조사의 목적과 참여 방식을 확인해 주세요.", "기억은 사라진 이름과 장면을 다시 불러오는 시작입니다.")}
    ${renderChoices("RC01", [["YES", question("RC01").text]])}
    ${renderChoices("RC02", [["YES", question("RC02").text]])}`;
}

function renderRoute() {
  const q = question("P01");
  const help = isRc2
    ? "가장 가까운 항목을 골라주세요. 이후 질문은 이 선택에 맞춰 이어집니다."
    : "이번 이야기를 시작할 자리를 고릅니다.";
  const audienceNote = state.answers.route === "AUDIENCE"
    ? `<div class="v13-notice audience-listening-note"><p>${esc(t("당신이 기억하고 있는 장면과 생각을 들려주세요. 그 이야기를 차분히 듣고 기록하겠습니다."))}</p></div>`
    : "";
  return `${screenHeading(q.text, help)}${renderChoices("P01", q.options)}${audienceNote}`;
}

function renderDocumentIdentity() {
  const mode = state.answers.display_name_mode;
  const q1 = question("ID01");
  const q2 = question("ID02");
  return `${screenHeading(q1.text, "실명, 닉네임, 이니셜, 익명 가운데 편한 방식을 골라주세요. 연락처와는 분리해 보관합니다.")}
    ${renderChoices("ID01", q1.options)}
    ${mode && mode !== "ANONYMOUS" ? renderText("ID02", { multiline: false, field: "display_name", value: state.answers.display_name || "", label: q2.text, placeholder: mode === "INITIALS" ? "예: T.K." : "참여 기록에 표시할 표기" }) : ""}`;
}

function renderPracticePublicState() {
  const creative = question("P14");
  const publicActivity = question("P15");
  const audience = isAudienceContext();
  const title = audience ? "현재 문화예술과 이어지는 방식을 살펴볼게요." : "현재의 활동과 공개된 모습을 나누어 살펴볼게요.";
  const help = audience
    ? "평소 찾아보는 관심과 전시·프로그램에 실제로 참여하는 흐름을 나누어 기록합니다."
    : "작업이나 핵심 활동이 이어지는 상태와 전시·발표처럼 밖으로 드러나는 상태를 나누어 기록합니다.";
  return `${screenHeading(title, help)}
    <label class="field-label">${esc(audience ? creative.text_audience : creative.text_professional)}</label>
    ${renderChoices("P14", audience ? creative.options_audience : creative.options_professional)}
    <label class="field-label">${esc(audience ? publicActivity.text_audience : publicActivity.text_professional)}</label>
    ${renderChoices("P15", audience ? publicActivity.options_audience : publicActivity.options_professional)}`;
}

function renderStateBackground() {
  const p16 = question("P16");
  const p17 = question("P17");
  const p18 = question("P18");
  const audience = isAudienceContext();
  const title = audience ? "지금의 관람과 관심 방식에 함께 작용한 조건을 살펴볼게요." : "현재의 활동 방식에 함께 작용한 조건을 살펴볼게요.";
  const help = audience
    ? "일상, 이동, 정보, 함께한 사람과 공간의 분위기 가운데 가까운 내용을 골라주세요."
    : "생활, 역할, 관계와 현장의 조건 가운데 가까운 내용을 골라주세요.";
  const axisBridge = audience ? (p17.help_audience || p17.help || "") : (p17.help || "");
  return `${screenHeading(title, help)}
    <label class="field-label">${esc(audience ? p16.text_audience : p16.text_professional)}</label>${renderChoices("P16", audience ? p16.options_audience : p16.options_professional, { multi: true, max: 5 })}${renderOtherInput("P16", "함께 작용한 다른 조건을 적어주세요.")}
    <label class="field-label">${esc(audience ? p17.text_audience : p17.text_professional)}</label><p class="axis-bridge-note">${esc(axisBridge)}</p>${renderChoices("P17", audience ? p17.options_audience : p17.options_professional)}
    ${renderText("P18", { field: "pause_context_text", value: state.answers.pause_context_text || "", label: audience ? p18.text_audience : p18.text_professional, placeholder: audience ? p18.help_audience : p18.help })}`;
}

function renderSupportConditions() {
  const p19 = question("P19");
  const p19Text = question("P19_TEXT");
  const audience = isAudienceContext();
  const title = audience ? p19.text_audience : p19.text_professional;
  const help = audience
    ? "작품과 프로그램을 다시 찾게 한 사람, 기억, 정보와 환경을 기록해요. 최대 다섯 가지까지 고를 수 있어요."
    : "활동을 실제로 지탱한 사람, 공간, 소득, 기록과 관계를 남겨요. 최대 다섯 가지까지 고를 수 있어요.";
  return `${screenHeading(title, help)}
    ${renderChoices("P19", audience ? p19.options_audience : p19.options_professional, { multi: true, max: 5, exclusive: ["NONE"] })}
    ${renderOtherInput("P19", "직접 적고 싶은 조건을 남겨주세요.")}
    ${shouldShowP19Text(state.answers.support_conditions) ? renderText("P19_TEXT", { field: "support_conditions_text", value: state.answers.support_conditions_text || "", label: audience ? p19Text.text_audience : p19Text.text, placeholder: audience ? p19Text.help_audience : p19Text.help }) : ""}`;
}

function renderResponsePosition() {
  const q = question("P01_CONTEXT");
  return `${screenHeading(q.text, "기억의 위치를 함께 남기면, 뒤의 질문이 경험에 더 맞게 이어집니다.")}${renderChoices("P01_CONTEXT", q.options)}`;
}

function renderRoleGroup() {
  const q = question("P02G");
  return `${screenHeading(q.text, "직군은 연구 결과를 해석하기 위한 맥락입니다. 한 가지만 먼저 골라주세요.")}${renderChoices("P02G", q.options)}`;
}

function renderRolePrimary() {
  const group = state.answers.role_group_primary;
  const q = question("P02");
  return `${screenHeading(q.text, "현재 답변의 중심이 되는 역할을 선택해 주세요.")}${renderChoices("P02", [...roleOptions(group), ["OTHER", "기타"]])}${renderOtherInput("P02", "역할을 직접 적어주세요.")}`;
}

function renderRoleParallel() {
  const q = question("P03");
  const otherRoles = schema.roles.filter((role) => role.value !== state.answers.role_primary).map((role) => [role.value, role.label]);
  return `${screenHeading(q.text, "겸하는 역할이 없으면 ‘없음’을 선택해 주세요.")}${renderChoices("P03", [...otherRoles, ["NON_ARTS", "문화예술 외 역할"], ["NONE", "없음"], ["OTHER", "기타"]], { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("P03", "함께 적고 싶은 역할을 직접 적어주세요.")}`;
}

function renderActivity() {
  const p05 = question("P05");
  const p06 = question("P06");
  const p07 = question("P07");
  const audience = isAudienceContext();
  const heading = audience ? "문화예술을 찾아보고 참여해 온 방식을 알려주세요." : "현재의 활동과 상태를 알려주세요.";
  return `${screenHeading(heading)}
    <label class="field-label">${esc(audience ? p05.text_audience : p05.text_professional)}</label>${renderChoices("P05", p05.options)}
    ${state.answers.activity_duration_band ? renderText("P05_YEAR", { multiline: false, placeholder: "예: 2008", label: question("P05_YEAR").text }) : ""}
    <label class="field-label">${esc(audience ? p06.text_audience : p06.text_professional)}</label>${renderChoices("P06", audience ? p06.options_audience : p06.options_professional)}
    ${!audience && state.answers.activity_state === "ROLE_CHANGED" ? `<label class="field-label">${esc(question("P04").text)}</label>${renderChoices("P04", [...schema.roles.map((role) => [role.value, role.label]), ["NON_ARTS", "문화예술 외 역할"], ["NONE", "없음"], ["OTHER", "기타"]], { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("P04", "이전 역할을 직접 적어주세요.")}` : ""}
    <label class="field-label">${esc(audience ? p07.text_audience : p07.text_professional)}</label>${renderChoices("P07", audience ? p07.options_audience : p07.options_professional)}`;
}

function renderMemoryToPresent() {
  const audience = isAudienceContext();
  const title = audience ? "당신에게 남아 있는 장면과 생각을 들었어요." : "당신에게 남아 있는 장면을 들었어요.";
  const help = audience
    ? "이제 그 경험이 현재의 관심과 선택에 어떻게 이어져 있는지 살펴볼게요."
    : "이제 그 기억이나 활동이 지금의 삶과 어떤 관계에 있는지 살펴볼게요.";
  const body = audience
    ? "당신이 남긴 기억이 지금의 관심과 선택에 어떻게 이어져 있는지 차분히 살펴볼게요."
    : "앞에서 남긴 말을 출발점으로 지금의 활동과 삶에 이어진 내용을 살펴볼게요.";
  return `${screenHeading(title, help, "앞에서 남긴 기억을 품고 있는 현재의 경험을 듣는 자리예요.")}
    <div class="transition-card"><p>${esc(body)}</p></div>`;
}

function renderTransition() {
  const p11 = question("P11");
  const p12 = question("P12");
  const title = isProfessionalContext() ? p11.text_professional : p11.text_audience;
  const stateValue = state.answers.transition_state;
  const showText = stateValue && !["SKIP", "UNSURE"].includes(stateValue);
  return `${screenHeading(title, "분명한 한 시점이 없어도 괜찮아요. 서서히 달라졌거나 여러 번 바뀐 경험도 함께 기록합니다.")}
    ${renderChoices("P11", p11.options)}
    ${showText ? renderText("P12", { field: "transition_text", value: state.answers.transition_text || "", placeholder: "작업, 발표, 역할, 생계, 관계 또는 관람 방식에서 달라진 한 장면", label: p12.text }) : ""}`;
}

function renderContinuity() {
  const p13 = question("P13");
  const p13Text = question("P13_TEXT");
  const audience = isAudienceContext();
  const stateValue = state.answers.invisible_continuity_state;
  const placeholder = audience
    ? "계속 보거나 기억한 것, 다시 찾게 된 계기와 달라진 관계를 적어주세요."
    : "작업, 기록, 공부, 돌봄, 관계, 거리두기, 휴식처럼 가까운 표현으로 적어주세요.";
  const help = audience
    ? "전시장에 자주 가지 않는 때에도 영화, 공연, 만화, 웹툰, 디자인, 온라인 이미지처럼 다른 경로로 관심이 이어질 수 있어요."
    : "발표가 적었던 때에도 작업, 조사, 관계와 생각이 다른 모습으로 이어질 수 있어요.";
  return `${screenHeading(audience ? p13.text_audience : p13.text_professional, help)}
    ${renderChoices("P13", p13.options)}
    ${shouldShowP13Text(stateValue) ? renderText("P13_TEXT", { field: "invisible_continuity_text", value: state.answers.invisible_continuity_text || "", placeholder, label: audience ? p13Text.text_audience : p13Text.text }) : ""}`;
}

function renderProfile() {
  const p08 = question("P08");
  const locations = values(state.answers.activity_locations).map((location) => location.label || location).join("; ");
  return `${screenHeading("지금의 생활과 활동 범위를 알려주세요.", "원하지 않는 항목은 건너뛸 수 있습니다.")}
    <label class="field-label">${esc(p08.text)}</label>${renderChoices("P08", p08.options)}
    ${renderText("P09_COUNTRY", { multiline: false, placeholder: "예: 대한민국", label: "현재 머무는 나라 (선택)", field: "residence_country_code", value: state.answers.residence_country_code || "" })}
    ${renderText("P09_CITY", { multiline: false, placeholder: "예: 대구", label: question("P09").text, field: "residence_city", value: state.answers.residence_city || "" })}
    ${renderText("P10", { multiline: false, placeholder: "예: KR,대구; 온라인", label: isProfessionalContext() ? question("P10").text_professional : question("P10").text_audience, value: locations })}`;
}

function renderMemoryType() {
  const q = question("M01");
  const audience = isAudienceContext();
  const routeQuestion = state.answers.route === "SELF"
    ? "지금까지 해온 활동에서, 현재까지 남아 있는 작업이나 태도, 장면이 있나요?"
    : audience
      ? "문화예술을 경험하며 지금까지 남아 있는 작품이나 장면이 있나요?"
      : state.answers.route === "BOTH"
        ? "나의 활동과 다른 사람에 대한 기억 가운데, 오늘 먼저 이야기하고 싶은 것은 무엇인가요?"
        : q.text;
  const help = audience
    ? "작가 이름이나 작품명이 흐릿해도, 남아 있는 장면에서 시작할 수 있어요."
    : "이름이나 연도가 흐릿해도 괜찮아요. 지금 떠오르는 대상에서 시작합니다.";
  return `${screenHeading(routeQuestion, help)}${renderChoices("M01", audience ? q.options_audience : q.options)}`;
}

function renderMemoryClue() {
  const q = question("M02");
  const audience = isAudienceContext();
  const title = noRecall() ? q.text_no_recall : audience ? q.text_audience : q.text;
  const help = noRecall()
    ? "최근의 거리감, 여러 경험이 섞인 상태, 이름은 흐리지만 남은 느낌을 적어도 좋아요."
    : q.help;
  return `${screenHeading(title, help)}${renderText("M02", { placeholder: noRecall() ? "지금 문화예술을 떠올릴 때 남아 있는 느낌이나 상태" : "한 문장 또는 몇 개의 단어" })}`;
}

function renderBranch() {
  const q = question("M03");
  const type = state.answers.memory_type;
  const follow = schema.branch_followup?.[type];
  if (!follow) return `${screenHeading("기억의 단서를 조금 더 남겨주세요.")}${renderText("M02")}`;
  return `${screenHeading(follow.question)}${renderChoices("M03", follow.options)}`;
}

function renderMeaning() {
  const q = question("M04");
  const note = question("M04_TEXT");
  const title = noRecall() ? q.text_no_recall : q.text;
  const options = noRecall() ? q.options_no_recall : q.options;
  const label = noRecall() ? "지금 떠오르는 상태를 먼저 적어주세요." : note.text;
  const placeholder = noRecall() ? "현재의 거리감이나 남아 있는 느낌" : "먼저 떠오르는 내용을 적어주세요.";
  return `${screenHeading(title, "한 문장으로 적어도 좋아요.")}
    ${renderText("M04_TEXT", { field: "memory_meaning_text", value: state.answers.memory_meaning_text || "", placeholder, label })}
    <label class="field-label">${esc(t("기억의 방향 — 가까운 항목을 골라주세요."))}</label>
    ${renderChoices("M04", options)}`;
}

function renderMeaningTags() {
  const q = question("M05");
  const title = noRecall() ? q.text_no_recall : q.text;
  return `${screenHeading(title, "최대 두 가지까지 선택할 수 있어요.")}${renderChoices("M05", q.options, { multi: true, max: 2 })}`;
}

function renderMemoryTime() {
  const q = question("M06");
  const locations = values(state.answers.memory_locations).map((location) => location.label || location).join("; ");
  const title = noRecall() ? q.text_no_recall : q.text;
  const locationQuestion = question("M07");
  const locationLabel = noRecall() ? locationQuestion.text_no_recall : "장소 — 어디에서 만난 경험인가요?";
  return `${screenHeading(title)}${renderChoices("M06", q.options)}${state.answers.memory_time_band ? renderText("M06_YEAR", { multiline: false, placeholder: "예: 2018", label: "기억나는 연도 (선택)" }) : ""}
  ${renderText("M07", { multiline: false, placeholder: "예: 광주, 전시장 / 온라인", label: locationLabel, value: locations })}`;
}

function renderEvidence() {
  const m08 = question("M08");
  const m09 = question("M09");
  const m10 = question("M10");
  const audience = isAudienceContext();
  const title = audience ? "그 경험이 당신에게 닿은 방식과 관계를 알려주세요." : "이 기억의 경험과 관계를 알려주세요.";
  const m08Text = noRecall() ? m08.text_no_recall : audience ? m08.text_audience : m08.text;
  const m09Text = noRecall() ? m09.text_no_recall : audience ? m09.text_audience : m09.text;
  const m10Text = noRecall() ? m10.text_no_recall : audience ? m10.text_audience : m10.text;
  return `${screenHeading(title)}
    <label class="field-label">${esc(m08Text)}</label>${renderChoices("M08", m08.options, { multi: true, max: 2 })}
    <label class="field-label">${esc(m09Text)}</label>${renderChoices("M09", m09.options)}
    <label class="field-label">${esc(m10Text)}</label>${renderChoices("M10", m10.options)}${renderOtherInput("M10", "관계를 직접 적어주세요.")}`;
}

function renderD1() {
  const focus = question("D_FOCUS");
  const d01 = question("D01");
  const canChooseFocus = state.answers.route === "BOTH" || (state.answers.route === "MEMORY" && state.answers.response_position === "PROFESSIONAL");
  const focusPart = canChooseFocus ? `<label class="field-label">${esc(focus.text)}</label>${renderChoices("D_FOCUS", focus.options)}` : "";
  const options = dOptions("gap");
  const scope = dScope();
  const title = scope === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d01 : scope === "MEMORY_RECONNECT" ? "지금 이 기억을 다시 만나기 위해, 가장 먼저 채워지면 좋겠다고 느끼는 것은 무엇인가요?" : scope === "AUDIENCE" ? "문화예술을 더 가까이 만나기 위해, 지금 가장 아쉽게 느껴지는 것은 무엇인가요?" : "지금 가장 먼저 살펴보고 싶은 조건은 무엇인가요?";
  return `${screenHeading("현재 가장 비어 있다고 느끼는 조건을 골라주세요.")}${focusPart}${dScope() ? `<label class="field-label">${esc(t(title || d01.text))}</label>${renderChoices("D01", options)}` : `<p class="error">${esc(t("변화의 초점을 먼저 선택해 주세요."))}</p>`}`;
}

function renderD2() {
  const d02 = question("D02");
  const d02Text = question("D02_TEXT");
  const options = dOptions("desired");
  const title = options.length && dScope() === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d02 : d02.text;
  if (!isRc2) return `${screenHeading("가장 먼저 바라는 변화를 골라주세요.")}<label class="field-label">${esc(title || d02.text)}</label>${renderChoices("D02", options)}`;
  return `${screenHeading("지금 이 흐름을 이어가거나 다시 움직이기 위해, 가장 먼저 달라졌으면 하는 장면은 무엇인가요?", "무엇이 부족한지와 함께, 지금까지 이어갈 수 있게 해준 조건을 적어도 괜찮아요.")}
    ${renderText("D02_TEXT", { field: "desired_change_text", value: state.answers.desired_change_text || "", placeholder: "가장 먼저 달라졌으면 하는 실제 장면을 적어주세요.", label: d02Text.text })}
    <label class="field-label">${esc(t("방금 적은 내용과 가까운 변화의 방향을 골라주세요."))}</label>
    ${renderChoices("D02", options)}`;
}

function renderD3() {
  const d03 = question("D03");
  const scope = dScope();
  const options = realityOptions();
  const title = scope === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d03 : d03.text;
  return `${screenHeading("그 변화가 필요한 현실의 맥락을 골라주세요.", "지금 답변의 위치에 맞는 조건을 최대 세 가지까지 남길 수 있습니다.")}
    <label class="field-label">${esc(title || d03.text)}</label>${renderChoices("D03", options, { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("D03", "현실의 맥락을 직접 적어주세요.")}`;
}

function renderD4() {
  const q = question("D04");
  const title = hasDContext() ? q.text : "지금까지 적은 조건이 활동, 기억 또는 관계에 남긴 영향을 들려주세요.";
  const help = hasDContext() ? q.help : "한두 문장으로 적어도 좋아요. 지금 떠오르는 영향이 없다면 비워둘 수 있어요.";
  return `${screenHeading(title, help)}${renderText("D04", { placeholder: isAudienceContext() ? "이 조건이 관람, 기억, 공유에 남긴 영향을 적어주세요." : "이 조건이 활동·기억·관계에 남긴 영향을 적어주세요." })}`;
}

function renderReconnect() {
  const q = question("R01");
  const audience = isAudienceContext();
  const help = audience
    ? "지금 남은 기억을 누구와 나누고 어떤 방식으로 다시 만나고 싶은지 기록합니다."
    : "지금의 기억과 경험이 연구 이후 어떤 모습으로 이어지면 좋을지 기록합니다.";
  return `${screenHeading(q.text, help)}${renderChoices("R01", audience ? q.options_audience : q.options, { multi: true, max: 2 })}`;
}

function renderCommunity() {
  const c00 = question("C00");
  const c01 = question("C01");
  const c02 = question("C02");
  const c03 = question("C03");
  const yes = state.answers.community_module_opt_in === "YES";
  return `${screenHeading("다른 이름이나 장면을 하나 더 남길까요?", "이 단계는 선택 사항입니다. 지금 떠오르는 다른 작가·작품·공간·장면이 있다면 직접 적을 수 있고, 지금까지의 기록으로 마쳐도 괜찮아요.")}
    ${state.summaryGenerating ? processingSignal("응답을 정리하고 있어요") : ""}
    ${renderChoices("C00", c00.options)}
    ${yes ? `${renderText("C01", { placeholder: "작가·작품·공간·장면, 또는 목록 밖에서 떠오르는 이름", label: c01.text })}<label class="field-label">${esc(c02.text)}</label>${renderChoices("C02", c02.options)}<label class="field-label">${esc(c03.text)}</label>${renderChoices("C03", c03.options, { multi: true, max: 2 })}` : ""}`;
}

function renderFixedCheckpoint() {
  if (isRc2) {
    const waiting = state.fixedCheckpointSaving
      ? "앞선 답변을 바탕으로 첫 질문을 준비하고 있습니다."
      : "이제부터는 앞선 답변을 바탕으로 AI가 세 가지 질문을 하나씩 이어 갑니다. 선택지를 고른 뒤, 선택한 이유나 덧붙이고 싶은 내용을 편한 언어로 적어 주세요.";
    return `${screenHeading("앞선 답변에서 이어지는 세 가지 질문", waiting, "")}
      ${state.fixedCheckpointSaving ? processingSignal("응답을 저장하고 다음 질문을 준비하고 있어요") : ""}
      <div class="rc2-depth-intro"><p>세 질문은 기억의 의미, 지금의 자리, 다음에 필요한 변화를 차례로 함께 살핍니다.</p><p>마지막에는 지금까지의 응답에서 남은 흐름을 함께 봅니다.</p></div>`;
  }
  const counts = flowCounts(activeScreens(), state.answers);
  const fallbackNotice = aiMode === "live" && aiFunctionUrl
    ? "다음부터는 앞선 응답을 바탕으로 필요한 연결 질문이 구간별로 이어집니다."
    : "현재는 승인된 질문은행에서 고른 심화 질문 세 개가 이어집니다.";
  const savingNotice = state.fixedCheckpointSaving
    ? "고정 설문 응답을 보존하고 심화 질문을 준비하고 있습니다. 잠시만 기다려 주세요."
    : "다음 버튼을 누르면 고정 설문 응답을 먼저 보존한 뒤 심화 질문으로 이동합니다.";
  return `${screenHeading(`이 경로의 고정 연구질문 ${counts.fixedResearchQuestions}개를 모두 살펴보았습니다.`, "동의, 역할 선택, 안내 화면은 연구질문 수에 포함하지 않았습니다.")}
    <div class="notice">${esc(fallbackNotice)} ${esc(savingNotice)} 이 단계에서 멈추더라도 지금까지의 답변은 이 기기에 보존됩니다.</div>`;
}

function depthQuestion(axis) {
  return values(state.answers.depth_plan).find((item) => item.axis === axis) || null;
}

function clearDepthAfter(axis) {
  const axisIndex = ["M", "S", "D"].indexOf(axis);
  if (axisIndex < 0) return;
  ["M", "S", "D"].slice(axisIndex + 1).forEach((nextAxis) => {
    const key = `depth_${nextAxis.toLowerCase()}`;
    delete state.answers[key];
    delete state.answers[`${key}_text`];
  });
  state.answers.depth_plan = values(state.answers.depth_plan).filter((item) => ["M", "S", "D"].indexOf(item.axis) <= axisIndex);
  delete state.answers.depth_summary;
  delete state.answers.reflection_action;
  delete state.answers.participant_revision;
  delete state.answers.participant_m;
  delete state.answers.participant_s;
  delete state.answers.participant_d;
  delete state.answers.coordinate_snapshots;
}

async function generateDepthQuestion(axis) {
  state.depthGenerating = true;
  render(false);
  const response = createResponse("fixed_complete");
  const context = buildDepthTurnContext({ response, axis, questions: values(state.answers.depth_plan), answers: state.answers });
  const result = await createDepthQuestion({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context, bank: depthBank, axis });
  state.answers.depth_plan = [...values(state.answers.depth_plan).filter((item) => item.axis !== axis), result.question]
    .sort((left, right) => ["M", "S", "D"].indexOf(left.axis) - ["M", "S", "D"].indexOf(right.axis));
  state.answers.depth_source = result.source;
  state.answers.depth_detected_language = result.question.language || state.answers.depth_detected_language || state.language;
  state.answers.depth_ai_runs = [...values(state.answers.depth_ai_runs), { ...result.run, axis }];
  state.depthGenerating = false;
  saveDraft();
}

function renderQuestionIntent(item) {
  const intent = item?.intent || "앞선 답변과 이어지는 경험의 한 층위를 확인합니다.";
  return `<section class="question-intent" aria-label="질문의 맥락"><span>질문의 맥락</span><p>${esc(intent)}</p></section>`;
}

const adaptiveScreenCheckpoint = ANCHOR_SCREEN_MAP;

function adaptiveTurns() {
  return values(state.answers.adaptive_turns);
}

function currentAdaptiveTurn(checkpoint) {
  return adaptiveTurns().filter((turn) => turn.checkpoint === checkpoint).at(-1) || null;
}

function adaptiveStatus(checkpoint) {
  return state.answers.adaptive_checkpoint_status?.[checkpoint] || "pending";
}

function setAdaptiveStatus(checkpoint, value) {
  state.answers.adaptive_checkpoint_status = { ...(state.answers.adaptive_checkpoint_status || {}), [checkpoint]: value };
}

function roleRecord(code, { parallel = false } = {}) {
  return normalizeIntegratedRoleRecord(code, state.answers, { parallel, roles: schema.roles || [] });
}

function buildCurrentAnchorContext(anchorId) {
  const response = createResponse("anchor_context_check");
  const primary = roleRecord(state.answers.role_primary);
  const parallels = values(state.answers.roles_parallel).map((code) => roleRecord(code, { parallel: true })).filter(Boolean);
  return buildAnchorContext({
    anchorId,
    questionLabel: localizedAnchorQuestionLabel(anchorId),
    answer: anchorSourceText(state.answers, anchorId),
    answers: state.answers,
    rolePrimary: primary,
    rolesParallel: parallels,
    responsePosition: state.answers.response_position || (isProfessionalContext() ? "PROFESSIONAL" : "AUDIENCE_CITIZEN"),
    dScope: normalizedDScope(state.answers),
    responseLanguage: responseSourceLanguage(),
    route: state.answers.route,
    sessionId: state.responseId,
    responseId: response.response_id,
  });
}

function reconcileAnchorsAfterResearchEdit(questionId) {
  if (!isRc2) return [];
  const affectedAnchors = anchorsAffectedByChangedQuestion(questionId);
  if (!affectedAnchors.length) return [];
  const beforeTurns = adaptiveTurns();
  const result = reconcileAnchorTurnsAfterQuestionEdit({
    turns: beforeTurns,
    runs: values(state.answers.adaptive_ai_runs),
    statuses: state.answers.adaptive_checkpoint_status || {},
    affectedAnchors,
    fingerprintForAnchor: (anchorId) => anchorContextFingerprint(anchorId, buildCurrentAnchorContext(anchorId)),
  });
  if (result.removed.length) {
    beforeTurns.filter((turn) => result.removed.includes(turn.checkpoint || turn.anchor_id)).forEach((turn) => {
      if (turn.answer_field) delete state.answers[turn.answer_field];
      if (turn.self_check_field) delete state.answers[turn.self_check_field];
    });
    if (result.turns.length) state.answers.adaptive_turns = result.turns; else delete state.answers.adaptive_turns;
    if (result.runs.length) state.answers.adaptive_ai_runs = result.runs; else delete state.answers.adaptive_ai_runs;
    if (Object.keys(result.statuses).length) state.answers.adaptive_checkpoint_status = result.statuses; else delete state.answers.adaptive_checkpoint_status;
    state.answers.depth_source = aggregateAnchorSource(values(state.answers.adaptive_ai_runs)) || null;
  }
  clearReflectionOutcome();
  return result.removed;
}

function localizedAnchorQuestionLabel(anchorId) {
  const item = question(anchorId);
  if (!item) return anchorId;
  if (isAudienceContext() && item.text_audience) return item.text_audience;
  if (isProfessionalContext() && item.text_professional) return item.text_professional;
  return item.text || anchorId;
}

function recordSkippedLowInformation(anchorId) {
  const answer = anchorSourceText(state.answers, anchorId);
  const reason = lowInformationReason(answer);
  if (!reason) return false;
  const context = buildCurrentAnchorContext(anchorId);
  const fingerprint = anchorAnswerFingerprint(anchorId, answer);
  const contextFingerprint = anchorContextFingerprint(anchorId, context);
  const existing = values(state.answers.adaptive_ai_runs).some((run) => run?.checkpoint === anchorId && run?.source === "skipped_low_information" && run?.context_fingerprint === contextFingerprint);
  setAdaptiveStatus(anchorId, "skipped_low_information");
  if (!existing) {
    state.answers.adaptive_ai_runs = [...values(state.answers.adaptive_ai_runs), {
      status: "skipped",
      operation: "anchor_followup",
      checkpoint: anchorId,
      anchor_id: anchorId,
      source: "skipped_low_information",
      provider: null,
      model: null,
      request_id: null,
      client_request_id: null,
      started_at: new Date().toISOString(),
      latency_ms: 0,
      http_status: null,
      error_code: null,
      fallback_reason: reason,
      answer_fingerprint: fingerprint,
      context_fingerprint: contextFingerprint,
      network_calls: 0,
    }];
  }
  state.answers.depth_source = aggregateAnchorSource(values(state.answers.adaptive_ai_runs)) || state.answers.depth_source;
  return true;
}

async function requestAdaptiveNext(checkpoint) {
  state.adaptiveGenerating = true;
  render(false);
  const context = buildCurrentAnchorContext(checkpoint);
  const result = await createAnchorFollowup({
    endpoint: aiFunctionUrl,
    anonKey: supabaseAnonKey,
    anchorId: checkpoint,
    context,
    responseLanguage: responseSourceLanguage(),
    timeoutMs: 23000,
  });
  state.answers.adaptive_ai_runs = [...values(state.answers.adaptive_ai_runs), { ...result.run, checkpoint }];
  state.answers.depth_source = aggregateAnchorSource(values(state.answers.adaptive_ai_runs)) || result.source || state.answers.depth_source;
  if (result.question) {
    state.answers.adaptive_turns = upsertAnchorTurn(adaptiveTurns(), result.question);
    state.answers.adaptive_detected_language = result.question.language || state.answers.adaptive_detected_language || state.language;
    setAdaptiveStatus(checkpoint, result.source === "motif" ? "active_motif" : "active_fallback");
  } else {
    setAdaptiveStatus(checkpoint, result.source || "complete");
  }
  state.adaptiveGenerating = false;
  saveDraft();
  return result;
}

function renderAdaptiveCheckpoint(checkpoint) {
  const turn = currentAdaptiveTurn(checkpoint);
  if (state.adaptiveGenerating || !turn) {
    return `${screenHeading("앞의 답변에서 이어질 질문을 준비하고 있어요.", "방금 적은 문장에서 한 가지를 골라 한 번만 더 묻습니다.", "")}
      ${processingSignal("다음 질문을 준비하고 있어요")}`;
  }
  const answer = state.answers[turn.answer_field] || "";
  return `${screenHeading(turn.prompt, "방금 적은 답변에서 이어진 한 질문", turn.intent || "")}
    ${renderText(turn.id, { field: turn.answer_field, value: answer, placeholder: "한 문장이나 한 장면으로 적어도 좋아요.", label: "이어지는 답변" })}
    <p class="adaptive-turn-note">${esc(t("이 질문에 답하면 바로 고정 설문으로 이어집니다."))}</p>`;
}

async function prepareAdaptiveSummary() {
  state.summaryGenerating = true;
  render(false);
  const response = createResponse("adaptive_complete");
  const turns = adaptiveTurns();
  const context = { ...buildAdaptiveSummaryContext({ response, turns, answers: state.answers }), interview_mode: "five_anchor_realapi", anchor_ids: ANCHOR_ORDER };
  const summary = await createAdaptiveSummary({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context, answers: state.answers, turns, timeoutMs: 45000 });
  state.answers.depth_summary = {
    summary: summary.summary,
    summary_ko: summary.summary_ko || (responseSourceLanguage() === "ko" ? summary.summary : ""),
    axes: summary.axes,
    secondary_axes: summary.secondary_axes || {},
    evidence: summary.evidence,
    uncertainty: summary.uncertainty || null,
    source: summary.source,
    request_id: summary.request_id || summary.run?.request_id || null,
    provider: summary.run?.provider || null,
  };
  if (summary.axes?.m) state.answers.depth_m = summary.axes.m;
  if (summary.axes?.s) state.answers.depth_s = summary.axes.s;
  if (summary.axes?.d) state.answers.depth_d = summary.axes.d;
  state.answers.depth_ai_runs = [...values(state.answers.depth_ai_runs), summary.run];
  console.info("OVER39_SUMMARY_TRACE", JSON.stringify({
    source: summary.source,
    provider: summary.run?.provider || null,
    request_id: summary.request_id || null,
    client_request_id: summary.run?.client_request_id || null,
    client_request_id_returned: summary.run?.client_request_id_returned || null,
    CLIENT_REQUEST_ID_MATCH: summary.run?.client_request_id_match === true,
    http_status: summary.run?.http_status ?? null,
    latency_ms: summary.run?.latency_ms ?? null,
    error_code: summary.run?.error_code || null,
    REAL_MOTIF_PASS: summary.run?.real_motif_pass === true,
  }));
  state.summaryGenerating = false;
  saveDraft();
}

function renderDepth(axis, index) {
  const item = depthQuestion(axis);
  if (state.summaryGenerating && axis === "D") return `${screenHeading("응답을 정리하고 있어요.", "앞선 답변의 흐름을 한 편의 기록으로 정리하고 있습니다.", "")}${processingSignal("응답을 정리하고 있어요")}`;
  if (state.depthGenerating || !item) return `${screenHeading("앞선 답변에서 이어지는 질문을 준비하고 있어요.", "잠시만 기다려 주세요.", "")}${processingSignal("다음 질문을 준비하고 있어요")}`;
  const field = `depth_${axis.toLowerCase()}`;
  const rc2AxisHelp = {
    M: "세 방향 확인 · 1 / 3 · 기억의 의미",
    S: "세 방향 확인 · 2 / 3 · 현재의 흐름",
    D: "세 방향 확인 · 3 / 3 · 이어가기 위한 조건",
  };
  const help = isRc2
    ? rc2AxisHelp[axis]
    : `심화질문 ${index} / 3 · 한 가지를 고르고, 필요하면 짧은 설명을 덧붙여 주세요.`;
  const intent = isRc2 ? item.intent : "";
  return `${screenHeading(item.prompt, help, intent)}
    ${renderChoices(field, DEPTH_AXIS_OPTIONS[axis])}
    ${renderText(`${field}_text`, { field: `${field}_text`, value: state.answers[`${field}_text`] || "", placeholder: "짧은 문장이어도 좋습니다. 어떤 언어로 적어도 괜찮습니다.", label: isRc2 ? "선택한 이유나 덧붙이고 싶은 내용을 편한 언어로 적어 주세요." : "덧붙일 말" })}
    ${isRc2 ? "" : renderQuestionIntent(item)}`;
}

function renderReflectionReview() {
  const summaryValue = state.answers.depth_summary?.summary?.trim() || "";
  const summary = summaryValue || "응답 정리를 불러오는 동안 연결이 원활하지 않았습니다.";
  const summaryKo = state.answers.depth_summary?.summary_ko || "";
  const action = state.answers.reflection_action;
  if (isRc2 && !summaryValue) {
    return `${screenHeading("작성한 원문은 그대로 보존되어 있습니다.", "응답 정리를 불러오지 못했습니다. 직접 정리문을 작성할 수 있어요.")}
      <div class="notice">${esc(t("응답 정리를 불러오는 동안 연결이 원활하지 않았습니다. 작성한 원문은 그대로 보존되어 있습니다. 직접 정리문을 작성할 수 있습니다."))}</div>
      ${renderChoices("reflection_action", [["REWRITE", "직접 정리문을 작성할게요"]])}
      ${action === "REWRITE" ? renderText("participant_revision", { field: "participant_revision", value: state.answers.participant_revision || "", placeholder: "기억, 현재의 흐름, 이어가기 위한 조건을 편한 문장으로 적어주세요.", label: "새로 적은 문장" }) : ""}
      <div class="reflection-tools"><button class="text-button" type="button" data-action="regenerate-summary" ${state.summaryGenerating ? "disabled" : ""}>${esc(t("다시 정리하기"))}</button></div>
      ${state.summaryGenerating ? processingSignal("응답을 다시 정리하고 있어요") : ""}`;
  }
  if (!isRc2) {
    return `${screenHeading("지금까지의 응답을 이렇게 읽었습니다.", "직접 읽고 필요한 부분을 고칠 수 있어요.")}
      <div class="reflection-summary"><span>${state.answers.depth_summary?.source === "rules" ? "원문 중심 임시 정리" : "응답 정리"}</span><p>${esc(summary)}</p>${state.answers.depth_summary?.source === "rules" ? `<small>현재 비API 시험판에서는 작성한 문장을 중심으로 정리합니다. 운영판에서는 API 정리 결과를 다시 읽고 고칠 수 있습니다.</small>` : ""}</div>
      ${renderChoices("reflection_action", [["ACCEPT", "전체적으로 가까워요"], ["EDIT", "일부를 고치고 싶어요"], ["DROP", "이 정리는 남기지 않을게요"]])}
      ${action === "EDIT" ? renderText("participant_revision", { field: "participant_revision", value: state.answers.participant_revision || "", placeholder: "빠진 내용이나 어긋난 부분을 고쳐주세요.", label: "고친 문장" }) : ""}`;
  }
  const revisionLabel = action === "REWRITE" ? "새로 적은 문장" : "고친 문장";
  const revisionPlaceholder = action === "REWRITE"
    ? "기억, 현재의 흐름, 이어가기 위한 조건을 편한 문장으로 적어주세요."
    : "가까운 문장은 남기고, 빠지거나 어긋난 부분을 고쳐주세요.";
  const translatedPreview = responseSourceLanguage() !== "ko" && summaryKo
    ? `<div class="response-document-translation reflection-translation"><span>한국어 번역 초안</span><p>${esc(summaryKo)}</p><small>원문을 기준으로 작성</small></div>`
    : "";
  return `${screenHeading("지금까지의 응답을 한곳에 모았습니다.", "겹치거나 반복되는 내용을 정리한 초안입니다. 읽어보고 뜻이 어긋난 문장은 직접 다듬어주세요.")}
    <div class="reflection-summary"><span>${state.answers.depth_summary?.source === "rules" ? "원문 중심 임시 정리" : "응답 정리"}</span><p>${esc(summary)}</p>${state.answers.depth_summary?.source === "rules" ? `<small>현재 비API 시험판에서는 작성한 문장을 중심으로 정리합니다. 운영판에서는 API 정리 결과를 다시 읽고 고칠 수 있습니다.</small>` : ""}</div>
    ${translatedPreview}
    ${renderChoices("reflection_action", [["ACCEPT", "이 내용이 가까워요"], ["EDIT", "일부 문장을 고칠게요"], ["REWRITE", "새 문장으로 적을게요"]])}
    ${["EDIT", "REWRITE"].includes(action) ? renderText("participant_revision", { field: "participant_revision", value: state.answers.participant_revision || "", placeholder: revisionPlaceholder, label: revisionLabel }) : ""}
    <div class="reflection-tools"><button class="text-button" type="button" data-action="review-answers">${esc(t("앞선 답변 보기"))}</button><button class="text-button" type="button" data-action="regenerate-summary" ${state.summaryGenerating ? "disabled" : ""}>${esc(t("다시 정리하기"))}</button></div>
    ${state.summaryGenerating ? processingSignal("응답을 다시 정리하고 있어요") : ""}`;
}

function responseCoordinatePosition(answers = state.answers) {
  const snapshot = answers.coordinate_snapshots?.participant_final || answers.coordinate_snapshots?.research_derived || answers.coordinate_snapshots?.fixed || {};
  const m = answers.participant_m || snapshot.m_primary || answers.depth_m || answers.m_declared;
  const sValue = answers.participant_s || snapshot.s_primary || answers.depth_s;
  const d = answers.participant_d || snapshot.d_primary || answers.depth_d || answers.d_desired_change_primary;
  const mIndex = Number(String(m || "").replace("M", ""));
  const sIndex = Number(String(sValue || "").replace("S", ""));
  const dIndex = Number(String(d || "").replace("D", ""));
  const complete = [mIndex, sIndex, dIndex].every((value) => value >= 1 && value <= 4);
  return { m, s: sValue, d, mIndex, sIndex, dIndex, number: complete ? (mIndex - 1) * 16 + (sIndex - 1) * 4 + dIndex : null };
}

const AXIS_REVIEW_OPTIONS = {
  participant_m: [["M1", "느낌과 분위기 — 색과 소리, 공간의 분위기와 그때 느낀 감정이 오래 남아 있습니다."], ["M2", "삶과 기억 — 개인의 경험과 관계, 삶의 변화가 기억의 중심에 있습니다."], ["M3", "작품의 생각과 표현 — 형식과 재료, 표현 방식과 새로운 시도가 기억의 중심에 있습니다."], ["M4", "사람과 사회 — 사람과 지역, 공동체와 사회적 의미가 기억의 중심에 있습니다."]],
  participant_s: [["S1", "확장 — 관심과 활동이 새로운 분야, 사람과 장소로 넓어지고 있습니다."], ["S2", "지속 — 익숙한 활동과 관심을 자신의 리듬으로 꾸준히 이어가고 있습니다."], ["S3", "전환 — 역할과 방식, 관심의 중심이 달라지며 새로운 방향으로 움직이고 있습니다."], ["S4", "거리와 한계 — 현재 조건을 살피며 속도와 관계를 다시 조정하고 있습니다."]],
  participant_d: [["D1", "접근과 참여 — 정보와 이동, 관람과 참여 기회가 이어가기 위한 중요한 조건입니다."], ["D2", "개인의 기반 — 생활, 비용, 공간과 스스로 확보할 수 있는 기반이 중요합니다."], ["D3", "관계와 매개 — 동료와 기획자, 비평가, 교육자, 관객과 이어지는 관계가 중요합니다."], ["D4", "제도와 구조 — 지원과 심사, 보상과 장기적인 운영 구조가 중요합니다."]],
};

function ensureParticipantAxes() {
  const snapshot = state.answers.coordinate_snapshots?.participant_final || state.answers.coordinate_snapshots?.research_derived || state.answers.coordinate_snapshots?.fixed || {};
  if (!state.answers.participant_m) state.answers.participant_m = snapshot.m_primary || state.answers.depth_m || state.answers.m_declared || "";
  if (!state.answers.participant_s) state.answers.participant_s = snapshot.s_primary || state.answers.depth_s || "";
  if (!state.answers.participant_d) state.answers.participant_d = snapshot.d_primary || state.answers.depth_d || state.answers.d_desired_change_primary || "";
}

function renderAxisReview(field, title) {
  const current = state.answers[field] || "";
  const selectedLabel = AXIS_REVIEW_OPTIONS[field]?.find(([value]) => value === current)?.[1]?.split(/\s+—\s+/, 1)[0] || t("직접 확인");
  return `<section class="axis-review-card"><div><span>${esc(t(title))}</span><strong>${esc(t(selectedLabel))}</strong></div><div class="axis-review-options">${(AXIS_REVIEW_OPTIONS[field] || []).map(([value, label]) => { const parts = label.split(/\s+—\s+/, 2); const selected = value === current; return `<button type="button" class="axis-review-choice ${selected ? "selected" : ""}" data-axis-field="${esc(field)}" data-axis-value="${esc(value)}" aria-pressed="${selected}"><strong>${esc(t(parts[0]))}</strong><small>${esc(t(parts[1] || ""))}</small></button>`; }).join("")}</div></section>`;
}

function renderCoordinateModel() {
  const position = responseCoordinatePosition();
  const axisLabels = {
    M1: t("느낌과 분위기"), M2: t("삶과 기억"), M3: t("작품의 생각과 표현"), M4: t("사람과 사회"),
    S1: t("확장"), S2: t("지속"), S3: t("전환"), S4: t("거리와 한계"),
    D1: t("접근과 참여"), D2: t("개인의 기반"), D3: t("관계와 매개"), D4: t("제도와 구조"),
  };
  const layers = [1, 2, 3, 4].map((mIndex) => {
    const cells = Array.from({ length: 16 }, (_, cellIndex) => {
      const sIndex = Math.floor(cellIndex / 4) + 1;
      const dIndex = (cellIndex % 4) + 1;
      const selected = position.number && position.mIndex === mIndex && position.sIndex === sIndex && position.dIndex === dIndex;
      return `<i class="${selected ? "selected" : ""}" aria-hidden="true"></i>`;
    }).join("");
    return `<div class="coordinate-layer ${position.mIndex === mIndex ? "active" : ""}" style="--layer:${mIndex - 1}" aria-hidden="true">${cells}</div>`;
  }).join("");
  const mLabel = axisLabels[position.m];
  const sLabel = axisLabels[position.s];
  const dLabel = axisLabels[position.d];
  const axes = [mLabel, sLabel, dLabel].filter(Boolean).join(" × ") || t("응답을 바탕으로 세 방향을 정리하는 중");
  const explanation = [mLabel && t("기억에서는 ‘{value}’").replace("{value}", mLabel), sLabel && t("현재에서는 ‘{value}’").replace("{value}", sLabel), dLabel && t("이어가기 위한 조건에서는 ‘{value}’").replace("{value}", dLabel)].filter(Boolean).join(", ");
  return `<div class="coordinate-model" role="img" aria-label="${esc(axes)}"><div class="coordinate-symbol"><div class="coordinate-stack">${layers}</div></div><div class="coordinate-model-copy"><span class="coordinate-kicker">${esc(t("기억의 의미 × 현재의 흐름 × 이어가기 위한 조건"))}</span><strong>${esc(axes)}</strong>${explanation ? `<p>${esc(t("{explanation}이 이번 기록에서 함께 나타났습니다.").replace("{explanation}", explanation))}</p>` : ""}</div></div>`;
}

function renderSubmit() {
  const storageNotice = submitFunctionUrl
    ? t("다음 화면에서 정책연구에 활용할 범위를 직접 정한 뒤 저장합니다.")
    : t("다음 화면에서 활용 범위를 정한 뒤 이번 시험판 기록을 이 기기에 보관합니다.");
  if (!isRc2) return `${screenHeading("연구 응답을 제출할 준비가 되었습니다.", storageNotice)}<div class="notice">연구 기록은 여기에서 먼저 마무리됩니다.</div>`;
  ensureParticipantAxes();
  const document = buildCurrentResponseDocument({ final: false });
  const translationNotice = responseSourceLanguage() !== "ko" && !state.answers.participant_approved_text_ko
    ? `<div class="document-language-note">${esc(t("원문을 먼저 보관하며, 한국어 번역은 원문을 기준으로 정리합니다."))}</div>`
    : "";
  return `${screenHeading(t("당신의 기록이 닿은 세 방향"), t("앞선 질문과 답변의 흐름을 따라 세 방향의 위치를 정리했습니다. 직접 눌러 지금의 기록과 가까운 위치로 조정할 수 있어요."))}
    ${state.translationGenerating ? processingSignal(t("원문을 기준으로 한국어 번역을 준비하고 있어요")) : ""}
    ${translationNotice}
    <section class="axis-review"><div class="axis-review-intro"><span>THREE DIRECTIONS · YOUR RECORD</span><h3>${esc(t("기억의 의미 · 현재의 흐름 · 이어가기 위한 조건을 확인해 주세요."))}</h3><p>${esc(t("선택을 바꾸면 아래 세 방향 표시에도 이번 기록과 가까운 흐름이 반영됩니다."))}</p></div>${renderAxisReview("participant_m", "기억의 의미")}${renderAxisReview("participant_s", "현재의 흐름")}${renderAxisReview("participant_d", "이어가기 위한 조건")}</section>
    <section class="coordinate-feedback"><h3>${esc(t("세 방향이 만나는 자리"))}</h3><p>${esc(t("세 방향을 함께 살펴보기 위한 구조입니다. 사람의 유형이나 순위를 뜻하지 않으며, 이번 기록과 가까운 위치를 다시 확인할 수 있어요."))}</p>${renderCoordinateModel()}${renderChoices("coordinate_feedback", [["CLOSE", "이 세 방향이 가까워요 — 지금 보이는 세 방향을 이번 기록의 위치로 남겨요."], ["MIXED", "두 흐름이 함께 보여요 — 한 방향에서 두 흐름이 함께 느껴지면 둘 다 표시할 수 있어요."], ["DIFFERENT", "조금 더 설명하고 싶어요 — 세 방향을 고른 뒤, 남기고 싶은 말을 자유롭게 덧붙여 주세요."]])}${["MIXED", "DIFFERENT"].includes(state.answers.coordinate_feedback) ? renderText("coordinate_feedback_text", { field: "coordinate_feedback_text", value: state.answers.coordinate_feedback_text || "", label: t("함께 남길 설명"), placeholder: t("두 방향이 함께 느껴지는 이유나 덧붙일 내용을 적어주세요.") }) : ""}</section>
    <div class="response-document-preview">${renderResponseDocument(document)}</div>
    <p class="submit-scope-note">${esc(storageNotice)}</p>`;
}

function renderUseScope() {
  const researchUse = state.answers.policy_research_use || "";
  const quoteUse = state.answers.policy_quote_use || "";
  const archiveUse = state.answers.public_archive_interest || "";
  const choice = (field, value, title, copy) => { const selected = state.answers[field] === value; return `<button type="button" class="use-scope-choice ${selected ? "selected" : ""}" data-use-field="${esc(field)}" data-use-value="${esc(value)}" aria-pressed="${selected}"><strong>${esc(t(title))}</strong><small>${esc(t(copy))}</small></button>`; };
  return `${screenHeading("이 기록이 어디까지 이어지면 좋을까요?", "연구 분석, 문장 인용, 공개 제안의 범위를 각각 정합니다. 선택은 이후에도 별도로 확인할 수 있도록 기록합니다.")}
    <section class="use-scope-section"><span>01 · ${esc(t("정책연구"))}</span><h3>${esc(t("정책연구에서 이 응답을 어떻게 사용할까요?"))}</h3><div class="use-scope-grid">${choice("policy_research_use", "ANON_ANALYSIS", "익명 분석과 집계", "이름과 연락처를 제외한 응답을 통계와 주제 분석에 반영합니다.")}${choice("policy_research_use", "INTERNAL_ONLY", "프로젝트 내부 연구", "공개 통계와 인용에서 분리하고 내부 연구 검토에서만 살핍니다.")}</div></section>
    <section class="use-scope-section"><span>02 · ${esc(t("문장 인용"))}</span><h3>${esc(t("참여 기록의 문장을 연구자료에 인용해도 될까요?"))}</h3><div class="use-scope-grid">${choice("policy_quote_use", "ANON_EXCERPT", "익명 문장 인용 가능", "개인을 식별하는 정보는 빼고 일부 문장을 보고서와 연구자료에 인용할 수 있습니다.")}${choice("policy_quote_use", "NO_QUOTE", "개별 문장 인용 제외", "집계와 주제 분석에는 반영하되 개별 문장은 공개 자료에 인용하지 않습니다.")}</div></section>
    <section class="use-scope-section"><span>03 · ${esc(t("전시·출판·웹 기록"))}</span><h3>${esc(t("공개 활용은 별도로 다시 확인합니다."))}</h3><p>${esc(t("이번 선택만으로 전시·출판·웹 아카이브에 원문이나 이름을 공개하지 않습니다."))}</p><div class="use-scope-grid">${choice("public_archive_interest", "ASK_LATER", "필요할 때 다시 제안받기", "실제 사용 기회가 생기면 공개 범위와 문장을 다시 확인하는 방식입니다.")}${choice("public_archive_interest", "RESEARCH_ONLY", "이번 기록은 연구 범위에서 마무리", "전시·출판·웹 공개 제안 없이 연구 기록으로 보관합니다.")}</div></section>
    <div class="use-scope-summary"><strong>${esc(t("현재 선택"))}</strong><p>${esc(t(researchUse ? (researchUse === "ANON_ANALYSIS" ? "익명 분석" : "내부 연구") : "정책연구 범위 미선택"))} · ${esc(t(quoteUse ? (quoteUse === "ANON_EXCERPT" ? "익명 문장 인용 가능" : "문장 인용 제외") : "인용 범위 미선택"))} · ${esc(t(archiveUse ? (archiveUse === "ASK_LATER" ? "공개 활용은 다시 확인" : "연구 범위에서 마무리") : "공개 활용 범위 미선택"))}</p></div>`;
}

function screenBody(id) {
  return ({
    CONSENT: renderConsent,
    P01: renderRoute,
    DOCUMENT_IDENTITY: renderDocumentIdentity,
    P01_CONTEXT: renderResponsePosition,
    ROLE_GROUP: renderRoleGroup,
    ROLE_PRIMARY: renderRolePrimary,
    ROLE_PARALLEL: renderRoleParallel,
    PROFILE: renderProfile,
    M01: renderMemoryType,
    M02: renderMemoryClue,
    M03: renderBranch,
    M04: renderMeaning,
    M05: renderMeaningTags,
    AI_ANCHOR_M04_TEXT: () => renderAdaptiveCheckpoint("M04_TEXT"),
    MEMORY_TIME: renderMemoryTime,
    MEMORY_EVIDENCE: renderEvidence,
    MEMORY_TO_PRESENT: renderMemoryToPresent,
    ACTIVITY: renderActivity,
    PRACTICE_PUBLIC_STATE: renderPracticePublicState,
    STATE_BACKGROUND: renderStateBackground,
    TRANSITION: renderTransition,
    CONTINUITY: renderContinuity,
    SUPPORT_CONDITIONS: renderSupportConditions,
    AI_ANCHOR_P12: () => renderAdaptiveCheckpoint("P12"),
    AI_ANCHOR_P13_TEXT: () => renderAdaptiveCheckpoint("P13_TEXT"),
    AI_ANCHOR_P19_TEXT: () => renderAdaptiveCheckpoint("P19_TEXT"),
    D01: renderD1,
    D02: renderD2,
    D03: renderD3,
    D04: renderD4,
    AI_ANCHOR_D02_TEXT: () => renderAdaptiveCheckpoint("D02_TEXT"),
    R01: renderReconnect,
    COMMUNITY: renderCommunity,
    FIXED_CHECKPOINT: renderFixedCheckpoint,
    DEPTH_M: () => renderDepth("M", 1),
    DEPTH_S: () => renderDepth("S", 2),
    DEPTH_D: () => renderDepth("D", 3),
    REFLECTION_REVIEW: renderReflectionReview,
    SUBMIT: renderSubmit,
    USE_SCOPE: renderUseScope,
  })[id]();
}

function canContinue(id) {
  if (id === "CONSENT") return Boolean(answerFor("RC01"));
  if (id === "P01") return Boolean(state.answers.route);
  if (id === "DOCUMENT_IDENTITY") return Boolean(state.answers.display_name_mode && (state.answers.display_name_mode === "ANONYMOUS" || state.answers.display_name?.trim()));
  if (id === "P01_CONTEXT") return Boolean(state.answers.response_position);
  if (id === "ROLE_GROUP") return Boolean(state.answers.role_group_primary);
  if (id === "ROLE_PRIMARY") return Boolean(state.answers.role_primary);
  if (id === "M01") return Boolean(state.answers.memory_type);
  if (id === "M02") return Boolean(state.answers.memory_clue_text?.trim());
  if (id === "M04") return Boolean(state.answers.m_declared && state.answers.memory_meaning_text?.trim());
  if (id === "PRACTICE_PUBLIC_STATE") return Boolean(state.answers.creative_work_state && state.answers.public_activity_state);
  if (id === "STATE_BACKGROUND") return Boolean(values(state.answers.pause_context_tags).length && state.answers.pause_meaning);
  if (id === "TRANSITION") {
    if (!state.answers.transition_state) return false;
    return ["SKIP", "UNSURE"].includes(state.answers.transition_state) || Boolean(state.answers.transition_text?.trim());
  }
  if (id === "CONTINUITY") {
    if (!state.answers.invisible_continuity_state) return false;
    return !["YES", "MIXED"].includes(state.answers.invisible_continuity_state) || Boolean(state.answers.invisible_continuity_text?.trim());
  }
  if (id === "SUPPORT_CONDITIONS") return Boolean(values(state.answers.support_conditions).length);
  if (adaptiveScreenCheckpoint[id]) {
    const turn = currentAdaptiveTurn(adaptiveScreenCheckpoint[id]);
    return Boolean(turn && state.answers[turn.answer_field]?.trim() && !state.adaptiveGenerating);
  }
  if (id === "D01") return Boolean(state.answers.d_current_gap);
  if (id === "D02") return Boolean(state.answers.d_desired_change_primary && state.answers.desired_change_text?.trim());
  if (id === "DEPTH_M") return Boolean(state.answers.depth_m);
  if (id === "DEPTH_S") return Boolean(state.answers.depth_s);
  if (id === "DEPTH_D") return Boolean(state.answers.depth_d);
  if (id === "REFLECTION_REVIEW") {
    if (!state.answers.reflection_action) return false;
    if (["EDIT", "REWRITE"].includes(state.answers.reflection_action)) return Boolean(state.answers.participant_revision?.trim());
  }
  if (id === "SUBMIT") return Boolean(state.answers.participant_m && state.answers.participant_s && state.answers.participant_d && state.answers.coordinate_feedback) && !state.translationGenerating;
  if (id === "USE_SCOPE") return Boolean(state.answers.policy_research_use && state.answers.policy_quote_use && state.answers.public_archive_interest);
  return true;
}

function createResponse(submissionPhase = "final") {
  const responseId = state.responseId || `V13-${crypto.randomUUID()}`;
  const cleanedAnswers = sanitizeAnswersForRoute(state.answers);
  const rawAnswers = Object.entries(cleanedAnswers).map(([field, answer]) => ({ field, answer }));
  const snapshots = buildCoordinateSnapshots(cleanedAnswers);
  const finalSnapshot = snapshots.participant_final || snapshots.research_derived;
  const approvedText = cleanedAnswers.participant_approved_text?.trim() || approvedReflectionText(cleanedAnswers) || null;
  const sourceLanguage = cleanedAnswers.adaptive_detected_language || cleanedAnswers.depth_detected_language || state.language;
  const confirmedAt = cleanedAnswers.document_confirmed_at || (submissionPhase === "final" ? new Date().toISOString() : null);
  const finalDocument = buildResponseDocument({
    responseId,
    answers: cleanedAnswers,
    sourceLanguage,
    releaseVersion,
    approvedOriginal: approvedText || "",
    approvedKorean: cleanedAnswers.participant_approved_text_ko || (sourceLanguage === "ko" ? approvedText || "" : ""),
    createdAt: cleanedAnswers.response_document_created_at || new Date().toISOString(),
    confirmedAt,
    final: submissionPhase === "final",
  });
  const fixedQuestionIds = applicableFixedQuestionIds(cleanedAnswers, { adaptive: isRc2 });
  const coordinateScope = deriveCoordinateScope(cleanedAnswers);
  const sContextTags = deriveSContextTags(cleanedAnswers);
  return {
    response_id: responseId,
    payload_version: isRc2 ? "over39-rc2-5anchor-realapi-pilot-v0.4.5" : "over39-rc1-payload-1",
    response_document_version: RESPONSE_DOCUMENT_VERSION,
    questionnaire_version: schema.questionnaire_version,
    schema_version: schema.schema_version,
    grid_version: schema.versioning.grid_version,
    consent_version: schema.versioning.consent_version,
    classification_version: isRc2 ? "m-s-d-participant-review-v0.4.5" : "m-s-d-coordinate-rc1",
    submission_phase: submissionPhase,
    submitted_at: new Date().toISOString(),
    source_language: sourceLanguage,
    interface_language: state.language,
    interaction_language: sourceLanguage,
    route: cleanedAnswers.route,
    sample_type: sampleType,
    institution_code: institutionCode || null,
    acquisition_source: acquisitionSource,
    rc1_version: releaseVersion,
    release_version: releaseVersion,
    include_in_policy_statistics: sampleType === "research" && cleanedAnswers.policy_research_use === "ANON_ANALYSIS",
    coordinate_scope: coordinateScope,
    coordinate_subject: finalSnapshot.coordinate_subject,
    coordinate_status: finalSnapshot.status,
    coordinate_number: finalSnapshot.coordinate_number,
    coordinate_candidate: finalSnapshot.coordinate_candidate,
    axes: {
      m_declared: cleanedAnswers.m_declared || null,
      m_support_tags: values(cleanedAnswers.m_support_tags),
      d_current_gap: cleanedAnswers.d_current_gap || null,
      d_desired_change_primary: cleanedAnswers.d_desired_change_primary || null,
      d_context_tags: values(cleanedAnswers.d_context_tags),
      m_primary: finalSnapshot.m_primary,
      s_primary: finalSnapshot.s_primary,
      d_primary: finalSnapshot.d_primary,
      s_context_tags: sContextTags,
    },
    answers: cleanedAnswers,
    raw_answers: rawAnswers,
    fixed_questions: fixedQuestionIds.map((id) => {
      const q = question(id);
      const answer = cleanedAnswers[storedField(q) || id] ?? null;
      return {
        id,
        ...QUESTION_METADATA[id],
        question_text: apiQuestionText(id, q),
        answer,
        answer_display: apiAnswerDisplay(id, answer),
      };
    }),
    fixed_question_count: fixedQuestionIds.length,
    depth_question_count: isRc2 ? values(cleanedAnswers.adaptive_turns).length : 3,
    depth_interview: isRc2 ? {
      mode: "five_anchor_realapi",
      source: aggregateAnchorSource(values(cleanedAnswers.adaptive_ai_runs)) || cleanedAnswers.depth_source || "skipped_low_information",
      interaction_language: sourceLanguage,
      checkpoints: ANCHOR_ORDER,
      turns: values(cleanedAnswers.adaptive_turns).map((turn) => ({
        id: turn.id, checkpoint: turn.checkpoint, anchor_id: turn.anchor_id || turn.checkpoint, axis: turn.axis, focus: turn.focus, prompt: turn.prompt,
        intent: turn.intent, source: turn.source, provider: turn.provider || null, model: turn.model || null, language: turn.language,
        request_id: turn.request_id || null, client_request_id: turn.client_request_id || null, client_request_id_sent: turn.client_request_id_sent || turn.client_request_id || null, client_request_id_returned: turn.client_request_id_returned || null, client_request_id_match: turn.client_request_id_match === true, context_fingerprint: turn.context_fingerprint || null, dom_match: turn.dom_match === true,
        answer_text: cleanedAnswers[turn.answer_field]?.trim() || null,
        self_check_value: turn.self_check_field ? (cleanedAnswers[turn.self_check_field] || null) : null,
      })),
      checkpoint_status: cleanedAnswers.adaptive_checkpoint_status || {},
    } : {
      mode: "axis_confirmation",
      source: cleanedAnswers.depth_source || "approved_question_bank",
      interaction_language: sourceLanguage,
      questions: values(cleanedAnswers.depth_plan),
      answers: ["M", "S", "D"].map((axis) => ({ axis, value: cleanedAnswers[`depth_${axis.toLowerCase()}`] || null, text: cleanedAnswers[`depth_${axis.toLowerCase()}_text`]?.trim() || null })),
    },
    api_runs: [...values(cleanedAnswers.adaptive_ai_runs), ...values(cleanedAnswers.depth_ai_runs)],
    reflection: {
      api_or_rule_summary: cleanedAnswers.depth_summary?.summary || null,
      api_or_rule_summary_ko: cleanedAnswers.depth_summary?.summary_ko || null,
      summary_source: cleanedAnswers.depth_summary?.source || null,
      participant_action: cleanedAnswers.reflection_action || null,
      participant_revision: cleanedAnswers.participant_revision?.trim() || null,
      participant_approved_text: approvedText,
      participant_approved_text_ko: cleanedAnswers.participant_approved_text_ko?.trim() || null,
      original_confirmation_status: approvedText ? "participant_confirmed" : "not_confirmed",
      translation_status: sourceLanguage === "ko" ? "same_as_original" : cleanedAnswers.participant_approved_text_ko ? "translated_from_original" : "translation_pending",
      public_approved: false,
    },
    response_document: finalDocument,
    document_confirmation: {
      acknowledged: submissionPhase === "final",
      confirmed_at: confirmedAt,
      original_confirmed: Boolean(approvedText),
      korean_translation_basis: sourceLanguage === "ko" ? "original" : "source_original",
    },
    coordinate_snapshots: snapshots,
    policy_use_scope: {
      research_use: cleanedAnswers.policy_research_use || null,
      quote_use: cleanedAnswers.policy_quote_use || null,
      public_archive_interest: cleanedAnswers.public_archive_interest || null,
    },
    consent: {
      research: (cleanedAnswers["consent.research_participation"] || cleanedAnswers.research_consent) === "YES",
      data_processing: (cleanedAnswers["consent.ai_processing_ack"] || cleanedAnswers.data_processing_consent) === "YES",
      consent_version: schema.versioning.consent_version,
    },
    outbox_count: readOutbox().length,
  };
}

async function requestResearchStorage(response) {
  if (submitFunctionUrl) {
    return sendEnvelope(createEnvelope(response.submission_phase === "fixed_complete" ? "fixed_snapshot" : "research_submission", response), {
      endpoint: submitFunctionUrl,
      anonKey: supabaseAnonKey,
    });
  }
  if (!googleAppsScriptUrl) {
    const kind = response.submission_phase === "fixed_complete" ? "fixed_snapshot" : "research_submission";
    return sendEnvelope(createEnvelope(kind, response), {});
  }
  try {
    await fetch(googleAppsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(response),
    });
    return await verifyResearchStorage(response.response_id);
  } catch (error) {
    console.warn("Research storage request failed", error);
    return { status: "failed" };
  }
}

async function verifyResearchStorage(responseId) {
  if (submitFunctionUrl) {
    const queued = readOutbox().some((item) => item.payload?.response_id === responseId);
    return { status: queued ? "unverified" : "confirmed" };
  }
  if (!googleAppsScriptUrl) return { status: "local_only" };
  try {
    const receiptUrl = new URL(googleAppsScriptUrl);
    receiptUrl.searchParams.set("submission_id", responseId);
    const response = await fetch(receiptUrl, { method: "GET", cache: "no-store" });
    if (!response.ok) return { status: "unverified" };
    const receipt = await response.json();
    return receipt.ok && receipt.exists ? { status: "confirmed" } : { status: "unverified" };
  } catch (error) {
    console.warn("Research storage verification unavailable", error);
    return { status: "unverified" };
  }
}

function creditBlock(variant = "default") {
  const className = variant === "intro" ? "intro-credit-grid" : "credit-block";
  const rowClass = variant === "intro" ? "intro-credit-item" : "credit-row";
  return `<section class="${className}" aria-label="프로젝트 크레디트">${creditRows.map(([role, name]) => `<div class="${rowClass}"><span>${esc(t(role))}</span><strong>${esc(name)}</strong></div>`).join("")}</section>`;
}

function header() {
  const projectMeta = isRc2 ? t("리서치 · 참여 기록 · 공모") : "PUBLIC MEMORY RESEARCH · RC1";
  const currentLanguage = languages.find(([code]) => code === state.language)?.[1] || "한국어";
  return `<header class="topbar" aria-label="Site header">
    <div class="brand project-brand">${ledWordmark({ className: "led-wordmark led-wordmark-header" })}<span>〈만 39세 이상〉</span></div>
    <div class="topbar-project"><span>${esc(projectMeta)}</span><strong>RESEARCH & OPEN CALL</strong></div>
    <details class="language-menu">
      <summary aria-label="${esc(t("언어 선택"))}"><span>${esc(currentLanguage)}</span><i aria-hidden="true">⌄</i></summary>
      <div class="language-menu-panel" role="group" aria-label="${esc(t("언어 선택"))}">
        ${languages.map(([code, label]) => `<button type="button" data-lang="${code}" class="${state.language === code ? "active" : ""}" aria-pressed="${state.language === code}"><span>${label}</span>${state.language === code ? '<b aria-hidden="true">●</b>' : ''}</button>`).join("")}
      </div>
    </details>
  </header>`;
}

function footer() {
  const footerMeta = isRc2 ? t("기억 · 현재 · 조건 · 참여 기록 · 공모 · 안부의 좌표") : "PUBLIC MEMORY RESEARCH · INSTITUTION RC1";
  return `<footer class="site-footer"><div class="footer-project"><strong>〈만 39세 이상〉</strong><span>${esc(footerMeta)}</span><a href="mailto:${researchContactEmail}">${researchContactEmail}</a></div><div class="footer-credits">${creditRows.map(([role, name]) => `<span><em>${esc(t(role))}</em>${esc(name)}</span>`).join("")}</div></footer>`;
}

function renderAnalysisCard(response) {
  const profile = buildConnectionProfile(response, getConnection());
  const insight = profile.coordinate;
  if (!insight) {
    return `<section class="analysis-card analysis-card-pending"><div class="analysis-card-label">BETA ANALYSIS</div><h2>이번 응답의 연결 지도를 준비하고 있습니다.</h2><p>기억의 의미, 현재 흐름, 먼저 바라는 변화를 모두 확인하면 연결 위치를 더 구체적으로 보여드립니다.</p></section>`;
  }
  const approvedText = response.reflection?.participant_approved_text;
  const scopeLabel = COORDINATE_SCOPE_LABELS[response.coordinate_scope] || COORDINATE_SCOPE_LABELS.art_relationship;
  return `<section class="analysis-card"><div class="analysis-card-head"><span>RESPONSE EPISODE · PARTICIPANT REVIEWED</span></div><p class="analysis-scope">이번 결과가 읽는 범위 · <strong>${esc(scopeLabel)}</strong></p><h2>${esc(insight.title)}</h2>${approvedText ? `<p>${esc(approvedText)}</p>` : `<p>${esc(insight.description)}</p>`}<div class="axis-strip"><div><span>남아 있는 의미</span><strong>${esc(insight.axes.m.label)}</strong></div><div><span>응답자의 현재 흐름</span><strong>${esc(insight.axes.s.label)}</strong></div><div><span>먼저 바라는 변화</span><strong>${esc(insight.axes.d.label)}</strong></div></div><p class="analysis-disclaimer">이 위치는 기억 속 인물이나 참여자의 가치·자격을 평가하지 않습니다. 이번 응답에서 드러난 관계와 현재 조건을 한 시점의 리서치 지도로 정리한 결과이며, 내부 좌표 번호는 연구 관리 화면에서만 사용합니다.</p></section>`;
}

function renderConnectionChoices(field, options, { multi = false, max = 0 } = {}) {
  const connection = getConnection();
  const selected = values(connection[field]);
  return `<div class="choice-list connection-choice-list">${options.map(([value, label, help]) => {
    const active = multi ? selected.includes(value) : connection[field] === value;
    return `<button type="button" class="choice ${active ? "selected" : ""}" data-connection-field="${esc(field)}" data-connection-value="${esc(value)}" data-connection-multi="${multi}" data-connection-max="${max}" aria-pressed="${active}"><span class="choice-mark" aria-hidden="true">${active ? "✓" : ""}</span><div class="connection-choice-copy"><strong>${esc(label)}</strong>${help ? `<small>${esc(help)}</small>` : ""}</div></button>`;
  }).join("")}</div>`;
}

function renderExhibitionChoices(field, options) {
  const application = getExhibitionApplication();
  return `<div class="choice-list exhibition-choice-list">${options.map(([value, label, help]) => {
    const active = application[field] === value;
    return `<button type="button" class="choice ${active ? "selected" : ""}" data-exhibition-field="${esc(field)}" data-exhibition-value="${esc(value)}" aria-pressed="${active}"><span class="choice-mark" aria-hidden="true">${active ? "✓" : ""}</span><div class="connection-choice-copy"><strong>${esc(label)}</strong>${help ? `<small>${esc(help)}</small>` : ""}</div></button>`;
  }).join("")}</div>`;
}

function exhibitionCanSave() {
  return validateExhibitionApplication(getExhibitionApplication()).valid;
}

function exhibitionError(field) {
  return state.exhibitionErrors?.[field] ? `<p class="field-error">${esc(state.exhibitionErrors[field])}</p>` : "";
}

function renderExhibitionApplication() {
  const application = getExhibitionApplication();
  const isApplying = application.decision === "YES";
  const statusText = state.exhibitionStatus === "sending"
    ? "공모 신청을 저장하고 있어요."
    : state.exhibitionStatus === "confirmed"
      ? "공모 신청을 연구 응답과 분리해 저장했어요."
      : state.exhibitionStatus === "failed"
        ? "전송을 마치지 못했어요. 이 기기에 신청 사본이 남아 있어요."
        : "아직 공모 선택을 저장하지 않았어요.";
  return `<main class="exhibition-layout"><section class="exhibition-main"><div class="archive-label">EXHIBITION OPEN CALL · OPTIONAL</div><h1 tabindex="-1">2026년 12월, 모호주택에서 함께 전시할 작업을 기다립니다</h1><p class="connection-lead">이 페이지는 설문과 정책연구를 마친 뒤 열리는 별도의 전시 공모예요. 설문 응답만으로 자동 신청되거나 선정되지 않으며, 공모를 신청하지 않아도 연구 참여에는 어떤 차이도 생기지 않아요.</p><section class="open-call-summary"><div><span>전시 장소</span><strong>${esc(EXHIBITION_OPEN_CALL.venue)}</strong></div><div><span>예정 시기</span><strong>${esc(EXHIBITION_OPEN_CALL.plannedPeriod)}</strong></div><div><span>신청 단계</span><strong>${esc(EXHIBITION_OPEN_CALL.applicationType)}</strong></div><div><span>대상</span><strong>${esc(EXHIBITION_OPEN_CALL.eligibility)}</strong></div></section><section class="connection-section"><h2>이번 전시 공모에 신청하시겠어요?</h2><p>지금은 1차 작업 제안을 받는 단계예요. 세부 전시 일정, 설치 조건, 작품 운송, 사례와 제작 지원 범위는 큐레이터 검토 뒤 참여 후보자와 개별 협의하고, 최종 참여 전에 다시 확인합니다.</p>${renderExhibitionChoices("decision", [["YES", "네, 1차 작업 제안을 남길게요", "작업 자료와 연락처를 공모 자료로 별도 제출해요"], ["NO", "이번에는 설문 참여로 마칠게요", "연구 응답만 보존하고 공모 자료는 만들지 않아요"]])}${exhibitionError("decision")}</section>${isApplying ? `<section class="connection-section"><h2>공모 대상 안내</h2><p>만 39세 이상으로 시각예술 분야에서 작업해 온 작가·창작자를 대상으로 해요. 현재 전시 활동이 쉬고 있거나 작업 방식이 바뀐 경우도 신청할 수 있어요.</p>${renderExhibitionChoices("eligibility_ack", [["YES", "대상 안내를 확인했고 작가·창작자로 신청합니다"], ["NO", "현재 공모 대상에 해당하지 않습니다"]])}${exhibitionError("eligibility_ack")}</section><section class="connection-section exhibition-fields"><h2>작업 제안</h2><label class="field-label" for="exhibition-name">이름 또는 활동명</label><input id="exhibition-name" class="text-input text-input-single" data-exhibition-input="applicant_name" maxlength="120" value="${esc(application.applicant_name)}" placeholder="전시 안내에 사용할 이름 또는 활동명" />${exhibitionError("applicant_name")}<label class="field-label" for="exhibition-email">연락받을 이메일</label><input id="exhibition-email" class="text-input text-input-single" type="email" data-exhibition-input="email" maxlength="240" value="${esc(application.email)}" placeholder="name@example.com" />${exhibitionError("email")}<label class="field-label" for="exhibition-field">작업 분야</label><input id="exhibition-field" class="text-input text-input-single" data-exhibition-input="work_field" maxlength="180" value="${esc(application.work_field)}" placeholder="예: 사진, 영상, 설치, 회화, 공예, 아카이브" />${exhibitionError("work_field")}<label class="field-label" for="exhibition-portfolio">작업 자료 링크</label><input id="exhibition-portfolio" class="text-input text-input-single" type="url" data-exhibition-input="portfolio_url" maxlength="800" value="${esc(application.portfolio_url)}" placeholder="https://로 시작하는 포트폴리오 또는 공유 폴더 링크" />${exhibitionError("portfolio_url")}<label class="field-label" for="exhibition-proposal">이번 전시에서 함께 보여주고 싶은 작업과 질문</label><textarea id="exhibition-proposal" class="text-input" data-exhibition-input="proposal_text" maxlength="1200" placeholder="현재 이어가고 있는 작업, 공개되지 않았던 과정, 전시에서 함께 나누고 싶은 질문을 한 문단으로 적어 주세요. 설문 답변과 같은 내용을 반복할 필요는 없어요.">${esc(application.proposal_text)}</textarea>${exhibitionError("proposal_text")}</section><section class="connection-section"><h2>설문 참여 기록을 공모 검토와 함께 볼까요?</h2><p>이 선택은 작품의 자격을 판단하는 기준이 아니에요. 참여 기록을 함께 보도록 선택하면, 큐레이터가 작업이 놓인 시간과 조건을 이해하는 참고자료로만 살펴봅니다.</p>${renderExhibitionChoices("research_review_consent", [["YES", "이번 참여 기록을 작업 제안과 함께 검토해도 좋아요"], ["NO", "공모 신청서와 작업 자료만 검토해 주세요"]])}${exhibitionError("research_review_consent")}</section><section class="connection-section connection-safety"><h2>공모 연락처 보관 동의</h2><p>이름과 이메일은 전시 공모 검토, 보완 자료 요청, 선정 결과와 일정 안내에만 사용하며 연구 응답과 분리해 관리해요.</p>${renderExhibitionChoices("contact_consent", [["YES", "공모 연락을 위해 이름과 이메일을 별도 보관하는 데 동의합니다"], ["NO", "연락처를 보관하지 않습니다"]])}${exhibitionError("contact_consent")}</section>` : ""}<div class="exhibition-status" role="status">${esc(statusText)}</div><div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">참여 기록으로 돌아가기</button><button class="primary-button" type="button" data-action="save-exhibition" ${exhibitionCanSave() ? "" : "disabled"}>공모 선택 저장 <span aria-hidden="true">→</span></button></div></section></main>`;
}

function connectionCanSave() {
  const connection = getConnection();
  if (!["YES", "NO"].includes(connection.opt_in)) return false;
  if (connection.opt_in !== "YES") return true;
  const hasOutgoingMessage = Boolean(String(connection.message_text || connection.introduction || "").trim());
  const wantsToReceive = connection.receive_opt_in === "YES";
  if (!hasOutgoingMessage && !wantsToReceive) return false;
  if (wantsToReceive) {
    if (!connection.greeting_connection_preference) return false;
    if (!values(connection.reply_modes).includes("EMAIL_NOTICE")) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(connection.contact_email || "").trim()) && connection.contact_permission === "YES";
  }
  return true;
}

function createConnectionUpdate() {
  const research = state.submitted || createResponse();
  const connection = getConnection();
  const profile = buildConnectionProfile(research, connection);
  const emailAllowed = values(connection.reply_modes).includes("EMAIL_NOTICE") && connection.contact_permission === "YES" && connection.contact_email?.trim();
  return {
    ...research,
    submission_phase: "connection_update",
    submitted_at: new Date().toISOString(),
    connection_profile: profile,
    message_exchange: {
      greeting_id: connection.greeting_id || `${research.response_id}-greeting`,
      message_audience: connection.message_audience || null,
      message_text: String(connection.message_text || connection.introduction || "").trim() || null,
      receive_opt_in: connection.receive_opt_in === "YES",
      receive_scopes: values(connection.receive_scopes).length ? values(connection.receive_scopes) : (connection.receive_opt_in === "YES" ? ["OPEN"] : []),
      greeting_connection_preference: connection.greeting_connection_preference || null,
      translation_allowed: connection.translation_allowed === "YES",
      original_language: research.source_language || state.language || "ko",
      delivery_modes: values(connection.reply_modes),
      status: connection.opt_in === "YES" ? "stored_waiting_receiver" : "not_requested",
      mailbox_delivery: {
        model: "store_and_forward",
        api_roles: ["translation", "safety_check", "letter_formatting", "soft_theme_tagging"],
        ranking_or_value_matching: false,
        human_review: "exception_only",
        expose_contact_between_participants: false,
        state_machine: ["STORED", "WAITING_RECEIVER", "QUEUED", "EMAIL_PENDING", "DELIVERED", "OPENED", "REPLIED_OR_PASSED"],
      },
      email_delivery: {
        sender_name: greetingSenderName,
        sender_email: greetingSenderEmail,
        subject: "[〈만 39세 이상〉] 안부 한 통이 도착했습니다",
        template: "greeting_letter_v2_mailbox",
        queue_policy: "transactional_retry_until_delivered_or_bounced",
        recipient_notice_only: true,
        return_reply_to_origin: {
          enabled_when_origin_opted_in: true,
          expose_contact_between_participants: false,
          notify_via_project_mailbox: true,
        },
      },
    },
    pii: emailAllowed ? {
      email: connection.contact_email.trim(),
      display_name: "",
      role_label: profile.role,
      contact_reason: "project_mailbox_greeting_notice",
      consent_scope: ["greeting_arrival_notice", "greeting_reply_notice"],
    } : null,
  };
}

function renderConnection() {
  const connection = getConnection();
  const response = state.submitted || createResponse();
  if (isRc2) return renderRc2Connection(connection, response);
  const profile = buildConnectionProfile(response, connection);
  const topicOptions = Object.entries(connectionTopics).map(([value, label]) => [value, label]);
  const modeOptions = [["MEDIATED_WEB", "연구팀이 익명 안부 또는 질문을 중계", "이메일과 연락처는 상대에게 공개하지 않습니다."], ["EMAIL_NOTICE", "매칭 제안이 오면 이메일 알림 받기", "이메일은 연구팀의 연락 담당자만 확인합니다."]];
  const connectionStatusLabel = connection.opt_in === "YES" ? "연결 의향 작성 중" : connection.opt_in === "NO" ? "연구 응답만 보관" : "선택 전";
  return `<main class="connection-layout"><section class="connection-main"><div class="archive-label">CONNECTION LAYER · OPTIONAL</div><h1 tabindex="-1">이 응답에서 시작할 수 있는 대화를 열어둘까요?</h1><p class="connection-lead">AI는 누군가의 가치나 적합성을 판정하지 않습니다. 응답의 맥락과 연결 의향을 정리해 연구자에게 후보를 제안하고, 실제 연결은 양쪽의 선택과 연구팀의 검토 뒤에만 이루어집니다.</p>${renderAnalysisCard(response)}<section class="connection-section"><h2>다른 참여자와의 연결을 검토해도 될까요?</h2>${renderConnectionChoices("opt_in", [["YES", "네, 연구팀의 연결 제안을 받아보고 싶습니다"], ["NO", "아니요, 이번에는 연구 응답만 남기겠습니다"]])}</section>${connection.opt_in === "YES" ? `<section class="connection-section"><h2>지금 필요한 대화나 연결은 무엇인가요?</h2><p>최대 세 가지까지 고를 수 있습니다. 이 선택은 매칭 후보를 찾기 위한 단서일 뿐, 자동 연결을 뜻하지는 않습니다.</p>${renderConnectionChoices("needs", topicOptions, { multi: true, max: 3 })}</section><section class="connection-section"><h2>다른 참여자에게 나눌 수 있는 경험이나 관점이 있나요?</h2><p>전문 서비스나 약속이 아니라, 대화에서 나눌 수 있는 관심과 경험의 범위입니다.</p>${renderConnectionChoices("offers", topicOptions, { multi: true, max: 3 })}</section><section class="connection-section"><h2>어떤 방식이 편한가요?</h2>${renderConnectionChoices("reply_modes", modeOptions, { multi: true, max: 2 })}${values(connection.reply_modes).includes("EMAIL_NOTICE") ? `<label class="field-label" for="connection-email">후속 안내를 받을 이메일</label><input id="connection-email" class="text-input text-input-single" type="email" data-connection-input="contact_email" value="${esc(connection.contact_email)}" placeholder="name@example.com" /><div class="connection-consent">${renderConnectionChoices("contact_permission", [["YES", "이 이메일을 연구팀의 매칭 안내용으로 별도 보관하는 데 동의합니다"], ["NO", "이메일을 남기지 않겠습니다"]])}</div>` : ""}</section><section class="connection-section"><h2>연결 카드에 남길 한 줄이 있나요?</h2><p>활동명, 실명, 세부 연락처, 제3자 정보는 적지 않아도 됩니다. 연구팀 검토용이며, 다른 참여자에게 자동 공개되지 않습니다.</p><textarea class="text-input" data-connection-input="introduction" maxlength="400" placeholder="지금 나누고 싶은 질문, 현장, 작업의 조건을 짧게 적어주세요.">${esc(connection.introduction)}</textarea></section><section class="connection-section connection-safety"><h2>연결은 어떻게 이루어지나요?</h2><p>동의한 응답만 검토합니다. 연구팀은 매칭 이유와 공개 범위를 먼저 확인하고, 양쪽이 수락한 뒤에만 안부나 질문을 중계합니다. 자동으로 이메일이나 연락처를 서로 공개하지 않습니다.</p></section>` : ""}</section><aside class="connection-side"><div class="panel-title">CONNECTION STATUS</div><strong>${connectionStatusLabel}</strong><p>${profile.coordinate ? `${esc(profile.coordinate.shortTitle)} 위치를 출발점으로, 필요와 제안이 맞닿는 다른 응답을 연구자가 검토합니다.` : "분석 위치가 정리된 뒤 연결 후보를 검토할 수 있습니다."}</p><button class="primary-button wide-button" type="button" data-action="save-connection" ${connectionCanSave() ? "" : "disabled"}>연결 의향 저장 <span aria-hidden="true">→</span></button><button class="secondary-button wide-button" type="button" data-action="back-to-result">결과로 돌아가기</button><p class="connection-local-status">${state.connectionStatus === "confirmed" ? "연구용 저장소에 연결 의향을 저장했습니다." : submitFunctionUrl ? "저장 뒤 연구팀 검토 상태로 전환됩니다." : "원격 저장소 설정 전에는 이 기기의 재전송 대기열에 보관됩니다."}</p></aside></main>`;
}

function renderGlobalGreetingsConnection(connection) {
  const directionOptions = [
    ["SIMILAR_CONDITIONS", "나와 비슷한 조건을 지나온 사람"],
    ["ROLE_BRIDGE", "다른 역할에서 나의 기록을 읽는 사람"],
    ["CONTINUING_OR_RESTARTING", "작업을 이어가거나 다시 시작한 사람"],
    ["ACROSS_REGION_LANGUAGE", "다른 지역·언어권에서 비슷한 질문을 가진 사람"],
  ];
  const audienceOptions = [
    ["SIMILAR_TIME", "비슷한 변화와 조건을 지나고 있는 사람에게"],
    ["CONTINUING", "작업을 이어가거나 다시 시작한 사람에게"],
    ["DIFFERENT_ROLE", "다른 역할에서 이 기록을 읽는 사람에게"],
    ["ACROSS_PLACE", "다른 지역·언어권의 사람에게"],
    ["OPEN", "방향을 정하지 않고 맡기기"],
  ];
  const emailSelected = values(connection.reply_modes).includes("EMAIL_NOTICE");
  const messageValue = connection.message_text || connection.introduction || "";
  return `<main class="connection-layout rc2-connection-layout greeting-connection">
    <section class="connection-main">
      <div class="greeting-intro"><div class="greeting-object greeting-object-small" aria-hidden="true"><i></i><b></b><span></span></div><div>
        <div class="archive-label">GLOBAL GREETINGS · ACROSS 64 COORDINATES</div>
        <h1 tabindex="-1">안부의 좌표</h1>
        <p class="connection-lead">64개의 좌표를 따라 이어지는 안부입니다. 사람을 평가하거나 완벽한 짝을 찾지 않고, 기록의 세 방향과 역할, 참여자가 고른 방향을 함께 읽어 작은 후보군에서 한 번의 만남을 큐레이션합니다.</p>
      </div></div>
      <section class="connection-section"><h2>이번에는 어떻게 이어둘까요?</h2>${renderConnectionChoices("opt_in", [["YES", "안부를 남기거나 다른 참여자의 안부를 받아볼게요"], ["NO", "이번에는 참여 기록으로 마칠게요"]])}</section>
      ${connection.opt_in === "YES" ? `<section class="connection-section message-first"><h2>한 문장을 맡길까요? <small>선택</small></h2><p>짧은 인사나 질문을 편하게 남길 수 있습니다. 안부 원문은 설문 응답과 분리해 보존하고 번역문으로 덮어쓰지 않습니다.</p>${renderConnectionChoices("message_audience", audienceOptions)}<textarea class="text-input" data-connection-input="message_text" maxlength="600" placeholder="한 문장이나 짧은 안부를 적어주세요.">${esc(messageValue)}</textarea></section>
      <section class="connection-section receive-mail"><h2>어떤 방향의 안부를 기다릴까요?</h2>${renderConnectionChoices("receive_opt_in", [["YES", "안부를 기다릴게요"], ["NO", "이번에는 받지 않을게요"]])}${connection.receive_opt_in === "YES" ? `<p>이 선택은 연구 문항이 아니며 안부 연결에만 사용합니다.</p>${renderConnectionChoices("greeting_connection_preference", directionOptions)}${renderConnectionChoices("translation_allowed", [["YES", "다른 언어의 안부는 원문과 번역을 함께 받아볼게요"], ["NO", "내가 읽을 수 있는 언어의 원문만 받을게요"]])}<h3>도착 사실을 알려드릴 방법</h3>${renderConnectionChoices("reply_modes", [["EMAIL_NOTICE", "이메일로 도착 알림 받기", "상대에게 이메일 주소가 보이지 않습니다"], ["MEDIATED_WEB", "이 기기에서 다시 확인하기", "같은 기기로 돌아와 확인하는 보조 방식입니다"]], { multi: true, max: 2 })}${emailSelected ? `<div class="email-delivery-card"><span>안부 알림 메일</span><strong>${esc(greetingSenderName)}</strong><code>${esc(greetingSenderEmail)}</code><p>안부 본문 전체를 메일에 싣지 않고 안전한 편지 링크를 안내합니다.</p></div><label class="field-label" for="connection-email">알림을 받을 이메일</label><input id="connection-email" class="text-input text-input-single" type="email" data-connection-input="contact_email" value="${esc(connection.contact_email)}" placeholder="name@example.com" />${renderConnectionChoices("contact_permission", [["YES", "이 이메일을 안부 도착과 답장 안내에 사용해도 좋아요"], ["NO", "이메일을 남기지 않을게요"]])}` : `<p class="connection-email-required">안부가 도착했을 때 알 수 있도록 이메일 알림을 선택해주세요.</p>`}` : ""}</section>
      <section class="connection-section connection-safety"><h2>안부가 이동하는 방식</h2><ol class="message-route"><li><b>1</b><span>안부와 연결 방향을 연구 응답·연락처와 분리해 저장합니다.</span></li><li><b>2</b><span>동의, 철회, 차단, 언어 호환과 반복 연결을 먼저 확인합니다.</span></li><li><b>3</b><span>좌표·역할·선택 방향을 함께 읽은 작은 후보군에서 한 사람에게 전합니다.</span></li><li><b>4</b><span>받는 사람은 원문과 번역, 이 안부가 닿은 이유를 읽고 답장하거나 지나갈 수 있습니다.</span></li></ol><p>이름·이메일·전화번호는 상대에게 공개하지 않습니다.</p></section>` : ""}
      <div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">참여 기록으로 돌아가기</button><button class="primary-button" type="button" data-action="save-connection" ${connectionCanSave() ? "" : "disabled"}>안부 선택 저장하기 <span aria-hidden="true">→</span></button></div>
    </section>
  </main>`;
}

function renderRc2Connection(connection, response) {
  return renderGlobalGreetingsConnection(connection, response);
  const audienceOptions = [
    ["SIMILAR_TIME", "비슷한 변화와 조건을 지나고 있는 사람에게", "지속, 전환, 거리두기처럼 가까운 경험을 가진 사람"],
    ["REMEMBERED_PERSON", "예전에 기억했던 작가나 동료에게", "이름이 정확하지 않아도 메시지의 방향만 남길 수 있어요"],
    ["CONTINUING", "활동을 이어가고 있는 누군가에게", "밖에서 잘 보이지 않아도 자신의 방식으로 계속해 온 사람"],
    ["DISTANCED", "잠시 거리를 두고 있는 누군가에게", "멈춤과 이동, 다른 역할을 지나고 있는 사람"],
    ["AUDIENCE", "관객이나 시민에게", "작품을 보고 기억하는 사람에게"],
    ["OPEN", "특정 대상을 정하지 않고 남기기", "이 문장과 연결되는 누군가에게"],
  ];
  const receiveOptions = [
    ["RESONANCE", "비슷한 경험에서 온 안부"],
    ["DIFFERENT_POSITION", "다른 위치에서 온 안부"],
    ["QUESTION_LINK", "나의 질문과 이어지는 안부"],
    ["SHARED_MEMORY", "같은 작가·공간·장면을 기억하는 안부"],
    ["ACROSS_PLACE_TIME", "지역이나 세대를 건너온 안부"],
    ["OPEN", "어떤 방향이든 열어두기"],
  ];
  const contactOptions = [
    ["EMAIL_NOTICE", "이메일로 안부 도착 알림 받기", `보낸 사람의 연락처는 보이지 않으며 ${greetingSenderEmail}에서 편지 링크를 안내합니다`],
    ["MEDIATED_WEB", "이 기기에서 다시 확인하기", "같은 기기로 돌아와 확인하는 보조 방식입니다"],
  ];
  const messageValue = connection.message_text || connection.introduction || "";
  const emailSelected = values(connection.reply_modes).includes("EMAIL_NOTICE");
  const messageStorageCopy = submitFunctionUrl
    ? "이 문장은 설문 응답과 분리해 서버에 보관되며, 연결되는 상대가 생겼을 때 편지 형태로 전달됩니다."
    : "이번 시험판에서는 이 문장을 현재 기기에 보관합니다. 운영 서버가 연결되면 설문 응답과 분리해 저장하고, 연결되는 상대가 생겼을 때 편지 형태로 전달합니다.";
  const routeTitle = submitFunctionUrl ? "안부가 이동하는 방식" : "온라인 운영판에서 안부가 이동하는 방식";
  return `<main class="connection-layout rc2-connection-layout greeting-connection"><section class="connection-main"><div class="greeting-intro"><div class="greeting-object greeting-object-small" aria-hidden="true"><i></i><b></b><span></span></div><div><div class="archive-label">안부 · 연결</div><h1 tabindex="-1">이 기록에서 시작된 안부를 남기거나 받아볼 수 있습니다</h1><p class="connection-lead">안부는 사람을 평가하거나 서로를 짝짓는 기능이 아닙니다. 한 참여자가 프로젝트에 맡긴 안부를 별도 우편함에 보관하고, 안부를 받기로 한 다음 참여자에게 한 통씩 이어서 전달합니다. 받을 사람이 아직 없다면 우편함에서 기다립니다.</p></div></div><section class="connection-section"><h2>이번에는 어떻게 이어둘까요?</h2>${renderConnectionChoices("opt_in", [["YES", "안부를 남기거나 다른 참여자의 안부를 받아볼게요"], ["NO", "이번에는 참여 기록으로 마칠게요"]])}</section>${connection.opt_in === "YES" ? `<section class="connection-section message-first"><h2>누군가에게 전하고 싶은 안부가 있나요? <small>선택</small></h2><p>짧은 인사, 질문, 떠오른 문장처럼 편하게 남길 수 있습니다. ${esc(messageStorageCopy)}</p>${renderConnectionChoices("message_audience", audienceOptions)}<textarea class="text-input" data-connection-input="message_text" maxlength="600" placeholder="한 문장이나 짧은 안부를 적어주세요.">${esc(messageValue)}</textarea></section><section class="connection-section receive-mail"><h2>다른 참여자의 안부나 내가 보낸 안부의 답장을 받아볼까요?</h2>${renderConnectionChoices("receive_opt_in", [["YES", "받아볼게요"], ["NO", "이번에는 받지 않을게요"]])}${connection.receive_opt_in === "YES" ? `<p>받고 싶은 안부의 방향을 최대 세 가지까지 골라주세요.</p>${renderConnectionChoices("receive_scopes", receiveOptions, { multi: true, max: 3 })}<h3>도착 사실을 알려드릴 방법</h3>${renderConnectionChoices("reply_modes", contactOptions, { multi: true, max: 2 })}${emailSelected ? `<div class="email-delivery-card"><span>안부 알림 메일</span><strong>${esc(greetingSenderName)}</strong><code>${esc(greetingSenderEmail)}</code><p>제목에는 〈만 39세 이상〉 안부임을 표시하고, 왜 이 메일을 받았는지 첫 문단에서 설명합니다. 광고성 메일처럼 보이지 않도록 메시지 본문 전체를 메일에 싣지 않고 안전한 편지 링크로 안내합니다.</p></div><label class="field-label" for="connection-email">알림을 받을 이메일</label><input id="connection-email" class="text-input text-input-single" type="email" data-connection-input="contact_email" value="${esc(connection.contact_email)}" placeholder="name@example.com" />${renderConnectionChoices("contact_permission", [["YES", "이 이메일을 안부 도착과 답장 안내에 사용해도 좋아요"], ["NO", "이메일을 남기지 않을게요"]])}` : `<p class="connection-email-required">안부가 도착했을 때 다시 찾아올 수 있도록 이메일 알림을 남기는 방식을 기본으로 안내합니다.</p>`}` : (messageValue ? `<p class="connection-email-required">안부를 남긴 뒤 답장도 받아보고 싶다면 위에서 ‘받아볼게요’를 선택하고 이메일을 남겨주세요. 답장이 생기면 같은 안부우편함에서 도착 사실을 알려드립니다.</p>` : "")}</section><section class="connection-section connection-safety"><h2>${esc(routeTitle)}</h2><ol class="message-route"><li><b>1</b><span>안부와 수신 의향을 설문 응답과 분리해 안부우편함에 저장합니다.</span></li><li><b>2</b><span>받을 사람이 아직 없다면 메시지는 우편함에서 기다립니다.</span></li><li><b>3</b><span>안부를 받기로 한 참여자가 생기면 한 통을 전달 대기열에 올립니다. API는 번역과 안전 점검, 편지 형식 정돈을 돕습니다.</span></li><li><b>4</b><span>받는 사람에게 이메일 알림을 보내고, 편지 화면에서 메시지를 읽거나 답장할 수 있게 합니다.</span></li></ol><p>이름과 이메일은 상대에게 공개하지 않습니다. 전달 시점은 참여 순서와 수신 동의 상태에 따라 달라질 수 있으며, 평가나 선정과는 관계가 없습니다.</p></section>` : ""}<div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">참여 기록으로 돌아가기</button><button class="primary-button" type="button" data-action="save-connection" ${connectionCanSave() ? "" : "disabled"}>안부 선택 저장하기 <span aria-hidden="true">→</span></button></div></section></main>`;
}

function renderComplete() {
  const response = state.submitted;
  if (isRc2) return renderRc2Complete(response);
  const status = state.submissionStatus || "local_only";
  const statusCopy = status === "confirmed"
    ? "RC1 연구 저장소에 응답이 저장되었습니다. 같은 제출은 중복으로 기록되지 않습니다."
    : status === "sending"
      ? "연구용 저장소에 전송하고 있습니다. 이 화면을 잠시 유지해 주세요."
      : status === "unverified"
        ? "전송 요청은 보냈지만 저장 여부를 자동으로 확인하지 못했습니다. 응답 사본은 이 기기에 남아 있습니다."
    : status === "failed"
      ? "연구용 저장소에 연결하지 못했습니다. 응답 사본은 이 기기에 남아 있으며, 다시 보내거나 JSON으로 보관할 수 있습니다."
      : "원격 저장소 설정 전이라 응답을 이 기기의 재전송 대기열에 보관했습니다. JSON 파일로도 내려받을 수 있습니다.";
  const statusClass = ["failed", "unverified"].includes(status) ? "failed" : status === "sending" ? "sending" : "";
  const retryButton = ["failed", "unverified"].includes(status) ? `<button class="secondary-button" type="button" data-action="resend">저장 다시 확인</button>` : "";
  const connection = getConnection();
  const analysisStatus = response.coordinate_status === "complete"
    ? "분석 좌표 정리됨"
    : response.coordinate_status === "mixed"
      ? "복합 응답으로 기록됨"
      : response.coordinate_status === "insufficient"
        ? "분석을 위한 단서가 더 필요함"
        : "베타 연결 좌표";
  const connectionCopy = connection.opt_in === "YES" ? "연결 의향을 남겼습니다. 연구팀 검토 뒤에만 다음 대화가 제안됩니다." : "이 응답을 바탕으로, 다른 지역과 역할의 참여자에게 건넬 수 있는 다음 대화를 선택할 수 있습니다.";
  const feedbackButton = sampleType === "institution_review" ? `<button class="secondary-button" type="button" data-action="institution-feedback">기관 검토 피드백</button>` : "";
  return `<main class="complete-grid"><section class="memory-card"><div class="card-header"><span>PUBLIC MEMORY RECORD</span><strong>${esc(response.response_id)}</strong></div><h1>공공 기억 기록</h1><p class="certificate-copy">응답을 기록했습니다. 연구 응답을 먼저 보존한 뒤에만, 원한다면 별도의 연결 의향을 남길 수 있습니다.</p><div class="submit-status ${statusClass}">${esc(statusCopy)}</div>${renderAnalysisCard(response)}<div class="connection-next"><strong>다음 대화의 가능성</strong><p>${esc(connectionCopy)}</p><button class="primary-button" type="button" data-action="connection">연결 의향 살펴보기 <span aria-hidden="true">→</span></button></div><dl><div><dt>RESPONSE ID</dt><dd>${esc(response.response_id)}</dd></div><div><dt>ROUTE</dt><dd>${esc(response.route || "—")}</dd></div><div><dt>MEMORY TYPE</dt><dd>${esc(response.answers.memory_type || "—")}</dd></div><div><dt>ANALYSIS STATUS</dt><dd>${esc(analysisStatus)}</dd></div></dl><div class="export-actions"><button class="secondary-button" type="button" data-action="download">JSON 저장</button>${retryButton}${feedbackButton}<button class="primary-button" type="button" data-action="restart">새 기억 입력</button></div></section></main>`;
}

function rc2AxisValue(response, axis) {
  const profile = buildConnectionProfile(response, getConnection());
  const value = profile.coordinate?.axes?.[axis.toLowerCase()] || response.axes?.[`${axis.toLowerCase()}_primary`] || null;
  const labels = {
    M1: "느낌과 분위기", M2: "삶의 경험과 기억", M3: "창작의 생각과 새로운 시도", M4: "사람과 사회의 관계",
    S1: "더 넓어지는 중", S2: "이어지는 중", S3: "다른 의미나 방식으로 바뀌는 중", S4: "잠시 거리를 두거나 한계를 살피는 중",
    D1: "만날 기회와 접근", D2: "개인의 기반", D3: "관계와 매개", D4: "제도와 구조",
  };
  return labels[value] || "여러 방향이 함께 남아 있습니다.";
}

function renderRc2Complete(response) {
  const english = state.language === "en";
  const status = state.submissionStatus || "local_only";
  const statusCopy = status === "confirmed"
    ? (english ? "Your record has been saved as research material." : "당신의 기록을 연구 자료로 저장했어요.")
    : status === "sending"
      ? (english ? "Saving your participation record as research material." : "참여 기록을 연구 자료로 저장하고 있어요.")
      : status === "unverified"
        ? (english ? "The save request has been sent." : "저장 요청을 마쳤어요.")
        : (english ? "This pilot record has been saved." : "이번 시험 기록을 저장했어요.");
  const retryButton = ["failed", "unverified"].includes(status) ? `<button class="secondary-button" type="button" data-action="resend">${esc(english ? "Check saving again" : "저장 다시 확인")}</button>` : "";
  const document = response.response_document || buildResponseDocument({
    responseId: response.response_id,
    answers: response.answers,
    sourceLanguage: response.interaction_language || response.source_language,
    releaseVersion: response.release_version,
    approvedOriginal: response.reflection?.participant_approved_text || "",
    approvedKorean: response.reflection?.participant_approved_text_ko || "",
    createdAt: response.submitted_at,
    confirmedAt: response.document_confirmation?.confirmed_at || response.submitted_at,
    final: true,
  });
  const openCallSection = `<section class="rc2-open-call-next"><div class="open-call-badge">${esc(english ? "December 2026 · Moho House" : "2026년 12월 · 모호주택")}</div><h2>${esc(english ? "Open call" : "공모")}</h2><p>${esc(english ? "We are waiting for work to share at Moho House in December 2026." : "2026년 12월 · 모호주택에서 함께할 작업을 기다립니다.")}</p><button class="primary-button" type="button" data-action="open-call">${esc(english ? "View open call" : "공모 보기")} <span aria-hidden="true">↗</span></button></section>`;
  const audienceLead = isAudienceContext()
    ? (english ? "This document holds an audience member’s memories, their wish to return, and the conditions for taking part." : "이 문서에는 관객의 기억과 판단, 다시 찾고 싶은 마음과 참여 조건이 함께 담겼어요.")
    : (english ? "This document becomes part of a record of the present in arts and culture." : "이 문서는 문화예술의 현재를 기록하는 자료로 이어집니다.");
  const greetingSystemCopy = submitFunctionUrl
    ? (english ? "A greeting is kept separately from the survey response and curated across 64 coordinates. Names and email addresses are never shared between participants." : "참여자가 맡긴 안부는 설문 응답과 분리해 보관하고 64개의 좌표를 따라 큐레이션합니다. 이름과 이메일은 서로에게 공개하지 않습니다.")
    : (english ? "Global Greetings is being prepared as a curated encounter across 64 coordinates. Names and email addresses are never shared between participants." : "안부의 좌표는 64개의 좌표를 따라 한 번의 만남을 큐레이션하는 방식으로 준비하고 있습니다. 이름과 이메일은 서로에게 공개하지 않습니다.");
  const greetingMailCopy = submitFunctionUrl
    ? (english ? `If a new greeting or reply arrives, we will send a notice from <b>〈Over 39〉 Greeting Mailbox &lt;${esc(greetingSenderEmail)}&gt;</b>. The opening explains that it is a project greeting and why you received it; the message itself opens on a letter page.` : `새 안부나 답장이 도착하면 <b>${esc(greetingSenderName)} &lt;${esc(greetingSenderEmail)}&gt;</b> 이름으로 알림을 보냅니다. 메일 첫 문단에서 프로젝트 안부라는 점과 수신 이유를 설명하고, 메시지는 편지 화면에서 열어봅니다.`)
    : (english ? `In the live service, a notice will be sent from <b>〈Over 39〉 Greeting Mailbox &lt;${esc(greetingSenderEmail)}&gt;</b> when a greeting or reply arrives. This pilot does not send email; that begins only after the sender account and server mail queue are connected.` : `온라인 운영판에서는 새 안부나 답장이 도착할 때 <b>${esc(greetingSenderName)} &lt;${esc(greetingSenderEmail)}&gt;</b> 이름으로 알림을 보낼 예정입니다. 현재 시험판은 실제 이메일을 발송하지 않으며, 발신 계정과 서버 메일 큐가 연결된 뒤 작동합니다.`);
  return `<main class="rc2-complete response-document-complete"><section class="rc2-complete-main"><div class="archive-label">${esc(english ? "〈Over 39〉 · PARTICIPATION RECORD" : "〈만 39세 이상〉 · 참여 기록")}</div><h1 tabindex="-1">${esc(english ? "We keep your record" : "당신의 기록을 남깁니다")}</h1><p class="rc2-complete-lead">${esc(statusCopy)} ${esc(english ? "We will stay with the memories and the stories of the present gathered here." : "여기 적힌 기억과 지금의 이야기를 오래 살펴보겠습니다.")} ${esc(audienceLead)}</p><div class="response-document-preview response-document-final">${renderResponseDocument(document)}</div><div class="export-actions"><button class="secondary-button" type="button" data-action="print-document">${esc(english ? "Print or save as PDF" : "인쇄·PDF 저장")}</button>${retryButton}</div><section class="rc2-greeting-hub"><div class="greeting-object" aria-hidden="true"><i></i><b></b><span></span></div><div class="greeting-hub-copy"><div class="archive-label">${esc(english ? "GREETING · CONNECTION" : "안부 · 연결")}</div><h2>${esc(english ? "One greeting entrusted here can reach the next person" : "누군가가 맡긴 안부 한 통이 다음 사람에게 도착합니다")}</h2><p>${esc(greetingSystemCopy)}</p><p class="greeting-email-note"><strong>${esc(english ? "Leave an email address if you would like to receive a greeting." : "안부를 받고 싶다면 이메일을 남겨주세요.")}</strong> ${greetingMailCopy}</p><div class="export-actions"><button class="primary-button" type="button" data-action="connection">${esc(english ? "Leave a greeting or choose how to receive one" : "안부 남기고 받을 방법 정하기")} <span aria-hidden="true">→</span></button><button class="secondary-button" type="button" data-action="referral">${esc(english ? "Tell the next participant about the project" : "다음 참여자에게 프로젝트 전하기")} <span aria-hidden="true">→</span></button></div></div></section>${openCallSection}<div class="export-actions restart-action"><button class="secondary-button" type="button" data-action="restart">${esc(english ? "Start a new record" : "새 기록 시작하기")}</button></div></section></main>`;
}

function getReferral() {
  const responseId = state.responseId || state.submitted?.response_id || "draft";
  try {
    return JSON.parse(localStorage.getItem(referralKey(responseId)) || "null") || {
      name: "", email: "", reason: "", show_referrer: "NO", consent: "NO", sent_at: null,
    };
  } catch {
    return { name: "", email: "", reason: "", show_referrer: "NO", consent: "NO", sent_at: null };
  }
}

function saveReferralDraft(referral) {
  const responseId = state.responseId || state.submitted?.response_id || "draft";
  localStorage.setItem(referralKey(responseId), JSON.stringify(referral));
}

function referralCanSave(referral = getReferral()) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(referral.email || "").trim()) && referral.consent === "YES";
}

function renderReferral() {
  const referral = getReferral();
  const referrer = state.submitted?.response_document?.participant?.display_name || "참여자";
  const status = state.referralStatus;
  const statusCopy = status === "confirmed"
    ? "추천 안내 요청을 저장했어요."
    : status === "queued" || status === "local_only"
      ? "이번 시험판에서는 추천 정보를 이 기기에 보관해요. 실제 이메일 발송은 서버 연결 뒤 작동합니다."
      : status === "sending" ? "추천 안내 요청을 저장하고 있어요." : "";
  return `<main class="referral-layout"><section class="referral-main"><div class="archive-label">다음 참여자 추천</div><h1 tabindex="-1">이 프로젝트를 함께 떠올리고 싶은 사람이 있나요?</h1><p class="connection-lead">추천받은 사람에게 〈만 39세 이상〉 프로젝트와 참여 링크를 이메일로 안내합니다. 추천은 안부 중계와 분리되며, 참여 여부는 추천받은 사람이 직접 정합니다.</p><div class="referral-fields"><label><span>이름 또는 활동명 <small>선택</small></span><input type="text" data-referral-input="name" value="${esc(referral.name)}" /></label><label><span>이메일 주소 <b>필수</b></span><input type="email" data-referral-input="email" value="${esc(referral.email)}" placeholder="name@example.com" /></label><label><span>추천한 이유 <small>선택</small></span><textarea data-referral-input="reason" maxlength="500" placeholder="함께 나누고 싶은 이유를 짧게 적어주세요.">${esc(referral.reason)}</textarea></label></div><div class="referral-options"><label class="final-check"><input type="checkbox" data-referral-check="show_referrer" ${referral.show_referrer === "YES" ? "checked" : ""} /><span>안내 메일에 추천자 표기 ‘${esc(referrer)}’를 함께 전합니다.</span></label><label class="final-check"><input type="checkbox" data-referral-check="consent" ${referral.consent === "YES" ? "checked" : ""} /><span>입력한 이메일을 프로젝트 참여 안내에 사용하는 내용을 확인했어요.</span></label></div>${statusCopy ? `<p class="referral-status">${esc(statusCopy)}</p>` : ""}<div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">참여 기록으로 돌아가기</button><button class="primary-button" type="button" data-action="save-referral" ${referralCanSave(referral) && status !== "sending" ? "" : "disabled"}>추천 안내 요청하기 <span aria-hidden="true">→</span></button></div></section></main>`;
}

function renderFeedbackChoices(field, options) {
  return `<div class="choice-list compact-choices">${options.map(([value, label]) => {
    const selected = state.feedback[field] === value;
    return `<button class="choice ${selected ? "selected" : ""}" type="button" data-feedback-field="${esc(field)}" data-feedback-value="${esc(value)}" aria-pressed="${selected}"><span aria-hidden="true">${selected ? "✓" : ""}</span><strong>${esc(label)}</strong></button>`;
  }).join("")}</div>`;
}

function feedbackCanSubmit() {
  return ["flow_clarity", "role_fit", "duration", "depth_repeat", "opened_thought", "felt_leading", "result_fit", "revision_clarity", "consent_separation", "share_readiness", "link_to_response"].every((field) => state.feedback[field]);
}

function renderInstitutionFeedback() {
  const scale = [["1", "전혀 그렇지 않다"], ["2", "그렇지 않은 편"], ["3", "보통"], ["4", "그런 편"], ["5", "매우 그렇다"]];
  const yesNo = [["YES", "예"], ["NO", "아니요"], ["UNSURE", "잘 모르겠다"]];
  const rows = [
    ["flow_clarity", "질문의 전체 흐름을 이해하기 쉬웠나요?", scale],
    ["role_fit", "선택한 역할에 질문이 잘 맞았나요?", scale],
    ["duration", "전체 소요시간은 어떠했나요?", [["SHORT", "짧았다"], ["RIGHT", "적당했다"], ["LONG", "길었다"]]],
    ["depth_repeat", "심화질문이 앞의 질문을 반복한다고 느꼈나요?", yesNo],
    ["opened_thought", "질문이 새로운 생각이나 경험을 열어 주었나요?", scale],
    ["felt_leading", "특정 답을 유도한다고 느꼈나요?", yesNo],
    ["result_fit", "최종 결과가 자신의 응답과 가까웠나요?", scale],
    ["revision_clarity", "결과를 수정하거나 남기지 않는 기능을 이해했나요?", yesNo],
    ["consent_separation", "연구 동의와 관계 참여 동의의 차이를 이해했나요?", yesNo],
    ["share_readiness", "기관 구성원에게 전달할 수 있는 수준인가요?", scale],
  ];
  return `<main class="feedback-layout"><section class="feedback-main"><div class="archive-label">INSTITUTION RC1 REVIEW · ${esc(institutionCode || "UNASSIGNED")}</div><h1 tabindex="-1">기관 사전검증 의견을 들려주세요.</h1><p class="connection-lead">이 피드백은 실제 연구 통계와 분리해 저장됩니다. 마지막 선택에서 동의한 경우에만 방금 제출한 연구응답과 함께 검토합니다.</p>${rows.map(([field, title, options], index) => `<section class="feedback-question"><span>${String(index + 1).padStart(2, "0")}</span><h2>${esc(title)}</h2>${renderFeedbackChoices(field, options)}</section>`).join("")}${renderText("feedback_must_fix", { field: "feedback_must_fix", value: state.feedback.must_fix || "", label: "공개 전에 반드시 고칠 부분", placeholder: "없다면 ‘없음’이라고 적어주세요." })}${renderText("feedback_other", { field: "feedback_other", value: state.feedback.other || "", label: "기타 의견 (선택)", placeholder: "질문, 디자인, 운영 방식에 대한 의견" })}<section class="feedback-question"><span>11</span><h2>이 피드백을 방금 제출한 응답과 함께 검토해도 될까요?</h2><p>동의하지 않으면 기관 피드백만 별도로 보관합니다.</p>${renderFeedbackChoices("link_to_response", [["YES", "네, 방금 응답과 함께 검토해도 됩니다"], ["NO", "아니요, 피드백만 따로 남깁니다"]])}</section><div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">결과로 돌아가기</button><button class="primary-button" type="button" data-action="submit-feedback" ${feedbackCanSubmit() ? "" : "disabled"}>기관 피드백 제출 <span aria-hidden="true">→</span></button></div></section></main>`;
}

function renderSurvey() {
  const screens = activeScreens();
  state.step = Math.min(state.step, screens.length - 1);
  const id = screens[state.step];
  const meta = progressMeta(id);
  const adaptiveScreen = Boolean(adaptiveScreenCheckpoint[id]);
  const nextLabel = id === "USE_SCOPE"
    ? "이 범위로 기록 저장하기"
    : id === "SUBMIT"
      ? "활용 범위 정하기"
    : id === "FIXED_CHECKPOINT"
      ? "이어지는 질문 시작하기"
      : adaptiveScreen
        ? state.adaptiveGenerating ? "답변을 읽고 있어요" : "이 답변에서 이어가기"
        : state.depthGenerating ? "질문을 준비하고 있습니다" : id === "DEPTH_D" && state.summaryGenerating ? "정리하고 있습니다" : state.summaryGenerating ? "기록을 정리하고 있습니다" : state.translationGenerating ? "번역을 준비하고 있습니다" : "다음";
  const nextDisabled = !canContinue(id) || state.fixedCheckpointSaving || state.depthGenerating || state.adaptiveGenerating || state.summaryGenerating || state.translationGenerating;
  return `<main class="interview-layout"><section class="interview-panel" aria-live="polite" aria-labelledby="question-title"><div class="progress-track" role="progressbar" aria-label="Survey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${meta.progress}"><span style="width:${meta.progress}%"></span></div><div class="interview-meta"><span>${esc(t(meta.label))}</span>${meta.count ? `<strong>${esc(t(meta.count))}</strong>` : ""}</div>${screenBody(id)}</div><div class="survey-actions"><button class="secondary-button" type="button" data-action="back" ${state.step === 0 || state.fixedCheckpointSaving || state.depthGenerating || state.adaptiveGenerating || state.summaryGenerating || state.translationGenerating ? "disabled" : ""}><span aria-hidden="true">←</span> ${esc(t("이전"))}</button><span></span><button class="primary-button" type="button" data-action="next" ${nextDisabled ? "disabled" : ""}>${esc(t(nextLabel))} <span aria-hidden="true">→</span></button></div></section></main>`;
}

function researchJourney() {
  return `<section class="research-journey research-axes" aria-label="설문 구조">
    <div class="journey-heading"><span>THREE DIRECTIONS · YOUR RECORD</span><strong>기억에서 현재로, 현재에서 이어가기 위한 조건으로 이동합니다.</strong></div>
    <div class="journey-steps journey-steps-three">
      <div><span>01</span><strong>기억</strong><p>사람, 작품, 공간, 장면과 오래 남은 이유</p></div>
      <div><span>02</span><strong>현재</strong><p>지금 이어지는 활동, 관람, 역할과 변화</p></div>
      <div><span>03</span><strong>조건</strong><p>시간, 공간, 관계, 매개와 제도</p></div>
    </div>
    <div class="journey-result"><strong>마지막 기록</strong><p>답변을 한 편의 <b>참여 기록</b>으로 모아 직접 읽고 다듬습니다. 마지막에는 기억의 의미, 현재의 흐름, 이어가기 위한 조건을 직접 확인하고 이번 기록과 가까운 위치를 함께 살펴봅니다.</p></div>
  </section>`;
}

function renderIntro() {
  const draft = loadDraft();
  const pending = loadPending();
  if (isRc2) {
    const questionNote = liveAiEnabled
      ? `<section class="ai-role-note"><span>${esc(t("연결 질문"))}</span><p>${esc(t("일부 구간에서는 앞선 답변을 구체화하는 질문이 이어집니다."))}</p></section>`
      : `<section class="ai-role-note"><span>${esc(t("연결 질문"))}</span><p>${esc(t("앞선 답변에서 이어지는 질문이 세 구간에 나누어 나타납니다."))}</p></section>`;
    return `<main class="rc2-intro">
      <section class="rc2-intro-main">
        <div class="intro-hero">
          <div class="archive-label">〈만 39세 이상〉 · RESEARCH & OPEN CALL</div>
          <h1 tabindex="-1">${esc(t("기억에서 시작해, 지금의 문화예술 생태계를 함께 읽습니다."))}</h1>
          <div class="intro-copy">
            <p>${esc(t("〈만 39세 이상〉은 작가와 창작자, 기획자, 비평가, 교육자, 관객·시민이 문화예술을 기억하고 이어온 시간을 기록하는 조사입니다."))}</p>
            <p>${esc(t("답변의 흐름은 마지막에 세 방향으로 이어집니다. 기억에 남은 의미, 지금의 흐름, 이어가기 위한 조건을 따라 이번 기록이 어디에 놓이는지 함께 살펴봅니다."))}</p>
          </div>
          ${creditBlock("intro")}
        </div>
        <section class="entry-route-grid" aria-label="참여 경로">
          <article class="entry-route-card interactive-tilt">
            <div class="route-object route-logo route-logo-led" aria-hidden="true"><span class="route-logo-shadow">${ledWordmark({ className: "route-led-wordmark", decorative: true, fill: "#777873" })}</span><span class="route-logo-body">${ledWordmark({ className: "route-led-wordmark", decorative: true })}</span></div><span>RESEARCH</span>
            <h2>${esc(t("문화예술 경험 기록"))}</h2>
            <p>${esc(t("작가·창작자·비평가·기획자·교육자·관객·시민의 경험을 기억·현재·조건의 세 구간을 따라 듣습니다."))}</p>
            <div class="entry-route-meta">${esc(t("기억의 의미 · 현재의 흐름 · 이어가기 위한 조건 · 참여 기록"))}</div>
            <div class="entry-route-actions"><button class="primary-button" type="button" data-action="start">${esc(t("설문 시작하기"))} <span aria-hidden="true">→</span></button>${draft ? `<button class="secondary-button" type="button" data-action="resume">${esc(t("작성 이어가기"))}</button>` : ""}</div>
          </article>
          <article class="entry-route-card entry-route-call interactive-tilt">
            <div class="route-object route-logo route-logo-moho" aria-hidden="true"><span class="route-logo-shadow"></span><span class="route-logo-body">${mohoHouseMark({ className: "route-moho-mark" })}</span></div><span>2026 OPEN CALL</span>
            <h2>${esc(t("공모"))}</h2>
            <p>${esc(t("2026년 12월 · 모호주택에서 함께할 작업을 기다립니다."))}</p>
            <div class="entry-route-meta">${esc(t("설문 참여와 독립된 공모입니다"))}</div>
            <div class="entry-route-actions"><button class="primary-button" type="button" data-action="open-call">${esc(t("공모 보기"))} <span aria-hidden="true">↗</span></button></div>
          </article>
        </section>
        <p class="entry-route-note">${esc(t("설문과 공모는 각각 독립적으로 참여합니다. 설문에서 만든 참여 기록은 본인이 선택한 경우에만 공모 자료와 연결됩니다."))}</p>
        ${researchJourney()}
        ${questionNote}
        <section class="intro-closing"><strong>${esc(t("정확한 이름이나 연도가 떠오르지 않아도 괜찮습니다."))}</strong><p>${esc(t("남아 있는 장면에서 시작해 현재의 경험과 앞으로 필요한 조건까지 차분히 이어갑니다."))}</p></section>
      </section>
    </main>`;
  }
  const institutionLine = institutionCode ? `<div class="institution-invite"><span>INVITED REVIEW</span><strong>${esc(institutionCode)}</strong><p>이 링크의 응답은 기관 사전검증 자료로 분리 저장됩니다.</p></div>` : "";
  return `<main class="intro-grid"><section class="intro-main"><div class="archive-label">PUBLIC MEMORY RESEARCH · 2026 / OVER 39</div><h1 tabindex="-1">누가 이 작가를 기억하는가.</h1><div class="project-lockup"><p class="project-title">〈만 39세 이상〉</p><span>대구 시각예술 기억 수집과 창작 지속 조건 인식조사</span></div><p class="intro-copy">남아 있는 이름과 장면을 기록하고, 지금의 조건을 함께 살핍니다.</p>${institutionLine}${researchJourney()}<div class="intro-actions"><button class="primary-button" type="button" data-action="notice">리서치 흐름 보기 <span aria-hidden="true">→</span></button>${draft ? `<button class="secondary-button" type="button" data-action="resume">작성 이어가기</button>` : ""}${pending ? `<button class="secondary-button" type="button" data-action="recover-pending">이전 제출 상태 확인</button>` : ""}<span>ONE QUESTION AT A TIME · INSTITUTION RC1</span></div></section><aside class="intro-side"><div class="side-label"><span>ARCHIVE NOTE</span><strong>01</strong></div><p>남아 있는 장면 하나와 지금의 경험에서 이야기를 시작해 주세요.</p><div class="certificate-mini"><div><span>duration</span><strong>약 8-12분</strong></div><div><span>questions</span><strong>고정 연구질문 + 연결 질문</strong></div><div><span>connection</span><strong>제출 뒤 선택 참여</strong></div><div><span>version</span><strong>RC1</strong></div></div>${creditBlock()}</aside></main>`;
}

function renderNotice() {
  const deliveryNotice = submitFunctionUrl
    ? "원문과 참여자가 확인한 설명을 연구 기록으로 보존해요."
    : "이번 파일럿의 응답은 이 기기에 보관해요.";
  if (isRc2) {
    return `<main class="notice-layout"><section class="notice-main"><div class="archive-label">${esc(t("참여 안내"))}</div><h1 tabindex="-1">${esc(t("기억·현재·조건의 세 구간으로 이어집니다."))}</h1><div class="notice-list"><div><span>01</span><strong>${esc(t("기억"))}</strong><p>${esc(t("오래 남아 있는 사람, 작품, 공간과 장면"))}</p></div><div><span>02</span><strong>${esc(t("현재"))}</strong><p>${esc(t("지금 이어지는 활동, 관람, 역할과 변화"))}</p></div><div><span>03</span><strong>${esc(t("조건"))}</strong><p>${esc(t("앞으로 이어가기 위한 시간, 공간, 관계와 제도"))}</p></div></div><p class="notice-assurance">${esc(t("일부 답변 뒤에는 앞선 응답을 조금 더 구체화하는 연결 질문이 나타납니다. 마지막 참여 기록은 직접 읽고 다듬습니다."))}</p></section><aside class="notice-side"><div class="panel-title">RESEARCH</div><p class="notice-assurance">${esc(t("정책연구 활용 범위는 마지막에 정합니다. 전시 공모와 안부·연락은 별도의 선택으로 이어집니다."))}</p><p class="notice-assurance">${esc(t("문의"))} · <a href="mailto:${researchContactEmail}">${researchContactEmail}</a></p><button class="primary-button wide-button" type="button" data-action="start">${esc(t("설문 시작하기"))} <span aria-hidden="true">→</span></button></aside></main>`;
  }
  return `<main class="notice-layout"><section class="notice-main"><div class="archive-label">응답 전 안내</div><h1 tabindex="-1">기억과 현재의 경험을 차례로 들어요.</h1><p>남아 있는 장면과 지금의 조건을 기록합니다.</p></section><aside class="notice-side"><div class="panel-title">RESEARCH NOTICE</div><p class="notice-assurance">${esc(deliveryNotice)}</p><button class="primary-button wide-button" type="button" data-action="start">시작하기 <span aria-hidden="true">→</span></button></aside></main>`;
}

function bindInteractiveMotion() {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  if (reduced || coarse) return;
  document.querySelectorAll(".interactive-tilt").forEach((card) => {
    const move = (event) => {
      const rect = card.getBoundingClientRect();
      const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const dx = px - 0.5;
      const dy = py - 0.5;
      const length = Math.hypot(dx, dy);
      const shadowX = length > 0.04 ? (dx / length) * 2.25 : 1.6;
      const shadowY = length > 0.04 ? (dy / length) * 2.25 : 1.6;
      card.style.setProperty("--logo-shadow-x", `${shadowX.toFixed(2)}px`);
      card.style.setProperty("--logo-shadow-y", `${shadowY.toFixed(2)}px`);
    };
    const reset = () => {
      card.style.setProperty("--logo-shadow-x", "2px");
      card.style.setProperty("--logo-shadow-y", "2px");
    };
    card.addEventListener("pointermove", move, { passive: true });
    card.addEventListener("pointerleave", reset, { passive: true });
  });
}

function traceCurrentAnchorDom() {
  if (!isRc2 || state.phase !== "survey" || state.adaptiveGenerating) return;
  const screen = activeScreens()[state.step];
  const checkpoint = adaptiveScreenCheckpoint[screen];
  if (!checkpoint) return;
  const turn = currentAdaptiveTurn(checkpoint);
  if (!turn) return;
  const domText = document.querySelector("#question-title")?.textContent || "";
  const match = verifyDomQuestion(turn, domText);
  const changed = turn.dom_match !== match || turn.rendered_question !== domText;
  turn.dom_match = match;
  turn.rendered_question = domText;
  const run = values(state.answers.adaptive_ai_runs).find((item) => item?.client_request_id && item.client_request_id === turn.client_request_id);
  if (run) {
    run.dom_match = match;
    run.rendered_question = domText;
    run.real_motif_pass = isStrictRealMotifPass(run, match);
  }
  if (changed) {
    console.info("OVER39_ANCHOR_RENDER_TRACE", JSON.stringify({
      anchor_id: checkpoint,
      source: turn.source,
      provider: turn.provider,
      request_id: turn.request_id,
      client_request_id: turn.client_request_id,
      client_request_id_returned: run?.client_request_id_returned || null,
      CLIENT_REQUEST_ID_MATCH: turn.client_request_id_match === true,
      http_status: run?.http_status ?? null,
      latency_ms: run?.latency_ms ?? null,
      error_code: run?.error_code || null,
      fallback_reason: run?.fallback_reason || null,
      DOM_MATCH: match,
      REAL_MOTIF_PASS: isStrictRealMotifPass({ ...turn, dom_match: match }, match),
    }));
    saveDraft();
  }
}

function render(focusHeading = false) {
  const scrollPosition = { x: window.scrollX, y: window.scrollY };
  document.documentElement.lang = state.language;
  const content = state.phase === "loading" ? "<main class='interview-layout'>불러오는 중입니다.</main>" : state.phase === "intro" ? renderIntro() : state.phase === "notice" ? renderNotice() : state.phase === "complete" ? renderComplete() : state.phase === "exhibition" ? (isRc2 ? renderComplete(state.submitted || createResponse()) : renderExhibitionApplication()) : state.phase === "connection" ? renderConnection() : state.phase === "referral" ? renderReferral() : state.phase === "feedback" ? renderInstitutionFeedback() : renderSurvey();
  root.innerHTML = `<div class="site-shell phase-${esc(state.phase)}">${header()}${content}${footer()}</div>`;
  if (isRc2 && state.phase === "complete") {
    const greetingHub = root.querySelector(".rc2-greeting-hub");
    if (greetingHub) {
      const label = greetingHub.querySelector(".archive-label");
      const title = greetingHub.querySelector("h2");
      if (label) label.textContent = "GLOBAL GREETINGS · ACROSS 64 COORDINATES";
      if (title) title.textContent = state.language === "en" ? "Greetings across 64 coordinates" : "안부의 좌표";
      if (!globalGreetingsEnabled) {
        const button = greetingHub.querySelector("button[data-action='connection']");
        if (button) { button.disabled = true; button.textContent = state.language === "en" ? "Opens after operating conditions are confirmed" : "운영 조건 확정 후 시작합니다"; }
      }
    }
  }
  traceCurrentAnchorDom();
  bindInteractiveMotion();
  requestAnimationFrame(() => {
    if (focusHeading) document.querySelector("h1[tabindex='-1'], h2[tabindex='-1']")?.focus({ preventScroll: true });
    else {
      const restoreScroll = () => window.scrollTo({ left: scrollPosition.x, top: scrollPosition.y, behavior: "auto" });
      restoreScroll();
      requestAnimationFrame(restoreScroll);
      window.setTimeout(restoreScroll, 0);
    }
  });
}

function changeChoice(id, value, multi, max, exclusive) {
  const item = question(id);
  const field = storedField(item) || id;
  const researchEditIds = new Set([
    "P01_CONTEXT", "P02G", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09_COUNTRY", "P10",
    "P14", "P15", "P16", "P17", "P18", "P11", "P12", "P13", "P13_TEXT", "P19", "P19_TEXT",
    "M01", "M02", "M03", "M04", "M04_TEXT", "M05", "M06", "M06_YEAR", "M07", "M08", "M09", "M10",
    "D_FOCUS", "D01", "D02", "D02_TEXT", "D03", "D04", "R01", "C00", "C01", "C02", "C03",
  ]);
  const reconcileIfResearchEdit = (questionId) => {
    if (isRc2 && researchEditIds.has(questionId)) reconcileAnchorsAfterResearchEdit(questionId);
  };
  if (!multi) {
    if (id === "P01") {
      state.answers = resetForRouteChange(state.answers, value);
      clearDepthOutcome();
    } else {
      state.answers[field] = value;
      if (id === "RC01") state.answers[storedField(question("RC02")) || "consent.ai_processing_ack"] = value;
    }
    if (id === "P01_CONTEXT" && value !== "PROFESSIONAL") state.answers = sanitizeAnswersForRoute(state.answers);
    if (id === "ID01") {
      if (value === "ANONYMOUS") delete state.answers.display_name;
      clearDocumentConfirmation();
    }
    if (["P14", "P15"].includes(id) && !needsPauseContext(state.answers)) ["pause_context_tags", "pause_context_other", "pause_meaning", "pause_context_text"].forEach((key) => delete state.answers[key]);
    if (id === "P02G") { delete state.answers.role_primary; delete state.answers.role_primary_other; delete state.answers.roles_parallel; delete state.answers.roles_parallel_other; }
    if (id === "M01" && value === "NO_RECALL") ["memory_clue_text", "memory_branch_followup", "memory_meaning_text", "m_declared", "m_support_tags", "memory_time_band", "memory_year_optional", "memory_locations", "memory_experience_modes", "memory_experience_modes_other", "memory_relationship", "witness_role"].forEach((key) => delete state.answers[key]);
    if (id === "P11" && ["SKIP", "UNSURE"].includes(value)) delete state.answers.transition_text;
    if (id === "P13" && !["YES", "MIXED"].includes(value)) delete state.answers.invisible_continuity_text;
    if (id === "D_FOCUS") ["d_current_gap", "d_desired_change_primary", "desired_change_text", "d_context_tags", "d_context_tags_other", "d_context_impact_text"].forEach((key) => delete state.answers[key]);
    if (id === "reflection_action") {
      delete state.answers.participant_revision;
      clearDocumentConfirmation();
    }
    reconcileIfResearchEdit(id);
    if (id === "document_confirmation_ack" && value !== "YES") {
      delete state.answers.document_confirmed_at;
      delete state.answers.response_document_draft;
    }
  } else {
    let selected = values(state.answers[field]);
    if (selected.includes(value)) selected = selected.filter((itemValue) => itemValue !== value);
    else if (exclusive.includes(value)) selected = [value];
    else { selected = selected.filter((itemValue) => !exclusive.includes(itemValue)); if (!max || selected.length < max) selected.push(value); }
    state.answers[field] = selected;
    if (id === "P19" && selected.length === 1 && selected[0] === "NONE") delete state.answers.support_conditions_text;
    if (!["depth_m", "depth_s", "depth_d"].includes(id) && !String(id).startsWith("adaptive_check_")) reconcileIfResearchEdit(id);
  }
  if (isRc2 && ["depth_m", "depth_s"].includes(id)) clearDepthAfter(id === "depth_m" ? "M" : "S");
  saveDraft();
}

function changeConnectionChoice(field, value, multi, max) {
  const connection = getConnection();
  if (!multi) {
    connection[field] = value;
    if (field === "opt_in" && value === "YES" && !values(connection.reply_modes).length) connection.reply_modes = ["MEDIATED_WEB"];
    if (field === "receive_opt_in" && value === "YES" && !values(connection.receive_scopes).length) connection.receive_scopes = ["RESONANCE"];
    if (field === "receive_opt_in" && value !== "YES") {
      connection.receive_scopes = [];
      connection.reply_modes = [];
      connection.contact_email = "";
      connection.contact_permission = "";
    }
    if (field === "opt_in" && value !== "YES") Object.assign(connection, defaultConnection(), { opt_in: "NO" });
  } else {
    let selected = values(connection[field]);
    if (selected.includes(value)) selected = selected.filter((item) => item !== value);
    else if (!max || selected.length < max) selected.push(value);
    connection[field] = selected;
  }
  saveConnection();
}

function changeExhibitionChoice(field, value) {
  const application = getExhibitionApplication();
  application[field] = value;
  if (field === "decision" && value !== "YES") {
    state.exhibition = { ...createDefaultExhibitionApplication(), decision: value };
  }
  state.exhibitionErrors = {};
  saveExhibitionApplication();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.feedbackField) {
    state.feedback[target.dataset.feedbackField] = target.dataset.feedbackValue;
    saveDraft();
    render(false);
    return;
  }
  if (target.dataset.connectionField) {
    changeConnectionChoice(target.dataset.connectionField, target.dataset.connectionValue, target.dataset.connectionMulti === "true", Number(target.dataset.connectionMax || 0));
    render(false);
    return;
  }
  if (target.dataset.exhibitionField) {
    changeExhibitionChoice(target.dataset.exhibitionField, target.dataset.exhibitionValue);
    render(false);
    return;
  }
  if (target.dataset.lang) { state.language = target.dataset.lang; target.closest("details")?.removeAttribute("open"); saveDraft(); render(false); return; }
  if (target.dataset.axisField) {
    state.answers[target.dataset.axisField] = target.dataset.axisValue;
    delete state.answers.coordinate_snapshots;
    saveDraft();
    render(false);
    return;
  }
  if (target.dataset.useField) {
    state.answers[target.dataset.useField] = target.dataset.useValue;
    saveDraft();
    render(false);
    return;
  }
  if (target.dataset.choiceId) {
    if (target.getAttribute("aria-disabled") === "true") return;
    changeChoice(target.dataset.choiceId, target.dataset.choice, target.dataset.multi === "true", Number(target.dataset.max || 0), (target.dataset.exclusive || "").split(",").filter(Boolean));
    render(false);
    return;
  }
  if (target.dataset.action === "open-call") { window.open("./over39-open-call.html", "_blank", "noopener,noreferrer"); return; }
  if (target.dataset.action === "notice") { state.phase = "notice"; render(true); return; }
  if (target.dataset.action === "start") { state = { phase: "survey", step: 0, answers: {}, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId: `${isRc2 ? "RC2" : "RC1"}-${crypto.randomUUID()}`, language: state.language, feedback: {}, referralStatus: null }; saveDraft(); render(true); return; }
  if (target.dataset.action === "resume") {
    const draft = loadDraft();
    if (draft) {
      const answers = sanitizeAnswersForRoute(draft.answers || {});
      const screens = buildActiveScreens(answers, { adaptive: isRc2 });
      const mappedStep = draft.screenId && screens.includes(draft.screenId)
        ? screens.indexOf(draft.screenId)
        : Math.min(Number(draft.step || 0), Math.max(0, screens.length - 1));
      state = { phase: "survey", step: mappedStep, answers, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId: draft.responseId || `${isRc2 ? "RC2" : "RC1"}-${crypto.randomUUID()}`, language: draft.language || state.language, feedback: draft.feedback || {} };
    }
    render(true);
    return;
  }
  if (target.dataset.action === "recover-pending") {
    const pending = loadPending();
    if (!pending) return;
    state = {
      phase: "complete",
      step: 0,
      answers: pending.answers || {},
      submitted: pending,
      submissionStatus: "sending",
      exhibitionStatus: null,
      fixedCheckpointSaving: false,
      depthGenerating: false,
      adaptiveGenerating: false,
      summaryGenerating: false,
      translationGenerating: false,
      responseId: pending.response_id,
      language: pending.source_language || state.language,
      feedback: {},
    };
    render(true);
    verifyResearchStorage(pending.response_id).then((result) => {
      state.submissionStatus = result.status;
      render(false);
    });
    return;
  }
  if (target.dataset.action === "review-answers") {
    const index = activeScreens().indexOf("M01");
    state.step = index >= 0 ? index : 0;
    saveDraft();
    render(true);
    return;
  }
  if (target.dataset.action === "regenerate-summary") {
    if (state.summaryGenerating) return;
    clearReflectionOutcome();
    prepareAdaptiveSummary().then(() => render(false)).catch(() => { state.summaryGenerating = false; render(false); });
    return;
  }
  if (target.dataset.action === "print-document") {
    window.print();
    return;
  }
  if (target.dataset.action === "exhibition") {
    window.open("./over39-open-call.html", "_blank", "noopener,noreferrer");
    return;
  }
  if (target.dataset.action === "connection") {
    if (isRc2 && !globalGreetingsEnabled) return;
    getConnection();
    state.phase = "connection";
    render(true);
    return;
  }
  if (target.dataset.action === "back-to-result") {
    state.phase = "complete";
    render(true);
    return;
  }
  if (target.dataset.action === "save-exhibition") {
    const application = getExhibitionApplication();
    const validation = validateExhibitionApplication(application);
    state.exhibitionErrors = validation.errors;
    if (!validation.valid) { render(false); return; }
    const response = state.submitted || createResponse();
    const payloads = buildExhibitionApplicationPayload({ response, application, releaseVersion });
    saveExhibitionApplication();
    state.exhibitionStatus = "sending";
    render(false);
    const sends = [sendEnvelope(createEnvelope("exhibition_application", payloads.research, "exhibition"), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey })];
    if (payloads.contact) sends.push(sendEnvelope(createEnvelope("exhibition_application_contact", payloads.contact, "exhibition-contact"), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }));
    Promise.all(sends).then((results) => {
      state.exhibitionStatus = results.every((result) => result.status === "confirmed") ? "confirmed" : results[0]?.status || "failed";
      state.phase = "complete";
      render(true);
    });
    return;
  }
  if (target.dataset.action === "save-connection") {
    if (!connectionCanSave()) return;
    const update = createConnectionUpdate();
    saveConnection();
    state.connectionStatus = "sending";
    render(false);
    const separated = splitResearchAndContact(update);
    const relationEnvelope = createEnvelope("relationship_update", { ...separated.research, pii: undefined }, "relationship");
    const sends = [sendEnvelope(relationEnvelope, { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey })];
    if (separated.contact) sends.push(sendEnvelope(createEnvelope("contact_update", separated.contact, "contact"), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }));
    Promise.all(sends).then((results) => {
      const result = results[0];
      state.connectionStatus = result.status;
      state.submitted = separated.research;
      state.phase = "complete";
      render(true);
    });
    return;
  }
  if (target.dataset.action === "referral") { state.phase = "referral"; state.referralStatus = null; render(true); return; }
  if (target.dataset.action === "save-referral") {
    const referral = getReferral();
    if (!referralCanSave(referral) || state.referralStatus === "sending") return;
    const payload = {
      response_id: state.responseId || state.submitted?.response_id || null,
      recommended_name: String(referral.name || "").trim() || null,
      recommended_email: String(referral.email || "").trim(),
      recommendation_reason: String(referral.reason || "").trim() || null,
      show_referrer: referral.show_referrer === "YES",
      referrer_label: referral.show_referrer === "YES" ? (state.submitted?.response_document?.participant?.display_name || "참여자") : null,
      project: "〈만 39세 이상〉",
      contact_reason: "participant_referral_invitation",
      created_at: new Date().toISOString(),
    };
    referral.sent_at = payload.created_at;
    saveReferralDraft(referral);
    state.referralStatus = "sending";
    render(false);
    sendEnvelope(createEnvelope("referral_invitation", payload, "contact"), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }).then((result) => {
      state.referralStatus = result.status || "local_only";
      render(false);
    });
    return;
  }
  if (target.dataset.action === "institution-feedback") { state.phase = "feedback"; render(true); return; }
  if (target.dataset.action === "submit-feedback") {
    if (!feedbackCanSubmit()) return;
    const linked = state.feedback.link_to_response === "YES";
  const payload = { response_id: linked ? state.responseId : `FB-${crypto.randomUUID()}`, source_response_id: linked ? state.responseId : null, institution_code: institutionCode, rc1_version: releaseVersion, release_version: releaseVersion, sample_type: "institution_review", feedback: state.feedback, submitted_at: new Date().toISOString() };
    state.submissionStatus = "sending";
    sendEnvelope(createEnvelope("institution_feedback", payload), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }).then((result) => {
      state.submissionStatus = result.status;
      state.phase = "complete";
      render(true);
    });
    return;
  }
  if (target.dataset.action === "back") { state.step = Math.max(0, state.step - 1); saveDraft(); render(!isRc2); return; }
  if (target.dataset.action === "next") {
    const screens = activeScreens();
    const id = screens[state.step];
    if (!canContinue(id) || state.submissionStatus === "sending") return;

    if (isRc2) {
      const sourceAnchorByScreen = { M04: "M04_TEXT", TRANSITION: "P12", CONTINUITY: "P13_TEXT", SUPPORT_CONDITIONS: "P19_TEXT", D02: "D02_TEXT" };
      const sourceAnchor = sourceAnchorByScreen[id];
      if (sourceAnchor) {
        if (recordSkippedLowInformation(sourceAnchor)) saveDraft();
        else if (["skipped_low_information", "complete"].includes(adaptiveStatus(sourceAnchor))) setAdaptiveStatus(sourceAnchor, "pending");
      }
    }

    if (isRc2 && adaptiveScreenCheckpoint[id]) {
      const checkpoint = adaptiveScreenCheckpoint[id];
      if (state.adaptiveGenerating) return;
      const turn = currentAdaptiveTurn(checkpoint);
      if (turn) setAdaptiveStatus(checkpoint, turn.source === "motif" ? "complete_motif" : "complete_fallback");
      state.step += 1;
      saveDraft();
      render(true);
      return;
    }

    if (id === "FIXED_CHECKPOINT") {
      if (state.fixedCheckpointSaving) return;
      state.fixedCheckpointSaving = true;
      render(false);
      const fixedResponse = createResponse("fixed_complete");
      savePending(fixedResponse);
      const context = buildMinimalDepthContext(fixedResponse);
      requestResearchStorage(fixedResponse)
        .then(async () => {
          if (isRc2) {
            const plan = await createDepthQuestion({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context: { ...context, operation: "generate_followup", requested_axis: "M" }, bank: depthBank, axis: "M" });
            state.answers.depth_plan = [plan.question];
            state.answers.depth_source = plan.source;
            state.answers.depth_ai_runs = [{ ...plan.run, axis: "M" }];
          } else {
            const plan = await createDepthPlan({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context, bank: depthBank });
            state.answers.depth_plan = plan.questions;
            state.answers.depth_source = plan.source;
            state.answers.depth_ai_runs = [plan.run];
          }
          state.fixedCheckpointSaving = false;
          state.step += 1;
          saveDraft();
          render(!isRc2);
        })
        .catch(() => {
          state.fixedCheckpointSaving = false;
          render(false);
        });
      return;
    }
    if (isRc2 && id === "DEPTH_M") {
      generateDepthQuestion("S").then(() => { state.step += 1; render(false); });
      return;
    }
    if (isRc2 && id === "DEPTH_S") {
      generateDepthQuestion("D").then(() => { state.step += 1; render(false); });
      return;
    }
    if (id === "DEPTH_D") {
      if (state.summaryGenerating) return;
      state.summaryGenerating = true;
      render(false);
      const context = buildMinimalSummaryContext({ responseId: state.responseId, route: state.answers.route, coordinateScope: deriveCoordinateScope(state.answers), questions: state.answers.depth_plan, answers: state.answers });
      createDepthSummary({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context }).then((summary) => {
        state.answers.depth_summary = { summary: summary.summary, axes: summary.axes, evidence: summary.evidence, source: summary.source };
        state.answers.depth_ai_runs = [...values(state.answers.depth_ai_runs), summary.run];
        state.summaryGenerating = false;
        state.step += 1;
        saveDraft();
        render(!isRc2);
      });
      return;
    }
    if (id === "USE_SCOPE") {
      state.answers.document_confirmation_ack = "YES";
      state.answers.participant_approved_text = state.answers.participant_approved_text || approvedReflectionText();
      state.answers.document_confirmed_at = state.answers.document_confirmed_at || new Date().toISOString();
      state.answers.response_document_draft = buildCurrentResponseDocument({ final: true, confirmedAt: state.answers.document_confirmed_at });
      state.submitted = createResponse();
      savePending(state.submitted);
      state.submissionStatus = "sending";
      state.phase = "complete";
      render(true);
      requestResearchStorage(state.submitted).then((result) => {
        state.submissionStatus = result.status;
        if (result.status === "confirmed") clearDraft();
        render(false);
      });
      return;
    }

    const nextId = screens[state.step + 1];
    if (isRc2 && id === "REFLECTION_REVIEW" && nextId === "SUBMIT") {
      prepareApprovedTranslation()
        .then(() => { state.step += 1; saveDraft(); render(true); })
        .catch(() => { state.translationGenerating = false; state.step += 1; saveDraft(); render(true); });
      return;
    }
    if (isRc2 && adaptiveScreenCheckpoint[nextId]) {
      state.step += 1;
      saveDraft();
      render(true);
      const checkpoint = adaptiveScreenCheckpoint[nextId];
      if (adaptiveStatus(checkpoint) === "pending" && !currentAdaptiveTurn(checkpoint)) {
        requestAdaptiveNext(checkpoint)
          .then((result) => {
            if (!result.question) {
              const currentScreens = activeScreens();
              if (currentScreens[state.step] === nextId) state.step += 1;
              else state.step = Math.min(state.step, Math.max(0, currentScreens.length - 1));
              saveDraft();
              render(true);
            } else render(false);
          })
          .catch(() => { state.adaptiveGenerating = false; render(false); });
      }
      return;
    }
    if (isRc2 && nextId === "REFLECTION_REVIEW" && !state.answers.depth_summary) {
      prepareAdaptiveSummary()
        .then(() => { state.step += 1; saveDraft(); render(true); })
        .catch(() => { state.summaryGenerating = false; render(false); });
      return;
    }
    state.step += 1;
    saveDraft();
    render(!isRc2);
    return;
  }

  if (target.dataset.action === "download") { const text = JSON.stringify(state.submitted, null, 2); const blob = new Blob([text], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${state.submitted.response_id}.json`; link.click(); URL.revokeObjectURL(url); return; }
  if (target.dataset.action === "resend") {
    const pending = loadPending();
    if (!pending || state.submissionStatus === "sending") return;
    state.submissionStatus = "sending";
    render(false);
    (submitFunctionUrl ? retryOutbox({ endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }) : requestResearchStorage(pending)).then((result) => {
      state.submissionStatus = Array.isArray(result) ? (readOutbox().length ? "unverified" : "confirmed") : result.status;
      if (result.status === "confirmed") clearDraft();
      render(false);
    });
    return;
  }
  if (target.dataset.action === "restart") { clearDraft(); state = { phase: "intro", step: 0, answers: {}, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId: null, language: state.language, feedback: {}, referralStatus: null }; render(true); }
});

document.addEventListener("input", (event) => {
  const input = event.target;
  if (input.matches("[data-referral-input]")) {
    const referral = getReferral();
    referral[input.dataset.referralInput] = input.value;
    saveReferralDraft(referral);
    state.referralStatus = null;
    const button = document.querySelector("button[data-action='save-referral']");
    if (button) button.disabled = !referralCanSave(referral);
    return;
  }
  if (input.matches("[data-exhibition-input]")) {
    const application = getExhibitionApplication();
    application[input.dataset.exhibitionInput] = input.value;
    state.exhibitionErrors = {};
    saveExhibitionApplication();
    const saveButton = document.querySelector("button[data-action='save-exhibition']");
    if (saveButton) saveButton.disabled = !exhibitionCanSave();
    return;
  }
  if (input.matches("[data-connection-input]")) {
    const connection = getConnection();
    connection[input.dataset.connectionInput] = input.value;
    if (input.dataset.connectionInput === "message_text") connection.introduction = input.value;
    saveConnection();
    const saveButton = document.querySelector("button[data-action='save-connection']");
    if (saveButton) saveButton.disabled = !connectionCanSave();
    return;
  }
  if (!input.matches("[data-input-id]")) return;
  const id = input.dataset.inputId;
  if (id.startsWith("feedback_")) {
    state.feedback[id.replace("feedback_", "")] = input.value;
    saveDraft();
    return;
  }
  const item = question(id);
  const field = input.dataset.inputField || (item ? storedField(item) : id === "M06_YEAR" ? "memory_year_optional" : id === "P05_YEAR" ? "activity_start_year" : id === "M07" ? "memory_locations" : "activity_locations");
  state.answers[field] = id === "M07" ? locationValues(input.value, 2) : id === "P10" ? locationValues(input.value, 3) : input.value;
  if (isRc2 && /^depth_[ms]_text$/.test(field)) clearDepthAfter(field === "depth_m_text" ? "M" : "S");
  if (isRc2 && ["M02", "M04_TEXT", "P18", "P12", "P13_TEXT", "P19_TEXT", "D02_TEXT", "D04", "M06_YEAR", "M07", "P09_COUNTRY", "P10"].includes(id)) reconcileAnchorsAfterResearchEdit(id);
  else if (isRc2 && field === "d_context_impact_text") clearReflectionOutcome();
  if (isRc2 && ["participant_revision", "display_name"].includes(field)) clearDocumentConfirmation();
  saveDraft();
  const nextButton = document.querySelector("button.primary-button[data-action='next']");
  if (nextButton) nextButton.disabled = !canContinue(activeScreens()[state.step]);
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches("[data-referral-check]")) {
    const referral = getReferral();
    referral[input.dataset.referralCheck] = input.checked ? "YES" : "NO";
    saveReferralDraft(referral);
    state.referralStatus = null;
    render(false);
    return;
  }

  if (!input.matches("[data-check-id]")) return;
  const item = question(input.dataset.checkId);
  state.answers[storedField(item)] = input.checked;
  saveDraft();
  render(false);
});

window.addEventListener("online", () => {
  if (!submitFunctionUrl || !readOutbox().length) return;
  const currentResponseId = state.submitted?.response_id || state.responseId;
  retryOutbox({ endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }).then(() => {
    if (!currentResponseId) return;
    const currentStillQueued = readOutbox().some((item) => item.payload?.response_id === currentResponseId);
    state.submissionStatus = currentStillQueued ? "unverified" : "confirmed";
    if (!currentStillQueued) clearDraft();
    render(false);
  });
});

Promise.all([schemaUrl, depthBankUrl].map((url) => fetch(url).then((response) => response.ok ? response.json() : Promise.reject(new Error(`load failed: ${url}`)))))
  .then(([loadedSchema, loadedDepthBank]) => { schema = loadedSchema; depthBank = loadedDepthBank; state.phase = "intro"; render(); })
  .catch(() => { root.innerHTML = "<main class='shell'><p class='error'>질문 스키마를 불러오지 못했습니다.</p></main>"; });
