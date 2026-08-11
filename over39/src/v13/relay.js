const root = document.querySelector("#relay-root");
const endpoint = String(window.OVER39_SUPABASE_RELAY_URL || "").trim();
const token = new URLSearchParams(location.search).get("t") || "";
const text = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const copy = {
  ko: { label: "GLOBAL GREETINGS · ACROSS 64 COORDINATES", title: "안부의 좌표", lead: "다른 좌표에서 한 문장이 도착했습니다. 원문을 먼저 읽고, 필요하면 번역을 펼쳐보세요.", reason: "이 안부가 닿은 이유", original: "원문", translation: "번역 보기", hideTranslation: "번역 접기", replyTitle: "답장을 맡길까요?", replyHelp: "답장 원문도 그대로 보존하며 연락처는 상대에게 공개하지 않습니다.", placeholder: "짧은 인사나 질문을 적어주세요.", pass: "이번에는 지나갈게요", withdraw: "안부 연결 철회", send: "답장 맡기기", sent: "답장을 맡겼습니다.", passed: "이번 안부는 조용히 지나갑니다.", withdrawn: "이 안부 연결을 철회했습니다.", error: "안부를 불러오지 못했습니다. 링크를 다시 확인해주세요.", loading: "안부를 불러오고 있습니다.", mine: "나의 위치", sender: "안부를 보낸 사람의 위치" },
  en: { label: "GLOBAL GREETINGS · ACROSS 64 COORDINATES", title: "Coordinates of Greeting", lead: "A sentence has arrived from another coordinate. Read the original first, then open the translation if you need it.", reason: "Why this greeting reached you", original: "Original", translation: "View translation", hideTranslation: "Hide translation", replyTitle: "Entrust a reply?", replyHelp: "Your original reply is preserved, and your contact details are never shown to the other participant.", placeholder: "A short greeting or question is enough.", pass: "Pass this time", withdraw: "Withdraw this connection", send: "Entrust reply", sent: "Your reply has been entrusted.", passed: "This greeting will pass quietly this time.", withdrawn: "This greeting connection has been withdrawn.", error: "We could not open this greeting. Please check the link.", loading: "Opening the greeting.", mine: "My position", sender: "Sender’s position" },
};

let state = { loading: true, relay: null, error: "", result: "", translations: new Set() };
function c() { return copy[(navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en"]; }
function pointIndex(point) {
  const number = (key) => Number(String(point?.[key]?.code || point?.[key] || "").slice(1));
  const [m, s, d] = [number("m"), number("s"), number("d")];
  return m && s && d ? (m - 1) * 16 + (s - 1) * 4 + (d - 1) : -1;
}
function coordinateGraphic(thread) {
  const sender = pointIndex(thread.sender_coordinate || thread.connection_reason?.sender_point);
  const mine = pointIndex(thread.receiver_coordinate || thread.connection_reason?.receiver_point);
  if (sender < 0 && mine < 0) return "";
  return `<div class="greeting-coordinate-map"><div class="coordinate-grid" aria-label="64개 좌표 위의 두 위치">${Array.from({ length: 64 }, (_, index) => `<span class="${index === sender ? "is-sender" : ""} ${index === mine ? "is-mine" : ""}"><i></i></span>`).join("")}</div><div class="coordinate-legend"><span><i class="mine-dot"></i>${text(c().mine)}</span><span><i class="sender-dot"></i>${text(c().sender)}</span></div></div>`;
}
function reasonSection(thread) {
  const reason = thread.connection_reason;
  if (!reason) return "";
  return `<section class="relay-reason"><span>${text(c().reason)}</span><p>${text(reason.summary || "")}</p>${coordinateGraphic(thread)}${(reason.evidence || []).slice(0, 2).map((item) => `<small>${text(item)}</small>`).join("")}</section>`;
}
function messageCard(message) {
  const open = state.translations.has(message.id);
  return `<article class="relay-letter"><div class="relay-envelope" aria-hidden="true"><i></i><b></b><span></span></div><span>${text(c().original)} · ${text(message.source_language || "")}</span><p lang="${text(message.source_language || "")}">${text(message.body_original)}</p>${message.translated_body ? `<button class="translation-toggle" type="button" data-translation-id="${text(message.id)}" aria-expanded="${open}">${text(open ? c().hideTranslation : c().translation)}</button>${open ? `<div class="relay-translation" lang="${text(message.translation_language || "")}"><span>${text(message.translation_language || "")}</span><p>${text(message.translated_body)}</p></div>` : ""}` : ""}</article>`;
}
function render() {
  if (state.loading) { root.innerHTML = `<main class="relay-layout"><p>${text(c().loading)}</p></main>`; return; }
  if (state.error) { root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(c().label)}</div><h1>${text(c().error)}</h1></section></main>`; return; }
  if (state.result) { root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(c().label)}</div><h1>${text(state.result)}</h1></section></main>`; return; }
  const thread = state.relay.thread; const messages = thread.messages || [];
  root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(c().label)}</div><h1>${text(c().title)}</h1><p class="relay-lead">${text(c().lead)}</p>${reasonSection(thread)}<section class="relay-messages">${messages.map(messageCard).join("")}</section>${thread.can_reply ? `<section class="relay-reply"><h2>${text(c().replyTitle)}</h2><p>${text(c().replyHelp)}</p><textarea class="text-input" data-relay-message maxlength="1400" placeholder="${text(c().placeholder)}"></textarea><div class="relay-actions"><button class="secondary-button" data-relay-action="pass">${text(c().pass)}</button><button class="primary-button" data-relay-action="reply">${text(c().send)} <span aria-hidden="true">→</span></button></div><button class="relay-withdraw" data-relay-action="withdraw">${text(c().withdraw)}</button></section>` : ""}</section></main>`;
}
async function request(payload) {
  if (!endpoint || !token) throw new Error("RELAY_NOT_CONFIGURED");
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, token }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error_code || "RELAY_REQUEST_FAILED");
  return body;
}

document.addEventListener("click", async (event) => {
  const translation = event.target.closest("[data-translation-id]");
  if (translation) { const id = translation.dataset.translationId; state.translations.has(id) ? state.translations.delete(id) : state.translations.add(id); render(); return; }
  const button = event.target.closest("[data-relay-action]"); if (!button) return;
  try {
    const action = button.dataset.relayAction;
    if (action === "pass") { await request({ action: "respond", intent: "pass" }); state.result = c().passed; }
    else if (action === "withdraw") { await request({ action: "respond", intent: "withdraw" }); state.result = c().withdrawn; }
    else { const message = document.querySelector("[data-relay-message]")?.value.trim() || ""; if (!message) return; await request({ action: "respond", intent: "reply", message, source_language: navigator.language || "" }); state.result = c().sent; }
  } catch { state.error = "RELAY_REQUEST_FAILED"; }
  render();
});

if (!token || !endpoint) { state.loading = false; state.error = "RELAY_NOT_CONFIGURED"; render(); }
else request({ action: "view" }).then((relay) => { state.relay = relay; state.loading = false; render(); }).catch(() => { state.loading = false; state.error = "RELAY_ACCESS_DENIED"; render(); });
