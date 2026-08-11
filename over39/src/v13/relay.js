const root = document.querySelector("#root");
const endpoint = String(window.OVER39_SUPABASE_RELAY_URL || "").trim();
const token = new URLSearchParams(location.search).get("t") || "";

const text = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const copy = {
  ko: {
    label: "〈만 39세 이상〉 · 안부 중계", title: "다른 곳에서 도착한 안부가 있습니다", lead: "이번 리서치에 남긴 경험과 이어질 수 있는 이야기가 도착했습니다. 읽어 보고, 답장을 남기거나 이번에는 지나갈 수 있습니다.", replyTitle: "답장을 남겨 보세요", replyHelp: "편한 언어로 적어 주세요. 이 답장은 연구팀을 통해 전달됩니다.", placeholder: "짧은 인사나 질문을 적어 주세요.", accept: "대화를 열어둘게요", decline: "이번에는 지나갈게요", send: "답장 보내기", sent: "답장을 연구팀에 전달했습니다.", declined: "이번에는 답장을 남기지 않기로 했습니다.", error: "안부를 불러오지 못했습니다. 링크를 다시 확인해 주세요.", loading: "안부를 불러오고 있습니다.", from: "연구팀을 통해 도착한 안부",
  },
  en: {
    label: "Over 39 · Message relay", title: "A greeting has arrived from another place", lead: "A note connected to an experience in this research has arrived. You may reply, or simply pass this time.", replyTitle: "Leave a reply", replyHelp: "Write in the language that feels most natural. Your reply will be relayed by the research team.", placeholder: "A short greeting or question is enough.", accept: "Keep this conversation open", decline: "Pass this time", send: "Send reply", sent: "Your reply has been passed to the research team.", declined: "You chose not to reply this time.", error: "We could not open this message. Please check the link.", loading: "Opening the message.", from: "A greeting relayed by the research team",
  },
  it: {
    label: "Over 39 · Messaggi", title: "È arrivato un saluto da un altro luogo", lead: "È arrivato un messaggio che può entrare in dialogo con un'esperienza condivisa in questa ricerca. Puoi rispondere oppure lasciarlo passare per ora.", replyTitle: "Lascia una risposta", replyHelp: "Scrivi nella lingua che ti è più naturale. La risposta verrà inoltrata dal gruppo di ricerca.", placeholder: "Bastano un breve saluto o una domanda.", accept: "Vorrei tenere aperto il dialogo", decline: "Per questa volta passo", send: "Invia la risposta", sent: "La risposta è stata affidata al gruppo di ricerca.", declined: "Hai scelto di non rispondere questa volta.", error: "Non è stato possibile aprire il messaggio. Controlla il link.", loading: "Apro il messaggio.", from: "Un saluto inoltrato dal gruppo di ricerca",
  },
  mn: {
    label: "Over 39 · Мессеж дамжуулах", title: "Өөр газраас мэндчилгээ ирлээ", lead: "Энэ судалгаанд үлдээсэн туршлагатай тань холбогдох захиа ирлээ. Хариу бичих эсвэл энэ удаа алгасаж болно.", replyTitle: "Хариу бичээрэй", replyHelp: "Өөрт эвтэй хэлээрээ бичээрэй. Таны хариуг судалгааны баг дамжуулна.", placeholder: "Богино мэндчилгээ эсвэл асуулт байхад болно.", accept: "Яриаг нээлттэй үлдээе", decline: "Энэ удаа алгасъя", send: "Хариу илгээх", sent: "Таны хариуг судалгааны багт дамжууллаа.", declined: "Энэ удаа хариу бичихгүй байхаар сонголоо.", error: "Мессежийг нээж чадсангүй. Холбоосоо дахин шалгана уу.", loading: "Мессежийг нээж байна.", from: "Судалгааны багаас дамжуулсан мэндчилгээ",
  },
  fa: {
    label: "Over 39 · انتقال پیام", title: "سلامی از جایی دیگر رسیده است", lead: "پیامی رسیده که می‌تواند با تجربه‌ای که در این پژوهش نوشته‌اید گفت‌وگو کند. می‌توانید پاسخ بدهید یا فعلاً از آن بگذرید.", replyTitle: "پاسخی بگذارید", replyHelp: "به زبانی که برایتان طبیعی‌تر است بنویسید. پاسخ شما از طریق گروه پژوهش منتقل می‌شود.", placeholder: "یک سلام یا پرسش کوتاه کافی است.", accept: "می‌خواهم گفت‌وگو باز بماند", decline: "این بار می‌گذرم", send: "ارسال پاسخ", sent: "پاسخ شما به گروه پژوهش سپرده شد.", declined: "این بار تصمیم گرفتید پاسخی نفرستید.", error: "پیام باز نشد. لطفاً پیوند را دوباره بررسی کنید.", loading: "در حال باز کردن پیام.", from: "سلامی که گروه پژوهش منتقل کرده است",
  },
};

let state = { loading: true, relay: null, error: "", result: "" };

function languageForRelay() {
  const language = state.relay?.thread?.messages?.find((message) => message.source_language)?.source_language || navigator.language || "ko";
  const primary = language.toLowerCase().split("-")[0];
  return copy[primary] ? primary : "ko";
}

function c() { return copy[languageForRelay()]; }

function render() {
  const words = c();
  if (state.loading) {
    root.innerHTML = `<main class="relay-layout"><p>${text(words.loading)}</p></main>`;
    return;
  }
  if (state.error) {
    root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(words.label)}</div><h1>${text(words.error)}</h1></section></main>`;
    return;
  }
  if (state.result) {
    root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(words.label)}</div><h1>${text(state.result)}</h1></section></main>`;
    return;
  }
  const messages = state.relay.thread.messages || [];
  root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(words.label)}</div><h1>${text(words.title)}</h1><p class="relay-lead">${text(words.lead)}</p><section class="relay-messages">${messages.map((message) => `<article class="relay-message"><span>${text(words.from)}</span><p>${text(message.body_original)}</p>${message.translated_body ? `<small>${text(message.translated_body)}</small>` : ""}</article>`).join("")}</section>${state.relay.thread.can_reply ? `<section class="relay-reply"><h2>${text(words.replyTitle)}</h2><p>${text(words.replyHelp)}</p><textarea class="text-input" data-relay-message maxlength="1400" placeholder="${text(words.placeholder)}"></textarea><div class="relay-actions"><button class="secondary-button" data-relay-action="decline">${text(words.decline)}</button><button class="primary-button" data-relay-action="reply">${text(words.send)} <span aria-hidden="true">→</span></button></div></section>` : ""}</section></main>`;
}

async function request(payload) {
  if (!endpoint || !token) throw new Error("RELAY_NOT_CONFIGURED");
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, token }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error_code || "RELAY_REQUEST_FAILED");
  return body;
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button?.dataset.relayAction) return;
  try {
    if (button.dataset.relayAction === "decline") {
      await request({ action: "respond", intent: "decline" });
      state.result = c().declined;
    } else {
      const message = document.querySelector("[data-relay-message]")?.value.trim() || "";
      if (!message) return;
      await request({ action: "respond", intent: "reply", message, source_language: navigator.language || "" });
      state.result = c().sent;
    }
  } catch {
    state.error = "RELAY_REQUEST_FAILED";
  }
  render();
});

if (!token || !endpoint) {
  state.loading = false;
  state.error = "RELAY_NOT_CONFIGURED";
  render();
} else {
  request({ action: "view" })
    .then((relay) => { state.relay = relay; state.loading = false; render(); })
    .catch(() => { state.loading = false; state.error = "RELAY_ACCESS_DENIED"; render(); });
}
