const AXIS_PATTERN = /^([MSD])([1-4])$/;

export const COORDINATE_SCOPE_LABELS = {
  self_practice: "나의 활동과 지속 경험",
  remembered_subject: "기억 대상과 맺은 나의 관계",
  art_relationship: "현재 나와 문화예술의 관계",
  combined_episode: "나의 활동과 기억이 함께 놓인 경험",
};

export function deriveCoordinateScope(answers = {}) {
  if (answers.route === "SELF") return "self_practice";
  if (answers.route === "BOTH") return "combined_episode";
  if (answers.route === "AUDIENCE" || answers.memory_type === "NO_RECALL") return "art_relationship";
  if (answers.route === "MEMORY") return "remembered_subject";
  return "art_relationship";
}

export function coordinateSubject(scope) {
  return scope === "remembered_subject"
    ? "respondent_relationship_to_remembered_subject"
    : "respondent_current_experience";
}

export function deriveSContextTags(answers = {}) {
  const tags = new Set();
  const values = [answers.activity_state, answers.visibility_state, answers.activity_state_evidence].filter(Boolean);
  if (values.includes("PACE_ADJUSTED") || values.includes("LIFE_ADJUSTED")) tags.add("pace_or_life_adjustment");
  if (values.includes("DISTANCED")) tags.add("distance_or_pause");
  if (values.includes("ACTIVE_LESS_VISIBLE")) tags.add("visibility_reduction");
  if (values.includes("ROLE_CHANGED") || values.includes("ROLE_SHIFT")) tags.add("role_or_method_change");
  if (values.includes("PROJECT_BASED") || values.includes("PROJECT_ONLY")) tags.add("project_based_continuity");
  return [...tags];
}

function axisIndex(value, expectedAxis) {
  const match = String(value || "").match(AXIS_PATTERN);
  if (!match || match[1] !== expectedAxis) return null;
  return Number(match[2]);
}

export function coordinateNumber(mPrimary, sPrimary, dPrimary) {
  const mIndex = axisIndex(mPrimary, "M");
  const sIndex = axisIndex(sPrimary, "S");
  const dIndex = axisIndex(dPrimary, "D");
  if (!mIndex || !sIndex || !dIndex) return null;
  return (mIndex - 1) * 16 + (sIndex - 1) * 4 + dIndex;
}

export function assessFallbackS(answers, candidateSentence) {
  const selected = answers.S_FALLBACK_1;
  const initialPrimary = ["S1", "S2", "S3", "S4"].includes(selected) ? selected : null;
  const confirmation = answers.S_FALLBACK_CONFIRM === "ACCEPT"
    ? "accepted"
    : answers.S_FALLBACK_CONFIRM === "EDIT"
      ? "edited"
      : answers.S_FALLBACK_CONFIRM === "SKIP" || selected === "SKIP"
        ? "skipped"
        : null;

  if (selected === "MIXED") {
    return {
      initialPrimary: null,
      primary: null,
      secondary: null,
      status: "mixed",
      confirmation,
      approvedSentence: null,
      source: "fixed_fallback",
      confidence: null,
      reviewReasons: ["competing_states"],
    };
  }

  if (!initialPrimary) {
    return {
      initialPrimary: null,
      primary: null,
      secondary: null,
      status: "insufficient",
      confirmation,
      approvedSentence: null,
      source: "fixed_fallback",
      confidence: null,
      reviewReasons: selected === "UNKNOWN" ? ["participant_unknown"] : ["s_axis_skipped"],
    };
  }

  const edited = confirmation === "edited";
  return {
    initialPrimary,
    primary: edited ? null : initialPrimary,
    secondary: null,
    status: "pending_review",
    confirmation,
    approvedSentence: confirmation === "accepted"
      ? candidateSentence
      : edited
        ? answers.s_participant_approved_sentence?.trim() || null
        : null,
    source: "fixed_fallback",
    confidence: null,
    reviewReasons: edited
      ? ["participant_edit_requires_reclassification"]
      : ["fixed_fallback_requires_review"],
  };
}

export function classifyCoordinate({ mPrimary, dPrimary, sAssessment }) {
  const candidateNumber = coordinateNumber(mPrimary, sAssessment.primary, dPrimary);

  if (sAssessment.status === "mixed") {
    return { status: "mixed", number: null, candidateNumber: null };
  }
  if (sAssessment.status === "pending_review") {
    return { status: "pending_review", number: null, candidateNumber };
  }
  if (!mPrimary || !dPrimary || !sAssessment.primary) {
    return { status: "insufficient", number: null, candidateNumber: null };
  }
  if (sAssessment.status === "complete" && sAssessment.source === "live_ai") {
    return { status: "complete", number: candidateNumber, candidateNumber };
  }
  return { status: "pending_review", number: null, candidateNumber };
}

const S_FROM_ACTIVITY = {
  ACTIVE_MAIN: "S2",
  ACTIVE_PARALLEL: "S2",
  PROJECT_BASED: "S2",
  ROLE_CHANGED: "S3",
  PACE_ADJUSTED: "S4",
  DISTANCED: "S4",
  VISIBLE_ACTIVE: "S1",
  ACTIVE_LESS_VISIBLE: "S2",
  ROLE_SHIFT: "S3",
  PROJECT_ONLY: "S2",
  LIFE_ADJUSTED: "S4",
};

export function deriveProvisionalS(answers = {}) {
  const candidates = [answers.activity_state, answers.visibility_state]
    .map((value) => S_FROM_ACTIVITY[value])
    .filter(Boolean);
  const unique = [...new Set(candidates)];
  if (!unique.length) return { primary: null, secondary: null, status: "insufficient", source: "fixed_answers" };
  if (unique.length > 1) return { primary: unique[0], secondary: unique[1], status: "mixed", source: "fixed_answers" };
  return { primary: unique[0], secondary: null, status: "candidate", source: "fixed_answers" };
}

export function snapshotCoordinate({ stage, mPrimary, sPrimary, dPrimary, source, scope = "art_relationship", subject = coordinateSubject(scope), sContextTags = [], statusHint = null }) {
  const number = coordinateNumber(mPrimary, sPrimary, dPrimary);
  const status = statusHint || (number ? "complete" : "insufficient");
  return {
    stage,
    source,
    coordinate_scope: scope,
    coordinate_subject: subject,
    s_context_tags: sContextTags,
    status,
    m_primary: mPrimary || null,
    s_primary: sPrimary || null,
    d_primary: dPrimary || null,
    coordinate_number: status === "complete" ? number : null,
    coordinate_candidate: number,
    recorded_at: new Date().toISOString(),
  };
}

export function buildCoordinateSnapshots(answers = {}) {
  const scope = deriveCoordinateScope(answers);
  const subject = coordinateSubject(scope);
  const sContextTags = deriveSContextTags(answers);
  const fixedS = deriveProvisionalS(answers);
  const fixed = snapshotCoordinate({
    stage: "fixed",
    mPrimary: answers.m_declared,
    sPrimary: fixedS.primary,
    dPrimary: answers.d_desired_change_primary,
    source: "fixed_answers",
    scope,
    subject,
    sContextTags,
    statusHint: fixedS.status === "mixed" ? "mixed" : null,
  });

  const depth = snapshotCoordinate({
    stage: "depth",
    mPrimary: answers.depth_m || answers.m_declared,
    sPrimary: answers.depth_s || fixedS.primary,
    dPrimary: answers.depth_d || answers.d_desired_change_primary,
    source: answers.depth_source || "approved_question_bank",
    scope,
    subject,
    sContextTags,
    statusHint: [answers.depth_m, answers.depth_s, answers.depth_d].includes("MIXED") ? "mixed" : null,
  });

  let participantFinal = null;
  if (answers.reflection_action === "ACCEPT" || answers.reflection_action === "EDIT") {
    participantFinal = snapshotCoordinate({
      stage: "participant_final",
      mPrimary: depth.m_primary,
      sPrimary: depth.s_primary,
      dPrimary: depth.d_primary,
      source: answers.reflection_action === "EDIT" ? "participant_revision" : "participant_confirmation",
      scope,
      subject,
      sContextTags,
    });
  } else if (answers.reflection_action === "OTHER_DIRECTION") {
    participantFinal = snapshotCoordinate({
      stage: "participant_final",
      mPrimary: answers.participant_m,
      sPrimary: answers.participant_s,
      dPrimary: answers.participant_d,
      source: "participant_direct_selection",
      scope,
      subject,
      sContextTags,
    });
  } else if (answers.reflection_action === "DROP") {
    participantFinal = snapshotCoordinate({
      stage: "participant_final",
      mPrimary: null,
      sPrimary: null,
      dPrimary: null,
      source: "participant_declined_summary",
      scope,
      subject,
      sContextTags,
      statusHint: "insufficient",
    });
  }

  return {
    fixed,
    depth,
    participant_final: participantFinal,
    research_derived: { ...depth, stage: "research_derived", source: `${depth.source}:research_derivative` },
  };
}
