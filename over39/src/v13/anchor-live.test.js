import { describe, expect, it, vi } from "vitest";
import {
  ANCHOR_ORDER,
  CONDITIONAL_ANCHOR_ORDER,
  buildAnchorContext,
  createAnchorFollowup,
  d04ConditionLayers,
  shouldAskD04ConditionsFollowup,
  shouldAskNoRecallRelationFollowup,
} from "./anchor-live.js";

describe("pilot follow-up anchors", () => {
  it("keeps the five strict anchors separate from optional pilot follow-ups", () => {
    expect(ANCHOR_ORDER).toEqual(["M04_TEXT", "P12", "P13_TEXT", "P19_TEXT", "D02_TEXT"]);
    expect(CONDITIONAL_ANCHOR_ORDER).toEqual(["NO_RECALL_RELATION", "D04_CONDITIONS"]);
    expect(ANCHOR_ORDER).not.toContain("NO_RECALL_RELATION");
    expect(ANCHOR_ORDER).not.toContain("D04_CONDITIONS");
  });

  it("only offers the NO_RECALL follow-up to a meaningful audience current-relation answer", () => {
    expect(shouldAskNoRecallRelationFollowup({ route: "AUDIENCE", memory_type: "NO_RECALL", no_recall_relation_text: "손녀가 전시를 보자고 하면 함께 가게 됩니다." })).toBe(true);
    expect(shouldAskNoRecallRelationFollowup({ route: "AUDIENCE", memory_type: "NO_RECALL", no_recall_relation_text: "없음" })).toBe(false);
    expect(shouldAskNoRecallRelationFollowup({ route: "SELF", memory_type: "NO_RECALL", no_recall_relation_text: "혼자 공연을 찾아봅니다." })).toBe(false);
  });

  it("only offers the D04 follow-up when multiple layers of conditions appear together", () => {
    const coupled = { d_context_evidence_text: "돌봄 때문에 작업 시간이 줄었고, 지원사업 신청과 정산 과정도 길어 다음 작업을 미루게 됩니다." };
    expect(d04ConditionLayers(coupled.d_context_evidence_text)).toEqual(expect.arrayContaining(["personal", "institutional"]));
    expect(shouldAskD04ConditionsFollowup(coupled)).toBe(true);
    expect(shouldAskD04ConditionsFollowup({ d_context_evidence_text: "작업할 시간이 조금 더 필요합니다." })).toBe(false);
    expect(shouldAskD04ConditionsFollowup({ d_context_evidence_text: "지원사업이 더 필요합니다." })).toBe(false);
  });

  it("preserves the conditional context without asking for a recalled work", () => {
    const context = buildAnchorContext({
      anchorId: "NO_RECALL_RELATION",
      questionLabel: "현재의 관계",
      answer: "손녀와 함께 가면 편하게 전시를 봅니다.",
      answers: { memory_type: "NO_RECALL" },
      route: "AUDIENCE",
      responseLanguage: "ko",
    });
    expect(context.adjacent_response_ids).toEqual(["M01"]);
    expect(context.answer).not.toMatch(/작품명|전시명/);
  });

  it("includes additive participant context in an anchor fingerprint without changing the anchor set", () => {
    const context = buildAnchorContext({
      anchorId: "P12", questionLabel: "변화", answer: "공연보다 가르치는 시간이 많아졌습니다.", route: "SELF",
      participantContext: { legacy_role: "R01", field: ["DANCE"], participation_mode: ["PERFORMANCE_LIVE"], activity_form: "WITH_EDUCATION", participation_unit: "INDIVIDUAL" },
    });
    expect(context.participant_context.field).toEqual(["DANCE"]);
    expect(ANCHOR_ORDER).toHaveLength(5);
  });

  it("keeps an answer path when a provider timeout occurs and marks the fallback as fixed", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(Object.assign(new Error("timed out"), { name: "AbortError" }));
    const result = await createAnchorFollowup({
      endpoint: "https://example.invalid/over39-ai",
      anchorId: "D04_CONDITIONS",
      responseLanguage: "ko",
      context: { verbatim_answer: "돌봄과 지원사업 정산이 함께 겹쳐 작업 시간이 줄었습니다." },
      fetchImpl,
      timeoutMs: 1,
    });
    expect(result.source).toBe("fallback");
    expect(result.run.fallback_reason).toBe("browser_timeout");
    expect(result.question.provenance.kind).toBe("fixed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("records a verified Motif question as AI-generated without exposing IDs in its public wording", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "req-pilot" },
      text: async () => JSON.stringify({
        source: "motif", provider: "motif", request_id: "req-pilot", client_request_id: "will-be-replaced", latency_ms: 120,
        question_text: "그 변화 뒤에 작업을 계속하고 있다고 느끼는 기준은 어떻게 달라졌나요?",
      }),
    });
    const result = await createAnchorFollowup({
      endpoint: "https://example.test/over39-ai",
      anchorId: "P12",
      responseLanguage: "ko",
      context: { verbatim_answer: "전시가 없어도 작업실에서 매일 기록을 이어갔습니다." },
      fetchImpl,
    });
    // The simulated response has an intentionally mismatched client request ID, so it
    // is still a Motif-sourced UI question but not a strict REAL Motif pass.
    expect(result.source).toBe("motif");
    expect(result.question.provenance.kind).toBe("ai-generated");
    expect(result.question.question_text).not.toMatch(/M\d|S\d|D\d|request/i);
  });
});
