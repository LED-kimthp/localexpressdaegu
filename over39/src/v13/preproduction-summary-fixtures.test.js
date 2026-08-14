import { describe, expect, it } from "vitest";
import { buildAdaptiveRuleSummary } from "./depth.js";

const fixtures = [
  ["visual-artist", { route: "SELF", memory_meaning_text: "동료와 함께 설치를 마친 밤의 긴장이 오래 남아 있습니다.", transition_text: "전시보다 작업실에서 동료와 주고받는 시간이 더 중요해졌습니다.", support_conditions_text: "안정적인 작업 공간과 긴 대화의 시간이 필요합니다." }],
  ["dance", { route: "SELF", memory_meaning_text: "리허설 끝에 몸을 쉬게 해야 한다는 감각이 남았습니다.", invisible_continuity_text: "공연이 없을 때도 수업과 연습을 조절하며 이어갔습니다.", desired_change_text: "회복할 시간과 연습 공간이 함께 보장되면 좋겠습니다." }],
  ["curator", { route: "SELF", memory_meaning_text: "작가와 관객이 천천히 대화하던 전시의 장면이 남았습니다.", transition_text: "사업 단위보다 관계를 다음 해까지 이어가는 일을 더 고민하게 됐습니다.", support_conditions_text: "기획의 시간을 보장하는 운영 구조가 필요합니다." }],
  ["life-art-community", { route: "SELF", memory_meaning_text: "퇴근 뒤 합창 연습에서 서로의 목소리를 맞추던 시간이 남았습니다.", transition_text: "생활 리듬이 바뀐 뒤에도 모임이 있는 날은 문화예술과 다시 가까워집니다.", desired_change_text: "부담 없이 모일 수 있는 시간과 가까운 연습 공간이 필요합니다." }],
  ["audience", { route: "AUDIENCE", memory_meaning_text: "가까운 도서관에서 본 작은 전시가 기억에 남았습니다.", invisible_continuity_text: "온라인으로 소식을 저장해 두었다가 가족과 함께 다시 찾아갑니다.", desired_change_text: "가까운 곳의 쉬운 안내와 이동 부담이 줄어들면 좋겠습니다." }],
  ["no-recall", { route: "AUDIENCE", no_recall_relation_text: "손녀가 가자고 하면 함께 공연을 보러 갑니다.", support_conditions_text: "함께 갈 사람과 편한 이동 시간이 필요합니다." }],
];

describe("pre-production final-summary fixtures", () => {
  it("keeps six different cultural-arts contexts as short causal prose", () => {
    for (const [name, answers] of fixtures) {
      const result = buildAdaptiveRuleSummary({ answers });
      expect(result.summary, name).toMatch(/이어져 있|중심에 있/);
      expect(result.summary, name).toContain("중요합니다");
      expect(result.summary, name).not.toMatch(/을\/를|이\/가|와\/과/);
      expect(result.source).toBe("rules");
    }
  });
});
