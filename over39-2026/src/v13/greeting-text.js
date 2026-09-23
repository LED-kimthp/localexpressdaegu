// 안부 글을 보여 주는 두 자리 — 설문 안의 도착 화면(app.js)과 메일 링크의 편지함(relay.js) —
// 가 같이 쓰는 것. 한쪽에만 고치면 두 화면이 다르게 보인다(2026-09-23 편지함에 번역을 붙이며 뺌).
import { summaryParagraphsOf } from "./response-document.js?v=v7-20260923-r68";

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
  return summaryParagraphsOf(value);
}

// 길게 온 안부는 편지 글씨 크기를 내린다. 짧은 한 줄은 크게 놓아야 편지처럼 읽힌다.
export const GREETING_LONG_CHARS = 160;
