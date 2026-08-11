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
    expect(html).toContain("response-document-coordinate-graphic");
    expect(html.match(/<i class=/g)).toHaveLength(64);
    expect(html.match(/<i class="selected"/g)).toHaveLength(1);
    expect(html).toContain("당신이 남긴 이야기를 기억하겠습니다.");
    expect(html).not.toContain("58번");
    expect(html).not.toContain("좌표 58");
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
    expect(html).toContain("A visual marker for the three directions in this record");
    expect(html).not.toContain("응답하지 않음");
    expect(html).not.toContain("관객과 참여자");
  });
});
