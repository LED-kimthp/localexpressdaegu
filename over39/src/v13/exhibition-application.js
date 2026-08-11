export const EXHIBITION_OPEN_CALL = Object.freeze({
  id: "over39-mohohouse-2026-12",
  title: "〈만 39세 이상〉 전시 참여 공모",
  venue: "모호주택",
  plannedPeriod: "2026년 12월 예정",
  applicationType: "간소 접수 · 이름과 연락처 중심",
  eligibility: "만 39세 이상으로 시각예술 분야에서 작업해 온 작가·창작자",
});

export function createDefaultExhibitionApplication() {
  return {
    decision: "",
    eligibility_ack: "",
    applicant_name: "",
    email: "",
    work_field: "",
    portfolio_url: "",
    proposal_text: "",
    research_review_consent: "",
    contact_consent: "",
  };
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function validateExhibitionApplication(application = {}) {
  const errors = {};
  if (!["YES", "NO"].includes(application.decision)) errors.decision = "신청 여부를 선택해 주세요.";
  if (application.decision !== "YES") return { valid: Object.keys(errors).length === 0, errors };

  if (application.eligibility_ack !== "YES") errors.eligibility_ack = "공모 대상 안내를 확인해 주세요.";
  if (!String(application.applicant_name || "").trim()) errors.applicant_name = "이름 또는 활동명을 적어 주세요.";
  if (!isEmail(application.email)) errors.email = "연락받을 이메일을 확인해 주세요.";
  if (!String(application.work_field || "").trim()) errors.work_field = "작업 분야를 적어 주세요.";
  if (!isHttpUrl(application.portfolio_url)) errors.portfolio_url = "http 또는 https로 시작하는 작업 자료 링크를 적어 주세요.";
  if (String(application.proposal_text || "").trim().length < 30) errors.proposal_text = "작업과 전시에서 나누고 싶은 질문을 30자 이상 적어 주세요.";
  if (!["YES", "NO"].includes(application.research_review_consent)) errors.research_review_consent = "참여 기록 검토 범위를 선택해 주세요.";
  if (application.contact_consent !== "YES") errors.contact_consent = "공모 안내와 결과 연락을 위한 보관 동의가 필요해요.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildExhibitionApplicationPayload({ response, application, releaseVersion }) {
  const validation = validateExhibitionApplication(application);
  if (!validation.valid) throw new Error("INVALID_EXHIBITION_APPLICATION");
  const applied = application.decision === "YES";
  const submittedAt = new Date().toISOString();
  const research = {
    response_id: response.response_id,
    submission_phase: "exhibition_application",
    sample_type: response.sample_type || "test",
    institution_code: response.institution_code || null,
    acquisition_source: response.acquisition_source || "direct",
    release_version: releaseVersion,
    source_language: response.source_language || response.interface_language || "ko",
    exhibition_open_call: {
      open_call_id: EXHIBITION_OPEN_CALL.id,
      title: EXHIBITION_OPEN_CALL.title,
      venue: EXHIBITION_OPEN_CALL.venue,
      planned_period: EXHIBITION_OPEN_CALL.plannedPeriod,
      application_type: EXHIBITION_OPEN_CALL.applicationType,
      applied,
      eligibility_acknowledged: applied && application.eligibility_ack === "YES",
      work_field: applied ? String(application.work_field || "").trim() : null,
      portfolio_url: applied ? String(application.portfolio_url || "").trim() : null,
      proposal_text: applied ? String(application.proposal_text || "").trim() : null,
      research_response_review_allowed: applied && application.research_review_consent === "YES",
      contact_consent: applied && application.contact_consent === "YES",
      status: applied ? "submitted_for_curatorial_review" : "not_applied",
      submitted_at: submittedAt,
    },
  };
  const contact = applied ? {
    response_id: response.response_id,
    applicant_name: String(application.applicant_name || "").trim(),
    email: String(application.email || "").trim(),
    contact_reason: "over39_mohohouse_exhibition_open_call_2026_12",
    consent_scope: ["exhibition_application_contact", "selection_result_notice"],
    submitted_at: submittedAt,
  } : null;
  return { research, contact };
}
