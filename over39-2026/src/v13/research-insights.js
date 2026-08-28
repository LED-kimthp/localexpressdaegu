// 질문지의 변수는 이미 설계되어 있고, 없는 것은 그 변수를 모아서 볼 수단이다.
// 응답이 300개 쌓여도 관리자 화면에 개별 응답 상세만 있으면 남는 문장은 하나뿐이다.
// 이 파일은 "누가 계속했는지 / 무엇이 계속하게 했는지 / 어디에서 관계가 달라졌는지 /
// 어떤 지원이 오래 작동했는지 / 어떤 공간과 시기의 기억인지 / 어떤 이름이 기억에만 남았는지"를
// 셀 수 있는 순수 집계만 담는다. DOM과 네트워크는 모른다 (ai-health.js와 같은 규칙).
//
// 집계 설계의 기준은 이 연구가 도달한 관점이다. "보이지 않는다 = 멈췄다"가 아니고,
// "전시 횟수나 지원 횟수가 줄었다 = 지속성이 약해졌다"도 아니다. 그래서 이 파일에서는
// '경력 단절'이라는 하나의 상태를 만들지 않는다. 활동 상태는 P14×P15로 나눠서 세고,
// M/S/D 좌표는 status를 섞지 않고, 역할은 provenance를 섞지 않고, NO_RECALL과
// "큰 간극 없음"은 결측이 아니라 유효한 응답으로 센다.
import { normalizedDScope } from "./flow.js";

// n이 작을 때 비율은 경향처럼 읽힌다. 20 미만에서는 화면에 비율을 내보내지 않고 원수만 쓴다.
export const SMALL_SAMPLE_THRESHOLD = 20;

// 자유입력 이름이 한 번만 나오면 그 문자열 자체가 한 사람을 가리킨다.
// 두 사람 이상이 같은 이름·지역을 적었을 때만 화면에 올린다.
export const MIN_NAME_COUNT = 2;

// 연구 결론이 오염되지 않게, 기본 집계는 research 표본만 본다.
export const RESEARCH_SAMPLE_TYPE = "research";

// over39_fixed_answers.question_id -> 실제 저장 필드명(schema의 store[0]).
// 이 화면이 쓰는 코드형 문항만 담는다. 자유서술 문항은 아래 NARRATIVE_QUESTION_IDS로 분리한다.
export const CODED_QUESTIONS = Object.freeze({
  M01: "memory_type",
  M06: "memory_time_band",
  M07: "memory_locations",
  P05: "activity_duration_band",
  P11: "transition_state",
  P13: "invisible_continuity_state",
  P14: "creative_work_state",
  P15: "public_activity_state",
  P16: "pause_context_tags",
  P19: "support_conditions",
  D01: "d_current_gap",
  D02: "d_desired_change_primary",
});

// 여러 코드를 고를 수 있는 문항. 분모가 "선택 수"가 아니라 "답한 사람 수"가 되어야 한다.
export const MULTI_QUESTIONS = Object.freeze(["M07", "P16", "P19"]);

// 원문은 이 화면에 절대 표시하지 않는다. 몇 명이 실제로 이야기를 남겼는지만 센다.
export const NARRATIVE_QUESTION_IDS = Object.freeze([
  "M02", "M04_TEXT", "NO_RECALL_RELATION", "P12", "P13_TEXT", "P19_TEXT", "D02_TEXT", "D04",
]);

// 스냅샷 payload.answers 안에만 있는 필드. 전용 컬럼이 없어 fixed_answers로는 셀 수 없다.
export const PROFILE_FIELDS = Object.freeze([
  "route", "response_position", "d_scope", "role_group_primary", "age_band",
  "activity_form", "activity_start_year", "community_module_opt_in",
  "community_recall_reason", "community_recall_mode",
]);

// 직군은 분류가 아니라 해석의 위치다. Context가 어떤 R 역할일 가능성을 보여줘도 그것이
// 자동으로 최종 R 코드가 되지 않으므로, 역할군 분포는 provenance와 함께 읽어야 한다.
// 이 값들은 payload.answers가 아니라 payload.participant_context 아래에 있다
// (participant-context.js의 legacyRoleProvenance()/compactParticipantContext()가 만든다).
// PROFILE_FIELDS에 넣으면 admin.js가 payload->answers 경로로 조회해 전부 null이 되므로 분리한다.
export const CONTEXT_PROVENANCE_PATH = "payload->participant_context";
export const CONTEXT_PROVENANCE_FIELDS = Object.freeze([
  "legacy_role_source", "legacy_taxonomy_coverage", "legacy_mapping_confidence",
]);
// 위 필드를 profiles 행에 실어 오려면 admin.js의 select에 이 별칭들을 더해야 한다.
export const CONTEXT_PROVENANCE_SELECT = Object.freeze(
  CONTEXT_PROVENANCE_FIELDS.map((field) => `${field}:${CONTEXT_PROVENANCE_PATH}->>${field}`),
);

// over39_axis_snapshots.status. 좌표는 무조건 하나로 확정되어야 하는 값이 아니다.
// 스키마 classification.coordinate_statuses와 같은 순서를 쓴다.
export const COORDINATE_STATUSES = Object.freeze(["complete", "mixed", "pending_review", "insufficient"]);

// 좌표 축 분포에 넣는 status. complete만 쓴다. mixed·pending_review·insufficient를 함께 합산하면
// "확정되지 않은 판단"이 화면에서 확정된 것처럼 보인다.
export const COORDINATE_AXIS_STATUSES = Object.freeze(["complete"]);

// 한 응답에 stage별 좌표 행이 여러 개 쌓인다. app.js가 참여자에게 보여주는 좌표와 같은 우선순위로
// 응답당 한 행만 고른다(참여자 확정 > 연구 파생 > 심화 > 고정).
export const AXIS_STAGE_ORDER = Object.freeze(["participant_final", "research_derived", "depth", "fixed"]);

// P14(creative_work_state)를 "계속 / 쉼"으로 거칠게 묶는다. MIXED는 어느 쪽에도 넣지 않는다.
// 연구가 허용한 상태이므로 억지로 한 좌표로 밀어 넣지 않는다.
export const CONTINUING_WORK_STATES = Object.freeze([
  "STEADY", "SEASONAL", "RESEARCH_RECORD", "SHIFTED", "AUDIENCE_ACTIVE", "AUDIENCE_OCCASIONAL",
]);
export const PAUSED_WORK_STATES = Object.freeze(["PAUSED", "CLOSED", "AUDIENCE_DISTANCED"]);

// P15(public_activity_state)를 "밖에서 보인다 / 잘 보이지 않는다 / 공개를 쉰다"로 묶는다.
// NOT_WANTED는 본인의 선택이지만 "밖에서 잘 보이지 않는다"는 사실 자체는 같으므로 저가시성에 둔다.
export const VISIBLE_PUBLIC_STATES = Object.freeze(["MAKING_AND_SHOWING", "AUDIENCE_REGULAR", "AUDIENCE_OCCASIONAL"]);
export const LOW_VISIBILITY_PUBLIC_STATES = Object.freeze([
  "MAKING_NOT_SHOWING", "SHOWING_PROJECT_BASED", "PUBLIC_ROLE_SHIFT", "NOT_WANTED", "AUDIENCE_ONLINE",
]);
export const PAUSED_PUBLIC_STATES = Object.freeze(["BOTH_PAUSED", "AUDIENCE_PAUSED"]);

// 이 연구가 가장 강하게 경계한 표현이 '경력 단절'이다. 아래 세 자리는 활동이 이어지고 있는데도
// 전시·발표 횟수만 보면 "멈췄다"로 잘못 읽히는 자리다. 화면에서 색이 아니라 텍스트로 밝혀야 한다.
export const CAREER_BREAK_MISREAD = Object.freeze([
  Object.freeze({
    field: "public_activity_state", position: "column", code: "MAKING_NOT_SHOWING",
    note: "제작이나 핵심 활동은 이어지고 공개만 쉬고 있는 자리입니다. \"보이지 않는다 = 멈췄다\"가 아니라는 것을 직접 보여주는 칸이므로 '경력 단절'로 읽지 마세요.",
  }),
  Object.freeze({
    field: "creative_work_state", position: "row", code: "RESEARCH_RECORD",
    note: "준비·조사·기록을 중심으로 이어가고 있는 상태입니다. 발표물이 없는 기간이므로 외부 기록에서는 비어 보이지만 활동이 멈춘 것이 아닙니다.",
  }),
  Object.freeze({
    field: "public_activity_state", position: "column", code: "SHOWING_PROJECT_BASED",
    note: "프로젝트가 있을 때 공개를 이어가는 상태입니다. 전시 횟수나 지원 횟수가 줄어든 것이 지속성이 약해진 것과 같지 않습니다.",
  }),
]);

// D01(지금 비어 있다고 느끼는 조건)과 D02(가장 먼저 바라는 변화)에서 "나에게 반드시 문제가 있다"를
// 전제하지 않는 유효 응답. 결측으로 처리하면 연구가 막으려 한 결핍 프레임이 된다.
export const NO_DEFICIT_CODES = Object.freeze(["NO_MAJOR_GAP", "NO_SPECIFIC_CHANGE", "UNSURE"]);

// 코드는 질문지에 고정돼 있고, 관리자 화면이 3,600행 스키마를 통째로 받을 이유는 없다.
// 라벨이 스키마와 어긋나면 집계 자체를 잘못 읽게 되므로 테스트가 전 코드 커버리지를 검사한다.
export const LABELS = Object.freeze({
  memory_type: { ARTIST: "사람·예술가", WORK_OBJECT: "작품·물건·이미지", SPACE: "공간", EXHIBITION: "전시·공연·행사", SCENE: "하나의 장면", PHRASE: "문장·이야기", SENSATION: "이름 붙이기 어려운 감각", PRACTICE: "나의 활동·연습·태도", NO_RECALL: "떠오르는 대상 없음" },
  memory_time_band: { LT1: "최근 1년", Y1_3: "1~3년 전", Y3_5: "3~5년 전", Y5_10: "5~10년 전", Y10_20: "10~20년 전", Y20PLUS: "20년 이상", MULTIPLE: "여러 시기에 걸쳐", UNKNOWN: "기억나지 않음" },
  activity_duration_band: { LT1: "1년 미만", Y1_3: "1~3년", Y3_5: "3~5년", Y5_10: "5~10년", Y10_20: "10~20년", Y20_30: "20~30년", Y30_PLUS: "30년 이상", DIFFICULT: "시기를 말하기 어려움", SKIP: "응답하지 않음" },
  transition_state: { CLEAR: "분명한 시점이 있었다", GRADUAL: "서서히 달라졌다", MULTIPLE: "여러 번 변화했다", CONTINUED: "비슷한 흐름으로 이어졌다", UNSURE: "잘 모르겠다", SKIP: "건너뜀" },
  invisible_continuity_state: { YES: "이어지고 있던 것이 있었다", MIXED: "이어짐과 멈춤이 함께", NO: "떠올리기 어렵다", UNSURE: "잘 모르겠다" },
  support_conditions: { PEOPLE: "함께한 사람과 동료", AUDIENCE: "관객과 참여자", SPACE: "활동할 수 있는 공간", INCOME: "생활을 지탱하는 소득", OTHER_WORK: "다른 일과 역할", INSTITUTION: "기관과 지원", REGION: "지역의 관계와 환경", EDUCATION: "교육·연구·배움", RECORD: "기록·자료·아카이브", FAMILY_CARE: "가족·돌봄 관계", MEMORY: "기억과 오래 이어진 질문", SELF_PACE: "스스로 조절한 속도", TIME_COST_MOVE: "비용·시간·이동의 여유", GUIDE: "쉬운 정보와 안내", ONLINE_MEDIA: "온라인·출판·영상", RECOMMENDATION: "다른 사람의 추천", NONE: "떠오르는 조건 없음", OTHER: "기타" },
  pause_context_tags: { LIVELIHOOD: "생계와 다른 일의 비중", CARE: "돌봄과 가족의 시간", HEALTH: "건강과 회복", COST: "제작비·발표비·이동비", SPACE: "작업·연습·보관 공간", ADMIN: "행정과 역할 부담", OPPORTUNITY: "전시·발표·참여 기회", AGE_ELIGIBILITY_END: "청년·신진 지원 연령 기준 종료", RELATIONSHIP: "관계망과 협업 조건", REGION: "지역과 이동의 조건", DIRECTION: "방향을 살피는 시간", CHOICE: "개인의 선택과 우선순위", DAILY_SCHEDULE: "일상과 학업·일의 시간", COST_MOVE: "비용과 이동", COMPANION: "함께 갈 사람", INFORMATION: "작품·프로그램 정보", LANGUAGE_GUIDE: "언어와 설명의 방식", COMFORT: "공간에 들어갈 때의 편안함", ONLINE: "온라인으로 만나는 경로", OTHER: "기타", NONE: "영향 조건 없음", UNSURE: "잘 모르겠음" },
  creative_work_state: { STEADY: "꾸준히 이어가고 있다", SEASONAL: "시기에 따라 이어간다", RESEARCH_RECORD: "준비·조사·기록 중심", PAUSED: "잠시 쉬고 있다", SHIFTED: "다른 역할·방식으로 이동", CLOSED: "마무리했다고 느낀다", MIXED: "한 가지로 말하기 어렵다", AUDIENCE_ACTIVE: "꾸준히 찾아보고 참여", AUDIENCE_OCCASIONAL: "시기에 따라 참여", AUDIENCE_DISTANCED: "현장과 거리를 두고 있다" },
  public_activity_state: { MAKING_AND_SHOWING: "제작과 공개가 함께", MAKING_NOT_SHOWING: "제작은 이어지고 공개는 쉼", SHOWING_PROJECT_BASED: "프로젝트가 있을 때만 공개", PUBLIC_ROLE_SHIFT: "발표 외 역할로 달라짐", BOTH_PAUSED: "제작과 공개 모두 쉼", NOT_WANTED: "공개 활동 계획 없음", MIXED: "한 가지로 말하기 어렵다", AUDIENCE_REGULAR: "꾸준히 참여", AUDIENCE_OCCASIONAL: "시기에 따라 참여", AUDIENCE_ONLINE: "온라인·출판·기록 중심", AUDIENCE_PAUSED: "관람과 참여를 쉬고 있다" },
  role_group_primary: { G1: "창작", G2: "기획·프로듀싱", G3: "비평·연구", G4: "언론·미디어", G5: "기록·출판·소통", G6: "공간·기관 운영", G7: "교육·행정·정책", G8: "제작·보존·유통", G_OTHER: "기존 역할로 한정하기 어려움" },
  age_band: { "20_24": "20~24세", "25_29": "25~29세", "30_34": "30~34세", "35_39": "35~39세", "40S": "40대", "50S": "50대", "60S": "60대", "70PLUS": "70대 이상", SKIP: "응답하지 않음" },
  activity_form: { PRIMARY_WORK: "주된 일로 이어간다", WITH_OTHER_WORK: "다른 일과 함께", PAID_PROJECT_BASED: "프로젝트가 있을 때 유급", WITH_EDUCATION: "교육·강습과 함께", UNPAID_VOLUNTEER_COMMUNITY: "무급·자원·공동체 활동", HOBBY_CLUB: "취미·동호회", LEARNING_TRAINING: "배우거나 수련 중", PAUSED_OR_ADJUSTING: "쉬거나 속도를 조절 중", SHIFTED_ROLE: "다른 역할로 이동", MIXED: "한 가지로 말하기 어렵다" },
  community_recall_reason: { WORK: "작품을 다시 보고 싶어서", FOLLOWED: "활동을 오래 지켜봐서", LESS_VISIBLE: "한동안 소식이나 기록을 만나기 어려워서", HISTORY: "지역 미술사에서 다시 살펴볼 필요가 있어서", RELATION: "함께한 기억이 있어서", INTUITIVE: "설명하기 어렵지만 계속 떠올라서" },
  d_axis: { D1: "D1", D2: "D2", D3: "D3", D4: "D4", NO_MAJOR_GAP: "큰 간극 없음", NO_SPECIFIC_CHANGE: "특정 변화 필요 없음", UNSURE: "잘 모르겠음" },
  // D1~D4는 범위별로 다른 문항에서 나온다. 뜻이 고정된 두 범위에만 축 이름을 붙이고,
  // 역할 범위(SELF_ROLE)는 role_primary별로 문구가 달라 코드로만 남긴다.
  d_axis_MEMORY_RECONNECT: { D1: "작품·기록을 다시 만나는 기회", D2: "작가의 생활 기반", D3: "읽고 대화하고 기록하는 관계", D4: "장기 보존·지원 구조", NO_MAJOR_GAP: "큰 간극 없음", NO_SPECIFIC_CHANGE: "특정 변화 필요 없음", UNSURE: "잘 모르겠음" },
  d_axis_AUDIENCE: { D1: "가까이에서 만나는 기회", D2: "시간·비용·이동의 부담", D3: "함께 이야기할 설명과 사람", D4: "지역 문화공간·정책의 지속성", NO_MAJOR_GAP: "큰 간극 없음", NO_SPECIFIC_CHANGE: "특정 변화 필요 없음", UNSURE: "잘 모르겠음" },
  route: { SELF: "나의 활동", MEMORY: "기억", BOTH: "활동과 기억", AUDIENCE: "관객·시민" },
  d_scope: { SELF_ROLE: "나의 역할", MEMORY_RECONNECT: "기억 다시 만나기", AUDIENCE: "관객·시민", "": "범위 미기록" },
  // P14와 P15를 함께 읽은 결과. "멈췄다"나 "단절"이라는 말을 쓰지 않는다. 활동이 이어지는데
  // 밖에서 보이지 않는 상태를 별도 코드로 두는 것이 이 연구의 핵심 명제다.
  continuity_reading: {
    CONTINUING_VISIBLE: "이어가고 있고 밖에서도 보인다",
    CONTINUING_LOW_VISIBILITY: "이어지고 있지만 밖에서는 잘 보이지 않는다",
    CONTINUING_PUBLIC_PAUSED: "이어지고 있지만 공개는 쉬고 있다",
    PACED_STILL_PUBLIC: "속도를 조절했지만 공개 경로는 남아 있다",
    PACED_AND_RESTING: "제작과 공개를 함께 쉬고 있다",
    MIXED_STATE: "한 가지 상태로 말하기 어렵다",
    UNCLASSIFIED: "두 답을 묶어 읽지 않은 조합",
  },
  // P14/P15의 보기 문구가 전문 경로와 관객 경로에서 다르다. 같은 코드도 뜻이 같지 않아 나눠 센다.
  response_option_set: { PROFESSIONAL: "전문 경로 보기", AUDIENCE: "관객·시민 경로 보기", "": "경로 미기록" },
  // 좌표 status. 실패가 아니라 "지금 어디까지 확정됐는지"를 말한다.
  coordinate_status: {
    complete: "세 축이 모두 확정됨",
    mixed: "경쟁하는 축이 남아 있음",
    pending_review: "연구자 확인 대기",
    insufficient: "한 축 이상이 아직 확정되지 않음",
  },
  coordinate_stage: {
    participant_final: "참여자 확정",
    research_derived: "연구 파생",
    depth: "심화 단계",
    fixed: "고정문항 단계",
  },
  // 좌표 축 라벨은 스키마 axes의 정의를 그대로 쓴다. LABELS.d_axis(범위별 D01/D02 보기)와 다른 값이다.
  m_primary: { M1: "감각·정서", M2: "삶·기억·정체성", M3: "탐구·창작·성취", M4: "관계·공공세계" },
  s_primary: { S1: "확장", S2: "지속", S3: "전환", S4: "거리·한계" },
  d_primary: { D1: "접근·참여", D2: "개인 기반", D3: "관계·매개", D4: "제도·구조" },
  // 역할 확정의 provenance. bridge_confirmed만 참여자가 확정한 역할이다.
  legacy_role_source: {
    bridge_confirmed: "참여자가 역할을 확정함",
    context_candidate: "Context에서 나온 후보일 뿐",
    not_applicable: "기존 역할 분류를 적용하지 않는 활동",
    not_covered: "기존 역할 분류로 담기지 않는 활동",
  },
  legacy_taxonomy_coverage: {
    covered: "기존 분류로 덮임",
    partial: "일부만 덮임",
    not_covered: "기존 분류 밖",
    not_applicable: "적용 대상 아님",
  },
});

// 화면 표시 순서. 질문지 순서를 따르면 시간·정도의 방향이 표에서 그대로 읽힌다.
export const ORDERS = Object.freeze({
  memory_type: ["ARTIST", "WORK_OBJECT", "SPACE", "EXHIBITION", "SCENE", "PHRASE", "SENSATION", "PRACTICE", "NO_RECALL"],
  memory_time_band: ["LT1", "Y1_3", "Y3_5", "Y5_10", "Y10_20", "Y20PLUS", "MULTIPLE", "UNKNOWN"],
  activity_duration_band: ["LT1", "Y1_3", "Y3_5", "Y5_10", "Y10_20", "Y20_30", "Y30_PLUS", "DIFFICULT", "SKIP"],
  transition_state: ["CLEAR", "GRADUAL", "MULTIPLE", "CONTINUED", "UNSURE", "SKIP"],
  invisible_continuity_state: ["YES", "MIXED", "NO", "UNSURE"],
  age_band: ["20_24", "25_29", "30_34", "35_39", "40S", "50S", "60S", "70PLUS", "SKIP"],
  role_group_primary: ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G_OTHER"],
  activity_form: ["PRIMARY_WORK", "WITH_OTHER_WORK", "PAID_PROJECT_BASED", "WITH_EDUCATION", "UNPAID_VOLUNTEER_COMMUNITY", "HOBBY_CLUB", "LEARNING_TRAINING", "PAUSED_OR_ADJUSTING", "SHIFTED_ROLE", "MIXED"],
  community_recall_reason: ["LESS_VISIBLE", "WORK", "FOLLOWED", "HISTORY", "RELATION", "INTUITIVE"],
  d_axis: ["D1", "D2", "D3", "D4", "NO_MAJOR_GAP", "NO_SPECIFIC_CHANGE", "UNSURE"],
  support_conditions: ["PEOPLE", "AUDIENCE", "SPACE", "INCOME", "OTHER_WORK", "INSTITUTION", "REGION", "EDUCATION", "RECORD", "FAMILY_CARE", "MEMORY", "SELF_PACE", "TIME_COST_MOVE", "GUIDE", "ONLINE_MEDIA", "RECOMMENDATION", "NONE", "OTHER"],
  // 질문지 보기 순서. 전문 경로 보기 다음에 관객 경로 보기를 둔다.
  creative_work_state: ["STEADY", "SEASONAL", "RESEARCH_RECORD", "PAUSED", "SHIFTED", "CLOSED", "MIXED", "AUDIENCE_ACTIVE", "AUDIENCE_OCCASIONAL", "AUDIENCE_DISTANCED"],
  public_activity_state: ["MAKING_AND_SHOWING", "MAKING_NOT_SHOWING", "SHOWING_PROJECT_BASED", "PUBLIC_ROLE_SHIFT", "BOTH_PAUSED", "NOT_WANTED", "MIXED", "AUDIENCE_REGULAR", "AUDIENCE_OCCASIONAL", "AUDIENCE_ONLINE", "AUDIENCE_PAUSED"],
  // 이어지는 상태를 먼저, 그중에서도 밖에서 보이지 않는 상태를 위쪽에 둔다.
  continuity_reading: ["CONTINUING_VISIBLE", "CONTINUING_LOW_VISIBILITY", "CONTINUING_PUBLIC_PAUSED", "PACED_STILL_PUBLIC", "PACED_AND_RESTING", "MIXED_STATE", "UNCLASSIFIED"],
  response_option_set: ["PROFESSIONAL", "AUDIENCE", ""],
  coordinate_status: [...COORDINATE_STATUSES],
  coordinate_stage: [...AXIS_STAGE_ORDER],
  m_primary: ["M1", "M2", "M3", "M4"],
  s_primary: ["S1", "S2", "S3", "S4"],
  d_primary: ["D1", "D2", "D3", "D4"],
  legacy_role_source: ["bridge_confirmed", "context_candidate", "not_applicable", "not_covered"],
  legacy_taxonomy_coverage: ["covered", "partial", "not_covered", "not_applicable"],
});

// 계산할 수 없다고 확인된 지표. 화면에 남겨 두어야 파일럿 전에 문항 결정을 할 수 있다.
export const SCHEMA_GAPS = Object.freeze([
  { title: "공간 이름", detail: "M07은 국가·도시만 받습니다. \"어떤 공간이 한 사람의 삶에 중요했는지\"에 답할 장소(작업실·극장·서점·공공공간) 이름 필드가 없습니다." },
  { title: "관계가 끊긴 지점에 대한 참여자 판단", detail: "P17(pause_meaning)과 P18(pause_context_text)은 스키마에 있지만 RC2 흐름에서 노출되지 않아 응답이 쌓이지 않습니다." },
  { title: "D1~D4의 비교 가능성", detail: "d_current_gap·d_desired_change_primary의 D1~D4는 d_scope와 role_primary에 따라 뜻이 달라집니다. 범위를 나누지 않은 합산 분포는 읽을 수 없습니다." },
  { title: "역할·연령·활동형태의 조회 경로", detail: "role_group_primary, age_band, activity_form, activity_start_year, community_* 는 전용 컬럼이 없어 스냅샷 payload에서만 읽힙니다. 표본이 커지면 조회 비용이 늘어납니다." },
  { title: "지원의 지속 기간", detail: "support_conditions는 무엇이 도움이 되었는지만 받습니다. 그 조건이 몇 년 작동했는지를 묻는 필드가 없어 \"오래 작동한 지원\"은 활동 기간과의 교차로만 추정됩니다." },
  { title: "역할 확정의 provenance 조회 경로", detail: "legacy_role_source(bridge_confirmed·context_candidate·not_applicable·not_covered)는 payload.participant_context 아래에 저장돼 있지만 payload.answers에는 없습니다. 관리자 조회에 CONTEXT_PROVENANCE_SELECT 별칭을 더하기 전까지 역할군 분포는 참여자가 확정한 역할과 Context 후보를 구분하지 못한 채 섞여 있습니다." },
  { title: "좌표 status의 조회 경로", detail: "over39_axis_snapshots.status(complete·mixed·pending_review·insufficient)는 저장돼 있지만 연구 지표 화면이 이 표를 아직 읽지 않습니다. axes를 넘기지 않으면 좌표 관련 집계는 비어 있고, 확정되지 않은 좌표가 확정된 것처럼 합산되는 일도 일어나지 않습니다." },
]);

const text = (value) => String(value ?? "").trim();

/** 저장된 답을 코드 배열로 정규화한다. 단일선택·다중선택·location_array를 한 형태로 다룬다. */
export function codesOf(answer) {
  if (answer === null || answer === undefined) return [];
  if (Array.isArray(answer)) return answer.flatMap((item) => codesOf(item));
  if (typeof answer === "object") return placeKey(answer) ? [placeKey(answer)] : [];
  const value = text(answer);
  return value ? [value] : [];
}

/** location_array 항목을 지역 키로 만든다. 자유입력 label은 국가·도시가 없을 때만 쓴다. */
export function placeKey(item) {
  if (!item) return "";
  if (typeof item === "string") return text(item);
  if (item.online === true) return "ONLINE";
  const parts = [text(item.country_code), text(item.city)].filter(Boolean);
  return parts.length ? parts.join(" · ") : text(item.label);
}

/**
 * 한 응답이 같은 문항에 여러 번 저장되는 구조를 정리한다.
 * over39_fixed_answers는 fixed_complete 스냅샷과 final 스냅샷 양쪽에서 쌓이므로
 * 그대로 세면 한 사람이 두 번 계산된다. (response_id, question_id)별 최신 행만 남긴다.
 */
export function latestPerQuestion(rows = []) {
  const latest = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row?.response_id || !row?.question_id) continue;
    const key = `${row.response_id}\u0000${row.question_id}`;
    const previous = latest.get(key);
    if (!previous || String(row.created_at || "") >= String(previous.created_at || "")) latest.set(key, row);
  }
  return [...latest.values()];
}

/**
 * 자유서술을 원문 없이 밀도만 남긴다. admin.js가 fetch 직후 이 함수를 통과시켜
 * state에는 글자 수만 들어가고 원문은 화면과 상태 어디에도 남지 않는다.
 */
export function narrativeLengths(rows = []) {
  return latestPerQuestion(rows)
    .filter((row) => NARRATIVE_QUESTION_IDS.includes(row.question_id))
    .map((row) => ({ response_id: row.response_id, question_id: row.question_id, chars: text(row.answer).length }));
}

/** 한 응답당 코드 목록의 배열을 받아 분포를 만든다. 분모는 선택 수가 아니라 답한 사람 수다. */
export function distribute(perResponse = [], { order = [], sort = "order" } = {}) {
  const counts = new Map();
  let answered = 0;
  for (const codes of perResponse) {
    const unique = [...new Set((codes || []).filter(Boolean))];
    if (!unique.length) continue;
    answered += 1;
    for (const code of unique) counts.set(code, (counts.get(code) || 0) + 1);
  }
  const ordered = order.filter((code) => counts.has(code));
  const extra = [...counts.keys()].filter((code) => !order.includes(code)).sort();
  const rows = [...ordered, ...extra].map((code) => ({ code, count: counts.get(code), share: answered ? counts.get(code) / answered : 0 }));
  if (sort === "count") rows.sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
  return { total: perResponse.length, answered, unanswered: perResponse.length - answered, rows };
}

/**
 * 교차표. 단순 분포보다 값이 큰 이유는 두 변수가 만나는 칸에 가설이 있기 때문이다.
 * pairs의 각 항목은 한 응답의 [행 코드 목록, 열 코드 목록]이며, 양쪽이 다 있어야 센다.
 */
export function crossTab(pairs = [], { rowOrder = [], colOrder = [], focus = null } = {}) {
  const cells = new Map();
  const rowTotals = new Map();
  const colTotals = new Map();
  let counted = 0;
  for (const [rawRows, rawCols] of pairs) {
    const rowCodes = [...new Set((rawRows || []).filter(Boolean))];
    const colCodes = [...new Set((rawCols || []).filter(Boolean))];
    if (!rowCodes.length || !colCodes.length) continue;
    counted += 1;
    for (const rowCode of rowCodes) {
      rowTotals.set(rowCode, (rowTotals.get(rowCode) || 0) + 1);
      for (const colCode of colCodes) cells.set(`${rowCode}\u0000${colCode}`, (cells.get(`${rowCode}\u0000${colCode}`) || 0) + 1);
    }
    for (const colCode of colCodes) colTotals.set(colCode, (colTotals.get(colCode) || 0) + 1);
  }
  const sortKeys = (keys, order) => [...order.filter((code) => keys.has(code)), ...[...keys].filter((code) => !order.includes(code)).sort()];
  const rowKeys = sortKeys(new Set(rowTotals.keys()), rowOrder);
  const colKeys = sortKeys(new Set(colTotals.keys()), colOrder);
  const table = {
    counted,
    columns: colKeys.map((code) => ({ code, count: colTotals.get(code) })),
    rows: rowKeys.map((code) => ({
      code,
      count: rowTotals.get(code),
      cells: colKeys.map((colCode) => ({ code: colCode, count: cells.get(`${code}\u0000${colCode}`) || 0 })),
    })),
    focus: null,
  };
  if (focus) {
    const count = cells.get(`${focus[0]}\u0000${focus[1]}`) || 0;
    table.focus = { row: focus[0], column: focus[1], count, share: counted ? count / counted : 0 };
  }
  return table;
}

/**
 * over39_axis_snapshots에서 응답당 한 행만 남긴다.
 * 한 응답에 fixed·depth·research_derived·participant_final 행이 함께 쌓이므로 그대로 세면
 * 한 사람이 여러 status로 계산된다. app.js가 참여자에게 보여주는 좌표와 같은 우선순위를 쓴다.
 */
export function latestAxisPerResponse(rows = []) {
  const best = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row?.response_id) continue;
    const rank = AXIS_STAGE_ORDER.indexOf(text(row.stage));
    const score = rank === -1 ? AXIS_STAGE_ORDER.length : rank;
    const previous = best.get(row.response_id);
    const newer = previous && score === previous.score
      && String(row.created_at || "") >= String(previous.row.created_at || "");
    if (!previous || score < previous.score || newer) best.set(row.response_id, { row, score });
  }
  return [...best.values()].map((item) => item.row);
}

/** P14를 "계속 / 쉼"으로만 거칠게 묶는다. MIXED와 미등록 코드는 어느 쪽에도 넣지 않는다. */
export function creativeWorkGroup(code) {
  const value = text(code);
  if (CONTINUING_WORK_STATES.includes(value)) return "CONTINUING";
  if (PAUSED_WORK_STATES.includes(value)) return "PACED";
  if (value === "MIXED") return "MIXED";
  return "";
}

/** P15를 "보인다 / 잘 보이지 않는다 / 공개를 쉰다"로 묶는다. */
export function publicActivityGroup(code) {
  const value = text(code);
  if (VISIBLE_PUBLIC_STATES.includes(value)) return "VISIBLE";
  if (LOW_VISIBILITY_PUBLIC_STATES.includes(value)) return "LOW_VISIBILITY";
  if (PAUSED_PUBLIC_STATES.includes(value)) return "PAUSED";
  if (value === "MIXED") return "MIXED";
  return "";
}

/**
 * P14와 P15를 함께 읽어 하나의 상태 코드로 만든다.
 * 이 연구가 도달한 관점은 "보이지 않는다 = 멈췄다"가 아니다. 그래서 활동이 이어지는데
 * 밖에서 보이지 않는 경우를 CONTINUING_LOW_VISIBILITY로 따로 세고, 어느 한쪽이 MIXED면
 * 억지로 한 상태로 밀어 넣지 않고 MIXED_STATE로 둔다(연구가 mixed를 허용한다).
 */
export function continuityReading(creativeCode, publicCode) {
  const work = creativeWorkGroup(creativeCode);
  const shown = publicActivityGroup(publicCode);
  if (!work || !shown) return "";
  if (work === "MIXED" || shown === "MIXED") return "MIXED_STATE";
  if (work === "CONTINUING") {
    if (shown === "VISIBLE") return "CONTINUING_VISIBLE";
    if (shown === "LOW_VISIBILITY") return "CONTINUING_LOW_VISIBILITY";
    return "CONTINUING_PUBLIC_PAUSED";
  }
  // 본인은 "쉬고 있다"고 답했지만 공개 경로가 남아 있는 경우도 '단절'이 아니다.
  return shown === "PAUSED" ? "PACED_AND_RESTING" : "PACED_STILL_PUBLIC";
}

/**
 * P14/P15가 어느 보기 묶음으로 제시됐는지. 같은 코드(RESEARCH_RECORD·SHIFTED·MIXED)가
 * 전문 경로와 관객 경로에서 다른 문구로 나오므로, 두 경로를 한 표에서 합산하면 뜻이 섞인다.
 * app.js의 isAudienceContext()와 같은 규칙이다(그 함수는 내보내지 않아 여기서 다시 쓴다).
 */
export function optionSetFor({ route = "", response_position: position = "" } = {}) {
  if (text(route) === "AUDIENCE" || text(position) === "AUDIENCE_CITIZEN") return "AUDIENCE";
  return text(route) ? "PROFESSIONAL" : "";
}

/** 자유입력 이름·지역은 두 사람 이상이 같은 값을 적었을 때만 내보낸다. */
export function frequentNames(values = [], { minCount = MIN_NAME_COUNT, limit = 12 } = {}) {
  const counts = new Map();
  for (const value of values) {
    const key = text(value);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  const kept = [...counts.entries()].filter(([, count]) => count >= minCount);
  return {
    distinct: counts.size,
    withheld: counts.size - kept.length,
    minCount,
    rows: kept.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).slice(0, limit).map(([name, count]) => ({ name, count })),
  };
}

function sampleOf(sessions, includeTest) {
  const rows = (Array.isArray(sessions) ? sessions : []).filter((row) => row?.response_id);
  const research = rows.filter((row) => row.sample_type === RESEARCH_SAMPLE_TYPE);
  const test = rows.filter((row) => row.sample_type === "test");
  const institution = rows.filter((row) => row.sample_type === "institution_review");
  const included = includeTest ? [...research, ...test] : research;
  // ⚠️ 참여자가 「활용 범위」 01에서 `아니요, 연구 분석에는 포함하지 말아주세요.`를 골라도
  // 아래 `ids`가 그 응답을 모든 분포표·교차표·좌표 집계에 통과시킨다. `policyStatistics`는
  // 개수만 센다. 즉 참여자가 명확히 아니라고 한 것이 보고서의 표에 실린다.
  //
  // 한 줄로 고칠 수 없다: `include_in_policy_statistics`는 저장 시점에
  // `sample_type === "research" && policy_research_use === "ANON_ANALYSIS"`로 계산되어
  // **동의 여부와 표본 종류를 한 값에 섞어** 담는다. 테스트 표본은 동의와 무관하게 항상
  // false이므로, 이 값으로 거르면 「테스트 포함」 토글이 통째로 죽는다.
  // 제대로 하려면 `policy_research_use` 원값을 세션 행이나 별도 조회로 가져와야 한다.
  // TK 판단 대기 항목이다.
  return {
    includeTest,
    counted: included.length,
    research: research.length,
    test: test.length,
    institutionReview: institution.length,
    completed: included.filter((row) => row.status === "completed").length,
    policyStatistics: included.filter((row) => row.include_in_policy_statistics === true).length,
    ids: new Set(included.map((row) => row.response_id)),
    sessions: included,
  };
}

/**
 * @param {{sessions?: Array<object>, codedAnswers?: Array<object>, narratives?: Array<object>, profiles?: Array<object>, axes?: Array<object>}} input
 *   axes는 over39_axis_snapshots 행이다. 넘기지 않으면 좌표 집계는 available:false로 비어 있다.
 * @param {{includeTest?: boolean, threshold?: number, minNameCount?: number}} options
 */
export function researchInsights(input = {}, options = {}) {
  const { includeTest = false, threshold = SMALL_SAMPLE_THRESHOLD, minNameCount = MIN_NAME_COUNT } = options;
  const { ids, sessions: includedSessions, ...sampleCounts } = sampleOf(input.sessions, includeTest);

  // 문항별 (응답 -> 코드 배열) 색인. 표본에 없는 응답과 중복 스냅샷은 여기서 걸러진다.
  const byQuestion = new Map();
  for (const row of latestPerQuestion(input.codedAnswers)) {
    if (!ids.has(row.response_id) || !Object.hasOwn(CODED_QUESTIONS, row.question_id)) continue;
    if (!byQuestion.has(row.question_id)) byQuestion.set(row.question_id, new Map());
    byQuestion.get(row.question_id).set(row.response_id, codesOf(row.answer));
  }
  const asked = (questionId) => byQuestion.get(questionId) || new Map();
  const perResponse = (questionId) => [...asked(questionId).values()];
  const codesFor = (questionId, responseId) => asked(questionId).get(responseId) || [];
  const dist = (questionId, sort = "order") => {
    const field = CODED_QUESTIONS[questionId];
    return { field, questionId, ...distribute(perResponse(questionId), { order: ORDERS[field] || [], sort }) };
  };

  // 스냅샷 payload에서만 읽히는 프로필 필드. 같은 응답의 나중 스냅샷이 앞선 값을 덮는다.
  const profiles = new Map();
  for (const row of Array.isArray(input.profiles) ? input.profiles : []) {
    if (row?.response_id && ids.has(row.response_id)) profiles.set(row.response_id, row);
  }
  const profileList = [...profiles.values()];
  const profileDist = (field, sort = "order") => ({
    field,
    ...distribute(profileList.map((row) => codesOf(row[field])), { order: ORDERS[field] || [], sort }),
  });

  // 자유서술은 글자 수만 들어온다. 몇 명이 실제로 이야기를 남겼는지가 자료의 두께다.
  const narrativeRows = (Array.isArray(input.narratives) ? input.narratives : []).filter((row) => ids.has(row?.response_id) && Number(row?.chars) > 0);
  const narrativeByResponse = new Map();
  for (const row of narrativeRows) {
    const bucket = narrativeByResponse.get(row.response_id) || { fields: 0, chars: 0 };
    bucket.fields += 1;
    bucket.chars += Number(row.chars) || 0;
    narrativeByResponse.set(row.response_id, bucket);
  }
  const narrativeValues = [...narrativeByResponse.values()];

  // D1~D4는 범위에 따라 뜻이 달라지므로 합산하지 않고 d_scope별로 나눠 센다.
  const scopeOf = (responseId) => {
    const profile = profiles.get(responseId) || {};
    return normalizedDScope({ route: profile.route, response_position: profile.response_position, d_scope: profile.d_scope }) || "";
  };
  const conditionsByScope = (questionId) => {
    const groups = new Map();
    for (const [responseId, codes] of asked(questionId)) {
      const scope = scopeOf(responseId);
      if (!groups.has(scope)) groups.set(scope, []);
      groups.get(scope).push(codes);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([scope, values]) => ({ scope, comparable: scope !== "SELF_ROLE", ...distribute(values, { order: ORDERS.d_axis }) }));
  };

  const responseIds = [...ids];
  const pairs = (rowQuestion, colQuestion) => responseIds.map((responseId) => [codesFor(rowQuestion, responseId), codesFor(colQuestion, responseId)]);

  // ── 1. creative_work_state × public_activity_state ─────────────────────────
  // 이 연구가 가장 강하게 경계한 표현이 '경력 단절'이다. 활동 상태는 그보다 훨씬 세밀하게 나뉘고,
  // 두 축이 만나는 칸이 "보이지 않는다 = 멈췄다"가 아니라는 것을 직접 그린다.
  const creativeWork = dist("P14", "count");
  const publicActivity = dist("P15", "count");
  const memoryType = dist("M01");
  const sessionRoutes = new Map(includedSessions.map((row) => [row.response_id, text(row.route)]));
  // P14/P15의 보기 문구는 경로에 따라 다르다. 어느 보기 묶음으로 물었는지를 알아야
  // RESEARCH_RECORD·SHIFTED·MIXED처럼 두 묶음에 함께 있는 코드를 잘못 합산하지 않는다.
  const optionSetOf = (responseId) => {
    const profile = profiles.get(responseId) || {};
    return optionSetFor({
      route: text(profile.route) || sessionRoutes.get(responseId) || "",
      response_position: profile.response_position,
    });
  };
  const presentPair = (responseId) => [codesFor("P14", responseId), codesFor("P15", responseId)];
  const presentCross = (subset) => crossTab(subset.map(presentPair), {
    rowOrder: ORDERS.creative_work_state,
    colOrder: ORDERS.public_activity_state,
  });
  const presentByOptionSet = (() => {
    const groups = new Map();
    for (const responseId of responseIds) {
      if (!codesFor("P14", responseId).length && !codesFor("P15", responseId).length) continue;
      const set = optionSetOf(responseId);
      if (!groups.has(set)) groups.set(set, []);
      groups.get(set).push(responseId);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([optionSet, members]) => ({ optionSet, responses: members.length, crossTab: presentCross(members) }));
  })();
  // 한쪽만 답한 응답도 분모에 남겨 두어야 "둘 다 답한 사람"이 몇 명인지 화면에서 보인다.
  const presentAnsweredIds = responseIds.filter((responseId) => codesFor("P14", responseId).length || codesFor("P15", responseId).length);
  const continuityRows = presentAnsweredIds.map((responseId) => {
    const code = continuityReading(codesFor("P14", responseId)[0], codesFor("P15", responseId)[0]);
    return code ? [code] : [];
  });
  const misreadRisk = CAREER_BREAK_MISREAD.map((item) => {
    const source = item.field === "creative_work_state" ? creativeWork : publicActivity;
    const row = source.rows.find((entry) => entry.code === item.code);
    return { ...item, count: row?.count || 0, share: row?.share || 0, answered: source.answered };
  });

  // ── 2. 좌표 status 분리 ────────────────────────────────────────────────────
  // 64개 좌표는 사람의 유형이 아니라 response episode다. status를 구분하지 않고 합산하면
  // 확정되지 않은 판단이 확정된 것처럼 보인다. 그래서 축 분포는 complete만 쓴다.
  const axisRows = latestAxisPerResponse(input.axes).filter((row) => ids.has(row.response_id));
  const axisComplete = axisRows.filter((row) => COORDINATE_AXIS_STATUSES.includes(text(row.status)));
  const axisDist = (field) => ({
    field,
    ...distribute(axisComplete.map((row) => codesOf(row[field])), { order: ORDERS[field] || [] }),
  });
  const numberedAxis = axisRows.filter((row) => Number.isInteger(row.coordinate_number));

  // ── 3. 역할 provenance ────────────────────────────────────────────────────
  // Context가 어떤 R 역할일 가능성을 보여줘도 그것이 자동으로 최종 R 코드가 되지는 않는다.
  // 값 자체는 payload.participant_context에 저장돼 있지만 관리자 조회가 그 경로를 읽지 않으면
  // 이 화면에는 도달하지 않는다. 도달하지 않은 상태를 available:false로 드러낸다.
  const provenanceField = CONTEXT_PROVENANCE_FIELDS[0];
  const provenanceAvailable = profileList.some((row) => Object.hasOwn(row, provenanceField));
  const roleGroupByProvenance = (() => {
    const groups = new Map();
    for (const row of profileList) {
      const provenance = text(row[provenanceField]);
      if (!provenance) continue;
      if (!groups.has(provenance)) groups.set(provenance, []);
      groups.get(provenance).push(codesOf(row.role_group_primary));
    }
    return [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([provenance, values]) => ({
        provenance,
        // 참여자가 확정한 역할만 최종 R 코드로 읽을 수 있다. 나머지는 해석의 위치일 뿐이다.
        confirmed: provenance === "bridge_confirmed",
        ...distribute(values, { order: ORDERS.role_group_primary }),
      }));
  })();

  // ── 4. NO_RECALL은 실패 응답이 아니다 ──────────────────────────────────────
  // "특별히 떠오르는 작품이 없다"를 "문화예술과 멀어졌다"로 추론하지 않는다.
  // M축은 insufficient가 될 수 있지만 S(P14/P15/P16/P11/P19)와 D(D01/D02)는 계속 진행한다.
  const noRecallIds = responseIds.filter((responseId) => codesFor("M01", responseId).includes("NO_RECALL"));
  const noRecallKept = (questionId) => noRecallIds.filter((responseId) => codesFor(questionId, responseId).length).length;

  // ── 5. D01과 D02는 서로 다른 질문이다 ─────────────────────────────────────
  // 두 답이 달라도 합치지 않고 그대로 보존한다. NO_MAJOR_GAP·UNSURE·NO_SPECIFIC_CHANGE는
  // 결측이 아니라 유효한 응답이다. 시스템이 "당신에게는 반드시 문제가 있다"를 전제하지 않는다.
  const noDeficitOf = (questionId) => {
    const values = perResponse(questionId);
    const answered = values.filter((codes) => codes.length).length;
    const count = values.filter((codes) => codes.some((code) => NO_DEFICIT_CODES.includes(code))).length;
    return { questionId, field: CODED_QUESTIONS[questionId], answered, count, share: answered ? count / answered : 0 };
  };
  const divergence = (() => {
    const both = responseIds.filter((responseId) => codesFor("D01", responseId).length && codesFor("D02", responseId).length);
    const diverged = both.filter((responseId) => codesFor("D01", responseId)[0] !== codesFor("D02", responseId)[0]);
    // D01·D02가 모두 D1~D4일 때만 두 코드가 같은 축 이름을 가리킨다. 그 안에서의 차이를 따로 센다.
    const axisPair = both.filter((responseId) => /^D[1-4]$/.test(codesFor("D01", responseId)[0]) && /^D[1-4]$/.test(codesFor("D02", responseId)[0]));
    return {
      counted: both.length,
      diverged: diverged.length,
      share: both.length ? diverged.length / both.length : 0,
      axisComparable: axisPair.length,
      axisDiverged: axisPair.filter((responseId) => codesFor("D01", responseId)[0] !== codesFor("D02", responseId)[0]).length,
    };
  })();
  const conditionPairsByScope = (() => {
    const groups = new Map();
    for (const responseId of responseIds) {
      if (!codesFor("D01", responseId).length || !codesFor("D02", responseId).length) continue;
      const scope = scopeOf(responseId);
      if (!groups.has(scope)) groups.set(scope, []);
      groups.get(scope).push([codesFor("D01", responseId), codesFor("D02", responseId)]);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([scope, values]) => ({
        scope,
        comparable: scope !== "SELF_ROLE",
        ...crossTab(values, { rowOrder: ORDERS.d_axis, colOrder: ORDERS.d_axis }),
      }));
  })();

  return {
    sample: sampleCounts,
    // 표본이 작을 때 비율을 내보내면 없는 경향을 읽게 된다. 화면은 이 값으로 표시를 바꾼다.
    readability: sampleCounts.counted === 0 ? "none" : sampleCounts.counted < threshold ? "counts" : "shares",
    threshold,
    narrative: {
      responses: narrativeByResponse.size,
      share: sampleCounts.counted ? narrativeByResponse.size / sampleCounts.counted : 0,
      averageFields: narrativeValues.length ? narrativeValues.reduce((sum, item) => sum + item.fields, 0) / narrativeValues.length : 0,
      averageChars: narrativeValues.length ? Math.round(narrativeValues.reduce((sum, item) => sum + item.chars, 0) / narrativeValues.length) : 0,
      askedFields: NARRATIVE_QUESTION_IDS.length,
    },
    // 무엇이 계속하게 했는지
    support: dist("P19", "count"),
    // 누가 계속했는지
    who: {
      // 이 분포는 provenance를 나누지 않은 값이다. 참여자가 확정한 역할과 Context 후보가 섞여 있으므로
      // 화면은 roleProvenance.available과 byProvenance를 함께 읽어야 한다(직군은 해석의 위치다).
      roleGroup: profileDist("role_group_primary"),
      ageBand: profileDist("age_band"),
      activityForm: profileDist("activity_form"),
      duration: dist("P05"),
      profiles: profiles.size,
    },
    // 어디에서 관계가 달라졌는지 ('끊겼는지'가 아니다 — 연구가 가장 경계한 표현이다)
    disconnection: {
      pauseContext: dist("P16", "count"),
      creativeWork,
      publicActivity,
    },
    // 지금의 활동 상태 — '경력 단절'로 뭉개지지 않게 두 축을 함께 본다.
    presentState: {
      rowField: "creative_work_state",
      colField: "public_activity_state",
      crossTab: presentCross(responseIds),
      byOptionSet: presentByOptionSet,
      // 두 답을 함께 읽은 결과. answered는 P14·P15에 모두 답해 분류된 사람 수다.
      reading: { field: "continuity_reading", ...distribute(continuityRows, { order: ORDERS.continuity_reading }) },
      // 활동이 이어지는데 밖에서는 잘 보이지 않는 사람 수. "보이지 않는다 ≠ 멈췄다"의 실증.
      continuingLowVisibility: continuityRows.filter((codes) => codes[0] === "CONTINUING_LOW_VISIBILITY").length,
      // 색이 아니라 텍스트로 밝혀야 하는 자리. 화면은 이 note를 그대로 출력한다.
      misreadRisk,
    },
    // 어떤 공간과 어느 시기의 기억인지
    memory: {
      type: memoryType,
      timeBand: dist("M06"),
      // 한 응답이 같은 지역을 두 번 적어도 두 사람으로 세지 않는다 (k 기준이 무너진다).
      places: frequentNames(perResponse("M07").flatMap((codes) => [...new Set(codes)]), { minCount: minNameCount }),
      spaceShare: (() => {
        const values = perResponse("M01");
        const answered = values.filter((codes) => codes.length).length;
        const space = values.filter((codes) => codes.includes("SPACE")).length;
        return { answered, count: space, share: answered ? space / answered : 0 };
      })(),
      // NO_RECALL은 실패 응답이 아니다. M축이 insufficient가 되어도 S·D 집계에 그대로 남는지
      // 이 숫자로 확인한다. 무응답·관심 낮음으로 표기하면 연구가 막으려 한 추론이 된다.
      noRecall: {
        count: noRecallIds.length,
        answered: memoryType.answered,
        share: memoryType.answered ? noRecallIds.length / memoryType.answered : 0,
        keptIn: {
          creativeWork: noRecallKept("P14"),
          publicActivity: noRecallKept("P15"),
          support: noRecallKept("P19"),
          gap: noRecallKept("D01"),
          desired: noRecallKept("D02"),
        },
      },
    },
    // 기억에는 남아 있지만 기록에서는 빠진 이름
    community: {
      optIn: profileList.filter((row) => text(row.community_module_opt_in) === "YES").length,
      reason: profileDist("community_recall_reason", "count"),
      lessVisible: profileList.filter((row) => text(row.community_recall_reason) === "LESS_VISIBLE").length,
      names: frequentNames(profileList.map((row) => text(row.community_recall_mode)), { minCount: minNameCount }),
    },
    // 현재 비어 있는 조건과 바라는 변화. D01과 D02는 서로 다른 질문이므로 절대 합치지 않는다.
    conditions: {
      gap: conditionsByScope("D01"),
      desired: conditionsByScope("D02"),
      // 두 답이 달라도 그대로 보존한다. 다름 자체가 자료다(classification.D.divergence_flag).
      divergence,
      // NO_MAJOR_GAP·UNSURE·NO_SPECIFIC_CHANGE는 결측이 아니라 유효한 응답으로 센다.
      noDeficit: { codes: NO_DEFICIT_CODES, gap: noDeficitOf("D01"), desired: noDeficitOf("D02") },
      // D01 × D02를 범위별로 보존한 표. 합산이 아니라 두 답의 조합을 그대로 남긴다.
      pairByScope: conditionPairsByScope,
    },
    // 좌표는 사람의 유형이 아니라 이 시점에 남긴 기록의 위치다. status를 섞지 않는다.
    coordinates: {
      source: "over39_axis_snapshots",
      // axes를 넘기지 않으면 이 블록은 비어 있다. 화면은 "아직 읽지 않음"으로 표시해야 한다.
      available: Array.isArray(input.axes),
      stagePrecedence: AXIS_STAGE_ORDER,
      responses: axisRows.length,
      stage: { field: "coordinate_stage", ...distribute(axisRows.map((row) => codesOf(row.stage)), { order: ORDERS.coordinate_stage }) },
      status: { field: "coordinate_status", ...distribute(axisRows.map((row) => codesOf(row.status)), { order: ORDERS.coordinate_status }) },
      // 아래 축 분포에 어떤 status가 들어갔는지 화면에서 반드시 함께 밝힌다.
      includedStatuses: COORDINATE_AXIS_STATUSES,
      excludedStatuses: COORDINATE_STATUSES.filter((status) => !COORDINATE_AXIS_STATUSES.includes(status)),
      includedResponses: axisComplete.length,
      // 확정된 좌표 번호와 내부 후보 번호를 구분한다. 후보를 확정처럼 세면 안 된다.
      numbered: numberedAxis.length,
      candidateOnly: axisRows.filter((row) => !Number.isInteger(row.coordinate_number) && Number.isInteger(row.coordinate_candidate)).length,
      axes: { m: axisDist("m_primary"), s: axisDist("s_primary"), d: axisDist("d_primary") },
    },
    // 직군은 분류가 아니라 해석의 위치다. provenance를 섞으면 후보가 확정처럼 읽힌다.
    roleProvenance: {
      field: provenanceField,
      storedIn: `over39_response_snapshots.${CONTEXT_PROVENANCE_PATH.replace(/->/g, ".")}`,
      select: CONTEXT_PROVENANCE_SELECT,
      // false면 값이 화면까지 도달하지 않았다는 뜻이다. who.roleGroup은 그동안 provenance가 섞여 있다.
      available: provenanceAvailable,
      distribution: { field: provenanceField, ...distribute(profileList.map((row) => codesOf(row[provenanceField])), { order: ORDERS.legacy_role_source }) },
      coverage: { field: "legacy_taxonomy_coverage", ...distribute(profileList.map((row) => codesOf(row.legacy_taxonomy_coverage)), { order: ORDERS.legacy_taxonomy_coverage }) },
      byProvenance: roleGroupByProvenance,
      confirmed: profileList.filter((row) => text(row[provenanceField]) === "bridge_confirmed").length,
      candidateOnly: profileList.filter((row) => text(row[provenanceField]) === "context_candidate").length,
      notApplicable: profileList.filter((row) => text(row[provenanceField]) === "not_applicable").length,
      notCovered: profileList.filter((row) => text(row[provenanceField]) === "not_covered").length,
    },
    crossTabs: {
      // presentState.crossTab과 같은 표다. 교차표를 한곳에서 찾는 화면을 위해 여기에도 둔다.
      creativePublicState: presentCross(responseIds),
      // 이 연구의 핵심 가설: 달라진 시점은 분명했지만 보이지 않게 이어지고 있었다.
      transitionContinuity: crossTab(pairs("P11", "P13"), { rowOrder: ORDERS.transition_state, colOrder: ORDERS.invisible_continuity_state, focus: ["CLEAR", "YES"] }),
      memoryTypeTime: crossTab(pairs("M01", "M06"), { rowOrder: ORDERS.memory_type, colOrder: ORDERS.memory_time_band }),
      // 오래 이어온 사람이 어떤 조건을 꼽았는지 = 실제로 오래 작동한 지원의 근사치.
      supportByDuration: crossTab(pairs("P19", "P05"), { rowOrder: ORDERS.support_conditions, colOrder: ORDERS.activity_duration_band }),
    },
    gaps: SCHEMA_GAPS,
  };
}

export const READABILITY_COPY = Object.freeze({
  none: "아직 집계할 연구 표본이 없습니다.",
  counts: `표본이 ${SMALL_SAMPLE_THRESHOLD}건 미만입니다. 비율은 표시하지 않습니다. 경향으로 읽지 마세요.`,
  shares: "비율은 각 문항에 답한 사람 수를 분모로 합니다. 다중선택은 합이 100%를 넘습니다.",
});

// 화면 문구를 여기에 고정한다. 집계는 순수하게 세기만 하지만, 세어진 숫자를 어떤 말로 옮기는지가
// 이 연구에서는 집계와 같은 무게를 갖는다. 렌더러가 문구를 새로 지어내면 연구가 막으려 한
// 결핍 프레임('경력 단절', '무응답', '탈락')이 화면에서 되살아난다.
export const RESEARCH_FRAME_COPY = Object.freeze({
  presentState: "제작·핵심 활동의 상태(P14)와 공개 활동의 상태(P15)를 함께 봅니다. 활동 상태는 '경력 단절' 하나로 뭉개지지 않습니다. 계속 활동하며 보이는 경우, 활동은 이어지지만 밖에서는 잘 보이지 않는 경우, 프로젝트 단위로 드문드문 이어가는 경우, 역할이나 매체가 달라진 경우, 생계·돌봄·건강·제도 때문에 속도가 달라진 경우, 잠시 쉬는 경우가 서로 다른 상태입니다.",
  invisibleIsNotStopped: "이 표에서 확인하려는 것은 하나입니다. \"보이지 않는다 = 멈췄다\"가 아닙니다. 전시 횟수나 지원 횟수가 줄어든 것도 \"지속성이 약해졌다\"가 아닙니다.",
  misread: "아래 자리는 외부 기록만 보면 '경력 단절'로 잘못 읽히기 쉬운 자리입니다. 색이 아니라 이 문장으로 표시합니다.",
  optionSet: "P14·P15의 보기 문구는 전문 경로와 관객·시민 경로에서 다릅니다. RESEARCH_RECORD·SHIFTED·MIXED는 두 경로에 같은 코드로 있지만 뜻이 같지 않으므로 경로별 표를 함께 봅니다.",
  coordinate: "M/S/D 세 축은 한 사람을 분류하기 위한 검사표가 아닙니다. 4×4×4로 64개 위치가 생기지만 64개는 사람의 유형이 아니라 이번 시점에 이 사람이 남긴 기록의 위치(response episode)입니다. 결과가 하나의 좌표로 확정되지 않는 것도 정상이며 complete·mixed·pending_review·insufficient를 모두 허용합니다.",
  coordinateStatus: "축 분포에는 status가 complete인 좌표만 넣었습니다. mixed·pending_review·insufficient를 함께 합산하면 확정되지 않은 판단이 확정된 것처럼 보입니다.",
  coordinateUnavailable: "좌표 스냅샷(over39_axis_snapshots)을 아직 읽지 않았습니다. status 구분이 없는 좌표 집계는 만들지 않습니다.",
  roleProvenance: "직군은 분류가 아니라 해석의 위치입니다. Context가 어떤 R 역할일 가능성을 보여줄 수는 있지만 그것이 자동으로 최종 R 코드가 되지는 않습니다. 참여자가 확정한 역할(bridge_confirmed)과 Context 후보(context_candidate), 적용 대상이 아닌 활동(not_applicable), 기존 분류로 담기지 않는 활동(not_covered)을 나눠서 봅니다.",
  roleProvenanceUnavailable: "역할 확정의 provenance(legacy_role_source)가 이 화면까지 도달하지 않았습니다. 값은 payload.participant_context에 저장돼 있지만 관리자 조회가 그 경로를 읽지 않습니다. 그래서 아래 역할군 분포는 참여자가 확정한 역할과 Context 후보를 구분하지 못한 채 섞여 있습니다.",
  noRecall: "\"특별히 떠오르는 작품이 없다\"는 실패 응답이 아니고 무응답도 아닙니다. 문화예술에 대한 관심이 낮다는 뜻으로도 읽지 않습니다. M축은 확정되지 않을 수 있지만 현재 활동 상태와 조건에 대한 답은 그대로 집계에 남습니다.",
  conditions: "D01(지금 비어 있다고 느끼는 조건)과 D02(가장 먼저 바라는 변화)는 서로 다른 질문입니다. 두 답이 달라도 합치지 않고 그대로 보존합니다.",
  noDeficit: "\"현재 특별히 큰 간극은 없음\"·\"지금 특정한 변화가 필요하다고 느끼지 않음\"·\"아직 잘 모르겠음\"은 결측이 아니라 유효한 응답으로 셉니다. 이 조사는 참여자에게 반드시 문제가 있을 것이라고 전제하지 않습니다.",
});
