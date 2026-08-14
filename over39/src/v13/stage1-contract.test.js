import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createParticipantReference, publicParticipantReference } from "./participant-reference.js";
import { GreetingLedger } from "./greeting-ledger.js";

const source = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("Stage 1 frozen-contract sources", () => {
  it("separates a readable participant code from the opaque mailbox secret", () => {
    const reference = createParticipantReference({ randomValues: (output) => output.fill(9) });
    expect(reference.code).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){2}$/);
    expect(reference.access_token).toHaveLength(32);
    expect(publicParticipantReference(reference)).toEqual({ code: reference.code, access_model: "opaque_token_required", version: reference.version });
  });

  it("keeps participant, response snapshot, token and notification contact as separate additive records", () => {
    const migration = source("../../supabase/migrations/202608140001_over39_stage1_contract_freeze.sql");
    expect(migration).toContain("over39_participants");
    expect(migration).toContain("over39_participant_response_links");
    expect(migration).toContain("over39_participant_access_tokens");
    expect(migration).toContain("over39_greeting_notifications");
    expect(migration).toContain("unique (response_id)");
    expect(migration).toContain("register_over39_participant_reference");
  });

  it("keeps raw access secrets out of research snapshots and out of portable downloads", () => {
    const submit = source("../../supabase/functions/over39-submit/index.ts");
    const app = source("./app.js");
    expect(submit).toContain("delete snapshotPayload.participant_access");
    expect(app).toContain("delete update.participant_access");
    expect(app).toContain("delete download.participant_access");
  });

  it("uses a server-only core-seed allowlist and a seed-pool threshold", () => {
    const submit = source("../../supabase/functions/over39-submit/index.ts");
    const relay = source("../../supabase/functions/over39-relay/index.ts");
    expect(submit).toContain("OVER39_CORE_SEED_RESPONSE_IDS");
    expect(submit).toContain("greetingOriginFor(responseId)");
    expect(relay).toContain("OVER39_GREETING_MIN_SEED_AVAILABLE");
    expect(relay).toContain("SEED_POOL_BELOW_THRESHOLD");
  });

  it("reserves A’s greeting once, then lets B create one new greeting for a later person", () => {
    const ledger = new GreetingLedger([{ id: "A-greeting", sender_record_id: "A", receiver_record_id: null, status: "WAITING_RECEIVER" }]);
    expect(ledger.reserve("A-greeting", "B", { evidence: ["SAME_DIRECTION"] }).ok).toBe(true);
    const next = new GreetingLedger([{ id: "B-next", sender_record_id: "B", receiver_record_id: null, status: "WAITING_RECEIVER" }]);
    expect(next.reserve("B-next", "C", { evidence: ["ROLE_BRIDGE"] }).ok).toBe(true);
    expect(next.read("B-next").receiver_record_id).toBe("C");
  });

  it("defers notification email until an opened greeting and never claims it was sent", () => {
    const app = source("./app.js");
    const relay = source("../../supabase/functions/over39-relay/index.ts");
    const mailbox = source("./relay.js");
    expect(app).toContain('notification_opt_in: "deferred_until_greeting_read"');
    expect(relay).toContain('action === "set_notification"');
    expect(relay).toContain('status: "STORED"');
    expect(mailbox).toContain("notificationStored");
    expect(mailbox).toContain("action: \"set_notification\"");
  });

  it("keeps the sender’s chosen greeting visibility bounded and separate from contact data", () => {
    const app = source("./app.js");
    const submit = source("../../supabase/functions/over39-submit/index.ts");
    const relay = source("../../supabase/functions/over39-relay/index.ts");
    const mailbox = source("./relay.js");
    const migration = source("../../supabase/migrations/202608140001_over39_stage1_contract_freeze.sql");
    expect(app).toContain("sender_public_context: senderPublicContext");
    expect(submit).toContain("function publicSenderContext");
    expect(submit).toContain("visibility === \"NAMED\"");
    expect(relay).toContain("sender_display_label");
    expect(mailbox).toContain('reason.sender_visibility === "ANONYMOUS"');
    expect(migration).toContain("sender_public_context jsonb");
  });
});
