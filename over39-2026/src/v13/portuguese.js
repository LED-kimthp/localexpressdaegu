// 포르투갈어(브라질, pt). TK 2026-10-04 「포르투갈어도 추가해줘 — 남미에도 참여할 수 있도록」.
//
// 다른 여덟 언어는 파일마다 언어 칸(copy.es = {…})을 따로 적어 두었다. 포르투갈어는 한 벌의 사전
// (portuguese-i18n.js: 한국어 원문 → 포르투갈어)에서 모든 화면 문구를 만든다 — 홍콩판이 대만 번체에서
// 만들어지는 것과 같은 방식이다. 한국어가 뜻의 원본이므로 한국어 문장을 열쇠로 쓴다.
//  · 장점: 문구가 한 곳에 있어 빠진 것·새는 것을 기계로 다 셀 수 있다(portuguese.test.js).
//  · 한계: 같은 한국어 문장은 어디서나 같은 포르투갈어가 된다. 지금까지 그런 충돌은 없다.
// 사전에 없는 문장은 한국어 그대로 남는다 — 시험이 그것을 0으로 지킨다. 참여자가 쓴 글·AI 가 쓴 글에는 쓰지 않는다.
import { PT_BR } from "./portuguese-i18n.js?v=v7-20261006-r110";

export const PORTUGUESE = "pt";
export const isPortuguese = (language) => String(language || "") === PORTUGUESE;

export function toPortugueseText(text) {
  const value = String(text);
  return Object.prototype.hasOwnProperty.call(PT_BR, value) ? PT_BR[value] : value;
}

// 사전 한 벌을 통째로 옮긴다. 열쇠(코드·한국어 원문)는 그대로 두고 값만 바꾼다.
export function toPortuguese(value) {
  if (typeof value === "string") return toPortugueseText(value);
  if (Array.isArray(value)) return value.map(toPortuguese);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPortuguese(item)]));
  }
  return value;
}

// 언어 칸 표(copy.ko / copy.en / …)에 pt 칸을 더한다. 한국어 칸에서 만들고, 한국어 칸에 없는 열쇠는
// 영어 칸에서 채운다(화면이 undefined 로 깨지지 않게). 영어로 남는 것도 시험이 센다.
// 사전이 거쳐 간 한국어 원문을 모아 둔다 — 빠진 문장을 기계로 세는 데 쓴다(portuguese.test.js·조립 도구).
export const PORTUGUESE_SOURCES = new Set();
const HANGUL = /[가-힣]/u;
function collect(value) {
  if (typeof value === "string") { if (HANGUL.test(value)) PORTUGUESE_SOURCES.add(value); return; }
  if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === "object") Object.values(value).forEach(collect);
}

export function withPortuguese(table) {
  if (!table || typeof table !== "object" || table[PORTUGUESE]) return table;
  const ko = table.ko;
  if (ko === undefined) {
    // 열쇠가 한국어 문장인 사전(rc2-ui-i18n 의 phrases 처럼 { en: { "한국어": "English" } })은 열쇠에서 만든다.
    const en = table.en;
    if (en && typeof en === "object" && !Array.isArray(en) && Object.keys(en).some((key) => HANGUL.test(key))) {
      const keys = Object.keys(en).filter((key) => HANGUL.test(key));
      keys.forEach((key) => PORTUGUESE_SOURCES.add(key));
      table[PORTUGUESE] = Object.fromEntries(keys.map((key) => [key, toPortugueseText(key)]));
    }
    return table;
  }
  collect(ko);
  const derived = toPortuguese(ko);
  const en = table.en;
  if (derived && typeof derived === "object" && !Array.isArray(derived) && en && typeof en === "object" && !Array.isArray(en)) {
    for (const [key, item] of Object.entries(en)) if (!(key in derived)) derived[key] = item;
  }
  table[PORTUGUESE] = derived;
  return table;
}
