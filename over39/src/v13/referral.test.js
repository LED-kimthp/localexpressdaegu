import { describe, expect, it } from "vitest";
import { buildReferralBatch, parseReferralRecipients, safeReferrerLabel } from "./referral.js";

describe("batch referral parser", () => {
  it("extracts addresses from pasted names, brackets, lines and mixed separators", () => {
    const parsed = parseReferralRecipients("aaa@example.com\nbbb@example.com, ccc@Example.com\n홍길동 <ddd@example.com>; eee@example.com fff@example.com");
    expect(parsed.valid).toEqual(["ddd@example.com", "aaa@example.com", "bbb@example.com", "ccc@example.com", "eee@example.com", "fff@example.com"]);
    expect(parsed.invalid).toEqual(["홍길동"]);
  });

  it("removes duplicates deterministically and reports invalid fragments", () => {
    const parsed = parseReferralRecipients("a@EXAMPLE.COM; a@example.com, broken-address");
    expect(parsed.valid).toEqual(["a@example.com"]);
    expect(parsed.duplicates).toEqual(["a@example.com"]);
    expect(parsed.invalid).toEqual(["broken-address"]);
  });

  it("never exposes an internal numeric or response ID as the referrer label", () => {
    expect(safeReferrerLabel("12")).toBe("참여자");
    expect(safeReferrerLabel("V13-abc")).toBe("참여자");
    expect(safeReferrerLabel("민지")).toBe("민지");
  });

  it("builds a retry-safe batch source contract", () => {
    const batch = buildReferralBatch({ responseId: "V13-a", recipients: "a@example.com\na@example.com\nb@example.com", showReferrer: true, referrerLabel: "12" });
    expect(batch.recipients).toEqual([{ email: "a@example.com" }, { email: "b@example.com" }]);
    expect(batch.referrer_label).toBe("참여자");
    expect(batch.batch_idempotency_material).toContain("a@example.com,b@example.com");
  });
});
