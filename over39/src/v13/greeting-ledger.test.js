import { describe, expect, it } from "vitest";
import { GreetingLedger } from "./greeting-ledger.js";

describe("one-to-one greeting reservation contract", () => {
  it("allows exactly one concurrent receiver to reserve a waiting greeting", async () => {
    const ledger = new GreetingLedger([{ id: "g-1", sender_record_id: "A", receiver_record_id: null, status: "WAITING_RECEIVER" }]);
    const [first, second] = await Promise.all([
      Promise.resolve().then(() => ledger.reserve("g-1", "B", { evidence: ["SAME_DIRECTION"] })),
      Promise.resolve().then(() => ledger.reserve("g-1", "C", { evidence: ["ROLE_BRIDGE"] })),
    ]);
    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1);
    expect(ledger.read("g-1").status).toBe("QUEUED");
    expect(["B", "C"]).toContain(ledger.read("g-1").receiver_record_id);
  });

  it("does not reserve a greeting for its sender", () => {
    const ledger = new GreetingLedger([{ id: "g-1", sender_record_id: "A", receiver_record_id: null, status: "WAITING_RECEIVER" }]);
    expect(ledger.reserve("g-1", "A")).toEqual({ ok: false, code: "GREETING_NOT_ELIGIBLE" });
  });
});
