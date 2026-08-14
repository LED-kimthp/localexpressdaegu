import { describe, expect, it } from "vitest";
import { compactParticipantContext, contextAwareCopy, dContextHints, hasParticipantContext, participantContextKind, participantContextOptions } from "./participant-context.js";

describe("additive cultural-arts participant context", () => {
  it("keeps legacy role alongside the four new context layers", () => {
    const answers = { route: "SELF", role_primary: "R01", role_group_primary: "G1", field: ["DANCE", "INTERDISCIPLINARY"], participation_mode: ["PERFORMANCE_LIVE", "DIRECTION_CHOREOGRAPHY_COMPOSITION"], activity_form: "WITH_OTHER_WORK", participation_unit: "INDIVIDUAL_AND_TEAM" };
    expect(compactParticipantContext(answers)).toMatchObject({ legacy_role: "R01", legacy_role_group: "G1", field: ["DANCE", "INTERDISCIPLINARY"], participation_mode: ["PERFORMANCE_LIVE", "DIRECTION_CHOREOGRAPHY_COMPOSITION"], activity_form: "WITH_OTHER_WORK", participation_unit: "INDIVIDUAL_AND_TEAM" });
  });

  it("requires direct input when OTHER is selected", () => {
    const incomplete = { field: ["OTHER"], participation_mode: ["OTHER"], activity_form: "MIXED", participation_unit: "OTHER" };
    expect(hasParticipantContext(incomplete)).toBe(false);
    expect(hasParticipantContext({ ...incomplete, field_other: "새 분야", participation_mode_other: "새 방식", participation_unit_other: "다른 중심" })).toBe(true);
  });

  it("keeps the individual/team layer additive and optional for a lower-burden entry", () => {
    expect(hasParticipantContext({ field: ["MUSIC"], participation_mode: ["PERFORMANCE_LIVE"], activity_form: "WITH_OTHER_WORK" })).toBe(true);
    expect(compactParticipantContext({ field: ["MUSIC"], participation_mode: ["PERFORMANCE_LIVE"], activity_form: "WITH_OTHER_WORK" }).participation_unit).toBeNull();
  });

  it("uses activity context only for participant-facing copy, not for a new route", () => {
    const everyday = { route: "SELF", field: ["MUSIC"], participation_mode: ["HOBBY_CLUB_EVERYDAY_ARTS"], activity_form: "HOBBY_CLUB" };
    expect(participantContextKind(everyday)).toBe("EVERYDAY");
    expect(contextAwareCopy(everyday).p14).toContain("요즘 이 활동");
    expect(dContextHints(everyday)).toContain("퇴근 뒤 시간과 회비");
    expect(participantContextKind({ route: "AUDIENCE" })).toBe("AUDIENCE");
  });

  it("covers the cultural-arts cases without making OTHER a default bucket", () => {
    const coverage = [
      ["R01", ["VISUAL_ARTS"], ["CREATION_PRODUCTION"], "PRIMARY_WORK", "INDIVIDUAL"],
      ["R01", ["FILM"], ["CREATION_PRODUCTION", "DIRECTION_CHOREOGRAPHY_COMPOSITION"], "PAID_PROJECT_BASED", "TEAM_GROUP"],
      ["R01", ["DANCE"], ["PERFORMANCE_LIVE"], "WITH_OTHER_WORK", "INDIVIDUAL"],
      ["R01", ["DANCE"], ["DIRECTION_CHOREOGRAPHY_COMPOSITION"], "WITH_EDUCATION", "INDIVIDUAL_AND_TEAM"],
      ["R01", ["THEATRE_PERFORMANCE"], ["PERFORMANCE_LIVE"], "PAID_PROJECT_BASED", "TEAM_GROUP"],
      ["R01", ["MUSIC"], ["PERFORMANCE_LIVE"], "WITH_OTHER_WORK", "INDIVIDUAL"],
      ["R01", ["TRADITIONAL_ARTS"], ["PERFORMANCE_LIVE", "EDUCATION_TRANSMISSION"], "WITH_EDUCATION", "INDIVIDUAL"],
      ["R01", ["INTERDISCIPLINARY"], ["CREATION_PRODUCTION"], "PAID_PROJECT_BASED", "TEAM_GROUP"],
      ["NON_ARTS", ["MUSIC"], ["HOBBY_CLUB_EVERYDAY_ARTS"], "HOBBY_CLUB", "TEAM_GROUP"],
      ["NON_ARTS", ["LOCAL_EVERYDAY_CULTURE", "TRADITIONAL_ARTS"], ["LOCAL_COMMUNITY_ACTIVITY"], "UNPAID_VOLUNTEER_COMMUNITY", "TEAM_GROUP"],
      ["R16", ["VISUAL_ARTS"], ["EDUCATION_TRANSMISSION"], "WITH_EDUCATION", "INDIVIDUAL"],
      ["R04", ["VISUAL_ARTS"], ["CURATION_PRODUCING"], "PRIMARY_WORK", "INDIVIDUAL"],
      ["R06", ["LITERATURE_PUBLISHING"], ["CRITICISM_RESEARCH"], "PRIMARY_WORK", "INDIVIDUAL"],
      ["NON_ARTS", ["FILM"], ["LEARNING_TRAINING"], "LEARNING_TRAINING", "INDIVIDUAL"],
    ];
    for (const [legacy_role, field, participation_mode, activity_form, participation_unit] of coverage) {
      const context = compactParticipantContext({ legacy_role, role_primary: legacy_role, field, participation_mode, activity_form, participation_unit });
      expect(context.field).not.toContain("OTHER");
      expect(context.participation_mode).not.toContain("OTHER");
      expect(context.legacy_role).toBe(legacy_role);
    }
  });

  it("keeps the contextual question language broad across work, everyday practice, and audience routes", () => {
    const cases = [
      { route: "SELF", field: ["DANCE"], participation_mode: ["PERFORMANCE_LIVE"], activity_form: "WITH_OTHER_WORK", participation_unit: "INDIVIDUAL", kind: "PROFESSIONAL" },
      { route: "SELF", field: ["TRADITIONAL_ARTS"], participation_mode: ["EDUCATION_TRANSMISSION"], activity_form: "WITH_EDUCATION", participation_unit: "INDIVIDUAL", kind: "PROFESSIONAL" },
      { route: "SELF", field: ["LOCAL_EVERYDAY_CULTURE"], participation_mode: ["LOCAL_COMMUNITY_ACTIVITY"], activity_form: "UNPAID_VOLUNTEER_COMMUNITY", participation_unit: "TEAM_GROUP", kind: "EVERYDAY" },
      { route: "AUDIENCE", field: ["FILM"], participation_mode: ["LEARNING_TRAINING"], activity_form: "LEARNING_TRAINING", participation_unit: "INDIVIDUAL", kind: "AUDIENCE" },
    ];
    for (const answers of cases) {
      expect(participantContextKind(answers)).toBe(answers.kind);
      for (const language of ["ko", "en", "ja", "zh-Hans", "zh-Hant", "fr", "es", "nl", "ms"]) {
        const copy = contextAwareCopy(answers, language);
        expect(`${copy.p12} ${copy.p13} ${copy.p14} ${copy.p15} ${copy.p16} ${copy.p19}`).toBeTruthy();
        if (language !== "ko") expect(`${copy.p12} ${copy.p13} ${copy.p14} ${copy.p15} ${copy.p16} ${copy.p19}`).not.toMatch(/[가-힣]/);
      }
    }
  });

  it("keeps direct labels for all nine supported languages", () => {
    for (const language of ["ko", "en", "ja", "zh-Hans", "zh-Hant", "fr", "es", "nl", "ms"]) {
      const options = participantContextOptions(language);
      expect(options.field).toHaveLength(13);
      expect(options.participation_mode).toHaveLength(15);
      expect(options.activity_form).toHaveLength(10);
      expect(options.participation_unit).toHaveLength(4);
      expect(contextAwareCopy({ route: "SELF" }, language).p14).toBeTruthy();
      if (language !== "ko") expect(contextAwareCopy({ route: "SELF" }, language).p14).not.toMatch(/[가-힣]/);
    }
  });
});
