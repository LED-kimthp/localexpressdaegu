// 관리자 화면의 「한 사람 = 한 장」(TK 2026-09-23).
//
// 연구자가 한 사람을 읽는 순서 그대로 다섯 칸을 놓는다.
//   ① 어떤 답변을 했나   ② 어떤 제안문을 받았나   ③ 최종 PDF
//   ④ 안부를 어떻게 남겼나   ⑤ 누구의 안부가 누구에게 갔나
// 예전 상세 화면은 DB 표 이름 순서(고정질문 원문 / 좌표 스냅샷 / 심화질문 …)였다. 그 표들은
// 지우지 않고 맨 아래 「운영 기록」으로 내린다 — admin.js 가 그린다.
//
// 이 파일은 자료를 받아 조립하고 HTML 문자열을 돌려주기만 한다. 요청도 DOM 도 없다.
// 불러오는 일은 admin.js 의 api()(관리자 토큰, RLS)만 한다.

import { SAMPLE_LABELS, buildRecord, buildRecordBundle, collectSnapshots, polishForValue, renderRecordBundleHtml } from "./record-export.js?v=v7-20260924-r74";
import { renderResponseDocument, summaryParagraphsOf } from "./response-document.js?v=v7-20260924-r74";
import { LABELS } from "./research-insights.js?v=v7-20260924-r74";

const text = (value) => String(value ?? "").trim();
const array = (value) => (Array.isArray(value) ? value : value === null || value === undefined || value === "" ? [] : [value]);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const when = (value) => (text(value) ? text(value).slice(0, 16).replace("T", " ") : "");

// 안부 상태. REPLIED 는 보낸 사람에게 답한 것이 아니라, 읽고 **다음 사람에게** 한 문장을
// 이어 쓴 것이다(over39-relay: reply → 새 안부 WAITING_RECEIVER).
export const GREETING_STATUS_LABEL = Object.freeze({
  STORED: "저장됨",
  WAITING_RECEIVER: "받을 사람을 기다리는 중",
  QUEUED: "받을 사람이 정해짐 · 전달 전",
  EMAIL_PENDING: "받을 사람이 정해짐 · 메일 알림 전",
  DELIVERED: "전달됨 · 아직 열지 않음",
  OPENED: "받은 사람이 열어 봄",
  REPLIED: "받은 사람이 읽고 다음 사람에게 이어 씀",
  PASSED: "받은 사람이 읽고 넘김",
  WITHDRAWN: "거둬들임",
});

// 받은 사람에게까지 닿은 상태.
export const DELIVERED_STATUSES = Object.freeze(["DELIVERED", "OPENED", "REPLIED", "PASSED"]);
export const isDelivered = (greeting) => Boolean(text(greeting?.receiver_record_id)) && DELIVERED_STATUSES.includes(text(greeting?.status));

// 참여자가 고른 문장 그대로(stage1-i18n.js · relay.js 의 한국어). 연구자가 따로 이름 붙이지 않는다.
export const SENDER_VISIBILITY_CHOICE = Object.freeze({
  NAMED: "이름 또는 선택한 표기를 보여줘도 괜찮아요",
  CONTEXTUAL: "역할·지역 정도만 보여주세요",
  ANONYMOUS: "익명으로 남길게요",
});

// 어떻게 이 두 사람이 이어졌나. 옛 기록에는 selection_method 가 없어 summary_key 로 읽는다.
const SELECTION_LABEL = Object.freeze({
  model_judgment: "AI가 두 기록을 읽고 골랐어요",
  JUDGED_GREETING: "AI가 두 기록을 읽고 골랐어요",
  random_after_safety_gate: "안전 확인을 거친 안부 가운데 무작위로 골랐어요",
  RANDOM_SAFE_GREETING: "안전 확인을 거친 안부 가운데 무작위로 골랐어요",
  project_seed: "프로젝트가 준비한 첫 안부예요",
  PROJECT_FIRST_GREETING: "프로젝트가 준비한 첫 안부예요",
  CURATED_RECORD_CONNECTION: "연구자가 두 기록을 보고 이었어요",
});

const STATUS_LABEL = Object.freeze({ completed: "완료", in_progress: "중단·진행 중" });
export const sessionStatusLabel = (status) => STATUS_LABEL[text(status)] || text(status) || "상태 미기록";
export const routeLabel = (route) => LABELS.route?.[text(route)] || text(route) || "경로 미선택";

// ── 목록용 ────────────────────────────────────────────────────────────────
// 왼쪽 목록 한 줄에 필요한 것만 스냅샷에서 뽑는다. 제안문은 있는지만 알면 되지만 PostgREST
// 는 계산한 참/거짓을 돌려주지 못한다. 글을 받아 곧바로 참/거짓으로 바꾸고 버린다.
export const PERSON_SNAPSHOT_SELECT = [
  "response_id",
  "submission_phase",
  "created_at",
  "display_name_mode:payload->answers->>display_name_mode",
  "display_name:payload->answers->>display_name",
  "document_name:payload->response_document->participant->>display_name",
  "reference_code:payload->participant_reference->>code",
  "participant_code:payload->>participant_code",
  "offer:payload->answers->closing_offer->>text",
  "document_status:payload->response_document->>status",
].join(",");

export const GREETING_INDEX_SELECT = "id,sender_record_id,receiver_record_id,status,origin";

export const shortId = (responseId) => {
  const id = text(responseId);
  return id.length > 10 ? `…${id.slice(-6)}` : id;
};

// 익명을 고른 사람은 적어 둔 이름이 남아 있어도 쓰지 않는다(record-export.js 와 같은 규칙).
function labelFrom({ mode, name, code, responseId }) {
  const chosen = text(mode) || "ANONYMOUS";
  const shownName = chosen === "ANONYMOUS" ? "" : text(name);
  return {
    name: shownName || (chosen === "ANONYMOUS" ? "익명" : "표기 없음"),
    code: text(code),
    short: text(code) || shortId(responseId),
  };
}

export const personLabelText = (person) => (person ? `${person.name} · ${person.short}` : "");

/**
 * 목록 한 줄씩의 사람 정보. 스냅샷은 사람당 여러 행이므로 가장 완성된 것 하나로 접되,
 * 제안문은 **어느** 스냅샷에든 있으면 받은 것으로 센다 — 늦게 도착한 제안은 나중 행에만 있다.
 * @returns {Map<string, {name, code, short, hasOffer, hasDocument, wrote, delivered, received}>}
 */
export function buildPeopleIndex({ snapshots = [], greetings = [] } = {}) {
  const collected = collectSnapshots(snapshots);
  const withOffer = new Set(array(snapshots).filter((row) => text(row?.offer)).map((row) => text(row.response_id)));
  const withDocument = new Set(array(snapshots).filter((row) => text(row?.document_status)).map((row) => text(row.response_id)));
  const people = new Map();
  const ensure = (responseId) => {
    const id = text(responseId);
    if (!id) return null;
    if (!people.has(id)) people.set(id, { ...labelFrom({ responseId: id }), hasOffer: false, hasDocument: false, wrote: 0, delivered: 0, received: 0 });
    return people.get(id);
  };
  for (const [id, row] of collected.kept) {
    const person = ensure(id);
    Object.assign(person, labelFrom({
      mode: row.display_name_mode,
      name: row.display_name || row.document_name,
      code: row.reference_code || row.participant_code,
      responseId: id,
    }), { hasOffer: withOffer.has(id), hasDocument: withDocument.has(id) });
  }
  for (const greeting of array(greetings)) {
    const sender = ensure(greeting?.sender_record_id);
    if (sender) {
      sender.wrote += 1;
      if (isDelivered(greeting)) sender.delivered += 1;
    }
    const receiver = ensure(greeting?.receiver_record_id);
    if (receiver && isDelivered(greeting)) receiver.received += 1;
  }
  return people;
}

// ── 한 사람 ────────────────────────────────────────────────────────────────
const latestWith = (snapshots, pick) => array(snapshots)
  .filter((row) => pick(row?.payload))
  .sort((a, b) => text(a.created_at).localeCompare(text(b.created_at)))
  .pop() || null;

const baseOperation = (name) => text(name).split(":")[0];

/**
 * 다섯 칸에 들어갈 자료. 줄이지 않는다 — 원문은 원문대로 넘긴다.
 * @param {{session?: object, snapshots?: Array<object>, revision?: object, consentEvents?: Array<object>, sent?: Array<object>, received?: Array<object>, aiRuns?: Array<object>}} input
 */
export function buildPersonSheet({ session = {}, snapshots = [], revision = null, consentEvents = [], sent = [], received = [], aiRuns = [] } = {}) {
  const collected = collectSnapshots(snapshots);
  const responseId = text(session.response_id) || [...collected.kept.keys()][0] || "";
  const best = collected.kept.get(responseId) || null;
  const record = buildRecord({ session, snapshot: best, revision, consentEvents });

  // ② 제안문. 가장 완성된 스냅샷에 없으면 제안이 실린 가장 늦은 스냅샷에서 읽는다.
  const offerRow = best?.payload?.answers?.closing_offer?.text ? best : latestWith(snapshots, (payload) => payload?.answers?.closing_offer?.text);
  const offer = offerRow?.payload?.answers?.closing_offer || null;
  const attemptsRow = latestWith(snapshots, (payload) => array(payload?.answers?.closing_offer_attempts).length);
  const offerRuns = array(aiRuns).filter((row) => baseOperation(row?.operation) === "closing_offer")
    .sort((a, b) => text(a.started_at || a.created_at).localeCompare(text(b.started_at || b.created_at)));

  // ③ 최종 PDF. 완료 화면이 그리고 참여자가 인쇄한 것은 payload.response_document 다
  // (app.js renderRc2Complete). 그것이 없을 때만 활용 범위 화면에서 만든 초안을 쓴다.
  const documentRow = best?.payload?.response_document ? best : latestWith(snapshots, (payload) => payload?.response_document || payload?.answers?.response_document_draft);
  const responseDocument = documentRow?.payload?.response_document || documentRow?.payload?.answers?.response_document_draft || null;

  const byTime = (a, b) => text(a?.created_at).localeCompare(text(b?.created_at));
  return {
    responseId,
    session,
    record,
    offer: offer ? {
      text: text(offer.text),
      evidence: array(offer.evidence).map((item) => (typeof item === "string" ? text(item) : text(item?.text || item?.quote))).filter(Boolean),
      source: text(offer.source),
      provider: text(offer.provider),
    } : null,
    offerAttempts: array(attemptsRow?.payload?.answers?.closing_offer_attempts),
    offerRuns,
    document: responseDocument && typeof responseDocument === "object" ? responseDocument : null,
    documentFromDraft: Boolean(responseDocument) && !documentRow?.payload?.response_document,
    confirmedAt: text(best?.payload?.document_confirmation?.confirmed_at) || text(responseDocument?.confirmed_at),
    sent: array(sent).slice().sort(byTime),
    received: array(received).slice().sort(byTime),
  };
}

// ── 그리기 ────────────────────────────────────────────────────────────────
// 상대를 누르면 그 사람의 장으로 넘어간다. 목록에 없는 사람(상한 500 밖)은 누를 수 없게 글로만.
function personLink(responseId, people, known) {
  const id = text(responseId);
  const person = people?.get(id);
  const label = person ? personLabelText(person) : shortId(id);
  return known?.has(id)
    ? `<button type="button" class="person-link" data-response-id="${esc(id)}">${esc(label)}</button>`
    : `<span class="person-link is-plain">${esc(label)}</span>`;
}

const section = (no, id, title, meta, body) => `<section class="admin-detail-section person-section" id="person-${id}"><h2><span class="person-no" aria-hidden="true">${no}</span><span class="person-title">${esc(title)}</span>${meta ? `<span class="person-meta">${esc(meta)}</span>` : ""}</h2>${body}</section>`;
const empty = (line) => `<p class="person-empty">${esc(line)}</p>`;
const quote = (value, label = "") => `<blockquote class="person-quote">${label ? `<span>${esc(label)}</span>` : ""}${esc(value)}</blockquote>`;

// 「문장 다듬기」(r73~): 답 칸에는 참여자가 고른 글이 들어간다. AI가 다듬은 문장을 골랐으면 그렇다고
// 적고 처음 쓴 글을 바로 밑에 둔다 — 표시 없이 두면 AI 문장을 참여자의 원문으로 읽게 된다.
function polishBlock(polish, value) {
  const row = polishForValue(polish, value);
  if (!row) return "";
  if (row.reverted) return `<p class="person-polish">AI가 다듬은 문장을 받았지만 처음 쓴 글을 골랐어요.</p>`;
  return `<p class="person-polish is-polished">AI가 다듬은 문장 · 참여자가 고름${row.editedAfter ? " · 그 뒤 직접 고침" : ""}</p>${row.written ? quote(row.written, "처음 쓴 글") : ""}`;
}

// ① 문항과 이어진 질문을 실제로 오간 순서대로 놓는다. 이어진 질문은 그것을 부른 문항 바로 뒤에.
function renderAnswers(sheet) {
  const { answers, followups, narratives, approved } = sheet.record;
  const polish = array(sheet.record.polish);
  if (!answers.rows.length && !followups.rows.length) {
    return empty(sheet.record.gaps[0] || "읽을 수 있는 답이 없어요.");
  }
  const pending = [...followups.rows];
  const followupBlock = (row) => `<div class="person-qa is-followup"><p class="person-q"><span class="person-tag">이어진 질문${row.checkpoint ? ` · ${esc(row.checkpoint)}` : ""}</span>${esc(row.prompt || "질문 문구가 저장되지 않았어요.")}</p><p class="person-a">${esc(row.answer || "답을 남기지 않았어요.")}</p>${polishBlock(polish, row.answer)}</div>`;
  const blocks = answers.rows.map((row) => {
    const after = pending.filter((item) => item.checkpoint && item.checkpoint === row.id);
    after.forEach((item) => pending.splice(pending.indexOf(item), 1));
    return `<div class="person-qa"><p class="person-q"><span class="person-tag">${esc(row.id)}${row.axis ? ` · ${esc(row.axis)}` : ""}</span>${esc(row.question)}</p><p class="person-a">${esc(row.answer)}</p>${polishBlock(polish, row.answer)}</div>${after.map(followupBlock).join("")}`;
  });
  // 문항 표·이어진 질문 어디에도 이어지지 않은 다듬기(좌표 의견 칸 등). 조용히 빠지지 않게 따로 둔다.
  const shown = [...answers.rows.map((row) => text(row.answer)), ...followups.rows.map((row) => text(row.answer))];
  const elsewhere = polish.filter((row) => row.usedPolished && !shown.includes(row.chosen));
  const approvedBlock = approved.text
    ? `<h3>참여자가 확인한 정리문</h3>${quote(approved.text, approved.korean && approved.korean !== approved.text ? "원문" : "")}${approved.korean && approved.korean !== approved.text ? quote(approved.korean, "한국어 번역") : ""}`
    : `<h3>참여자가 확인한 정리문</h3>${empty("확인한 정리문이 없어요(정리 단계 전에 멈췄거나 직접 쓰기로 했어요).")}`;
  return `${answers.labelled ? "" : `<p class="person-note">옛 판본이라 문항 문구가 저장되지 않았어요. 필드 이름과 값만 보여요.</p>`}
    <div class="person-answers">${blocks.join("")}${pending.map(followupBlock).join("")}</div>
    ${elsewhere.length ? `<h3>다른 칸에서 AI가 다듬은 문장을 고른 글</h3>${elsewhere.map((row) => `${quote(row.chosen, `${row.field} · 참여자가 고른 글`)}${quote(row.written, `${row.field} · 처음 쓴 글`)}`).join("")}` : ""}
    ${narratives.length ? `<h3>다른 칸에 나타나지 않은 서술</h3>${narratives.map((item) => quote(item.text, item.field)).join("")}` : ""}
    ${approvedBlock}`;
}

function renderOffer(sheet) {
  const runs = sheet.offerRuns;
  const okRuns = runs.filter((row) => text(row.status) === "success").length;
  const runLine = runs.length
    ? `AI 실행 ${runs.length}회${okRuns !== runs.length ? ` · 정상 ${okRuns}` : ""}${runs.at(-1)?.model ? ` · ${text(runs.at(-1).model)}` : ""}${runs.at(-1)?.latency_ms ? ` · ${(Number(runs.at(-1).latency_ms) / 1000).toFixed(1)}초` : ""}`
    : "";
  if (sheet.offer?.text) {
    return `<div class="person-offer">${summaryParagraphsOf(sheet.offer.text).map((part) => `<p>${esc(part)}</p>`).join("")}</div>
      ${sheet.offer.evidence.length ? `<h3>근거로 삼은 참여자 문장</h3><ul class="person-evidence">${sheet.offer.evidence.map((item) => `<li><q>${esc(item)}</q></li>`).join("")}</ul>` : ""}
      <p class="person-note">${esc([sheet.offer.source ? `출처 ${sheet.offer.source}` : "", sheet.offer.provider, runLine].filter(Boolean).join(" · ") || "출처 미기록")} · 참여 기록(PDF)에는 싣지 않고 완료 화면의 창으로만 건넨 글이에요.</p>`;
  }
  const attempts = sheet.offerAttempts;
  const reason = text(sheet.session.status) !== "completed"
    ? "설문을 마치기 전에 멈춘 응답이라 제안문을 청하지 않았어요."
    : attempts.length ? "청했지만 받지 못했어요." : "제안문 기록이 없어요. 못 받은 기록은 r70(2026-09-23)부터 남아요.";
  return `${empty(reason)}${attempts.length ? `<ul class="person-attempts">${attempts.map((item) => `<li>${esc(when(item?.at))} · ${esc(text(item?.error_code) || text(item?.status) || "이유 미기록")}${item?.provider ? ` · ${esc(item.provider)}` : ""}</li>`).join("")}</ul>` : ""}${runLine ? `<p class="person-note">${esc(runLine)}</p>` : ""}`;
}

function renderDocument(sheet) {
  const code = sheet.record.participantCode;
  const research = `<button type="button" class="secondary-button" data-admin-action="print-person-record">연구용 기록 한 장</button>`;
  if (!sheet.document) {
    return `${empty("최종 문서가 없어요. 활용 범위를 확인하기 전에 멈춘 응답이에요.")}<div class="person-actions">${research}</div><p class="person-note">연구용 기록은 이 사람의 답·이어진 질문·좌표·동의를 한 장에 모은 문서예요.</p>`;
  }
  const language = text(sheet.document.display_language || sheet.document.source_language);
  const facts = [
    ["참여 기록 코드", code],
    ["확정", when(sheet.confirmedAt) || (text(sheet.document.status) === "confirmed" ? "확정됨" : "초안")],
    ["문서 언어", language],
  ].filter(([, value]) => value);
  return `<dl class="person-facts">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>
    <div class="person-actions"><button type="button" class="primary-button" data-admin-action="print-person-document">참여자가 받은 PDF 열기</button>${research}</div>
    <p class="person-note">${sheet.documentFromDraft ? "제출본 문서가 없어 활용 범위 화면에서 만든 초안으로 그려요. " : "참여자가 완료 화면에서 인쇄·저장한 문서와 같은 것이에요. "}새 창에서 인쇄 창이 뜨면 「PDF로 저장」을 고르세요. 파일 이름은 참여 기록 코드예요.</p>
    <details class="person-preview"><summary>이 화면에서 펼쳐 보기</summary><div class="response-document-preview">${renderResponseDocument(sheet.document)}</div></details>`;
}

function senderFace(greeting) {
  const visibility = text(greeting.sender_visibility);
  const label = text(greeting.sender_public_context?.display_label);
  // relay.js: 받는 사람 화면에는 NAMED 이고 표기가 있을 때만 보낸 사람이 나온다. 역할 문장은 어떤 경우에도 그리지 않는다.
  return visibility === "NAMED" && label ? `받는 사람에게 「${label}」로 보여요` : "받는 사람에게 보낸 사람 표기 없이 보여요";
}

function renderGreetingsWritten(sheet) {
  if (!sheet.sent.length) {
    return empty(text(sheet.session.status) === "completed" ? "안부를 남기지 않았어요." : "설문을 마치기 전이라 안부 단계에 닿지 않았어요.");
  }
  return sheet.sent.map((greeting) => {
    const where = text(greeting.origin) === "core_seed"
      ? "프로젝트가 준비한 안부"
      : text(greeting.idempotency_key).startsWith("reply:") ? "받은 안부를 읽고 편지함에서 이어 씀" : "설문을 마친 뒤 남김";
    const choice = SENDER_VISIBILITY_CHOICE[text(greeting.sender_visibility)];
    return `<div class="person-greeting">
      <p class="person-greeting-head"><strong>${esc(where)}</strong><span>${esc(when(greeting.created_at))}</span></p>
      ${quote(greeting.original_text, `원문 · ${text(greeting.original_language) || "언어 미기록"}`)}
      ${text(greeting.translated_text) ? quote(greeting.translated_text, `번역 · ${text(greeting.translated_language)}`) : ""}
      <dl class="person-facts"><div><dt>고른 표기</dt><dd>${esc(choice ? `「${choice}」` : "기록 없음(익명으로 다룸)")}</dd></div><div><dt>보이는 모습</dt><dd>${esc(senderFace(greeting))}</dd></div><div><dt>지금</dt><dd>${esc(GREETING_STATUS_LABEL[text(greeting.status)] || text(greeting.status))}</dd></div></dl>
    </div>`;
  }).join("");
}

function reasonBlock(greeting) {
  const reason = greeting.connection_reason_snapshot || {};
  const how = SELECTION_LABEL[text(reason.selection_method)] || SELECTION_LABEL[text(reason.summary_key)] || "";
  const evidence = array(reason.evidence).map((item) => (typeof item === "string" ? text(item) : text(item?.text))).filter(Boolean);
  if (!text(reason.summary) && !how) return "";
  return `<div class="person-reason"><span>닿은 이유${how ? ` · ${esc(how)}` : ""}</span>${text(reason.summary) ? `<p>${esc(reason.summary)}</p>` : ""}${evidence.length ? `<ul>${evidence.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}</div>`;
}

const deliveryTimes = (greeting) => [
  ["전달", greeting.delivered_at], ["열어 봄", greeting.opened_at], ["이어 씀", greeting.replied_at], ["넘김", greeting.passed_at],
].filter(([, value]) => text(value)).map(([label, value]) => `${label} ${when(value)}`).join(" · ");

function renderRoutes(sheet, people, known) {
  const sent = sheet.sent.map((greeting) => {
    const to = text(greeting.receiver_record_id)
      ? personLink(greeting.receiver_record_id, people, known)
      : `<span class="person-link is-plain">아직 받을 사람을 기다려요</span>`;
    return `<div class="person-route"><p class="person-route-line"><span class="person-arrow">이 사람 →</span>${to}<span class="person-route-status">${esc(GREETING_STATUS_LABEL[text(greeting.status)] || text(greeting.status))}</span></p><p class="person-note">${esc([`남김 ${when(greeting.created_at)}`, deliveryTimes(greeting)].filter(Boolean).join(" · "))}</p>${reasonBlock(greeting)}</div>`;
  }).join("");
  const received = sheet.received.map((greeting) => {
    const from = text(greeting.origin) === "core_seed"
      ? `<span class="person-link is-plain">프로젝트가 준비한 첫 안부</span>`
      : personLink(greeting.sender_record_id, people, known);
    return `<div class="person-route"><p class="person-route-line">${from}<span class="person-arrow">→ 이 사람</span><span class="person-route-status">${esc(GREETING_STATUS_LABEL[text(greeting.status)] || text(greeting.status))}</span></p>${quote(greeting.original_text, `받은 글 · ${text(greeting.original_language) || "언어 미기록"}`)}<p class="person-note">${esc(deliveryTimes(greeting) || "시각 미기록")}</p>${reasonBlock(greeting)}</div>`;
  }).join("");
  return `<h3>이 사람이 쓴 안부가 간 곳 <span>${sheet.sent.length}</span></h3>${sent || empty("보낸 안부가 없어요.")}
    <h3>이 사람이 받은 안부 <span>${sheet.received.length}</span></h3>${received || empty("받은 안부가 없어요.")}`;
}

/**
 * 한 사람의 장. `people` 은 buildPeopleIndex 결과, `known` 은 지금 목록에 있는 응답 ID 모음이다.
 * @returns {string}
 */
export function renderPersonSheet(sheet, { people = new Map(), known = new Set() } = {}) {
  const record = sheet.record;
  const person = people.get(sheet.responseId);
  const name = record.displayLabel?.label || person?.name || "익명";
  const code = record.participantCode || person?.code || "";
  const followupCount = record.followups.rows.length;
  const polishedCount = array(record.polish).filter((row) => row.usedPolished).length;
  const answersMeta = `${record.answers.rows.length}문항${followupCount ? ` · 이어진 질문 ${followupCount}` : ""}${polishedCount ? ` · AI가 다듬은 칸 ${polishedCount}` : ""}`;
  const delivered = sheet.sent.filter(isDelivered).length;
  const receivedCount = sheet.received.filter(isDelivered).length;
  const toc = [
    ["answers", "1", "답변", answersMeta],
    ["offer", "2", "제안문", sheet.offer?.text ? "받음" : "없음"],
    ["document", "3", "최종 PDF", sheet.document ? "있음" : "없음"],
    ["written", "4", "남긴 안부", sheet.sent.length ? `${sheet.sent.length}통` : "없음"],
    ["routes", "5", "오간 길", `보냄 ${delivered} · 받음 ${receivedCount}`],
  ];
  const facts = [
    ["표본", SAMPLE_LABELS[text(sheet.session.sample_type)] || text(sheet.session.sample_type)],
    ["시작 경로", routeLabel(record.route)],
    ["진행", sessionStatusLabel(sheet.session.status)],
    ["응답 시각", when(record.submittedAt)],
    ["작성 언어", record.languages.source],
    ["응답 ID", sheet.responseId],
  ].filter(([, value]) => text(value));
  return `<header class="person-head">
      <div class="dashboard-kicker">한 사람의 기록${code ? ` · ${esc(code)}` : ""}</div>
      <h1>${esc(name)}${record.displayLabel?.provided ? ` <small>${esc(record.displayLabel.modeLabel)}</small>` : ""}</h1>
      <dl class="person-facts">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>
      <nav class="person-toc" aria-label="이 사람의 기록 차례">${toc.map(([id, no, title, meta]) => `<button type="button" data-person-jump="person-${id}"><span aria-hidden="true">${no}</span>${esc(title)}<small>${esc(meta)}</small></button>`).join("")}</nav>
    </header>
    ${section("1", "answers", "어떤 답변을 했나", answersMeta, renderAnswers(sheet))}
    ${section("2", "offer", "어떤 제안문을 받았나", sheet.offer?.text ? "받음" : "없음", renderOffer(sheet))}
    ${section("3", "document", "최종 PDF", sheet.document ? "있음" : "없음", renderDocument(sheet))}
    ${section("4", "written", "안부를 어떻게 남겼나", sheet.sent.length ? `${sheet.sent.length}통` : "없음", renderGreetingsWritten(sheet))}
    ${section("5", "routes", "누구의 안부가 누구에게 갔나", `보냄 ${delivered} · 받음 ${receivedCount}`, renderRoutes(sheet, people, known))}`;
}

// ── 인쇄 창 ────────────────────────────────────────────────────────────────
// 참여자 화면과 같은 스타일시트로 같은 문서를 그린다. 인쇄 규칙(styles.css)이
// `.response-document-final` 만 남기므로 참여자가 받은 종이와 같은 모양이 나온다.
export function responseDocumentPrintHtml(document, { stylesheets = [], title = "" } = {}) {
  return `<!doctype html><html lang="${esc(text(document?.display_language) || "ko")}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex, nofollow, noarchive" /><title>${esc(title)}</title>${array(stylesheets).map((href) => `<link rel="stylesheet" href="${esc(href)}" />`).join("")}</head><body data-edition="rc2"><main class="rc2-complete response-document-complete"><section class="rc2-complete-main"><div class="response-document-preview response-document-final">${renderResponseDocument(document || {})}</div></section></main></body></html>`;
}

// 연구용 한 장. 묶음 내보내기와 같은 문서 형식을 한 사람분으로만 만든다.
export function personRecordPrintHtml({ session = {}, snapshots = [], revision = null, consentEvents = [] } = {}) {
  const bundle = buildRecordBundle(
    { sessions: [session], snapshots, revisions: revision ? [revision] : [], consentEvents },
    { sampleTypes: [text(session.sample_type) || "research"] },
  );
  return renderRecordBundleHtml(bundle);
}
