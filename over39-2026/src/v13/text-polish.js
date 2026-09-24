// 「문장 다듬기」(TK 2026-09-24).
//
// 받은 요청은 「글쓰기가 어렵다」였다. 생각을 문장으로 만드는 것까지 참여자에게 맡기지 않는다.
// 낱말만, 오타째, 자판의 마이크로 말해서 적어도 되고, 원하면 단추 하나로 솔라가 오타·띄어쓰기를
// 고친 문장을 **적던 칸 안에** 넣어 준다. 단추도 없다 — 참여자가 「다음」을 누를 때 한 번 알아서
// 다듬는다(TK 2026-09-24: 「물어보지 말고 클릭하게 하지 말고」). 칸을 떠날 때는 다듬지 않는다 —
// 휴대폰에서는 스크롤하려고 칸 밖을 누르는 일이 잦아, 그때 글이 바뀌면 놀란다(TK). 언제 바뀌는지가
// 늘 같아야 한다. 그래서 그 사실을 칸 **위에**, 쓰기 전에 알린다(renderPolishLead).
// **쓰는 동안에는 글을 바꾸지 않는다.** 멈출 때마다 다듬게 했더니 생각하는 사이에 글이 바뀌고,
// 이어 쓰면 앞부분까지 또 바뀌고, 휴대폰 자판·받아쓰기와 부딪혔다(시연에서 확인한 것).
// 「다음」을 눌렀을 때 다듬을 글이 있으면 화면을 잠깐 붙잡고, 다듬은 문장을 보여 준 뒤 「다음」을
// 한 번 더 받는다 — 바뀐 글을 보지 않고 넘어가는 일이 없게. 그때 단추 이름은 「이 글로 제출」이다 —
// 똑같이 「다음」이면 「이대로 낼게요」인지 「또 바꿀래요」인지 가를 수 없었다(TK 시험). 한 번 더 다듬고
// 싶으면 칸 아래 「다시 다듬기」. AI 가 늦거나 실패하면 붙잡지 않는다.
// 다듬기 전에 쓴 글은 칸 아래에 보이고 「쓴 글로 되돌리기」로 돌아간다. 되돌린 칸은 다시 자동으로
// 다듬지 않는다. 칸에 보이는 글이 곧 남는 글이다.
//
// 지키는 것 셋:
// ① 다듬기는 고르는 것이다. 누르지 않아도, 솔라가 실패해도 쓴 글 그대로 넘어간다.
// ② 쓴 글(원문)은 지워지지 않는다. 다듬은 문장을 골라도 `text_polish` 에 원문·다듬은 문장·
//    고친 문장·어느 쪽을 골랐는지가 따로 남아 제출 기록과 함께 서버에 닿는다.
// ③ 답 칸(`answers[field]`)에는 참여자가 고른 글이 들어간다. 그래서 이어지는 질문·응답 정리·
//    마지막 제안이 따로 고치지 않아도 참여자가 고른 문장을 읽는다.

// 한 칸에서 자동으로 다듬는 횟수의 상한. 「다음」을 누를 때마다 부르므로 비용을 묶어 둔다.
export const POLISH_MAX_ATTEMPTS = 5;
// 「다음」을 붙잡아 두는 최대 시간. 이보다 늦으면 쓴 글 그대로 넘어간다.
export const POLISH_HOLD_MS = 8000;
// 서버(CLIENT_WAIT_MS.polish_text)와 같은 값이다. 한쪽을 바꾸면 다른 쪽도 바꾼다.
export const POLISH_TIMEOUT_MS = 20000;
export const POLISH_STATE_KEY = "text_polish";

// 다듬기를 붙이지 않는 칸. 응답 정리의 고친 문장은 이미 참여자가 AI 초안을 고치는 자리이고,
// 기관 의견은 연구 응답이 아니며, C01 은 이름을 적는 칸이다.
export const POLISH_EXCLUDED_IDS = Object.freeze(new Set(["participant_revision", "feedback_must_fix", "feedback_other", "C01"]));

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
    // 이 글은 이미 다듬었다 — 같은 글로 다시 부르지 않는다.
    checked: polished,
    auto_off: false,
    history: [...(entry?.history || []), { at, status: "success", source, polished, ...polishRunFields(run) }],
  };
}

// 지금 칸의 글을 자동으로 다듬을 것인가. 되돌린 칸, 이미 다듬은 글, 방금 실패한 글, 상한에 닿은 칸은 아니다.
// 「다음」에서 자동으로 다듬을 만한 길이. 「없음」「모름」처럼 짧은 글을 다듬느라 화면을 붙잡지 않는다.
export const POLISH_AUTO_MIN_LETTERS = 5;

export function shouldAutoPolish(entry, boxText) {
  const text = String(boxText || "");
  if (polishLetterCount(text) < POLISH_AUTO_MIN_LETTERS) return false;
  if (entry?.auto_off) return false;
  // 다듬은 문장이 칸에 들어가 있으면 다시 다듬지 않는다. 몇 글자 고치고 「다음」을 누를 때마다
  // 또 붙잡으면, 고친 글자가 다시 바뀌고 참여자는 끝없이 확인해야 한다.
  if (entry?.use === "polished" && entry?.polished) return false;
  if (polishAttemptsLeft(entry) <= 0) return false;
  if (entry?.checked === text) return false;
  if (entry?.failed_on === text) return false;
  return true;
}

// 실패는 횟수에 넣지 않는다. 참여자 탓이 아니다.
export function withPolishFailure(entry, { source, run = null, at = new Date().toISOString() }) {
  const base = entry || { written: source, polished: "", edited: "", use: "written", attempts: 0, history: [] };
  return { ...base, failed_on: source, history: [...(base.history || []), { at, status: "failed", source, ...polishRunFields(run) }] };
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

// 다듬은 문장이 칸에 들어 있는가. 그러면 「다음」 대신 「이 글로 제출」을 보인다.
export function polishedInBox(entry) {
  return Boolean(entry?.use === "polished" && entry?.polished);
}

// 「다시 다듬기」: 다듬은 문장을 몇 글자 고친 뒤 참여자가 직접 한 번 더 부르는 것. 자동 규칙
// (다듬은 문장이 든 칸은 다시 다듬지 않는다)을 넘어서지만 상한과 최소 글자는 지킨다.
export function canPolishAgain(entry, boxText) {
  return canPolishText(boxText) && polishAttemptsLeft(entry) > 0;
}

// 되돌리면 그 칸은 더 자동으로 다듬지 않는다. 다듬은 문장으로 다시 바꾸면 다시 켠다.
export function withPolishUse(entry, use) {
  const polished = use === "polished" && entry?.polished;
  return { ...entry, use: polished ? "polished" : "written", auto_off: !polished };
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
export function polishButtonLabel(copy, entry, busy) {
  if (busy) return copy.working;
  if (polishAttemptsLeft(entry) <= 0) return copy.limit;
  return Number(entry?.attempts || 0) > 0 ? copy.again : copy.button;
}

// 칸 위(칸 이름 바로 밑)에 두는 한 줄. 쓰기 전에 「다음」에서 글이 다듬어진다는 것을 알린다.
// 단추 이름은 화면마다 다르다(이어지는 질문은 「이 답변에서 이어가기」, 마지막은 「활용 범위 정하기」).
// 안내가 없는 단추 이름을 말하면 참여자는 그 단추를 찾는다 — 그 화면의 실제 이름을 넣는다.
export function renderPolishLead({ copy, esc, nextLabel = "" }) {
  return `<p class="polish-lead">${esc(copy.notice.split("{next}").join(nextLabel || copy.nextFallback || "다음"))}</p>`;
}

// 다듬은 문장을 받지 않을 때. 칸 한도를 넘거나(maxlength), 서버가 가린 개인정보 자리표시
// ([email removed] 같은 것)가 들어 있으면 참여자가 쓴 이메일·전화번호가 칸에서 사라진다.
export function rejectPolished(polished, { maxLength = 0 } = {}) {
  const text = String(polished || "");
  if (maxLength > 0 && text.length > maxLength) return "POLISH_OVER_LIMIT";
  if (/\[(?:email|phone|id) removed\]/i.test(text)) return "POLISH_REDACTED_PLACEHOLDER";
  return null;
}

export function renderPolishExtras({ copy, id, field, entry = null, busy = false, status = "", esc }) {
  const inBox = entry?.use === "polished" && entry?.polished;
  const statusText = busy ? copy.working : status === "failed" ? copy.failed : status === "nothing" ? copy.nothingMore : status === "confirm" && inBox ? copy.confirmNext : status === "polished" && inBox ? copy.polishedIn : "";
  // 알림(다듬는 중·다듬었다·실패했다)은 칸 바로 밑에 둔다 — 아래에 두면 휴대폰에서 눈에 안 띈다.
  const statusLine = `<p class="polish-status${busy ? " is-busy" : ["polished", "confirm"].includes(status) ? " is-done" : ""}" role="status">${esc(statusText)}</p>`;
  const guide = `<div class="polish-guide">
    <p class="polish-hint">${esc(copy.hint)}</p>
  </div>`;
  // 칸에 들어 있지 않은 쪽을 아래에 보인다. 다듬은 문장이 칸에 있으면 쓴 글을, 쓴 글로 되돌렸으면 다듬은 문장을.
  // 다듬은 문장에 손을 댄 뒤에는 되돌리기를 숨긴다. 되돌리면 그 뒤에 쓴 말이 칸에서 사라진다.
  // 처음 쓴 글은 기록(written·history)에 그대로 남는다.
  const edited = inBox && String(entry.edited ?? entry.polished) !== entry.polished;
  const other = entry?.polished
    ? `<div class="polish-other" data-polish-result="${esc(field)}">
    <p class="polish-other-label">${esc(inBox ? copy.originalLabel : copy.polishedLabel)}</p>
    <blockquote class="polish-other-text">${esc(inBox ? entry.written : entry.edited ?? entry.polished)}</blockquote>
    <div class="polish-actions">${inBox && canPolishAgain(entry, answerFromPolish(entry)) ? `<button class="secondary-button polish-again" type="button" data-action="polish-again" data-polish-field="${esc(field)}" data-polish-id="${esc(id)}"${busy ? " disabled" : ""}>${esc(copy.repolish)}</button>` : ""}${edited ? "" : `<button class="text-button polish-use" type="button" data-action="polish-use" data-polish-field="${esc(field)}" data-polish-id="${esc(id)}" data-polish-use="${inBox ? "written" : "polished"}">${esc(inBox ? copy.restoreWritten : copy.restorePolished)}</button>`}</div>
  </div>`
    : "";
  const example = `<details class="polish-example"><summary>${esc(copy.exampleSummary)}</summary><dl><div><dt>${esc(copy.exampleWrittenLabel)}</dt><dd>${esc(copy.exampleWritten)}</dd></div><div><dt>${esc(copy.examplePolishedLabel)}</dt><dd>${esc(copy.examplePolished)}</dd></div></dl></details>`;
  return `<div class="polish-extras" data-polish-extras="${esc(field)}">${statusLine}${guide}${other}${example}</div>`;
}
