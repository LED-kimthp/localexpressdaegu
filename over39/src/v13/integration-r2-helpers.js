export function shouldShowP13Text(value) {
  return ["YES", "MIXED"].includes(String(value || "").trim().toUpperCase());
}

export function shouldShowP19Text(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.some((item) => String(item || "").trim().toUpperCase() !== "NONE");
}

export function normalizeIntegratedRoleRecord(code, answers = {}, { parallel = false, roles = [] } = {}) {
  const value = String(code || "").trim();
  if (!value) return null;
  if (value === "OTHER") {
    const label = String(parallel ? answers.roles_parallel_other : answers.role_primary_other || "").trim();
    return { code: value, label: label || "기타 역할" };
  }
  if (value === "NON_ARTS") return { code: value, label: "문화예술 외 역할" };
  const item = roles.find((role) => role?.value === value);
  return { code: value, label: String(item?.label || value) };
}

export function translationReuseDecision({ action, sourceLanguage, approvedText, summary, summaryKo } = {}) {
  const source = String(sourceLanguage || "ko").trim();
  const approved = String(approvedText || "").trim();
  const originalSummary = String(summary || "").trim();
  const korean = String(summaryKo || "").trim();
  if (source === "ko") return { reuse: true, translation: approved, reason: "korean_identity" };
  if (action === "ACCEPT" && approved && approved === originalSummary && korean) {
    return { reuse: true, translation: korean, reason: "accepted_existing_summary_ko" };
  }
  return { reuse: false, translation: "", reason: "translation_required" };
}

export function safeFinalSummaryFailure(errorCode = "FINAL_SUMMARY_UNAVAILABLE") {
  return {
    summary: null,
    summary_ko: null,
    axes: { m: null, s: null, d: null },
    secondary_axes: { m: null, s: null, d: null },
    evidence: { m: [], s: [], d: [] },
    uncertainty: "구체적인 정리 결과를 불러오지 못했습니다.",
    source: "safe_failure",
    requires_rewrite: true,
    run: {
      status: "failed",
      source: "safe_failure",
      provider: null,
      error_code: errorCode,
      operation: "summarize_adaptive",
      real_motif_pass: false,
    },
  };
}
