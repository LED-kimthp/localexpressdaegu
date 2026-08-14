import { describe, expect, it } from "vitest";
import { buildCoordinateSnapshots } from "./classification.js";
import { buildAdaptiveContext } from "./depth.js";
import { buildActiveScreens } from "./flow.js";
import { greetingUiCopy } from "./greetings-ui-i18n.js";
import { compactParticipantContext, contextAwareCopy, dContextHints } from "./participant-context.js";
import { buildResponseDocument, renderResponseDocument } from "./response-document.js";

const languages = ["ko", "en", "ja", "zh-Hans", "zh-Hant", "fr", "es", "nl", "ms"];
const baseCoordinateAnswers = { route: "SELF", m_declared: "M3", activity_state: "ACTIVE_MAIN", d_desired_change_primary: "D2", depth_m: "M3", depth_s: "S2", depth_d: "D2", reflection_action: "ACCEPT" };

describe("pre-production compatibility and service frames", () => {
  it("keeps old R01–R20 snapshots readable without the new context fields", () => {
    for (let index = 1; index <= 20; index += 1) {
      const role = `R${String(index).padStart(2, "0")}`;
      const answers = { route: "SELF", role_primary: role, role_group_primary: "G1", display_name_mode: "ANONYMOUS", ...baseCoordinateAnswers };
      const document = buildResponseDocument({ responseId: `legacy-${role}`, sourceLanguage: "ko", answers, final: true });
      expect(document.participant.display_name).toBe("익명 참여자");
      expect(document.coordinate).toEqual({ m: "M3", s: "S2", d: "D2" });
      expect(renderResponseDocument(document)).toContain("〈만 39세 이상〉 참여 기록");
    }
  });

  it("does not change the legacy M/S/D snapshot when additive context is present", () => {
    const legacy = buildCoordinateSnapshots(baseCoordinateAnswers);
    const contextual = buildCoordinateSnapshots({ ...baseCoordinateAnswers, field: ["DANCE"], participation_mode: ["PERFORMANCE_LIVE"], activity_form: "WITH_OTHER_WORK", participation_unit: "INDIVIDUAL" });
    expect(contextual.participant_final).toMatchObject({ m_primary: legacy.participant_final.m_primary, s_primary: legacy.participant_final.s_primary, d_primary: legacy.participant_final.d_primary, coordinate_number: legacy.participant_final.coordinate_number });
  });

  it("sends the additive context to every strict checkpoint without adding strict anchors", () => {
    const answers = { ...baseCoordinateAnswers, route: "SELF", role_primary: "R01", role_group_primary: "G1", field: ["DANCE"], participation_mode: ["PERFORMANCE_LIVE", "DIRECTION_CHOREOGRAPHY_COMPOSITION"], activity_form: "WITH_OTHER_WORK", participation_unit: "INDIVIDUAL_AND_TEAM", memory_meaning_text: "그 장면은 공연과 가르침을 이어 가는 방식에 오래 남았습니다.", transition_text: "공연과 가르침의 시간이 함께 바뀌었습니다.", invisible_continuity_text: "연습 기록을 이어 갔습니다.", support_conditions_text: "연습 공간과 동료가 필요합니다.", desired_change_text: "공간 지원이 더 안정적이면 좋겠습니다." };
    const response = { response_id: "context-payload", route: "SELF", source_language: "ko", answers, fixed_questions: [] };
    for (const checkpoint of ["M04_TEXT", "P12", "P13_TEXT", "P19_TEXT", "D02_TEXT"]) {
      const context = buildAdaptiveContext({ response, checkpoint, answers });
      expect(context.participant_context).toMatchObject({ legacy_role: "R01", field: ["DANCE"], participation_mode: ["PERFORMANCE_LIVE", "DIRECTION_CHOREOGRAPHY_COMPOSITION"], activity_form: "WITH_OTHER_WORK", participation_unit: "INDIVIDUAL_AND_TEAM" });
    }
    expect(buildActiveScreens(answers, { adaptive: true }).filter((screen) => screen.startsWith("AI_ANCHOR_"))).toEqual(["AI_ANCHOR_M04_TEXT", "AI_ANCHOR_P12", "AI_ANCHOR_P13_TEXT", "AI_ANCHOR_P19_TEXT", "AI_ANCHOR_D02_TEXT"]);
  });

  it("covers professional, performance, community, and audience contexts with direct field/mode/form/unit values", () => {
    const coverage = [
      ["visual artist", "SELF", "R01", ["VISUAL_ARTS"], ["CREATION_PRODUCTION"], "PRIMARY_WORK", "INDIVIDUAL", "general"],
      ["film director", "SELF", "R01", ["FILM"], ["CREATION_PRODUCTION", "DIRECTION_CHOREOGRAPHY_COMPOSITION"], "PAID_PROJECT_BASED", "TEAM_GROUP", "film"],
      ["contemporary dancer", "SELF", "R01", ["DANCE"], ["PERFORMANCE_LIVE"], "WITH_OTHER_WORK", "INDIVIDUAL", "dance"],
      ["choreographer", "SELF", "R01", ["DANCE"], ["DIRECTION_CHOREOGRAPHY_COMPOSITION"], "WITH_EDUCATION", "INDIVIDUAL_AND_TEAM", "dance"],
      ["theatre actor", "SELF", "R01", ["THEATRE_PERFORMANCE"], ["PERFORMANCE_LIVE"], "PAID_PROJECT_BASED", "TEAM_GROUP", "theatre"],
      ["musician", "SELF", "R01", ["MUSIC"], ["PERFORMANCE_LIVE"], "WITH_OTHER_WORK", "INDIVIDUAL", "music"],
      ["traditional arts", "SELF", "R01", ["TRADITIONAL_ARTS"], ["PERFORMANCE_LIVE", "EDUCATION_TRANSMISSION"], "WITH_EDUCATION", "INDIVIDUAL", "music"],
      ["interdisciplinary team", "SELF", "R01", ["INTERDISCIPLINARY"], ["CREATION_PRODUCTION"], "PAID_PROJECT_BASED", "TEAM_GROUP", "general"],
      ["hobby choir", "SELF", "NON_ARTS", ["MUSIC"], ["HOBBY_CLUB_EVERYDAY_ARTS"], "HOBBY_CLUB", "TEAM_GROUP", "everyday"],
      ["local pungmul", "SELF", "NON_ARTS", ["LOCAL_EVERYDAY_CULTURE", "TRADITIONAL_ARTS"], ["LOCAL_COMMUNITY_ACTIVITY"], "UNPAID_VOLUNTEER_COMMUNITY", "TEAM_GROUP", "everyday"],
      ["arts educator", "SELF", "R16", ["VISUAL_ARTS"], ["EDUCATION_TRANSMISSION"], "WITH_EDUCATION", "INDIVIDUAL", "general"],
      ["curator", "SELF", "R04", ["VISUAL_ARTS"], ["CURATION_PRODUCING"], "PRIMARY_WORK", "INDIVIDUAL", "general"],
      ["critic researcher", "SELF", "R06", ["LITERATURE_PUBLISHING"], ["CRITICISM_RESEARCH"], "PRIMARY_WORK", "INDIVIDUAL", "general"],
      ["audience", "AUDIENCE", "NON_ARTS", ["FILM"], ["LEARNING_TRAINING"], "LEARNING_TRAINING", "INDIVIDUAL", "general"],
    ];
    for (const [label, route, legacyRole, field, mode, form, unit, hint] of coverage) {
      const answers = { route, role_primary: legacyRole, field, participation_mode: mode, activity_form: form, participation_unit: unit };
      const context = compactParticipantContext(answers);
      expect(context.field, label).not.toContain("OTHER");
      expect(context.participation_mode, label).not.toContain("OTHER");
      expect(context.legacy_role, label).toBe(legacyRole);
      expect(contextAwareCopy(answers, "ko").p14, label).toBeTruthy();
      expect(dContextHints(answers, "ko").join(" "), label).toBeTruthy();
      if (hint === "everyday") expect(context.kind, label).toBe("EVERYDAY");
      if (route === "AUDIENCE") expect(context.kind, label).toBe("AUDIENCE");
    }
  });

  it("keeps participation record and greeting UI frames directly translated across all nine languages", () => {
    for (const language of languages) {
      const document = buildResponseDocument({ responseId: `frame-${language}`, sourceLanguage: "en", displayLanguage: language, answers: { route: "AUDIENCE", display_name_mode: "ANONYMOUS" }, approvedOriginal: "A short original record." });
      const frame = renderResponseDocument(document);
      const greeting = greetingUiCopy(language);
      expect(document.display_language).toBe(language);
      expect(frame).toContain(document.title);
      expect(greeting.title).toBeTruthy();
      expect(greeting.previewPrivacy).toBeTruthy();
      expect(greeting.travel).toHaveLength(4);
      if (language !== "ko") {
        expect(frame).not.toMatch(/[가-힣]/);
        expect(`${greeting.title} ${greeting.previewPrivacy} ${greeting.travel.join(" ")}`).not.toMatch(/[가-힣]/);
      }
    }
  });
});
