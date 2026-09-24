// 「문장 다듬기」(TK 2026-09-24).
//
// 받은 요청은 「글쓰기가 어렵다」였다. 생각을 문장으로 만드는 것까지 참여자에게 맡기지 않는다.
// 낱말만, 오타째, 자판의 마이크로 말해서 적어도 되고, 칸 **바로 밑** 「문장 다듬기」를 누르면 솔라가
// 오타·띄어쓰기를 고친 문장을 **적던 칸 안에** 넣어 준다.
// 처음에는 「다음」을 누를 때 저절로 다듬었다(r77–r83). 그런데 글 칸 아래에 고를 것이 이어지는
// 화면에서는 「다음」이 맨 아래에 있고 다듬은 문장은 맨 위 칸에 들어가, 올라가 확인하고 다시 내려와
// 눌러야 했다(TK 2026-09-24). 그래서 단추를 칸 밑에 두고, 누른 뒤에는 기다리지 않고 아래 질문에
// 답해도 되게 했다. 「다음」은 다듬기를 붙잡지 않는다 — 누르지 않았으면 쓴 글 그대로 넘어간다.
// **쓰는 동안에는 글을 바꾸지 않는다.** 멈출 때마다 다듬게 했더니 생각하는 사이에 글이 바뀌고,
// 이어 쓰면 앞부분까지 또 바뀌고, 휴대폰 자판·받아쓰기와 부딪혔다(시연에서 확인한 것).
// 다듬기 전에 쓴 글은 칸 아래에 보이고 「쓴 글로 되돌리기」로 돌아간다. 칸에 보이는 글이 곧 남는 글이다.
//
// 지키는 것 셋:
// ① 다듬기는 고르는 것이다. 누르지 않아도, 솔라가 실패해도 쓴 글 그대로 넘어간다.
// ② 쓴 글(원문)은 지워지지 않는다. 다듬은 문장을 골라도 `text_polish` 에 원문·다듬은 문장·
//    고친 문장·어느 쪽을 골랐는지가 따로 남아 제출 기록과 함께 서버에 닿는다.
// ③ 답 칸(`answers[field]`)에는 참여자가 고른 글이 들어간다. 그래서 이어지는 질문·응답 정리·
//    마지막 제안이 따로 고치지 않아도 참여자가 고른 문장을 읽는다.

// 한 칸에서 다듬는 횟수의 상한. 「다시 다듬기」를 누를 때마다 부르므로 비용을 묶어 둔다.
export const POLISH_MAX_ATTEMPTS = 5;
// 서버(CLIENT_WAIT_MS.polish_text)와 같은 값이다. 한쪽을 바꾸면 다른 쪽도 바꾼다.
export const POLISH_TIMEOUT_MS = 20000;
export const POLISH_STATE_KEY = "text_polish";

// 다듬기를 붙이지 않는 칸. 기관 의견은 연구 응답이 아니며, C01 은 이름을 적는 칸이다.
// 응답 정리의 「고친 문장」(participant_revision)은 2026-09-24 부터 붙인다(TK: 「일부 문장을 고치는 것도
// 문장 다듬기 넣어 줘」). 다듬어도 확인은 참여자가 칸에 보이는 글로 하고, 다듬었다는 사실은 확인 기록
// (participant_approved_provenance.polish)에 남는다.
export const POLISH_EXCLUDED_IDS = Object.freeze(new Set(["feedback_must_fix", "feedback_other", "C01"]));

export function polishLetterCount(value) {
  return (String(value || "").match(/[\p{L}\p{N}]/gu) || []).length;
}

// 서버의 하한과 같다. 이보다 짧으면 단추를 끈다.
export function canPolishText(value) {
  return polishLetterCount(value) >= 2;
}

export function polishEntry(answers, field) {
  const entry = answers?.[POLISH_STATE_KEY]?.[field];
  return entry && typeof entry === "object" ? entry : null;
}

// 답 칸과 맞는 다듬기 기록만 쓴다. 답이 다른 길로 바뀌었으면(회수함으로 옮김, 응답 정리의 초안 채우기,
// 경로 바꾸기) 남은 기록은 옛 글의 것이다 — 그것을 칸에 되살리면 참여자가 지운 글이 돌아온다.
export function livePolishEntry(answers, field) {
  const entry = polishEntry(answers, field);
  if (!entry) return null;
  return answerFromPolish(entry) === String(answers?.[field] ?? "") ? entry : null;
}

export function polishAttemptsLeft(entry) {
  return Math.max(0, POLISH_MAX_ATTEMPTS - Number(entry?.attempts || 0));
}

// 참여자가 쓴 글. 다듬기를 한 번도 안 했으면 답 칸의 글이 곧 쓴 글이다.
export function writtenText(answers, field) {
  const entry = polishEntry(answers, field);
  return entry ? String(entry.written || "") : String(answers?.[field] || "");
}

// 답 칸에 들어갈 글 — 참여자가 고른 쪽.
export function answerFromPolish(entry) {
  if (!entry) return "";
  return entry.use === "polished" && entry.polished ? String(entry.edited ?? entry.polished) : String(entry.written || "");
}

// `source` 는 이번에 보낸 글이다. 「다듬기 전에 쓴 글」은 참여자가 직접 쓴 글로 남긴다 — 다듬은
// 문장을 조금 고쳐 다시 다듬어도, 아래에 보이는 것은 처음에 쓴 글이다.
export function withPolishResult(entry, { source, polished, run = null, at = new Date().toISOString() }) {
  const written = entry?.use === "polished" && entry?.polished ? String(entry.written || "") : source;
  return {
    written,
    polished,
    edited: polished,
    use: "polished",
    attempts: Number(entry?.attempts || 0) + 1,
    history: [...(entry?.history || []), { at, status: "success", source, polished, ...polishRunFields(run) }],
  };
}

// 실패는 횟수에 넣지 않는다. 참여자 탓이 아니다. 단추는 그대로 켜져 있어 다시 누를 수 있다.
export function withPolishFailure(entry, { source, run = null, at = new Date().toISOString() }) {
  const base = entry || { written: source, polished: "", edited: "", use: "written", attempts: 0, history: [] };
  return { ...base, history: [...(base.history || []), { at, status: "failed", source, ...polishRunFields(run) }] };
}

// 칸을 고치면 지금 칸에 든 쪽이 고쳐진다. 다듬은 문장이 들어 있으면 그 문장을(몇 글자만
// 고치고 넘기는 경우), 쓴 글로 되돌려 두었으면 쓴 글을.
export function withBoxEdit(entry, value) {
  return entry.use === "polished" && entry.polished ? { ...entry, edited: value } : { ...entry, written: value };
}

// 다음 다듬기에 보낼 글. 다듬은 문장을 손대지 않고 다시 누르면 쓴 글에서 다른 방식으로
// 다듬게 한다(같은 글을 보내면 같은 문장이 온다). 고친 뒤 누르면 고친 문장을 다듬는다.
export function polishSource(answers, field) {
  const entry = polishEntry(answers, field);
  if (!entry) return { text: String(answers?.[field] || ""), previousPolished: "" };
  if (entry.use === "polished" && entry.polished) {
    const edited = String(entry.edited ?? entry.polished);
    return edited === entry.polished ? { text: String(entry.written || ""), previousPolished: entry.polished } : { text: edited, previousPolished: "" };
  }
  return { text: String(entry.written || ""), previousPolished: "" };
}

// 칸 밑 단추를 누를 수 있는가(「문장 다듬기」도 「다시 다듬기」도). 두 글자 이상, 다섯 번까지.
export function canPolishAgain(entry, boxText) {
  return canPolishText(boxText) && polishAttemptsLeft(entry) > 0;
}

// 「쓴 글로 되돌리기」·「다듬은 문장으로 바꾸기」. 두 글은 모두 기록에 남는다.
export function withPolishUse(entry, use) {
  const polished = use === "polished" && entry?.polished;
  return { ...entry, use: polished ? "polished" : "written" };
}

function polishRunFields(run) {
  if (!run) return {};
  return {
    provider: run.provider || null,
    model: run.model || null,
    prompt_version: run.prompt_version || null,
    latency_ms: run.latency_ms ?? null,
    ...(run.error_code ? { error_code: run.error_code } : {}),
  };
}

function authHeaders(anonKey) {
  return { "Content-Type": "application/json", ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}) };
}

export async function requestTextPolish({ endpoint, anonKey, mode = "fallback", text, question = "", previousPolished = "", attempt = 1, responseId = null, language = "", fetchImpl = fetch, timeoutMs = POLISH_TIMEOUT_MS }) {
  const source = String(text || "").trim();
  if (!canPolishText(source)) return { text: "", run: { status: "skipped", provider: "rules", error_code: "POLISH_TEXT_TOO_SHORT" } };
  if (mode !== "live" || !endpoint) return { text: "", run: { status: "fallback", provider: "unavailable", error_code: "POLISH_NOT_CONFIGURED" } };
  const started = Date.now();
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: authHeaders(anonKey),
      signal: controller?.signal,
      body: JSON.stringify({
        operation: "polish_text",
        client_wait_ms: timeoutMs,
        context: {
          text: source,
          question: String(question || "").trim().slice(0, 400),
          ...(previousPolished ? { previous_polished: String(previousPolished) } : {}),
          attempt,
          // 참여자가 고른 화면 언어. 서버가 누구에게 맡길지 고를 때 쓴다(말레이어는 글만으로 가르기 어렵다).
          ...(language ? { language } : {}),
          ...(responseId ? { response_id: responseId } : {}),
        },
      }),
    });
    if (!response.ok) throw new Error(`AI_HTTP_${response.status}`);
    const body = await response.json();
    const polished = String(body.polished_text || "").trim();
    if (!polished) throw new Error("AI_POLISH_EMPTY");
    return {
      text: polished,
      run: { status: "success", provider: String(body.provider || "api").toLowerCase(), model: body.model || null, prompt_version: body.prompt_version || null, latency_ms: Date.now() - started },
    };
  } catch (error) {
    const code = error?.name === "AbortError" ? "AI_TIMEOUT" : String(error?.message || "AI_FAILED");
    return { text: "", run: { status: "fallback", provider: "api", error_code: code, latency_ms: Date.now() - started } };
  } finally {
    clearTimeout(timer);
  }
}

// ── 화면 ────────────────────────────────────────────────────────────────────
// 적는 칸 아래에 붙는 부분. 적는 칸 자체는 app.js 의 renderText 가 그린다.
// 칸 위(칸 이름 바로 밑)에 두는 안내. 쓰기 전에 칸 밑 단추로 다듬을 수 있다는 것을 알린다.
// short: 처음 본 칸이 아니면 아무것도 두지 않는다 — 칸 밑에 「문장 다듬기」 단추가 늘 있으니
// 한 번 들으면 된다(TK 2026-09-24: 「이제 안내는 없어도 되겠다」).
// 「다듬지 않고 쓴 그대로 남길게요」 선택 줄은 뺐다 — 누르지 않으면 다듬지 않으니 끌 것이 없다.
// off: 전에 그 줄로 끈 사람(이어쓰기 초안). 칸마다 「껐습니다 · 다시 켜기」를 보인다.
export function renderPolishLead({ copy, esc, short = false, off = false }) {
  if (off) {
    return `<p class="polish-lead is-short is-off">${esc(copy.offNote)} <button class="text-button polish-turn-on" type="button" data-action="polish-on">${esc(copy.turnOn)}</button></p>`;
  }
  if (short) return "";
  return `<p class="polish-lead">${esc(copy.notice)}</p>`;
}

// 참여자가 다듬기를 껐는가. 설문 답(answers.text_polish_preference)에 남겨 기록과 관리자 화면에서 보인다.
export const POLISH_PREFERENCE_KEY = "text_polish_preference";
export function polishTurnedOff(answers) {
  return answers?.[POLISH_PREFERENCE_KEY] === "off";
}

// 긴 안내를 보일 칸인가. 처음 본 다듬기 칸을 기억해 두고(leadField) 그 칸에서만 길게 보인다 —
// 앞으로 돌아가 그 칸을 다시 봐도 긴 안내가 그대로다.
export function polishLeadIsShort(leadField, field) {
  return Boolean(leadField) && leadField !== field;
}

// 다듬은 문장을 받지 않을 때. 칸 한도를 넘거나(maxlength), 서버가 가린 개인정보 자리표시
// ([email removed] 같은 것)가 들어 있으면 참여자가 쓴 이메일·전화번호가 칸에서 사라진다.
export function rejectPolished(polished, { maxLength = 0 } = {}) {
  const text = String(polished || "");
  if (maxLength > 0 && text.length > maxLength) return "POLISH_OVER_LIMIT";
  if (/\[(?:email|phone|id) removed\]/i.test(text)) return "POLISH_REDACTED_PLACEHOLDER";
  return null;
}

// 화면 키보드의 마이크 버튼과 같은 모양. 「마이크 버튼」이라는 말만으로는 어떤 모양인지 떠올리기 어렵다
// (나이 드신 분일수록 키보드에 마이크가 있는 줄 모른다). 키보드에서 같은 그림을 찾게 한다.
const MIC_ICON = '<svg class="polish-mic" viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true" style="vertical-align:-0.2em;margin:0 0.15em"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 17.5V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

// text: 지금 칸에 든 글. 단추를 누를 수 있는지(두 글자 이상·다섯 번까지) 가른다.
// lead: 처음 본 다듬기 칸인가. 마이크 안내와 예시는 그 칸에만 둔다 — 뒤 칸은 단추만(TK 2026-09-24).
export function renderPolishExtras({ copy, id, field, entry = null, busy = false, status = "", off = false, text = "", lead = true, esc }) {
  const inBox = entry?.use === "polished" && entry?.polished;
  const statusText = busy ? copy.working : status === "failed" ? copy.failed : status === "nothing" ? copy.nothingMore : status === "confirm" && inBox ? copy.confirmNext : "";
  // 단추와 알림(다듬는 중·다듬었다·실패했다)은 칸 바로 밑에 둔다 — 아래에 두면 휴대폰에서 눈에 안 띈다.
  const statusLine = `<p class="polish-status${busy ? " is-busy" : status === "confirm" ? " is-done" : ""}" role="status">${esc(statusText)}</p>`;
  const exhausted = polishAttemptsLeft(entry) <= 0;
  const runnable = !busy && canPolishAgain(entry, text);
  const run = off ? "" : `<div class="polish-run"><button class="secondary-button polish-again" type="button" data-action="polish-again" data-polish-field="${esc(field)}" data-polish-id="${esc(id)}"${runnable ? "" : " disabled"}${busy ? ' aria-busy="true"' : ""}>${esc(exhausted ? copy.limit : inBox ? copy.repolish : copy.button)}</button>${statusLine}</div>`;
  const guide = !lead ? "" : `<div class="polish-guide">
    <p class="polish-hint">${esc(copy.hint).split("{mic}").join(MIC_ICON)}</p>
  </div>`;
  // 칸에 들어 있지 않은 쪽을 아래에 보인다. 다듬은 문장이 칸에 있으면 쓴 글을, 쓴 글로 되돌렸으면 다듬은 문장을.
  // 다듬은 문장에 손을 댄 뒤에는 되돌리기를 숨긴다. 되돌리면 그 뒤에 쓴 말이 칸에서 사라진다.
  // 처음 쓴 글은 기록(written·history)에 그대로 남는다.
  const edited = inBox && String(entry.edited ?? entry.polished) !== entry.polished;
  const other = entry?.polished
    ? `<div class="polish-other" data-polish-result="${esc(field)}">
    <p class="polish-other-label">${esc(inBox ? copy.originalLabel : copy.polishedLabel)}</p>
    <blockquote class="polish-other-text">${esc(inBox ? entry.written : entry.edited ?? entry.polished)}</blockquote>
    <div class="polish-actions">${edited ? "" : `<button class="text-button polish-use" type="button" data-action="polish-use" data-polish-field="${esc(field)}" data-polish-id="${esc(id)}" data-polish-use="${inBox ? "written" : "polished"}">${esc(inBox ? copy.restoreWritten : copy.restorePolished)}</button>`}</div>
  </div>`
    : "";
  // 다듬기를 끈 사람에게 「이렇게 다듬습니다」 예시는 쓸모가 없다.
  const example = off || !lead ? "" : `<details class="polish-example"><summary>${esc(copy.exampleSummary)}</summary><dl><div><dt>${esc(copy.exampleWrittenLabel)}</dt><dd>${esc(copy.exampleWritten)}</dd></div><div><dt>${esc(copy.examplePolishedLabel)}</dt><dd>${esc(copy.examplePolished)}</dd></div></dl></details>`;
  return `<div class="polish-extras" data-polish-extras="${esc(field)}">${off ? statusLine : run}${guide}${other}${example}</div>`;
}
