import { coordinateNumber } from "./classification.js";

export const connectionTopics = {
  CRITIQUE: "비평과 읽기",
  RECORD: "기록과 아카이브",
  EXHIBITION: "전시와 발표",
  COLLABORATION: "협업과 동료 관계",
  SPACE: "공간과 지역 현장",
  TRANSLATION: "번역과 국제 소개",
  AUDIENCE: "관객과 대화",
  SUSTAINABILITY: "지속할 기반과 제도",
};

const axes = {
  M1: { label: "감각·분위기", sentence: "감각과 분위기로 남은 기억" },
  M2: { label: "삶·정체성", sentence: "삶의 시간과 맞닿은 기억" },
  M3: { label: "탐구·창작", sentence: "작품의 생각과 시도를 따라가는 기억" },
  M4: { label: "관계·공공세계", sentence: "사람과 지역의 관계를 품은 기억" },
  S1: { label: "확장", sentence: "더 넓은 만남을 향해 움직이는" },
  S2: { label: "지속", sentence: "기존의 관계를 이어 가는" },
  S3: { label: "전환", sentence: "다른 의미와 역할로 옮겨 가는" },
  S4: { label: "거리·한계", sentence: "거리와 한계를 다시 살피는" },
  D1: { label: "접근·참여", sentence: "접근과 참여의 길을 찾는" },
  D2: { label: "개인 기반", sentence: "지속할 개인 기반을 찾는" },
  D3: { label: "관계·매개", sentence: "대화와 매개의 관계를 찾는" },
  D4: { label: "제도·구조", sentence: "장기 구조와 지원을 찾는" },
};

const values = (value) => Array.isArray(value) ? value : value ? [value] : [];

export function coordinateInsight({ mPrimary, sPrimary, dPrimary }) {
  const m = axes[mPrimary];
  const s = axes[sPrimary];
  const d = axes[dPrimary];
  const number = coordinateNumber(mPrimary, sPrimary, dPrimary);
  if (!m || !s || !d || !number) return null;

  return {
    code: `${mPrimary}-${sPrimary}-${dPrimary}`,
    number,
    title: `${m.label} · ${s.label} · ${d.label}`,
    shortTitle: `${m.label}의 ${s.label}`,
    description: `${m.sentence} 응답이 ${s.sentence} 흐름 안에서 ${d.sentence} 위치입니다.`,
    axes: { m: { code: mPrimary, ...m }, s: { code: sPrimary, ...s }, d: { code: dPrimary, ...d } },
  };
}

export function buildConnectionProfile(response, connection = {}) {
  const insight = coordinateInsight({
    mPrimary: response.axes?.m_primary || response.axes?.m_declared,
    sPrimary: response.axes?.s_primary || response.axes?.s_initial_primary,
    dPrimary: response.axes?.d_primary || response.axes?.d_desired_change_primary,
  });
  const answers = response.answers || {};
  return {
    response_id: response.response_id,
    route: response.route || "",
    role: answers.role_primary || "",
    role_group: answers.role_group_primary || "",
    languages: [response.source_language].filter(Boolean),
    locations: values(answers.activity_locations).map((item) => item.label || item).filter(Boolean),
    coordinate: insight,
    opt_in: connection.opt_in === "YES",
    message_audience: connection.message_audience || null,
    message_text: String(connection.message_text || connection.introduction || "").trim(),
    receive_opt_in: connection.receive_opt_in === "YES",
    receive_scopes: values(connection.receive_scopes),
    needs: values(connection.needs),
    offers: values(connection.offers),
    reply_modes: values(connection.reply_modes),
    introduction: String(connection.message_text || connection.introduction || "").trim(),
    visibility: connection.visibility || "RESEARCHER_ONLY",
    matching_mode: "mailbox_store_and_forward",
    status: connection.opt_in === "YES" ? "stored_waiting_receiver" : "not_requested",
  };
}

function overlap(left, right) {
  return values(left).filter((value) => values(right).includes(value));
}

function sameAxis(left, right, axis) {
  return left.coordinate?.axes?.[axis]?.code && left.coordinate.axes[axis].code === right.coordinate?.axes?.[axis]?.code;
}

export function suggestMatch(left, right) {
  if (!left?.opt_in || !right?.opt_in) return null;
  const reasons = [];
  let score = 0;
  const leftNeedRightOffer = overlap(left.needs, right.offers);
  const rightNeedLeftOffer = overlap(right.needs, left.offers);
  if (leftNeedRightOffer.length) {
    score += 32;
    reasons.push(`${leftNeedRightOffer.map((item) => connectionTopics[item] || item).join(", ")}에 대한 요청과 제안이 맞닿습니다`);
  }
  if (rightNeedLeftOffer.length) {
    score += 24;
    reasons.push(`반대 방향의 경험 교환도 가능합니다`);
  }
  if (sameAxis(left, right, "m")) {
    score += 12;
    reasons.push("기억이 남은 핵심 의미가 가깝습니다");
  }
  if (sameAxis(left, right, "d")) {
    score += 12;
    reasons.push("먼저 바라는 변화의 방향이 가깝습니다");
  }
  if (left.role_group && right.role_group && left.role_group !== right.role_group) {
    score += 10;
    reasons.push("서로 다른 역할의 관점이 만날 수 있습니다");
  }
  if (overlap(left.languages, right.languages).length) {
    score += 6;
    reasons.push("공통 응답 언어가 있습니다");
  }
  if (!score) return null;
  return { score, reasons, status: "researcher_review_required" };
}

export function rankedMatches(profile, candidates) {
  return candidates
    .filter((candidate) => candidate.response_id !== profile.response_id)
    .map((candidate) => ({ profile: candidate, match: suggestMatch(profile, candidate) }))
    .filter((item) => item.match)
    .sort((a, b) => b.match.score - a.match.score);
}
