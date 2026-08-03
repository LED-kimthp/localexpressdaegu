export const OUTBOX_KEY = "over39-rc1-outbox";

function parse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export function readOutbox(storage = localStorage) {
  return parse(storage.getItem(OUTBOX_KEY) || "[]", []);
}

export function enqueueOutbox(envelope, storage = localStorage) {
  const outbox = readOutbox(storage).filter((item) => item.idempotency_key !== envelope.idempotency_key);
  outbox.push({ ...envelope, queued_at: new Date().toISOString(), attempts: Number(envelope.attempts || 0) });
  storage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  return outbox;
}

export function removeFromOutbox(idempotencyKey, storage = localStorage) {
  const outbox = readOutbox(storage).filter((item) => item.idempotency_key !== idempotencyKey);
  storage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  return outbox;
}

export function createEnvelope(kind, payload, suffix = "") {
  const responseId = payload.response_id || payload.session_id;
  const phase = payload.submission_phase || kind;
  return {
    kind,
    payload,
    idempotency_key: `${responseId}:${phase}${suffix ? `:${suffix}` : ""}`,
    client_sent_at: new Date().toISOString(),
  };
}

function timeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("REQUEST_TIMEOUT"), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export async function sendEnvelope(envelope, options = {}) {
  const {
    endpoint = "",
    anonKey = "",
    fetchImpl = fetch,
    storage = localStorage,
    timeoutMs = 12000,
  } = options;
  if (!endpoint) {
    enqueueOutbox(envelope, storage);
    return { status: "local_only", queued: true };
  }
  const timeout = timeoutSignal(timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
      },
      body: JSON.stringify(envelope),
    });
    if (!response.ok) throw new Error(`STORAGE_HTTP_${response.status}`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error_code || "STORAGE_REJECTED");
    removeFromOutbox(envelope.idempotency_key, storage);
    return { status: "confirmed", queued: false, receipt: result };
  } catch (error) {
    enqueueOutbox({ ...envelope, attempts: Number(envelope.attempts || 0) + 1, last_error: error.message }, storage);
    return { status: "failed", queued: true, error: error.message };
  } finally {
    timeout.clear();
  }
}

export async function retryOutbox(options = {}) {
  const storage = options.storage || localStorage;
  const queued = [...readOutbox(storage)];
  const results = [];
  for (const envelope of queued) {
    results.push(await sendEnvelope(envelope, { ...options, storage }));
  }
  return results;
}

export function splitResearchAndContact(payload) {
  const { pii, ...research } = payload;
  return {
    research,
    contact: pii ? {
      response_id: payload.response_id,
      email: pii.email || "",
      display_name: pii.display_name || "",
      role_label: pii.role_label || "",
      consent_scope: pii.consent_scope || [],
      contact_reason: pii.contact_reason || "",
    } : null,
  };
}
