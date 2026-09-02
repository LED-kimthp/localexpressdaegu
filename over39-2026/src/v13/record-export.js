// 데이터는 Supabase에 남지만, **사람이 읽는 참여 기록은 서버에 없다.** 참여자 화면의
// 인쇄 버튼은 본인 기기에서만 동작하고, 관리자 화면의 비식별 JSON·CSV는 기계용이다.
// 100명이 참여하면 100장의 기록이 남아야 하는데 지금은 남지 않는다.
//
// 이 파일은 저장된 응답을 "한 사람 = 한 문서"로 조립하는 순수 함수만 담는다. DOM과
// 네트워크는 모른다 (ai-health.js·research-insights.js와 같은 규칙). 조립 결과는
// 인쇄 가능한 HTML 한 파일이며, 참여자별로 `break-before: page`가 들어간다.
//
// 원천은 `over39_response_snapshots.payload`다. 참여자가 쓴 서술 원문, 문항 문구,
// AI 후속질문과 답, 좌표, 동의가 전부 그 안에 있다. 승인 문장만 정규화 테이블
// (`over39_participant_revisions`)을 먼저 본다.

export const RECORD_EXPORT_VERSION = "over39-participation-record-bundle-v1";

// 기본은 연구 표본만. 표본을 섞은 자료로 보고서를 쓰면 되돌릴 수 없다.
export const DEFAULT_SAMPLE_TYPES = Object.freeze(["research"]);

export const SAMPLE_LABELS = Object.freeze({
  research: "연구 표본",
  test: "테스트 표본",
  institution_review: "기관 검토 표본",
  auxiliary_only: "부가 기록만 있는 응답",
});

// 이 묶음은 비식별 자료가 아니다. 파일을 받는 사람이 그것을 모르면 취급이 어긋난다.
export const HANDLING_NOTICE = Object.freeze([
  "이 파일은 참여자가 직접 쓴 서술 원문을 그대로 담습니다. 비식별 자료가 아닙니다.",
  "글 안의 지명·기관·사람 이름으로 개인이 식별될 수 있습니다. 연구팀 안에서만 다루고, 공개·인용에는 참여자가 승인한 문장과 동의 범위를 먼저 확인해 주세요.",
  "이메일과 연락처는 연구 응답과 분리 보관하는 설계이므로 이 묶음에 들어가지 않습니다.",
]);

// 연락처는 `over39_contacts`에 분리 보관하는 설계다. 그래도 옛 응답의 payload.answers에
// `contact.email` 같은 값이 섞여 들어올 수 있으므로, 이름 규칙으로 한 번 더 막는다.
// 설계가 지키는 약속을 파일 하나가 깨는 일은 없어야 한다.
export const CONTACT_FIELD_PATTERN = /(?:^|[._\-[])(?:contact|contacts|email|e_?mail|phone|tel|mobile|kakao|instagram|sns|url|link|address|token|access_token)(?:$|[._\-\]])/i;

// 연락처를 받는 문항. `store`가 `contact.*`이므로 저장 필드는 걸러지지만, payload의
// `fixed_questions[].id`는 K01 같은 문항 번호라서 이름 규칙에 걸리지 않는다.
export const CONTACT_QUESTION_IDS = Object.freeze(["K01", "K02", "K03"]);

const EMAIL_ONLY = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ONLY = /^[+0][\d\s().-]{8,}$/;

// 좌표 축 이름. 참여 기록 문서(response-document.js)와 같은 뜻을 쓰지만, 이 모듈은
// 참여자 화면 모듈에 의존하지 않는다. 연구자는 참여자의 표시 언어와 무관하게 읽으므로
// 한국어 축 이름을 항상 함께 적는다.
export const AXIS_LABELS = Object.freeze({
  M1: "느낌과 분위기", M2: "삶과 기억", M3: "작품의 생각과 표현", M4: "사람과 사회",
  S1: "확장", S2: "지속", S3: "전환", S4: "거리와 한계",
  D1: "접근과 참여", D2: "개인의 기반", D3: "관계와 매개", D4: "제도와 구조",
});

export const COORDINATE_STAGE_LABELS = Object.freeze({
  fixed: "고정문항에서 도출",
  depth: "심화 대화 뒤",
  research_derived: "연구 파생",
  participant_final: "참여자 확인 뒤 최종",
});

export const CONSENT_LABELS = Object.freeze({
  research: "연구 참여",
  data_processing: "AI 처리 안내 확인",
  research_analysis: "비식별 분석 활용",
  anonymous_quotation: "익명 인용",
  future_public_contact: "향후 공개 활용 재확인 연락",
  research_contact_storage: "연락처 분리 보관",
  relationship: "관계 참여",
});

export const POLICY_LABELS = Object.freeze({
  research_use: "연구 활용 범위",
  quote_use: "인용 범위",
  public_archive_interest: "공개 아카이브 의사",
  ANON_ANALYSIS: "비식별 분석까지 허용",
  ANON_EXCERPT: "익명 발췌 인용 허용",
  ASK_LATER: "나중에 다시 물어봐 달라",
  NO_ANALYSIS: "분석 활용 원하지 않음",
  NO_QUOTE: "인용 원하지 않음",
  NO_CONTACT: "연락 원하지 않음",
});

const DISPLAY_NAME_MODE_LABELS = Object.freeze({
  ANONYMOUS: "익명으로 표기",
  NAME: "적어 준 이름으로 표기",
  INITIAL: "이니셜로 표기",
  NICKNAME: "닉네임으로 표기",
});

// 완성도 순서. 같은 사람의 스냅샷이 두 단계(fixed_complete, final)로 남으므로
// 그대로 세면 한 사람이 두 번 계산된다. research-insights.js의 latestPerQuestion()이
// 다루는 함정과 같다. 여기서는 문항이 아니라 사람 단위로 하나만 남긴다.
const PHASE_RANK = Object.freeze({
  final: 3,
  research_submission: 3,
  fixed_complete: 1,
  fixed_snapshot: 1,
});

const text = (value) => String(value ?? "").trim();
const array = (value) => (Array.isArray(value) ? value : value === null || value === undefined || value === "" ? [] : [value]);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

/** 연락처로 읽힐 수 있는 필드인지. 이름 규칙 하나로 payload 어디서든 같게 판단한다. */
export function isContactField(name) {
  const key = String(name ?? "");
  return CONTACT_FIELD_PATTERN.test(key) || CONTACT_QUESTION_IDS.includes(key);
}

/**
 * 답 전체가 연락처인지. 문항 이름이 무엇이든 값이 곧 연락처면 이 묶음에 담지 않는다.
 * 서술 안에 섞여 있는 연락처는 지우지 않는다. 원문을 잘라내면 연구 자료가 줄고,
 * 이 파일은 애초에 식별 가능한 서술을 담는 파일이라고 첫머리에 밝히고 있다.
 */
export function isContactValue(value) {
  const written = String(value ?? "").trim();
  if (EMAIL_ONLY.test(written)) return true;
  // 연도 범위("1998-2005")를 전화번호로 오인하지 않게, +나 0으로 시작하고 숫자 9자 이상일 때만 본다.
  return PHONE_ONLY.test(written) && (written.match(/\d/g) || []).length >= 9;
}

export function snapshotRank(row) {
  const phase = text(row?.submission_phase);
  // 알 수 없는 단계는 "완료보다는 낮고 고정문항 저장보다는 높다"로 둔다. 새 단계 이름이
  // 생겼을 때 옛 스냅샷이 최신 기록을 덮어쓰지 않게 하는 쪽이 안전하다.
  return PHASE_RANK[phase] ?? 2;
}

/**
 * 한 응답에 여러 스냅샷이 있을 때 문서로 쓸 하나를 고른다.
 * 완성도가 높은 쪽, 같으면 나중에 저장된 쪽.
 */
export function pickBestSnapshot(current, candidate) {
  if (!current) return candidate;
  if (!candidate) return current;
  const rankDiff = snapshotRank(candidate) - snapshotRank(current);
  if (rankDiff !== 0) return rankDiff > 0 ? candidate : current;
  return text(candidate.created_at) >= text(current.created_at) ? candidate : current;
}

/**
 * 스냅샷 행을 응답 단위로 접는다. 페이지네이션으로 여러 번 나눠 들어와도 같은 결과가
 * 되도록 이전 결과(`into`)를 받아 누적한다. 그래야 브라우저가 payload 전체를
 * 한꺼번에 들고 있지 않아도 된다.
 * @returns {{kept: Map<string, object>, seen: number, collapsed: number}}
 */
export function collectSnapshots(rows = [], into = null) {
  const state = into || { kept: new Map(), seen: 0, collapsed: 0 };
  for (const row of array(rows)) {
    const responseId = text(row?.response_id);
    if (!responseId) continue;
    state.seen += 1;
    const current = state.kept.get(responseId);
    if (current) state.collapsed += 1;
    state.kept.set(responseId, pickBestSnapshot(current, row));
  }
  return state;
}

function displayLabelOf(payload) {
  const answers = payload?.answers || {};
  const fromDocument = payload?.response_document?.participant || {};
  const mode = text(answers.display_name_mode || fromDocument.display_name_mode) || "ANONYMOUS";
  // 참여자가 익명을 골랐다면 적어 둔 이름이 남아 있어도 문서에 쓰지 않는다.
  const name = mode === "ANONYMOUS" ? "" : text(answers.display_name) || text(fromDocument.display_name);
  return {
    mode,
    modeLabel: DISPLAY_NAME_MODE_LABELS[mode] || mode,
    name,
    label: name || (mode === "ANONYMOUS" ? "익명" : "표기 없음"),
    provided: Boolean(name),
  };
}

function answerValueText(answer, display) {
  const shown = text(display);
  if (shown) return shown;
  if (answer === null || answer === undefined || answer === "") return "";
  if (typeof answer === "object") return JSON.stringify(answer, null, 0);
  return String(answer);
}

// 코드형 답은 사람이 읽는 문구만 남기면 원자료를 잃는다. 문자열이 아닌 답(다중선택,
// 지역 배열 등)에는 저장된 원형을 함께 남긴다.
function rawAnswerText(answer) {
  if (answer === null || answer === undefined || answer === "") return "";
  if (typeof answer === "string" || typeof answer === "number" || typeof answer === "boolean") return "";
  return JSON.stringify(answer);
}

function answersFromPayload(payload) {
  const fixed = array(payload?.fixed_questions).filter((item) => item && !isContactField(item.id));
  if (fixed.length) {
    return {
      labelled: true,
      rows: fixed.map((item) => ({
        id: text(item.id),
        question: text(item.question_text) || text(item.provenance?.original_question_text) || text(item.id),
        axis: text(item.axis),
        answer: answerValueText(item.answer, item.answer_display),
        raw: rawAnswerText(item.answer),
      })).filter((row) => (row.answer || row.raw) && !isContactValue(row.answer)),
    };
  }
  // 옛 응답에는 문항 문구가 없다. 그렇다고 답을 버리면 그 사람의 기록이 사라지므로
  // 필드 이름과 값을 그대로 남기고, 문구가 없다는 사실을 문서에 밝힌다.
  const entries = array(payload?.raw_answers).length
    ? array(payload?.raw_answers).map((item) => [text(item?.field), item?.answer])
    : Object.entries(payload?.answers || {});
  return {
    labelled: false,
    rows: entries
      .filter(([field]) => field && !isContactField(field))
      .map(([field, value]) => ({ id: field, question: field, axis: "", answer: answerValueText(value, ""), raw: "" }))
      .filter((row) => row.answer && row.answer !== "{}" && row.answer !== "[]" && !isContactValue(row.answer)),
  };
}

// 서술이 아니라 운영값인 문자열. 시각·판본·식별자는 참여자가 쓴 문장이 아니다.
const NON_NARRATIVE_FIELD = /(?:_at|_version|_id|_ids|_mode|_status|_code|_provenance|_language)$/i;
const NON_NARRATIVE_VALUE = /^(?:\d{4}-\d{2}-\d{2}|[A-Z0-9_.:-]+)$/;

// 참여자가 직접 쓴 문장이 문항 표·후속질문 어디에도 나타나지 않는 경우를 위한 안전망.
// 옛 payload나 예상하지 못한 구조에서도 서술 원문이 조용히 빠지지 않게 한다.
function orphanNarratives(payload, shown) {
  const seen = new Set(shown.map((value) => text(value)).filter(Boolean));
  const rows = [];
  const push = (field, value) => {
    const written = text(value);
    if (!written || seen.has(written) || isContactField(field) || isContactValue(written)) return;
    seen.add(written);
    rows.push({ field: text(field), text: written });
  };
  // 참여 기록 문서가 이미 모아 둔 "참여자가 직접 쓴 문장"이 1순위다.
  for (const entry of array(payload?.response_document?.layers).find((layer) => layer?.id === "raw_participant_words")?.entries || []) {
    push(entry?.field, entry?.text);
  }
  for (const [field, value] of Object.entries(payload?.answers || {})) {
    // 서술로 볼 수 있는 것만: 문자열이고, 코드·시각이 아니라 문장에 가까운 것.
    if (typeof value !== "string" || value.trim().length < 12) continue;
    if (NON_NARRATIVE_FIELD.test(field) || NON_NARRATIVE_VALUE.test(value.trim())) continue;
    push(field, value);
  }
  // 회수함: 답을 바꾸며 화면에서 물러났지만 보존된 문장. 활성 답이 아니라 표에는
  // 없어도, 연구자가 원문을 읽는 이 묶음에는 보여야 한다(flow.js가 한 약속).
  for (const [field, value] of Object.entries(payload?.answers?.withdrawn_answers || {})) {
    if (typeof value !== "string") continue;
    push(`회수됨 · ${field}`, value);
  }
  return rows;
}

function followupsFromPayload(payload) {
  const depth = payload?.depth_interview || {};
  const turns = array(depth.turns);
  if (turns.length) {
    return {
      mode: text(depth.mode) || "adaptive",
      source: text(depth.source),
      rows: turns.map((turn, index) => ({
        position: index + 1,
        axis: text(turn?.axis),
        checkpoint: text(turn?.anchor_id || turn?.checkpoint),
        prompt: text(turn?.prompt),
        intent: text(turn?.intent),
        source: text(turn?.source),
        model: text(turn?.model),
        answer: text(turn?.answer_text),
        selfCheck: text(turn?.self_check_value),
        needReason: text(turn?.need_reason || turn?.need_decision),
      })),
    };
  }
  // RC1 흐름은 질문 3개와 축별 답이 따로 저장된다.
  const questions = array(depth.questions);
  const answers = array(depth.answers);
  if (!questions.length && !answers.length) return { mode: text(depth.mode), source: text(depth.source), rows: [] };
  const byAxis = new Map(answers.map((item) => [text(item?.axis), item]));
  const rows = questions.map((item, index) => {
    const answer = byAxis.get(text(item?.axis)) || {};
    byAxis.delete(text(item?.axis));
    return {
      position: index + 1,
      axis: text(item?.axis),
      checkpoint: "",
      prompt: text(item?.prompt),
      intent: text(item?.intent),
      source: text(item?.source || depth.source),
      model: "",
      answer: text(answer.text),
      selfCheck: text(answer.value),
      needReason: "",
    };
  });
  // 질문 없이 답만 남은 축도 버리지 않는다.
  for (const [axis, answer] of byAxis) {
    if (!text(answer?.text) && !text(answer?.value)) continue;
    rows.push({ position: rows.length + 1, axis, checkpoint: "", prompt: "", intent: "", source: "", model: "", answer: text(answer?.text), selfCheck: text(answer?.value), needReason: "" });
  }
  return { mode: text(depth.mode) || "axis_confirmation", source: text(depth.source), rows };
}

const axisText = (code) => (AXIS_LABELS[code] ? `${code} ${AXIS_LABELS[code]}` : code ? String(code) : "—");

function coordinateFromPayload(payload) {
  const snapshots = payload?.coordinate_snapshots || {};
  const order = ["fixed", "depth", "research_derived", "participant_final"];
  const stages = order
    .map((key) => ({ key, value: snapshots[key] }))
    .filter((item) => item.value)
    .map(({ key, value }) => ({
      stage: key,
      stageLabel: COORDINATE_STAGE_LABELS[key] || key,
      // `source`가 근거다. 고정문항에서 도출된 좌표와 참여자가 직접 고른 좌표는 다른 사실이다.
      source: text(value.source),
      status: text(value.status),
      m: text(value.m_primary),
      s: text(value.s_primary),
      d: text(value.d_primary),
      number: value.coordinate_number ?? null,
      candidate: value.coordinate_candidate ?? null,
      contextTags: array(value.s_context_tags).map(text).filter(Boolean),
      recordedAt: text(value.recorded_at),
    }));
  const axes = payload?.axes || {};
  const answers = payload?.answers || {};
  // 좌표가 어떤 답에서 나왔는지. 코드만 남기면 나중에 되짚을 수 없다.
  const derivedFrom = [
    ["기억의 의미(M 선언)", axes.m_declared],
    ["기억을 지지한 요소", array(axes.m_support_tags).join(" · ")],
    ["현재 비어 있는 조건(D)", axes.d_current_gap],
    ["바라는 변화(D)", axes.d_desired_change_primary],
    ["활동·참여 상태(S 근거)", answers.activity_state],
    ["드러남의 상태(S 근거)", answers.visibility_state],
    ["멈춤의 의미(S 근거)", answers.pause_meaning],
  ].map(([label, value]) => ({ label, value: text(value) })).filter((item) => item.value);
  const documentCoordinate = payload?.response_document?.coordinate || {};
  const readingLayer = array(payload?.response_document?.layers).find((layer) => layer?.id === "research_reading");
  return {
    stages,
    derivedFrom,
    // 참여자가 실제로 읽은 문장. 표시 언어가 한국어가 아니어도 그대로 남긴다.
    participantReading: array(readingLayer?.paragraphs).map(text).filter(Boolean),
    // 참여자가 확인한 좌표가 없으면 실제로 남아 있는 마지막 단계를 쓴다. 참여 기록 문서에
    // 캐시된 좌표를 먼저 보면, 중간에 멈춘 응답에서 저장된 단계와 다른 값이 머리에 오른다.
    final: stages.find((stage) => stage.stage === "participant_final")
      || stages.find((stage) => stage.stage === "research_derived")
      || stages.at(-1)
      || { m: text(documentCoordinate.m), s: text(documentCoordinate.s), d: text(documentCoordinate.d), stageLabel: "정리되지 않음", source: "", status: "", number: null, candidate: null, contextTags: [] },
    scope: text(payload?.coordinate_scope),
    feedback: text(answers.coordinate_feedback_text),
  };
}

function consentFromPayload(payload, events) {
  const consent = payload?.consent || {};
  const items = Object.entries(consent)
    .filter(([key]) => key !== "consent_version")
    .map(([key, granted]) => ({ key, label: CONSENT_LABELS[key] || key, granted: granted === true, recorded: typeof granted === "boolean" }));
  const policy = Object.entries(payload?.policy_use_scope || {})
    .map(([key, value]) => ({ key, label: POLICY_LABELS[key] || key, value: text(value), valueLabel: POLICY_LABELS[text(value)] || text(value) }))
    .filter((item) => item.value);
  return {
    version: text(consent.consent_version),
    items,
    policy,
    // `over39_consent_events`가 함께 들어오면 언제 무엇을 눌렀는지가 이력으로 남는다.
    events: array(events).map((row) => ({
      type: text(row?.consent_type),
      label: CONSENT_LABELS[text(row?.consent_type)] || text(row?.consent_type),
      granted: row?.granted === true,
      eventType: text(row?.event_type),
      at: text(row?.created_at),
    })).sort((a, b) => a.at.localeCompare(b.at)),
  };
}

/**
 * 한 사람의 문서 하나. payload 하나를 사람이 읽는 구조로 옮기기만 하고, 줄이지 않는다.
 * @param {{session?: object, snapshot?: object, revision?: object, consentEvents?: Array<object>}} input
 */
export function buildRecord({ session = {}, snapshot = null, revision = null, consentEvents = [] } = {}) {
  const payload = snapshot?.payload || {};
  const responseId = text(payload.response_id) || text(snapshot?.response_id) || text(session.response_id);
  const answers = answersFromPayload(payload);
  const followups = followupsFromPayload(payload);
  const reflection = payload.reflection || {};
  // 승인 문장은 정규화 테이블이 먼저다. payload는 제출 시점 값이고, 테이블 값은
  // 이후 갱신까지 반영된다.
  const approvedText = text(revision?.participant_approved_text) || text(reflection.participant_approved_text);
  const approvedKorean = text(reflection.participant_approved_text_ko);
  const shown = [
    ...answers.rows.map((row) => row.answer),
    ...followups.rows.flatMap((row) => [row.prompt, row.answer]),
    approvedText,
    approvedKorean,
  ];
  const narratives = orphanNarratives(payload, shown);
  const coordinate = coordinateFromPayload(payload);
  const gaps = [];
  if (!snapshot) gaps.push("이 응답에는 스냅샷이 없습니다. 세션 행만 남아 문서에 담을 서술이 없습니다.");
  else if (!Object.keys(payload).length) gaps.push("스냅샷의 payload가 비어 있습니다.");
  if (!answers.rows.length) gaps.push("문항별 답을 읽을 수 없습니다.");
  else if (!answers.labelled) gaps.push("이 응답에는 문항 문구가 저장되지 않았습니다(옛 판본). 필드 이름과 값만 남습니다.");
  if (!approvedText) gaps.push("참여자가 승인한 최종 문장이 없습니다(정리 단계 전에 멈춤 또는 정리 거절).");
  if (!followups.rows.length) gaps.push("AI 후속질문 기록이 없습니다.");
  if (!coordinate.stages.length) gaps.push("좌표 스냅샷이 없습니다.");

  return {
    responseId,
    // 스냅샷 단계. 완료되지 않은 응답도 문서로 남긴다. 중간에 멈춘 기록도 자료다.
    submissionPhase: text(payload.submission_phase) || text(snapshot?.submission_phase),
    status: text(session.status),
    sampleType: text(session.sample_type) || text(payload.sample_type),
    institutionCode: text(session.institution_code) || text(payload.institution_code),
    route: text(payload.route) || text(session.route),
    displayLabel: displayLabelOf(payload),
    // 참여자 확인용 공개 코드. 이메일이 아니므로 문서에 남겨 응답을 되짚을 수 있게 한다.
    participantCode: text(payload.participant_reference?.code || payload.participant_reference?.public_code),
    submittedAt: text(payload.submitted_at) || text(snapshot?.created_at) || text(session.completed_at) || text(session.updated_at),
    confirmedAt: text(payload.document_confirmation?.confirmed_at),
    languages: {
      source: text(payload.source_language) || text(session.source_language),
      interface: text(payload.interface_language),
    },
    versions: {
      questionnaire: text(payload.questionnaire_version) || text(session.questionnaire_version),
      release: text(payload.release_version) || text(session.release_version),
      classification: text(payload.classification_version) || text(session.classification_version),
      document: text(payload.response_document_version),
    },
    approved: {
      text: approvedText,
      korean: approvedKorean,
      action: text(reflection.participant_action),
      summarySource: text(reflection.summary_source),
      revision: text(reflection.participant_revision),
      translationStatus: text(reflection.translation_status),
      approvedInTable: Boolean(text(revision?.participant_approved_text)),
    },
    answers,
    narratives,
    followups,
    coordinate,
    consent: consentFromPayload(payload, consentEvents),
    gaps,
  };
}

/**
 * 저장된 응답 전체를 문서 묶음 자료로 만든다.
 * @param {{sessions?: Array<object>, snapshots?: Array<object>, revisions?: Array<object>, consentEvents?: Array<object>}} input
 * @param {{sampleTypes?: Array<string>, generatedAt?: string, notes?: Array<string>}} options
 */
export function buildRecordBundle(input = {}, options = {}) {
  const sampleTypes = array(options.sampleTypes).length ? array(options.sampleTypes).map(text) : [...DEFAULT_SAMPLE_TYPES];
  const sessions = array(input.sessions).filter((row) => text(row?.response_id));
  const inSample = sessions.filter((row) => sampleTypes.includes(text(row.sample_type)));
  const collected = input.snapshotState || collectSnapshots(input.snapshots);
  const revisions = new Map();
  for (const row of array(input.revisions)) {
    const key = text(row?.response_id);
    if (!key) continue;
    // 같은 응답에 수정이 여러 번 남을 수 있다. 마지막 승인 문장이 참여자의 뜻이다.
    const previous = revisions.get(key);
    if (!previous || text(row.updated_at || row.created_at) >= text(previous.updated_at || previous.created_at)) revisions.set(key, row);
  }
  const consentByResponse = new Map();
  for (const row of array(input.consentEvents)) {
    const key = text(row?.response_id);
    if (!key) continue;
    if (!consentByResponse.has(key)) consentByResponse.set(key, []);
    consentByResponse.get(key).push(row);
  }

  const records = inSample
    .map((session) => buildRecord({
      session,
      snapshot: collected.kept.get(text(session.response_id)) || null,
      revision: revisions.get(text(session.response_id)) || null,
      consentEvents: consentByResponse.get(text(session.response_id)) || [],
    }))
    // 시간순으로 읽어야 표본이 쌓이는 흐름이 보인다.
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.responseId.localeCompare(b.responseId))
    .map((record, index) => ({ ...record, order: index + 1 }));

  const excluded = {};
  for (const row of sessions) {
    const type = text(row.sample_type) || "미기록";
    if (sampleTypes.includes(type)) continue;
    excluded[type] = (excluded[type] || 0) + 1;
  }

  return {
    version: RECORD_EXPORT_VERSION,
    meta: {
      generatedAt: text(options.generatedAt) || new Date().toISOString(),
      sampleTypes,
      sampleLabels: sampleTypes.map((type) => SAMPLE_LABELS[type] || type),
      sessionsSeen: sessions.length,
      records: records.length,
      completed: records.filter((record) => record.status === "completed").length,
      withApprovedText: records.filter((record) => record.approved.text).length,
      withFollowups: records.filter((record) => record.followups.rows.length).length,
      withDisplayLabel: records.filter((record) => record.displayLabel.provided).length,
      snapshotsSeen: collected.seen,
      snapshotsCollapsed: collected.collapsed,
      missingSnapshot: records.filter((record) => !record.answers.rows.length).map((record) => record.responseId),
      unlabelledPayloads: records.filter((record) => record.answers.rows.length && !record.answers.labelled).map((record) => record.responseId),
      excluded,
      // 잘림·실패는 조용히 넘기지 않는다. 내려받은 파일 안에 그 사실이 남아야 한다.
      notes: array(options.notes).map(text).filter(Boolean),
    },
    records,
  };
}

/** 파일명에 담긴 표본과 날짜가 곧 보관 규칙이 된다. */
export function recordBundleFilename(bundle, extension = "html") {
  const date = text(bundle?.meta?.generatedAt).slice(0, 10) || "unknown-date";
  const sample = array(bundle?.meta?.sampleTypes).join("+") || "unknown-sample";
  return `over39-participation-records_${sample}_${date}.${extension}`;
}

const STYLE = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; padding: 28px 22px 60px; background: #fff; color: #14110f;
  font-family: -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Nanum Gothic", sans-serif;
  font-size: 14px; line-height: 1.72; }
main, header, nav { max-width: 940px; margin: 0 auto; }
h1 { font-size: 22px; margin: 0 0 6px; letter-spacing: -0.01em; }
h2 { font-size: 17px; margin: 0 0 4px; }
h3 { font-size: 13px; margin: 22px 0 6px; text-transform: none; letter-spacing: 0.02em; color: #6a5f57; }
p { margin: 0 0 8px; }
.kicker { font-size: 11px; letter-spacing: 0.18em; color: #8a7d73; margin: 0 0 10px; }
.notice { border: 1.5px solid #14110f; padding: 14px 16px; margin: 0 0 18px; background: #f7f4f1; }
.notice p { margin: 0 0 6px; }
.notice p:last-child { margin: 0; }
.meta { border-top: 1px solid #d8d0c9; border-bottom: 1px solid #d8d0c9; padding: 12px 0; margin: 0 0 18px;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px 18px; }
.meta div { font-size: 12px; }
.meta dt { color: #8a7d73; margin: 0; }
.meta dd { margin: 2px 0 0; font-weight: 700; }
.gaps { margin: 0 0 18px; padding: 12px 16px; border: 1px solid #d8d0c9; background: #fffdf7; font-size: 12px; }
.gaps ul { margin: 6px 0 0; padding-left: 18px; }
.toc { margin: 0 0 10px; font-size: 12px; }
.toc ol { margin: 6px 0 0; padding-left: 22px; columns: 2; column-gap: 26px; }
.toc a { color: #14110f; }
.record { border-top: 3px solid #14110f; padding: 20px 0 0; margin: 34px 0 0; }
.record-head { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: baseline; margin: 0 0 10px; }
.record-head .no { font-size: 12px; letter-spacing: 0.14em; color: #8a7d73; }
.record-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 6px 18px;
  font-size: 12px; border-bottom: 1px solid #e4ded8; padding: 0 0 12px; margin: 0 0 6px; }
.record-facts dt { color: #8a7d73; margin: 0; }
.record-facts dd { margin: 1px 0 0; }
blockquote { margin: 0 0 10px; padding: 12px 14px; border-left: 3px solid #14110f; background: #f7f4f1;
  white-space: pre-wrap; overflow-wrap: anywhere; }
blockquote .src { display: block; font-size: 11px; color: #8a7d73; margin: 0 0 4px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 0 0 8px; }
th, td { text-align: left; vertical-align: top; padding: 7px 9px; border-bottom: 1px solid #e4ded8;
  white-space: pre-wrap; overflow-wrap: anywhere; }
th[scope="col"] { font-size: 11px; letter-spacing: 0.08em; color: #6a5f57; border-bottom: 1.5px solid #14110f; }
th[scope="row"] { width: 38%; font-weight: 600; }
td .raw { display: block; font-size: 11px; color: #8a7d73; margin-top: 3px; }
.qa { border-bottom: 1px solid #e4ded8; padding: 10px 0; }
.qa .q { font-weight: 700; margin: 0 0 4px; }
.qa .a { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; }
.qa .tag { font-size: 11px; color: #8a7d73; }
.empty { font-size: 12px; color: #8a7d73; }
.chip { display: inline-block; font-size: 11px; border: 1px solid #14110f; padding: 1px 7px; margin: 0 4px 4px 0; }
.chip.no { border-color: #b8aca3; color: #8a7d73; }
.record-gaps { font-size: 12px; background: #fffdf7; border: 1px solid #d8d0c9; padding: 10px 14px; margin: 12px 0 0; }
.record-gaps ul { margin: 4px 0 0; padding-left: 18px; }
@media print {
  @page { size: A4; margin: 16mm 14mm; }
  body { padding: 0; font-size: 10.5pt; line-height: 1.6; }
  .toc { display: none; }
  /* 참여자 1명 = 종이 1장 이상. 기록이 서로 이어 붙지 않아야 100장을 셀 수 있다. */
  .record { break-before: page; page-break-before: always; border-top-width: 2px; margin-top: 0; padding-top: 12px; }
  .record:first-of-type { break-before: auto; page-break-before: auto; }
  .qa, blockquote, tr, .record-facts, .record-gaps { break-inside: avoid; page-break-inside: avoid; }
  h2, h3 { break-after: avoid; page-break-after: avoid; }
  a { text-decoration: none; color: inherit; }
}
`;

const dl = (pairs) => pairs
  .filter(([, value]) => text(value))
  .map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
  .join("");

function renderAnswers(record) {
  if (!record.answers.rows.length) return `<p class="empty">문항별 답을 읽을 수 없습니다.</p>`;
  return `<table><thead><tr><th scope="col">문항</th><th scope="col">답</th></tr></thead><tbody>${record.answers.rows.map((row) => `<tr><th scope="row">${esc(row.question)}${row.id && row.id !== row.question ? `<br /><span class="tag">${esc(row.id)}${row.axis ? ` · ${esc(row.axis)}` : ""}</span>` : ""}</th><td>${esc(row.answer)}${row.raw ? `<span class="raw">저장된 값: ${esc(row.raw)}</span>` : ""}</td></tr>`).join("")}</tbody></table>`;
}

function renderFollowups(record) {
  if (!record.followups.rows.length) return `<p class="empty">후속질문 기록이 없습니다.</p>`;
  return record.followups.rows.map((row) => `<div class="qa"><p class="q">${row.position}. ${esc(row.prompt || "질문 문구가 저장되지 않았습니다.")}</p><p class="a">${esc(row.answer || "답을 남기지 않았습니다.")}</p><p class="tag">${esc([row.checkpoint, row.axis ? `${row.axis}축` : "", row.source, row.model, row.selfCheck ? `자기확인 ${row.selfCheck}` : "", row.needReason].filter(Boolean).join(" · ") || "출처 미기록")}</p></div>`).join("");
}

function renderCoordinate(record) {
  const final = record.coordinate.final;
  const stages = record.coordinate.stages.length
    ? `<table><thead><tr><th scope="col">단계</th><th scope="col">M · S · D</th><th scope="col">번호</th><th scope="col">근거</th></tr></thead><tbody>${record.coordinate.stages.map((stage) => `<tr><th scope="row">${esc(stage.stageLabel)}</th><td>${esc([axisText(stage.m), axisText(stage.s), axisText(stage.d)].join(" × "))}</td><td>${esc(stage.number ?? (stage.candidate ? `후보 ${stage.candidate}` : "—"))}</td><td>${esc([stage.source, stage.status, stage.contextTags.join(" · ")].filter(Boolean).join(" · ") || "미기록")}</td></tr>`).join("")}</tbody></table>`
    : `<p class="empty">좌표 스냅샷이 없습니다.</p>`;
  const derived = record.coordinate.derivedFrom.length
    ? `<table><tbody>${record.coordinate.derivedFrom.map((item) => `<tr><th scope="row">${esc(item.label)}</th><td>${esc(item.value)}</td></tr>`).join("")}</tbody></table>`
    : "";
  return `<p><strong>${esc([axisText(final.m), axisText(final.s), axisText(final.d)].join(" × "))}</strong> · ${esc(final.stageLabel || "단계 미기록")}${final.number ? ` · 좌표 ${final.number}` : ""}</p>
    ${stages}
    ${derived ? `<h3>좌표의 근거가 된 답</h3>${derived}` : ""}
    ${record.coordinate.participantReading.length ? `<h3>참여자가 읽은 문장</h3>${record.coordinate.participantReading.map((line) => `<p>${esc(line)}</p>`).join("")}` : ""}
    ${record.coordinate.feedback ? `<h3>좌표에 대한 참여자 의견</h3><blockquote>${esc(record.coordinate.feedback)}</blockquote>` : ""}`;
}

function renderConsent(record) {
  const consent = record.consent;
  const chips = consent.items.length
    ? consent.items.map((item) => `<span class="chip${item.granted ? "" : " no"}">${esc(item.label)} ${item.granted ? "동의" : "동의 안 함"}</span>`).join("")
    : `<p class="empty">동의 기록이 payload에 없습니다.</p>`;
  const policy = consent.policy.length
    ? `<table><tbody>${consent.policy.map((item) => `<tr><th scope="row">${esc(item.label)}</th><td>${esc(item.valueLabel)}${item.valueLabel !== item.value ? ` <span class="raw">${esc(item.value)}</span>` : ""}</td></tr>`).join("")}</tbody></table>`
    : "";
  const events = consent.events.length
    ? `<table><thead><tr><th scope="col">시각</th><th scope="col">항목</th><th scope="col">기록</th></tr></thead><tbody>${consent.events.map((event) => `<tr><th scope="row">${esc(event.at || "시각 미기록")}</th><td>${esc(event.label)}</td><td>${esc(`${event.granted ? "동의" : "동의 안 함"}${event.eventType ? ` · ${event.eventType}` : ""}`)}</td></tr>`).join("")}</tbody></table>`
    : "";
  return `${chips}${consent.version ? `<p class="tag">동의 판본 ${esc(consent.version)}</p>` : ""}${policy ? `<h3>활용 범위</h3>${policy}` : ""}${events ? `<h3>동의 이력</h3>${events}` : ""}`;
}

function renderRecord(record) {
  const label = record.displayLabel;
  return `<article class="record" id="record-${String(record.order).padStart(3, "0")}">
    <div class="record-head"><span class="no">기록 ${String(record.order).padStart(3, "0")}</span><h2>${esc(label.label)}</h2></div>
    <dl class="record-facts">${dl([
      ["참여자 표기", `${label.label} (${label.modeLabel})`],
      ["응답 시각", record.submittedAt],
      ["표본 구분", `${SAMPLE_LABELS[record.sampleType] || record.sampleType || "미기록"}${record.institutionCode ? ` · ${record.institutionCode}` : ""}`],
      ["진행 상태", `${record.status || "미기록"}${record.submissionPhase ? ` · ${record.submissionPhase}` : ""}`],
      ["작성 언어", record.languages.source + (record.languages.interface && record.languages.interface !== record.languages.source ? ` (화면 ${record.languages.interface})` : "")],
      ["시작 경로", record.route],
      ["응답 ID", record.responseId],
      ["참여자 확인 코드", record.participantCode],
      ["질문지 판본", record.versions.questionnaire],
      ["배포 판본", record.versions.release],
    ])}</dl>
    <h3>참여자가 승인한 최종 문장</h3>
    ${record.approved.text ? `<blockquote>${record.approved.korean && record.approved.korean !== record.approved.text ? `<span class="src">원문</span>` : ""}${esc(record.approved.text)}</blockquote>${record.approved.korean && record.approved.korean !== record.approved.text ? `<blockquote><span class="src">한국어 번역</span>${esc(record.approved.korean)}</blockquote>` : ""}<p class="tag">${esc([record.approved.action ? `참여자 선택 ${record.approved.action}` : "", record.approved.summarySource ? `정리 출처 ${record.approved.summarySource}` : "", record.approved.translationStatus].filter(Boolean).join(" · "))}</p>` : `<p class="empty">승인된 문장이 없습니다.</p>`}
    <h3>문항별 답</h3>
    ${renderAnswers(record)}
    <h3>AI 후속질문과 답</h3>
    ${renderFollowups(record)}
    ${record.narratives.length ? `<h3>다른 칸에 나타나지 않은 참여자 서술</h3>${record.narratives.map((item) => `<blockquote><span class="src">${esc(item.field)}</span>${esc(item.text)}</blockquote>`).join("")}` : ""}
    <h3>참여 기록의 좌표와 근거</h3>
    ${renderCoordinate(record)}
    <h3>동의</h3>
    ${renderConsent(record)}
    ${record.gaps.length ? `<div class="record-gaps"><strong>이 기록에서 빠진 것</strong><ul>${record.gaps.map((gap) => `<li>${esc(gap)}</li>`).join("")}</ul></div>` : ""}
  </article>`;
}

/**
 * 묶음 자료를 인쇄 가능한 HTML 한 파일로 만든다. 스크립트도 외부 요청도 없다.
 * @param {ReturnType<typeof buildRecordBundle>} bundle
 */
export function renderRecordBundleHtml(bundle) {
  const meta = bundle?.meta || {};
  const records = array(bundle?.records);
  const title = `〈만 39세 이상〉 참여 기록 묶음 · ${array(meta.sampleLabels).join(" + ") || "표본 미지정"} · ${records.length}명`;
  const excluded = Object.entries(meta.excluded || {});
  const gaps = [
    records.length ? "" : "담긴 기록이 없습니다. 표본 구분과 관리자 권한을 확인해 주세요.",
    array(meta.missingSnapshot).length ? `스냅샷을 찾지 못해 서술이 비어 있는 응답 ${meta.missingSnapshot.length}건: ${meta.missingSnapshot.join(", ")}` : "",
    array(meta.unlabelledPayloads).length ? `문항 문구가 저장되지 않은 옛 응답 ${meta.unlabelledPayloads.length}건: ${meta.unlabelledPayloads.join(", ")}` : "",
    meta.records > meta.withApprovedText ? `승인된 최종 문장이 없는 기록 ${meta.records - meta.withApprovedText}건 (정리 단계 전에 멈춘 응답을 포함해 그대로 담았습니다)` : "",
    excluded.length ? `이 파일에 담지 않은 표본: ${excluded.map(([type, count]) => `${SAMPLE_LABELS[type] || type} ${count}건`).join(" · ")}` : "",
    ...array(meta.notes),
  ].filter(Boolean);

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<header>
  <p class="kicker">OVER39 · PARTICIPATION RECORDS</p>
  <h1>${esc(title)}</h1>
  <div class="notice">${HANDLING_NOTICE.map((line) => `<p>${esc(line)}</p>`).join("")}</div>
  <dl class="meta">${dl([
    ["담긴 기록", `${records.length}명`],
    ["표본 구분", array(meta.sampleLabels).join(" + ")],
    ["완료된 응답", `${meta.completed ?? 0}명`],
    ["승인 문장 있음", `${meta.withApprovedText ?? 0}명`],
    ["후속질문 기록 있음", `${meta.withFollowups ?? 0}명`],
    ["참여자 표기 남김", `${meta.withDisplayLabel ?? 0}명`],
    ["읽은 세션 행", `${meta.sessionsSeen ?? 0}건`],
    ["읽은 스냅샷", `${meta.snapshotsSeen ?? 0}건 (같은 사람의 중복 ${meta.snapshotsCollapsed ?? 0}건 접음)`],
    ["만든 시각", meta.generatedAt],
    ["형식 판본", bundle?.version],
  ])}</dl>
  ${gaps.length ? `<div class="gaps"><strong>이 파일에 담기지 않은 것</strong><ul>${gaps.map((line) => `<li>${esc(line)}</li>`).join("")}</ul></div>` : ""}
  <p class="tag">인쇄하거나 PDF로 저장하면 참여자 1명이 새 쪽에서 시작합니다.</p>
</header>
<nav class="toc"><strong>목차</strong><ol>${records.map((record) => `<li><a href="#record-${String(record.order).padStart(3, "0")}">${esc(record.displayLabel.label)} · ${esc(record.submittedAt.slice(0, 10) || "시각 미기록")}</a></li>`).join("")}</ol></nav>
<main>${records.map(renderRecord).join("") || `<p class="empty">담긴 기록이 없습니다.</p>`}</main>
</body>
</html>
`;
}
