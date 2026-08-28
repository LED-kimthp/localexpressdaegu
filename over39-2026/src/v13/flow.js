import { ALL_ADAPTIVE_SCREEN_MAP, anchorSourceText, isLowInformationText, shouldAskD04ConditionsFollowup, shouldAskNoRecallRelationFollowup } from "./anchor-live.js";

// 이 목록은 과거 응답과 스키마를 계속 읽기 위한 ID 등록부이며, 참여자에게 무엇을 묻는지는
// applicableFixedQuestionIds()만이 결정한다. 그래서 목록에 있으나 묻지 않는 ID가 섞여 있다.
// P17(지금의 관계 상태 판단)·P18(현재 상태가 시작된 시기)은 어느 경로에서도 묻지 않는다.
// Task 4 연구 타당성 검토가 "같은 판단을 중복해서 묻는 부담을 줄이라"고 결론냈고, Task 5에서
// 정식 S 코어를 P14/P15/P16/P11/P19로 확정하면서 RC2 코어 노출을 걷어냈기 때문이다
// (근거: CURRENT_STATE.md "New RC2 standardized core no longer repeats legacy P06/P07, P17,
// or standalone P18", CODEX_HANDOFF_2026-08-18.md). 응답 호환을 위해 ID는 지우지 않았다.
// P06/P07도 같은 결정으로 RC2에서 빠졌고 RC1 경로에만 남아 있다.
// flow.test.js가 P17/P18이 화면에 없음을 계약으로 검증하므로, 되살리려면 TK 승인이 먼저 필요하다.
export const FIXED_RESEARCH_QUESTION_IDS = [
  "M01", "NO_RECALL_RELATION", "M02", "M03", "M04", "M04_TEXT", "M05", "M06", "M07", "M08", "M09", "M10",
  "P05", "P06", "P07", "P14", "P15", "P16", "P17", "P18", "P11", "P12", "P13", "P13_TEXT", "P19", "P19_TEXT",
  "D01", "D02", "D02_TEXT", "D03", "D04", "R01",
];

export const DEPTH_QUESTION_IDS = Object.keys(ALL_ADAPTIVE_SCREEN_MAP);

const PROFESSIONAL_FIELDS = [
  "role_group_primary", "role_primary", "role_primary_other", "roles_parallel",
  "roles_parallel_other", "activity_state", "visibility_state", "previous_roles",
  "previous_roles_other",
];

const MEMORY_DETAIL_FIELDS = [
  "memory_clue_text", "memory_branch_followup", "memory_meaning_text", "m_declared", "m_support_tags",
  "memory_time_band", "memory_year_optional", "memory_locations", "memory_experience_modes",
  "memory_experience_modes_other", "memory_relationship", "witness_role", "witness_role_other",
];

// P14/P15가 더 이상 쉼·전환 상태를 뜻하지 않을 때 지워야 하는 필드들. 실제 삭제는 app.js가
// 선택 변경 시점에 직접 하고 있어서 이 목록은 flow.js에서 쓰이지 않는다. pause_meaning(P17)과
// pause_context_text(P18)이 여기 남아 있는 것은 저장 필드 기록일 뿐, 두 문항을 묻는다는 뜻이 아니다.
const PAUSE_CONTEXT_FIELDS = ["pause_context_tags", "pause_context_other", "pause_meaning", "pause_context_text"];

const ADAPTIVE_FIELDS = [
  "adaptive_turns", "adaptive_checkpoint_status", "adaptive_ai_runs", "adaptive_detected_language",
  "depth_summary", "depth_source", "depth_ai_runs", "depth_m", "depth_s", "depth_d",
  "reflection_action", "participant_revision", "participant_approved_text", "participant_approved_text_ko",
  "participant_approved_provenance", "participant_approved_translation_provenance",
  "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "document_confirmation_ack",
  "document_confirmed_at", "response_document_draft",
];

const DERIVED_FIELDS = [
  "d_scope", "d_current_gap", "d_desired_change_primary", "d_context_tags", "d_context_tags_other",
  "d_context_impact_text", "depth_plan", "depth_answers", "depth_summary", "depth_source",
  "depth_ai_runs", "reflection_action", "participant_revision", "participant_approved_text", "participant_approved_text_ko",
  "participant_approved_provenance", "participant_approved_translation_provenance",
  "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "coordinate_scope",
  "coordinate_subject", "s_context_tags", "document_confirmation_ack", "document_confirmed_at", "response_document_draft",
  ...ADAPTIVE_FIELDS,
];

// C00에서 "이름을 하나 더 남긴다"를 고르지 않으면 C01~C04는 화면에 나오지 않는다. 참여자가
// 고른 뒤 마음을 바꾸면 묻지 않은 화면의 답이 제출 데이터에 그대로 남기 때문에 여기서 지운다.
// 필드명은 스키마의 store 값을 그대로 쓴다(C01=community_recall_mode, C02=community_recall_reason,
// C03=community_background, C04=community_note_text). 이전 목록에 있던
// community_selected_name·community_selection_reason·community_relationship_tags·
// community_relationship_other는 앱이 쓰지 않는 이름이어서 삭제가 한 건도 일어나지 않고 있었다.
// C04의 두 번째 store 필드(community_note_audio_ref)는 목록에 없다. 음성 경로를 배선하지 않아
// 앱이 그 필드를 한 번도 쓰지 않기 때문이며, 음성을 여는 날 함께 추가해야 한다.
const COMMUNITY_DEPENDENT_FIELDS = ["community_recall_mode", "community_recall_reason", "community_background", "community_note_text"];

// Additive context remains when the route is edited. The original route and
// R01–R20 role fields still define their own existing flow rules.
const PARTICIPANT_CONTEXT_FIELDS = ["field", "field_other", "participation_mode", "participation_mode_other", "activity_form", "participation_unit", "participation_unit_other"];

// The schema stores consent under dotted keys. Legacy flat keys are retained for old drafts.
const KEEP_ON_ROUTE_CHANGE = new Set([
  "consent.research_participation", "consent.ai_processing_ack",
  "research_consent", "data_processing_consent", "route", "display_name_mode", "display_name",
  ...PARTICIPANT_CONTEXT_FIELDS,
]);

export function isProfessionalAnswers(answers = {}) {
  return ["SELF", "BOTH"].includes(answers.route)
    || answers.route === "MEMORY" && answers.response_position === "PROFESSIONAL";
}

export function needsPauseContext(answers = {}) {
  const creativePause = new Set(["PAUSED", "SHIFTED", "CLOSED", "AUDIENCE_DISTANCED"]);
  const publicPause = new Set(["MAKING_NOT_SHOWING", "PUBLIC_ROLE_SHIFT", "BOTH_PAUSED", "NOT_WANTED", "AUDIENCE_PAUSED"]);
  return creativePause.has(answers.creative_work_state) || publicPause.has(answers.public_activity_state);
}

export function normalizedDScope(answers = {}) {
  if (answers.route === "SELF") return "SELF_ROLE";
  if (answers.route === "MEMORY") {
    if (answers.response_position === "PROFESSIONAL") {
      if (["SELF_ROLE", "BOTH_BUT_PRIORITY_SELF"].includes(answers.d_scope)) return "SELF_ROLE";
      if (["MEMORY_RECONNECT", "BOTH_BUT_PRIORITY_MEMORY"].includes(answers.d_scope)) return "MEMORY_RECONNECT";
    }
    return "MEMORY_RECONNECT";
  }
  if (answers.route === "AUDIENCE") return "AUDIENCE";
  if (answers.d_scope === "BOTH_BUT_PRIORITY_SELF") return "SELF_ROLE";
  if (answers.d_scope === "BOTH_BUT_PRIORITY_MEMORY") return "MEMORY_RECONNECT";
  return answers.d_scope || "";
}

export function resetForRouteChange(answers, nextRoute) {
  const next = {};
  for (const [key, value] of Object.entries(answers || {})) {
    if (KEEP_ON_ROUTE_CHANGE.has(key)) next[key] = value;
  }
  next.route = nextRoute;
  return next;
}

export function clearDerivedAnswers(answers) {
  const next = { ...(answers || {}) };
  DERIVED_FIELDS.forEach((field) => delete next[field]);
  return next;
}

export function sanitizeAnswersForRoute(answers = {}) {
  const next = { ...answers };
  if (next.route !== "MEMORY") delete next.response_position;
  if (!isProfessionalAnswers(next)) PROFESSIONAL_FIELDS.forEach((field) => delete next[field]);
  if (next.community_module_opt_in !== "YES") COMMUNITY_DEPENDENT_FIELDS.forEach((field) => delete next[field]);
  if (next.route !== "BOTH" && !(next.route === "MEMORY" && next.response_position === "PROFESSIONAL")) delete next.d_scope;
  if (next.display_name_mode === "ANONYMOUS") delete next.display_name;
  if (next.memory_type === "NO_RECALL") MEMORY_DETAIL_FIELDS.forEach((field) => delete next[field]);
  else delete next.no_recall_relation_text;
  return next;
}

export function hasSubstantiveTransition(answers = {}) {
  return ["CLEAR", "GRADUAL", "MULTIPLE"].includes(answers.transition_state);
}

export function needsContinuityQuestion(answers = {}) {
  const presentShift = needsPauseContext(answers);
  return presentShift || hasSubstantiveTransition(answers);
}

export function hasSubstantiveDChange(answers = {}) {
  return /^D[1-4]$/.test(String(answers.d_desired_change_primary || ""));
}

export function applicableFixedQuestionIds(answers = {}, { adaptive = false } = {}) {
  const ids = ["M01"];
  if (answers.route === "AUDIENCE" && answers.memory_type === "NO_RECALL") ids.push("NO_RECALL_RELATION");
  if (answers.memory_type !== "NO_RECALL") {
    ids.push("M02");
    if (!adaptive) ids.push("M03");
    ids.push("M04");
    if (adaptive) ids.push("M04_TEXT");
    ids.push("M05", "M06", "M07", "M08", "M09");
    if (!adaptive) ids.push("M10");
  }
  // P06/P07 remain valid legacy fields but are no longer part of the RC2 core.
  ids.push("P05");
  if (adaptive) {
    ids.push("P14", "P15", "P16", "P11");
    if (hasSubstantiveTransition(answers)) ids.push("P12");
    if (needsContinuityQuestion(answers)) {
      ids.push("P13");
      if (["YES", "MIXED"].includes(answers.invisible_continuity_state)) ids.push("P13_TEXT");
    }
    ids.push("P19");
    if (Array.isArray(answers.support_conditions) && answers.support_conditions.some((value) => value !== "NONE")) ids.push("P19_TEXT");
  } else {
    ids.push("P06", "P07");
  }
  ids.push("D01", "D02");
  if (adaptive && hasSubstantiveDChange(answers)) ids.push("D02_TEXT");
  ids.push("D03", "D04", "R01");
  if (adaptive && answers.memory_type !== "NO_RECALL") ids.push("M03", "M10");
  return ids;
}

function buildRc1Screens(answers = {}) {
  const screens = ["CONSENT", "P01", "DOCUMENT_IDENTITY"];
  if (answers.route === "MEMORY") screens.push("P01_CONTEXT");
  if (isProfessionalAnswers(answers)) screens.push("ROLE_GROUP", "ROLE_PRIMARY", "ROLE_PARALLEL");
  screens.push("ACTIVITY", "PROFILE", "M01");
  if (answers.memory_type !== "NO_RECALL") screens.push("M02", "M03", "M04", "M05", "MEMORY_TIME", "MEMORY_EVIDENCE");
  screens.push("D01", "D02", "D03");
  const hasContext = Array.isArray(answers.d_context_tags) && answers.d_context_tags.some((value) => value !== "NONE");
  if (hasContext) screens.push("D04");
  screens.push("R01", "COMMUNITY", "FIXED_CHECKPOINT", "DEPTH_M", "DEPTH_S", "DEPTH_D", "REFLECTION_REVIEW", "SUBMIT");
  return screens;
}

function addAnchorScreen(screens, answers, sourceScreen, anchorId, anchorScreen) {
  screens.push(sourceScreen);
  const text = anchorSourceText(answers, anchorId);
  if (!isLowInformationText(text)) screens.push(anchorScreen);
}

function buildAdaptiveScreens(answers = {}) {
  const screens = ["CONSENT", "P01"];
  if (answers.route === "MEMORY") screens.push("P01_CONTEXT");
  screens.push("PARTICIPANT_CONTEXT");
  if (isProfessionalAnswers(answers)) screens.push("ROLE_BRIDGE");
  screens.push("M01");
  if (answers.route === "AUDIENCE" && answers.memory_type === "NO_RECALL") screens.push("NO_RECALL_RELATION");
  if (answers.memory_type !== "NO_RECALL") {
    screens.push("M02");
    addAnchorScreen(screens, answers, "M04", "M04_TEXT", "AI_ANCHOR_M04_TEXT");
    screens.push("M05", "MEMORY_TIME", "MEMORY_EVIDENCE");
  }
  screens.push("MEMORY_TO_PRESENT", "ACTIVITY", "PRACTICE_PUBLIC_STATE", "STATE_BACKGROUND", "TRANSITION");
  if (hasSubstantiveTransition(answers) && !isLowInformationText(anchorSourceText(answers, "P12"))) screens.push("AI_ANCHOR_P12");
  if (needsContinuityQuestion(answers)) {
    screens.push("CONTINUITY");
    if (["YES", "MIXED"].includes(answers.invisible_continuity_state) && !isLowInformationText(anchorSourceText(answers, "P13_TEXT"))) screens.push("AI_ANCHOR_P13_TEXT");
  }
  screens.push("SUPPORT_CONDITIONS", "D01", "D02");
  if (hasSubstantiveDChange(answers) && !isLowInformationText(anchorSourceText(answers, "D02_TEXT"))) screens.push("AI_ANCHOR_D02_TEXT");
  screens.push("D03", "D04", "R01");
  if (answers.memory_type !== "NO_RECALL") screens.push("M03_RECONNECT", "M10_VERIFY");
  screens.push("COMMUNITY", "DOCUMENT_IDENTITY", "PROFILE", "REFLECTION_REVIEW", "SUBMIT", "USE_SCOPE");
  return screens;
}

export function buildActiveScreens(answers = {}, { adaptive = false } = {}) {
  return adaptive ? buildAdaptiveScreens(answers) : buildRc1Screens(answers);
}

export function fixedQuestionIdsForScreen(screen, answers = {}, { adaptive = false } = {}) {
  const map = {
    ACTIVITY: adaptive ? ["P05"] : ["P05", "P06", "P07"],
    PRACTICE_PUBLIC_STATE: adaptive ? ["P14", "P15"] : [],
    STATE_BACKGROUND: adaptive ? ["P16"] : [],
    TRANSITION: adaptive ? ["P11", ...(hasSubstantiveTransition(answers) ? ["P12"] : [])] : [],
    CONTINUITY: adaptive && needsContinuityQuestion(answers) ? ["P13", ...(["YES", "MIXED"].includes(answers.invisible_continuity_state) ? ["P13_TEXT"] : [])] : [],
    SUPPORT_CONDITIONS: adaptive ? ["P19", ...(Array.isArray(answers.support_conditions) && answers.support_conditions.some((value) => value !== "NONE") ? ["P19_TEXT"] : [])] : [],
    M01: ["M01"], NO_RECALL_RELATION: ["NO_RECALL_RELATION"], M02: ["M02"], M03: ["M03"], M03_RECONNECT: ["M03"], M10_VERIFY: ["M10"], M04: adaptive ? ["M04", "M04_TEXT"] : ["M04"], M05: ["M05"],
    MEMORY_TIME: ["M06", "M07"], MEMORY_EVIDENCE: adaptive ? ["M08", "M09"] : ["M08", "M09", "M10"],
    D01: ["D01"], D02: adaptive ? ["D02", ...(hasSubstantiveDChange(answers) ? ["D02_TEXT"] : [])] : ["D02"], D03: ["D03"], D04: ["D04"], R01: ["R01"],
  };
  return map[screen] || [];
}

export function flowCounts(screens, answers = {}, { adaptive = false } = {}) {
  const requiredIds = ["M01", "M02", "M04", "D01", "D02"];
  if (adaptive) requiredIds.push("P14", "P15", "P16", "P11", "P19");
  const fixed = applicableFixedQuestionIds(answers, { adaptive });
  return {
    fixedResearchQuestions: fixed.length,
    depthResearchQuestions: screens.filter((screen) => Object.hasOwn(ALL_ADAPTIVE_SCREEN_MAP, screen)).length,
    totalResearchQuestions: fixed.length + screens.filter((screen) => Object.hasOwn(ALL_ADAPTIVE_SCREEN_MAP, screen)).length,
    totalScreens: screens.length,
    requiredQuestions: requiredIds.filter((id) => fixed.includes(id)).length,
  };
}
