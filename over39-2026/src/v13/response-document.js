import { responseDocumentFrame } from "./response-document-i18n.js?v=v7-20260913-r28";
// 연구용 어투 라벨은 이미 research-insights.js 에 있다. 부록에서 새로 지어내면
// 관리자 묶음의 어휘와 어긋나 같은 값이 두 이름으로 불린다(2026-09-09).
import { LABELS as RESEARCH_LABELS } from "./research-insights.js?v=v7-20260913-r28";
import { normalizedDScope } from "./flow.js?v=v7-20260913-r28";
// 설문이 참여자에게 보여준 문구를 부록도 그대로 쓴다. 부록이 자기 사전을 따로 들면
// 같은 값이 두 이름으로 불리고, 사전을 채워도 부록은 비어 있게 된다(2026-09-11).
import { translate } from "./i18n.js?v=v7-20260913-r28";
import { stage1Copy } from "./stage1-i18n.js?v=v7-20260913-r28";
import { task7Copy } from "./task7-i18n.js?v=v7-20260913-r28";

export const RESPONSE_DOCUMENT_VERSION = "over39-participation-record-v0.7.0-layered-approval-2026-08-18";

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
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const array = (value) => Array.isArray(value) ? value : value ? [value] : [];
const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

// memory_branch_followup 은 자유 서술이 아니라 선택지다(app.js renderBranch 는 renderChoices 만
// 쓴다). 값이 선택지 문구 그대로여서 문장처럼 보이므로 이 목록에 섞여 있었고, 부록의
// 「내가 실제로 남긴 말」에 「최근 또는 다음 작업」 같은 조각이 참여자가 쓴 문장으로 실렸다.
// 고른 답이므로 표로 옮긴다(2026-09-09).
// M03 은 memory_type 마다 다른 것을 묻는다("무엇을 먼저 보고 싶나요" / "어떤 의미로 남아
// 있나요" / "지금도 이어지는 부분은"). 표의 칸 이름은 실제로 물은 것을 따라간다 — 하나의
// 뭉뚱그린 이름을 쓰면 무엇에 대한 답인지 알 수 없다(2026-09-09).
const BRANCH_FOLLOWUP_LABELS = {
  ARTIST: "다시 보고 싶은 것", WORK_OBJECT: "다시 살필 때 궁금한 것",
  SPACE: "먼저 찾아보고 싶은 것", EXHIBITION: "다시 살필 때 궁금한 것",
  SCENE: "먼저 확인하고 싶은 것", PHRASE: "그 문장이 지금 남은 의미",
  SENSATION: "먼저 붙이고 싶은 단서", PRACTICE: "지금도 이어지는 부분",
  NO_RECALL: "지금 가장 가까운 상태",
};
const BRANCH_FOLLOWUP_LABELS_EN = {
  ARTIST: "What to see again first", WORK_OBJECT: "What is most curious on a second look",
  SPACE: "What to look for first", EXHIBITION: "What is most curious on a second look",
  SCENE: "What to check first", PHRASE: "What the phrase means now",
  SENSATION: "The first clue to attach", PRACTICE: "What still continues from it",
  NO_RECALL: "Closest state right now",
};

// RC2 가 묻지만 부록에 한 번도 닿지 않던 칸들(2026-09-11 실측). 기억 모듈 전체가
// 그랬다 — 이 연구가 「누구의 기억과 어떤 기록이 다시 확인하게 하는가」를 묻는데
// 정작 그 답(언제·어디서·어떻게 경험했는가·누가 확인해 줄 수 있는가)이 빠져 있었다.
// 값은 스키마의 보기 문구를 그대로 쓴다. appendix-document.test.js 가 스키마 JSON 을
// 직접 읽어 어긋나면 깨뜨린다.
const MEMORY_TIME_LABELS = {
  LT1: "최근 1년", Y1_3: "1~3년 전", Y3_5: "3~5년 전", Y5_10: "5~10년 전",
  Y10_20: "10~20년 전", Y20PLUS: "20년 이상", MULTIPLE: "여러 시기에 걸쳐 이어짐",
  UNKNOWN: "정확히 기억나지 않음",
};
const MEMORY_MODE_LABELS = {
  DIRECT: "현장에서 직접 경험했다", HEARD: "작가나 관계자를 통해 들었다",
  RECORD: "사진·도록·기사·영상으로 접했다", ONLINE: "온라인에서 접했다",
  MIXED: "직접 경험과 기록을 함께 가지고 있다", UNCLEAR: "오래되어 분명하게 구분하기 어렵다",
};
const MEMORY_RELATION_LABELS = {
  OWN_ACTIVITY: "나의 활동이나 작업과 직접 연결", COLLAB: "함께 작업하거나 협업",
  PEER: "동료나 같은 현장의 관계로 지켜봄", EDU_RESEARCH_MEDIA: "교육·연구·취재 과정에서 접함",
  AUDIENCE: "관객이나 참여자로 경험", RECORD_ONLY: "기록이나 다른 사람의 말을 통해",
  PERSONAL: "개인적인 관계가 있다", MIXED: "한 가지로 말하기 어렵다",
};
const WITNESS_ROLE_LABELS = {
  ARTIST_SELF: "작가 본인", PEER: "동료", CURATOR: "기획자", SPACE: "공간 운영자",
  CRITIC_RESEARCHER: "비평가·연구자", AUDIENCE: "관객", FAMILY_FRIEND: "가족·지인",
  INSTITUTION: "기관 관계자", OTHER: "기타", NONE: "지금은 떠오르지 않음",
};
const MEMORY_SUPPORT_LABELS = {
  WORK: "작품이나 이미지", ATTITUDE: "작가의 태도", DIALOGUE: "당시 나눈 대화",
  SPACE: "공간의 분위기", PEOPLE: "함께 있었던 사람", RECORD: "사진·도록·포스터·기사",
  SOCIAL: "지역이나 사회의 상황", LIFE: "당시의 내 삶", SENSORY: "설명하기 어려운 감각",
  UNKNOWN: "잘 모르겠다",
};
const ACTIVITY_DURATION_LABELS = {
  LT1: "1년 미만", Y1_3: "1~3년", Y3_5: "3~5년", Y5_10: "5~10년",
  Y10_20: "10~20년", Y20_30: "20~30년", Y30_PLUS: "30년 이상",
  DIFFICULT: "정확한 시기를 말하기 어려움", SKIP: "응답하지 않음",
};
// R01 은 설문이 심층인터뷰 대상을 고르는 통로다 — INTERVIEW 를 고른 사람이 그 후보다.
const RECONNECT_LABELS = {
  INTERVIEW: "인터뷰", EXHIBITION: "전시", PUBLICATION: "출판",
  CRITIC_RESEARCH: "비평·연구", ARCHIVE: "온라인 아카이브", ROUNDTABLE: "라운드테이블",
  AUDIO_VIDEO: "음성·영상 기록", INTERNATIONAL_DIALOGUE: "다른 지역·국가의 사람과의 대화",
  UNKNOWN: "아직 잘 모르겠다",
};

// 영어 판 라벨. 앞서 P16·P11·P13·P05·R01 을 한국어 사전만 보고 넣어, 영어 문서에
// 한국어 값이 찍히고 칸 이름은 undefined 가 됐다(2026-09-11 실측). 스키마 보기 문구를
// 옮긴 것이며, appendix-document.test.js 가 한국어 사전과 열쇠가 맞는지 대조한다.
const EN_PAUSE_REASON_LABELS = {
  LIVELIHOOD: "Livelihood and other work", CARE: "Care and family time",
  HEALTH: "Health and recovery", COST: "Production, presentation and travel costs",
  SPACE: "Studio, rehearsal and storage space", ADMIN: "Administration and role burden",
  OPPORTUNITY: "Opportunities to exhibit, present and take part",
  AGE_ELIGIBILITY_END: "End of the young-artist funding age limit",
  RELATIONSHIP: "Networks and terms of collaboration", REGION: "Region and mobility",
  DIRECTION: "Time to consider direction", CHOICE: "Personal choice and priorities",
  DAILY_SCHEDULE: "Daily life, study and work time", COST_MOVE: "Cost and travel",
  COMPANION: "Someone to go with", INFORMATION: "Information about works and programmes",
  LANGUAGE_GUIDE: "Language and how things are explained",
  COMFORT: "Feeling at ease entering the space", ONLINE: "Ways of meeting it online",
  OTHER: "Other", NONE: "No particular condition at present", UNSURE: "Not sure yet",
};
const EN_TRANSITION_STATE_LABELS = {
  CLEAR: "There was a clear moment", GRADUAL: "It changed gradually",
  MULTIPLE: "It changed several times", CONTINUED: "It continued in a similar flow",
  UNSURE: "Not sure", SKIP: "Skipped",
};
const EN_INVISIBLE_STATE_LABELS = {
  YES: "Something was continuing", MIXED: "Continuing and pausing together",
  NO: "Hard to recall", NO_SUCH_PERIOD: "No such less-visible period", UNSURE: "Not sure",
};
const EN_ACTIVITY_DURATION_LABELS = {
  LT1: "Under 1 year", Y1_3: "1–3 years", Y3_5: "3–5 years", Y5_10: "5–10 years",
  Y10_20: "10–20 years", Y20_30: "20–30 years", Y30_PLUS: "Over 30 years",
  DIFFICULT: "Hard to say exactly", SKIP: "Not answered",
};
const EN_RECONNECT_LABELS = {
  INTERVIEW: "Interview", EXHIBITION: "Exhibition", PUBLICATION: "Publication",
  CRITIC_RESEARCH: "Criticism and research", ARCHIVE: "Online archive",
  ROUNDTABLE: "Roundtable", AUDIO_VIDEO: "Audio and video record",
  INTERNATIONAL_DIALOGUE: "Dialogue with people in other regions or countries",
  UNKNOWN: "Not sure yet",
};

const RAW_PARTICIPANT_TEXT_FIELDS = Object.freeze([
  "memory_clue_text", "no_recall_relation_text", "memory_meaning_text",
  "transition_text", "pause_context_text", "invisible_continuity_text", "support_conditions_text",
  // D04 는 스키마 store 가 d_context_evidence_text 다(app.js:3844 도 그 이름을 쓴다).
  // 부록은 옛 이름만 읽어서 참여자가 D04 에 쓴 문장이 한 줄도 실리지 않았다 — 부록에서
  // 빠진 것은 그만큼 잃은 연구 자료다. 옛 이름은 지난 응답을 위해 함께 둔다(2026-09-09).
  "d_context_evidence_text", "d_context_impact_text",
  "desired_change_text", "coordinate_feedback_text",
  // 「기타」로 직접 적은 문장도 참여자가 쓴 글이다. 표의 many() 는 OTHER 텍스트를 붙이지
  // 않으므로 이 목록에 없으면 인쇄에서 사라진다(2026-09-09).
  "support_conditions_other", "pause_context_other", "d_context_other",
  "witness_role_other", "roles_previous_other", "role_primary_local_title",
  "role_primary_other", "roles_parallel_other", "field_other", "participation_mode_other",
  "activity_form_other", "participation_unit_other", "depth_m_text", "depth_s_text", "depth_d_text",
]);

// 부록에서 문항 ID 는 인용 주소다. 보고서 본문에 「참여 기록 코드 · 문항 ID」로 적으면
// over39_fixed_answers.question_id 와 그대로 맞물린다. 그래서 서술형 답에는 선택형 문항이
// 아니라 서술형 문항의 ID 를 붙여야 한다 — M04 는 선택(m_declared), 원문은 M04_TEXT 다.
// 이 표는 스키마의 store 이름에서 나온다. appendix-document.test.js 가 스키마 JSON 을 직접
// 읽어 어긋나면 깨뜨린다(2026-09-09).
const FIELD_QUESTION_IDS = Object.freeze({
  memory_clue_text: "M02",
  memory_meaning_text: "M04_TEXT",
  no_recall_relation_text: "NO_RECALL_RELATION",
  transition_text: "P12",
  invisible_continuity_text: "P13_TEXT",
  support_conditions_text: "P19_TEXT",
  desired_change_text: "D02_TEXT",
  d_context_evidence_text: "D04",
  pause_context_text: "P18",
  // 「기타」로 직접 적은 문장은 그 문항의 답이다. 주소가 없으면 부록에서 출처를 잃는다.
  support_conditions_other: "P19",
  pause_context_other: "P16",
  d_context_other: "D03",
  witness_role_other: "M10",
  roles_previous_other: "P04",
  role_primary_local_title: "P02",
  roles_parallel_other: "P03",
});

export function rawParticipantWords(answers = {}) {
  const fields = [...RAW_PARTICIPANT_TEXT_FIELDS];
  // AI가 이어서 물은 질문은 답과 짝을 이룰 때만 읽을 수 있다. 답만 남기면 부록에서
  // 그 문장이 무슨 질문에 대한 답인지 알 수 없다(2026-09-09).
  const asked = new Map();
  for (const turn of array(answers.adaptive_turns)) {
    if (!turn?.answer_field) continue;
    fields.push(turn.answer_field);
    const question = clean(turn.question_text || turn.prompt);
    if (question) asked.set(turn.answer_field, question);
  }
  const seen = new Set();
  return fields.flatMap((field) => {
    const value = clean(answers[field]);
    if (!value || seen.has(value)) return [];
    seen.add(value);
    const question = asked.get(field) || null;
    const questionId = FIELD_QUESTION_IDS[field] || (asked.has(field) ? "AI" : null);
    return [{ field, question_id: questionId, text: value, question, source_kind: "participant_raw", editable: "at_source_question", participant_approved: false }];
  });
}

function dateLabel(value, language = "ko") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value) || "—";
  const locale = { ko: "ko-KR", en: "en-GB", ja: "ja-JP", "zh-Hans": "zh-CN", "zh-Hant": "zh-TW", fr: "fr-FR", es: "es-ES", nl: "nl-NL", ms: "ms-MY" }[language] || "en-GB";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// 값의 말은 사슬로 찾는다: 한국어 → (영어면) 손으로 쓴 영어 → 설문 사전 → 비움.
// translate() 는 옮긴 말이 없으면 한국어를 그대로 돌려주므로, 그 경우 칸을 비운다.
// 한국어를 다른 언어 문서에 섞는 것보다 비우는 것이 맞다 — 사전이 채워지면 함께 채워진다.
function localizedValue(koreanLabel, language, englishLabel = "") {
  const ko = clean(koreanLabel);
  if (!ko) return "";
  if (language === "ko") return ko;
  if (language === "en" && clean(englishLabel)) return clean(englishLabel);
  const moved = clean(translate(language, ko));
  return moved && moved !== ko ? moved : "";
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

// 한국어 주격 조사는 이름의 끝소리를 따른다 — 「한지수가」지만 「김철민이」다. 좌표
// 문장에서 이 문제로 한 번 틀렸고(952fabb) 그때는 「의」만 써서 피했는데, 절 제목이
// 「쓴 글」·「확인한 글」이라 주격이 필요하다. 끝소리를 실제로 본다.
//   · 한글 음절: 받침이 있으면 (code - 0xAC00) % 28 !== 0
//   · 라틴 글자: 한국어로 읽었을 때 받침이 있는 것은 L(엘)·M(엠)·N(엔)·R(알)뿐이다
//     (에스·엑스·에이 등은 받침이 없다)
//   · 숫자: 일·삼·육·칠·팔에 받침이 있다
const FINAL_CONSONANT_LATIN = new Set(["L", "M", "N", "R"]);
const FINAL_CONSONANT_DIGIT = new Set(["1", "3", "6", "7", "8"]);

export function hasFinalConsonant(word) {
  const last = clean(word).slice(-1).toUpperCase();
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) return (code - 0xAC00) % 28 !== 0;
  if (FINAL_CONSONANT_LATIN.has(last)) return true;
  if (FINAL_CONSONANT_DIGIT.has(last)) return true;
  return false;
}

// 부록에서는 답을 남긴 사람이 주인공이다 — 「참여자」가 아니라 그가 적어둔 이름을 쓴다
// (TK 2026-09-10). 익명으로 낸 사람은 이름이 없으므로 「참여자」에 기록 번호 앞자리를
// 붙인다. 그냥 「참여자」로 두면 익명 수백 장의 제목이 모두 같아져, 보고서 본문에서
// [기록 번호 · 문항 ID]로 인용해두고도 부록에서 그 장을 제목으로 찾을 수 없다.
function appendixSubject(answers = {}, frame = responseDocumentFrame("ko"), participantCode = "") {
  const named = answers.display_name_mode !== "ANONYMOUS" && clean(answers.display_name);
  if (named) return named;
  const tag = clean(participantCode).split("-")[0];
  return tag ? `${frame.unnamed} ${tag}` : frame.unnamed;
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
    // 덩어리를 그대로 문자열로 만들면 부록에 「[object Object]」가 찍힌다. 완료 화면의
    // 좌표에서 이미 한 번 그렇게 됐다 — 500장짜리 부록에서는 알아차릴 계기가 없으므로
    // 읽을 수 있는 모양(문자열 또는 label)일 때만 넣는다(2026-09-09).
    const raw = typeof item === "string" || typeof item === "number" ? item : item?.label;
    const label = clean(raw);
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
  // 「그렇게 보이지 않던 시기는 따로 없었어요」는 다섯 상태 가운데 유일하게 문서에서
  // 무언(無言)이었다. 계속 드러난 채 이어왔다는 것도 이 사람의 진술이다.
  else if (answers.invisible_continuity_state === "NO_SUCH_PERIOD") lines.push(english ? "There was no period when the activity was less visible; it has stayed in view and continued." : (isAudience(answers) ? "찾고 보는 일이 크게 줄었던 시기는 따로 없이 계속 이어져 왔다고 답했다." : "밖에서 보이지 않던 시기는 따로 없이, 드러난 채로 계속 이어져 왔다고 답했다."));
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

// 모델은 축을 판단할 때 「참여자의 어느 답이 근거인가」를 함께 돌려준다(edge 프롬프트
// index.ts:1019 — 실제 입력에 있는 ID 만 쓰도록 지시한다). 그 값은 depth_summary.evidence
// 에 저장되는데 부록은 읽지 않아, 「연구에서 읽는 세 방향」이 500장 모두 같은 붙박이
// 문장이었다. 지어내지 않고 이미 있는 것을 되돌린다(2026-09-09).
//
// 승인 경계: 참여자가 확인한 것은 정리문 한 절뿐이다. 축 배정과 근거 선택은 참여자가
// 확인한 대상이 아니므로 research_derived 로만 남기고, 인용되는 문장 자체는 원문이다.
const QUESTION_ID_FIELDS = Object.freeze(Object.fromEntries(
  Object.entries(FIELD_QUESTION_IDS).map(([field, id]) => [id, field]),
));

// 부록에 「정리 출처 morph」라고 찍혀 있었다(라이브 통과, 2026-09-09). morph 는 제공자
// 경로의 내부 이름이고 정책연구 부록을 읽는 사람에게는 아무 뜻이 없다. 사람이 읽을
// 이름으로 바꾼다. rules 는 모델이 아니라 규칙 조립이므로 그렇다고 밝힌다 — 어느 쪽이
// 정리했는지가 연구 자료의 출처다.
const READING_SOURCE_NAMES = Object.freeze({
  morph: "Motif 3", motif3: "Motif 3", motif: "Motif",
  groq: "Groq", cerebras: "Cerebras", mistral: "Mistral", openai: "OpenAI",
});

function readingSourceName(source, frame) {
  const key = clean(source);
  if (!key) return "";
  if (key === "rules" || key === "mock_api" || key === "api") return frame.readingSourceRules || key;
  return READING_SOURCE_NAMES[key] || key;
}

// D01(지금 비어 있는 것) · D02(먼저 달라지면 좋을 것) · D03(현실 맥락)의 보기 문구는
// 평면 사전에 없다. 역할과 범위마다 다른 은행에서 나오기 때문이다 — 시각예술가에게 보인
// D01 보기와 기획자에게 보인 D01 보기가 다르다. 평면 사전으로 찍으면 엉뚱한 문구가
// 나오므로, 앱이 보기를 만드는 방식(app.js dOptions · realityOptions)을 그대로 따른다.
// 스키마는 실행 중에 받아오므로 문서를 만들 때 넘겨받는다(2026-09-11).
function dConditionLabel(kind, value, answers = {}, schema = null, language = "ko") {
  const code = clean(value);
  if (!code || !schema) return "";
  const scope = normalizedDScope(answers);
  if (scope === "SELF_ROLE") {
    const bank = schema.role_question_bank?.[answers.role_primary];
    const labels = array(bank?.[kind === "gap" ? "d01_options" : "d02_options"]).slice(0, 4);
    const index = Number(code.replace("D", ""));
    if (index >= 1 && index <= labels.length) return clean(labels[index - 1]);
    const local = stage1Copy(language).task5 || {};
    if (code === "NO_MAJOR_GAP") return clean(local.dNoGap);
    if (code === "NO_SPECIFIC_CHANGE") return clean(local.dNoChange);
    if (code === "UNSURE") return clean(local.dUnsure);
    return "";
  }
  const pairs = array(schema.d_scope_bank?.[scope]?.[kind]);
  const hit = pairs.find((pair) => Array.isArray(pair) && pair[0] === code);
  return hit ? clean(hit[1]) : "";
}

function realityLabels(values, answers = {}, schema = null) {
  if (!schema) return [];
  const scope = normalizedDScope(answers);
  const key = scope === "SELF_ROLE" ? answers.role_primary || "OTHER" : scope;
  const bank = array(schema.role_reality_indicator_bank?.[key]).length
    ? array(schema.role_reality_indicator_bank?.[key])
    : array(schema.role_reality_indicator_bank?.OTHER);
  // 앱이 「기타 … 직접」 보기를 걸러내고 번호를 매기므로 여기서도 같게 걸러야 번호가 맞는다.
  const indicators = bank.filter((label) => !/기타.*직접/.test(String(label)));
  return array(values).map((value) => {
    const code = clean(value);
    if (code === "NONE") return "해당 없음";
    if (code === "OTHER") return clean(answers.d_context_other) || "기타";
    const index = Number(code.slice(-2));
    return index >= 1 && index <= indicators.length ? clean(indicators[index - 1]) : "";
  }).filter(Boolean);
}

function resolveEvidenceId(id, answers = {}) {
  const key = clean(id);
  if (!key) return null;
  // ① AI 가 이어서 물은 턴
  for (const turn of array(answers.adaptive_turns)) {
    if (turn?.id !== key && turn?.question_id !== key) continue;
    const text = clean(answers[turn.answer_field]);
    if (!text) return null;
    return { question_id: "AI", field: turn.answer_field, question: clean(turn.question_text || turn.prompt) || null, text };
  }
  // ② 서술형 고정문항
  const field = QUESTION_ID_FIELDS[key];
  if (field) {
    const text = clean(answers[field]);
    if (text) return { question_id: key, field, question: null, text };
  }
  return null;
}

function axisEvidence(answers = {}, axis = "m") {
  const summary = answers.depth_summary || {};
  const ids = array(summary.evidence?.[axis]);
  const seen = new Set();
  const found = [];
  for (const id of ids) {
    const item = resolveEvidenceId(id, answers);
    if (!item || seen.has(item.field)) continue;
    seen.add(item.field);
    found.push(item);
    if (found.length >= 2) break;
  }
  return found;
}

function safeSection(id, number, title, lines, emptyText) {
  const paragraphs = array(lines).map(clean).filter(Boolean);
  return {
    id,
    number,
    title,
    paragraphs: paragraphs.length ? paragraphs : [emptyText],
    source_kind: "system_organized",
    editable: false,
    approval_scope: "excluded",
    participant_approved: false,
  };
}

// 판 이름에는 개발 중의 이정표가 섞여 있다(rc2-v0.6.1-task9-live-data-local-2026-08-18).
// 코드 안에서는 그 이름이 어느 회차인지 가리키는 표식이라 쓸모가 있지만, 이 문자열은
// 참여 기록의 「문서 판」으로 찍혀 결과보고서 부록 500장에 들어간다. 참여자에게
// 「task9-live-data-local」은 아무 뜻이 없고 실수처럼 보인다(2026-09-13 파일럿).
//
// 저장되는 값은 그대로 두고 — 연구팀이 낱장의 출처를 가리는 근거다 — 보이는 자리에서만
// 이정표 이름을 걷어낸다. 회차·판·날짜는 남는다.
const MILESTONE_SEGMENT = /-task\d+[a-z]*(?:-[a-z]+)*(?=-\d{4}-\d{2}-\d{2}$|$)/iu;
export function participantFacingVersion(version) {
  return String(version || "").replace(MILESTONE_SEGMENT, "");
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
  participantCode = "",
  schema = null,
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
  const task7 = task7Copy(frameLanguage);
  if (frameLanguage !== "ko" && frameLanguage !== "en") Object.assign(copy, frame);
  const original = clean(approvedOriginal);
  const korean = clean(approvedKorean) || (sourceLanguage === "ko" ? original : "");
  const participantName = displayName(answers, frame);
  // 부록에서 이 문서의 주인공. 이름을 남긴 사람은 그 이름, 익명은 「참여자 + 기록
  // 번호 앞자리」다(TK 2026-09-10 · ②안).
  const subject = appendixSubject(answers, frame, participantCode);
  const named = (template) => clean(template)
    .replace("{이가}", hasFinalConsonant(subject) ? "이" : "가")
    .replace("{name}", subject);
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
  // 참여자가 화면에서 본 이름과 코드북 이름이 다르다 — 「느낌과 분위기」 대 「감각·정서」.
  // 화면은 참여자가 방금 고른 말이 맞고, 부록은 코드북 말이 맞다(TK 2026-09-11).
  const codebookText = frameLanguage === "ko"
    ? { ...RESEARCH_LABELS.m_primary, ...RESEARCH_LABELS.s_primary, ...RESEARCH_LABELS.d_primary }
    : axisText;
  const coordinateAxes = [axisText[coordinate.m], axisText[coordinate.s], axisText[coordinate.d]].filter(Boolean).join(" × ");
  const coordinateAxesCodebook = [codebookText[coordinate.m], codebookText[coordinate.s], codebookText[coordinate.d]].filter(Boolean).join(" × ");
  const coordinateLine = [
    { screen: coordinateAxes || copy.coordinatePending, appendix: coordinateAxesCodebook || copy.coordinatePending },
    // 좌표 번호는 부록과 분석 결과를 짝지을 때 쓰인다. 축 이름만으로는 64칸 가운데
    // 어디인지 가릴 수 없다(2026-09-09).
    // 화면에서는 번호가 무엇인지 한 줄로 밝히고, 부록에서는 번호만 둔다 — 부록을 읽는
    // 사람에게는 보고서 서문이 그 일을 한다(TK 2026-09-11).
    ...(coordinate.number ? [{
      screen: `${frame.coordinateNumber.replace("{n}", String(coordinate.number))} · ${frame.coordinateNumberNote}`,
      appendix: frame.coordinateNumber.replace("{n}", String(coordinate.number)),
    }] : []),
  ];

  // 축마다 「무엇으로 읽었는가 → 참여자의 어느 문장이 근거인가」를 붙인다. 붙박이 문장
  // 하나로는 500장에서 아무것도 말하지 못한다(2026-09-09).
  const depthSummary = answers.depth_summary || {};
  const axisReadings = ["m", "s", "d"].flatMap((axis) => {
    const code = coordinate[axis];
    const label = axisText[code];
    if (!code || !label) return [];
    const secondaryCode = clean(depthSummary.secondary_axes?.[axis]);
    return [{
      axis: axis.toUpperCase(),
      title: frame[`axisTitle${axis.toUpperCase()}`] || "",
      code,
      label,
      codebook: codebookText[code] || label,
      secondary: secondaryCode && axisText[secondaryCode]
        ? { code: secondaryCode, label: axisText[secondaryCode], codebook: codebookText[secondaryCode] || axisText[secondaryCode] }
        : null,
      evidence: axisEvidence(answers, axis),
    }];
  });
  // 「11 / 64」는 숫자만으로는 어디인지 알 수 없다. 4행(M) × 16열(S 안의 D) 판에
  // 이 기록의 칸을 찍으면, 500장을 넘길 때 분포가 눈에 들어온다(TK 2026-09-11).
  const coordinateGrid = coordinate.number
    ? Array.from({ length: 4 }, (_, mi) => Array.from({ length: 16 }, (_, rest) => mi * 16 + rest + 1))
    : [];
  const readingSource = readingSourceName(depthSummary.source, frame);
  const readingUncertainty = clean(depthSummary.uncertainty);

  // ⑥ 참여자가 허락한 활용 범위. 부록을 읽는 사람이 인용해도 되는지를 알 수 있어야
  // 한다 — 지금은 문서에 없어서 별도 자료를 찾아봐야 했다(2026-09-09).
  // 선택형 답을 「항목 : 값」으로 놓는다. 서술형은 위쪽 원문 절에 한 번만 둔다.
  const structureRows = (() => {
    const L = frame.rowLabels || {};
    const row = (label, value) => (clean(label) && clean(value) ? [[clean(label), clean(value)]] : []);
    // 값은 한국어 사전을 원본으로 두고 사슬로 옮긴다. 옮긴 말이 없는 칸은 비운다.
    const one = (label, dict, value, enDict) => row(label, localizedValue(dict?.[value], frameLanguage, enDict?.[value]));
    const many = (label, values, dict, enDict) => {
      const list = array(values)
        .map((v) => localizedValue(dict?.[v], frameLanguage, enDict?.[v]))
        .filter(Boolean);
      return list.length ? [[clean(label), list.join(" · ")]] : [];
    };
    const branchLabel = (english ? BRANCH_FOLLOWUP_LABELS_EN : BRANCH_FOLLOWUP_LABELS)[answers.memory_type];
    return [
      ...one(L.route, ROUTE_LABELS, answers.route, EN_ROUTE_LABELS),
      // roleText() 는 주 역할과 겸임을 한 문장으로 합치는데, 겸임은 아래 칸에 따로 있어
      // 같은 값이 두 줄로 나왔다. 주 역할만 두고, 참여자가 직접 적은 직함은 그 말대로
      // 둔다 — 참여자의 글은 옮기지 않는다(2026-09-11).
      ...row(L.role, answers.role_primary === "OTHER"
        ? clean(answers.role_primary_local_title) || localizedValue(ROLE_LABELS.OTHER, frameLanguage, ROLE_LABELS_EN.OTHER)
        : localizedValue(ROLE_LABELS[answers.role_primary], frameLanguage, ROLE_LABELS_EN[answers.role_primary])),
      ...many(L.roles, answers.roles_parallel, ROLE_LABELS, ROLE_LABELS_EN),
      ...one(L.memory, MEMORY_TYPE_LABELS, answers.memory_type, EN_LABELS),
      // M03 은 대상마다 다른 것을 묻는다. 칸 이름은 실제로 물은 것을 따라가고, 그 이름이
      // 없는 언어에서는 「기억에서 이어 고른 답」으로 둔다.
      ...row(frameLanguage === "ko" || english ? (branchLabel || L.branch) : L.branch,
        localizedValue(answers.memory_branch_followup, frameLanguage, english ? answers.memory_branch_followup : "")),
      ...one(L.creative, CREATIVE_STATE_LABELS, answers.creative_work_state, EN_LABELS),
      ...one(L.public, PUBLIC_STATE_LABELS, answers.public_activity_state, EN_LABELS),
      // P16 의 보기 가운데 AGE_ELIGIBILITY_END「청년·신진 지원 연령 기준 종료」가
      // 〈만 39세 이상〉이 물으려는 바로 그것이다.
      ...many(L.realityNow, answers.pause_context_tags, RESEARCH_LABELS.pause_context_tags, EN_PAUSE_REASON_LABELS),
      ...one(L.transition, RESEARCH_LABELS.transition_state, answers.transition_state, EN_TRANSITION_STATE_LABELS),
      ...one(L.invisible, RESEARCH_LABELS.invisible_continuity_state, answers.invisible_continuity_state, EN_INVISIBLE_STATE_LABELS),
      ...many(L.support, answers.support_conditions, SUPPORT_LABELS, EN_LABELS),
      ...one(L.duration, ACTIVITY_DURATION_LABELS, answers.activity_duration_band, EN_ACTIVITY_DURATION_LABELS),
      // R01 은 설문이 심층인터뷰 대상을 고르는 통로다.
      ...many(L.reconnect, answers.reconnect_preferences, RECONNECT_LABELS, EN_RECONNECT_LABELS),
      // D01·D02·D03 의 보기 문구는 스키마 은행에서 나온다(역할·범위마다 다르다). 그 문구도
      // 같은 사슬로 옮기므로, 옮긴 말이 없는 언어에서는 저절로 비워진다.
      ...row(L.gap, localizedValue(dConditionLabel("gap", answers.d_current_gap, answers, schema, "ko"), frameLanguage)),
      ...row(L.change, localizedValue(dConditionLabel("desired", answers.d_desired_change_primary, answers, schema, "ko"), frameLanguage)),
      ...(() => {
        const list = realityLabels(answers.d_context_tags, answers, schema)
          .map((value) => localizedValue(value, frameLanguage)).filter(Boolean);
        return list.length && clean(L.reality) ? [[clean(L.reality), list.join(" · ")]] : [];
      })(),
      // activity_state(P06) · visibility_state(P07) · pause_meaning(P17) 은 RC2 에서 묻지
      // 않는다(flow.js:5-11). 칸을 두면 500장 전부 빈칸이므로 넣지 않는다.
    ];
  })();

  // 기억 모듈은 통째로 부록에 닿지 않고 있었다. 이 연구가 「누구의 기억과 어떤 기록이
  // 다시 확인하게 하는가」를 묻는데, 그 답이 빠져 있으면 부록으로 답할 수 없다.
  const memoryRows = (() => {
    const L = frame.rowLabels || {};
    const row = (label, value) => (clean(label) && clean(value) ? [[clean(label), clean(value)]] : []);
    const one = (label, dict, value) => row(label, localizedValue(dict?.[value], frameLanguage));
    const many = (label, values, dict) => {
      const list = array(values).map((v) => localizedValue(dict?.[v], frameLanguage)).filter(Boolean);
      return list.length ? [[clean(label), list.join(" · ")]] : [];
    };
    // 지역은 참여자가 적은 말이므로 옮기지 않는다.
    const places = [...new Set(array(answers.memory_locations)
      .map((item) => clean(typeof item === "string" || typeof item === "number" ? item : item?.label))
      .filter(Boolean))];
    const year = clean(answers.memory_year_optional);
    const time = localizedValue(MEMORY_TIME_LABELS[answers.memory_time_band], frameLanguage);
    return [
      ...row(L.mTime, year ? `${time}${time ? " · " : ""}${year}` : time),
      ...row(L.mPlace, places.join(" · ")),
      ...many(L.mMode, answers.memory_experience_modes, MEMORY_MODE_LABELS),
      ...one(L.mRelation, MEMORY_RELATION_LABELS, answers.memory_relationship),
      ...row(L.mWitness, answers.witness_role === "OTHER"
        ? clean(answers.witness_role_other)
        : localizedValue(WITNESS_ROLE_LABELS[answers.witness_role], frameLanguage)),
      ...many(L.mSupport, answers.m_support_tags, MEMORY_SUPPORT_LABELS),
    ];
  })();

  const scopeLines = [
    ["policy_research_use", frame.scopeAnalysis],
    ["policy_quote_use", frame.scopeQuote],
    ["public_archive_interest", frame.scopePublic],
  ].flatMap(([field, label]) => {
    const value = clean(answers[field]);
    if (!value) return [];
    return [`${label} · ${frame[value] || value}`];
  });
  const rawWords = rawParticipantWords(answers);
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

  const legacySections = [
    safeSection("origin", "1", sectionTitles.origin, localizedFallback(0) ? foreignLines("origin") : originSection(answers, english), localizedFallback(0) || (english ? "The starting point of this record is gathered from the choices and words shared earlier." : "이번 응답의 출발점은 앞선 선택과 기록을 중심으로 남겼습니다.")),
    safeSection("present", "2", sectionTitles.present, localizedFallback(1) ? foreignLines("present") : presentSection(answers, english), localizedFallback(1) || (english ? "The current state is gathered from the choices shared earlier." : "현재의 활동과 참여 상태는 앞선 선택을 중심으로 기록했습니다.")),
    safeSection("background", "3", sectionTitles.background, localizedFallback(2) ? foreignLines("background") : backgroundSection(answers, english), localizedFallback(2) || (english ? "The background is gathered from the conditions selected earlier." : "현재 상태의 배경은 선택한 조건을 중심으로 기록했습니다.")),
    safeSection("continuity", "4", sectionTitles.continuity, localizedFallback(3) ? foreignLines("continuity") : continuitySection(answers, english), localizedFallback(3) || (english ? "Continuing interests and activities are gathered from the responses shared earlier." : "이어진 활동과 관심은 선택한 응답을 중심으로 남겼습니다.")),
    safeSection("support", "5", sectionTitles.support, localizedFallback(4) ? foreignLines("support") : supportSection(answers, english), localizedFallback(4) || (english ? "The conditions that supported participation are gathered from the choices shared earlier." : "활동과 참여를 지지한 조건은 선택한 응답을 중심으로 남겼습니다.")),
    safeSection("needs", "6", sectionTitles.needs, localizedFallback(5) ? foreignLines("needs") : needSection(answers, english), localizedFallback(5) || (english ? "The conditions for continuing are gathered from the choices shared earlier." : "이어가기 위한 조건은 선택한 항목을 중심으로 기록했습니다.")),
    { ...safeSection("coordinate", "7", copy.coordinateTitle, coordinateLine, copy.coordinatePending), source_kind: "research_derived" },
    { id: "summary", number: "8", title: copy.summary, paragraphs: summaryParagraphs, source_kind: "participant_confirmed_synthesis", editable: true, approval_scope: "participant_synthesis_text_only", participant_approved: true },
    { ...safeSection("promise", "9", copy.promiseTitle, copy.promise, copy.promise.at(-1)), source_kind: "project_information" },
  ];

  return {
    document_version: RESPONSE_DOCUMENT_VERSION,
    release_version: releaseVersion || null,
    response_id: responseId || "미발급",
    title: copy.title,
    // 부록에서는 답을 남긴 사람이 제목이 된다. 화면은 참여자가 자기 기록을 읽는
    // 자리라 연구 이름이 제목인 것이 맞다(TK 2026-09-10).
    appendix_title: named(frame.appendixDocumentTitle),
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
      // 500장을 결과보고서 부록으로 붙일 때 어느 응답인지 가릴 표기다. 문서 밖의
      // 카드에만 있어 인쇄에서 빠졌다(2026-09-09 실측).
      ...(clean(participantCode) ? [[frame.recordCode, clean(participantCode)]] : []),
      [frameLanguage === "ko" ? "작성일" : frameLanguage === "en" ? "Date" : frame.date, dateLabel(createdAt, frameLanguage)],
      ...(confirmedAt ? [[frame.confirmedAt, dateLabel(confirmedAt, frameLanguage)]] : []),
      // 이름은 제목으로 올라갔다. 인쇄에서는 이 줄을 빼되(같은 값이 두 번 나온다)
      // 화면에는 남긴다 — 참여자가 자기 표기를 확인하는 자리다(TK 2026-09-10).
      [frameLanguage === "ko" ? "참여자 표기" : frameLanguage === "en" ? "Participant" : frame.participant, participantName, "participant_name"],
      [frameLanguage === "ko" ? "활동 또는 참여 지역" : frameLanguage === "en" ? "Place of activity or participation" : frame.place, locationText(answers, frame)],
      [frameLanguage === "ko" ? "기록 언어" : frameLanguage === "en" ? "Record language" : frame.language, sourceLabel],
    ],
    // 문서 한 장만 떼어 보아도 어느 연구의 무엇인지 알 수 있게 한다. 500장을 결과
    // 보고서 부록으로 붙이므로, 이 표기가 없으면 낱장의 출처를 가릴 수 없다(2026-09-09).
    archive: {
      kind: frame.archiveKind,
      study: frame.archiveStudy,
      version: releaseVersion ? `${frame.archiveVersion} ${participantFacingVersion(releaseVersion)}` : "",
      statement: frame.archiveStatement,
      credits: [
        [frame.archiveHost, frame.archiveHostValue],
        [frame.archiveLead, frame.archiveLeadValue],
        [frame.archiveResearch, frame.archiveResearchValue],
        [frame.archiveFunder, frame.archiveFunderValue],
      ].filter(([label, value]) => clean(label) && clean(value)),
    },
    coordinate: { m: coordinate.m || null, s: coordinate.s || null, d: coordinate.d || null },
    // `sections` remains for old analysis/export consumers. Participant UI
    // uses `layers`, whose approval metadata matches what was actually read
    // and confirmed.
    sections: legacySections,
    layers: [
      {
        id: "raw_participant_words", title: task7.rawTitle, appendix_title: named(frame.appendixRawTitle), description: task7.rawHelp,
        entries: rawWords, source_kind: "participant_raw", editable: "at_source_question",
        approval_scope: "excluded", participant_approved: false,
      },
      {
        id: "participant_confirmed_synthesis", title: task7.synthesisTitle, appendix_title: named(frame.appendixSynthesisTitle), description: task7.synthesisHelp,
        paragraphs: summaryParagraphs, source_kind: "participant_confirmed_synthesis", editable: true,
        approval_scope: "participant_synthesis_text_only", participant_approved: Boolean(original),
      },
      // ③ 선택형 답. TK 결정(2026-09-09): 산문 절이 아니라 표로 놓는다.
      // 산문으로 풀었을 때 세 가지가 잘못됐다 — 문장인 척하는 틀에서 나온 기계 문장
      // (「~의 조건이 함께 작용했다」), 위쪽 원문 절과 겹치는 서술형 답, 그리고 기억
      // 문장이 「지지하는 조건」 아래로 들어가는 잘못된 배치. 표는 문장인 척하지 않고
      // 칸마다 자기 값만 담으므로 세 문제가 함께 사라진다. 정책연구 부록의 표준
      // 형식이기도 하다. 참여자가 확인한 것은 정리문뿐이므로 research_derived 로 둔다.
      ...(structureRows.length ? [{
        id: "research_structure",
        title: frame.structureTitle,
        appendix_title: frame.appendixStructureTitle,
        description: frame.researchStructureNote,
        rows: structureRows,
        source_kind: "research_derived",
        editable: false,
        approval_scope: "excluded",
        participant_approved: false,
      }] : []),
      ...(memoryRows.length ? [{
        id: "memory_evidence",
        title: frame.rowLabels?.memoryTitle || "기억의 단서",
        appendix_title: frame.rowLabels?.memoryTitle || "기억의 단서",
        description: frame.rowLabels?.memoryNote || "",
        rows: memoryRows,
        source_kind: "research_derived",
        editable: false,
        approval_scope: "excluded",
        participant_approved: false,
      }] : []),
      {
        id: "research_reading", title: task7.researchTitle, appendix_title: frame.appendixReadingTitle, description: task7.researchHelp,
        paragraphs: coordinateLine,
        // 근거는 참여자의 원문을 그대로 인용한다. 배정과 선택은 연구 측 표시다.
        axes: axisReadings,
        coordinate_grid: coordinateGrid,
        coordinate_number: coordinate.number || null,
        reading_source: readingSource || null,
        uncertainty: readingUncertainty || null,
        source_kind: "research_derived", editable: false,
        approval_scope: "excluded", participant_approved: false,
      },
      // ⑥ 참여자가 직접 고른 활용 범위. 부록을 읽는 사람이 인용 가능 여부를 여기서 안다.
      ...(scopeLines.length ? [{
        id: "use_scope",
        title: frame.useScopeTitle,
        appendix_title: frame.appendixScopeTitle,
        description: frame.useScopeNote,
        paragraphs: scopeLines,
        source_kind: "participant_declared",
        editable: false,
        approval_scope: "excluded",
        participant_approved: false,
      }] : []),
    ],
    project_note: {
      title: copy.promiseTitle, paragraphs: copy.promise, source_kind: "project_information",
      editable: false, approval_scope: "excluded", participant_approved: false,
    },
    approval_scope: "participant_synthesis_text_only",
    confirmation: confirmationText,
    source_language: sourceLanguage,
    display_language: frameLanguage,
  };
}

export function renderResponseDocument(document = {}) {
  const frame = responseDocumentFrame(document.display_language || document.source_language);
  const task7 = task7Copy(document.display_language || document.source_language);
  const layers = array(document.layers);
  // 부록 인쇄에서 왼쪽(참여자가 쓰고 확인한 것)과 오른쪽(연구 장치)은 서로 다른
  // 높이로 자란다. 격자 칸을 짝지으면 짧은 쪽 아래에 빈틈이 생기므로 각각을 한
  // 묶음으로 감싸 독립된 단이 되게 한다. 화면에서는 차례대로 놓인다(2026-09-09).
  const SIDE_LAYERS = new Set(["research_reading", "research_structure", "memory_evidence"]);
  const layeredBody = layers.length ? layers.map((layer) => {
    let body = "";
    if (layer.id === "raw_participant_words") {
      // 문항 ID 는 인용 주소다. 보고서 본문에 「참여 기록 코드 · 문항 ID」로 적으면
      // over39_fixed_answers.question_id 와 맞물린다. 없으면 부록의 인용문은 어느
      // 물음에 대한 답인지 알 수 없는 조각이 된다(2026-09-09).
      body = array(layer.entries).length
        ? array(layer.entries).map((entry) => {
          const cite = entry.question_id ? `<span class="response-document-cite">${esc(entry.question_id)}</span>` : "";
          return entry.question
            ? `<div class="response-document-exchange">${cite}<p class="response-document-asked">${esc(entry.question)}</p><blockquote>${esc(entry.text)}</blockquote></div>`
            : `<div class="response-document-exchange">${cite}<blockquote>${esc(entry.text)}</blockquote></div>`;
        }).join("")
        : `<p class="response-document-empty">${esc(task7.rawEmpty)}</p>`;
    } else if (layer.id === "participant_confirmed_synthesis") {
      body = array(layer.paragraphs).map((item) => `<div class="response-document-translation"><span>${esc(item.label)}</span><p>${esc(item.text)}</p>${item.status ? `<small>${esc(item.status)}</small>` : ""}</div>`).join("") || `<p class="response-document-empty">${esc(frame.summaryEmpty)}</p>`;
    } else {
      body = array(layer.paragraphs).map((paragraph) => (paragraph && typeof paragraph === "object"
        ? `<p><span class="response-document-title-screen">${esc(paragraph.screen)}</span><span class="response-document-title-appendix">${esc(paragraph.appendix)}</span></p>`
        : `<p>${esc(paragraph)}</p>`)).join("");
    }
    if (array(layer.coordinate_grid).length) {
      // 판 자체는 모든 장에 같고, 찍힌 칸만 다르다. 그래서 넘겨볼 때 분포가 보인다.
      const cells = array(layer.coordinate_grid).map((row) => `<div class="response-document-grid-row">${array(row).map((n) => `<i${n === layer.coordinate_number ? ' class="is-here"' : ""}></i>`).join("")}</div>`).join("");
      body += `<div class="response-document-grid" aria-hidden="true">${cells}</div>`;
    }
    if (array(layer.axes).length) {
      // 축 하나에 「무엇으로 읽었는가 → 참여자의 어느 문장이 근거인가」를 붙인다.
      // 근거로 인용되는 문장은 참여자의 원문이고, 배정과 선택은 연구 측 표시다.
      const axisBody = array(layer.axes).map((axis) => {
        const secondary = axis.secondary
          ? `<span class="response-document-axis-secondary">${esc(axis.secondary.code)} ${axis.secondary.codebook && axis.secondary.codebook !== axis.secondary.label
              ? `<span class="response-document-title-screen">${esc(axis.secondary.label)}</span><span class="response-document-title-appendix">${esc(axis.secondary.codebook)}</span>`
              : esc(axis.secondary.label)}</span>`
          : "";
        const evidence = array(axis.evidence).map((item) => `<li>${item.question_id ? `<span class="response-document-cite">${esc(item.question_id)}</span>` : ""}${item.question ? `<span class="response-document-asked">${esc(item.question)}</span>` : ""}<q>${esc(item.text)}</q></li>`).join("");
        const name = axis.codebook && axis.codebook !== axis.label
          ? `<span class="response-document-title-screen">${esc(axis.label)}</span><span class="response-document-title-appendix">${esc(axis.codebook)}</span>`
          : esc(axis.label);
        return `<div class="response-document-axis"><dt><span class="response-document-axis-code">${esc(axis.code)}</span> <strong>${name}</strong> <small>${esc(axis.title)}</small>${secondary}</dt>${evidence ? `<dd><ul class="response-document-evidence">${evidence}</ul></dd>` : ""}</div>`;
      }).join("");
      // 「정리 출처 Motif 3 · …」 줄은 종이에서 뺐다(TK 2026-09-10). 제공자 이름은
      // 500장에 같은 값이고, 불확실성이 말하던 「두 흐름이 함께」는 축 줄의
      // 「함께 · S4 거리와 한계」가 이미 값으로 보여준다. 두 값 모두 응답 스냅샷
      // (depth_summary.source · uncertainty)에 남는다 — 연구 자료에서 지운 것이 아니다.
      body += `<dl class="response-document-axes">${axisBody}</dl>`;
    }
    if (array(layer.rows).length) {
      // 선택형 답은 표로 놓는다. 문장인 척하지 않으므로 어색함이 없고, 칸마다 자기
      // 값만 담기므로 값이 엉뚱한 절로 들어가는 일도 없다(2026-09-09).
      body = `<dl class="response-document-rows">${array(layer.rows).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
    }
    return `<section class="response-document-layer response-document-layer-${esc(layer.id)}" data-source-kind="${esc(layer.source_kind)}" data-approval-scope="${esc(layer.approval_scope)}"><header><h3>${layer.appendix_title ? `<span class="response-document-title-screen">${esc(layer.title)}</span><span class="response-document-title-appendix">${esc(layer.appendix_title)}</span>` : esc(layer.title)}</h3><p>${esc(layer.description)}</p></header><div class="response-document-layer-body">${body}</div></section>`;
  }).join("|||SPLIT|||") : "";
  const layerGroups = (() => {
    if (!layers.length) return "";
    const rendered = layeredBody.split("|||SPLIT|||");
    const main = [];
    const side = [];
    layers.forEach((layer, index) => {
      (SIDE_LAYERS.has(layer.id) ? side : main).push(rendered[index]);
    });
    // use_scope 는 발로 내려가므로 어느 단에도 넣지 않는다.
    const foot = [];
    const mainOnly = [];
    layers.forEach((layer, index) => {
      if (SIDE_LAYERS.has(layer.id)) return;
      (layer.id === "use_scope" ? foot : mainOnly).push(rendered[index]);
    });
    return `<div class="response-document-main">${mainOnly.join("")}</div><div class="response-document-side">${side.join("")}</div>${foot.join("")}`;
  })();
  const projectNote = document.project_note
    ? `<aside class="response-document-project-note" data-source-kind="project_information"><h3>${esc(document.project_note.title)}</h3>${array(document.project_note.paragraphs).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</aside>`
    : "";
  const sections = array(document.sections).map((section) => {
    const body = section.id === "summary"
      ? array(section.paragraphs).map((item) => `<div class="response-document-translation"><span>${esc(item.label)}</span><p>${esc(item.text)}</p>${item.status ? `<small>${esc(item.status)}</small>` : ""}</div>`).join("") || `<p class="response-document-empty">${esc(responseDocumentFrame(document.display_language || document.source_language).summaryEmpty)}</p>`
      : array(section.paragraphs).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
    return `<section class="response-document-section response-document-section-${esc(section.id)}"><div class="response-document-section-head"><span>${esc(section.number)}</span><h3>${esc(section.title)}</h3></div><div class="response-document-section-body">${body}</div></section>`;
  }).join("");
  const metadata = array(document.metadata).map(([label, value, kind]) => `<div${kind ? ` data-metadata="${esc(kind)}"` : ""}><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
  // 낱장의 출처를 밝히는 표기. 인쇄될 때 이것이 문서의 공신력을 세운다.
  const archive = document.archive
    ? `<div class="response-document-archive"><div class="response-document-archive-head"><span>${esc(document.archive.kind)}</span><strong>${esc(document.archive.study)}</strong>${document.archive.version ? `<em>${esc(document.archive.version)}</em>` : ""}</div><dl class="response-document-archive-credits">${array(document.archive.credits).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl></div>`
    : "";
  // 수록 근거 문단은 종이에서 뺐다(TK 2026-09-10). 문서가 무엇인지는 머리의 연구
  // 이름·기록 코드·기관 표기가 이미 밝히고, 승인 경계는 절 제목이 말하며, 활용
  // 범위는 바로 위에 값으로 있다. 같은 문단이 500장에 500번 나올 이유가 없다.
  // 값 자체는 document.archive.statement 에 그대로 남는다 — 지운 것은 인쇄면뿐이다.
  const archiveStatement = "";
  return `<article class="response-document-sheet" data-document-status="${esc(document.status)}" data-approval-scope="${esc(document.approval_scope || "legacy_document")}"><header class="response-document-header"><div><span>${esc(document.brand_label || "〈만 39세 이상〉 · PARTICIPATION RECORD")}</span><h2>${document.appendix_title ? `<span class="response-document-title-screen">${esc(document.title)}</span><span class="response-document-title-appendix">${esc(document.appendix_title)}</span>` : esc(document.title)}</h2><p>${esc(document.subtitle)}</p></div></header><p class="response-document-description">${esc(document.description)}</p><dl class="response-document-metadata">${metadata}</dl>${archive}${layers.length ? `${layerGroups}${projectNote}` : sections}${archiveStatement}<footer class="response-document-confirmation"><p>${esc(document.confirmation)}</p></footer></article>`;
}
