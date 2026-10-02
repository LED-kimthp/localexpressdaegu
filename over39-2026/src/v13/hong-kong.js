// 홍콩판(繁體中文・香港, zh-Hant-HK). TK 2026-10-01: 홍콩에 중요한 네트워크가 있어 며칠 안에 링크를 보낸다.
// 현지 검토는 내년이라, 홍콩판 문구를 손으로 따로 쓰지 않고 대만 번체(zh-Hant)에서 만든다 —
// 간체(zh-Hans)를 번체에서 만드는 것과 같은 방식(i18n.js). 번체를 고치면 홍콩판도 저절로 따라간다.
//
// 바꾸는 것은 둘뿐이다.
//  · 부르는 말: 「您」→「你」. 홍콩 안내문은 「你」를 쓰고, 「您」은 대만·대륙 말투로 딱딱하게 들린다.
//  · 홍콩에서 누구나 다르게 쓰는 낱말. 애매한 것은 넣지 않는다 — 검토할 사람이 없는 지금,
//    틀린 홍콩식 말이 들어가는 것이 대만식 말이 남는 것보다 나쁘다.
// 참여자가 쓴 글·AI 가 쓴 글에는 쓰지 않는다. 화면 문구(사전)에만 쓴다.
export const HONG_KONG = "zh-Hant-HK";
export const isHongKong = (language) => String(language || "") === HONG_KONG;

// 순서가 중요하다 — 「網路上」을 「網絡上」보다 먼저 「網上」으로.
const HONG_KONG_WORDS = Object.freeze([
  ["您們", "你們"],
  ["您", "你"],
  ["電子郵件", "電郵"],
  ["網路上", "網上"],
  ["網路", "網絡"],
  ["線上", "網上"],
  ["隱私", "私隱"],
  ["計畫", "計劃"],
  ["專案", "項目"],
  ["數位", "數碼"],
  ["軟體", "軟件"],
  ["列印", "打印"],
  ["補助", "資助"],
  ["帳號", "帳戶"],
  ["點選", "點擊"],
  // 2026-10-02 번체 검토(두 번 검토해 받은 것만): 대만식 낱말 — 「電子信箱」은 한 쌍으로 「電子信箱地址」까지 「電郵地址」가 된다.
  // 넣지 않은 것: 奶奶→婆婆(친할머니가 외할머니로 바뀐다), 評鑑→評估(홍콩에서도 감정·평가의 뜻으로 쓴다), 節目單→場刊(공연 목록의 뜻이 사라진다).
  ["電子信箱", "電郵"],
  ["公車", "巴士"],
  ["補習班", "補習社"],
  ["升等", "晉升"],
  ["系所", "學系"],
  ["自由接案", "自由職業"],
  ["佇列", "隊列"],
  ["徵件", "徵集"],
  ["裡", "裏"],
]);

export function toHongKongText(text) {
  return HONG_KONG_WORDS.reduce((value, [from, to]) => value.replaceAll(from, to), String(text));
}

// 사전 한 벌을 통째로 옮긴다. 열쇠(한국어 원문·코드)는 그대로 두고 값만 바꾼다.
export function toHongKong(value) {
  if (typeof value === "string") return toHongKongText(value);
  if (Array.isArray(value)) return value.map(toHongKong);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toHongKong(item)]));
  }
  return value;
}

// 언어별 사전({ ko, en, …, "zh-Hant" })에 홍콩판을 더한다. 이미 있으면 덮지 않는다.
export function withHongKong(map) {
  if (map && map["zh-Hant"] !== undefined && map[HONG_KONG] === undefined) map[HONG_KONG] = toHongKong(map["zh-Hant"]);
  return map;
}

// 같은 글자체(번체)를 읽는 사람끼리는 옮기지 않는다 — 대만판으로 쓴 안부를 홍콩판 독자에게
// 「번역」해 보이면 같은 글이 두 번 나온다.
export const readingLanguage = (language) => (isHongKong(language) ? "zh-Hant" : String(language || ""));
