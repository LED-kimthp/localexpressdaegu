// 안부 글을 보여 주는 두 자리 — 설문 안의 도착 화면(app.js)과 메일 링크의 편지함(relay.js) —
// 가 같이 쓰는 것. 한쪽에만 고치면 두 화면이 다르게 보인다(2026-09-23 편지함에 번역을 붙이며 뺌).

// 브라우저가 알려주는 말(ko-KR · zh-SG · ja-JP)을 우리가 내놓는 아홉 개 중 하나로 좁힌다.
// 설문 화면(app.js)은 이 일을 하는데 편지함(relay.js)은 하지 않아, 「ko-KR 로 옮기되 한국어를
// 쓰지 말라」는 앞뒤가 맞지 않는 지시가 나가고 한국 사람에게 영어 안내가 보였다(2026-09-23 검증).
export const OFFERED_LANGUAGE_CODES = Object.freeze(["ko", "en", "ja", "zh-Hans", "zh-Hant", "nl", "es", "fr", "ms"]);
export function narrowLanguage(value) {
  const tag = String(value || "").trim().toLowerCase();
  if (!tag) return "";
  if (tag.startsWith("ko")) return "ko";
  if (tag.startsWith("ja")) return "ja";
  // 홍콩·대만·마카오와 「번체」 표기는 번체로, 나머지 중국어는 간체로 연다.
  if (tag.startsWith("zh")) return /hant|-tw|-hk|-mo/u.test(tag) ? "zh-Hant" : "zh-Hans";
  for (const code of ["en", "nl", "es", "fr", "ms"]) if (tag.startsWith(code)) return code;
  return "";
}

// 사람이 읽는 언어 이름. 「원문 · Français」처럼 쓴다. 코드(zh-Hant)를 그대로 보이지 않는다.
export const LANGUAGE_LABELS = Object.freeze({
  ko: "한국어", en: "English", ja: "日本語", "zh-Hans": "简体中文", "zh-Hant": "繁體中文",
  nl: "Nederlands", es: "Español", fr: "Français", ms: "Bahasa Melayu",
});
export const languageLabel = (code) => LANGUAGE_LABELS[String(code || "")] || String(code || "");

// 쓴 사람이 줄을 바꿔 썼으면 그 모양을 그대로 둔다. 정리문용 규칙(summaryParagraphsOf)은
// 줄바꿈을 공백으로 펴고 문장을 다시 묶어서, 한 줄에 한 문장씩 쓴 안부가 뭉개졌다.
// 한 덩어리로 온 긴 글만 정리문과 같은 규칙으로 나눈다(TK 2026-09-23).
export function greetingParagraphsOf(text) {
  const value = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!value) return [];
  if (value.includes("\n")) return value.split(/\n[ \t]*\n+/).map((part) => part.trim()).filter(Boolean);
  return denseParagraphsOf(value);
}

// 한 덩어리로 온 긴 글을 읽을 만한 덩이로 나눈다. 정리문의 규칙(response-document.js의
// summaryParagraphsOf)과 같은 값을 쓴다. 옮겨 온 까닭은 편지함(relay.js)이 그 파일 하나 때문에
// 사전 1.7MB까지 끌어오고 있었기 때문이다 — 메일 링크는 휴대폰 데이터로 열린다(2026-09-23 검증).
function denseParagraphsOf(text) {
  const single = String(text || "").trim();
  if (!single) return [];
  const sentences = splitIntoSentences(single);
  if (sentences.length < 3) return [single];
  const dense = (single.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) || []).length > single.length / 3;
  const budget = dense ? 150 : 320;
  const groups = Math.min(4, Math.max(2, Math.round(single.length / budget)));
  if (groups < 2) return [single];
  const perGroup = Math.ceil(sentences.length / groups);
  const out = [];
  for (let index = 0; index < sentences.length; index += perGroup) out.push(sentences.slice(index, index + perGroup).join(" ").trim());
  return out.filter(Boolean);
}

function splitIntoSentences(text) {
  return String(text || "").split(/(?<=[.!?。！？])\s+/u).map((part) => part.trim()).filter(Boolean);
}

// 길게 온 안부는 편지 글씨 크기를 내린다. 짧은 한 줄은 크게 놓아야 편지처럼 읽힌다.
export const GREETING_LONG_CHARS = 160;
