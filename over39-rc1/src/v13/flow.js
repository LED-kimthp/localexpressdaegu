export const FIXED_RESEARCH_QUESTION_IDS = [
  "P05", "P06", "P07",
  "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10",
  "D01", "D02", "D03", "D04", "R01",
];

export const DEPTH_QUESTION_IDS = ["AI_M1", "AI_S1", "AI_D1"];

const PROFESSIONAL_FIELDS = [
  "role_group_primary", "role_primary", "role_primary_other", "roles_parallel",
  "roles_parallel_other", "activity_state", "visibility_state", "previous_roles",
  "previous_roles_other",
];

const MEMORY_DETAIL_FIELDS = [
  "memory_clue_text", "memory_branch_followup", "m_declared", "m_support_tags",
  "memory_time_band", "memory_year_optional", "memory_locations", "memory_experience_modes",
  "memory_experience_modes_other", "memory_relationship", "witness_role", "witness_role_other",
];

const DERIVED_FIELDS = [
  "d_scope", "d_current_gap", "d_desired_change_primary", "d_context_tags", "d_context_tags_other",
  "d_context_impact_text", "depth_plan", "depth_answers", "depth_summary", "depth_source",
  "depth_ai_runs", "reflection_action", "participant_revision", "participant_approved_text",
  "participant_m", "participant_s", "participant_d", "coordinate_snapshots", "coordinate_scope",
  "coordinate_subject", "s_context_tags",
];

const COMMUNITY_FIELDS = [
  "community_module_opt_in", "community_selected_name", "community_selection_reason",
  "community_relationship_tags", "community_relationship_other",
];

const KEEP_ON_ROUTE_CHANGE = new Set(["research_consent", "data_processing_consent", "route"]);

export function isProfessionalAnswers(answers = {}) {
  return ["SELF", "BOTH"].includes(answers.route)
    || answers.route === "MEMORY" && answers.response_position === "PROFESSIONAL";
}

export function normalizedDScope(answers = {}) {
  if (answers.route === "SELF") return "SELF_ROLE";
  if (answers.route === "MEMORY") return "MEMORY_RECONNECT";
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
  if (next.memory_type === "NO_RECALL") MEMORY_DETAIL_FIELDS.forEach((field) => delete next[field]);
  if (next.community_module_opt_in !== "YES") COMMUNITY_FIELDS.slice(1).forEach((field) => delete next[field]);
  if (next.route !== "BOTH") delete next.d_scope;
  return next;
}

export function applicableFixedQuestionIds(answers = {}) {
  const ids = ["P05"];
  if (isProfessionalAnswers(answers)) ids.push("P06", "P07");
  ids.push("M01");
  if (answers.memory_type !== "NO_RECALL") {
    ids.push("M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10");
  }
  ids.push("D01", "D02", "D03");
  const hasContext = Array.isArray(answers.d_context_tags)
    && answers.d_context_tags.some((value) => value !== "NONE");
  if (hasContext) ids.push("D04");
  ids.push("R01");
  return ids;
}

export function buildActiveScreens(answers = {}) {
  const screens = ["CONSENT", "P01"];
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

export function fixedQuestionIdsForScreen(screen, answers = {}) {
  const map = {
    ACTIVITY: isProfessionalAnswers(answers) ? ["P05", "P06", "P07"] : ["P05"],
    M01: ["M01"], M02: ["M02"], M03: ["M03"], M04: ["M04"], M05: ["M05"],
    MEMORY_TIME: ["M06", "M07"], MEMORY_EVIDENCE: ["M08", "M09", "M10"],
    D01: ["D01"], D02: ["D02"], D03: ["D03"], D04: ["D04"], R01: ["R01"],
  };
  return map[screen] || [];
}

export function flowCounts(screens, answers = {}) {
  const requiredIds = ["M01", "D01", "D02"];
  if (answers.memory_type !== "NO_RECALL") requiredIds.push("M02", "M04");
  return {
    fixedResearchQuestions: applicableFixedQuestionIds(answers).length,
    depthResearchQuestions: DEPTH_QUESTION_IDS.length,
    totalResearchQuestions: applicableFixedQuestionIds(answers).length + DEPTH_QUESTION_IDS.length,
    totalScreens: screens.length,
    requiredQuestions: requiredIds.filter((id) => applicableFixedQuestionIds(answers).includes(id)).length,
  };
}
