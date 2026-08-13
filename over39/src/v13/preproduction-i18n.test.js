import { describe, expect, it } from "vitest";
import { completionCopy } from "./completion-i18n.js";
import { participantActivityScreenCopy, participantContextCopy } from "./participant-context-i18n.js";
import { rc2UiCopy } from "./rc2-ui-i18n.js";
import { translate } from "./i18n.js";

const languages = ["ko", "en", "ja", "zh-Hans", "zh-Hant", "fr", "es", "nl", "ms"];

describe("pre-production participant-facing localisation", () => {
  it("keeps the additive activity-context screen directly translated in every supported language", () => {
    for (const language of languages) {
      const copy = participantContextCopy(language);
      const activity = participantActivityScreenCopy(language);
      expect(copy.title).toBeTruthy();
      expect(copy.field).toBeTruthy();
      expect(activity.headingOther).toBeTruthy();
      expect(activity.p05Other).toBeTruthy();
      expect(activity.p05Audience).toBeTruthy();
      if (language !== "ko") {
        expect(`${copy.title} ${activity.p05Other}`).not.toMatch(/[가-힣]/);
      }
    }
  });

  it("keeps the completion screen and its closed-gate wording in the selected language", () => {
    for (const language of languages) {
      const copy = completionCopy(language);
      expect(copy.status.local_only).toBeTruthy();
      expect(copy.openCallButton).toBeTruthy();
      expect(copy.greetingClosed).toBeTruthy();
      expect(copy.greetingReason).toBeTruthy();
      if (language !== "ko") {
        expect(`${copy.title} ${copy.greetingClosed}`).not.toMatch(/[가-힣]/);
      }
    }
  });

  it("keeps the newly composed M01 and D copy directly translated in every supported language", () => {
    for (const language of languages) {
      const copy = rc2UiCopy(language);
      expect(copy.m01.title).toBeTruthy();
      expect(copy.m01.options.NO_RECALL).toBeTruthy();
      expect(copy.d1Title).toBeTruthy();
      expect(copy.d4Title).toBeTruthy();
      if (language !== "ko") {
        expect(`${copy.m01.title} ${copy.d1Title} ${copy.d4Title}`).not.toMatch(/[가-힣]/);
      }
    }
  });

  it("does not conflate Simplified and Traditional Chinese in new participant copy", () => {
    expect(participantContextCopy("zh-Hans").title).not.toBe(participantContextCopy("zh-Hant").title);
    expect(completionCopy("zh-Hans").title).not.toBe(completionCopy("zh-Hant").title);
    expect(rc2UiCopy("zh-Hans").m01.title).not.toBe(rc2UiCopy("zh-Hant").m01.title);
  });

  it("keeps the complete first-screen journey out of Korean fallback copy", () => {
    const landingStrings = [
      "설문 구조", "기억에서 현재로, 현재에서 이어가기 위한 조건으로 이동합니다.", "사람, 작품, 공간, 장면과 오래 남은 이유",
      "답변을 한 편의 참여 기록으로 모아 직접 읽고 다듬습니다. 마지막에는 기억의 의미, 현재의 흐름, 이어가기 위한 조건을 직접 확인하고 이번 기록과 가까운 위치를 함께 살펴봅니다.",
      "세 방향의 네 상태가 만나 64개의 현재 위치를 만듭니다. 이는 사람의 고정된 유형이 아니라, 시간과 상황에 따라 달라질 수 있는 이번 기록의 위치입니다. 이후에는 기록 사이의 관계를 읽고 안부가 닿은 이유를 설명하는 데 사용합니다.",
      "2026년 12월 · 모호주택에서 함께할 작업을 기다립니다.", "공모 보기",
    ];
    for (const language of languages.filter((item) => item !== "ko")) {
      const localized = landingStrings.map((item) => translate(language, item)).join(" ");
      expect(localized).not.toMatch(/[가-힣]/);
    }
  });
});
