import { localizeQuestion, translate } from "./i18n.js?v=rc2-preproduction-20260813-landing-r2";
import { COORDINATE_SCOPE_LABELS, buildCoordinateSnapshots, deriveCoordinateScope, deriveSContextTags } from "./classification.js";
import { buildConnectionProfile, connectionTopics } from "./connection.js";
import { applicableFixedQuestionIds, buildActiveScreens, fixedQuestionIdsForScreen, flowCounts, hasSubstantiveDChange, hasSubstantiveTransition, needsContinuityQuestion, needsPauseContext, normalizedDScope, resetForRouteChange, sanitizeAnswersForRoute } from "./flow.js";
import { ACTIVE_ANCHOR_ORDER, ADAPTIVE_POLICY_VERSION, ALL_ADAPTIVE_SCREEN_MAP, ANCHOR_AXES, ANCHOR_ORDER, aggregateAnchorSource, anchorAnswerFingerprint, anchorContextFingerprint, anchorSourceText, anchorsAffectedByChangedQuestion, assessAnchorNeed, buildAnchorContext, conditionalAnchorsAffectedByChangedQuestion, createAnchorFollowup, isLowInformationText, isStrictRealMotifPass, lowInformationReason, reconcileAnchorTurnsAfterQuestionEdit, upsertAnchorTurn, verifyDomQuestion } from "./anchor-live.js";
import { normalizeIntegratedRoleRecord, shouldShowP13Text, shouldShowP19Text, translationReuseDecision } from "./integration-r2-helpers.js";
import { ADAPTIVE_CHECKPOINTS, DEPTH_AXIS_OPTIONS, buildAdaptiveContext, buildAdaptiveSummaryContext, buildDepthTurnContext, buildMinimalDepthContext, buildMinimalSummaryContext, createAdaptiveSummary, createAdaptiveTurn, createDepthPlan, createDepthQuestion, createDepthSummary, translateResponseSummary } from "./depth.js";
import { QUESTION_METADATA } from "./question-map.js";
import { createEnvelope, readOutbox, retryOutbox, sendEnvelope, splitResearchAndContact } from "./storage.js";
import { RESPONSE_DOCUMENT_VERSION, buildResponseDocument, rawParticipantWords, renderResponseDocument } from "./response-document.js";
import { responseDocumentFrame } from "./response-document-i18n.js";
import { compactParticipantContext, contextAwareCopy, dContextHints, hasParticipantContext, participantContextKind, participantContextOptions } from "./participant-context.js";
import { participantActivityScreenCopy, participantContextCopy } from "./participant-context-i18n.js";
import { greetingUiCopy } from "./greetings-ui-i18n.js";
import { rc2UiCopy, rc2UiPhrase } from "./rc2-ui-i18n.js?v=rc2-preproduction-20260813-landing-r3";
import { completionCopy } from "./completion-i18n.js";
import { greetingVisibilityCopy, stage1ConsentCopy, stage1Copy, stage1UiExtraCopy } from "./stage1-i18n.js";
import { greetingFirstCopy } from "./greeting-first-i18n.js";
import { greetingSimplificationCopy } from "./greeting-simplification-i18n.js";
import { task7Copy } from "./task7-i18n.js";
import { createParticipantReference, publicParticipantReference } from "./participant-reference.js";
import { buildReferralBatch, parseReferralRecipients, safeReferrerLabel } from "./referral.js";
import { EXHIBITION_OPEN_CALL, buildExhibitionApplicationPayload, createDefaultExhibitionApplication, validateExhibitionApplication } from "./exhibition-application.js";

const root = document.querySelector("#root");
const schemaUrl = "./src/v13/over39_questionnaire_schema_v1.3.1-draft.json";
const depthBankUrl = "./src/v13/approved-depth-question-bank.json";
const edition = document.body.dataset.edition || "pilot";
const isRc2 = edition === "rc2";
const releaseVersion = isRc2 ? "rc2-v0.6.1-task9-live-data-local-2026-08-18" : "rc1-2026-08-03";
const draftKey = `over39-${edition}-draft`;
const pendingKey = `over39-${edition}-pending-submission`;
const connectionKey = (responseId) => `over39-v13-connection-${responseId}`;
const firstGreetingKey = (responseId) => `over39-v13-first-greeting-${responseId}`;
const exhibitionKey = (responseId) => `over39-v13-exhibition-${responseId}`;
const referralKey = (responseId) => `over39-v13-referral-${responseId}`;
const googleAppsScriptUrl = String(window.OVER39_GOOGLE_APPS_SCRIPT_URL || "").trim();
const submitFunctionUrl = String(window.OVER39_SUPABASE_SUBMIT_URL || "").trim();
const aiFunctionUrl = String(window.OVER39_SUPABASE_AI_URL || "").trim();
const relayFunctionUrl = String(window.OVER39_SUPABASE_RELAY_URL || "").trim();
const supabaseAnonKey = String(window.OVER39_SUPABASE_ANON_KEY || "").trim();
const globalGreetingsEnabled = window.OVER39_GLOBAL_GREETINGS_ENABLED === true;
const aiMode = String(window.OVER39_AI_MODE || "fallback").trim();
const liveAiEnabled = aiMode === "live" && Boolean(aiFunctionUrl);
const isApiDepthSource = (source) => ["openai", "motif", "api"].includes(source);
const query = new URLSearchParams(window.location.search);
const interfaceLanguageKey = "over39-interface-language";
// 이 줄은 모듈 최상단이다. 사파리에서 「모든 쿠키 차단」을 켠 참여자는 `localStorage`
// 접근만으로 SecurityError를 받고, 그러면 이 모듈 전체가 실행되지 않아 **완전한 흰 화면**이
// 된다. 「불러오는 중입니다」조차 나오지 않는다. 저장소는 언제든 없을 수 있다고 보고 읽는다.
const readStoredLanguage = () => { try { return localStorage.getItem(interfaceLanguageKey); } catch { return null; } };
const requestedLanguage = String(query.get("lang") || readStoredLanguage() || "ko");
const initialLanguage = ["ko", "en", "ja", "zh-Hans", "zh-Hant", "nl", "es", "fr", "ms"].includes(requestedLanguage) ? requestedLanguage : "ko";
const institutionCode = String(query.get("institution") || "").trim().slice(0, 80);
const acquisitionSource = String(query.get("source") || "direct").trim().slice(0, 80);
// 초대 링크를 사람마다 다르게 보내기 위한 표식(`?pid=A01`). 참여자 화면에는 아무 영향이
// 없고, 어느 링크로 들어왔는지만 남는다. 이것이 없으면 초대한 사람 명단과 들어온 응답을
// 맞출 수 없어, 누가 아직 참여하지 않았는지도 표본 구성이 실제로 어떠했는지도 알 수 없다.
const participantCode = String(query.get("pid") || "").trim().slice(0, 40);

// 이탈 지점을 알기 위한 중간 스냅샷 지점. 기억 블록이 끝나는 자리와, 현재 조건까지
// 마친 자리 둘이다. 더 늘리면 참여자당 요청만 늘고 얻는 해상도는 크지 않다.
const DROP_OFF_CHECKPOINTS = new Set(["MEMORY_EVIDENCE", "SUPPORT_CONDITIONS"]);
const sentDropOffCheckpoints = new Set();
// 표본은 빌드가 정한 이 회차의 기본값을 따른다. 참여자가 받는 주소에 쿼리가 없어야
// 이어쓰기나 링크 공유로 같은 사람의 표본이 갈리지 않는다. `?sample=`은 검증 주행이
// 연구 표본을 오염시키지 않게 빠져나가는 용도로만 남긴다.
const defaultSampleType = window.OVER39_DEFAULT_SAMPLE_TYPE === "research" ? "research" : "test";
const requestedSample = query.get("sample");
const sampleType = institutionCode
  ? "institution_review"
  : requestedSample === "research" ? "research"
  : requestedSample === "test" ? "test"
  : defaultSampleType;

let schema;
let depthBank;
let state = { phase: "loading", step: 0, answers: {}, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId: null, language: initialLanguage, feedback: {}, referralStatus: null, firstGreeting: null, researchContact: { email: "", consent: false, status: null } };

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
const depthOutcomeFields = ["depth_plan", "depth_source", "depth_m", "depth_m_text", "depth_s", "depth_s_text", "depth_d", "depth_d_text", "depth_summary", "depth_ai_runs", "adaptive_turns", "adaptive_checkpoint_status", "adaptive_ai_runs", "adaptive_detected_language", "reflection_action", "participant_revision", "synthesis_confirmation_ack", "synthesis_confirmation", "participant_approved_text", "participant_approved_text_ko", "participant_approved_provenance", "participant_approved_translation_provenance", "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "document_confirmation_ack", "document_confirmed_at", "response_document_draft"];
function clearDepthOutcome() { depthOutcomeFields.forEach((field) => delete state.answers[field]); }
function clearReflectionOutcome() {
  ["depth_summary", "depth_ai_runs", "reflection_action", "participant_revision", "synthesis_confirmation_ack", "synthesis_confirmation", "participant_approved_text", "participant_approved_text_ko", "participant_approved_provenance", "participant_approved_translation_provenance", "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "document_confirmation_ack", "document_confirmed_at", "response_document_draft"].forEach((field) => delete state.answers[field]);
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
const creditRows = [["주최·주관", "북성로사진관 · 대안공간 모호주택"], ["총괄기획", "이생강"], ["연구 협력", "Local Express Daegu"], ["후원", "한국문화예술위원회"]];
const t = (text) => rc2UiPhrase(state.language, text) || translate(state.language, text);
const ui = () => rc2UiCopy(state.language);
const stage = () => stage1Copy(state.language);
const task7 = () => task7Copy(state.language);
const greetingFirst = () => greetingFirstCopy(state.language);
const greetingSimple = () => greetingSimplificationCopy(state.language);

function localizeRenderedCopy(container) {
  if (state.language === "ko") return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement?.closest("script,style") || !node.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const source = node.nodeValue.trim();
    const localized = t(source);
    if (localized !== source) node.nodeValue = node.nodeValue.replace(source, localized);
  });
  container.querySelectorAll("[placeholder]").forEach((input) => { input.placeholder = t(input.placeholder); });
}

function openCallUrl() {
  const url = new URL("./over39-open-call.html", window.location.href);
  url.searchParams.set("lang", state.language);
  url.searchParams.set("source", "participation-record");
  const recordId = state.submitted?.response_id || state.responseId;
  if (recordId) url.searchParams.set("record_id", recordId);
  return `${url.pathname.split("/").at(-1)}${url.search}`;
}


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
  const task5 = stage().task5 || {};
  const task5Overrides = {
    M04: { MIXED: task5.mMixed, UNSURE: task5.mUnsure },
    P16: { NONE: task5.p16None, UNSURE: task5.p16Unsure },
    D01: { NO_MAJOR_GAP: task5.dNoGap, UNSURE: task5.dUnsure },
    D02: { NO_SPECIFIC_CHANGE: task5.dNoChange, UNSURE: task5.dUnsure },
  };
  if (task5Overrides[id]?.[value]) return task5Overrides[id][value];
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
  const contextual = contextAwareCopy(state.answers, state.language);
  const contextualKey = { P12: "p12", P13: "p13", P14: "p14", P15: "p15", P16: "p16", P19: "p19" }[id];
  if (contextualKey) return t(contextual[contextualKey]);
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
  ROLE_BRIDGE: "앞에서 남긴 활동 맥락과 과거 응답의 역할 분류를 한 번만 연결해 기록합니다.",
  PARTICIPANT_CONTEXT: "이번 답변이 닿는 문화예술 분야와 활동 형태를 먼저 기록합니다.",
  PROFILE: "응답이 놓인 생활과 지역의 맥락을 함께 기록합니다.",
  M01: "오늘 이야기의 출발점이 될 사람, 작업, 공간, 장면 또는 감각을 고릅니다.",
  NO_RECALL_RELATION: "특정 작품을 떠올리지 않아도 지금 문화예술과 만나는 생활의 한 장면을 남길 수 있습니다.",
  AI_CONDITIONAL_NO_RECALL_RELATION: "방금 적은 현재의 관계에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
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
  AI_CONDITIONAL_D04_CONDITIONS: "개인 경험과 구조적 조건이 함께 작동한 관계를 한 가지 더 구체화합니다.",
  AI_ANCHOR_D02_TEXT: "바라는 변화의 문장에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
  R01: "이 기억과 경험이 연구 이후 어떤 모습으로 이어지면 좋을지 살핍니다.",
  COMMUNITY: "이번 응답에서 함께 남기고 싶은 다른 이름이나 장면이 있는지 선택해서 기록합니다.",
  REFLECTION_REVIEW: "앞선 답변을 바탕으로 정리한 문장을 참여자가 직접 확인하고 고치는 자리입니다.",
  SUBMIT: "참여 기록이 닿은 세 방향을 직접 확인하는 자리입니다.",
  USE_SCOPE: "정책연구에서 사용할 범위를 참여자가 직접 선택합니다.",
};

const rc2QuestionTopics = {
  CONSENT: "참여 안내", P01: "시작 위치", DOCUMENT_IDENTITY: "참여자 표기", P01_CONTEXT: "기억의 위치",
  ROLE_GROUP: "역할 범주", ROLE_PRIMARY: "주요 역할", ROLE_PARALLEL: "함께하는 역할", ROLE_BRIDGE: "역할 확인", PARTICIPANT_CONTEXT: "활동의 맥락", PROFILE: "생활과 지역",
  M01: "기억", NO_RECALL_RELATION: "지금의 관계", AI_CONDITIONAL_NO_RECALL_RELATION: "여기서 잠깐", M02: "장면", M03: "초점", M03_RECONNECT: "다시 이어보기", M10_VERIFY: "관계 확인", M04: "이유", AI_ANCHOR_M04_TEXT: "여기서 잠깐", M05: "남은 단서",
  MEMORY_TIME: "시간", MEMORY_EVIDENCE: "경험 방식", MEMORY_TO_PRESENT: "현재",
  ACTIVITY: "현재의 연결", PRACTICE_PUBLIC_STATE: "현재 상태", STATE_BACKGROUND: "현재에 작용한 현실",
  TRANSITION: "변화", AI_ANCHOR_P12: "여기서 잠깐", CONTINUITY: "보이지 않는 지속", AI_ANCHOR_P13_TEXT: "여기서 잠깐", SUPPORT_CONDITIONS: "이어지게 한 기반", AI_ANCHOR_P19_TEXT: "여기서 잠깐", D01: "현재 조건", D02: "바라는 변화", AI_ANCHOR_D02_TEXT: "여기서 잠깐",
  D03: "현실 경험", D04: "영향", AI_CONDITIONAL_D04_CONDITIONS: "여기서 잠깐", R01: "이어갈 방식", COMMUNITY: "다른 이름",
  REFLECTION_REVIEW: "응답 정리", SUBMIT: "세 방향 확인", USE_SCOPE: "활용 범위",
};

const rc2Phases = {
  CONSENT: "참여 안내와 선택",
  P01: "기록의 출발점",
  DOCUMENT_IDENTITY: "참여 기록의 표기",
  P01_CONTEXT: "기억을 말하는 자리",
  ROLE_GROUP: "현재 역할의 범위",
  ROLE_PRIMARY: "이번 응답의 중심 역할",
  ROLE_PARALLEL: "함께 이어지는 역할", ROLE_BRIDGE: "과거 역할 분류와 연결", PARTICIPANT_CONTEXT: "분야와 활동 형태",
  PROFILE: "생활과 지역의 배경",
  M01: "기억의 출발점",
  NO_RECALL_RELATION: "지금 문화예술과 만나는 한 순간",
  AI_CONDITIONAL_NO_RECALL_RELATION: "현재의 관계에서 이어진 질문",
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
  AI_CONDITIONAL_D04_CONDITIONS: "개인과 구조의 조건에서 이어진 질문",
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


// 초안 저장이 던지면 `input` 핸들러가 그 뒤의 `다음` 버튼 갱신에 도달하지 못한다.
// 글을 다 적었는데 버튼이 끝까지 꺼진 채이고 무엇이 막는지 화면에 없었다.
// 저장소 쓰기는 언제든 실패한다(사파리 「모든 쿠키 차단」, 용량 초과, 사생활 보호 모드).
// 실패가 화면을 멈추게 해서는 안 된다. 실제로 `saveFirstGreeting`이 **두 번째 화면**에서
// 던져 「안부 읽고 시작하기」·「안부 없이 시작하기」가 둘 다 아무 반응 없는 버튼이 됐고,
// 성공한 저장 뒤의 `clearDraft()`가 던져 **저장에 성공한 참여자에게 실패 화면**이 떴다.
// 모든 쓰기를 이 두 함수로 지나가게 해서, 막히면 그 사실만 기록하고 흐름은 계속한다.
function storageWrite(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { state.storageBlocked = true; return false; }
}
function storageRemove(key) {
  try { localStorage.removeItem(key); return true; } catch { state.storageBlocked = true; return false; }
}

function saveDraft() {
  if (["survey", "greeting-choice", "greeting-first"].includes(state.phase)) {
    try {
    localStorage.setItem(draftKey, JSON.stringify({
      phase: state.phase,
      answers: state.answers,
      step: state.step,
      contextStep: Number(state.contextStep || 0),
      // 「앞선 답변 보기」로 떠나온 자리. 이어쓰기로 돌아와도 정리 화면으로 돌아갈 길이 남는다.
      reviewReturnStep: typeof state.reviewReturnStep === "number" ? state.reviewReturnStep : null,
      screenId: activeScreens()[state.step] || null,
      releaseVersion,
      language: state.language,
      responseId: state.responseId,
      feedback: state.feedback,
      firstGreeting: state.firstGreeting || null,
      researchContact: state.researchContact || null,
      savedAt: new Date().toISOString(),
    }));
    } catch { state.storageBlocked = true; }
  }
}

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(draftKey) || "null"); } catch { return null; }
}

function clearDraft() { storageRemove(draftKey); }
// `savePending`은 최종 저장 버튼의 **첫 줄**에서 불린다. 여기서 던지면 클릭 핸들러가
// 그대로 끝나 화면이 바뀌지도, 네트워크로 나가지도 않는다 — 참여자에게는 "눌러도
// 아무 일이 없는 저장 버튼"이 된다. 저장소가 막혀도 전송은 계속 시도해야 한다.
function savePending(response) { try { localStorage.setItem(pendingKey, JSON.stringify(response)); } catch { state.storageBlocked = true; } }
function loadPending() { try { return JSON.parse(localStorage.getItem(pendingKey) || "null"); } catch { return null; } }
function clearPending() { storageRemove(pendingKey); }
function loadFirstGreeting(responseId = state.responseId) {
  if (!responseId) return null;
  try { return JSON.parse(localStorage.getItem(firstGreetingKey(responseId)) || "null"); } catch { return null; }
}
function saveFirstGreeting() {
  if (state.responseId && state.firstGreeting) storageWrite(firstGreetingKey(state.responseId), JSON.stringify(state.firstGreeting));
}
function clearFirstGreeting(responseId = state.responseId) {
  if (responseId) storageRemove(firstGreetingKey(responseId));
}
function restoreLegacySynthesisConfirmation(answers = {}) {
  const approvedText = String(answers.participant_approved_text || "").trim();
  if (answers.synthesis_confirmation_ack === "YES" || !approvedText || answers.document_confirmation_ack !== "YES") return answers;
  const priorScope = answers.participant_approved_provenance?.approval_scope;
  if (priorScope && priorScope !== "participant_synthesis_text_only") return answers;
  const confirmedAt = answers.document_confirmed_at || answers.participant_approved_provenance?.confirmed_at || null;
  const migrated = {
    kind: "participant-confirmed",
    approval_scope: "participant_synthesis_text_only",
    excludes: ["system_derived_axes", "coordinate", "project_explanatory_text", "raw_answers"],
    source_draft_kind: answers.participant_approved_provenance?.source_draft_kind || answers.depth_summary?.provenance?.kind || (answers.depth_summary?.source === "motif" ? "ai-generated" : "fixed"),
    action: answers.reflection_action || "ACCEPT",
    final_text: approvedText,
    confirmed_at: confirmedAt,
    compatibility_source: "legacy_document_confirmation",
  };
  return { ...answers, synthesis_confirmation_ack: "YES", synthesis_confirmation: answers.synthesis_confirmation || migrated };
}
function participantReferenceKey(responseId) { return `over39-v13-participant-reference-${responseId || "draft"}`; }
function ensureParticipantReference(responseId = state.responseId) {
  if (!responseId) return null;
  if (state.participantReference?.code && state.participantReference?.access_token) return state.participantReference;
  try {
    const stored = JSON.parse(localStorage.getItem(participantReferenceKey(responseId)) || "null");
    if (stored?.code && stored?.access_token) {
      state.participantReference = stored;
      return stored;
    }
  } catch { /* create a fresh local reference below */ }
  const reference = createParticipantReference();
  state.participantReference = reference;
  // 이 함수는 최종 저장 클릭 핸들러의 앞줄에서 불린다. 저장소가 막혔을 때 여기서 던지면
  // 핸들러가 그대로 끝나 **저장 버튼이 아무 반응 없이 죽는다** — 화면도 안 바뀌고
  // 네트워크로도 안 나간다. 아래 `.catch()`는 그보다 뒤에 있어 닿지 못한다.
  // 참여자 코드를 기기에 못 남기는 것보다 이야기를 못 보내는 것이 훨씬 나쁘다.
  try { localStorage.setItem(participantReferenceKey(responseId), JSON.stringify(reference)); } catch { state.storageBlocked = true; }
  return reference;
}
function defaultConnection() {
  return {
    greeting_id: crypto.randomUUID(),
    opt_in: "",
    message_audience: "",
    message_text: "",
    receive_opt_in: "",
    receive_scopes: [],
    greeting_connection_preference: "",
    translation_allowed: "",
    needs: [],
    offers: [],
    reply_modes: [],
    visibility: "RESEARCHER_ONLY",
    contact_permission: "",
    contact_email: "",
    sender_visibility: "",
    origin: "participant",
    introduction: "",
    stage: "receive",
    preview_confirmed: false,
  };
}

function loadConnection() { try { return JSON.parse(localStorage.getItem(connectionKey(state.responseId || state.submitted?.response_id)) || "null") || defaultConnection(); } catch { return defaultConnection(); } }
function getConnection() { state.connection = state.connection || loadConnection(); return state.connection; }
function saveConnection() { if (state.responseId || state.submitted?.response_id) storageWrite(connectionKey(state.responseId || state.submitted?.response_id), JSON.stringify(getConnection())); }

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
    storageWrite(exhibitionKey(state.responseId || state.submitted?.response_id), JSON.stringify(getExhibitionApplication()));
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
  const startScreens = new Set(["CONSENT", "P01", "P01_CONTEXT", "ROLE_GROUP", "ROLE_PRIMARY", "ROLE_PARALLEL", "ROLE_BRIDGE", "PARTICIPANT_CONTEXT"]);
  const memoryScreens = new Set(["M01", "NO_RECALL_RELATION", "M02", "M04", "AI_ANCHOR_M04_TEXT", "M05", "MEMORY_TIME", "MEMORY_EVIDENCE", "M03_RECONNECT", "M10_VERIFY"]);
  const presentScreens = new Set(["MEMORY_TO_PRESENT", "ACTIVITY", "PRACTICE_PUBLIC_STATE", "STATE_BACKGROUND", "TRANSITION", "AI_ANCHOR_P12", "CONTINUITY", "AI_ANCHOR_P13_TEXT", "SUPPORT_CONDITIONS"]);
  const conditionScreens = new Set(["D01", "D02", "AI_ANCHOR_D02_TEXT", "D03", "D04", "AI_CONDITIONAL_D04_CONDITIONS", "R01", "COMMUNITY"]);
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
    const count = adaptiveScreenCheckpoint[id]
      ? t("이어지는 질문")
      : id === "REFLECTION_REVIEW" || id === "SUBMIT" || id === "USE_SCOPE" ? t("기록 정리") : "";
    const progressBase = currentFixed.length ? endNumber : priorFixed.length;
    return {
      label: ui().topics[id] || (Object.hasOwn(ALL_ADAPTIVE_SCREEN_MAP, id) ? ui().deepQuestionStage : "") || (state.language === "ko" ? (rc2QuestionTopics[id] || rc2Phases[id] || "기록") : ""),
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
    const coded = (labels || []).slice(0, 4).map((label, index) => [`D${index + 1}`, label]);
    const local = stage().task5;
    return kind === "gap"
      ? coded.concat([["NO_MAJOR_GAP", local.dNoGap], ["UNSURE", local.dUnsure]])
      : coded.concat([["NO_SPECIFIC_CHANGE", local.dNoChange], ["UNSURE", local.dUnsure]]);
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

// 글자수 표시는 예전에 `최대 ${limit}자` 문자열 자체를 사전 키로 썼다. 한도가 여섯 가지라
// 언어마다 여섯 항목이 필요했고 실제로는 `최대 800자` 하나만 등록돼 있었다. 그래서 대부분의
// 화면에서 한도가 한국어로만 보였다 — `maxlength`는 걸려 있으므로, 참여자는 이유를 모른 채
// 타이핑이 멈추고 문장이 잘린 줄도 모르고 넘어간다. 한도를 자리표시자로 빼서 키를 하나로 모은다.
function characterLimitLabel(limit) {
  const template = t("최대 {n}자");
  return template === "최대 {n}자" ? `최대 ${limit}자` : template.replace("{n}", String(limit));
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
  return `<div class="text-field">${label ? `<label class="text-field-label" for="${esc(inputId)}">${esc(t(label))}</label>` : ""}${input}${multiline ? `<span class="text-field-meta">${esc(characterLimitLabel(limit))}</span>` : ""}</div>`;
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
  ["synthesis_confirmation_ack", "synthesis_confirmation", "participant_approved_text", "participant_approved_text_ko", "participant_approved_provenance", "participant_approved_translation_provenance", "document_confirmation_ack", "document_confirmed_at", "response_document_draft"].forEach((field) => delete state.answers[field]);
}

// 「응답 정리」에서 다음으로 넘어갈 수 있는지를 판단하는 **단 하나의** 조건.
// 예전에는 두 곳이 서로 다른 조건을 봤다. `canContinue("REFLECTION_REVIEW")`는 확인 칸
// (`synthesis_confirmation_ack`)만 보고 버튼을 켰는데, 클릭 핸들러의
// `confirmParticipantSynthesis()`는 정리문이 비었는지를 따로 봤다. 그래서 AI 정리문이
// 비면 확인 칸을 체크해 버튼이 켜지고, 눌러도 화면을 다시 그리지 않고 조용히 return했다.
// 참여자에게는 20~30분을 쓴 뒤 기록을 저장하기 직전에 버튼이 죽은 것으로 보인다.
// 버튼이 켜지는 조건과 클릭이 통과하는 조건은 반드시 같은 함수여야 한다.
function synthesisConfirmed(answers = state.answers) {
  return Boolean(approvedReflectionText(answers)) && answers.synthesis_confirmation_ack === "YES";
}

// 「활용 범위」 04 블록(연구 연락 이메일)이 채워졌는지를 판단하는 단 하나의 조건.
// 저장 버튼을 여는 계산과 화면에 보이는 상태가 서로 다른 규칙을 쓰면, 다 채운 것처럼
// 보이는데 버튼만 잠기는 상태가 다시 생긴다.
function researchContactComplete(contact = state.researchContact || {}) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact.email || "").trim()) && contact.consent === true;
}

function useScopeContactStatusText() {
  const label = task7().researchContactLabel;
  return researchContactComplete() ? `${label} ✓` : `${label} · ${stage1UiExtraCopy(state.language).required}`;
}

// 이메일을 타이핑하는 동안 화면을 통째로 다시 그리면 커서가 튄다. 그래서 요약줄의
// 이 칸만 직접 고친다. 이게 없으면 이메일을 다 채워도 요약줄은 `필수` 그대로 남아,
// 무엇이 남았는지 보이게 하려던 표시가 오히려 거짓말을 한다.
function refreshUseScopeContactStatus() {
  const slot = document.querySelector("[data-use-scope-contact-status]");
  if (slot) slot.textContent = useScopeContactStatusText();
}

function confirmParticipantSynthesis() {
  if (!synthesisConfirmed()) return false;
  const finalText = approvedReflectionText();
  const confirmedAt = new Date().toISOString();
  const provenance = {
    kind: "participant-confirmed",
    approval_scope: "participant_synthesis_text_only",
    excludes: ["system_derived_axes", "coordinate", "project_explanatory_text", "raw_answers"],
    source_draft_kind: state.answers.depth_summary?.provenance?.kind || (state.answers.depth_summary?.source === "motif" ? "ai-generated" : "fixed"),
    action: state.answers.reflection_action || "ACCEPT",
    final_text: finalText,
    confirmed_at: confirmedAt,
  };
  state.answers.participant_approved_text = finalText;
  state.answers.participant_approved_provenance = provenance;
  state.answers.synthesis_confirmation = provenance;
  state.answers.document_confirmation_ack = "YES";
  state.answers.document_confirmed_at = confirmedAt;
  return true;
}

function buildCurrentResponseDocument({ final = false, confirmedAt = null } = {}) {
  const approvedOriginal = state.answers.participant_approved_text || approvedReflectionText();
  const sourceLanguage = responseSourceLanguage();
  return buildResponseDocument({
    responseId: state.responseId,
    answers: sanitizeAnswersForRoute(state.answers),
    sourceLanguage,
    displayLanguage: state.language,
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
    summaryTranslationKind: state.answers.depth_summary?.provenance?.translation_kind || "fixed",
  });
  if (reuse.reuse) {
    state.answers.participant_approved_text_ko = reuse.translation;
    state.answers.participant_approved_translation_provenance = {
      kind: sourceLanguage === "ko" ? "fixed" : "ai-translated",
      original_language: sourceLanguage,
      displayed_language: "ko",
      original_text: original,
      translated_text: reuse.translation,
      source: sourceLanguage === "ko" ? "same_language" : "summary_ko_reuse",
    };
    state.answers.response_document_created_at = state.answers.response_document_created_at || new Date().toISOString();
    saveDraft();
    return;
  }
  state.translationGenerating = true;
  render(false);
  const translated = await translateResponseSummary({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, text: original, sourceLanguage });
  state.answers.participant_approved_text_ko = translated.translation_ko || "";
  state.answers.participant_approved_translation_provenance = {
    kind: translated.run?.source === "motif" ? "ai-translated" : "fixed",
    original_language: sourceLanguage,
    displayed_language: "ko",
    original_text: original,
    translated_text: translated.translation_ko || "",
    source: translated.run?.source || "fallback",
  };
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
  const topic = isRc2 ? (ui().topics[id] || (Object.hasOwn(ALL_ADAPTIVE_SCREEN_MAP, id) ? ui().deepQuestionStage : "") || (state.language === "ko" ? (rc2QuestionTopics[id] || "") : "")) : "";
  const localizedTitle = t(title);
  const heading = topic && !String(title).includes("—") ? `${t(topic)} — ${localizedTitle}` : localizedTitle;
  const kicker = isRc2 ? "" : `<div class="interview-kicker">PUBLIC MEMORY INTERVIEW · INSTITUTION RC1</div>`;
  const purposeBlock = !isRc2 && purpose ? `<div class="question-purpose"><span>이 질문이 살피는 내용</span><p>${esc(t(purpose))}</p></div>` : "";
  return `<div class="interview-head"><div class="interview-copy">${kicker}<h2 id="question-title" tabindex="-1">${esc(heading)}</h2>${help ? `<p>${esc(t(help))}</p>` : ""}${purposeBlock}</div></div><div class="answer-panel">`;
}

function renderConsent() {
  if (isRc2) {
    const local = stage();
    return `${screenHeading(local.consentTitle, local.consentHelp)}
      <div class="participation-guide consent-guide">
        <p>${esc(local.consentVoluntary)}</p>
      </div>
      <section class="consent-choice-block">
        <h3>${esc(t("연구 참여"))}</h3>
        ${renderChoices("RC01", [["YES", local.consentResearch]])}
      </section>
      <section class="consent-choice-block">
        <h3>${esc(t("AI 사용"))}</h3>
        ${renderChoices("RC02", [["YES", local.consentAi]])}
      </section>`;
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
  const local = stage();
  return `${screenHeading("이 기록에서 어떻게 불러드리면 좋을까요?", local.identityHelp)}
    <p class="identity-privacy-note">${esc(local.identityPrivacy)}</p>
    ${renderChoices("ID01", q1.options)}
    ${mode && mode !== "ANONYMOUS" ? renderText("ID02", { multiline: false, field: "display_name", value: state.answers.display_name || "", label: q2.text, placeholder: mode === "INITIALS" ? "예: T.K." : "참여 기록에 표시할 표기" }) : ""}`;
}

function renderPracticePublicState() {
  const creative = question("P14");
  const publicActivity = question("P15");
  const audience = isAudienceContext();
  const kind = participantContextKind(state.answers);
  const copy = contextAwareCopy(state.answers, state.language);
  const help = audience
    ? ui().practiceHelp.AUDIENCE
    : ui().practiceHelp[kind] || ui().practiceHelp.PROFESSIONAL;
  return `${screenHeading(copy.activityHeading, help)}
    <label class="field-label">${esc(copy.p14)}</label>
    ${renderChoices("P14", audience ? creative.options_audience : creative.options_professional)}
    <label class="field-label">${esc(copy.p15)}</label>
    ${renderChoices("P15", audience ? publicActivity.options_audience : publicActivity.options_professional)}`;
}

function renderStateBackground() {
  const p16 = question("P16");
  const audience = isAudienceContext();
  const copy = contextAwareCopy(state.answers, state.language);
  const title = audience ? "지금의 관람과 관심 방식에 함께 작용한 조건을 살펴볼게요." : "현재의 활동 방식에 함께 작용한 조건을 살펴볼게요.";
  const help = audience
    ? "일상, 이동, 정보, 함께한 사람과 공간의 분위기 가운데 가까운 내용을 골라주세요. 해당되는 조건이 없거나 아직 모르겠다면 그대로 표시할 수 있어요."
    : "생활, 역할, 관계와 현장의 조건 가운데 가까운 내용을 골라주세요. 해당되는 조건이 없거나 아직 모르겠다면 그대로 표시할 수 있어요.";
  return `${screenHeading(title, help)}
    <label class="field-label">${esc(copy.p16)}</label>${renderChoices("P16", audience ? p16.options_audience : p16.options_professional, { multi: true, max: 5, exclusive: ["NONE", "UNSURE"] })}${renderOtherInput("P16", "함께 작용한 다른 조건을 적어주세요.")}`;
}

function renderSupportConditions() {
  const p19 = question("P19");
  const p19Text = question("P19_TEXT");
  const audience = isAudienceContext();
  const title = contextAwareCopy(state.answers, state.language).p19;
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
  return `${screenHeading(q.text, "기존 역할은 이전 응답과의 비교를 위한 맥락입니다. 지금의 활동을 한 가지 역할로 한정하기 어렵다면 그 선택을 고르고 직접 적을 수 있어요.")}${renderChoices("P02G", q.options)}`;
}

function renderRolePrimary() {
  const group = state.answers.role_group_primary;
  const q = question("P02");
  const otherOnly = group === "G_OTHER";
  const options = otherOnly ? [["OTHER", "현재 활동을 직접 적기"]] : [...roleOptions(group), ["OTHER", "기타"]];
  const help = otherOnly
    ? "기존 역할 코드는 그대로 보존합니다. 이번 활동을 가장 자연스럽게 설명하는 말을 직접 적어주세요."
    : "현재 답변의 중심이 되는 역할을 선택해 주세요.";
  return `${screenHeading(q.text, help)}${renderChoices("P02", options)}${renderOtherInput("P02", otherOnly ? "이번 활동을 직접 적어주세요." : "역할을 직접 적어주세요.")}`;
}

function renderRoleParallel() {
  const q = question("P03");
  const otherRoles = schema.roles.filter((role) => role.value !== state.answers.role_primary).map((role) => [role.value, role.label]);
  return `${screenHeading(q.text, "지금 여러 방식으로 활동하고 있다면 함께 골라도 좋아요. 해당하지 않으면 ‘없음’을 선택해 주세요.")}${renderChoices("P03", [...otherRoles, ["NON_ARTS", "문화예술 외 역할"], ["NONE", "없음"], ["OTHER", "기타"]], { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("P03", "함께 이어지는 다른 문화예술 활동이나 역할을 직접 적어주세요.")}`;
}

function renderRoleBridge() {
  const groupQuestion = question("P02G");
  const primaryQuestion = question("P02");
  const parallelQuestion = question("P03");
  const group = state.answers.role_group_primary;
  const otherOnly = group === "G_OTHER";
  const primaryOptions = !group
    ? []
    : otherOnly
      ? [["OTHER", t("현재 활동을 직접 적기")]]
      : [...roleOptions(group), ["OTHER", t("기타")]];
  const otherRoles = schema.roles
    .filter((role) => role.value !== state.answers.role_primary)
    .map((role) => [role.value, role.label]);
  const local = stage();
  return `${screenHeading(local.roleBridgeTitle, local.roleBridgeHelp)}
    <section class="participant-context-section"><label class="field-label">${esc(groupQuestion.text)}</label>${renderChoices("P02G", groupQuestion.options)}</section>
    ${group ? `<section class="participant-context-section"><label class="field-label">${esc(primaryQuestion.text)}</label>${renderChoices("P02", primaryOptions)}${renderOtherInput("P02", local.roleBridgePrimaryOther)}</section>` : ""}
    ${state.answers.role_primary ? `<details class="participant-context-section participant-context-optional role-bridge-optional" ${values(state.answers.roles_parallel).length ? "open" : ""}><summary><span>${esc(parallelQuestion.text)}</span><small>${esc(local.optional)}</small></summary><div class="role-bridge-optional-body">${renderChoices("P03", [...otherRoles, ["NON_ARTS", t("문화예술 외 역할")], ["NONE", t("없음")], ["OTHER", t("기타")]], { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("P03", local.roleBridgeParallelOther)}</div></details>` : ""}`;
}

const CONTEXT_OPTION_GROUPS = {
  field: [
    ["VISUAL_ARTS", "CRAFT_DESIGN", "INTERDISCIPLINARY"],
    ["PHOTO_MEDIA", "FILM", "THEATRE_PERFORMANCE", "DANCE", "MUSIC", "TRADITIONAL_ARTS"],
    ["LITERATURE_PUBLISHING", "HERITAGE_ARCHIVE"],
    ["LOCAL_EVERYDAY_CULTURE", "OTHER"],
  ],
  mode: [
    ["CREATION_PRODUCTION", "DIRECTION_CHOREOGRAPHY_COMPOSITION", "PERFORMANCE_LIVE"],
    ["CURATION_PRODUCING", "SPACE_INSTITUTION_OPERATION", "DISTRIBUTION_PATRONAGE", "LOCAL_COMMUNITY_ACTIVITY"],
    ["CRITICISM_RESEARCH", "DOCUMENTATION_ARCHIVE", "EDITING_PUBLISHING_MEDIA"],
    ["EDUCATION_TRANSMISSION", "LEARNING_TRAINING", "HOBBY_CLUB_EVERYDAY_ARTS", "TECHNICAL_PRODUCTION_SUPPORT", "OTHER"],
  ],
};

function renderGroupedContextChoices(id, options, groupKey, { multi = false, max = 0 } = {}) {
  const labels = stage().groups[groupKey];
  const selected = new Set(values(answerFor(id)));
  const groups = CONTEXT_OPTION_GROUPS[groupKey].map((codes, index) => {
    const groupOptions = options.filter(([code]) => codes.includes(code));
    const open = groupOptions.some(([code]) => selected.has(code));
    return `<details class="context-choice-group" ${open ? "open" : ""}><summary><span>${esc(labels[index])}</span>${open ? `<small>${esc(stage().addAnother)}</small>` : ""}</summary>${renderChoices(id, groupOptions, { multi, max })}</details>`;
  }).join("");
  return `<p class="context-selection-help">${esc(stage().oneOrMore)}</p><div class="context-choice-groups">${groups}</div>`;
}

function renderParticipantContext() {
  const field = question("CTX_FIELD");
  const mode = question("CTX_MODE");
  const form = question("CTX_FORM");
  const unit = question("CTX_UNIT");
  const copy = participantContextCopy(state.language);
  const options = participantContextOptions(state.language);
  const local = stage();
  const step = Math.max(0, Math.min(2, Number(state.contextStep || 0)));
  const titles = task7().contextSteps;
  const sections = [
    `<section class="participant-context-section"><label class="field-label">${esc(copy.field || field.text)}</label>${renderGroupedContextChoices("CTX_FIELD", options.field, "field", { multi: true, max: 4 })}${renderOtherInput("CTX_FIELD", copy.fieldOther)}</section>`,
    `<section class="participant-context-section"><label class="field-label">${esc(copy.mode || mode.text)}</label>${renderGroupedContextChoices("CTX_MODE", options.participation_mode, "mode", { multi: true, max: 4 })}${renderOtherInput("CTX_MODE", copy.modeOther)}</section>`,
    `<section class="participant-context-section"><label class="field-label">${esc(copy.form || form.text)}</label>${renderChoices("CTX_FORM", options.activity_form)}</section><details class="participant-context-section participant-context-optional context-unit-optional" ${state.answers.participation_unit ? "open" : ""}><summary><span>${esc(copy.unit || unit.text)}</span><small>${esc(local.optional)}</small></summary><div class="context-unit-optional-body">${renderChoices("CTX_UNIT", options.participation_unit)}${renderOtherInput("CTX_UNIT", copy.unitOther)}</div></details>`,
  ];
  return `<div class="context-internal-progress" aria-label="Context ${step + 1} / 3"><span>CONTEXT ${step + 1} / 3</span><ol aria-hidden="true">${[0, 1, 2].map((index) => `<li class="${index === step ? "current" : index < step ? "complete" : ""}">${index + 1}</li>`).join("")}</ol></div>${screenHeading(titles[step], local.contextHelp)}${sections[step]}`;
}

function renderActivity() {
  const p05 = question("P05");
  const p06 = question("P06");
  const p07 = question("P07");
  const audience = isAudienceContext();
  const copy = participantActivityScreenCopy(state.language);
  const heading = audience ? copy.headingAudience : copy.headingOther;
  if (isRc2) return `${screenHeading(heading)}
    <label class="field-label">${esc(audience ? copy.p05Audience : copy.p05Other)}</label>${renderChoices("P05", p05.options)}
    ${state.answers.activity_duration_band ? renderText("P05_YEAR", { multiline: false, placeholder: copy.yearPlaceholder, label: copy.yearLabel }) : ""}`;
  return `${screenHeading(heading)}
    <label class="field-label">${esc(audience ? copy.p05Audience : copy.p05Other)}</label>${renderChoices("P05", p05.options)}
    ${state.answers.activity_duration_band ? renderText("P05_YEAR", { multiline: false, placeholder: copy.yearPlaceholder, label: copy.yearLabel }) : ""}
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
  const rawMemory = [state.answers.memory_clue_text, state.answers.memory_meaning_text, state.answers.memory_name_text]
    .map((value) => String(value || "").trim()).find(Boolean);
  const excerpt = rawMemory ? `${rawMemory.slice(0, 132)}${rawMemory.length > 132 ? "…" : ""}` : "";
  const noRecall = values(state.answers.memory_type).includes("NO_RECALL");
  const body = noRecall
    ? t("특별히 떠오르는 대상을 고르지 않은 응답도 그대로 기록했습니다. 기억을 억지로 되짚지 않고 현재의 활동과 관람, 생활의 흐름으로 이동합니다. 다음 화면부터 지금의 상태와 실제 조건을 묻습니다.")
    : excerpt
      ? t("앞서 남긴 장면을 다음 질문의 출발점으로 두었습니다. 이제 그 기억이 현재의 활동이나 관람, 생활의 변화와 어디에서 이어지는지 살펴봅니다. 다음 화면부터 지금의 상태와 실제 조건을 묻습니다.")
      : t("앞에서 남긴 기억을 다음 질문의 출발점으로 두었습니다. 이제 그 경험이 현재의 활동이나 관람, 생활의 변화와 어디에서 이어지는지 살펴봅니다. 다음 화면부터 지금의 상태와 실제 조건을 묻습니다.");
  return `${screenHeading(title, help, "앞에서 남긴 기억을 품고 있는 현재의 경험을 듣는 자리예요.")}
    <div class="transition-card">${excerpt && !noRecall ? `<blockquote>${esc(excerpt)}</blockquote>` : ""}<p>${esc(body)}</p></div>`;
}

function renderTransition() {
  const p11 = question("P11");
  const p12 = question("P12");
  const title = isProfessionalContext() ? p11.text_professional : p11.text_audience;
  const copy = contextAwareCopy(state.answers, state.language);
  const stateValue = state.answers.transition_state;
  const showText = stateValue && !["SKIP", "UNSURE"].includes(stateValue);
  return `${screenHeading(title, "분명한 한 시점이 없어도 괜찮아요. 서서히 달라졌거나 여러 번 바뀐 경험도 함께 기록합니다.")}
    ${renderChoices("P11", p11.options)}
    ${showText ? `<div class="transition-detail-field">${renderText("P12", { field: "transition_text", value: state.answers.transition_text || "", placeholder: ui().transitionPlaceholder, label: copy.p12 || p12.text })}</div>` : ""}`;
}

function renderContinuity() {
  const p13 = question("P13");
  const p13Text = question("P13_TEXT");
  const audience = isAudienceContext();
  const kind = participantContextKind(state.answers);
  const copy = contextAwareCopy(state.answers, state.language);
  const stateValue = state.answers.invisible_continuity_state;
  const placeholder = audience
    ? "계속 보거나 기억한 것, 다시 찾게 된 계기와 달라진 관계를 적어주세요."
    : kind === "EVERYDAY"
      ? "연습, 모임, 배움, 돌봄, 관계, 휴식처럼 가까운 표현으로 적어주세요."
      : "작업, 기록, 공부, 돌봄, 관계, 거리두기, 휴식처럼 가까운 표현으로 적어주세요.";
  const help = audience
    ? "전시장에 자주 가지 않는 때에도 영화, 공연, 만화, 웹툰, 디자인, 온라인 이미지처럼 다른 경로로 관심이 이어질 수 있어요."
    : kind === "EVERYDAY"
      ? "공연이나 발표가 적었던 때에도 연습, 모임, 배움과 관계가 다른 모습으로 이어질 수 있어요."
      : "발표가 적었던 때에도 작업, 조사, 관계와 생각이 다른 모습으로 이어질 수 있어요.";
  return `${screenHeading(copy.p13, help)}
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
  const localized = ui().m01;
  const options = (audience ? q.options_audience : q.options).map(([value, label]) => [value, localized.options[value] || label]);
  return `${screenHeading(localized.title, localized.help)}${renderChoices("M01", options)}`;
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

function renderNoRecallRelation() {
  const q = question("NO_RECALL_RELATION");
  return `${screenHeading(q.text, q.help || "특정 작품이나 전시를 다시 떠올릴 필요는 없어요.")}
    ${renderText("NO_RECALL_RELATION", { field: "no_recall_relation_text", value: state.answers.no_recall_relation_text || "", placeholder: "요즘 가깝게 또는 멀게 느껴지는 한 순간", label: q.text })}`;
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
    ${requiredBlock("m04-text-required", renderText("M04_TEXT", { field: "memory_meaning_text", value: state.answers.memory_meaning_text || "", placeholder, label }))}
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
  // M07의 예시는 파서와 어긋나 있었다. `locationValues`는 항목을 `;`/개행으로 나눈 뒤
  // 쉼표 앞을 country_code, 뒤를 city로 읽는다. 옛 예시 `광주, 전시장 / 온라인`대로 적으면
  // 도시가 국가 칸에 들어가고 `/`는 구분자가 아니라 city의 일부가 된다. 수집이 끝난 뒤에는
  // 참여자가 국가를 적은 건지 도시를 적은 건지 판정할 수 없다. P10이 이미 쓰는 올바른
  // 예시로 통일한다 — 같은 문자열이라 8개 언어 번역도 그대로 따라온다.
  const locationQuestion = question("M07");
  const locationLabel = noRecall() ? locationQuestion.text_no_recall : "장소 — 어디에서 만난 경험인가요?";
  return `${screenHeading(title)}${renderChoices("M06", q.options)}${state.answers.memory_time_band ? renderText("M06_YEAR", { multiline: false, placeholder: "예: 2018", label: "기억나는 연도 (선택)" }) : ""}
  ${renderText("M07", { multiline: false, placeholder: "예: KR,대구; 온라인", label: locationLabel, value: locations })}`;
}

function renderEvidence() {
  const m08 = question("M08");
  const m09 = question("M09");
  const audience = isAudienceContext();
  const title = audience ? "그 경험이 당신에게 닿은 방식과 관계를 알려주세요." : "이 기억의 경험과 관계를 알려주세요.";
  const m08Text = audience ? m08.text_audience : m08.text;
  const m09Text = audience ? m09.text_audience : m09.text;
  return `${screenHeading(title)}
    <label class="field-label">${esc(m08Text)}</label>${renderChoices("M08", m08.options, { multi: true, max: 2 })}
    <label class="field-label">${esc(m09Text)}</label>${renderChoices("M09", m09.options)}
    <label class="field-label">${esc(t("이 기억이 얼마나 또렷한가요?"))} <span class="field-optional">${esc(t("선택"))}</span></label>${renderChoices("memory_confidence", [
      ["CERTAIN", t("분명히 기억해요")],
      ["MOSTLY", t("대체로 기억해요")],
      ["VAGUE", t("흐릿해요")],
      ["UNSURE", t("확신이 없어요")],
    ])}`;
}

function renderMemoryVerify() {
  const m10 = question("M10");
  const audience = isAudienceContext();
  const text = audience ? m10.text_audience : m10.text;
  return `${screenHeading(t("기억을 다음 기록과 연결하기 전에 한 가지를 더 확인할게요."), t("이 질문은 선택 사항입니다. 기억과의 관계를 지금의 말로 남기고 싶을 때만 골라주세요."))}
    <label class="field-label">${esc(t(text))}</label>${renderChoices("M10", m10.options)}${renderOtherInput("M10", "관계를 직접 적어주세요.")}`;
}

function renderD1() {
  const focus = question("D_FOCUS");
  const d01 = question("D01");
  const canChooseFocus = state.answers.route === "BOTH" || (state.answers.route === "MEMORY" && state.answers.response_position === "PROFESSIONAL");
  const focusPart = canChooseFocus ? `<label class="field-label">${esc(focus.text)}</label>${renderChoices("D_FOCUS", focus.options)}` : "";
  const options = dOptions("gap");
  const scope = dScope();
  const title = scope === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d01 : scope === "MEMORY_RECONNECT" ? "지금 이 기억을 다시 만나기 위해, 가장 먼저 채워지면 좋겠다고 느끼는 것은 무엇인가요?" : scope === "AUDIENCE" ? "문화예술을 더 가까이 만나기 위해, 지금 가장 아쉽게 느껴지는 것은 무엇인가요?" : "지금 가장 먼저 살펴보고 싶은 조건은 무엇인가요?";
  const hints = dContextHints(state.answers, state.language).join(" · ");
  const copy = ui();
  return `${screenHeading(copy.d1Title, copy.d1Help.replace("{hints}", hints))}${focusPart}${dScope() ? `<label class="field-label">${esc(t(title || d01.text))}</label>${renderChoices("D01", options)}` : `<p class="error">${esc(t("변화의 초점을 먼저 선택해 주세요."))}</p>`}`;
}

function renderD2() {
  const d02 = question("D02");
  const d02Text = question("D02_TEXT");
  const options = dOptions("desired");
  const title = options.length && dScope() === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d02 : d02.text;
  if (!isRc2) return `${screenHeading("가장 먼저 바라는 변화를 골라주세요.")}<label class="field-label">${esc(title || d02.text)}</label>${renderChoices("D02", options)}`;
  const substantive = hasSubstantiveDChange(state.answers);
  return `${screenHeading("지금 이 흐름을 이어가거나 다시 움직이기 위해, 가장 먼저 달라졌으면 하는 장면은 무엇인가요?", "특정한 변화가 꼭 필요하다고 느끼지 않거나 아직 잘 모르겠다면 그 상태도 그대로 고를 수 있어요.")}
    <label class="field-label">${esc(t("지금과 가까운 변화의 방향을 골라주세요."))}</label>
    ${renderChoices("D02", options)}
    ${substantive ? renderText("D02_TEXT", { field: "desired_change_text", value: state.answers.desired_change_text || "", placeholder: "가장 먼저 달라졌으면 하는 실제 장면을 적어주세요.", label: d02Text.text }) : ""}`;
}

function renderD3() {
  const d03 = question("D03");
  const scope = dScope();
  const options = realityOptions();
  const title = scope === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d03 : d03.text;
  const hints = dContextHints(state.answers, state.language).join(" · ");
  const copy = ui();
  return `${screenHeading(copy.d3Title, copy.d3Help.replace("{hints}", hints))}
    <label class="field-label">${esc(title || d03.text)}</label>${renderChoices("D03", options, { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("D03", "현실의 맥락을 직접 적어주세요.")}`;
}

function renderD4() {
  const q = question("D04");
  const copy = ui();
  const title = copy.d4Title;
  const contextHint = dContextHints(state.answers, state.language).join(" · ");
  const help = (hasDContext() ? copy.d4HelpWithContext : copy.d4HelpWithoutContext).replace("{hints}", contextHint);
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
  const c04 = question("C04");
  const yes = state.answers.community_module_opt_in === "YES";
  // C04는 C00이 YES일 때 C01~C03과 같은 화면에 함께 나온다. 스키마가 C04에 show_if를 두지 않아
  // (C03도 마찬가지다) 문항 단위 조건이 없고, 커뮤니티 모듈 자체의 C00 == YES 게이트만 적용된다.
  // 화면을 새로 만들지 않는 이유: C02·C03이 코드형 선택만 받으므로, 참여자가 그 이름을 왜 떠올렸는지
  // 자기 언어로 남기는 자리는 같은 문맥 안에 있어야 답을 잇기 쉽고 화면 수도 늘지 않는다.
  // 음성 저장 필드(store[1] = community_note_audio_ref)는 일부러 비워 둔다. 스키마 type이
  // text_or_voice지만 이 앱의 음성 경로(V01~V06)는 별개 구조이고, 파일럿 전에 새 미디어 경로를
  // 여는 것은 범위를 넘는다. renderText는 store[0](community_note_text)만 쓴다.
  return `${screenHeading("다른 이름이나 장면을 하나 더 남길까요?", "이 단계는 선택 사항입니다. 지금 떠오르는 다른 작가·작품·공간·장면이 있다면 직접 적을 수 있고, 지금까지의 기록으로 마쳐도 괜찮아요.")}
    ${state.summaryGenerating ? processingSignal("응답을 정리하고 있어요") : ""}
    ${renderChoices("C00", c00.options)}
    ${yes ? `${renderText("C01", { placeholder: "작가·작품·공간·장면, 또는 목록 밖에서 떠오르는 이름", label: c01.text })}<label class="field-label">${esc(c02.text)}</label>${renderChoices("C02", c02.options)}<label class="field-label">${esc(c03.text)}</label>${renderChoices("C03", c03.options, { multi: true, max: 2 })}${renderText("C04", { label: c04.text })}` : ""}`;
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

const adaptiveScreenCheckpoint = ALL_ADAPTIVE_SCREEN_MAP;

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
    participantContext: compactParticipantContext(state.answers),
    sessionId: state.responseId,
    responseId: response.response_id,
  });
}

function reconcileAnchorsAfterResearchEdit(questionId) {
  if (!isRc2) return [];
  const affectedAnchors = [...new Set([
    ...anchorsAffectedByChangedQuestion(questionId),
    ...conditionalAnchorsAffectedByChangedQuestion(questionId),
  ])];
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
  if (state.adaptiveGenerating) return { decision: "deduplicated", question: currentAdaptiveTurn(checkpoint), source: "existing" };
  const existing = currentAdaptiveTurn(checkpoint);
  if (existing) return { decision: "deduplicated", question: existing, source: existing.source || "existing" };
  const context = buildCurrentAnchorContext(checkpoint);
  const need = assessAnchorNeed({ anchorId: checkpoint, answers: state.answers, runs: values(state.answers.adaptive_ai_runs) });
  const answerRevision = anchorAnswerFingerprint(checkpoint, anchorSourceText(state.answers, checkpoint));
  if (need.decision !== "ASK") {
    const now = new Date().toISOString();
    const run = { status: "skipped", operation: "anchor_followup", checkpoint, anchor_id: checkpoint, axis: need.axis,
      source: "policy_skip", provider: null, model: null, request_id: null, client_request_id: null, started_at: now, created_at: now,
      latency_ms: 0, http_status: null, error_code: null, fallback_reason: need.reason, answer_fingerprint: answerRevision,
      context_fingerprint: anchorContextFingerprint(checkpoint, context), network_calls: 0, need_decision: "SKIP", need_reason: need.reason,
      source_question_id: checkpoint, source_response_revision: answerRevision, generation_provenance: "not_generated", adaptive_policy_version: ADAPTIVE_POLICY_VERSION };
    // 화면을 왕복할 때마다 같은 skip 기록이 무한히 쌓이면 스냅샷 payload가 부풀고
    // 관측 자체가 읽기 어려워진다. `recordSkippedLowInformation`이 쓰는 것과 같은
    // 지문 검사를 여기에도 둔다 — 답이나 맥락이 바뀐 경우에만 새로 남긴다.
    const alreadyRecorded = values(state.answers.adaptive_ai_runs).some((existing) => existing
      && existing.checkpoint === checkpoint
      && existing.need_decision === "SKIP"
      && existing.answer_fingerprint === answerRevision
      && existing.context_fingerprint === run.context_fingerprint);
    if (!alreadyRecorded) state.answers.adaptive_ai_runs = [...values(state.answers.adaptive_ai_runs), run];
    setAdaptiveStatus(checkpoint, "skipped_policy");
    saveDraft();
    return { decision: "skip", question: null, source: "policy_skip", run };
  }
  state.adaptiveGenerating = true;
  render(false);
  const result = await createAnchorFollowup({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, anchorId: checkpoint, context, responseLanguage: responseSourceLanguage(), timeoutMs: 15000 });
  const enrichedRun = { ...result.run, checkpoint, axis: need.axis, need_decision: "ASK", need_reason: need.reason,
    source_question_id: checkpoint, source_response_revision: answerRevision, generation_provenance: result.source || "unknown",
    adaptive_policy_version: ADAPTIVE_POLICY_VERSION, created_at: result.run?.started_at || new Date().toISOString() };
  state.answers.adaptive_ai_runs = [...values(state.answers.adaptive_ai_runs), enrichedRun];
  state.answers.depth_source = aggregateAnchorSource(values(state.answers.adaptive_ai_runs)) || result.source || state.answers.depth_source;
  if (result.question) {
    state.answers.adaptive_turns = upsertAnchorTurn(adaptiveTurns(), result.question);
    state.answers.adaptive_detected_language = result.question.language || state.answers.adaptive_detected_language || state.language;
    setAdaptiveStatus(checkpoint, result.source === "motif" ? "active_motif" : "active_fallback");
  } else setAdaptiveStatus(checkpoint, result.source || "complete");
  state.adaptiveGenerating = false;
  saveDraft();
  return result;
}

function renderAdaptiveCheckpoint(checkpoint) {
  const turn = currentAdaptiveTurn(checkpoint);
  if (state.adaptiveGenerating || !turn) {
    return `${screenHeading(ui().deepQuestionReading, ui().deepQuestionPause, "")}
      ${processingSignal("다음 질문을 준비하고 있어요")}`;
  }
  const answer = state.answers[turn.answer_field] || "";
  const sourceText = anchorSourceText(state.answers, checkpoint);
  const excerpt = sourceText ? `${sourceText.slice(0, 220)}${sourceText.length > 220 ? "…" : ""}` : "";
  const aiNotice = turn.provenance?.kind === "ai-generated"
    ? `<p class="ai-use-note" role="note">${esc(stage().aiNotice)}</p>`
    : "";
  const retry = turn.source !== "motif" && aiFunctionUrl
    ? `<button class="text-button adaptive-retry" type="button" data-action="retry-adaptive" data-checkpoint="${esc(checkpoint)}">${esc(t("질문 다시 준비하기"))}</button>`
    : "";
  return `${screenHeading(stage().followingQuestion, ui().deepQuestionLead, turn.intent || "")}
    ${excerpt ? `<section class="adaptive-previous-answer"><span>${esc(stage().previousAnswer)}</span><blockquote>${esc(excerpt)}</blockquote></section>` : ""}
    <section class="adaptive-question"><h3>${esc(t(turn.prompt))}</h3>${aiNotice}</section>
    ${renderText(turn.id, { field: turn.answer_field, value: answer, placeholder: "한 문장이나 한 장면으로 적어도 좋아요.", label: "이어지는 답변" })}
    <p class="adaptive-turn-note">${esc(ui().deepQuestionNote)}</p>${retry}`;
}

async function prepareAdaptiveSummary() {
  state.summaryGenerating = true;
  render(false);
  const response = createResponse("adaptive_complete");
  const turns = adaptiveTurns();
  const context = { ...buildAdaptiveSummaryContext({ response, turns, answers: state.answers }), interview_mode: "adaptive_v2", anchor_ids: ACTIVE_ANCHOR_ORDER, adaptive_policy_version: ADAPTIVE_POLICY_VERSION };
  // A full participant record asks Motif to compose 3–5 sentences and return
  // the three evidence-backed directions. Keep this longer than the Edge
  // summary window so a valid provider response is not aborted in-browser.
  const summary = await createAdaptiveSummary({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context, answers: state.answers, turns, timeoutMs: 80000 });
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
    provenance: {
      kind: summary.source === "motif" ? "ai-generated" : "fixed",
      original_language: responseSourceLanguage(),
      displayed_language: responseSourceLanguage(),
      original_text: summary.summary,
      translated_text: summary.summary_ko || null,
      translation_kind: summary.source === "motif" && responseSourceLanguage() !== "ko" && summary.summary_ko ? "ai-translated" : "fixed",
    },
  };
  const mBlocked = state.answers.memory_type === "NO_RECALL" || ["MIXED", "UNSURE"].includes(state.answers.m_declared);
  const dBlocked = ["NO_MAJOR_GAP", "UNSURE"].includes(state.answers.d_current_gap) || ["NO_SPECIFIC_CHANGE", "UNSURE"].includes(state.answers.d_desired_change_primary);
  if (summary.axes?.m && !mBlocked) state.answers.depth_m = summary.axes.m; else if (mBlocked) delete state.answers.depth_m;
  if (summary.axes?.s) state.answers.depth_s = summary.axes.s;
  if (summary.axes?.d && !dBlocked) state.answers.depth_d = summary.axes.d; else if (dBlocked) delete state.answers.depth_d;
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

// 참여 기록 확인 칸은 위의 선택지(그대로 두기 / 고치기 / 다시 쓰기)와 똑같이 생겨서,
// 처음 보는 사람은 그것이 **진행을 여는 마지막 확인**이라는 것을 알 수 없었다. 누르지
// 않으면 `다음`이 비활성인 채로 아무 설명이 없어서, 무엇이 막고 있는지 모른 채 멈춘다.
// 그래서 이 칸만 따로 감싸고 `필수` 표시를 붙인다. 문구는 새로 만들지 않고 9개 언어에
// 이미 있는 `required`를 쓴다.
// 필수 표시가 필요한 곳은 「응답 정리」 확인 칸 하나가 아니다. 「활용 범위」 04 블록과
// 「세 방향 확인」의 마지막 선택도 같은 이유로 진행을 막는데 표시가 없었다. 문구는 새로
// 만들지 않고 9개 언어에 이미 있는 `required`만 쓰고, 표시 방식도 한 곳으로 모은다.
// `aria-describedby`가 이 표시를 가리키므로 화면 낭독에서도 무엇이 필수인지 들린다.
function requiredBlock(id, inner) {
  const requiredLabel = stage1UiExtraCopy(state.language).required;
  return `<div class="record-confirm" role="group" aria-describedby="${esc(id)}"><span class="record-confirm-label" id="${esc(id)}">${esc(requiredLabel)}</span>${inner}</div>`;
}

function renderRecordConfirm(label) {
  return requiredBlock("record-confirm-required", renderChoices("synthesis_confirmation_ack", [["YES", label]]));
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

// 확인 칸은 `고치기`/`다시 쓰기`를 고른 **순간** 나타나야 한다. 예전에는 고친 문장이
// 비어 있지 않을 때에만 나타났는데, 입력만으로는 화면을 다시 그리지 않기 때문에
// 문장을 다 적어도 확인 칸이 끝내 나타나지 않았다. 참여자는 `다음`이 꺼진 채로
// 무엇이 막는지 모르고 멈춘다 — 기록을 저장하기 한 화면 앞에서. 매 글자마다 다시
// 그리면 한글 조합 중에 커서가 튀므로, 다시 그리는 대신 확인 칸을 먼저 보여준다.
// 고친 문장이 비어 있으면 `canContinue`가 여전히 진행을 막는다.
function renderReflectionReview() {
  const summaryValue = state.answers.depth_summary?.summary?.trim() || "";
  const summary = summaryValue || "응답 정리를 불러오는 동안 연결이 원활하지 않았습니다.";
  const summaryKo = state.answers.depth_summary?.summary_ko || "";
  const action = state.answers.reflection_action;
  const local = task7();
  const rawWords = rawParticipantWords(state.answers);
  const rawSection = `<section class="record-layer record-layer-raw"><div class="record-layer-heading"><span>01</span><div><h3>${esc(local.rawTitle)}</h3><p>${esc(local.rawHelp)}</p></div></div><div class="raw-words-list">${rawWords.length ? rawWords.map((entry) => `<blockquote>${esc(entry.text)}</blockquote>`).join("") : `<p>${esc(local.rawEmpty)}</p>`}</div></section>`;
  if (isRc2 && !summaryValue) {
    return `${screenHeading(local.fallbackTitle, local.fallbackHelp)}
      ${rawSection}
      <section class="record-layer record-layer-synthesis"><div class="record-layer-heading"><span>02</span><div><h3>${esc(local.synthesisTitle)}</h3><p>${esc(local.synthesisHelp)}</p></div></div>
      <div class="notice">${esc(local.fallbackNotice)}</div>
      ${renderChoices("reflection_action", [["REWRITE", local.rewriteAction]])}
      ${action === "REWRITE" ? renderText("participant_revision", { field: "participant_revision", value: state.answers.participant_revision || "", placeholder: local.rewritePlaceholder, label: local.rewriteLabel }) : ""}
      ${action === "REWRITE" ? renderRecordConfirm(local.synthesisConfirm) : ""}</section>
      <div class="reflection-tools"><button class="text-button" type="button" data-action="regenerate-summary" ${state.summaryGenerating ? "disabled" : ""}>${esc(local.regenerateSummary)}</button></div>
      ${state.summaryGenerating ? processingSignal(local.regenerating) : ""}`;
  }
  if (!isRc2) {
    return `${screenHeading("지금까지의 응답을 이렇게 읽었습니다.", "직접 읽고 필요한 부분을 고칠 수 있어요.")}
      <div class="reflection-summary"><span>${state.answers.depth_summary?.source === "rules" ? "원문 중심 정리" : "응답 정리"}</span><p>${esc(summary)}</p>${state.answers.depth_summary?.source === "rules" ? `<small>연결이 지연되면 작성한 문장을 중심으로 먼저 정리합니다. 정리 문장은 언제든 직접 읽고 고칠 수 있습니다.</small>` : ""}</div>
      ${renderChoices("reflection_action", [["ACCEPT", "전체적으로 가까워요"], ["EDIT", "일부를 고치고 싶어요"], ["DROP", "이 정리는 남기지 않을게요"]])}
      ${action === "EDIT" ? renderText("participant_revision", { field: "participant_revision", value: state.answers.participant_revision || "", placeholder: "빠진 내용이나 어긋난 부분을 고쳐주세요.", label: "고친 문장" }) : ""}`;
  }
  const revisionLabel = action === "REWRITE" ? local.rewriteLabel : local.editLabel;
  const revisionPlaceholder = action === "REWRITE"
    ? local.rewritePlaceholder
    : local.editPlaceholder;
  const summaryProvenance = state.answers.depth_summary?.provenance;
  const translatedPreview = responseSourceLanguage() !== "ko" && summaryKo
    ? `<div class="response-document-translation reflection-translation"><span>${esc(local.koreanDraftLabel)}</span><p>${esc(summaryKo)}</p>${summaryProvenance?.translation_kind === "ai-translated" ? `<small class="ai-use-note">${esc(t("일부 문장은 AI 번역을 사용합니다. 언어에 따라 표현의 차이가 있을 수 있습니다."))}</small>` : ""}</div>`
    : "";
  return `${screenHeading(local.synthesisTitle, local.synthesisHelp)}
    ${rawSection}
    <section class="record-layer record-layer-synthesis"><div class="record-layer-heading"><span>02</span><div><h3>${esc(local.synthesisTitle)}</h3><p>${esc(local.synthesisHelp)}</p></div></div>
    ${summaryProvenance?.kind === "ai-generated" ? `<p class="ai-use-note" role="note">${esc(t("앞서 남긴 응답을 바탕으로 AI가 정리한 초안입니다. 뜻이 다르게 느껴지는 문장은 직접 다듬을 수 있어요."))}</p>` : ""}
    <div class="reflection-summary"><span>${esc(state.answers.depth_summary?.source === "rules" ? local.ruleDraftLabel : local.summaryDraftLabel)}</span><p>${esc(summary)}</p>${state.answers.depth_summary?.source === "rules" ? `<small>${esc(local.ruleDraftHelp)}</small>` : ""}</div>
    ${translatedPreview}
    ${renderChoices("reflection_action", [["ACCEPT", local.acceptAction], ["EDIT", local.editAction], ["REWRITE", local.rewriteNewAction]])}
    ${["EDIT", "REWRITE"].includes(action) ? renderText("participant_revision", { field: "participant_revision", value: state.answers.participant_revision || "", placeholder: revisionPlaceholder, label: revisionLabel }) : ""}
    ${action ? renderRecordConfirm(local.synthesisConfirm) : ""}</section>
    <div class="reflection-tools"><button class="text-button" type="button" data-action="review-answers">${esc(local.reviewAnswers)}</button><button class="text-button" type="button" data-action="regenerate-summary" ${state.summaryGenerating ? "disabled" : ""}>${esc(local.regenerateSummary)}</button></div>
    ${state.summaryGenerating ? processingSignal(local.regenerating) : ""}`;
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
  const mBlocked = state.answers.memory_type === "NO_RECALL" || ["MIXED", "UNSURE"].includes(state.answers.m_declared);
  const dBlocked = ["NO_MAJOR_GAP", "UNSURE"].includes(state.answers.d_current_gap) || ["NO_SPECIFIC_CHANGE", "UNSURE"].includes(state.answers.d_desired_change_primary);
  if (!state.answers.participant_m && !mBlocked) state.answers.participant_m = snapshot.m_primary || state.answers.depth_m || (/^M[1-4]$/.test(state.answers.m_declared || "") ? state.answers.m_declared : "");
  if (mBlocked) delete state.answers.participant_m;
  if (!state.answers.participant_s) state.answers.participant_s = snapshot.s_primary || state.answers.depth_s || "";
  if (!state.answers.participant_d && !dBlocked) state.answers.participant_d = snapshot.d_primary || state.answers.depth_d || (/^D[1-4]$/.test(state.answers.d_desired_change_primary || "") ? state.answers.d_desired_change_primary : "");
  if (dBlocked) delete state.answers.participant_d;
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
    : t("다음 화면에서 활용 범위를 정한 뒤 참여 기록을 이 기기에 보관합니다.");
  if (!isRc2) return `${screenHeading("연구 응답을 제출할 준비가 되었습니다.", storageNotice)}<div class="notice">연구 기록은 여기에서 먼저 마무리됩니다.</div>`;
  ensureParticipantAxes();
  const translationProvenance = state.answers.participant_approved_translation_provenance;
  const translationNotice = responseSourceLanguage() !== "ko" && !state.answers.participant_approved_text_ko
    ? `<div class="document-language-note">${esc(t("원문을 먼저 보관하며, 한국어 번역은 원문을 기준으로 정리합니다."))}</div>`
    : translationProvenance?.kind === "ai-translated"
      ? `<div class="document-language-note ai-use-note">${esc(t("일부 문장은 AI 번역을 사용합니다. 언어에 따라 표현의 차이가 있을 수 있습니다."))}</div>`
      : "";
  const mOpen = state.answers.memory_type === "NO_RECALL" || ["MIXED", "UNSURE"].includes(state.answers.m_declared);
  const dOpen = ["NO_MAJOR_GAP", "UNSURE"].includes(state.answers.d_current_gap) || ["NO_SPECIFIC_CHANGE", "UNSURE"].includes(state.answers.d_desired_change_primary);
  // 한 축을 한 방향으로 좁히지 않은 것은 결핍이 아니라 유효한 상태다(complete 외에
  // mixed·pending_review·insufficient 를 모두 허용한다). 그래서 이 문장을 라벨 칸에
  // 함께 넣지 않고, 다른 두 축에서 선택지가 놓이는 넓은 칸에 그대로 둔다. 라벨은 같은
  // 칸에 남으므로 세 축의 폭과 정렬이 어긋나지 않고, 문장도 세 줄로 꺾이지 않는다.
  const mReview = mOpen ? `<section class="axis-review-card axis-review-open"><div><span>${esc(t("기억의 의미"))}</span></div><strong class="axis-review-open-state">${esc(stage().task5.noAxisMemory)}</strong></section>` : renderAxisReview("participant_m", "기억의 의미");
  const dReview = dOpen ? `<section class="axis-review-card axis-review-open"><div><span>${esc(t("이어가기 위한 조건"))}</span></div><strong class="axis-review-open-state">${esc(stage().task5.noAxisCondition)}</strong></section>` : renderAxisReview("participant_d", "이어가기 위한 조건");
  // 세 방향(M·S·D)은 이미 채워진 채로 보이기 때문에 이 화면은 다 끝난 것처럼 읽힌다.
  // 실제로 진행을 막는 것은 `coordinate_feedback` 미선택 하나뿐인데, 그 선택지는 긴
  // 설명 아래에 서술문처럼 놓여 있고 버튼은 한참 아래에 있어서 질문으로 읽히지 않았다.
  // 필수 표시를 붙여 무엇이 남았는지 보이게 한다(문구는 기존 `required` 그대로).
  return `${screenHeading(t("당신의 기록이 닿은 세 방향"), t("앞선 질문과 답변의 흐름을 따라 세 방향의 위치를 정리했습니다. 직접 눌러 지금의 기록과 가까운 위치로 조정할 수 있어요."))}
    ${state.translationGenerating ? processingSignal(t("원문을 기준으로 한국어 번역을 준비하고 있어요")) : ""}
    ${translationNotice}
    <section class="axis-review"><div class="axis-review-intro"><span>THREE DIRECTIONS · YOUR RECORD</span><h3>${esc(t("기억의 의미 · 현재의 흐름 · 이어가기 위한 조건을 확인해 주세요."))}</h3><p>${esc(t("선택을 바꾸면 아래 세 방향 표시에도 이번 기록과 가까운 흐름이 반영됩니다."))}</p></div>${mReview}${renderAxisReview("participant_s", "현재의 흐름")}${dReview}</section>
    <section class="coordinate-feedback"><h3>${esc(t("세 방향이 만나는 자리"))}</h3><p>${esc(t("이 표시는 사람의 고정된 유형이 아니라, 이번 응답이 현재 놓인 위치와 기록에서 읽힌 방향을 함께 살펴보는 구조입니다. 시간이 지나거나 상황이 달라지면 이 위치도 달라질 수 있어요."))}</p>${renderCoordinateModel()}${requiredBlock("coordinate-feedback-required", renderChoices("coordinate_feedback", [["CLOSE", "이 세 방향이 가까워요 — 지금 보이는 세 방향을 이번 기록의 위치로 남겨요."], ["MIXED", "두 흐름이 함께 보여요 — 한 방향에서 두 흐름이 함께 느껴지면 둘 다 표시할 수 있어요."], ["DIFFERENT", "조금 더 설명하고 싶어요 — 세 방향을 고른 뒤, 남기고 싶은 말을 자유롭게 덧붙여 주세요."]]))}${["MIXED", "DIFFERENT"].includes(state.answers.coordinate_feedback) ? renderText("coordinate_feedback_text", { field: "coordinate_feedback_text", value: state.answers.coordinate_feedback_text || "", label: t("함께 남길 설명"), placeholder: t("두 방향이 함께 느껴지는 이유나 덧붙일 내용을 적어주세요.") }) : ""}</section>
    <p class="submit-scope-note">${esc(storageNotice)}</p>`;
}

function renderUseScope() {
  const researchUse = state.answers.policy_research_use || "";
  const quoteUse = state.answers.policy_quote_use || "";
  const archiveUse = state.answers.public_archive_interest || "";
  const consent = stage1ConsentCopy(state.language);
  const local = task7();
  const researchContact = state.researchContact || { email: "", consent: false, status: null };
  const choice = (field, value, title, copy) => { const selected = state.answers[field] === value; return `<button type="button" class="use-scope-choice ${selected ? "selected" : ""}" data-use-field="${esc(field)}" data-use-value="${esc(value)}" aria-pressed="${selected}"><strong>${esc(t(title))}</strong>${copy ? `<small>${esc(t(copy))}</small>` : ""}</button>`; };
  // 03에서 `다시 확인`(ASK_LATER)을 고르면, 이 04 블록의 이메일과 동의 체크가 저장
  // 버튼을 여는 필수 조건이 된다(`canContinue("USE_SCOPE")`). 그런데 이 블록에는 필수
  // 표시가 하나도 없었다. 이메일을 다 넣어도 버튼이 열리지 않는 이유가 화면 어디에도
  // 없었고, 이메일을 주고 싶지 않은 사람은 03을 바꿔야 한다는 것도 알 수 없었다.
  // 「응답 정리」 확인 칸과 같은 방식으로 감싸 무엇이 남았는지 보이게 한다.
  const contactSection = archiveUse === "ASK_LATER" ? `<section class="use-scope-section research-contact-section"><span>04 · ${esc(local.researchContactLabel)}</span><h3>${esc(local.researchContactTitle)}</h3><p>${esc(local.researchContactHelp)}</p>${requiredBlock("research-contact-required", `<label class="field-label" for="research-contact-email">${esc(local.researchContactLabel)}</label><input id="research-contact-email" class="text-input text-input-single" type="email" inputmode="email" autocomplete="email" required aria-required="true" aria-describedby="research-contact-required" data-research-contact="email" value="${esc(researchContact.email || "")}" placeholder="name@example.com" /><label class="final-check"><input type="checkbox" data-research-contact-consent aria-required="true" aria-describedby="research-contact-required" ${researchContact.consent ? "checked" : ""} /><span>${esc(local.researchContactConsent)}</span></label>`)}</section>` : "";
  // 요약줄이 `… · 공개 활용은 다시 확인`에서 끝나면 다 채운 것처럼 읽힌다. 실제로는
  // 04가 남아 있어 저장 버튼이 잠겨 있는데, 그 사실이 어디에도 없었다. 03에서 `다시
  // 확인`을 고른 동안에만 04의 상태를 같은 줄에 덧붙인다. 문구는 이미 9개 언어에 있는
  // `researchContactLabel`과 `required`만 쓴다.
  const contactSummary = archiveUse === "ASK_LATER"
    ? ` · <span data-use-scope-contact-status>${esc(useScopeContactStatusText())}</span>`
    : "";
  return `${screenHeading(consent.title, local.useScopeHelp)}
    <section class="use-scope-section"><span>01 · ${esc(t("정책연구"))}</span><h3>${esc(consent.researchQ)}</h3><div class="use-scope-grid">${choice("policy_research_use", "ANON_ANALYSIS", consent.researchYes, "")}${choice("policy_research_use", "INTERNAL_ONLY", consent.researchNo, "")}</div></section>
    <section class="use-scope-section"><span>02 · ${esc(t("문장 인용"))}</span><h3>${esc(consent.quoteQ)}</h3><div class="use-scope-grid">${choice("policy_quote_use", "ANON_EXCERPT", consent.quoteYes, "")}${choice("policy_quote_use", "NO_QUOTE", consent.quoteNo, "")}</div></section>
    <section class="use-scope-section"><span>03 · ${esc(t("전시·출판·웹 기록"))}</span><h3>${esc(consent.publicQ)}</h3><div class="use-scope-grid">${choice("public_archive_interest", "ASK_LATER", consent.publicYes, "")}${choice("public_archive_interest", "RESEARCH_ONLY", consent.publicNo, "")}</div></section>
    ${contactSection}
    <div class="use-scope-summary"><strong>${esc(t("현재 선택"))}</strong><p>${esc(t(researchUse ? (researchUse === "ANON_ANALYSIS" ? "익명 분석" : "내부 연구") : "정책연구 범위 미선택"))} · ${esc(t(quoteUse ? (quoteUse === "ANON_EXCERPT" ? "익명 문장 인용 가능" : "문장 인용 제외") : "인용 범위 미선택"))} · ${esc(t(archiveUse ? (archiveUse === "ASK_LATER" ? "공개 활용은 다시 확인" : "연구 범위에서 마무리") : "공개 활용 범위 미선택"))}${contactSummary}</p></div>`;
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
    ROLE_BRIDGE: renderRoleBridge,
    PARTICIPANT_CONTEXT: renderParticipantContext,
    PROFILE: renderProfile,
    M01: renderMemoryType,
    NO_RECALL_RELATION: renderNoRecallRelation,
    M02: renderMemoryClue,
    M03: renderBranch,
    M03_RECONNECT: renderBranch,
    M10_VERIFY: renderMemoryVerify,
    M04: renderMeaning,
    M05: renderMeaningTags,
    AI_ANCHOR_M04_TEXT: () => renderAdaptiveCheckpoint("M04_TEXT"),
    AI_CONDITIONAL_NO_RECALL_RELATION: () => renderAdaptiveCheckpoint("NO_RECALL_RELATION"),
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
    AI_CONDITIONAL_D04_CONDITIONS: () => renderAdaptiveCheckpoint("D04_CONDITIONS"),
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
  if (id === "CONSENT") return Boolean(answerFor("RC01") && answerFor("RC02"));
  if (id === "P01") return Boolean(state.answers.route);
  if (id === "DOCUMENT_IDENTITY") return Boolean(state.answers.display_name_mode && (state.answers.display_name_mode === "ANONYMOUS" || state.answers.display_name?.trim()));
  if (id === "P01_CONTEXT") return Boolean(state.answers.response_position);
  if (id === "ROLE_GROUP") return Boolean(state.answers.role_group_primary);
  if (id === "ROLE_PRIMARY") return Boolean(state.answers.role_primary);
  if (id === "ROLE_BRIDGE") return Boolean(state.answers.role_group_primary && state.answers.role_primary);
  if (id === "PARTICIPANT_CONTEXT") return hasParticipantContext(state.answers);
  if (id === "M01") return Boolean(state.answers.memory_type);
  if (id === "M02") return Boolean(state.answers.memory_clue_text?.trim());
  if (id === "M04") return Boolean(state.answers.m_declared && state.answers.memory_meaning_text?.trim());
  if (id === "PRACTICE_PUBLIC_STATE") return Boolean(state.answers.creative_work_state && state.answers.public_activity_state);
  if (id === "STATE_BACKGROUND") return Boolean(values(state.answers.pause_context_tags).length);
  if (id === "TRANSITION") {
    if (!state.answers.transition_state) return false;
    return !hasSubstantiveTransition(state.answers) || Boolean(state.answers.transition_text?.trim());
  }
  if (id === "CONTINUITY") {
    if (!state.answers.invisible_continuity_state) return false;
    return !["YES", "MIXED"].includes(state.answers.invisible_continuity_state) || Boolean(state.answers.invisible_continuity_text?.trim());
  }
  if (id === "SUPPORT_CONDITIONS") return Boolean(values(state.answers.support_conditions).length);
  if (adaptiveScreenCheckpoint[id]) {
    const turn = currentAdaptiveTurn(adaptiveScreenCheckpoint[id]);
    if (state.adaptiveGenerating) return false;
    // 질문이 없는 화면에는 답할 것이 없다. 진행을 막으면 참여자가 대기 문구
    // 앞에서 갇히고, 그 지점은 기록을 저장하기 직전이다.
    if (!turn) return true;
    return Boolean(state.answers[turn.answer_field]?.trim());
  }
  if (id === "D01") return Boolean(state.answers.d_current_gap);
  if (id === "D02") return Boolean(state.answers.d_desired_change_primary) && (!hasSubstantiveDChange(state.answers) || Boolean(state.answers.desired_change_text?.trim()));
  if (id === "DEPTH_M") return Boolean(state.answers.depth_m);
  if (id === "DEPTH_S") return Boolean(state.answers.depth_s);
  if (id === "DEPTH_D") return Boolean(state.answers.depth_d);
  if (id === "REFLECTION_REVIEW") {
    if (!state.answers.reflection_action) return false;
    if (["EDIT", "REWRITE"].includes(state.answers.reflection_action) && !state.answers.participant_revision?.trim()) return false;
    // 클릭 가드(`confirmParticipantSynthesis`)와 **같은 함수**를 본다. 확인 칸만 보던
    // 예전 조건에서는, 정리문이 빈 상태에서도 버튼이 켜지고 눌러도 아무 일이 없었다.
    return synthesisConfirmed();
  }
  if (id === "SUBMIT") {
    const mOptional = state.answers.memory_type === "NO_RECALL" || ["MIXED", "UNSURE"].includes(state.answers.m_declared);
    const dOptional = ["NO_MAJOR_GAP", "UNSURE"].includes(state.answers.d_current_gap) || ["NO_SPECIFIC_CHANGE", "UNSURE"].includes(state.answers.d_desired_change_primary);
    return Boolean((mOptional || state.answers.participant_m) && state.answers.participant_s && (dOptional || state.answers.participant_d) && state.answers.coordinate_feedback) && !state.translationGenerating;
  }
  if (id === "USE_SCOPE") {
    // 저장 버튼의 클릭 핸들러가 따로 들고 있던 2차 가드를 여기로 옮겼다. 두 곳이 다른
    // 조건을 보면, 버튼이 켜져 있는데 눌러도 아무 일이 없는 상태가 생긴다 — 그것도
    // 참여 기록을 실제로 저장하는 마지막 버튼에서.
    if (!synthesisConfirmed() || !state.answers.participant_approved_text) return false;
    const useScopeComplete = Boolean(state.answers.policy_research_use && state.answers.policy_quote_use && state.answers.public_archive_interest);
    if (!useScopeComplete) return false;
    if (state.answers.public_archive_interest !== "ASK_LATER") return true;
    return researchContactComplete();
  }
  return true;
}

function canContinueContextStep(step = Number(state.contextStep || 0)) {
  if (step === 0) {
    const field = values(state.answers.field);
    return field.length > 0 && (!field.includes("OTHER") || Boolean(String(state.answers.field_other || "").trim()));
  }
  if (step === 1) {
    const mode = values(state.answers.participation_mode);
    return mode.length > 0 && (!mode.includes("OTHER") || Boolean(String(state.answers.participation_mode_other || "").trim()));
  }
  return Boolean(state.answers.activity_form)
    && (state.answers.participation_unit !== "OTHER" || Boolean(String(state.answers.participation_unit_other || "").trim()));
}

function createResponse(submissionPhase = "final") {
  const responseId = state.responseId || `V13-${crypto.randomUUID()}`;
  const participantReference = submissionPhase === "final" ? ensureParticipantReference(responseId) : null;
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
    displayLanguage: state.language,
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
    payload_version: isRc2 ? "over39-rc2-task9-live-data-v0.6.1" : "over39-rc1-payload-1",
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
    participant_code: participantCode || null,
    rc1_version: releaseVersion,
    release_version: releaseVersion,
    include_in_policy_statistics: sampleType === "research" && cleanedAnswers.policy_research_use === "ANON_ANALYSIS",
    coordinate_scope: coordinateScope,
    coordinate_subject: finalSnapshot.coordinate_subject,
    coordinate_status: finalSnapshot.status,
    coordinate_number: finalSnapshot.coordinate_number,
    coordinate_candidate: finalSnapshot.coordinate_candidate,
    participant_context: compactParticipantContext(cleanedAnswers),
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
        provenance: {
          kind: "fixed",
          original_language: "ko",
          displayed_language: state.language,
          original_question_text: schema.questions.find((item) => item.id === id)?.text || q?.text || "",
          displayed_question_text: apiQuestionText(id, q),
        },
        answer,
        answer_display: apiAnswerDisplay(id, answer),
      };
    }),
    fixed_question_count: fixedQuestionIds.length,
    depth_question_count: isRc2 ? values(cleanedAnswers.adaptive_turns).length : 3,
    depth_interview: isRc2 ? {
      mode: "adaptive_v2_need_gated",
      adaptive_policy_version: ADAPTIVE_POLICY_VERSION,
      historical_checkpoints: ANCHOR_ORDER,
      active_checkpoints: ACTIVE_ANCHOR_ORDER,
      source: aggregateAnchorSource(values(cleanedAnswers.adaptive_ai_runs)) || cleanedAnswers.depth_source || "skipped_low_information",
      interaction_language: sourceLanguage,
      checkpoints: ACTIVE_ANCHOR_ORDER,
      conditional_checkpoints: values(cleanedAnswers.adaptive_turns)
        .map((turn) => turn.checkpoint)
        .filter((checkpoint) => !ANCHOR_ORDER.includes(checkpoint)),
      turns: values(cleanedAnswers.adaptive_turns).map((turn) => ({
        id: turn.id, checkpoint: turn.checkpoint, anchor_id: turn.anchor_id || turn.checkpoint, axis: turn.axis, focus: turn.focus, prompt: turn.prompt,
        intent: turn.intent, source: turn.source, provider: turn.provider || null, model: turn.model || null, language: turn.language, provenance: turn.provenance || { kind: turn.source === "motif" ? "ai-generated" : "fixed" },
        request_id: turn.request_id || null, client_request_id: turn.client_request_id || null, client_request_id_sent: turn.client_request_id_sent || turn.client_request_id || null, client_request_id_returned: turn.client_request_id_returned || null, client_request_id_match: turn.client_request_id_match === true, context_fingerprint: turn.context_fingerprint || null, dom_match: turn.dom_match === true,
        need_decision: turn.need_decision || null, need_reason: turn.need_reason || null, adaptive_policy_version: turn.adaptive_policy_version || ADAPTIVE_POLICY_VERSION,
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
      summary_provenance: cleanedAnswers.depth_summary?.provenance || null,
      participant_action: cleanedAnswers.reflection_action || null,
      participant_revision: cleanedAnswers.participant_revision?.trim() || null,
      participant_approved_text: approvedText,
      participant_approved_text_ko: cleanedAnswers.participant_approved_text_ko?.trim() || null,
      participant_approved_provenance: cleanedAnswers.participant_approved_provenance || null,
      participant_approved_translation_provenance: cleanedAnswers.participant_approved_translation_provenance || null,
      synthesis_confirmation: cleanedAnswers.synthesis_confirmation || null,
      original_confirmation_status: approvedText ? "participant_confirmed" : "not_confirmed",
      translation_status: sourceLanguage === "ko" ? "same_as_original" : cleanedAnswers.participant_approved_text_ko ? "translated_from_original" : "translation_pending",
      public_approved: false,
    },
    response_document: finalDocument,
    // `access_token` is transport-only. The submit Edge source hashes it and
    // removes it before inserting a response snapshot or research payload.
    participant_reference: participantReference ? publicParticipantReference(participantReference) : null,
    participant_access: participantReference ? {
      access_token: participantReference.access_token,
      transport: "one_time_server_hash",
      scope: ["record_read", "greeting_mailbox"],
    } : null,
    document_confirmation: {
      acknowledged: cleanedAnswers.synthesis_confirmation_ack === "YES" && Boolean(approvedText),
      approval_scope: "participant_synthesis_text_only",
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
      research_analysis: cleanedAnswers.policy_research_use === "ANON_ANALYSIS",
      anonymous_quotation: cleanedAnswers.policy_quote_use === "ANON_EXCERPT",
      future_public_contact: cleanedAnswers.public_archive_interest === "ASK_LATER",
      research_contact_storage: cleanedAnswers.public_archive_interest === "ASK_LATER" && state.researchContact?.consent === true,
      consent_version: schema.versioning.consent_version,
    },
    // `readOutbox()`는 기본 인자 `storage = localStorage` 평가만으로 던질 수 있다.
    // 이 값은 진단용 숫자일 뿐인데, 그것 때문에 응답 전체를 못 만들면 안 된다.
    outbox_count: (() => { try { return readOutbox().length; } catch { return null; } })(),
  };
}

async function requestResearchStorage(response) {
  const kind = response.submission_phase === "fixed_complete" ? "fixed_snapshot" : "research_submission";
  // 멱등키는 `${response_id}:${submission_phase}`다. 이탈 스냅샷은 두 지점에서 같은
  // `fixed_complete` 단계로 보내므로 키가 겹치고, 서버는 겹치는 키를 `duplicate: true`로
  // 그냥 버린다(over39-submit). 그러면 두 번째 지점이 조용히 사라져 "어느 질문에서
  // 멈췄는가"가 반쪽만 남는다. 지점 이름을 접미사로 붙여 각자 하나의 기록이 되게 한다.
  const suffix = response.drop_off_checkpoint ? String(response.drop_off_checkpoint) : "";
  if (submitFunctionUrl) {
    return sendEnvelope(createEnvelope(kind, response, suffix), {
      endpoint: submitFunctionUrl,
      anonKey: supabaseAnonKey,
    });
  }
  if (!googleAppsScriptUrl) {
    return sendEnvelope(createEnvelope(kind, response, suffix), {});
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

function createResearchContactUpdate(response) {
  const contact = state.researchContact || {};
  const email = String(contact.email || "").trim();
  if (state.answers.public_archive_interest !== "ASK_LATER" || contact.consent !== true || !email) return null;
  return {
    response_id: response.response_id,
    submission_phase: "research_contact_update",
    email,
    display_name: null,
    role_label: null,
    contact_reason: "future_public_use_reconfirmation",
    consent_scope: ["research_future_public_use_reconfirmation"],
    consent_version: schema.versioning.consent_version,
  };
}

async function requestResearchContactStorage(response) {
  const update = createResearchContactUpdate(response);
  if (!update) return { status: "not_requested" };
  const result = await sendEnvelope(createEnvelope("contact_update", update, "research-contact"), {
    endpoint: submitFunctionUrl,
    anonKey: supabaseAnonKey,
  });
  state.researchContact = { ...(state.researchContact || {}), status: result.status };
  return result;
}

// 안부 예약 요청에 시간 제한이 없으면, 릴레이가 멈춘 동안(모바일·캡티브 포털·엣지 함수
// 지연) `fetch`가 영영 끝나지 않는다. 그러면 `beginFirstGreeting`은 `loading` 상태에
// 머무르고, 참여자는 설문 **맨 앞**에서 앞으로도 뒤로도 가지 못한다. 시간이 지나면
// 실패로 보고 이미 있는 `waiting`/`unavailable` 상태로 내려간다.
const GREETING_RESERVATION_TIMEOUT_MS = 15000;

function greetingReservationSignal(ms = GREETING_RESERVATION_TIMEOUT_MS) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  // 구형 사파리에는 `AbortSignal.timeout`이 없다. 그때도 참여자가 갇히지 않도록 직접 끊는다.
  if (typeof AbortController === "undefined") return undefined;
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function requestGreetingReservation(response, { inlineFirst = false } = {}) {
  const reference = response?.participant_access || ensureParticipantReference(response?.response_id);
  if (!globalGreetingsEnabled || !relayFunctionUrl || !reference?.access_token) return { status: "not_active" };
  const publicCode = response?.participant_reference?.code || reference.code || ensureParticipantReference(response?.response_id)?.code;
  try {
    const result = await fetch(relayFunctionUrl, {
      method: "POST",
      signal: greetingReservationSignal(),
      headers: {
        "Content-Type": "application/json",
        ...(supabaseAnonKey ? { Authorization: `Bearer ${supabaseAnonKey}`, apikey: supabaseAnonKey } : {}),
      },
      body: JSON.stringify({
        action: "participant_reserve",
        response_id: response.response_id,
        participant_access_token: reference.access_token,
        participant_public_code: publicCode,
        participant_scope: reference.scope || ["record_read", "greeting_mailbox"],
        source_language: response.source_language || state.language || "ko",
        sample_type: response.sample_type || sampleType,
        release_version: response.release_version || releaseVersion,
        delivery_surface: inlineFirst ? "inline_first" : "relay_mailbox",
      }),
    });
    const body = await result.json();
    if (!result.ok || !body?.ok) return { status: "waiting", error: body?.error_code || "RESERVATION_UNAVAILABLE" };
    return { status: ["QUEUED", "OPENED"].includes(body.status) ? "reserved" : "waiting", receipt: body };
  } catch (error) {
    return { status: "waiting", error: error?.message || "RESERVATION_UNAVAILABLE" };
  }
}

async function beginFirstGreeting() {
  state.phase = "greeting-first";
  state.firstGreeting = { status: "loading", requested_at: new Date().toISOString() };
  saveFirstGreeting();
  saveDraft();
  render(true);
  if (!globalGreetingsEnabled) {
    state.firstGreeting = { status: "unavailable", reason: "GLOBAL_GREETINGS_COLLECTION_DISABLED" };
    saveFirstGreeting();
    saveDraft();
    render(true);
    return;
  }
  const reference = ensureParticipantReference(state.responseId);
  const reservation = await requestGreetingReservation({
    response_id: state.responseId,
    participant_reference: publicParticipantReference(reference),
    participant_access: reference,
    source_language: state.language,
    sample_type: sampleType,
    release_version: releaseVersion,
  }, { inlineFirst: true });
  state.greetingReservation = reservation;
  if (reservation.status === "reserved" && reservation.receipt?.greeting?.original_text) {
    state.firstGreeting = {
      status: "received",
      greeting_id: reservation.receipt.greeting.id,
      original_language: reservation.receipt.greeting.original_language || "ko",
      original_text: reservation.receipt.greeting.original_text,
      origin: reservation.receipt.greeting.origin || "participant",
      received_at: new Date().toISOString(),
    };
  } else if (reservation.status === "not_active" || reservation.error) {
    state.firstGreeting = { status: "unavailable", reason: reservation.error || "GREETING_NOT_ACTIVE" };
  } else {
    state.firstGreeting = { status: "waiting", reason: reservation.receipt?.reason || "QUEUE_EMPTY" };
  }
  saveFirstGreeting();
  saveDraft();
  render(true);
}

function beginResearchStory(receiveGreeting = false) {
  state.phase = "survey";
  state.step = Math.max(1, state.step);
  const connection = getConnection();
  connection.opt_in = receiveGreeting ? "YES" : "NO";
  connection.receive_opt_in = receiveGreeting ? "YES" : "NO";
  connection.stage = receiveGreeting ? "waiting" : "skipped";
  saveConnection();
  saveDraft();
  render(true);
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
  const projectMeta = isRc2 ? greetingFirst().projectMeta : "PUBLIC MEMORY RESEARCH · RC1";
  const currentLanguage = languages.find(([code]) => code === state.language)?.[1] || "한국어";
  return `<header class="topbar" aria-label="Site header">
    <div class="brand project-brand"><span class="brand-mark" aria-hidden="true">39+</span><span>〈만 39세 이상〉</span></div>
    <div class="topbar-project"><span>${esc(projectMeta)}</span><strong>RESEARCH</strong></div>
    <details class="language-menu">
      <summary aria-label="${esc(t("언어 선택"))}"><span>${esc(currentLanguage)}</span><i aria-hidden="true">⌄</i></summary>
      <div class="language-menu-panel" role="group" aria-label="${esc(t("언어 선택"))}">
        ${languages.map(([code, label]) => `<button type="button" data-lang="${code}" class="${state.language === code ? "active" : ""}" aria-pressed="${state.language === code}"><span>${label}</span>${state.language === code ? '<b aria-hidden="true">●</b>' : ''}</button>`).join("")}
      </div>
    </details>
  </header>`;
}

function footer() {
  if (isRc2) return `<footer class="site-footer"><div class="footer-project"><strong>〈만 39세 이상〉</strong><span>${esc(greetingFirst().researchTitle)}</span><a href="mailto:${researchContactEmail}">${researchContactEmail}</a></div><div class="footer-credits">${creditRows.map(([role, name]) => `<span><em>${esc(t(role))}</em>${esc(name)}</span>`).join("")}</div></footer>`;
  return `<footer class="site-footer"><div class="footer-project"><strong>〈만 39세 이상〉</strong><span>PUBLIC MEMORY RESEARCH · INSTITUTION RC1</span><a href="mailto:${researchContactEmail}">${researchContactEmail}</a></div><div class="footer-credits">${creditRows.map(([role, name]) => `<span><em>${esc(t(role))}</em>${esc(name)}</span>`).join("")}</div></footer>`;
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

// Retired RC1-only exhibition draft. RC2 never calls this renderer: RC2
// `phase === "exhibition"` deliberately returns `renderComplete()` and the
// current public-facing open call is `over39-open-call.html`. Keep the code
// isolated while older RC1 local drafts remain readable; it must not become a
// route back into the removed age acknowledgement interface.
function renderRetiredRc1ExhibitionApplication() {
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
  if ((connection.stage || "receive") === "receive") {
    // Receiving the first greeting needs only an explicit receive choice.
    // Direction and translation are choices for the later outgoing sentence,
    // never prerequisites for seeing an already available greeting.
    return connection.receive_opt_in === "YES";
  }
  if (connection.stage !== "preview") return false;
  return hasOutgoingMessage
    && Boolean(connection.message_audience)
    && ["NAMED", "CONTEXTUAL", "ANONYMOUS"].includes(connection.sender_visibility)
    && ["YES", "NO"].includes(connection.translation_allowed)
    && connection.preview_confirmed === true;
}

function createConnectionUpdate() {
  const research = state.submitted || createResponse();
  const connection = getConnection();
  const profile = buildConnectionProfile(research, connection);
  // A display label is intentionally a separate, narrowly scoped disclosure.
  // It never turns a response ID, contact detail, or full profile into public
  // greeting data.
  const publicDisplayLabel = safeReferrerLabel(research.response_document?.participant?.display_name || "", "");
  const senderPublicContext = {
    display_label: connection.sender_visibility === "NAMED" && publicDisplayLabel ? publicDisplayLabel : null,
    role: profile.role || null,
    region: profile.region || null,
  };
  return {
    ...research,
    submission_phase: "connection_update",
    submitted_at: new Date().toISOString(),
    connection_profile: { ...profile, sender_public_context: senderPublicContext },
    message_exchange: {
      greeting_id: connection.greeting_id || `${research.response_id}-greeting`,
      message_audience: connection.message_audience || null,
      message_text: String(connection.message_text || connection.introduction || "").trim() || null,
      receive_opt_in: connection.receive_opt_in === "YES",
      receive_scopes: values(connection.receive_scopes).length ? values(connection.receive_scopes) : (connection.receive_opt_in === "YES" ? ["OPEN"] : []),
      greeting_connection_preference: connection.greeting_connection_preference || null,
      sender_visibility: connection.sender_visibility || null,
      sender_public_context: senderPublicContext,
      origin: connection.origin === "core_seed" ? "core_seed" : "participant",
      translation_allowed: connection.translation_allowed === "YES",
      original_language: research.source_language || state.language || "ko",
      // Notification contact is deliberately collected only after a greeting
      // has been received. It is not a condition of receiving the first one.
      delivery_modes: ["MEDIATED_WEB"],
      status: connection.opt_in === "YES" ? "WAITING_RECEIVER" : "not_requested",
      mailbox_delivery: {
        model: "store_and_forward",
        api_roles: ["translation", "safety_check", "letter_formatting", "soft_theme_tagging"],
        ranking_or_value_matching: false,
        human_review: "exception_only",
        expose_contact_between_participants: false,
        state_machine: ["STORED", "WAITING_RECEIVER", "QUEUED", "EMAIL_PENDING", "DELIVERED", "OPENED", "REPLIED", "PASSED", "WITHDRAWN"],
      },
      email_delivery: {
        sender_name: greetingSenderName,
        sender_email: greetingSenderEmail,
        subject: "[〈만 39세 이상〉] 안부 한 통이 도착했습니다",
        template: "greeting_letter_v2_mailbox",
        queue_policy: "opt_in_after_first_greeting_then_transactional_retry_until_delivered_or_bounced",
        recipient_notice_only: true,
        notification_opt_in: "deferred_until_greeting_read",
        return_reply_to_origin: {
          enabled_when_origin_opted_in: true,
          expose_contact_between_participants: false,
          notify_via_project_mailbox: true,
        },
      },
    },
    pii: null,
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

// 안부 1단계에서 `상대에게 보이는 내용 확인하기`가 열리는 **단 하나의** 조건.
// 렌더와 입력 핸들러가 서로 다른 판정을 보면, 선택지를 먼저 고르고 문장을 나중에 쓴
// 참여자는 다 쓰고도 회색 버튼 앞에 남는다. 랜딩이 `04 다음 사람에게`로 약속한
// 마지막 단계가 거기서 끊긴다.
function connectionCanPreview() {
  const connection = getConnection();
  const hasMessage = Boolean(String(connection.message_text || connection.introduction || "").trim());
  return hasMessage && Boolean(connection.message_audience) && Boolean(connection.sender_visibility) && ["YES", "NO"].includes(connection.translation_allowed);
}

function renderGlobalGreetingsConnection(connection) {
  const copy = greetingUiCopy(state.language);
  const local = task7();
  const messageValue = connection.message_text || connection.introduction || "";
  const visibilityOptions = greetingVisibilityCopy(state.language);
  const currentStage = connection.stage || "receive";
  const hasMessage = Boolean(String(messageValue).trim());
  const steps = [["message", copy.steps[1]], ["preview", copy.steps[2]]];
  const stepNav = `<ol class="greeting-stage-nav" aria-label="${esc(copy.stageLabel)}">${steps.map(([id, label], index) => `<li class="${id === currentStage ? "current" : (steps.findIndex(([key]) => key === currentStage) > index ? "complete" : "")}"><span>${index + 1}</span>${esc(label)}</li>`).join("")}</ol>`;
  const receiveSection = `<section class="connection-section receipt-first-choice" role="status"><h2>${esc(local.receiveProfileTitle)}</h2><p>${esc(local.receiveProfileHelp)}</p></section>`;
  const waitingSection = `<section class="connection-section greeting-waiting" role="status"><h2>${esc(local.waitingTitle)}</h2><p>${esc(local.waitingHelp)}</p><button class="primary-button" type="button" data-action="first-greeting">${esc(local.firstGreeting)} <span aria-hidden="true">→</span></button></section>`;
  const messageSection = `<section class="connection-section message-first"><h2>${esc(local.nextSentenceTitle)}</h2><p class="greeting-writing-help">${esc(local.nextSentenceHelp)}</p><textarea class="text-input" data-connection-input="message_text" maxlength="600" placeholder="${esc(copy.messagePlaceholder)}">${esc(messageValue)}</textarea><aside class="greeting-writing-example" aria-label="${esc(local.messageExampleLabel)}"><span>${esc(local.messageExampleLabel)}</span><p>${esc(local.messageExample)}</p></aside><h3>${esc(local.senderVisibilityTitle)}</h3>${renderConnectionChoices("sender_visibility", [["NAMED", visibilityOptions[0]], ["CONTEXTUAL", visibilityOptions[1]], ["ANONYMOUS", visibilityOptions[2]]])}<h3>${esc(local.translationTitle)}</h3>${renderConnectionChoices("translation_allowed", [["YES", copy.translatedYes], ["NO", copy.translatedNo]])}</section>`;
  const profile = buildConnectionProfile(state.submitted || createResponse(), connection);
  const contextLabel = connection.sender_visibility === "ANONYMOUS" ? visibilityOptions[2] : connection.sender_visibility === "NAMED" ? safeReferrerLabel(state.submitted?.response_document?.participant?.display_name || copy.publicRecord) : (profile.participant_context?.kind === "EVERYDAY" ? copy.publicEveryday : profile.role ? copy.publicRole : copy.publicRecord);
  const previewSection = `<section class="connection-section greeting-preview"><span class="archive-label">${esc(local.previewTitle)}</span><h2>${esc(copy.previewTitle)}</h2><div class="greeting-preview-letter"><span>${esc(copy.original)} · ${esc(state.submitted?.source_language || state.language)}</span><p>${esc(messageValue || copy.noMessage)}</p></div><div class="greeting-preview-disclosure"><dl class="greeting-preview-summary"><div><dt>${esc(copy.publicContext)}</dt><dd>${esc(contextLabel)}</dd></div><div><dt>${esc(copy.language)}</dt><dd>${esc(state.submitted?.source_language || state.language)}</dd></div><div><dt>${esc(copy.translation)}</dt><dd>${esc(connection.translation_allowed === "YES" ? copy.translationAllowed : copy.originalOnly)}</dd></div></dl><p class="greeting-privacy-note">${esc(copy.previewPrivacy)}</p></div>${hasMessage ? `<label class="final-check greeting-preview-confirmation"><input type="checkbox" data-connection-preview-confirmed ${connection.preview_confirmed ? "checked" : ""} /><span>${esc(local.previewConfirm)}</span></label>` : ""}</section>`;
  const stageContent = currentStage === "receive" ? receiveSection : currentStage === "waiting" ? waitingSection : currentStage === "message" ? messageSection : previewSection;
  const writingFlow = ["message", "preview"].includes(currentStage);
  const primaryAction = ["receive", "waiting", "message"].includes(currentStage) ? "" : `<button class="primary-button" type="button" data-action="save-connection" ${connectionCanSave() ? "" : "disabled"}>${esc(copy.save)} <span aria-hidden="true">→</span></button>`;
  // 안부 쓰기는 `1 한 문장 / 2 상대에게 보이는 내용` 두 단계다. 1단계에는 앞 단계가 없다.
  // 그런데 1단계에도 `이전 단계`(`data-connection-stage="waiting"`)가 있어서, 누르면
  // 안부를 **받는** 화면(`아직 당신에게 이어질 안부가 없어요.`)으로 떨어지고 단계 표시도
  // 사라졌다. 안부를 **쓰던** 사람에게는 전혀 다른 화면이다. 1단계에서는 감추고, 이미
  // 있는 `참여 기록으로 돌아가기`(`copy.back`)만 남긴다.
  const stageActions = currentStage === "message"
    ? `<div class="greeting-stage-actions"><button class="primary-button" type="button" data-connection-stage="preview" ${!connectionCanPreview() ? "disabled" : ""}>${esc(local.previewAction)} <span aria-hidden="true">→</span></button></div>`
    : currentStage === "preview"
      ? `<div class="greeting-stage-actions"><button class="secondary-button" type="button" data-connection-stage="message">${esc(copy.previous)}</button></div>`
      : "";
  return `<main class="connection-layout rc2-connection-layout greeting-connection">
    <section class="connection-main">
      <div class="greeting-intro"><div><div class="archive-label">${esc(local.greetingProjectLabel)}</div><h1 tabindex="-1">${esc(local.greetingFeatureName)}</h1><p class="greeting-privacy-note">${esc(copy.privacy)}</p></div></div>
      ${writingFlow ? stepNav : ""}${stageContent}
      ${stageActions}
      <div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">${esc(copy.back)}</button>${primaryAction}</div>
    </section>
  </main>`;
}

function renderRc2Connection(connection, response) {
  return renderGlobalGreetingsConnection(connection, response);
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
  return responseDocumentFrame(state.language).axis[value] || greetingFirst().coordinateMixed;
}

function renderCompletionCoordinate(response) {
  const local = greetingFirst();
  const axes = ["M", "S", "D"].map((axis, index) => ({
    label: local.coordinateAxes[index],
    value: rc2AxisValue(response, axis),
  }));
  return `<section class="completion-coordinate" aria-labelledby="completion-coordinate-title"><div class="archive-label">${esc(local.coordinateLabel)}</div><h2 id="completion-coordinate-title">${esc(local.coordinateTitle)}</h2><p class="completion-coordinate-help">${esc(local.coordinateHelp)}</p><div class="completion-coordinate-axes">${axes.map((axis, index) => `<div><span>${String(index + 1).padStart(2, "0")} · ${esc(axis.label)}</span><strong>${esc(axis.value)}</strong><i aria-hidden="true"></i></div>`).join("")}</div><p class="completion-coordinate-disclaimer">${esc(local.coordinateDisclaimer)}</p></section>`;
}

function renderRc2Complete(response) {
  const copy = completionCopy(state.language);
  const local = stage();
  const task7Local = task7();
  const status = state.submissionStatus || "local_only";
  const statusCopy = copy.status[status] || copy.status.local_only;
  const retryButton = ["failed", "unverified"].includes(status) ? `<button class="secondary-button" type="button" data-action="resend">${esc(copy.retry)}</button>` : "";
  // Older confirmed records store the document in the language used at the
  // time of confirmation. Rebuild only the visible frame when the reader has
  // since selected another interface language; original and approved text
  // remain in the response payload and are not rewritten.
  const document = response.response_document?.display_language === state.language
    ? response.response_document
    : buildResponseDocument({
    responseId: response.response_id,
    answers: response.answers,
    sourceLanguage: response.interaction_language || response.source_language,
    displayLanguage: state.language,
    releaseVersion: response.release_version,
    approvedOriginal: response.reflection?.participant_approved_text || "",
    approvedKorean: response.reflection?.participant_approved_text_ko || "",
    createdAt: response.submitted_at,
    confirmedAt: response.document_confirmation?.confirmed_at || response.submitted_at,
    final: true,
  });
  // 완료 화면은 연구 응답을 마친 자리다. 여기에서 공모를 다시 권하면 참여 기록이
  // 공모 신청의 앞단계처럼 읽힌다. 랜딩에서 공모 카드를 뺀 것과 같은 이유로 완료
  // 화면에서도 뺀다. 공모 자체는 그대로다 — `over39-open-call.html` 라우트,
  // `over39-open-call` Edge 함수, `OVER39_OPEN_CALL_SUBMISSIONS_ENABLED` 게이트,
  // `openCallUrl()` 과 공모 링크 클릭 처리는 모두 그대로 살아 있다.
  const audienceLead = isAudienceContext()
    ? copy.audienceLead
    : copy.otherLead;
  const connection = getConnection();
  const greetingFirstLocal = greetingFirst();
  const greetingChoiceSaved = ["confirmed", "local_only", "unverified", "failed"].includes(state.connectionStatus);
  const greetingChoice = globalGreetingsEnabled
    ? greetingChoiceSaved && Boolean(String(connection.message_text || "").trim())
      ? `<div class="greeting-choice-complete" role="status"><h2>${esc(greetingFirstLocal.outgoingSaved)}</h2><p>${esc(greetingFirstLocal.outgoingSavedHelp)}</p></div>`
      // `여기에서 마치기`를 한 번 누르면 안부 버튼이 사라져, 이 응답에서는 안부를 남길
      // 방법이 영영 없어졌다. 되돌리는 길이 `restart`(기록 전체 초기화)뿐이었고 확인
      // 대화도 없었다. 랜딩이 `04 다음 사람에게`로 약속한 마지막 단계다. 마친 뒤에도
      // 이미 있는 `다음 사람에게 안부 남기기`로 돌아갈 수 있게 남겨 둔다.
      : connection.stage === "done" || state.connectionStatus === "finished"
        ? `<div class="greeting-choice-complete" role="status"><h2>${esc(greetingFirstLocal.continuationSecondary)}</h2><p>${esc(greetingFirstLocal.continuationHelp)}</p><div class="greeting-opt-in-actions"><button class="secondary-button" type="button" data-action="first-greeting">${esc(greetingFirstLocal.continuationPrimary)} <span aria-hidden="true">→</span></button></div></div>`
        : `<h2>${esc(greetingFirstLocal.coordinateTransitionTitle)}</h2><p>${esc(greetingFirstLocal.coordinateTransitionHelp)}</p><div class="greeting-opt-in-actions"><button class="primary-button" type="button" data-action="first-greeting">${esc(greetingFirstLocal.continuationPrimary)} <span aria-hidden="true">→</span></button><button class="secondary-button" type="button" data-action="finish-greeting">${esc(greetingFirstLocal.continuationSecondary)}</button></div>`
    : `<h2>${esc(task7Local.greetingOptInTitle)}</h2><p class="feature-closed-status" role="status">${esc(task7Local.gateOff)}</p>`;
  const reference = response.participant_reference?.code || ensureParticipantReference(response.response_id)?.code || "";
  const referenceSection = reference ? `<section class="participant-reference-card"><span>${esc(local.referenceLabel)}</span><strong>${esc(reference)}</strong><p>${esc(local.referenceHelp)}</p></section>` : "";
  return `<main class="rc2-complete response-document-complete"><section class="rc2-complete-main"><div class="archive-label">${esc(copy.brand)}</div><div class="completion-boundary"><h1 tabindex="-1">${esc(task7Local.completionTitle)}</h1><p class="rc2-complete-lead">${esc(greetingFirstLocal.completionLead)}</p><p class="submit-status" role="status">${esc(statusCopy)}</p></div>${referenceSection}<div class="response-document-preview response-document-final">${renderResponseDocument(document)}</div><div class="export-actions"><button class="secondary-button" type="button" data-action="print-document">${esc(copy.print)}</button>${retryButton}</div>${renderCompletionCoordinate(response)}<section class="rc2-greeting-hub"><div class="greeting-hub-copy"><div class="archive-label">${esc(task7Local.greetingProjectLabel)}</div>${greetingChoice}</div></section><section class="completion-secondary"><span class="archive-label">${esc(task7Local.secondaryTitle)}</span><div class="completion-secondary-grid"><div class="completion-referral"><h2>${esc(copy.referral)}</h2><button class="secondary-button" type="button" data-action="referral">${esc(copy.referral)} <span aria-hidden="true">→</span></button></div></div></section><div class="export-actions restart-action"><button class="secondary-button" type="button" data-action="restart">${esc(copy.restart)}</button></div></section></main>`;
}

function getReferral() {
  const responseId = state.responseId || state.submitted?.response_id || "draft";
  try {
    const saved = JSON.parse(localStorage.getItem(referralKey(responseId)) || "null");
    if (saved) return {
      addresses: saved.addresses || saved.email || "",
      message: saved.message || saved.reason || "",
      show_referrer: saved.show_referrer || "NO",
      consent: saved.consent || "NO",
      batch_id: saved.batch_id || crypto.randomUUID(),
      parsed: saved.parsed || null,
      sent_at: saved.sent_at || null,
    };
    return { addresses: "", message: "", show_referrer: "NO", consent: "NO", batch_id: crypto.randomUUID(), parsed: null, sent_at: null };
  } catch {
    return { addresses: "", message: "", show_referrer: "NO", consent: "NO", batch_id: crypto.randomUUID(), parsed: null, sent_at: null };
  }
}

function saveReferralDraft(referral) {
  const responseId = state.responseId || state.submitted?.response_id || "draft";
  storageWrite(referralKey(responseId), JSON.stringify(referral));
}

function referralCanSave(referral = getReferral()) {
  return !referral.sent_at && Array.isArray(referral.parsed?.valid) && referral.parsed.valid.length > 0 && referral.consent === "YES";
}

function renderReferral() {
  const referral = getReferral();
  const local = stage();
  const uiExtra = stage1UiExtraCopy(state.language);
  const referrer = safeReferrerLabel(state.submitted?.response_document?.participant?.display_name || "참여자");
  const status = state.referralStatus || (referral.sent_at ? "confirmed" : null);
  const statusCopy = status === "confirmed"
    ? uiExtra.referralStored
    : status === "queued" || status === "local_only"
      ? uiExtra.referralQueued
      : status === "sending" ? uiExtra.referralSaving : "";
  const completed = ["confirmed", "queued", "local_only"].includes(status);
  const parsed = referral.parsed;
  const parsedPreview = parsed ? `<section class="referral-parse-preview" aria-live="polite"><dl><div><dt>${esc(local.parsedAddresses)}</dt><dd>${parsed.valid.length}</dd></div><div><dt>${esc(local.duplicatesRemoved)}</dt><dd>${parsed.duplicates.length}</dd></div><div><dt>${esc(local.invalidAddresses)}</dt><dd>${parsed.invalid.length}</dd></div></dl>${parsed.valid.length ? `<ul>${parsed.valid.map((email) => `<li>${esc(email)}</li>`).join("")}</ul>` : ""}${parsed.invalid.length ? `<p class="field-error">${esc(parsed.invalid.join(", "))}</p>` : ""}</section>` : "";
  const actionLabel = completed ? uiExtra.referralDone : status === "sending" ? "…" : local.sendInvitation.replace("{count}", String(parsed?.valid?.length || 0));
  const referrerCopy = uiExtra.showReferrer.replace("{name}", referrer);
  return `<main class="referral-layout"><section class="referral-main"><div class="archive-label">${esc(local.referralTitle)}</div><h1 tabindex="-1">${esc(local.referralTitle)}</h1><p class="connection-lead">${esc(local.referralHelp)}</p><div class="referral-fields"><label><span>${esc(uiExtra.emailAddress)} <b>${esc(uiExtra.required)}</b></span><textarea data-referral-input="addresses" maxlength="8000" placeholder="aaa@example.com\nbbb@example.com, ccc@example.com\nName &lt;ddd@example.com&gt;" ${completed ? "disabled" : ""}>${esc(referral.addresses)}</textarea></label><button class="secondary-button referral-parse-button" type="button" data-action="parse-referral" ${completed ? "disabled" : ""}>${esc(local.parseAddresses)}</button><label><span>${esc(uiExtra.optionalMessage)} <small>${esc(local.optional)}</small></span><textarea data-referral-input="message" maxlength="500" placeholder="${esc(uiExtra.messagePlaceholder)}" ${completed ? "disabled" : ""}>${esc(referral.message)}</textarea></label></div>${parsedPreview}<div class="referral-options"><label class="final-check"><input type="checkbox" data-referral-check="show_referrer" ${referral.show_referrer === "YES" ? "checked" : ""} ${completed ? "disabled" : ""} /><span>${esc(referrerCopy)}</span></label><label class="final-check"><input type="checkbox" data-referral-check="consent" ${referral.consent === "YES" ? "checked" : ""} ${completed ? "disabled" : ""} /><span>${esc(uiExtra.referralConsent)}</span></label></div>${statusCopy ? `<p class="referral-status" role="status">${esc(statusCopy)}</p>` : ""}<div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">${esc(uiExtra.backToRecord)}</button><button class="primary-button" type="button" data-action="save-referral" ${referralCanSave(referral) && status !== "sending" ? "" : "disabled"}>${esc(actionLabel)} <span aria-hidden="true">→</span></button></div></section></main>`;
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
  const contextInternalStep = id === "PARTICIPANT_CONTEXT" ? Math.max(0, Math.min(2, Number(state.contextStep || 0))) : null;
  const nextLabel = isRc2 && id === "CONSENT"
    ? greetingFirst().consentContinue
    : id === "USE_SCOPE"
    ? task7().useScopeSave
    : id === "SUBMIT"
      ? "활용 범위 정하기"
    : id === "FIXED_CHECKPOINT"
      ? "이어지는 질문 시작하기"
      : adaptiveScreen
        ? state.adaptiveGenerating ? "답변을 읽고 있어요" : "이 답변에서 이어가기"
        : state.depthGenerating ? "질문을 준비하고 있습니다" : id === "DEPTH_D" && state.summaryGenerating ? "정리하고 있습니다" : state.summaryGenerating ? "기록을 정리하고 있습니다" : state.translationGenerating ? "번역을 준비하고 있습니다" : "다음";
  const nextDisabled = (contextInternalStep === null ? !canContinue(id) : !canContinueContextStep(contextInternalStep)) || state.fixedCheckpointSaving || state.depthGenerating || state.adaptiveGenerating || state.summaryGenerating || state.translationGenerating;
  const backAction = contextInternalStep !== null && contextInternalStep > 0 ? "context-back" : "back";
  const nextAction = contextInternalStep !== null && contextInternalStep < 2 ? "context-next" : "next";
  return `<main class="interview-layout"><section class="interview-panel" aria-live="polite" aria-labelledby="question-title"><div class="progress-track" role="progressbar" aria-label="Survey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${meta.progress}"><span style="width:${meta.progress}%"></span></div><div class="interview-meta"><span>${esc(t(meta.label))}</span>${meta.count ? `<strong>${esc(t(meta.count))}</strong>` : ""}</div>${screenBody(id)}</div><div class="survey-actions"><button class="secondary-button" type="button" data-action="${backAction}" ${state.step === 0 || state.fixedCheckpointSaving || state.depthGenerating || state.adaptiveGenerating || state.summaryGenerating || state.translationGenerating ? "disabled" : ""}><span aria-hidden="true">←</span> ${esc(t("이전"))}</button>${typeof state.reviewReturnStep === "number" ? `<button class="text-button" type="button" data-action="return-to-review">${esc(greetingUiCopy(state.language).back)}</button>` : "<span></span>"}<button class="primary-button" type="button" data-action="${nextAction}" ${nextDisabled ? "disabled" : ""}>${esc(t(nextLabel))} <span aria-hidden="true">→</span></button></div></section></main>`;
}

function researchJourney() {
  const landing = ui().landing || {};
  return `<section class="research-journey research-axes" aria-label="${esc(t("설문 구조"))}">
    <div class="journey-heading"><span>THREE DIRECTIONS · YOUR RECORD</span><strong>${esc(t("기억에서 현재로, 현재에서 이어가기 위한 조건으로 이동합니다."))}</strong></div>
    <div class="journey-steps journey-steps-three">
      <div><span>01</span><strong>${esc(t("기억"))}</strong><p>${esc(t("사람, 작품, 공간, 장면과 오래 남은 이유"))}</p></div>
      <div><span>02</span><strong>${esc(t("현재"))}</strong><p>${esc(t("지금 이어지는 활동, 관람, 역할과 변화"))}</p></div>
      <div><span>03</span><strong>${esc(landing.condition || t("조건"))}</strong><p>${esc(t("시간, 공간, 관계, 매개와 제도"))}</p></div>
    </div>
    <div class="journey-result"><strong>${esc(t("마지막 기록"))}</strong><div class="journey-result-copy"><p>${esc(t("답변을 한 편의 참여 기록으로 모아 직접 읽고 다듬습니다. 마지막에는 기억의 의미, 현재의 흐름, 이어가기 위한 조건을 직접 확인하고 이번 기록과 가까운 위치를 함께 살펴봅니다."))}</p>${isRc2 ? "" : `<p class="journey-coordinate-explainer">${esc(t("세 방향의 네 상태가 만나 64개의 현재 위치를 만듭니다. 이는 사람의 고정된 유형이 아니라, 시간과 상황에 따라 달라질 수 있는 이번 기록의 위치입니다. 이후에는 기록 사이의 관계를 읽고 안부가 닿은 이유를 설명하는 데 사용합니다."))}</p>`}</div></div>
  </section>`;
}

function renderIntro() {
  const draft = loadDraft();
  const pending = loadPending();
  if (isRc2) {
    const local = greetingFirst();
    const journey = local.journey.map(([title, help], index) => `<li class="${index === 0 || index === local.journey.length - 1 ? "greeting-stage" : ""}"><div class="stage-marker"><span class="stage-number">${String(index + 1).padStart(2, "0")}</span><span class="stage-node" aria-hidden="true"></span></div><strong>${esc(title)}</strong><p>${esc(help)}</p></li>`).join("");
    const startAction = draft ? "resume" : "start";
    const startLabel = draft ? local.continueDraft : local.start;
    return `<main class="rc2-intro">
      <section class="rc2-intro-main">
        <div class="intro-hero">
          <div class="archive-label">${esc(local.introEyebrow)}</div>
          <h1 tabindex="-1"><span class="intro-title-lead">${esc(local.introTitleLead)}</span><span class="intro-title-main">${esc(local.introTitleMain)}</span></h1>
          <div class="intro-copy">
            <p>${esc(local.introLead)}</p>
            <p>${esc(local.introGreeting)}</p>
            <p>${esc(local.introAudience)}</p>
            <p>${esc(local.introRecord)}</p>
          </div>
          <section class="greeting-first-journey" aria-label="${esc(local.journeyLabel)}">
            <div class="greeting-first-journey-heading"><span>${esc(local.journeyTitle)}</span></div>
            <div class="greeting-first-journey-map"><div class="greeting-first-journey-track" aria-hidden="true"><span></span></div><ol>${journey}</ol></div>
          </section>
          <div class="intro-disclosure" role="note">
            <p><strong>AI</strong><span>${esc(local.introAi)}</span></p>
          </div>
          <div class="intro-ready-note"><strong>${esc(local.duration)}</strong></div>
        </div>
        <section class="entry-route-grid entry-route-grid-research" aria-label="${esc(t("참여 경로"))}">
          <article class="entry-route-card entry-route-research interactive-tilt">
            <div class="route-copy"><span>RESEARCH</span>
            <h2>${esc(local.researchTitle)}</h2>
            <p>${esc(local.researchDescription)}</p>
            <div class="entry-route-meta">${esc(local.researchMeta)}</div>
            <div class="entry-route-actions"><button class="primary-button" type="button" data-action="${startAction}">${esc(startLabel)} <span aria-hidden="true">→</span></button></div></div>
          </article>
        </section>
        ${creditBlock("intro")}
      </section>
    </main>`;
  }
  const institutionLine = institutionCode ? `<div class="institution-invite"><span>INVITED REVIEW</span><strong>${esc(institutionCode)}</strong><p>이 링크의 응답은 기관 사전검증 자료로 분리 저장됩니다.</p></div>` : "";
  return `<main class="intro-grid"><section class="intro-main"><div class="archive-label">PUBLIC MEMORY RESEARCH · 2026 / OVER 39</div><h1 tabindex="-1">누가 이 작가를 기억하는가.</h1><div class="project-lockup"><p class="project-title">〈만 39세 이상〉</p><span>대구 시각예술 기억 수집과 창작 지속 조건 인식조사</span></div><p class="intro-copy">남아 있는 이름과 장면을 기록하고, 지금의 조건을 함께 살핍니다.</p>${institutionLine}${researchJourney()}<div class="intro-actions"><button class="primary-button" type="button" data-action="notice">리서치 흐름 보기 <span aria-hidden="true">→</span></button>${draft ? `<button class="secondary-button" type="button" data-action="resume">작성 이어가기</button>` : ""}${pending ? `<button class="secondary-button" type="button" data-action="recover-pending">이전 제출 상태 확인</button>` : ""}<span>ONE QUESTION AT A TIME · INSTITUTION RC1</span></div></section><aside class="intro-side"><div class="side-label"><span>ARCHIVE NOTE</span><strong>01</strong></div><p>남아 있는 장면 하나와 지금의 경험에서 이야기를 시작해 주세요.</p><div class="certificate-mini"><div><span>duration</span><strong>약 8-12분</strong></div><div><span>questions</span><strong>고정 연구질문 + 연결 질문</strong></div><div><span>connection</span><strong>제출 뒤 선택 참여</strong></div><div><span>version</span><strong>RC1</strong></div></div>${creditBlock()}</aside></main>`;
}

function renderNotice() {
  const deliveryNotice = submitFunctionUrl
    ? "원문과 참여자가 확인한 설명을 연구 기록으로 보존해요."
    : "응답은 현재 이 기기에 보관해요.";
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
      const shadowX = length > 0.04 ? (dx / length) * 4 : 1.8;
      const shadowY = length > 0.04 ? (dy / length) * 4 : 1.8;
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
  // The visible question lives below the preceding-answer card. Keep the
  // trace bound to the question itself, not the generic section heading.
  const domText = document.querySelector(".adaptive-question h3")?.textContent || document.querySelector("#question-title")?.textContent || "";
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

function renderSavePending() {
  const local = stage1UiExtraCopy(state.language);
  return `<main class="saving-layout"><section class="saving-card" aria-live="polite"><h1>${esc(local.savingTitle)}</h1><p>${esc(local.savingLead)}</p>${processingSignal(local.savingTitle)}</section></main>`;
}

function renderSaveFailed() {
  const local = stage1UiExtraCopy(state.language);
  return `<main class="saving-layout"><section class="saving-card save-failed" role="alert"><h1>${esc(local.saveFailedTitle)}</h1><p>${esc(state.storageBlocked && local.saveFailedNoStorage ? local.saveFailedNoStorage : local.saveFailedLead)}</p><div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-survey">${esc(local.backToResponses)}</button><button class="primary-button" type="button" data-action="resend">${esc(local.retrySave)} <span aria-hidden="true">→</span></button></div></section></main>`;
}

function renderFirstGreeting() {
  const local = greetingFirst();
  const simplified = greetingSimple();
  const greeting = state.firstGreeting || { status: "loading" };
  if (greeting.status === "loading") {
    // 이 화면에는 조작이 하나도 없었다. 안부를 불러오는 동안 릴레이가 멈추면 참여자는
    // 설문 맨 앞에서 앞으로도 뒤로도 못 간다 — 이야기를 한 줄도 쓰기 전에. 기다림이
    // 끝나기를 기다리게 두지 않고, 기다림이 끝난 뒤 화면(waiting/unavailable)에 이미
    // 있는 그 버튼을 여기에도 상시 노출한다. 새 문구를 만들지 않는다.
    return `<main class="first-greeting-layout"><section class="first-greeting-card first-greeting-loading" aria-live="polite"><div class="archive-label">${esc(task7().greetingProjectLabel)}</div><h1 tabindex="-1">${esc(local.greetingLoading)}</h1><p>${esc(local.greetingLoadingHelp)}</p>${processingSignal(local.greetingLoading)}<div class="first-greeting-continue"><button class="secondary-button" type="button" data-action="begin-story">${esc(local.continueWithoutGreeting)} <span aria-hidden="true">→</span></button></div></section></main>`;
  }
  if (greeting.status === "received") {
    const isSeed = greeting.origin === "core_seed";
    return `<main class="first-greeting-layout"><section class="first-greeting-card first-greeting-received greeting-arrival"><div class="archive-label">${esc(task7().greetingProjectLabel)}</div><h1 tabindex="-1">${esc(local.receivedTitle)}</h1><p class="first-greeting-help">${esc(isSeed ? local.seedHelp : local.receivedHelp)}</p><div class="first-greeting-reading"><blockquote lang="${esc(greeting.original_language || "ko")}">${esc(greeting.original_text)}</blockquote></div>${isSeed ? `<aside class="first-greeting-origin"><strong>${esc(local.seedNote)}</strong></aside>` : ""}<div class="first-greeting-continue"><button class="primary-button" type="button" data-action="begin-story">${esc(local.beginStory)} <span aria-hidden="true">→</span></button></div></section></main>`;
  }
  const unavailable = greeting.status === "unavailable";
  return `<main class="first-greeting-layout first-greeting-empty-layout"><section class="first-greeting-card first-greeting-empty"><div class="first-greeting-empty-status"><div class="archive-label">${esc(task7().greetingProjectLabel)}</div><h1 tabindex="-1">${esc(unavailable ? local.unavailableTitle : local.waitingTitle)}</h1><p>${esc(unavailable ? local.unavailableHelp : local.waitingHelp)}</p><button class="primary-button" type="button" data-action="begin-story">${esc(local.continueWithoutGreeting)} <span aria-hidden="true">→</span></button></div><aside class="first-greeting-example" aria-label="${esc(simplified.exampleLabel)}"><span>${esc(simplified.exampleLabel)}</span><blockquote lang="${esc(state.language)}">${esc(simplified.exampleText)}</blockquote></aside></section></main>`;
}

function renderGreetingChoice() {
  const local = greetingFirst();
  return `<main class="first-greeting-layout greeting-choice-layout"><section class="first-greeting-card greeting-choice-card"><div class="archive-label">${esc(task7().greetingProjectLabel)}</div><h1 tabindex="-1">${esc(local.greetingChoiceTitle)}</h1><p>${esc(local.greetingChoiceHelp)}</p><div class="greeting-choice-actions"><button class="primary-button" type="button" data-action="choose-first-greeting">${esc(local.greetingChoicePrimary)} <span aria-hidden="true">→</span></button><button class="secondary-button" type="button" data-action="skip-first-greeting">${esc(local.greetingChoiceSecondary)}</button></div></section></main>`;
}

function render(focusHeading = false) {
  const scrollPosition = { x: window.scrollX, y: window.scrollY };
  document.documentElement.lang = state.language;
  const content = state.phase === "loading" ? "<main class='interview-layout'>불러오는 중입니다.</main>" : state.phase === "intro" ? renderIntro() : state.phase === "notice" ? renderNotice() : state.phase === "greeting-choice" ? renderGreetingChoice() : state.phase === "greeting-first" ? renderFirstGreeting() : state.phase === "saving" ? renderSavePending() : state.phase === "save_failed" ? renderSaveFailed() : state.phase === "complete" ? renderComplete() : state.phase === "exhibition" ? (isRc2 ? renderComplete(state.submitted || createResponse()) : renderRetiredRc1ExhibitionApplication()) : state.phase === "connection" ? renderConnection() : state.phase === "referral" ? renderReferral() : state.phase === "feedback" ? renderInstitutionFeedback() : renderSurvey();
  root.innerHTML = `<div class="site-shell phase-${esc(state.phase)}">${header()}${content}${footer()}</div>`;
  const legacyAgeGate = root.querySelector('[data-exhibition-field="eligibility_ack"]')?.closest(".connection-section");
  if (legacyAgeGate) legacyAgeGate.innerHTML = `<h2>${esc(t("프로젝트가 다루는 시간"))}</h2><p>${esc(t("〈만 39세 이상〉은 문화예술 활동이 쌓여 온 시간과 지속의 조건에서 출발한 이름입니다. 공모에서는 숫자로 참가자를 나누지 않고 각 작업이 지나온 시간과 지금의 질문을 함께 읽습니다."))}</p>`;
  localizeRenderedCopy(root);
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
    "CTX_FIELD", "CTX_MODE", "CTX_FORM", "CTX_UNIT",
    "P14", "P15", "P16", "P17", "P18", "P11", "P12", "P13", "P13_TEXT", "P19", "P19_TEXT",
    "M01", "NO_RECALL_RELATION", "M02", "M03", "M04", "M04_TEXT", "M05", "M06", "M06_YEAR", "M07", "M08", "M09", "M10",
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
    }
    if (id === "P01_CONTEXT" && value !== "PROFESSIONAL") state.answers = sanitizeAnswersForRoute(state.answers);
    if (id === "ID01") {
      if (value === "ANONYMOUS") delete state.answers.display_name;
      clearDocumentConfirmation();
    }
    if (["P14", "P15"].includes(id) && !needsPauseContext(state.answers)) ["pause_context_tags", "pause_context_other", "pause_meaning", "pause_context_text"].forEach((key) => delete state.answers[key]);
    if (id === "P02G") { delete state.answers.role_primary; delete state.answers.role_primary_other; delete state.answers.roles_parallel; delete state.answers.roles_parallel_other; }
    if (id === "M01" && value === "NO_RECALL") ["memory_clue_text", "memory_branch_followup", "memory_meaning_text", "m_declared", "m_support_tags", "memory_time_band", "memory_year_optional", "memory_locations", "memory_experience_modes", "memory_experience_modes_other", "memory_relationship", "witness_role"].forEach((key) => delete state.answers[key]);
    if (id === "M01" && value !== "NO_RECALL") {
      delete state.answers.no_recall_relation_text;
      clearAdaptiveAnchor("NO_RECALL_RELATION");
    }
    if (id === "P11" && ["SKIP", "UNSURE"].includes(value)) delete state.answers.transition_text;
    if (id === "P13" && !["YES", "MIXED"].includes(value)) delete state.answers.invisible_continuity_text;
    if (id === "D02" && !/^D[1-4]$/.test(String(value))) delete state.answers.desired_change_text;
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
    if (id === "P16" && selected.some((item) => ["NONE", "UNSURE"].includes(item))) delete state.answers.pause_context_other;
    if (!["depth_m", "depth_s", "depth_d"].includes(id) && !String(id).startsWith("adaptive_check_")) reconcileIfResearchEdit(id);
  }
  if (isRc2 && ["depth_m", "depth_s"].includes(id)) clearDepthAfter(id === "depth_m" ? "M" : "S");
  saveDraft();
}

function changeConnectionChoice(field, value, multi, max) {
  const connection = getConnection();
  if (!multi) {
    connection[field] = value;
    if (field === "opt_in" && value === "YES") {
      connection.receive_opt_in = "YES";
      connection.stage = "receive";
      if (!values(connection.receive_scopes).length) connection.receive_scopes = ["RESONANCE"];
      if (!values(connection.reply_modes).length) connection.reply_modes = ["MEDIATED_WEB"];
    }
    if (field === "receive_opt_in" && value === "YES" && !values(connection.receive_scopes).length) connection.receive_scopes = ["RESONANCE"];
    if (field === "receive_opt_in" && value !== "YES") {
      connection.receive_scopes = [];
      connection.reply_modes = [];
      connection.contact_email = "";
      connection.contact_permission = "";
    }
    if (field === "opt_in" && value !== "YES") Object.assign(connection, defaultConnection(), { opt_in: "NO", receive_opt_in: "NO", stage: "receive" });
    if (["message_audience", "sender_visibility", "translation_allowed"].includes(field)) connection.preview_confirmed = false;
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

function saveCurrentConnection() {
  if (!connectionCanSave() || state.connectionStatus === "sending") return;
  const connection = getConnection();
  const connectionStage = connection.stage || "receive";
  const update = createConnectionUpdate();
  const participantAccess = state.submitted?.participant_access || ensureParticipantReference(update.response_id);
  // `participant_access` is transport-only for the reservation endpoint.
  // It must not travel in a relationship snapshot or outbox payload.
  delete update.participant_access;
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
    if (result.status === "confirmed" && connectionStage === "receive" && connection.opt_in === "YES") {
      requestGreetingReservation({ response_id: update.response_id, participant_access: participantAccess }).then((reservation) => {
        state.greetingReservation = reservation;
        if (reservation.status === "reserved" && reservation.receipt?.relay_url) {
          window.location.assign(reservation.receipt.relay_url);
          return;
        }
        connection.stage = "waiting";
        saveConnection();
        state.phase = "connection";
        render(true);
      });
      return;
    }
    state.phase = "complete";
    render(true);
  });
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
  if (target.dataset.greetingOptInAction) {
    changeConnectionChoice("opt_in", target.dataset.greetingOptInAction, false, 0);
    saveCurrentConnection();
    return;
  }
  if (target.dataset.connectionField) {
    changeConnectionChoice(target.dataset.connectionField, target.dataset.connectionValue, target.dataset.connectionMulti === "true", Number(target.dataset.connectionMax || 0));
    render(false);
    return;
  }
  if (target.dataset.connectionStage) {
    const connection = getConnection();
    connection.stage = target.dataset.connectionStage;
    if (connection.stage !== "preview") connection.preview_confirmed = false;
    saveConnection();
    render(true);
    return;
  }
  if (target.dataset.exhibitionField) {
    changeExhibitionChoice(target.dataset.exhibitionField, target.dataset.exhibitionValue);
    render(false);
    return;
  }
  if (target.dataset.lang) { state.language = target.dataset.lang; storageWrite(interfaceLanguageKey, state.language); target.closest("details")?.removeAttribute("open"); saveDraft(); render(false); return; }
  if (target.dataset.axisField) {
    state.answers[target.dataset.axisField] = target.dataset.axisValue;
    delete state.answers.coordinate_snapshots;
    saveDraft();
    render(false);
    return;
  }
  if (target.dataset.useField) {
    state.answers[target.dataset.useField] = target.dataset.useValue;
    if (target.dataset.useField === "public_archive_interest" && target.dataset.useValue !== "ASK_LATER") {
      state.researchContact = { email: "", consent: false, status: null };
    }
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
  if (target.dataset.action === "open-call") { window.open(openCallUrl(), "_blank", "noopener,noreferrer"); return; }
  if (target.dataset.action === "notice") { state.phase = "notice"; render(true); return; }
  if (target.dataset.action === "start") { state = { phase: "survey", step: 0, answers: {}, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId: `${isRc2 ? "RC2" : "RC1"}-${crypto.randomUUID()}`, language: state.language, feedback: {}, referralStatus: null, firstGreeting: null, researchContact: { email: "", consent: false, status: null } }; saveDraft(); render(true); return; }
  if (target.dataset.action === "resume") {
    const draft = loadDraft();
    if (draft) {
      const answers = restoreLegacySynthesisConfirmation(sanitizeAnswersForRoute(draft.answers || {}));
      const screens = buildActiveScreens(answers, { adaptive: isRc2 });
      const mappedStep = draft.screenId && screens.includes(draft.screenId)
        ? screens.indexOf(draft.screenId)
        : Math.min(Number(draft.step || 0), Math.max(0, screens.length - 1));
      const responseId = draft.responseId || `${isRc2 ? "RC2" : "RC1"}-${crypto.randomUUID()}`;
      const firstGreeting = draft.firstGreeting || loadFirstGreeting(responseId);
      const resumedPhase = ["greeting-choice", "greeting-first"].includes(draft.phase) ? draft.phase : "survey";
      state = { phase: resumedPhase, step: mappedStep, contextStep: Number(draft.contextStep || 0), reviewReturnStep: typeof draft.reviewReturnStep === "number" ? draft.reviewReturnStep : undefined, answers, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId, language: draft.language || state.language, feedback: draft.feedback || {}, firstGreeting, researchContact: draft.researchContact || { email: "", consent: false, status: null } };
    }
    render(true);
    if (state.phase === "greeting-first" && state.firstGreeting?.status === "loading") beginFirstGreeting();
    return;
  }
  if (target.dataset.action === "recover-pending") {
    const pending = loadPending();
    if (!pending) return;
    const pendingDraft = loadDraft();
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
      researchContact: pendingDraft?.researchContact || { email: "", consent: false, status: null },
    };
    render(true);
    verifyResearchStorage(pending.response_id).then((result) => {
      state.submissionStatus = result.status;
      if (result.status === "confirmed") clearPending();
      render(false);
    });
    return;
  }
  if (target.dataset.action === "review-answers") {
    const index = activeScreens().indexOf("M01");
    // 돌아올 자리를 남긴다. 예전에는 첫 질문으로 보내기만 해서, 20~30분을 쓰고 정리문
    // 앞에 앉은 사람이 한 단어를 확인하러 눌렀다가 화면 스무 개를 다시 지나가거나
    // 창을 닫아야 했다. 설문 화면의 이동 수단이 `이전`/`다음` 둘뿐이기 때문이다.
    state.reviewReturnStep = state.step;
    state.step = index >= 0 ? index : 0;
    saveDraft();
    render(true);
    return;
  }
  if (target.dataset.action === "return-to-review") {
    const step = state.reviewReturnStep;
    delete state.reviewReturnStep;
    if (typeof step === "number" && step >= 0 && step < activeScreens().length) state.step = step;
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
    window.open(openCallUrl(), "_blank", "noopener,noreferrer");
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
  if (target.dataset.action === "begin-story") {
    beginResearchStory(true);
    return;
  }
  if (target.dataset.action === "choose-first-greeting") {
    beginFirstGreeting();
    return;
  }
  if (target.dataset.action === "skip-first-greeting") {
    state.firstGreeting = { status: "skipped", skipped_at: new Date().toISOString() };
    saveFirstGreeting();
    beginResearchStory(false);
    return;
  }
  if (target.dataset.action === "finish-greeting") {
    const connection = getConnection();
    connection.stage = "done";
    saveConnection();
    state.connectionStatus = "finished";
    render(false);
    return;
  }
  if (target.dataset.action === "first-greeting") {
    const connection = getConnection();
    connection.opt_in = "YES";
    connection.receive_opt_in = connection.receive_opt_in === "YES" ? "YES" : "NO";
    // `여기에서 마치기`로 남은 표식을 함께 푼다. 이게 없으면 안부를 다시 쓰러 들어갔다
    // 나온 뒤에도 완료 화면이 계속 "마쳤다"고 말한다.
    if (state.connectionStatus === "finished") state.connectionStatus = null;
    connection.stage = "message";
    connection.message_audience = connection.message_audience || "OPEN";
    connection.preview_confirmed = false;
    saveConnection();
    // `connection.stage`만 바꾸고 화면을 다시 그리면 완료 화면이 그대로 다시 그려진다.
    // 완료 화면의 안부 블록은 `stage`를 보지 않기 때문이다(`done`일 때만 본다). 안부를
    // 쓰는 화면은 `phase === "connection"`에서 그려지므로 여기서 함께 옮겨야 한다.
    // 이게 없어서 랜딩이 `04 다음 사람에게`로 약속한 마지막 단계의 버튼이 죽어 있었다.
    state.phase = "connection";
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
    saveCurrentConnection();
    return;
  }
  if (target.dataset.action === "referral") { state.phase = "referral"; state.referralStatus = null; render(true); return; }
  if (target.dataset.action === "parse-referral") {
    const referral = getReferral();
    referral.parsed = parseReferralRecipients(referral.addresses);
    saveReferralDraft(referral);
    state.referralStatus = null;
    render(false);
    return;
  }
  if (target.dataset.action === "save-referral") {
    const referral = getReferral();
    if (!referralCanSave(referral) || state.referralStatus === "sending") return;
    const payload = buildReferralBatch({
      responseId: state.responseId || state.submitted?.response_id || null,
      recipients: referral.parsed.valid,
      message: referral.message,
      showReferrer: referral.show_referrer === "YES",
      referrerLabel: state.submitted?.response_document?.participant?.display_name || "참여자",
      batchId: referral.batch_id,
      requestedAt: referral.requested_at || new Date().toISOString(),
    });
    referral.requested_at = payload.requested_at;
    saveReferralDraft(referral);
    state.referralStatus = "sending";
    render(false);
    sendEnvelope(createEnvelope("referral_batch", payload, referral.batch_id), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }).then((result) => {
      state.referralStatus = result.status || "local_only";
      if (["confirmed", "queued", "local_only"].includes(result.status)) {
        referral.sent_at = new Date().toISOString();
        saveReferralDraft(referral);
      }
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
  if (target.dataset.action === "context-back") {
    state.contextStep = Math.max(0, Number(state.contextStep || 0) - 1);
    saveDraft();
    render(true);
    return;
  }
  if (target.dataset.action === "context-next") {
    const step = Math.max(0, Math.min(2, Number(state.contextStep || 0)));
    if (!canContinueContextStep(step)) return;
    state.contextStep = Math.min(2, step + 1);
    saveDraft();
    render(true);
    return;
  }
  if (target.dataset.action === "back") {
    let previous = Math.max(0, state.step - 1);
    // 앞으로 갈 때는 질문이 없는 앵커 화면을 건너뛰지만, 뒤로 갈 때는 그 화면에 그대로
    // 착지했다. 거기서는 아무것도 생성되고 있지 않은데도 "다음 질문을 준비하고 있어요"가
    // 계속 떠 있어서, 20~30분을 쓴 참여자가 기다리는 쪽을 택할 수 있다. 뒤로 가는 길에서도
    // 같은 화면을 건너뛴다 — 문구를 고치는 대신 그 화면을 만나지 않게 한다.
    if (isRc2) {
      const screens = activeScreens();
      while (previous > 0) {
        const checkpoint = adaptiveScreenCheckpoint[screens[previous]];
        if (!checkpoint || state.adaptiveGenerating || currentAdaptiveTurn(checkpoint)) break;
        previous -= 1;
      }
    }
    state.step = previous;
    saveDraft();
    render(!isRc2);
    return;
  }
  if (target.dataset.action === "retry-adaptive") {
    const checkpoint = String(target.dataset.checkpoint || "");
    if (!checkpoint || state.adaptiveGenerating) return;
    clearAdaptiveAnchor(checkpoint);
    setAdaptiveStatus(checkpoint, "pending");
    saveDraft();
    render(false);
    requestAdaptiveNext(checkpoint).then(() => render(false)).catch(() => { state.adaptiveGenerating = false; render(false); });
    return;
  }
  if (target.dataset.action === "next") {
    const screens = activeScreens();
    const id = screens[state.step];
    if (!canContinue(id) || state.submissionStatus === "sending") return;

    // 도중에 그만둔 사람의 기록을 남긴다. 적응형 경로는 맨 마지막 저장 버튼을 누르기
    // 전까지 서버로 아무것도 보내지 않아서, 25분을 쓰고 중간에 창을 닫은 사람은 아예
    // 오지 않은 사람과 구분되지 않았다. 16명 규모에서 "어느 질문에서 멈췄는가"는
    // 해석의 핵심이므로, 이야기가 어느 정도 쌓인 두 지점에서 스냅샷을 보낸다.
    //
    // **참여자를 절대 막지 않는다.** 화면 전환과 무관하게 뒤에서 보내고, 실패해도
    // 조용히 넘어간다. 상태·렌더·진행에 손대지 않는다 — 이 화면들에서 참여자가
    // 갇히는 것이 이 기능으로 얻는 것보다 훨씬 나쁘다.
    if (isRc2 && DROP_OFF_CHECKPOINTS.has(id) && !sentDropOffCheckpoints.has(id)) {
      sentDropOffCheckpoints.add(id);
      try {
        const snapshot = createResponse("fixed_complete");
        snapshot.drop_off_checkpoint = id;
        Promise.resolve(requestResearchStorage(snapshot)).catch(() => {});
      } catch (error) {
        // 스냅샷을 만들다 실패해도 참여자는 그대로 다음 화면으로 간다.
      }
    }

    if (isRc2 && id === "CONSENT") {
      state.phase = "greeting-choice";
      saveDraft();
      render(true);
      return;
    }

    if (isRc2) {
      const sourceAnchorByScreen = {
        M04: "M04_TEXT",
        TRANSITION: hasSubstantiveTransition(state.answers) ? "P12" : null,
        CONTINUITY: ["YES", "MIXED"].includes(state.answers.invisible_continuity_state) ? "P13_TEXT" : null,
        D02: hasSubstantiveDChange(state.answers) ? "D02_TEXT" : null,
      };
      const sourceAnchor = sourceAnchorByScreen[id];
      if (sourceAnchor) {
        if (recordSkippedLowInformation(sourceAnchor)) saveDraft();
        // 앵커의 종료 상태 전부를 다시 pending으로 되돌린다. `skipped_policy`와
        // `complete_motif`/`complete_fallback`이 빠져 있었고, 그래서 참여 기록을
        // 다시 보러 앞으로 돌아온 참여자는 질문이 없는 화면을 다시 만났다.
        else if (["skipped_low_information", "skipped_policy", "complete", "complete_motif", "complete_fallback"].includes(adaptiveStatus(sourceAnchor))) setAdaptiveStatus(sourceAnchor, "pending");
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
      // 2차 가드를 두지 않는다. 여기서 걸릴 수 있는 조건은 전부 `canContinue("USE_SCOPE")`
      // 안으로 옮겼고, 그 값이 그대로 버튼의 disabled 계산에 쓰인다. 두 조건이 갈라져
      // 있던 동안에는 버튼이 켜져 있어도 눌러서 아무 일이 없을 수 있었다.
      state.answers.response_document_draft = buildCurrentResponseDocument({ final: true, confirmedAt: state.answers.document_confirmed_at });
      state.submitted = createResponse();
      savePending(state.submitted);
      state.submissionStatus = "sending";
      state.phase = "saving";
      render(true);
      requestResearchStorage(state.submitted).then(async (result) => {
        state.submissionStatus = result.status;
        if (["confirmed", "local_only"].includes(result.status)) {
          if (result.status === "confirmed") {
            clearDraft();
            clearPending();
          }
          await requestResearchContactStorage(state.submitted);
          state.phase = "complete";
        } else state.phase = "save_failed";
        render(true);
      }).catch(() => {
        // catch가 없던 동안에는 이 체인이 reject되면 「참여 기록을 저장하고 있어요」
        // 화면에서 영구히 멈췄다. 그 화면에는 버튼이 하나도 없어서, 27분을 쓴 참여자가
        // 할 수 있는 일은 창을 닫는 것뿐이었다. 실패는 실패로 보여야 다시 시도할 수 있다.
        state.submissionStatus = "failed";
        state.phase = "save_failed";
        render(true);
      });
      return;
    }

    const nextId = screens[state.step + 1];
    if (isRc2 && id === "REFLECTION_REVIEW" && nextId === "SUBMIT") {
      if (!confirmParticipantSynthesis()) return;
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

  if (target.dataset.action === "download") {
    // The participant can retain their record, but the opaque access secret is
    // not part of a portable response export.
    const download = structuredClone(state.submitted || {});
    delete download.participant_access;
    const text = JSON.stringify(download, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.submitted.response_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  if (target.dataset.action === "back-to-survey") {
    state.phase = "survey";
    render(true);
    return;
  }
  if (target.dataset.action === "resend") {
    // `loadPending()`은 저장소가 막히면 **항상** null이다. 그때 여기서 그냥 돌아가 버려,
    // 저장에 실패한 참여자가 「저장 다시 확인」을 눌러도 화면조차 바뀌지 않았다 — 25분을
    // 쓰고 남은 마지막 문이 잠겨 있었다. 메모리에 들고 있는 응답으로 대신 보낸다.
    const pending = loadPending() || state.submitted;
    if (!pending || state.submissionStatus === "sending") return;
    state.submissionStatus = "sending";
    state.phase = "saving";
    render(true);
    (submitFunctionUrl ? retryOutbox({ endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }) : requestResearchStorage(pending)).then(async (result) => {
      // 아웃박스 전체 길이로 판정하면, 이 응답과 무관한 봉투 하나가 남아 있을 때
    // 참여자는 저장에 성공했는데도 완료 화면을 영영 보지 못한다. 자기 응답만 본다.
    const verifyId = state.submitted?.response_id || pending.response_id;
    const stillQueued = readOutbox().some((item) => item.payload?.response_id === verifyId);
    state.submissionStatus = Array.isArray(result) ? (stillQueued ? "unverified" : "confirmed") : result.status;
      if (["confirmed", "local_only"].includes(state.submissionStatus)) {
        if (state.submissionStatus === "confirmed") {
          clearDraft();
          clearPending();
        }
        await requestResearchContactStorage(state.submitted || pending);
        state.phase = "complete";
      } else state.phase = "save_failed";
      render(true);
    }).catch(() => {
      // 최초 저장 경로에는 catch가 있는데 재시도 경로에는 없었다. 여기서 reject되면
      // 「저장하고 있어요」 화면에 갇히는데, 그 화면에는 버튼이 하나도 없다.
      state.submissionStatus = "failed";
      state.phase = "save_failed";
      render(true);
    });
    return;
  }
  if (target.dataset.action === "restart") { clearFirstGreeting(); clearDraft(); state = { phase: "intro", step: 0, answers: {}, submitted: null, submissionStatus: null, exhibitionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, adaptiveGenerating: false, summaryGenerating: false, translationGenerating: false, responseId: null, language: state.language, feedback: {}, referralStatus: null, firstGreeting: null, researchContact: { email: "", consent: false, status: null } }; render(true); }
});

document.addEventListener("input", (event) => {
  const input = event.target;
  if (input.matches("[data-research-contact]")) {
    state.researchContact = { ...(state.researchContact || {}), [input.dataset.researchContact]: input.value, status: null };
    saveDraft();
    refreshUseScopeContactStatus();
    const nextButton = document.querySelector("button.primary-button[data-action='next']");
    if (nextButton) nextButton.disabled = !canContinue("USE_SCOPE");
    return;
  }
  if (input.matches("[data-referral-input]")) {
    const referral = getReferral();
    referral[input.dataset.referralInput] = input.value;
    if (input.dataset.referralInput === "addresses") referral.parsed = null;
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
    // 1단계에는 `save-connection`이 없다. 미리보기 버튼도 같이 갱신하지 않으면
    // 문장을 아무리 써도 화면이 반응하지 않는다.
    const previewButton = document.querySelector("button[data-connection-stage='preview']");
    if (previewButton) previewButton.disabled = !connectionCanPreview();
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
  if (isRc2 && ["NO_RECALL_RELATION", "M02", "M04_TEXT", "P18", "P12", "P13_TEXT", "P19_TEXT", "D02_TEXT", "D04", "M06_YEAR", "M07", "P09_COUNTRY", "P10"].includes(id)) reconcileAnchorsAfterResearchEdit(id);
  else if (isRc2 && field === "d_context_evidence_text") reconcileAnchorsAfterResearchEdit("D04");
  if (isRc2 && ["participant_revision", "display_name"].includes(field)) {
    clearDocumentConfirmation();
    // 확인은 취소됐는데 버튼은 `renderChoices`가 그린 DOM 그대로 ✓를 달고 남아 있었다.
    // 참여자에게는 필수 항목이 채워진 화면인데 `다음`만 끝까지 꺼져 있는 것으로 보인다.
    // 여기서 다시 그리면 한글 조합 중 커서가 튀므로 표시만 직접 끈다.
    document.querySelectorAll('[data-choice-id="synthesis_confirmation_ack"]').forEach((button) => {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
      const mark = button.querySelector("span[aria-hidden='true']");
      if (mark) mark.textContent = "";
    });
  }
  saveDraft();
  const activeId = activeScreens()[state.step];
  const nextButton = document.querySelector("button.primary-button[data-action='next'], button.primary-button[data-action='context-next']");
  if (nextButton) nextButton.disabled = activeId === "PARTICIPANT_CONTEXT" ? !canContinueContextStep() : !canContinue(activeId);
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches("[data-research-contact-consent]")) {
    state.researchContact = { ...(state.researchContact || {}), consent: input.checked, status: null };
    saveDraft();
    refreshUseScopeContactStatus();
    const nextButton = document.querySelector("button.primary-button[data-action='next']");
    if (nextButton) nextButton.disabled = !canContinue("USE_SCOPE");
    return;
  }
  if (input.matches("[data-connection-preview-confirmed]")) {
    const connection = getConnection();
    connection.preview_confirmed = input.checked;
    saveConnection();
    const saveButton = document.querySelector("button[data-action='save-connection']");
    if (saveButton) saveButton.disabled = !connectionCanSave();
    return;
  }
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

// 아직 서버로 못 간 응답이 있으면 앱을 열 때 조용히 다시 보낸다. 예전에는 `online`
// 이벤트와 수동 버튼에서만 재전송했는데, 저장에 실패한 참여자가 창을 닫고 나중에 다시
// 들어오면 이미 온라인이라 `online` 이벤트가 뜨지 않았다. RC2 인트로에는 「이전 제출
// 상태 확인」 버튼도 없다(그 버튼은 RC1 분기 전용). 그래서 그 사람의 이야기는 자기 기기
// localStorage 안에서 영구히 대기했다 — 16명 중 한 명만 겪어도 표본의 6%다.
if (submitFunctionUrl) {
  try {
    if (readOutbox().length) {
      retryOutbox({ endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }).catch(() => {});
    }
  } catch { /* 저장소를 못 읽어도 앱은 그대로 뜬다. */ }
}

Promise.all([schemaUrl, depthBankUrl].map((url) => fetch(url).then((response) => response.ok ? response.json() : Promise.reject(new Error(`load failed: ${url}`)))))
  .then(([loadedSchema, loadedDepthBank]) => { schema = loadedSchema; depthBank = loadedDepthBank; state.phase = "intro"; render(); })
  .catch(() => { root.innerHTML = "<main class='shell'><p class='error'>질문 스키마를 불러오지 못했습니다.</p></main>"; });
