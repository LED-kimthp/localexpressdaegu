import { ANCHOR_SCREEN_MAP, anchorSourceText, isLowInformationText } from "./anchor-live.js";

export const FIXED_RESEARCH_QUESTION_IDS = [
  "M01", "M02", "M03", "M04", "M04_TEXT", "M05", "M06", "M07", "M08", "M09", "M10",
  "P05", "P06", "P07", "P14", "P15", "P16", "P17", "P18", "P11", "P12", "P13", "P13_TEXT", "P19", "P19_TEXT",
  "D01", "D02", "D02_TEXT", "D03", "D04", "R01",
];

export const DEPTH_QUESTION_IDS = Object.keys(ANCHOR_SCREEN_MAP);

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

const PAUSE_CONTEXT_FIELDS = ["pause_context_tags", "pause_context_other", "pause_meaning", "pause_context_text"];

const ADAPTIVE_FIELDS = [
  "adaptive_turns", "adaptive_checkpoint_status", "adaptive_ai_runs", "adaptive_detected_language",
  "depth_summary", "depth_source", "depth_ai_runs", "depth_m", "depth_s", "depth_d",
  "reflection_action", "participant_revision", "participant_approved_text", "participant_approved_text_ko",
  "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "document_confirmation_ack",
  "document_confirmed_at", "response_document_draft",
];

const DERIVED_FIELDS = [
  "d_scope", "d_current_gap", "d_desired_change_primary", "d_context_tags", "d_context_tags_other",
  "d_context_impact_text", "depth_plan", "depth_answers", "depth_summary", "depth_source",
  "depth_ai_runs", "reflection_action", "participant_revision", "participant_approved_text", "participant_approved_text_ko",
  "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "coordinate_scope",
  "coordinate_subject", "s_context_tags", "document_confirmation_ack", "document_confirmed_at", "response_document_draft",
  ...ADAPTIVE_FIELDS,
];

const COMMUNITY_FIELDS = [
  "community_module_opt_in", "community_selected_name", "community_selection_reason",
  "community_relationship_tags", "community_relationship_other",
];

// The schema stores consent under dotted keys. Legacy flat keys are retained for old drafts.
const KEEP_ON_ROUTE_CHANGE = new Set([
  "consent.research_participation", "consent.ai_processing_ack",
  "research_consent", "data_processing_consent", "route", "display_name_mode", "display_name",
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
  if (next.community_module_opt_in !== "YES") COMMUNITY_FIELDS.slice(1).forEach((field) => delete next[field]);
  if (next.route !== "BOTH" && !(next.route === "MEMORY" && next.response_position === "PROFESSIONAL")) delete next.d_scope;
  if (next.display_name_mode === "ANONYMOUS") delete next.display_name;
  if (next.memory_type === "NO_RECALL") MEMORY_DETAIL_FIELDS.forEach((field) => delete next[field]);
  return next;
}

export function applicableFixedQuestionIds(answers = {}, { adaptive = false } = {}) {
  const ids = ["M01"];
  if (answers.memory_type !== "NO_RECALL") {
    ids.push("M02", "M03", "M04");
    if (adaptive) ids.push("M04_TEXT");
    ids.push("M05", "M06", "M07", "M08", "M09", "M10");
  }
  ids.push("P05", "P06", "P07");
  if (adaptive) ids.push("P14", "P15", "P16", "P17", "P18", "P11", "P12", "P13", "P13_TEXT", "P19", "P19_TEXT");
  ids.push("D01", "D02");
  if (adaptive) ids.push("D02_TEXT");
  ids.push("D03", "D04", "R01");
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
  const screens = ["CONSENT", "P01", "DOCUMENT_IDENTITY"];
  if (answers.route === "MEMORY") screens.push("P01_CONTEXT");
  if (isProfessionalAnswers(answers)) screens.push("ROLE_GROUP", "ROLE_PRIMARY", "ROLE_PARALLEL");
  screens.push("PROFILE", "M01");
  if (answers.memory_type !== "NO_RECALL") {
    screens.push("M02", "M03");
    addAnchorScreen(screens, answers, "M04", "M04_TEXT", "AI_ANCHOR_M04_TEXT");
    screens.push("M05", "MEMORY_TIME", "MEMORY_EVIDENCE");
  }
  screens.push("MEMORY_TO_PRESENT", "ACTIVITY", "PRACTICE_PUBLIC_STATE", "STATE_BACKGROUND");
  addAnchorScreen(screens, answers, "TRANSITION", "P12", "AI_ANCHOR_P12");
  addAnchorScreen(screens, answers, "CONTINUITY", "P13_TEXT", "AI_ANCHOR_P13_TEXT");
  addAnchorScreen(screens, answers, "SUPPORT_CONDITIONS", "P19_TEXT", "AI_ANCHOR_P19_TEXT");
  screens.push("D01");
  addAnchorScreen(screens, answers, "D02", "D02_TEXT", "AI_ANCHOR_D02_TEXT");
  screens.push("D03", "D04", "R01", "COMMUNITY", "REFLECTION_REVIEW", "SUBMIT", "USE_SCOPE");
  return screens;
}

export function buildActiveScreens(answers = {}, { adaptive = false } = {}) {
  return adaptive ? buildAdaptiveScreens(answers) : buildRc1Screens(answers);
}

export function fixedQuestionIdsForScreen(screen, answers = {}, { adaptive = false } = {}) {
  const map = {
    ACTIVITY: ["P05", "P06", "P07"],
    PRACTICE_PUBLIC_STATE: adaptive ? ["P14", "P15"] : [],
    STATE_BACKGROUND: adaptive ? ["P16", "P17", "P18"] : [],
    TRANSITION: adaptive ? ["P11", "P12"] : [],
    CONTINUITY: adaptive ? ["P13", "P13_TEXT"] : [],
    SUPPORT_CONDITIONS: adaptive ? ["P19", "P19_TEXT"] : [],
    M01: ["M01"], M02: ["M02"], M03: ["M03"], M04: adaptive ? ["M04", "M04_TEXT"] : ["M04"], M05: ["M05"],
    MEMORY_TIME: ["M06", "M07"], MEMORY_EVIDENCE: ["M08", "M09", "M10"],
    D01: ["D01"], D02: adaptive ? ["D02", "D02_TEXT"] : ["D02"], D03: ["D03"], D04: ["D04"], R01: ["R01"],
  };
  return map[screen] || [];
}

export function flowCounts(screens, answers = {}, { adaptive = false } = {}) {
  const requiredIds = ["M01", "M02", "M04", "D01", "D02"];
  if (adaptive) requiredIds.push("P14", "P15", "P11", "P13", "P19");
  const fixed = applicableFixedQuestionIds(answers, { adaptive });
  return {
    fixedResearchQuestions: fixed.length,
    depthResearchQuestions: screens.filter((screen) => Object.hasOwn(ANCHOR_SCREEN_MAP, screen)).length,
    totalResearchQuestions: fixed.length + screens.filter((screen) => Object.hasOwn(ANCHOR_SCREEN_MAP, screen)).length,
    totalScreens: screens.length,
    requiredQuestions: requiredIds.filter((id) => fixed.includes(id)).length,
  };
}
