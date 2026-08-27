// Additive participant context for the pre-production cultural-arts model.
// These codes never replace R01–R20, route, or any M/S/D value.
import { participantContextDHints, participantContextLabels, participantContextualCopy } from "./participant-context-i18n.js";
export const PARTICIPANT_CONTEXT_VERSION = "over39-participant-context-v1-2026-08-13";
export const LEGACY_MAPPING_VERSION = "context_to_legacy_v1";

export const PARTICIPANT_CONTEXT_FIELDS = Object.freeze([
  "field",
  "participation_mode",
  "activity_form",
  "participation_unit",
]);

export const FIELD_CODES = Object.freeze([
  "VISUAL_ARTS", "PHOTO_MEDIA", "CRAFT_DESIGN", "FILM", "THEATRE_PERFORMANCE", "DANCE", "MUSIC",
  "TRADITIONAL_ARTS", "LITERATURE_PUBLISHING", "HERITAGE_ARCHIVE", "INTERDISCIPLINARY", "LOCAL_EVERYDAY_CULTURE", "OTHER",
]);

export const PARTICIPATION_MODE_CODES = Object.freeze([
  "CREATION_PRODUCTION", "DIRECTION_CHOREOGRAPHY_COMPOSITION", "PERFORMANCE_LIVE", "CURATION_PRODUCING",
  "EDUCATION_TRANSMISSION", "CRITICISM_RESEARCH", "DOCUMENTATION_ARCHIVE", "EDITING_PUBLISHING_MEDIA",
  "TECHNICAL_PRODUCTION_SUPPORT", "SPACE_INSTITUTION_OPERATION", "DISTRIBUTION_PATRONAGE",
  "LEARNING_TRAINING", "HOBBY_CLUB_EVERYDAY_ARTS", "LOCAL_COMMUNITY_ACTIVITY", "OTHER",
]);

export const ACTIVITY_FORM_CODES = Object.freeze([
  "PRIMARY_WORK", "WITH_OTHER_WORK", "PAID_PROJECT_BASED", "WITH_EDUCATION", "UNPAID_VOLUNTEER_COMMUNITY",
  "HOBBY_CLUB", "LEARNING_TRAINING", "PAUSED_OR_ADJUSTING", "SHIFTED_ROLE", "MIXED",
]);

export const PARTICIPATION_UNIT_CODES = Object.freeze(["INDIVIDUAL", "TEAM_GROUP", "INDIVIDUAL_AND_TEAM", "OTHER"]);

export const PARTICIPANT_CONTEXT_OPTIONS = Object.freeze({
  field: [
    ["VISUAL_ARTS", "시각예술"], ["PHOTO_MEDIA", "사진·영상·미디어"], ["CRAFT_DESIGN", "공예·디자인"], ["FILM", "영화"],
    ["THEATRE_PERFORMANCE", "연극·공연"], ["DANCE", "무용"], ["MUSIC", "음악"], ["TRADITIONAL_ARTS", "전통예술·전통문화"],
    ["LITERATURE_PUBLISHING", "문학·출판"], ["HERITAGE_ARCHIVE", "문화유산·기록"], ["INTERDISCIPLINARY", "다원·융복합"],
    ["LOCAL_EVERYDAY_CULTURE", "지역·생활문화"], ["OTHER", "기타 직접 입력"],
  ],
  participation_mode: [
    ["CREATION_PRODUCTION", "창작·제작"], ["DIRECTION_CHOREOGRAPHY_COMPOSITION", "연출·안무·작곡·구성"], ["PERFORMANCE_LIVE", "공연·연주·실연"],
    ["CURATION_PRODUCING", "기획·프로듀싱"], ["EDUCATION_TRANSMISSION", "교육·전승·강습"], ["CRITICISM_RESEARCH", "비평·연구"],
    ["DOCUMENTATION_ARCHIVE", "기록·아카이브"], ["EDITING_PUBLISHING_MEDIA", "편집·출판·미디어"], ["TECHNICAL_PRODUCTION_SUPPORT", "기술·제작지원"],
    ["SPACE_INSTITUTION_OPERATION", "공간·기관 운영"], ["DISTRIBUTION_PATRONAGE", "유통·후원"], ["LEARNING_TRAINING", "배우거나 수련하는 중"],
    ["HOBBY_CLUB_EVERYDAY_ARTS", "취미·동호회·생활예술"], ["LOCAL_COMMUNITY_ACTIVITY", "지역·공동체 활동"], ["OTHER", "기타 직접 입력"],
  ],
  activity_form: [
    ["PRIMARY_WORK", "주된 일로 이어가고 있다"], ["WITH_OTHER_WORK", "다른 일과 함께 이어가고 있다"], ["PAID_PROJECT_BASED", "프로젝트가 있을 때 유급으로 한다"],
    ["WITH_EDUCATION", "교육·강습과 함께 이어간다"], ["UNPAID_VOLUNTEER_COMMUNITY", "무급·자원활동·공동체 활동으로 한다"],
    ["HOBBY_CLUB", "취미·동호회 활동으로 이어간다"], ["LEARNING_TRAINING", "배우거나 수련하고 있다"], ["PAUSED_OR_ADJUSTING", "현재 쉬거나 속도를 조절하고 있다"],
    ["SHIFTED_ROLE", "이전과 다른 역할로 이동했다"], ["MIXED", "한 가지로 말하기 어렵다"],
  ],
  participation_unit: [
    ["INDIVIDUAL", "나 개인의 활동"], ["TEAM_GROUP", "내가 속한 팀·그룹의 활동"], ["INDIVIDUAL_AND_TEAM", "개인과 팀을 함께"], ["OTHER", "다른 형태 — 직접 입력"],
  ],
});

export function participantContextOptions(language = "ko") {
  const [field, participationMode, activityForm, participationUnit] = participantContextLabels(language);
  return {
    field: FIELD_CODES.map((code, index) => [code, field[index]]),
    participation_mode: PARTICIPATION_MODE_CODES.map((code, index) => [code, participationMode[index]]),
    activity_form: ACTIVITY_FORM_CODES.map((code, index) => [code, activityForm[index]]),
    participation_unit: PARTICIPATION_UNIT_CODES.map((code, index) => [code, participationUnit[index]]),
  };
}

const values = (value) => Array.isArray(value) ? value : value ? [value] : [];

export function isEverydayArtsContext(answers = {}) {
  const modes = values(answers.participation_mode);
  return modes.some((code) => ["LEARNING_TRAINING", "HOBBY_CLUB_EVERYDAY_ARTS", "LOCAL_COMMUNITY_ACTIVITY"].includes(code))
    || ["HOBBY_CLUB", "LEARNING_TRAINING", "UNPAID_VOLUNTEER_COMMUNITY"].includes(answers.activity_form);
}

export function participantContextKind(answers = {}) {
  if (answers.route === "AUDIENCE") return "AUDIENCE";
  return isEverydayArtsContext(answers) ? "EVERYDAY" : "PROFESSIONAL";
}

export function deriveLegacyRoleCandidates(answers = {}) {
  const fields = new Set(values(answers.field));
  const modes = new Set(values(answers.participation_mode));
  const candidates = new Set();
  let coverage = "partial";
  let confidence = "medium";

  if (modes.has("LEARNING_TRAINING") || modes.has("HOBBY_CLUB_EVERYDAY_ARTS") || ["HOBBY_CLUB", "LEARNING_TRAINING"].includes(answers.activity_form)) {
    return { coverage: "not_applicable", candidates: [], confidence: null, mapping_version: LEGACY_MAPPING_VERSION };
  }
  if (modes.has("CREATION_PRODUCTION")) {
    if (fields.has("VISUAL_ARTS")) candidates.add("R01");
    if (fields.has("PHOTO_MEDIA")) candidates.add("R02");
    if (fields.has("CRAFT_DESIGN")) candidates.add("R03");
  }
  if (modes.has("CURATION_PRODUCING")) { candidates.add("R04"); candidates.add("R05"); }
  if (modes.has("CRITICISM_RESEARCH")) { candidates.add("R06"); candidates.add("R07"); }
  if (modes.has("EDITING_PUBLISHING_MEDIA")) ["R08", "R09", "R10", "R13"].forEach((r) => candidates.add(r));
  if (modes.has("DOCUMENTATION_ARCHIVE")) { candidates.add("R11"); candidates.add("R12"); }
  if (modes.has("SPACE_INSTITUTION_OPERATION")) { candidates.add("R14"); candidates.add("R15"); }
  if (modes.has("EDUCATION_TRANSMISSION")) candidates.add("R16");
  if (modes.has("TECHNICAL_PRODUCTION_SUPPORT")) candidates.add("R18");
  if (modes.has("DISTRIBUTION_PATRONAGE")) candidates.add("R19");
  if (fields.has("HERITAGE_ARCHIVE") && (modes.has("DOCUMENTATION_ARCHIVE") || modes.has("TECHNICAL_PRODUCTION_SUPPORT"))) candidates.add("R20");

  const list = [...candidates];
  if (!list.length) {
    const outsideLegacy = modes.has("PERFORMANCE_LIVE") || modes.has("DIRECTION_CHOREOGRAPHY_COMPOSITION")
      || fields.has("DANCE") || fields.has("MUSIC") || fields.has("THEATRE_PERFORMANCE")
      || modes.has("LOCAL_COMMUNITY_ACTIVITY");
    coverage = outsideLegacy ? "not_covered" : "partial";
    confidence = outsideLegacy ? null : "low";
  } else if (list.length === 1 && ["R01", "R02", "R03", "R18"].includes(list[0])) {
    coverage = "covered";
    confidence = "high";
  } else {
    coverage = "partial";
    confidence = list.length <= 2 ? "medium" : "low";
  }
  return { coverage, candidates: list, confidence, mapping_version: LEGACY_MAPPING_VERSION };
}

export function legacyRoleProvenance(answers = {}) {
  const mapping = deriveLegacyRoleCandidates(answers);
  const confirmedRole = answers.role_primary || null;
  const source = confirmedRole
    ? "bridge_confirmed"
    : mapping.coverage === "not_applicable"
      ? "not_applicable"
      : mapping.coverage === "not_covered"
        ? "not_covered"
        : "context_candidate";
  return {
    legacy_role_value: confirmedRole,
    legacy_role_group: answers.role_group_primary || null,
    legacy_role_source: source,
    legacy_mapping_version: mapping.mapping_version,
    legacy_mapping_confidence: confirmedRole ? "participant_confirmed" : mapping.confidence,
    legacy_mapping_candidates: mapping.candidates,
    legacy_taxonomy_coverage: mapping.coverage,
  };
}

export function compactParticipantContext(answers = {}) {
  const provenance = legacyRoleProvenance(answers);
  return {
    version: PARTICIPANT_CONTEXT_VERSION,
    legacy_role: provenance.legacy_role_value,
    legacy_role_group: provenance.legacy_role_group,
    legacy_role_source: provenance.legacy_role_source,
    legacy_mapping_version: provenance.legacy_mapping_version,
    legacy_mapping_confidence: provenance.legacy_mapping_confidence,
    legacy_mapping_candidates: provenance.legacy_mapping_candidates,
    legacy_taxonomy_coverage: provenance.legacy_taxonomy_coverage,
    legacy_mapping: deriveLegacyRoleCandidates(answers),
    field: values(answers.field),
    field_other: String(answers.field_other || "").trim() || null,
    participation_mode: values(answers.participation_mode),
    participation_mode_other: String(answers.participation_mode_other || "").trim() || null,
    activity_form: answers.activity_form || null,
    participation_unit: answers.participation_unit || null,
    participation_unit_other: String(answers.participation_unit_other || "").trim() || null,
    kind: participantContextKind(answers),
  };
}

export function hasParticipantContext(answers = {}) {
  const field = values(answers.field);
  const mode = values(answers.participation_mode);
  return field.length > 0
    && mode.length > 0
    && Boolean(answers.activity_form)
    && (!field.includes("OTHER") || Boolean(String(answers.field_other || "").trim()))
    && (!mode.includes("OTHER") || Boolean(String(answers.participation_mode_other || "").trim()))
    && (answers.participation_unit !== "OTHER" || Boolean(String(answers.participation_unit_other || "").trim()));
}

export function contextAwareCopy(answers = {}, language = "ko") {
  return participantContextualCopy(language, participantContextKind(answers));
}

export function dContextHints(answers = {}, language = "ko") {
  const fields = new Set(values(answers.field));
  const modes = new Set(values(answers.participation_mode));
  if (modes.has("HOBBY_CLUB_EVERYDAY_ARTS") || modes.has("LOCAL_COMMUNITY_ACTIVITY")) return participantContextDHints(language, "everyday");
  if (fields.has("DANCE")) return participantContextDHints(language, "dance");
  if (fields.has("THEATRE_PERFORMANCE")) return participantContextDHints(language, "theatre");
  if (fields.has("MUSIC") || fields.has("TRADITIONAL_ARTS")) return participantContextDHints(language, "music");
  if (fields.has("FILM")) return participantContextDHints(language, "film");
  return participantContextDHints(language, "general");
}
