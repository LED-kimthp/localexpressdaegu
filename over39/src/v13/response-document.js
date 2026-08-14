import { responseDocumentFrame } from "./response-document-i18n.js";

export const RESPONSE_DOCUMENT_VERSION = "over39-participation-record-v0.6.0-cultural-arts-context-2026-08-13";

const ROLE_LABELS = {
  R01: "시각예술가", R02: "사진·영상·미디어 작가", R03: "공예·디자인 창작자",
  R04: "큐레이터·전시기획자", R05: "독립기획자·프로듀서", R06: "비평가",
  R07: "연구자", R08: "문화예술 기자", R09: "독립미디어 관계자",
  R10: "편집자·출판기획자", R11: "아키비스트·기록연구자", R12: "사진·영상 기록자",
  R13: "디자인·홍보·커뮤니케이션 담당자", R14: "독립공간 운영자",
  R15: "미술관·문화기관 실무자", R16: "대학교수·예술교육자·강사", R17: "문화행정·정책 관계자",
  R18: "제작·설치·기술 인력", R19: "갤러리·유통·후원 관계자",
  R20: "보존·수복·소장품 관리 관계자", NON_ARTS: "문화예술 외 역할", OTHER: "직접 입력한 역할",
};

const ROLE_LABELS_EN = {
  R01: "visual artist", R02: "photography, video, or media artist", R03: "craft or design practitioner",
  R04: "curator or exhibition planner", R05: "independent planner or producer", R06: "critic",
  R07: "researcher", R08: "arts and culture journalist", R09: "independent media practitioner",
  R10: "editor or publishing planner", R11: "archivist or records researcher", R12: "photography or video documenter",
  R13: "design, communications, or publicity practitioner", R14: "independent-space operator",
  R15: "museum or cultural-institution practitioner", R16: "university professor, arts educator, or instructor", R17: "cultural administration or policy practitioner",
  R18: "production, installation, or technical practitioner", R19: "gallery, distribution, or patronage practitioner",
  R20: "conservation, restoration, or collection-care practitioner", NON_ARTS: "a role outside arts and culture", OTHER: "a role named by the participant",
};

const ROUTE_LABELS = {
  SELF: "나의 활동과 지속 경험",
  MEMORY: "기억하는 작가·작품·공간·장면",
  BOTH: "나의 활동과 다른 사람에 대한 기억",
  AUDIENCE: "관객·시민으로 경험한 문화예술",
};

const MEMORY_TYPE_LABELS = {
  ARTIST: "한 사람 또는 작가", WORK_OBJECT: "작품·물건·이미지·공연", SPACE: "공간", EXHIBITION: "전시·행사",
  SCENE: "장면", PHRASE: "남아 있는 문장", SENSATION: "이름 붙이기 어려운 감각",
  PRACTICE: "작업·활동·오래 이어진 관심", SELF_PRACTICE: "나의 작업과 활동", NO_RECALL: "특별히 떠오르는 대상이 없음",
};

const ACTIVITY_STATE_LABELS = {
  ACTIVE_MAIN: "주된 활동으로 이어가고 있다", ACTIVE_PARALLEL: "다른 일과 함께 이어가고 있다",
  PROJECT_BASED: "프로젝트가 있을 때 이어가고 있다", ROLE_CHANGED: "활동 방식이나 역할이 바뀌었다",
  PACE_ADJUSTED: "잠시 쉬거나 속도를 조절하고 있다", DISTANCED: "현재는 현장에서 조금 떨어져 있다",
  AUDIENCE_SELF_DIRECTED: "관심이 생길 때 스스로 찾아본다", AUDIENCE_WITH_OTHERS: "친구·가족·수업·추천을 따라 만난다",
  AUDIENCE_CROSS_MEDIA: "영화·공연·웹툰·디자인·온라인 콘텐츠와 함께 본다", AUDIENCE_EVENT_BASED: "전시나 프로그램이 있을 때 참여한다",
  AUDIENCE_PACE_ADJUSTED: "한동안 자주 찾았고 지금은 속도를 조절하고 있다", AUDIENCE_RELATION_CHANGED: "문화예술을 만나는 방식이 달라지고 있다",
  MIXED: "한 가지 상태로 말하기 어렵다",
};

const VISIBILITY_STATE_LABELS = {
  VISIBLE_ACTIVE: "활동과 외부 발표가 함께 이어졌다", ACTIVE_LESS_VISIBLE: "활동은 이어졌고 외부 발표는 줄었다",
  ROLE_SHIFT: "역할·매체·활동 방식이 달라졌다", PROJECT_ONLY: "특정 프로젝트가 있을 때 활동했다",
  LIFE_ADJUSTED: "생활 조건에 맞추어 속도를 조절했다", DISTANCED: "한동안 현장에서 거리를 두었다",
  AUDIENCE_VISIBLE_ACTIVE: "관심과 현장 참여가 함께 이어졌다", AUDIENCE_INTEREST_LESS_VISIT: "관심은 이어졌고 실제 방문은 줄었다",
  AUDIENCE_ONLINE_SHIFT: "온라인·출판·영상으로 만나는 비중이 커졌다", AUDIENCE_COMPANION_BASED: "친구·가족·학교와 함께할 때 주로 참여했다",
  AUDIENCE_CONDITION_ADJUSTED: "비용·시간·이동에 맞추어 참여했다", AUDIENCE_DISTANCED: "한동안 문화예술 현장과 거리를 두었다",
  UNKNOWN: "한 가지로 말하기 어렵다",
};

const CREATIVE_STATE_LABELS = {
  STEADY: "비교적 꾸준히 이어가고 있다",
  SEASONAL: "시기와 상황에 따라 이어가고 있다",
  RESEARCH_RECORD: "준비·조사·기록을 중심으로 이어가고 있다",
  PAUSED: "현재 잠시 쉬고 있다",
  SHIFTED: "이전과 다른 역할이나 방식으로 이동하고 있다",
  CLOSED: "작품 제작이나 해당 활동을 마무리했다고 느낀다",
  MIXED: "한 가지 상태로 말하기 어렵다",
  AUDIENCE_ACTIVE: "비교적 꾸준히 찾아보고 참여하고 있다",
  AUDIENCE_OCCASIONAL: "시기와 상황에 따라 찾아보고 참여하고 있다",
  AUDIENCE_DISTANCED: "현재는 문화예술 현장과 거리를 두고 있다",
};

const PUBLIC_STATE_LABELS = {
  MAKING_AND_SHOWING: "제작과 공개 활동이 함께 이어지고 있다",
  MAKING_NOT_SHOWING: "제작이나 핵심 활동은 이어지지만 공개 활동은 쉬고 있다",
  SHOWING_PROJECT_BASED: "프로젝트가 있을 때 공개 활동을 이어가고 있다",
  PUBLIC_ROLE_SHIFT: "발표·전시 외의 역할로 공개 활동이 달라졌다",
  BOTH_PAUSED: "제작과 공개 활동 모두 잠시 쉬고 있다",
  NOT_WANTED: "현재는 공개 활동을 계획하지 않고 있다",
  AUDIENCE_REGULAR: "전시·프로그램에 비교적 꾸준히 참여하고 있다",
  AUDIENCE_OCCASIONAL: "시기와 상황에 따라 참여하고 있다",
  AUDIENCE_ONLINE: "온라인·출판·기록을 중심으로 만나고 있다",
  AUDIENCE_PAUSED: "현재는 관람과 참여를 쉬고 있다",
  MIXED: "한 가지 상태로 말하기 어렵다",
};

const PAUSE_REASON_LABELS = {
  LIVELIHOOD: "생계와 다른 일의 비중",
  CARE: "돌봄과 가족의 시간",
  HEALTH: "건강과 회복의 시간",
  COST: "제작비·발표비·이동비",
  SPACE: "작업·연습·보관 공간",
  ADMIN: "행정과 역할 부담",
  OPPORTUNITY: "전시·발표·참여 기회",
  RELATIONSHIP: "관계망과 협업 조건",
  REGION: "지역과 이동의 조건",
  DIRECTION: "작업 방향을 충분히 살필 여유",
  CHOICE: "개인적인 선택과 우선순위",
  DAILY_SCHEDULE: "일상과 학업·일의 일정", COST_MOVE: "비용과 이동", COMPANION: "함께 갈 사람",
  INFORMATION: "작품과 프로그램 정보", LANGUAGE_GUIDE: "언어와 설명의 방식", COMFORT: "공간에 들어갈 때의 편안함",
  ONLINE: "온라인으로 만나는 경로", OTHER: "직접 적은 조건",
};

const PAUSE_MEANING_LABELS = {
  REST: "회복과 정비",
  PREPARATION: "준비와 탐구",
  LONG_RESEARCH: "지속과 축적",
  TRANSITION: "역할과 방식의 전환",
  DISTANCE: "거리와 재조정",
  CLOSURE: "마무리와 이동",
  AUDIENCE_DAILY_INTEREST: "일상 속 관심", AUDIENCE_DISCOVERY: "새로운 발견",
  AUDIENCE_SHARED: "함께 나누는 관계", AUDIENCE_HYBRID: "온라인과 현장의 교차",
  AUDIENCE_CHANGE: "취향과 관점의 변화", UNDECIDED: "여러 상태가 함께 있음",
};

const SUPPORT_LABELS = {
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
  SELF_PACE: "스스로 조절한 속도와 선택", TIME_COST_MOVE: "비용·일정·이동의 여유",
  GUIDE: "쉬운 정보와 안내", ONLINE_MEDIA: "온라인·출판·영상", RECOMMENDATION: "다른 사람의 추천",
  NONE: "특별히 떠오르는 조건이 없음",
  OTHER: "직접 적은 조건",
};

const LANGUAGE_LABELS = {
  ko: "한국어", en: "English", ja: "日本語", "zh-Hans": "简体中文", "zh-Hant": "繁體中文",
  nl: "Nederlands", es: "Español", fr: "Français", ms: "Bahasa Melayu",
};

const EN_LABELS = {
  SELF: "my own practice and continuity", MEMORY: "a remembered artist, work, place, or scene", BOTH: "my practice and a memory of someone else", AUDIENCE: "arts and culture experienced as an audience member",
  ARTIST: "a person or artist", WORK_OBJECT: "a work, object, image, or performance", SPACE: "a place", EXHIBITION: "an exhibition or event", SCENE: "a scene", PHRASE: "a phrase that remains", SENSATION: "a feeling that is hard to name", PRACTICE: "a practice, activity, or long-held interest", SELF_PRACTICE: "my own practice and activity", NO_RECALL: "no specific subject comes to mind",
  ACTIVE_MAIN: "a main activity", ACTIVE_PARALLEL: "alongside other work", PROJECT_BASED: "around particular projects", ROLE_CHANGED: "through a changed role or way of working", PACE_ADJUSTED: "at an adjusted pace", DISTANCED: "at some distance from the field", MIXED: "difficult to describe in one way",
  AUDIENCE_SELF_DIRECTED: "self-directed when interest arises", AUDIENCE_WITH_OTHERS: "through friends, family, classes, or recommendations", AUDIENCE_CROSS_MEDIA: "alongside film, performance, comics, design, or online content", AUDIENCE_EVENT_BASED: "when exhibitions or programmes are available", AUDIENCE_PACE_ADJUSTED: "at an adjusted pace after a more frequent period", AUDIENCE_RELATION_CHANGED: "in a changing way",
  VISIBLE_ACTIVE: "activity and public presentation continuing together", ACTIVE_LESS_VISIBLE: "activity continuing with less public presentation", ROLE_SHIFT: "a changed role, medium, or way of working", PROJECT_ONLY: "particular projects", LIFE_ADJUSTED: "an adjusted pace around life conditions", AUDIENCE_VISIBLE_ACTIVE: "interest and in-person participation continuing together", AUDIENCE_INTEREST_LESS_VISIT: "interest continuing while visits have become less frequent", AUDIENCE_ONLINE_SHIFT: "a growing use of online, published, and video paths", AUDIENCE_COMPANION_BASED: "participation mainly with friends, family, or school", AUDIENCE_CONDITION_ADJUSTED: "participation adjusted around cost, time, and travel", AUDIENCE_DISTANCED: "a period of distance from arts and culture",
  STEADY: "fairly steady", SEASONAL: "varying with time and circumstances", RESEARCH_RECORD: "centred on preparation, research, or records", PAUSED: "currently paused", SHIFTED: "moving into a different role or way of working", CLOSED: "feeling that the work or activity has come to an end", AUDIENCE_ACTIVE: "fairly steady", AUDIENCE_OCCASIONAL: "varying with time and circumstances",
  MAKING_AND_SHOWING: "making and public presentation continuing together", MAKING_NOT_SHOWING: "core activity continuing while public presentation is paused", SHOWING_PROJECT_BASED: "public activity around particular projects", PUBLIC_ROLE_SHIFT: "public activity changing beyond presentation or exhibition", BOTH_PAUSED: "both activity and public presentation currently paused", NOT_WANTED: "not planning public presentation at present", AUDIENCE_REGULAR: "fairly steady", AUDIENCE_ONLINE: "centred on online, published, or recorded encounters", AUDIENCE_PAUSED: "currently paused",
  LIVELIHOOD: "livelihood and other work", CARE: "care and family time", HEALTH: "health and recovery", COST: "production, presentation, or travel costs", SPACE: "space for working, practising, or storing", ADMIN: "administrative and role demands", OPPORTUNITY: "opportunities for exhibition, presentation, or participation", RELATIONSHIP: "networks and collaboration", REGION: "place and travel", DIRECTION: "time to consider direction", CHOICE: "personal choices and priorities", DAILY_SCHEDULE: "daily, study, and work schedules", COST_MOVE: "cost and travel", COMPANION: "someone to go with", INFORMATION: "information about works and programmes", LANGUAGE_GUIDE: "language and ways of explaining", COMFORT: "comfort in entering a space", ONLINE: "online routes", OTHER: "a condition named by the participant",
  REST: "rest and recovery", PREPARATION: "preparation and inquiry", LONG_RESEARCH: "continuity and accumulation", TRANSITION: "a shift in role or approach", DISTANCE: "distance and readjustment", CLOSURE: "closure and movement onward", AUDIENCE_DAILY_INTEREST: "everyday interest", AUDIENCE_DISCOVERY: "new discovery", AUDIENCE_SHARED: "shared connection", AUDIENCE_HYBRID: "a meeting of online and in-person paths", AUDIENCE_CHANGE: "a change in taste and perspective", UNDECIDED: "several states at once",
  PEOPLE: "people who went together", AUDIENCE: "audience members and participants", INCOME: "income that supports everyday life", OTHER_WORK: "other work and roles", INSTITUTION: "institutions and support", EDUCATION: "education, research, and learning", RECORD: "records, materials, and archives", FAMILY_CARE: "family and care relationships", MEMORY: "memory and a long-held question", SELF_PACE: "a self-chosen pace", TIME_COST_MOVE: "time, cost, and travel room", GUIDE: "clear information and guidance", ONLINE_MEDIA: "online, published, and video media", RECOMMENDATION: "another person's recommendation", NONE: "no particular condition comes to mind",
};

const EN_ROUTE_LABELS = {
  SELF: "my own practice and continuity",
  MEMORY: "a remembered artist, work, place, or scene",
  BOTH: "my practice and a memory of someone else",
  AUDIENCE: "arts and culture experienced as an audience member",
};

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const array = (value) => Array.isArray(value) ? value : value ? [value] : [];
const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

function dateLabel(value, language = "ko") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value) || "—";
  const locale = { ko: "ko-KR", en: "en-GB", ja: "ja-JP", "zh-Hans": "zh-CN", "zh-Hant": "zh-TW", fr: "fr-FR", es: "es-ES", nl: "nl-NL", ms: "ms-MY" }[language] || "en-GB";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function documentLabel(labels, value, english = false) {
  const raw = value === "OTHER" ? "OTHER" : value;
  return english ? EN_LABELS[raw] || labels[raw] || "" : labels[raw] || "";
}

function labels(values, map, other = "") {
  const result = array(values).map((value) => map[value]).filter(Boolean);
  if (array(values).includes("OTHER") && clean(other)) result.push(clean(other));
  return [...new Set(result)];
}

function sentenceList(items) {
  const values = array(items).map(clean).filter(Boolean);
  if (!values.length) return "";
  return values.join(" · ");
}

function displayName(answers = {}, frame = responseDocumentFrame("ko")) {
  if (answers.display_name_mode === "ANONYMOUS") return frame.anonymous;
  return clean(answers.display_name) || frame.unnamed;
}

function roleText(answers = {}, english = false) {
  if (!answers.role_primary) return "";
  const roleLabels = english ? ROLE_LABELS_EN : ROLE_LABELS;
  const primary = answers.role_primary === "OTHER" ? clean(answers.role_primary_other) || roleLabels.OTHER : roleLabels[answers.role_primary] || answers.role_primary;
  const parallel = array(answers.roles_parallel).filter((value) => value !== "NONE").map((value) => value === "OTHER" ? clean(answers.roles_parallel_other) || roleLabels.OTHER : roleLabels[value] || value);
  return [primary, ...parallel].filter(Boolean).join(" · ");
}

function locationText(answers = {}, frame = responseDocumentFrame("ko")) {
  const places = [];
  const residence = [clean(answers.residence_country_code), clean(answers.residence_city)].filter(Boolean).join(" · ");
  if (residence) places.push(residence);
  for (const item of array(answers.activity_locations)) {
    const label = clean(item?.label || item);
    if (label) places.push(label);
  }
  return [...new Set(places)].join(" · ") || frame.unspecified;
}

function originSection(answers = {}, english = false) {
  const lines = [];
  if (ROUTE_LABELS[answers.route]) lines.push(english ? `This record begins with ${EN_ROUTE_LABELS[answers.route] || documentLabel(ROUTE_LABELS, answers.route, true)}.` : `이번 기록은 ${ROUTE_LABELS[answers.route]}에서 시작했다.`);
  if (MEMORY_TYPE_LABELS[answers.memory_type]) lines.push(english ? `The selected starting point was ${documentLabel(MEMORY_TYPE_LABELS, answers.memory_type, true)}.` : `출발점으로 고른 대상은 ${MEMORY_TYPE_LABELS[answers.memory_type]}이다.`);
  if (clean(answers.memory_clue_text)) lines.push(clean(answers.memory_clue_text));
  if (clean(answers.memory_meaning_text)) lines.push(clean(answers.memory_meaning_text));
  return lines;
}

function isAudience(answers = {}) {
  return answers.route === "AUDIENCE" || answers.response_position === "AUDIENCE_CITIZEN";
}

function presentSection(answers = {}, english = false) {
  const lines = [];
  const audience = isAudience(answers);
  const role = roleText(answers, english);
  if (role) lines.push(english ? `The participation position named in this record is ${role}.` : `이번 응답의 활동·참여 위치는 ${role}이다.`);
  if (CREATIVE_STATE_LABELS[answers.creative_work_state]) lines.push(audience
    ? (english ? `At present, seeking out arts and culture is closest to “${documentLabel(CREATIVE_STATE_LABELS, answers.creative_work_state, true)}”.` : `현재 문화예술을 찾아보는 흐름은 ‘${CREATIVE_STATE_LABELS[answers.creative_work_state]}’에 가깝다.`)
    : (english ? `At present, the main activity is closest to “${documentLabel(CREATIVE_STATE_LABELS, answers.creative_work_state, true)}”.` : `현재 작품 제작이나 핵심 활동은 ‘${CREATIVE_STATE_LABELS[answers.creative_work_state]}’에 가깝다.`));
  if (PUBLIC_STATE_LABELS[answers.public_activity_state]) lines.push(audience
    ? (english ? `Participation in exhibitions and programmes is closest to “${documentLabel(PUBLIC_STATE_LABELS, answers.public_activity_state, true)}”.` : `현재 실제 관람과 참여는 ‘${PUBLIC_STATE_LABELS[answers.public_activity_state]}’에 가깝다.`)
    : (english ? `Public activity is closest to “${documentLabel(PUBLIC_STATE_LABELS, answers.public_activity_state, true)}”.` : `현재 공개 활동이나 문화예술 참여는 ‘${PUBLIC_STATE_LABELS[answers.public_activity_state]}’에 가깝다.`));
  const activity = documentLabel(ACTIVITY_STATE_LABELS, answers.activity_state, english);
  const visibility = documentLabel(VISIBILITY_STATE_LABELS, answers.visibility_state, english);
  if (activity) lines.push(audience ? (english ? `The usual way of meeting arts and culture is closest to “${activity}”.` : `평소 문화예술을 만나는 방식은 ‘${activity}’에 가깝다.`) : (english ? `The current activity flow is closest to “${activity}”.` : `현재 활동의 흐름은 ‘${activity}’에 가깝다.`));
  if (visibility) lines.push(audience ? (english ? `The relationship between interest and participation is closest to “${visibility}”.` : `그동안 관심과 실제 참여의 관계는 ‘${visibility}’에 가깝다.`) : (english ? `The relationship between activity and public visibility is closest to “${visibility}”.` : `그동안 활동과 외부 가시성의 관계는 ‘${visibility}’에 가깝다.`));
  return lines;
}

function backgroundSection(answers = {}, english = false) {
  const lines = [];
  if (clean(answers.transition_text)) lines.push(clean(answers.transition_text));
  const reasons = array(answers.pause_context_tags).map((value) => documentLabel(PAUSE_REASON_LABELS, value, english)).filter(Boolean);
  if (array(answers.pause_context_tags).includes("OTHER") && clean(answers.pause_context_other)) reasons.push(clean(answers.pause_context_other));
  if (reasons.length) lines.push(isAudience(answers)
    ? (english ? `Conditions in the background include ${sentenceList(reasons)}.` : `문화예술을 찾아보고 참여하는 흐름에는 ${sentenceList(reasons)}의 조건이 함께 있었다.`)
    : (english ? `Conditions in the background include ${sentenceList(reasons)}.` : `현재 상태에는 ${sentenceList(reasons)}의 조건이 함께 작용했다.`));
  if (PAUSE_MEANING_LABELS[answers.pause_meaning]) lines.push(english ? `The current relationship feels closest to “${documentLabel(PAUSE_MEANING_LABELS, answers.pause_meaning, true)}”.` : `참여자는 현재의 관계를 ‘${PAUSE_MEANING_LABELS[answers.pause_meaning]}’에 가깝게 보고 있다.`);
  if (clean(answers.pause_context_text)) lines.push(clean(answers.pause_context_text));
  return lines;
}

function continuitySection(answers = {}, english = false) {
  const lines = [];
  if (clean(answers.invisible_continuity_text)) lines.push(clean(answers.invisible_continuity_text));
  else if (answers.invisible_continuity_state === "NO") lines.push(english ? "It is difficult to name an interest that continued during the period of fewer visits." : (isAudience(answers) ? "관람이 줄었던 때에도 이어진 관심은 지금 떠올리기 어렵다고 답했다." : "밖으로 드러나지 않았던 때에 이어진 활동을 지금은 떠올리기 어렵다고 답했다."));
  else if (answers.invisible_continuity_state === "UNSURE") lines.push(english ? "The continuity of interest at that time remains difficult to describe clearly." : (isAudience(answers) ? "관람이 줄었던 때의 관심을 지금은 분명하게 말하기 어렵다고 답했다." : "밖에서 잘 보이지 않았던 활동의 이어짐을 지금은 분명하게 말하기 어렵다고 답했다."));
  return lines;
}

function supportSection(answers = {}, english = false) {
  const lines = [];
  const supports = array(answers.support_conditions).map((value) => documentLabel(SUPPORT_LABELS, value, english)).filter(Boolean);
  if (array(answers.support_conditions).includes("OTHER") && clean(answers.support_conditions_other)) supports.push(clean(answers.support_conditions_other));
  if (supports.length) lines.push(isAudience(answers)
    ? (english ? `Conditions that have made it easier to seek out and remember arts and culture include ${sentenceList(supports)}.` : `문화예술을 찾아보고 기억하는 데 중요했던 조건은 ${sentenceList(supports)}이다.`)
    : (english ? `Conditions that have supported activity and participation include ${sentenceList(supports)}.` : `활동과 참여를 지지해 온 조건은 ${sentenceList(supports)}이다.`));
  if (clean(answers.support_conditions_text)) lines.push(clean(answers.support_conditions_text));
  return lines;
}

function needSection(answers = {}, english = false) {
  const lines = [];
  if (clean(answers.desired_change_text)) lines.push(clean(answers.desired_change_text));
  if (clean(answers.d_context_impact_text)) lines.push(clean(answers.d_context_impact_text));
  return lines;
}

const AXIS_TEXT = {
  M1: "느낌과 분위기", M2: "삶과 기억", M3: "작품의 생각과 표현", M4: "사람과 사회",
  S1: "확장", S2: "지속", S3: "전환", S4: "거리와 한계",
  D1: "접근과 참여", D2: "개인의 기반", D3: "관계와 매개", D4: "제도와 구조",
};

const AXIS_TEXT_EN = {
  M1: "Feeling and atmosphere", M2: "Life and memory", M3: "Ideas and expression", M4: "People and society",
  S1: "Expansion", S2: "Continuity", S3: "Transition", S4: "Distance and limits",
  D1: "Access and participation", D2: "Personal foundations", D3: "Relationships and mediation", D4: "Institutions and structures",
};

function recordCoordinate(answers = {}) {
  const snapshot = answers.coordinate_snapshots?.participant_final || answers.coordinate_snapshots?.research_derived || answers.coordinate_snapshots?.fixed || {};
  const m = answers.participant_m || snapshot.m_primary || answers.depth_m || answers.m_declared;
  const s = answers.participant_s || snapshot.s_primary || answers.depth_s;
  const d = answers.participant_d || snapshot.d_primary || answers.depth_d || answers.d_desired_change_primary;
  const mi = Number(String(m || "").replace("M", ""));
  const si = Number(String(s || "").replace("S", ""));
  const di = Number(String(d || "").replace("D", ""));
  const number = [mi, si, di].every((v) => v >= 1 && v <= 4) ? (mi - 1) * 16 + (si - 1) * 4 + di : null;
  return { m, s, d, number };
}

function safeSection(id, number, title, lines, emptyText) {
  const paragraphs = array(lines).map(clean).filter(Boolean);
  return { id, number, title, paragraphs: paragraphs.length ? paragraphs : [emptyText] };
}

export function buildResponseDocument({
  responseId,
  answers = {},
  sourceLanguage = "ko",
  displayLanguage = sourceLanguage,
  releaseVersion = "",
  approvedOriginal = "",
  approvedKorean = "",
  createdAt = new Date().toISOString(),
  confirmedAt = null,
  final = false,
} = {}) {
  // The answer's original language and the visible document frame are
  // intentionally separate: switching interface language must not rewrite
  // original text, but must localize document labels and guidance.
  const frameLanguage = displayLanguage || sourceLanguage || "ko";
  const english = frameLanguage === "en";
  const copy = english ? {
    title: "〈Over 39〉 Participation Record",
    subtitle: "A record of remembering and continuing with arts and culture",
    descriptionAudience: "This record brings together a remembered scene, ways of encountering arts and culture now, and the conditions that make participation possible.",
    descriptionOther: "This record brings together experiences of remembering and continuing with arts and culture, the current flow, and the conditions that matter for continuing.",
    confirmation: "This record gathers what you have shared in an order that is easy to revisit. You may revise the words that need changing.",
    original: "Original · ", koreanTranslation: "Korean translation", translationReady: "Prepared from the original", translationPending: "Translation in preparation",
    coordinateTitle: "The three directions your record reaches", coordinatePending: "The three directions are being gathered", coordinateText: "We brought together the meaning of the memory, the current flow, and the conditions for continuing to mark the position closest to this record.",
    summary: "Response summary", promiseTitle: "We keep your record", promise: ["We will stay with the memories and the stories of the present gathered here.", "As different records accumulate, what we remember and which conditions we need can become clearer.", "We will carry these records into conversations about cultural institutions and policy wherever that is possible.", "We will remember the story you have left here."],
  } : {
    title: "〈만 39세 이상〉 참여 기록",
    subtitle: "문화예술을 기억하고 이어온 경험",
    descriptionAudience: "관객으로서 기억한 장면과 문화예술을 만난 방식, 참여를 이어가게 한 조건을 한곳에 모았습니다.",
    descriptionOther: "문화예술을 기억하고 이어온 경험, 현재의 흐름과 필요한 조건을 한곳에 모았습니다.",
    confirmation: "이 기록은 지금까지 적은 내용을 참여자가 읽기 쉬운 순서로 정리한 문서입니다. 필요한 문장은 다시 고칠 수 있습니다.",
    original: "원문 · ", koreanTranslation: "한국어 번역", translationReady: "원문을 기준으로 작성", translationPending: "번역 대기",
    coordinateTitle: "당신의 기록이 닿은 세 방향", coordinatePending: "세 방향을 정리하는 중", coordinateText: "기억의 의미, 현재의 흐름, 이어가기 위한 조건을 함께 확인해 이번 기록과 가까운 위치를 정리했습니다.",
    summary: "응답 정리", promiseTitle: "당신의 기록을 남깁니다", promise: ["여기 적힌 기억과 지금의 이야기를 오래 살펴보겠습니다.", "서로 다른 기록들이 쌓이면 우리가 무엇을 기억하고, 어떤 조건을 필요로 하는지도 조금씩 선명해집니다.", "이 기록들이 앞으로 문화예술의 제도와 정책을 이야기하는 자리까지 이어질 수 있도록 계속 가져가겠습니다.", "당신이 남긴 이야기를 기억하겠습니다."],
  };
  const frame = responseDocumentFrame(frameLanguage);
  if (frameLanguage !== "ko" && frameLanguage !== "en") Object.assign(copy, frame);
  const original = clean(approvedOriginal);
  const korean = clean(approvedKorean) || (sourceLanguage === "ko" ? original : "");
  const participantName = displayName(answers, frame);
  const sourceLabel = LANGUAGE_LABELS[sourceLanguage] || sourceLanguage || frame.unspecified;
  const isKoreanSource = sourceLanguage === "ko";
  const audience = isAudience(answers);
  const documentDescription = audience ? copy.descriptionAudience : copy.descriptionOther;
  const confirmationText = copy.confirmation;
  const summaryParagraphs = [];
  // The final document shows the confirmed text itself, not the editing process
  // that led to it. Draft/approved provenance remains in the response snapshot.
  if (original) summaryParagraphs.push({ label: `${copy.original}${sourceLabel}`, text: original, status: "" });
  if (sourceLanguage !== "ko") summaryParagraphs.push({ label: copy.koreanTranslation, text: korean || (english ? "Korean translation in preparation" : copy.translationPending), status: korean ? copy.translationReady : copy.translationPending });
  const coordinate = recordCoordinate(answers);
  const axisText = frameLanguage === "ko" ? AXIS_TEXT : frameLanguage === "en" ? AXIS_TEXT_EN : frame.axis;
  const coordinateAxes = [axisText[coordinate.m], axisText[coordinate.s], axisText[coordinate.d]].filter(Boolean).join(" × ");
  const coordinateLine = [coordinateAxes || copy.coordinatePending, copy.coordinateText];
  const sectionTitles = english
    ? { origin: audience ? "A remembered encounter" : "Where this record begins", present: audience ? "Arts and culture in the present" : "Current practice and arts and culture", background: "Conditions in the background", continuity: "What has continued", support: "What has supported it", needs: "Conditions for continuing" }
    : { origin: audience ? "관객의 기억과 판단" : "이번 응답의 출발점", present: audience ? "현재의 관람과 문화예술의 관계" : "현재의 활동과 문화예술의 관계", background: audience ? "관람과 참여의 흐름에 함께 있던 조건" : "현재 상태가 형성된 배경", continuity: audience ? "전시장 밖에서도 이어진 관심" : "밖으로 드러나지 않아도 이어진 활동", support: audience ? "관심과 참여를 이어가게 한 조건" : "활동과 참여를 지지하는 조건", needs: "이어가기 위한 조건" };
  if (frameLanguage !== "ko" && frameLanguage !== "en") Object.assign(sectionTitles, {
    origin: audience ? frame.audienceOrigin : frame.origin,
    present: audience ? frame.audiencePresent : frame.present,
    background: audience ? frame.audienceBackground : frame.background,
    continuity: audience ? frame.audienceContinuity : frame.continuity,
    support: audience ? frame.audienceSupport : frame.support,
    needs: frame.needs,
  });
  const localizedFallback = (index) => frameLanguage !== "ko" && frameLanguage !== "en" ? frame.fallback[index] : null;
  const foreignLines = (id) => ({
    origin: [answers.memory_clue_text, answers.memory_meaning_text],
    present: [],
    background: [answers.transition_text, answers.pause_context_text],
    continuity: [answers.invisible_continuity_text],
    support: [answers.support_conditions_text],
    needs: [answers.desired_change_text, answers.d_context_impact_text],
  }[id] || []);

  return {
    document_version: RESPONSE_DOCUMENT_VERSION,
    release_version: releaseVersion || null,
    response_id: responseId || "미발급",
    title: copy.title,
    subtitle: copy.subtitle,
    description: documentDescription,
    status: final ? "confirmed" : "draft",
    status_label: final ? (frameLanguage === "ko" ? "저장한 기록" : frameLanguage === "en" ? "Saved record" : frame.statusSaved) : (frameLanguage === "ko" ? "미리보기" : frameLanguage === "en" ? "Preview" : frame.statusDraft),
    brand_label: frameLanguage === "ko" ? "〈만 39세 이상〉 · 참여 기록" : frameLanguage === "en" ? "〈Over 39〉 · PARTICIPATION RECORD" : frame.brand,
    created_at: createdAt,
    confirmed_at: confirmedAt,
    participant: {
      display_name_mode: answers.display_name_mode || "ANONYMOUS",
      display_name: participantName,
    },
    metadata: [
      [frameLanguage === "ko" ? "작성일" : frameLanguage === "en" ? "Date" : frame.date, dateLabel(createdAt, frameLanguage)],
      [frameLanguage === "ko" ? "참여자 표기" : frameLanguage === "en" ? "Participant" : frame.participant, participantName],
      [frameLanguage === "ko" ? "활동 또는 참여 지역" : frameLanguage === "en" ? "Place of activity or participation" : frame.place, locationText(answers, frame)],
      [frameLanguage === "ko" ? "기록 언어" : frameLanguage === "en" ? "Record language" : frame.language, sourceLabel],
    ],
    coordinate: { m: coordinate.m || null, s: coordinate.s || null, d: coordinate.d || null },
    sections: [
      safeSection("origin", "1", sectionTitles.origin, localizedFallback(0) ? foreignLines("origin") : originSection(answers, english), localizedFallback(0) || (english ? "The starting point of this record is gathered from the choices and words shared earlier." : "이번 응답의 출발점은 앞선 선택과 기록을 중심으로 남겼습니다.")),
      safeSection("present", "2", sectionTitles.present, localizedFallback(1) ? foreignLines("present") : presentSection(answers, english), localizedFallback(1) || (english ? "The current state is gathered from the choices shared earlier." : "현재의 활동과 참여 상태는 앞선 선택을 중심으로 기록했습니다.")),
      safeSection("background", "3", sectionTitles.background, localizedFallback(2) ? foreignLines("background") : backgroundSection(answers, english), localizedFallback(2) || (english ? "The background is gathered from the conditions selected earlier." : "현재 상태의 배경은 선택한 조건을 중심으로 기록했습니다.")),
      safeSection("continuity", "4", sectionTitles.continuity, localizedFallback(3) ? foreignLines("continuity") : continuitySection(answers, english), localizedFallback(3) || (english ? "Continuing interests and activities are gathered from the responses shared earlier." : "이어진 활동과 관심은 선택한 응답을 중심으로 남겼습니다.")),
      safeSection("support", "5", sectionTitles.support, localizedFallback(4) ? foreignLines("support") : supportSection(answers, english), localizedFallback(4) || (english ? "The conditions that supported participation are gathered from the choices shared earlier." : "활동과 참여를 지지한 조건은 선택한 응답을 중심으로 남겼습니다.")),
      safeSection("needs", "6", sectionTitles.needs, localizedFallback(5) ? foreignLines("needs") : needSection(answers, english), localizedFallback(5) || (english ? "The conditions for continuing are gathered from the choices shared earlier." : "이어가기 위한 조건은 선택한 항목을 중심으로 기록했습니다.")),
      safeSection("coordinate", "7", copy.coordinateTitle, coordinateLine, copy.coordinatePending),
      { id: "summary", number: "8", title: copy.summary, paragraphs: summaryParagraphs },
      safeSection("promise", "9", copy.promiseTitle, copy.promise, copy.promise.at(-1)),
    ],
    confirmation: confirmationText,
    source_language: sourceLanguage,
    display_language: frameLanguage,
  };
}

export function renderResponseDocument(document = {}) {
  const sections = array(document.sections).map((section) => {
    const body = section.id === "summary"
      ? array(section.paragraphs).map((item) => `<div class="response-document-translation"><span>${esc(item.label)}</span><p>${esc(item.text)}</p>${item.status ? `<small>${esc(item.status)}</small>` : ""}</div>`).join("") || `<p class="response-document-empty">${esc(responseDocumentFrame(document.display_language || document.source_language).summaryEmpty)}</p>`
      : array(section.paragraphs).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
    return `<section class="response-document-section response-document-section-${esc(section.id)}"><div class="response-document-section-head"><span>${esc(section.number)}</span><h3>${esc(section.title)}</h3></div><div class="response-document-section-body">${body}</div></section>`;
  }).join("");
  const metadata = array(document.metadata).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
  return `<article class="response-document-sheet" data-document-status="${esc(document.status)}"><header class="response-document-header"><div><span>${esc(document.brand_label || "〈만 39세 이상〉 · PARTICIPATION RECORD")}</span><h2>${esc(document.title)}</h2><p>${esc(document.subtitle)}</p></div></header><p class="response-document-description">${esc(document.description)}</p><dl class="response-document-metadata">${metadata}</dl>${sections}<footer class="response-document-confirmation"><p>${esc(document.confirmation)}</p></footer></article>`;
}
