import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("Stage 2 QA-only production acceptance boundary", () => {
  it("keeps public collection gates authoritative while requiring a server secret and isolated QA prefix", () => {
    const submit = source("../../supabase/functions/over39-submit/index.ts");
    const openCall = source("../../supabase/functions/over39-open-call/index.ts");
    const relay = source("../../supabase/functions/over39-relay/index.ts");
    for (const edge of [submit, openCall, relay]) {
      expect(edge).toContain("OVER39_QA_ACCEPTANCE_TOKEN");
      expect(edge).toContain("QA_STAGE2_20260814_");
      expect(edge).toContain("x-over39-qa-token");
    }
    expect(openCall).toContain("OPEN_CALL_NOT_ACCEPTING");
    expect(relay).toContain("GLOBAL_GREETINGS_COLLECTION_DISABLED");
  });

  it("limits QA signed retrieval and forced cleanup to the exact isolated submission", () => {
    const openCall = source("../../supabase/functions/over39-open-call/index.ts");
    expect(openCall).toContain('body.action === "qa_signed_url"');
    expect(openCall).toContain("!path.startsWith(`${submissionId}/`)");
    expect(openCall).toContain("qa_force_post_upload_failure");
    expect(openCall).toContain("QA_FORCED_POST_UPLOAD_FAILURE");
  });

  it("keeps QA reservation scoped to QA greetings and uses the production atomic RPC", () => {
    const relay = source("../../supabase/functions/over39-relay/index.ts");
    expect(relay).toContain("String(greeting.sender_record_id || \"\").startsWith(qaPrefix())");
    expect(relay).toContain("create_over39_greeting_proposal");
    expect(relay).toContain("qaMode ? 1 : seedMinimum()");
  });
});
