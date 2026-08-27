const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) { return String(value || "").trim(); }

export function normalizeReferralEmail(value) {
  const raw = clean(value).replace(/^<|>$/g, "");
  const at = raw.lastIndexOf("@");
  if (at < 1) return "";
  return `${raw.slice(0, at)}@${raw.slice(at + 1).toLowerCase()}`;
}

export function parseReferralRecipients(input, { maxRecipients = 50 } = {}) {
  const source = clean(input);
  const explicit = [...source.matchAll(/<\s*([^<>\s]+@[^<>\s]+)\s*>/g)].map((match) => match[1]);
  const bare = source
    .replace(/<\s*[^<>\s]+@[^<>\s]+\s*>/g, " ")
    .split(/[\s,;]+/)
    .filter(Boolean);
  const candidates = [...explicit, ...bare];
  const valid = [];
  const invalid = [];
  const duplicates = [];
  const seen = new Set();
  candidates.forEach((candidate) => {
    const email = normalizeReferralEmail(candidate);
    if (!email || !EMAIL_PATTERN.test(email)) {
      if (clean(candidate)) invalid.push(clean(candidate));
      return;
    }
    if (seen.has(email)) { duplicates.push(email); return; }
    seen.add(email);
    if (valid.length < maxRecipients) valid.push(email);
    else invalid.push(email);
  });
  return { valid, invalid, duplicates, total_found: candidates.length, limited: Math.max(0, seen.size - valid.length) };
}

export function safeReferrerLabel(value, fallback = "참여자") {
  const label = clean(value).replace(/\s+/g, " ").slice(0, 80);
  // A raw response/index/fixture ID must never surface as a referral identity.
  if (!label || /^\d+$/.test(label) || /^(?:V13|RC2|response)[-_\d]/i.test(label)) return fallback;
  return label;
}

export function buildReferralBatch({ responseId, recipients, message = "", showReferrer = false, referrerLabel = "", batchId = null, requestedAt = new Date().toISOString() } = {}) {
  const parsed = Array.isArray(recipients) ? { valid: recipients, invalid: [], duplicates: [] } : parseReferralRecipients(recipients);
  const label = showReferrer ? safeReferrerLabel(referrerLabel) : null;
  const suffix = `${responseId || "draft"}:${parsed.valid.join(",")}`;
  return {
    response_id: responseId || null,
    submission_phase: "referral_batch",
    batch_id: batchId || null,
    batch_idempotency_material: suffix,
    recipients: parsed.valid.map((email) => ({ email })),
    message: clean(message).slice(0, 500) || null,
    show_referrer: Boolean(showReferrer),
    referrer_label: label,
    requested_at: requestedAt,
  };
}
