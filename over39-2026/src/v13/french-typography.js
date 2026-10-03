// 프랑스어 문장부호 앞 빈칸(? ! : ; ») 과 « 뒤 빈칸을 끊기지 않는 좁은 빈칸(U+202F)으로 (2026-10-02).
// 보통 빈칸이면 휴대폰에서 「?」 하나가 다음 줄로 혼자 떨어진다 — 첫 화면 제목 「où sont-ils passés ?」.
// 프랑스 출판물이 이 자리에 쓰는 빈칸이다. 문구 원본·저장되는 글은 바꾸지 않고 화면에 그린 글만 바꾼다.
// AI 가 쓴 프랑스어 글(되물음·정리문·안부 번역)에도 같이 듣는다. 참여자가 쓴 원문 칸은 건드리지 않는다.
const NARROW_NO_BREAK_SPACE = " ";

export function frenchSpacingText(text) {
  return String(text)
    .replace(/[  ]([?!:;»])/g, `${NARROW_NO_BREAK_SPACE}$1`)
    .replace(/«[  ]/g, `«${NARROW_NO_BREAK_SPACE}`);
}

export function applyFrenchSpacing(root, language) {
  if (!root || !/^fr/i.test(String(language || "")) || typeof document === "undefined") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest("textarea, script, style, [contenteditable='true'], .raw-words-list, [data-source-kind='participant_raw']")) continue;
    const next = frenchSpacingText(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }
}
