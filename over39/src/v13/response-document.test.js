import { describe, expect, it } from "vitest";
import { buildResponseDocument, renderResponseDocument } from "./response-document.js";

describe("participation record copy", () => {
  it("keeps research coordinate numbers out of the Korean participant record", () => {
    const document = buildResponseDocument({
      responseId: "record-copy-ko",
      sourceLanguage: "ko",
      createdAt: "2026-08-11T00:00:00.000Z",
      final: true,
      answers: {
        route: "SELF",
        display_name_mode: "ANONYMOUS",
        participant_m: "M4",
        participant_s: "S3",
        participant_d: "D2",
      },
    });
    const html = renderResponseDocument(document);

    expect(html).toContain("당신의 기록이 닿은 세 방향");
    expect(html).toContain("사람과 사회 × 전환 × 개인의 기반");
    expect(html).not.toContain("response-document-coordinate-graphic");
    expect(html).not.toContain("response-document-brand-mark");
    expect(html).toContain("당신이 남긴 이야기를 기억하겠습니다.");
    expect(html).not.toContain("58번");
    expect(html).not.toContain("좌표 58");
  });

  it("keeps the final confirmed text without exposing the editing-process label", () => {
    const html = renderResponseDocument(buildResponseDocument({
      responseId: "record-confirmed-copy",
      sourceLanguage: "ko",
      approvedOriginal: "기억에서 시작한 질문이 지금의 작업 조건을 다시 보게 했습니다.",
      final: true,
    }));
    expect(html).toContain("기억에서 시작한 질문이 지금의 작업 조건을 다시 보게 했습니다.");
    expect(html).not.toContain("참여자가 고른 문장");
  });

  it("uses participant-centred English labels without Korean fallback leakage", () => {
    const document = buildResponseDocument({
      responseId: "record-copy-en",
      sourceLanguage: "en",
      createdAt: "2026-08-11T00:00:00.000Z",
      answers: {
        route: "AUDIENCE",
        role_primary: "R07",
        display_name_mode: "ANONYMOUS",
        participant_m: "M1",
        participant_s: "S2",
        participant_d: "D2",
      },
    });
    const html = renderResponseDocument(document);

    expect(html).toContain("This record begins with arts and culture experienced as an audience member.");
    expect(html).toContain("researcher");
    expect(html).toContain("Not specified");
    expect(html).toContain("The three directions your record reaches");
    expect(html).not.toContain("A visual marker for the three directions in this record");
    expect(html).not.toContain("응답하지 않음");
    expect(html).not.toContain("관객과 참여자");
  });

  it("keeps original English text while rendering the record frame in the selected Korean interface", () => {
    const document = buildResponseDocument({
      responseId: "record-display-ko",
      sourceLanguage: "en",
      displayLanguage: "ko",
      answers: { route: "AUDIENCE", display_name_mode: "ANONYMOUS" },
      approvedOriginal: "I return when a friend can come with me.",
      approvedKorean: "친구와 함께 갈 수 있을 때 다시 찾습니다.",
    });
    const html = renderResponseDocument(document);

    expect(document.source_language).toBe("en");
    expect(document.display_language).toBe("ko");
    expect(html).toContain("〈만 39세 이상〉 참여 기록");
    expect(html).toContain("응답 정리");
    expect(html).toContain("I return when a friend can come with me.");
    expect(html).toContain("친구와 함께 갈 수 있을 때 다시 찾습니다.");
  });

  it("uses natural Korean particles in generated participation-record sentences", () => {
    const document = buildResponseDocument({
      responseId: "record-particle-ko",
      sourceLanguage: "ko",
      answers: { route: "SELF", support_conditions: ["PEOPLE", "RECORD"] },
    });
    const html = renderResponseDocument(document);
    expect(html).toContain("활동과 참여를 지지해 온 조건은");
    expect(html).not.toMatch(/을\/를|이\/가|와\/과/);
  });

  it("keeps every supported non-Korean record frame out of Korean fallback copy", () => {
    for (const sourceLanguage of ["ja", "zh-Hans", "zh-Hant", "fr", "es", "nl", "ms"]) {
      const html = renderResponseDocument(buildResponseDocument({
        responseId: `record-copy-${sourceLanguage}`,
        sourceLanguage,
        answers: { route: "AUDIENCE", display_name_mode: "ANONYMOUS", participant_m: "M1", participant_s: "S2", participant_d: "D2" },
      }));
      expect(html).not.toMatch(/[가-힣]/);
    }
  });

  it("renders a legacy snapshot without the new context fields", () => {
    const document = buildResponseDocument({
      responseId: "legacy-r20-snapshot",
      sourceLanguage: "ko",
      answers: { route: "SELF", role_primary: "R20", display_name_mode: "ANONYMOUS", participant_m: "M2", participant_s: "S2", participant_d: "D4" },
    });
    expect(document.participant.display_name).toBe("익명 참여자");
    expect(document.coordinate).toEqual({ m: "M2", s: "S2", d: "D4" });
    expect(renderResponseDocument(document)).toContain("보존·수복·소장품 관리 관계자");
  });
});
