export const QUESTION_METADATA = {
  P05: { purpose: "활동 또는 관람 경험의 시간 범위", axis: "S", evidence: "support", intent: "응답이 놓인 시간의 폭을 이해하기 위한 질문입니다." },
  P06: { purpose: "현재 활동 상태", axis: "S", evidence: "support", intent: "활동이 지금 어떤 리듬으로 이어지는지 살핍니다." },
  P07: { purpose: "최근 활동 변화의 경험", axis: "S", evidence: "support", intent: "현재 상태가 만들어진 경험의 흐름을 함께 봅니다." },
  M01: { purpose: "기억 대상 선택", axis: "M", evidence: "context", intent: "기억이 시작되는 대상을 확인합니다." },
  M02: { purpose: "기억 단서 원문", axis: "M", evidence: "context", intent: "이름보다 먼저 남아 있는 장면과 표현을 기록합니다." },
  M03: { purpose: "대상별 기억의 초점", axis: "M", evidence: "support", intent: "선택한 대상에서 무엇이 먼저 떠오르는지 살핍니다." },
  M04: { purpose: "기억의 주된 의미", axis: "M", evidence: "primary", intent: "이 기억에서 가장 중요하게 남은 의미를 확인합니다." },
  M05: { purpose: "기억 의미의 보조 근거", axis: "M", evidence: "support", intent: "주된 의미와 함께 남아 있는 다른 단서를 살핍니다." },
  M06: { purpose: "기억 시기", axis: "M", evidence: "context", intent: "기억이 놓인 시간대를 기록합니다." },
  M07: { purpose: "기억 지역", axis: "M", evidence: "context", intent: "기억이 생긴 장소와 이동의 맥락을 기록합니다." },
  M08: { purpose: "경험 방식", axis: "M", evidence: "support", intent: "직접 경험과 기록을 통한 경험을 구분해 봅니다." },
  M09: { purpose: "기억 대상과의 관계", axis: "M", evidence: "support", intent: "이 기억을 바라보는 관계의 위치를 확인합니다." },
  M10: { purpose: "다음 증언자", axis: "M", evidence: "context", intent: "기억을 더 이어 줄 수 있는 다른 시선을 찾습니다." },
  D01: { purpose: "현재 비어 있는 조건", axis: "D", evidence: "support", intent: "지금 가장 부족하게 느끼는 조건을 확인합니다." },
  D02: { purpose: "가장 먼저 바라는 변화", axis: "D", evidence: "primary", intent: "여러 필요 가운데 먼저 움직여야 할 자리를 살핍니다." },
  D03: { purpose: "변화가 필요한 현실 맥락", axis: "D", evidence: "support", intent: "선택한 변화가 어떤 현실에서 비롯되는지 확인합니다." },
  D04: { purpose: "조건의 구체적 영향", axis: "D", evidence: "context", intent: "그 조건이 활동과 기억에 남긴 영향을 당신의 말로 기록합니다." },
  R01: { purpose: "향후 연구 활용 기대", axis: "D", evidence: "context", intent: "이 기억이 앞으로 어떤 방식으로 이어지길 바라는지 살핍니다." },
  AI_M1: { purpose: "M축 심화 확인", axis: "M", evidence: "primary", intent: "앞선 답변에서 무엇이 가장 중요하게 남아 있는지 조금 더 살펴봅니다." },
  AI_S1: { purpose: "S축 심화 확인", axis: "S", evidence: "primary", intent: "그 경험이 지금 어떤 방향으로 이어지고 있는지 살펴봅니다." },
  AI_D1: { purpose: "D축 심화 확인", axis: "D", evidence: "primary", intent: "다음 변화가 어느 자리에서 필요하다고 느끼는지 살펴봅니다." },
};

export const FIXED_RESEARCH_QUESTION_MAP = Object.entries(QUESTION_METADATA)
  .filter(([id]) => !id.startsWith("AI_"))
  .map(([id, meta]) => ({ id, ...meta }));
