// Isolated contract model for the Stage 1 one-to-one reservation rule. The
// production implementation uses a row lock / RPC; this tiny model keeps the
// same observable state transition available to local regression tests.
export class GreetingLedger {
  constructor(greetings = []) {
    this.greetings = new Map(greetings.map((item) => [item.id, { ...item }]));
  }

  reserve(greetingId, receiverRecordId, reason = {}) {
    const greeting = this.greetings.get(greetingId);
    if (!greeting || greeting.sender_record_id === receiverRecordId) return { ok: false, code: "GREETING_NOT_ELIGIBLE" };
    if (greeting.receiver_record_id || !["STORED", "WAITING_RECEIVER"].includes(greeting.status)) return { ok: false, code: "GREETING_ALREADY_RESERVED" };
    const reserved = {
      ...greeting,
      receiver_record_id: receiverRecordId,
      connection_reason_snapshot: reason,
      status: "QUEUED",
      queued_at: new Date().toISOString(),
    };
    this.greetings.set(greetingId, reserved);
    return { ok: true, greeting: reserved };
  }

  read(greetingId) { return this.greetings.get(greetingId) || null; }
}

