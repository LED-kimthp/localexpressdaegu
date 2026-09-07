import { VERDICT_COPY, aiHealthSummary } from "./ai-health.js";
import { SAMPLE_LABELS, buildRecordBundle, collectSnapshots, recordBundleFilename, renderRecordBundleHtml } from "./record-export.js";
import { CODED_QUESTIONS, CONTEXT_PROVENANCE_SELECT, LABELS, NARRATIVE_QUESTION_IDS, PROFILE_FIELDS, READABILITY_COPY, RESEARCH_FRAME_COPY, narrativeLengths, researchInsights } from "./research-insights.js";

const root = document.querySelector("#admin-root");
const supabaseUrl = String(window.OVER39_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = String(window.OVER39_SUPABASE_ANON_KEY || "");
const relayEndpoint = String(window.OVER39_SUPABASE_RELAY_URL || "");
const isRc2Admin = document.body.dataset.edition === "rc2-admin";
const sessionKey = "over39-rc1-admin-session";
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
let state = { session: null, sessions: [], sessionsTotal: null, selected: null, detail: null, status: "loading", filter: "all", error: "", relayResult: null, relayError: "", view: "responses", aiRuns: null, aiRunsError: "", insights: null, insightsError: "", insightsNote: "", insightsIncludeTest: false, exportStatus: "", exportBusy: false, care: null, careError: "", careStatus: "", careLink: null };

// 매직링크가 돌아올 주소. 토큰은 프래그먼트로 오므로 `#`을, 표본 쿼리가 붙은 채 열렸을
// 수도 있으므로 `?`를 함께 떼어 이 화면의 정확한 경로만 남긴다.
const adminRedirectUrl = () => `${location.origin}${location.pathname}`;

function loadSession() { try { return JSON.parse(sessionStorage.getItem(sessionKey) || "null"); } catch { return null; } }
function saveSession(session) { state.session = session; sessionStorage.setItem(sessionKey, JSON.stringify(session)); }
function clearSession() { state.session = null; sessionStorage.removeItem(sessionKey); }

function captureAuthCallback() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  if (!accessToken) return;
  saveSession({ access_token: accessToken, refresh_token: params.get("refresh_token"), expires_at: Date.now() + Number(params.get("expires_in") || 3600) * 1000 });
  history.replaceState({}, "", location.pathname);
}

async function api(table, query = "", { withCount = false } = {}) {
  const headers = { apikey: anonKey, Authorization: `Bearer ${state.session.access_token}` };
  // `Prefer: count=exact`를 붙이면 PostgREST가 RLS 적용 뒤의 전체 행 수를 Content-Range에
  // 담아 준다(`0-499/1234`). 행을 더 받지 않고 잘림을 알 수 있는 유일한 값이고, Supabase는
  // 이 헤더를 Access-Control-Expose-Headers에 넣어 두어 브라우저에서 읽을 수 있다.
  // 라이브 확인: `access-control-expose-headers: ... Content-Range ...`
  if (withCount) headers.Prefer = "count=exact";
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, { headers });
  if (response.status === 401 || response.status === 403) throw new Error("ADMIN_ACCESS_DENIED");
  if (!response.ok) throw new Error(`ADMIN_HTTP_${response.status}`);
  const rows = await response.json();
  if (!withCount) return rows;
  const total = Number(String(response.headers.get("content-range") || "").split("/")[1]);
  return Object.assign(rows, { total: Number.isFinite(total) ? total : null });
}

async function verifyAdmin() {
  const rows = await api("over39_admins", "?select=user_id&limit=1");
  if (!rows.length) throw new Error("ADMIN_NOT_REGISTERED");
}

// 목록은 최근 순으로 이만큼만 받는다. 상한을 없애는 대신 잘렸다는 사실을 화면에 쓴다.
const SESSION_LIST_LIMIT = 500;

async function loadSessions() {
  await verifyAdmin();
  const rows = await api("over39_sessions", `?select=*&order=updated_at.desc&limit=${SESSION_LIST_LIMIT}`, { withCount: true });
  state.sessions = rows;
  state.sessionsTotal = rows.total;
  state.status = "ready";
  render();
}

async function loadAiRuns() {
  state.view = "ai-health";
  state.aiRunsError = "";
  render();
  try {
    // Only the columns the summary reads, newest first. `output_raw` carries upstream_attempts.
    state.aiRuns = await api("over39_ai_runs", "?select=response_id,operation,status,source,latency_ms,http_status,error_code,output_raw,started_at&order=started_at.desc&limit=2000");
  } catch (error) {
    state.aiRuns = [];
    state.aiRunsError = error.message === "ADMIN_ACCESS_DENIED" ? "이 계정으로는 AI 실행 기록을 볼 수 없습니다." : "AI 실행 기록을 불러오지 못했습니다.";
  }
  render();
}

// 역할·연령·활동형태·기억 모듈 필드는 전용 컬럼이 없어 스냅샷 payload.answers 안에만 있다.
// 코드형 값만 골라 뽑으면 자유서술과 연락처는 브라우저까지 오지 않는다.
// 역할 provenance(`legacy_role_source` 등)는 `payload.participant_context` 아래에 있다.
// `payload->answers` 규칙으로 감싸면 값이 전부 null이 되어, 참여자가 확정한 역할과
// Context가 추정한 후보가 구분되지 않은 채 섞인다. 연구 프레임워크가 명시적으로 막은
// 지점이라 경로가 다른 별칭을 따로 붙인다.
const PROFILE_SELECT = ["response_id", ...PROFILE_FIELDS.map((field) => `${field}:payload->answers->>${field}`), ...CONTEXT_PROVENANCE_SELECT].join(",");
const INSIGHT_ROW_LIMIT = 20000;

async function loadResearchInsights() {
  state.view = "research-insights";
  state.insightsError = "";
  state.insightsNote = "";
  render();
  try {
    const codedIds = Object.keys(CODED_QUESTIONS).join(",");
    // 단발 `limit=20000`은 서버의 Max rows(호스팅 기본 1,000)에 조용히 잘린다 — 오류
    // 없이 일부 표본만 세게 된다. 내보내기와 같은 페이지네이션으로 전량을 받는다.
    const [sessions, codedAnswers, narrativeRows, profiles, axes] = await Promise.all([
      fetchAllRows("over39_sessions", { select: "response_id,sample_type,status,include_in_policy_statistics,route" }),
      fetchAllRows("over39_fixed_answers", { select: "response_id,question_id,answer,created_at", extra: `&question_id=in.(${codedIds})` }),
      fetchAllRows("over39_fixed_answers", { select: "response_id,question_id,answer,created_at", extra: `&question_id=in.(${NARRATIVE_QUESTION_IDS.join(",")})` }),
      // 좌표는 status(complete / mixed / pending_review / insufficient)를 구분해야 한다.
      // 이 표를 읽지 않으면 집계 모듈이 좌표 블록을 만들지 않는다 — status 구분 없는
      // 합산을 만들지 않으려는 설계이므로, 읽어서 넘기는 것이 배선의 몫이다.
      fetchAllRows("over39_response_snapshots", { select: PROFILE_SELECT, orderKey: "created_at.asc,id.asc" }).catch(() => []),
      fetchAllRows("over39_axis_snapshots", { select: "response_id,stage,status,m_primary,s_primary,d_primary,coordinate_number,coordinate_candidate,created_at" }).catch(() => []),
    ]);
    const truncated = [sessions, codedAnswers, narrativeRows, profiles, axes].some((rows) => rows.truncated);
    if (truncated) state.insightsNote = "자료가 안전 상한에서 잘렸습니다. 아래 숫자는 일부 표본 기준입니다.";
    // 원문은 여기서 길이로 바뀌고 버려진다. state에는 글자 수만 남는다.
    state.insights = { sessions, codedAnswers, narratives: narrativeLengths(narrativeRows), profiles, axes };
  } catch (error) {
    state.insights = null;
    state.insightsError = error.message === "ADMIN_ACCESS_DENIED" ? "이 계정으로는 연구 지표를 볼 수 없습니다." : "연구 지표를 불러오지 못했습니다.";
  }
  render();
}

// ── 철회·알림 관리 (TK 결정 2026-08-30) ─────────────────────────────────────
async function relayAdminCall(action, payload = {}) {
  if (!relayEndpoint) throw new Error("RELAY_NOT_CONFIGURED");
  const response = await fetch(relayEndpoint, { method: "POST", headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${state.session.access_token}` }, body: JSON.stringify({ action, ...payload }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error_code || "RELAY_ADMIN_CALL_FAILED");
  return result;
}

async function loadCare() {
  state.view = "care";
  state.careError = "";
  render();
  try {
    const withdrawals = await api("over39_withdrawal_requests", "?select=*&order=requested_at.desc&limit=200");
    let notifications = null;
    let notificationsError = "";
    try {
      const digest = await relayAdminCall("admin_notification_digest");
      notifications = digest.rows || [];
    } catch (error) {
      notificationsError = error.message === "UNKNOWN_ACTION"
        ? "알림 현황은 중계 기능(over39-relay) 새 버전을 배포한 뒤에 보입니다."
        : "알림 현황을 불러오지 못했습니다.";
    }
    state.care = { withdrawals, notifications, notificationsError };
  } catch {
    state.care = null;
    state.careError = "철회 요청 목록을 불러오지 못했습니다. 관리자 권한을 확인해 주세요.";
  }
  render();
}

function careTime(value) { return value ? String(value).slice(0, 16).replace("T", " ") : ""; }

function renderCare() {
  if (state.careError) return `<section class="admin-detail-section"><h2>철회·알림 관리</h2><p class="error">${esc(state.careError)}</p></section>`;
  if (!state.care) return `<section class="admin-detail-section"><h2>철회·알림 관리</h2><p>불러오는 중입니다.</p></section>`;
  const withdrawals = state.care.withdrawals || [];
  const openCount = withdrawals.filter((row) => !row.resolved_at).length;
  const withdrawalRows = withdrawals.map((row) => `<tr><th scope="row">${esc(row.response_id)}</th><td>${esc(careTime(row.requested_at))}</td><td>${esc(row.research_status || "requested")}</td><td>${row.resolved_at ? `처리 완료 · ${esc(careTime(row.resolved_at))}` : `<button class="secondary-button" data-admin-action="care-resolve" data-response-id="${esc(row.response_id)}">처리 완료로 표시</button>`}</td></tr>`).join("");
  const notifications = state.care.notifications || [];
  const pendingCount = notifications.filter((row) => row.pending).length;
  const notificationRows = notifications.map((row) => `<tr><th scope="row">${esc(row.email)}</th><td>${esc(row.response_id)}</td><td>${esc(row.status)}</td><td>${row.pending ? `새 안부 ${esc(String(row.pending))}건` : "—"}</td><td>${esc(careTime(row.notified_at) || "아직 없음")}</td><td><button class="secondary-button" data-admin-action="care-send-mail" data-response-id="${esc(row.response_id)}" ${row.pending ? "" : "disabled"}>알림 메일 보내기</button> <button class="secondary-button" data-admin-action="care-mint-link" data-response-id="${esc(row.response_id)}" ${row.pending ? "" : "disabled"}>메일용 링크</button> <button class="secondary-button" data-admin-action="care-mark-sent" data-response-id="${esc(row.response_id)}">보냄 표시</button></td></tr>`).join("");
  return `<section class="admin-detail-section"><h2>철회 요청 <span>${openCount}건 미처리</span></h2>
    <p>철회를 접수하면 그 순간부터 이 참여자에게는 안부가 전달되지 않습니다. 응답 자료는 자동으로 지워지지 않습니다 — 어디까지 지울지는 사람이 정합니다. 정리를 마친 뒤 「처리 완료로 표시」를 누르세요. <strong>처리 완료로 표시하면 안부 차단이 풀립니다.</strong></p>
    <label for="care-withdraw-id">철회 접수 · 응답 ID</label>
    <input id="care-withdraw-id" class="text-input text-input-single" placeholder="예: RC2-…" />
    <button class="secondary-button" data-admin-action="care-withdraw-record">철회 접수하기</button>
    ${state.careStatus ? `<p class="ai-health-note" role="status">${esc(state.careStatus)}</p>` : ""}
    <table class="ai-health-table"><thead><tr><th scope="col">응답 ID</th><th scope="col">요청 시각</th><th scope="col">상태</th><th scope="col">처리</th></tr></thead><tbody>${withdrawalRows || `<tr><td colspan="4">철회 요청 없음</td></tr>`}</tbody></table>
  </section>
  <section class="admin-detail-section"><h2>안부 알림 <span>${pendingCount}명 대기</span></h2>
    <p>참여자가 남긴 알림용 이메일과, 마지막 알림 이후 도착해 아직 열리지 않은 안부 수입니다. 「메일용 링크」로 새 편지함 링크를 만들어 알림 메일에 붙이고, 보낸 뒤 「보냄 표시」를 누르세요. 이메일은 이 화면과 발송 계정 밖으로 나가지 않습니다.</p>
    ${state.care.notificationsError ? `<p class="error">${esc(state.care.notificationsError)}</p>` : `<table class="ai-health-table"><thead><tr><th scope="col">이메일</th><th scope="col">응답 ID</th><th scope="col">상태</th><th scope="col">대기</th><th scope="col">마지막 알림</th><th scope="col">동작</th></tr></thead><tbody>${notificationRows || `<tr><td colspan="6">알림 신청 없음</td></tr>`}</tbody></table>`}
    ${state.careLink ? `<p class="admin-relay-link">메일용 링크 (${esc(state.careLink.response_id)}): <a href="${esc(state.careLink.url)}" target="_blank" rel="noreferrer">${esc(state.careLink.url)}</a></p>` : ""}
  </section>`;
}

async function loadDetail(responseId) {
  state.selected = responseId;
  state.detail = null;
  state.relayResult = null;
  state.relayError = "";
  render();
  const tables = ["over39_fixed_answers", "over39_axis_snapshots", "over39_depth_questions", "over39_depth_answers", "over39_ai_runs", "over39_participant_revisions", "over39_consent_events", "over39_connection_profiles", "over39_institution_feedback", "over39_operational_events"];
  const results = await Promise.all(tables.map((table) => api(table, `?select=*&response_id=eq.${encodeURIComponent(responseId)}`).catch(() => [])));
  state.detail = Object.fromEntries(tables.map((table, index) => [table, results[index]]));
  render();
}

// 허용목록에 없는 `redirect_to`는 GoTrue가 오류로 돌려주지 않는다. 조용히 Site URL로
// 갈아치우고 메일은 정상 발송한다. 그러니 "보냈습니다"만 쓰면 연구자는 링크를 눌러
// 엉뚱한 페이지가 열린 뒤에도 무엇이 잘못됐는지 알 수 없다. 돌아올 주소를 함께 적는다.
function otpSentMessage(redirectTo) {
  return `로그인 링크를 보냈습니다. 이메일을 확인해 주세요. 링크는 ${redirectTo} 로 돌아옵니다. 다른 주소가 열리면 Supabase의 Authentication → URL Configuration → Redirect URLs에 이 주소가 등록되지 않은 것입니다.`;
}

// 링크가 오지 않는 이유는 대개 이 화면 밖에 있다(메일 발송 한도, 이메일 제공자 미설정,
// 회원가입 차단). 이유를 감추면 연구자가 혼자 원인을 찾을 수 없으므로 응답을 그대로 옮긴다.
async function otpFailureMessage(response) {
  const body = await response.json().catch(() => null);
  const reason = body?.msg || body?.message || body?.error_description || body?.error || "";
  const parts = [`HTTP ${response.status}`, body?.error_code, reason].filter(Boolean);
  const hint = response.status === 429 ? " 메일 발송 한도에 걸렸습니다. 잠시 뒤에 다시 시도해 주세요." : "";
  return `로그인 링크를 보내지 못했습니다 (${parts.join(" · ")}).${hint}`;
}

function renderLogin() {
  const configured = Boolean(supabaseUrl && anonKey);
  return `<main class="admin-login"><div class="archive-label">OVER39 · RC1 ADMIN</div><h1>연구자 확인</h1><p>${configured ? "등록된 관리자 이메일로 일회용 로그인 링크를 받습니다." : "Supabase URL과 anon key가 아직 설정되지 않았습니다."}</p>${configured ? `<label for="admin-email">관리자 이메일</label><input id="admin-email" type="email" class="text-input text-input-single" placeholder="research@example.com" /><button class="primary-button" data-admin-action="login">로그인 링크 받기</button><p class="ai-health-note" style="margin:12px 0 0;">이 주소가 Supabase의 Authentication → URL Configuration → Redirect URLs에 등록되어 있어야 링크가 이 화면으로 돌아옵니다: <code>${esc(adminRedirectUrl())}</code></p>` : ""}${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}</main>`;
}

function statusLabel(item) { return item.status === "completed" ? "완료" : item.status === "in_progress" ? "중단·진행 중" : item.status; }
function sessionRows() {
  return state.sessions.filter((item) => state.filter === "all" || item.sample_type === state.filter);
}

function listCard(item) {
  return `<button class="dashboard-profile ${state.selected === item.response_id ? "selected" : ""}" data-response-id="${esc(item.response_id)}"><div><span>${esc(item.sample_type)}</span><strong>${esc(item.institution_code || "DIRECT")}</strong></div><p>${esc(item.route || "경로 미선택")} · ${esc(statusLabel(item))}</p><small>${esc(new Date(item.updated_at).toLocaleString("ko-KR"))}</small></button>`;
}

function detailSection(title, rows, renderer) {
  return `<section class="admin-detail-section"><h2>${esc(title)} <span>${rows.length}</span></h2>${rows.length ? rows.map(renderer).join("") : "<p>기록 없음</p>"}</section>`;
}

function relayComposer() {
  if (!isRc2Admin || !state.selected) return "";
  return `<section class="admin-detail-section relay-composer"><h2>익명 안부 중계</h2><p>연구자가 직접 상대 응답을 확인한 뒤, 안부나 질문을 익명 링크로 전달합니다. 연락처와 이름은 이 화면에 표시하지 않습니다.</p><label for="relay-target">받는 응답 ID</label><input id="relay-target" class="text-input text-input-single" placeholder="상대 응답 ID" /><label for="relay-message">전할 안부 또는 질문</label><textarea id="relay-message" class="text-input" maxlength="1400" placeholder="연구팀을 통해 전할 짧은 안부나 질문을 적어 주세요."></textarea><label for="relay-reason">연결을 살펴본 이유 (운영 기록)</label><input id="relay-reason" class="text-input text-input-single" maxlength="1200" placeholder="예: 서로 다른 지역에서 비슷한 조건을 이야기했습니다." /><button class="primary-button" data-admin-action="prepare-relay">익명 전달 링크 만들기</button>${state.relayError ? `<p class="error">${esc(state.relayError)}</p>` : ""}${state.relayResult ? `<p class="admin-relay-link">전달용 링크: <a href="${esc(state.relayResult)}" target="_blank" rel="noreferrer">${esc(state.relayResult)}</a></p>` : ""}</section>`;
}

function renderDetail() {
  if (!state.selected) return `<div class="empty-match">왼쪽에서 응답을 선택해 주세요.</div>`;
  if (!state.detail) return `<div class="empty-match">응답 기록을 불러오는 중입니다.</div>`;
  const d = state.detail;
  return `<div class="dashboard-kicker">RESPONSE TRACE · ${esc(state.selected)}</div>
    ${detailSection("고정질문 원문과 기여", d.over39_fixed_answers, (row) => `<article><strong>${esc(row.question_id)} · ${esc(row.axis || "맥락")} · ${esc(row.evidence_level || "context")}</strong><p>${esc(JSON.stringify(row.answer))}</p></article>`)}
    ${detailSection("좌표 스냅샷", d.over39_axis_snapshots, (row) => `<article><strong>${esc(row.stage)} · ${esc(row.status)}</strong><p>${esc(row.coordinate_scope || "범위 미기록")} · ${esc([row.m_primary, row.s_primary, row.d_primary].filter(Boolean).join(" · ") || "정보 부족")} ${row.coordinate_candidate ? `· 내부 후보 ${row.coordinate_candidate}` : ""}</p></article>`)}
    ${detailSection("심화질문 3개", d.over39_depth_questions, (row) => `<article><strong>${row.position}. ${esc(row.axis)} · ${esc(row.source)}</strong><p>${esc(row.prompt)}</p><small>의도: ${esc(row.participant_intent)}${row.prompt_version ? ` · ${esc(row.prompt_version)}` : ""}</small></article>`)}
    ${detailSection("심화답변", d.over39_depth_answers, (row) => `<article><strong>${esc(row.axis)} · ${esc(row.selected_value || "건너뜀")}</strong><p>${esc(row.answer_text || "추가 서술 없음")}</p></article>`)}
    ${detailSection("API 실행", d.over39_ai_runs, (row) => `<article><strong>${esc(row.operation)} · ${esc(row.status)} · ${esc(row.model || "fallback")}</strong><p>${row.latency_ms || 0}ms ${row.error_code ? `· ${esc(row.error_code)}` : ""}</p></article>`)}
    ${detailSection("참여자 수정·승인", d.over39_participant_revisions, (row) => `<article><strong>${esc(row.participant_action || "미확인")}</strong><p>${esc(row.participant_approved_text || row.participant_revision || "공개 승인문 없음")}</p></article>`)}
    ${detailSection("동의 이벤트", d.over39_consent_events, (row) => `<article><strong>${esc(row.consent_type)}</strong><p>${row.granted ? "동의" : "동의하지 않음"} · ${esc(row.event_type)}</p></article>`)}
    ${detailSection("관계 참여", d.over39_connection_profiles, (row) => `<article><strong>${row.opted_in ? "연결 대기" : "참여하지 않음"}</strong><p>${esc((row.needs || []).join(" · "))}</p></article>`)}
    ${relayComposer()}
    ${detailSection("기관 피드백", d.over39_institution_feedback, (row) => `<article><p>${esc(JSON.stringify(row.feedback))}</p></article>`)}
    ${detailSection("오류·운영 로그", d.over39_operational_events, (row) => `<article><strong>${esc(row.event_type)} · ${esc(row.severity)}</strong><p>${esc(JSON.stringify(row.details))}</p></article>`)}`;
}

const OPERATION_LABEL = { anchor_followup: "후속 질문", summarize_adaptive: "참여 기록 정리" };
const GRADE_LABEL = { ok: "정상", warn: "확인 필요", stop: "보류", unknown: "자료 부족" };

function pct(value) { return `${(value * 100).toFixed(1)}%`; }
function secs(value) { return Number.isFinite(value) ? `${(value / 1000).toFixed(1)}초` : "—"; }

function aiHealthRow(name, stats) {
  return `<tr class="ai-health-grade-${esc(stats.grade)}">
    <th scope="row">${esc(OPERATION_LABEL[name] || name)}</th>
    <td>${stats.total}</td>
    <td>${stats.delivered}</td>
    <td>${stats.degraded + stats.failed}</td>
    <td>${stats.total ? pct(stats.missRate) : "—"}</td>
    <td>${secs(stats.latencyP50)}</td>
    <td>${secs(stats.latencyP95)}</td>
    <td><span class="ai-health-badge">${esc(GRADE_LABEL[stats.grade])}</span></td>
  </tr>`;
}

function renderAiHealth() {
  if (state.aiRunsError) return `<section class="detail-section"><h2>AI 운영 지표</h2><p>${esc(state.aiRunsError)}</p></section>`;
  if (!state.aiRuns) return `<section class="detail-section"><h2>AI 운영 지표</h2><p>불러오는 중입니다.</p></section>`;
  const summary = aiHealthSummary(state.aiRuns);
  const errors = summary.errorCodes.slice(0, 6);
  return `<section class="detail-section ai-health">
    <h2>AI 운영 지표</h2>
    <p class="ai-health-verdict ai-health-grade-${esc(summary.verdict)}">${esc(VERDICT_COPY[summary.verdict])}</p>
    <p class="ai-health-note">참여자가 받아야 할 질문이나 정리를 받지 못한 경우를 셉니다. 실패해도 참여자 화면에는 오류가 보이지 않으므로, 배포를 넓히기 전에 이 숫자로 판단해 주세요.</p>
    <dl class="ai-health-totals">
      <div><dt>참여자</dt><dd>${summary.participants}명</dd></div>
      <div><dt>AI 호출</dt><dd>${summary.runs}회</dd></div>
      <div><dt>1인당</dt><dd>${summary.callsPerParticipant.toFixed(1)}회</dd></div>
      <div class="ai-health-grade-${esc(summary.rateLimitedGrade)}"><dt>호출 한도 초과</dt><dd>${summary.rateLimited}회 · ${summary.runs ? pct(summary.rateLimitedRate) : "—"}</dd></div>
      <div><dt>재시도로 살린 호출</dt><dd>${summary.retried}회</dd></div>
    </dl>
    <table class="ai-health-table">
      <thead><tr><th scope="col">단계</th><th scope="col">호출</th><th scope="col">정상</th><th scope="col">못 받음</th><th scope="col">비율</th><th scope="col">중간값</th><th scope="col">상위 5%</th><th scope="col">판정</th></tr></thead>
      <tbody>${Object.entries(summary.byOperation).map(([name, stats]) => aiHealthRow(name, stats)).join("")}</tbody>
    </table>
    ${errors.length ? `<h3>오류 코드</h3><ul class="ai-health-errors">${errors.map((item) => `<li><code>${esc(item.code)}</code> ${item.count}회</li>`).join("")}</ul>` : ""}
    <p class="ai-health-note">최근 2,000건 기준입니다.</p>
  </section>`;
}

const insightLabel = (field, code) => LABELS[field]?.[code] || code;
// 경로상 그 문항을 받지 않은 응답은 "고르지 않은" 것이 아니다.
const PROFILE_MISSING_NOTE = (count) => `이 필드가 비어 있는 응답 ${count}건(경로상 묻지 않았거나 스냅샷에 없음)은 분모에서 제외했습니다.`;
// D1~D4의 뜻이 고정된 범위에서는 축 이름을, 역할 범위에서는 코드만 쓴다.
const dAxisField = (scope) => (LABELS[`d_axis_${scope}`] ? `d_axis_${scope}` : "d_axis");
const countCell = (count) => `<td>${count || `<span aria-label="0">·</span>`}</td>`;
// 표본이 작을 때는 비율 칸을 아예 비운다. 숫자가 보이면 경향으로 읽힌다.
const shareCell = (value, readable) => `<td>${readable === "shares" ? pct(value) : "—"}</td>`;

function insightHeading(title, answered, note = "") {
  return `<h3 style="margin:26px 0 6px;font-size:15px;">${esc(title)} <span style="color:var(--muted);font-weight:400;font-size:12px;">응답 ${answered}건</span></h3>${note ? `<p class="ai-health-note" style="margin-bottom:10px;">${esc(note)}</p>` : ""}`;
}

// missingNote는 분모에서 빠진 응답이 왜 빠졌는지 설명한다. 문항을 보고도 고르지 않은 것과
// 경로상 그 문항을 받지 않은 것은 다른 사실이므로 표마다 문구를 다르게 넘긴다.
function insightTable(title, dist, field, readable, { note = "", column = "선택", missingNote = (count) => `이 문항이 열렸지만 아무것도 고르지 않은 응답 ${count}건은 분모에서 제외했습니다.` } = {}) {
  if (!dist.answered) return `${insightHeading(title, 0)}<p class="ai-health-note">아직 이 문항에 답한 응답이 없습니다.</p>`;
  return `${insightHeading(title, dist.answered, note)}
    <table class="ai-health-table"><thead><tr><th scope="col">${esc(column)}</th><th scope="col">응답</th><th scope="col">비율</th></tr></thead>
    <tbody>${dist.rows.map((row) => `<tr><th scope="row">${esc(insightLabel(field, row.code))}</th>${countCell(row.count)}${shareCell(row.share, readable)}</tr>`).join("")}</tbody></table>
    ${dist.unanswered && missingNote ? `<p class="ai-health-note">${esc(missingNote(dist.unanswered))}</p>` : ""}`;
}

function insightCrossTable(title, table, rowField, colField, { note = "", focusNote = "" } = {}) {
  if (!table.counted) return `${insightHeading(title, 0)}<p class="ai-health-note">두 문항에 모두 답한 응답이 아직 없습니다.</p>`;
  const focusStyle = "background:var(--surface-soft);font-weight:700;";
  return `${insightHeading(title, table.counted, note)}
    <table class="ai-health-table">
      <thead><tr><th scope="col"></th>${table.columns.map((column) => `<th scope="col">${esc(insightLabel(colField, column.code))}<br /><span style="font-weight:400;">${column.count}</span></th>`).join("")}<th scope="col">합</th></tr></thead>
      <tbody>${table.rows.map((row) => `<tr><th scope="row">${esc(insightLabel(rowField, row.code))}</th>${row.cells.map((cell) => {
        const isFocus = table.focus && table.focus.row === row.code && table.focus.column === cell.code;
        // 색만으로 알리지 않는다. 핵심 칸에는 텍스트 배지를 함께 넣는다.
        return isFocus ? `<td style="${focusStyle}">${cell.count} <span class="ai-health-badge">핵심</span></td>` : countCell(cell.count);
      }).join("")}<td>${row.count}</td></tr>`).join("")}</tbody>
    </table>
    ${table.focus && focusNote ? `<p class="ai-health-note">${esc(focusNote)} 현재 ${table.focus.count}건입니다.</p>` : ""}`;
}

function insightNames(title, names, { note = "", column = "이름" } = {}) {
  const mentions = names.rows.reduce((sum, row) => sum + row.count, 0);
  return `<h3 style="margin:26px 0 6px;font-size:15px;">${esc(title)} <span style="color:var(--muted);font-weight:400;font-size:12px;">언급 ${mentions}회 · 서로 다른 값 ${names.distinct}종</span></h3>${note ? `<p class="ai-health-note" style="margin-bottom:10px;">${esc(note)}</p>` : ""}
    ${names.rows.length ? `<table class="ai-health-table"><thead><tr><th scope="col">${esc(column)}</th><th scope="col">언급</th></tr></thead><tbody>${names.rows.map((row) => `<tr><th scope="row">${esc(row.name)}</th><td>${row.count}</td></tr>`).join("")}</tbody></table>` : `<p class="ai-health-note">${names.minCount}명 이상이 같은 값을 적은 경우가 아직 없습니다.</p>`}
    ${names.withheld ? `<p class="ai-health-note">${names.minCount}명 미만이 적은 값 ${names.withheld}종은 그 문자열이 곧 한 사람을 가리킬 수 있으므로 표시하지 않습니다.</p>` : ""}`;
}

function renderResearchInsights() {
  if (state.insightsError) return `<section class="detail-section"><h2>연구 지표</h2><p>${esc(state.insightsError)}</p></section>`;
  if (!state.insights) return `<section class="detail-section"><h2>연구 지표</h2><p>불러오는 중입니다.</p></section>`;
  const summary = researchInsights(state.insights, { includeTest: state.insightsIncludeTest });
  const readable = summary.readability;
  const sample = summary.sample;
  return `<section class="detail-section ai-health">
    <h2>연구 지표</h2>
    <p class="ai-health-verdict${readable === "shares" ? "" : " ai-health-grade-warn"}">${esc(READABILITY_COPY[readable])}</p>
    <p class="ai-health-note">〈만 39세 이상〉은 누가 살아남았는지를 세는 조사가 아닙니다. 이 화면은 사람의 경로가 보이기 시작하는지를 확인하는 데만 씁니다. 개별 응답의 원문, 이름, 연락처는 여기에 나타나지 않습니다.</p>
    <div style="display:flex;gap:8px;margin:0 0 16px;flex-wrap:wrap;">
      <button class="secondary-button" data-insights-sample="research" aria-pressed="${!state.insightsIncludeTest}" style="${state.insightsIncludeTest ? "" : "border-color:var(--line-dark);font-weight:700;"}">연구 표본만 ${sample.research}</button>
      <button class="secondary-button" data-insights-sample="with-test" aria-pressed="${state.insightsIncludeTest}" style="${state.insightsIncludeTest ? "border-color:var(--line-dark);font-weight:700;" : ""}">테스트 포함 ${sample.research + sample.test}</button>
    </div>
    <dl class="ai-health-totals">
      <div><dt>집계 대상</dt><dd>${sample.counted}건</dd></div>
      <div><dt>완료</dt><dd>${sample.completed}건</dd></div>
      <div><dt>정책 통계 동의</dt><dd>${sample.policyStatistics}건</dd></div>
      <div><dt>제외 · 연구 분석 미동의</dt><dd>${sample.researchExcludedByConsent}건</dd></div>
      <div><dt>제외 · 기관 검토</dt><dd>${sample.institutionReview}건</dd></div>
      <div><dt>제외 · 테스트</dt><dd>${state.insightsIncludeTest ? "포함 중" : `${sample.test}건`}</dd></div>
    </dl>
    <p class="ai-health-note">기관 검토 표본은 어떤 경우에도 연구 지표에 넣지 않습니다. 테스트 표본은 위 토글로만 섞입니다. <strong>「연구 분석에는 포함하지 말아주세요」를 고른 응답은 아래 모든 표에서 빠집니다</strong> — 원문은 그대로 보관되고 집계에서만 빠집니다.</p>

    ${(() => {
      // 이 연구가 가장 경계한 표현이 '경력 단절'이다. P14(제작 상태)와 P15(공개 활동 상태)를
      // 두 축으로 교차하면 "보이지 않는다 = 멈췄다"가 아니라는 명제가 표 하나로 보인다.
      // 특히 `MAKING_NOT_SHOWING` 칸이 그 실증이다.
      const present = summary.presentState;
      if (!present) return "";
      const misread = present.misreadRisk.filter((item) => item.count > 0);
      return `${insightCrossTable("제작 상태 × 공개 활동 상태", present.crossTab, present.rowField, present.colField, { note: RESEARCH_FRAME_COPY.presentState })}
        <p class="ai-health-note">${esc(RESEARCH_FRAME_COPY.invisibleIsNotStopped)} 제작이나 핵심 활동은 이어지지만 공개 활동이 쉬고 있는 응답은 현재 ${present.continuingLowVisibility}건입니다.</p>
        ${misread.length ? `<p class="ai-health-note">${esc(RESEARCH_FRAME_COPY.misread)}</p><ul class="ai-health-note" style="margin:6px 0 0;padding-left:18px;">${misread.map((item) => `<li>${esc(insightLabel(item.field, item.code))} — ${esc(item.note)} (${item.count}건)</li>`).join("")}</ul>` : ""}
        ${insightTable("지속과 가시성을 함께 읽으면", present.reading, present.reading.field, readable, { note: "위 두 축을 하나로 읽은 결과입니다. 한쪽만 답한 응답은 분류하지 않고 따로 셉니다.", column: "지속·가시성", missingNote: (count) => `두 문항 중 한쪽만 답한 응답 ${count}건은 분류하지 않았습니다.` })}
        ${present.byOptionSet.length > 1 ? `<p class="ai-health-note">${esc(RESEARCH_FRAME_COPY.optionSet)}</p>` : ""}`;
    })()}

    ${(() => {
      // 64개 좌표는 사람의 유형이 아니라 이번 기록의 위치다. status를 구분하지 않고
      // 합산하면 확정되지 않은 판단을 확정된 것처럼 보여준다.
      const coordinates = summary.coordinates;
      if (!coordinates) return "";
      if (!coordinates.available) return `${insightHeading("이번 기록의 자리", 0)}<p class="ai-health-note">${esc(RESEARCH_FRAME_COPY.coordinateUnavailable)}</p>`;
      return `${insightTable("이번 기록의 자리 · 확정 상태", coordinates.status, coordinates.status.field, readable, { note: RESEARCH_FRAME_COPY.coordinate, column: "확정 상태", missingNote: null })}
        <p class="ai-health-note">${esc(RESEARCH_FRAME_COPY.coordinateStatus)} 아래 세 축은 <strong>${coordinates.includedStatuses.map((code) => esc(insightLabel(coordinates.status.field, code))).join(" · ")}</strong>만 분모로 씁니다(${coordinates.includedResponses}건). 좌표 번호가 확정된 기록 ${coordinates.numbered}건, 내부 후보만 있는 기록 ${coordinates.candidateOnly}건.</p>
        ${insightTable("남아 있는 의미 (M)", coordinates.axes.m, coordinates.axes.m.field, readable, { column: "방향", missingNote: null })}
        ${insightTable("지금의 흐름 (S)", coordinates.axes.s, coordinates.axes.s.field, readable, { column: "방향", missingNote: null })}
        ${insightTable("이어가기 위해 필요한 조건 (D)", coordinates.axes.d, coordinates.axes.d.field, readable, { column: "방향", missingNote: null })}`;
    })()}

    ${(() => {
      // 직군은 분류가 아니라 해석의 위치다. 참여자가 확정한 역할과 Context가 추정한
      // 후보를 섞으면 프레임워크가 명시적으로 막은 자동 분류가 된다.
      const provenance = summary.roleProvenance;
      if (!provenance) return "";
      if (!provenance.available) return `${insightHeading("역할이 어떻게 확정됐는가", 0)}<p class="ai-health-note">${esc(RESEARCH_FRAME_COPY.roleProvenanceUnavailable)}</p>`;
      return `${insightTable("역할이 어떻게 확정됐는가", provenance.distribution, provenance.field, readable, { note: RESEARCH_FRAME_COPY.roleProvenance, column: "확정 경로", missingNote: null })}
        <p class="ai-health-note">참여자가 직접 확인한 기록 ${provenance.confirmed}건, Context 후보만 있는 기록 ${provenance.candidateOnly}건, 기존 역할표로 설명하기 어려운 기록 ${provenance.notCovered + provenance.notApplicable}건.</p>`;
    })()}

    ${insightTable("무엇이 계속하게 했는가", summary.support, "support_conditions", readable, { note: "최대 5개를 고르는 문항입니다. 분모는 이 문항에 답한 사람 수이고, 비율의 합은 100%를 넘습니다. 전문 경로와 관객 경로의 보기 문구가 달라 같은 코드도 뜻이 완전히 같지는 않습니다.", column: "지지 조건" })}
    ${insightCrossTable("어떤 지원이 오래 작동했는가", summary.crossTabs.supportByDuration, "support_conditions", "activity_duration_band", { note: "활동 기간별로 어떤 조건을 꼽았는지 봅니다. 조건이 몇 년 작동했는지를 묻는 문항이 없어, 오래 이어온 사람의 선택으로 대신 읽습니다." })}
    ${insightCrossTable("달라진 시점 × 보이지 않게 이어진 것", summary.crossTabs.transitionContinuity, "transition_state", "invisible_continuity_state", { note: "이 연구의 핵심 가설이 놓인 표입니다.", focusNote: "\"달라진 시점은 분명했지만 보이지 않게 이어지고 있었다\"에 해당하는 칸입니다." })}

    ${insightTable("누가 계속했는가 · 역할군", summary.who.roleGroup, "role_group_primary", readable, { note: `역할·연령·활동형태는 스냅샷에서 읽습니다. 프로필을 읽은 응답 ${summary.who.profiles}건.`, column: "역할군", missingNote: PROFILE_MISSING_NOTE })}
    ${insightTable("누가 계속했는가 · 연령대", summary.who.ageBand, "age_band", readable, { column: "연령대", missingNote: PROFILE_MISSING_NOTE })}
    ${insightTable("누가 계속했는가 · 활동 형태", summary.who.activityForm, "activity_form", readable, { column: "활동 형태", missingNote: PROFILE_MISSING_NOTE })}
    ${insightTable("누가 계속했는가 · 활동 기간", summary.who.duration, "activity_duration_band", readable, { column: "기간" })}

    ${insightTable("어디에서 관계가 달라졌는가 · 현재에 작용하는 조건", summary.disconnection.pauseContext, "pause_context_tags", readable, { note: "'중단'이나 '탈락'으로 정리하지 않습니다. 지금의 방식에 함께 작용한 현실을 셉니다.", column: "조건" })}
    ${insightTable("어디에서 관계가 달라졌는가 · 공개 활동의 상태", summary.disconnection.publicActivity, "public_activity_state", readable, { note: "제작은 이어지지만 공개가 쉬고 있는 칸이 기록에서 사라지는 지점입니다.", column: "상태" })}
    ${insightTable("어디에서 관계가 달라졌는가 · 제작·핵심 활동의 상태", summary.disconnection.creativeWork, "creative_work_state", readable, { column: "상태" })}

    ${insightTable("어떤 기억에서 시작했는가", summary.memory.type, "memory_type", readable, { note: `공간에서 시작한 응답 ${summary.memory.spaceShare.count}건.`, column: "출발점" })}
    ${insightCrossTable("어떤 종류의 기억이 어느 시기에 몰려 있는가", summary.crossTabs.memoryTypeTime, "memory_type", "memory_time_band", { note: "기억의 종류와 시기를 함께 봅니다." })}
    ${insightNames("기억이 놓인 지역", summary.memory.places, { note: "M07은 국가·도시만 받습니다. 작업실·극장·서점 같은 장소 이름은 현재 문항에 없습니다." })}

    ${insightTable("기억에는 남았지만 기록에서는 빠진 이름 · 떠올린 이유", summary.community.reason, "community_recall_reason", readable, { note: `이름을 하나 더 남긴 응답 ${summary.community.optIn}건. 그 가운데 "한동안 소식이나 기록을 만나기 어려워서"가 ${summary.community.lessVisible}건입니다.`, column: "이유", missingNote: (count) => `이 단계는 선택 사항입니다. 이름을 남기지 않은 응답 ${count}건은 분모에서 제외했습니다.` })}
    ${insightNames("두 사람 이상이 같은 이름을 적은 경우", summary.community.names, { note: "이 연구가 찾는 이름이므로 표시합니다. 어떤 참여자가 적었는지는 나타나지 않습니다." })}

    <h3 style="margin:26px 0 6px;font-size:15px;">현재 비어 있는 조건과 바라는 변화</h3>
    <p class="ai-health-note">D1~D4는 응답 범위와 역할에 따라 문항 문구가 달라집니다. 합산하지 않고 범위별로 나눠 셉니다. 역할 범위는 코드끼리 비교할 수 없습니다.</p>
    ${["gap", "desired"].map((kind) => summary.conditions[kind].map((group) => `<h4 style="margin:14px 0 4px;font-size:13px;">${kind === "gap" ? "비어 있는 조건" : "바라는 변화"} · ${esc(insightLabel("d_scope", group.scope))} <span class="ai-health-badge">${group.comparable ? "코드 비교 가능" : "코드 비교 불가"}</span></h4>
      <table class="ai-health-table"><thead><tr><th scope="col">${group.comparable ? "조건" : "코드"}</th><th scope="col">응답</th><th scope="col">비율</th></tr></thead><tbody>${group.rows.map((row) => `<tr><th scope="row">${esc(insightLabel(dAxisField(group.scope), row.code))}</th>${countCell(row.count)}${shareCell(row.share, readable)}</tr>`).join("")}</tbody></table>`).join("")).join("") || `<p class="ai-health-note">아직 답한 응답이 없습니다.</p>`}

    <h3 style="margin:26px 0 6px;font-size:15px;">남긴 이야기의 두께</h3>
    <p class="ai-health-note">원문은 읽지 않고 몇 명이 얼마나 적었는지만 셉니다. 자료가 한 문장으로 줄어들지 않는지 확인하는 값입니다.</p>
    <dl class="ai-health-totals">
      <div><dt>서술을 남긴 응답</dt><dd>${summary.narrative.responses}건${readable === "shares" ? ` · ${pct(summary.narrative.share)}` : ""}</dd></div>
      <div><dt>1인당 서술 문항</dt><dd>${summary.narrative.averageFields.toFixed(1)} / ${summary.narrative.askedFields}</dd></div>
      <div><dt>1인당 글자 수</dt><dd>${summary.narrative.averageChars}자</dd></div>
    </dl>

    <h3 style="margin:26px 0 6px;font-size:15px;">지금 계산할 수 없는 지표</h3>
    <p class="ai-health-note">문항이 없어서 비어 있는 칸입니다. 파일럿을 넓히기 전에 질문지에서 결정해야 합니다.</p>
    <ul class="ai-health-errors">${summary.gaps.map((gap) => `<li><strong>${esc(gap.title)}</strong> — ${esc(gap.detail)}</li>`).join("")}</ul>
    <p class="ai-health-note">고정문항과 응답 전체를 페이지 단위로 받아 계산합니다.${state.insightsNote ? ` ${esc(state.insightsNote)}` : ""}</p>
  </section>`;
}

const koNum = (value) => Number(value).toLocaleString("ko-KR");

// 목록은 최근 500건까지만 받는다. 왼쪽 표본 카운트도 그 500건에서 센 수다. 잘렸다는 말을
// 쓰지 않으면 연구자가 "연구 500"을 전체로 읽는다 — 목표가 300~500명인 조사에서 그 오독은
// 모집을 멈출지 이어갈지의 판단을 그대로 틀리게 만든다. 전체를 다 받는 대신 사실을 밝힌다.
function sessionCapNotice() {
  const shown = state.sessions.length;
  const total = Number.isFinite(state.sessionsTotal) ? state.sessionsTotal : null;
  // 전체 건수를 읽지 못했을 때(Content-Range 없음)는 상한에 정확히 닿았는지로 판단한다.
  if (total === null) {
    if (shown < SESSION_LIST_LIMIT) return "";
    return `<p class="ai-health-note" role="status" style="margin:8px 0 0;">목록 상한 ${koNum(SESSION_LIST_LIMIT)}건에 닿았습니다. 더 오래된 응답은 이 목록과 위 표본 카운트에 빠져 있을 수 있습니다. 내보내기는 상한 없이 전부 받습니다.</p>`;
  }
  if (total <= shown) return "";
  return `<p class="ai-health-note" role="status" style="margin:8px 0 0;">전체 ${koNum(total)}건 가운데 최근 ${koNum(shown)}건만 표시하고 있습니다. 위 표본 카운트도 이 ${koNum(shown)}건에서 센 수이므로 전체 표본 크기가 아닙니다. 내보내기와 연구 지표는 이 상한을 쓰지 않습니다.</p>`;
}

function renderDashboard() {
  const totals = { all: state.sessions.length, institution_review: state.sessions.filter((item) => item.sample_type === "institution_review").length, test: state.sessions.filter((item) => item.sample_type === "test").length, research: state.sessions.filter((item) => item.sample_type === "research").length };
  // 큐 머리의 숫자 하나가 가장 많이 읽힌다. 잘렸을 때는 그 자리에서 "500 / 전체"로 보여준다.
  const queueCount = Number.isFinite(state.sessionsTotal) && state.sessionsTotal > totals.all ? `${koNum(totals.all)} / ${koNum(state.sessionsTotal)}` : koNum(totals.all);
  return `<div class="site-shell dashboard-shell"><header class="topbar"><div class="brand"><span class="brand-mark">LED</span><span>Local Express Daegu</span></div><div class="topbar-project"><span>AUTHENTICATED RESEARCHER VIEW</span><strong>〈만 39세 이상〉 RC1</strong></div><button class="secondary-button" data-admin-action="logout">로그아웃</button></header><main class="dashboard-grid"><aside class="dashboard-sidebar"><div class="dashboard-sidebar-head"><div><span>RESPONSE QUEUE</span><strong>${queueCount}</strong></div><div class="dashboard-filters">${[["all", "전체"], ["institution_review", "기관"], ["test", "테스트"], ["research", "연구"]].map(([value, label]) => `<button data-admin-filter="${value}" class="${state.filter === value ? "active" : ""}">${label} ${totals[value]}</button>`).join("")}</div>${sessionCapNotice()}<button class="secondary-button" data-admin-action="research-insights">연구 지표</button><button class="secondary-button" data-admin-action="ai-health">AI 운영 지표</button><button class="secondary-button" data-admin-action="care">철회·알림 관리</button><button class="secondary-button" data-admin-action="export-records" ${state.exportBusy ? "disabled" : ""}>참여 기록 묶음 · ${esc(exportSampleTypes().map((type) => SAMPLE_LABELS[type] || type).join(" + "))}</button><button class="secondary-button" data-admin-action="export-json">백업 JSON (원문 포함)</button><button class="secondary-button" data-admin-action="export-csv">요약 CSV</button>${state.exportStatus ? `<p class="ai-health-note" style="margin:8px 0 0;" role="status">${esc(state.exportStatus)}</p>` : ""}</div><div class="dashboard-profile-list">${sessionRows().map(listCard).join("") || "<p>응답 없음</p>"}</div></aside><section class="dashboard-main">${state.view === "ai-health" ? renderAiHealth() : state.view === "research-insights" ? renderResearchInsights() : state.view === "care" ? renderCare() : renderDetail()}</section></main></div>`;
}

function render() { root.innerHTML = !state.session ? renderLogin() : state.status === "loading" ? "<main class='admin-login'><p>관리자 권한을 확인하고 있습니다.</p></main>" : renderDashboard(); }

// 참여 기록 묶음은 500명에서 몇 MB가 된다. 예전에는 click() 직후 곧바로 URL을 취소했는데,
// 큰 blob에서는 브라우저가 저장을 시작하기 전에 주소가 사라져 1~2분 기다린 내보내기가
// 조용히 실패할 수 있다. 취소만 다음 틱으로 미룬다.
function download(filename, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
function csvValue(value) { const text = String(value ?? ""); return `"${text.replaceAll('"', '""')}"`; }
// `over39_response_snapshots`가 빠져 있었다. 참여자가 쓴 서술 원문과 참여 기록 문서가
// 전부 그 payload 안에 있으므로, 이 내보내기로는 가장 중요한 연구 데이터를 받을 수 없었다.
// 안부 답장 원문은 `over39_relay_messages`에만 있다. 이 목록에서 빠지면 이번 회차의
// 대화 릴레이 답장이 유일한 백업에서 통째로 빠진다. 연락처가 든 표(notifications,
// contacts)는 설계대로 백업에 넣지 않는다.
const exportTables = ["over39_sessions", "over39_response_snapshots", "over39_fixed_answers", "over39_axis_snapshots", "over39_depth_questions", "over39_depth_answers", "over39_ai_runs", "over39_participant_revisions", "over39_consent_events", "over39_connection_profiles", "over39_institution_feedback", "over39_operational_events", "over39_greetings", "over39_relay_proposals", "over39_relay_threads", "over39_relay_messages"];

// 예전에는 테이블마다 `limit=5000`을 한 번 걸고 끝냈다. `over39_fixed_answers`는 한 사람이
// 문항 32개 × 스냅샷 2단계로 약 60행을 남기므로 **80명 남짓에서 상한에 걸려 조용히 잘렸다.**
// 목표가 300~500명인 연구에서 잘림을 알려주지 않는 내보내기는 없는 것보다 위험하다.
const EXPORT_PAGE_SIZE = 1000;
// 참여 기록 묶음은 스냅샷 payload 원문을 읽어야 해서 한 행이 수십 KB다. 1,000행씩 받으면
// 한 응답이 수십 MB가 되므로, `onPage`로 받는 즉시 사람당 하나로 접고 원문을 버린다.
const SNAPSHOT_PAGE_SIZE = 200;
// 표마다 기본키가 다르다. `over39_sessions`와 `over39_connection_profiles`는 `response_id`가
// 기본키이고 `id` 컬럼이 아예 없다. PostgREST는 없는 정렬 컬럼에 HTTP 400을 돌려주므로,
// `order=id.asc`를 모든 표에 쓰던 이 함수는 그 둘에서 예외를 던졌고 호출부가 빈 배열로
// 삼켰다. 그래서 참여 기록 묶음은 **항상 "0명분"** 으로 나왔다 — 스냅샷·승인문·동의를
// 정상적으로 받아 놓고도 붙일 사람이 없어 전부 버렸다. 자료를 모아도 꺼낼 수 없었다.
// `over39_greetings`는 반대로 `id`는 있고 `response_id`가 없다.
const TABLE_ORDER_KEY = { over39_sessions: "response_id", over39_connection_profiles: "response_id" };
const orderKeyFor = (table) => TABLE_ORDER_KEY[table] || "id";

async function fetchAllRows(table, { pageSize = EXPORT_PAGE_SIZE, onPage = null, select = "*", extra = "", orderKey = null } = {}) {
  const rows = [];
  let received = 0;
  for (let offset = 0; ; offset += pageSize) {
    const page = await api(table, `?select=${select}${extra}&order=${orderKey || `${orderKeyFor(table)}.asc`}&limit=${pageSize}&offset=${offset}`);
    received += page.length;
    if (onPage) onPage(page);
    else rows.push(...page);
    if (page.length < pageSize) return Object.assign(rows, { received });
    // 사고로 무한히 돌지 않게 한 번에 받는 양을 제한하고, 넘으면 잘림을 밝힌다.
    if (received >= 200000) return Object.assign(rows, { received, truncated: true });
  }
}
async function loadNonPiiExport() {
  const results = await Promise.all(exportTables.map((table) => fetchAllRows(table).catch((error) => Object.assign([], { failed: error.message }))));
  const bundle = Object.fromEntries(exportTables.map((table, index) => [table, results[index]]));
  // 내보낸 파일 안에 무엇이 몇 건 담겼는지, 실패하거나 잘린 것이 있는지 함께 남긴다.
  bundle._export_meta = {
    exported_at: new Date().toISOString(),
    row_counts: Object.fromEntries(exportTables.map((table, index) => [table, results[index].length])),
    truncated: exportTables.filter((table, index) => results[index].truncated),
    failed: Object.fromEntries(exportTables.map((table, index) => [table, results[index].failed]).filter(([, reason]) => reason)),
  };
  return bundle;
}
function exportSummaryRows(bundle) {
  return (bundle.over39_sessions || []).map((session) => {
    const axes = bundle.over39_axis_snapshots.filter((row) => row.response_id === session.response_id);
    // research_derived는 스냅샷마다 쌓이므로, 아무 행이 아니라 가장 최근 것을 집는다.
    const latestDerived = axes.filter((row) => row.stage === "research_derived").sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || ""))).pop();
    const final = axes.find((row) => row.stage === "participant_final") || latestDerived || {};
    const revision = bundle.over39_participant_revisions.find((row) => row.response_id === session.response_id) || {};
    const connection = bundle.over39_connection_profiles.find((row) => row.response_id === session.response_id) || {};
    return { ...session, coordinate_scope: final.coordinate_scope || session.coordinate_scope || "", m_primary: final.m_primary || "", s_primary: final.s_primary || "", d_primary: final.d_primary || "", coordinate_status: final.status || "", participant_action: revision.participant_action || "", relationship_opt_in: connection.opted_in ?? "", has_institution_feedback: bundle.over39_institution_feedback.some((row) => row.response_id === session.response_id || row.source_response_id === session.response_id) };
  });
}

// 비식별 JSON·CSV는 기계용이다. TK가 물은 "100명이면 100페이지"는 사람이 읽고 인쇄하는
// 문서이므로, 같은 데이터를 참여자 1명 = 문서 1개로 조립해 따로 내보낸다.
// 표본은 왼쪽 필터를 따르고, 필터가 '전체'일 때는 연구 표본만 담는다.
function exportSampleTypes() {
  return state.filter === "all" ? ["research"] : [state.filter];
}

async function loadRecordBundle(sampleTypes) {
  const notes = [];
  const fetchNoting = async (table, label, options) => {
    try {
      const rows = await fetchAllRows(table, options);
      if (rows.truncated) notes.push(`${label}이 ${rows.received}행에서 잘렸습니다. 이 파일은 그만큼 비어 있습니다.`);
      return rows;
    } catch (error) {
      notes.push(`${label}을 불러오지 못했습니다 (${error.message}). 이 파일은 그만큼 비어 있습니다.`);
      return [];
    }
  };
  // 스냅샷은 사람당 하나로 접으면서 받는다. 500명 규모에서 payload 전체를 동시에 들고 있지 않다.
  const snapshotState = { kept: new Map(), seen: 0, collapsed: 0 };
  const [sessions, revisions, consentEvents] = await Promise.all([
    fetchNoting("over39_sessions", "응답 목록"),
    fetchNoting("over39_participant_revisions", "참여자 승인 문장"),
    fetchNoting("over39_consent_events", "동의 이력"),
    fetchNoting("over39_response_snapshots", "응답 스냅샷", { pageSize: SNAPSHOT_PAGE_SIZE, onPage: (page) => collectSnapshots(page, snapshotState) }),
  ]);
  return buildRecordBundle({ sessions, snapshotState, revisions, consentEvents }, { sampleTypes, notes });
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.adminAction === "ai-health") return loadAiRuns();
  if (button.dataset.adminAction === "research-insights") return loadResearchInsights();
  if (button.dataset.adminAction === "care") return loadCare();
  if (button.dataset.adminAction === "care-withdraw-record") {
    const responseId = document.querySelector("#care-withdraw-id")?.value.trim();
    const submitEndpoint = String(window.OVER39_SUPABASE_SUBMIT_URL || "");
    if (!responseId) { state.careStatus = "응답 ID를 입력해 주세요."; render(); return; }
    if (!submitEndpoint) { state.careStatus = "저장 기능 주소가 설정되지 않았습니다."; render(); return; }
    const response = await fetch(submitEndpoint, { method: "POST", headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${anonKey}` }, body: JSON.stringify({ kind: "withdrawal_request", idempotency_key: `withdrawal:${responseId}:${Date.now()}`, payload: { response_id: responseId } }) });
    const result = await response.json().catch(() => ({}));
    state.careStatus = response.ok && result.ok
      ? `${responseId} 철회를 접수했습니다. 이 참여자에게는 이제 안부가 전달되지 않습니다.`
      : "철회 접수에 실패했습니다. 응답 ID를 확인해 주세요.";
    return loadCare();
  }
  if (button.dataset.adminAction === "care-resolve") {
    try {
      await relayAdminCall("admin_resolve_withdrawal", { response_id: button.dataset.responseId });
      state.careStatus = `${button.dataset.responseId} 철회를 처리 완료로 표시했습니다. 안부 차단이 풀렸습니다.`;
    } catch { state.careStatus = "처리 완료 표시에 실패했습니다. 중계 기능 배포와 권한을 확인해 주세요."; }
    return loadCare();
  }
  if (button.dataset.adminAction === "care-mark-sent") {
    try {
      await relayAdminCall("admin_mark_notification", { response_id: button.dataset.responseId, status: "SENT" });
      state.careStatus = "알림을 보냄으로 표시했습니다.";
    } catch { state.careStatus = "보냄 표시에 실패했습니다."; }
    return loadCare();
  }
  if (button.dataset.adminAction === "care-send-mail") {
    // 서버가 직접 보낸다(RESEND_API_KEY 설정 시). 설정 전에는 링크만 만들어 준다.
    try {
      const result = await relayAdminCall("admin_send_notification", { response_id: button.dataset.responseId });
      state.careStatus = result.sent ? `${button.dataset.responseId}에게 알림 메일을 보냈습니다.` : "보냈다는 확인을 받지 못했습니다.";
    } catch (error) {
      state.careStatus = error.message === "NOTIFY_NOT_CONFIGURED"
        ? "서버 발송이 아직 설정되지 않았습니다(RESEND_API_KEY). 「메일용 링크」로 직접 보내세요."
        : error.message === "NOTIFICATION_NO_PENDING_GREETING" ? "이 참여자에게 아직 열리지 않은 새 안부가 없습니다."
          : error.message === "NOTIFY_SEND_FAILED" ? "발송 서비스가 거절했습니다. 상태를 FAILED로 표시했습니다." : "알림 메일을 보내지 못했습니다.";
    }
    return loadCare();
  }
  if (button.dataset.adminAction === "care-mint-link") {
    try {
      const result = await relayAdminCall("admin_mint_notification_link", { response_id: button.dataset.responseId });
      state.careLink = /^https:\/\//.test(String(result.relay_url || "")) ? { response_id: button.dataset.responseId, url: result.relay_url } : null;
      state.careStatus = state.careLink ? "메일용 편지함 링크를 만들었습니다. 알림 메일에 붙여 보내세요." : "링크 형식이 예상과 다릅니다.";
    } catch (error) { state.careStatus = error.message === "NOTIFICATION_NO_PENDING_GREETING" ? "이 참여자에게 아직 열리지 않은 새 안부가 없습니다." : "메일용 링크를 만들지 못했습니다."; }
    render();
    return;
  }
  // 표본을 바꾸는 것은 다시 집계하는 일이므로 재요청 없이 화면만 다시 그린다.
  if (button.dataset.insightsSample) { state.insightsIncludeTest = button.dataset.insightsSample === "with-test"; render(); return; }
  if (button.dataset.responseId) { state.view = "responses"; return loadDetail(button.dataset.responseId); }
  if (button.dataset.adminFilter) { state.filter = button.dataset.adminFilter; render(); return; }
  if (button.dataset.adminAction === "logout") { clearSession(); state.status = "ready"; render(); return; }
  if (button.dataset.adminAction === "login") {
    const email = document.querySelector("#admin-email")?.value.trim();
    if (!email) return;
    const redirectTo = adminRedirectUrl();
    // GoTrue의 원시 REST는 본문의 `options.emailRedirectTo`를 읽지 않는다. 서버가 디코딩하는
    // `OtpParams`에는 `options`도 `emailRedirectTo`도 없고, Go는 모르는 필드를 조용히 버린다.
    // 돌아갈 주소는 `utilities.GetReferrer()`가 쿼리스트링 `redirect_to` → `Referer` 헤더 →
    // 프로젝트 Site URL 순으로 정한다. supabase-js의 `emailRedirectTo`는 클라이언트가
    // `?redirect_to=`로 옮겨 붙이는 이름일 뿐이다(`_request`가 `qs['redirect_to']`로 넣는다).
    // 그래서 본문에 넣는 동안 매직링크는 이 화면이 아니라 Referer(교차 출처에서는 출처만
    // 전송되므로 사이트 첫 화면)나 Site URL로 떨어졌다. 그 페이지에는 `captureAuthCallback()`이
    // 없어 프래그먼트의 access_token이 그대로 버려졌다 — 링크를 눌러도 로그인이 끝나지 않았다.
    const response = await fetch(`${supabaseUrl}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    state.error = response.ok ? otpSentMessage(redirectTo) : await otpFailureMessage(response);
    render();
    return;
  }
  if (button.dataset.adminAction === "prepare-relay") {
    const toResponseId = document.querySelector("#relay-target")?.value.trim();
    const message = document.querySelector("#relay-message")?.value.trim();
    const matchReason = document.querySelector("#relay-reason")?.value.trim();
    if (!relayEndpoint || !toResponseId || !message) { state.relayError = "받는 응답 ID와 전할 내용을 확인해 주세요."; render(); return; }
    const response = await fetch(relayEndpoint, { method: "POST", headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${state.session.access_token}` }, body: JSON.stringify({ action: "admin_create_proposal", from_response_id: state.selected, to_response_id: toResponseId, message, match_reason: matchReason, source_language: "ko" }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) { state.relayError = "전달 링크를 만들지 못했습니다. 중계 기능 배포와 관리자 권한을 확인해 주세요."; render(); return; }
    // 링크를 href로 그대로 심으므로, https가 아닌 값은 화면에 걸지 않는다.
    if (!/^https:\/\//.test(String(result.relay_url || ""))) { state.relayError = "받은 링크 형식이 예상과 다릅니다."; render(); return; }
    state.relayResult = result.relay_url;
    state.relayError = "";
    render();
    return;
  }
  if (button.dataset.adminAction === "export-records") {
    if (state.exportBusy) return;
    const sampleTypes = exportSampleTypes();
    state.exportBusy = true;
    state.exportStatus = `${sampleTypes.map((type) => SAMPLE_LABELS[type] || type).join(" + ")} 기록을 모으는 중입니다. 500명 규모에서는 1~2분이 걸립니다.`;
    render();
    try {
      const bundle = await loadRecordBundle(sampleTypes);
      const html = renderRecordBundleHtml(bundle);
      download(recordBundleFilename(bundle), html, "text/html;charset=utf-8");
      // 몇 명분이 담겼는지 화면에도 남긴다. 조용히 잘린 내보내기를 알아차릴 수 있어야 한다.
      state.exportStatus = `${bundle.meta.records}명분을 내려받았습니다. 승인 문장 있음 ${bundle.meta.withApprovedText}명 · 파일 크기 약 ${Math.max(1, Math.round(html.length / 1024))}KB. 브라우저에서 열어 인쇄하면 1명이 새 쪽에서 시작합니다.${bundle.meta.notes.length ? ` 확인 필요: ${bundle.meta.notes.join(" ")}` : ""}`;
    } catch (error) {
      state.exportStatus = error.message === "ADMIN_ACCESS_DENIED" ? "이 계정으로는 참여 기록을 내보낼 수 없습니다." : "참여 기록 묶음을 만들지 못했습니다. 다시 시도해 주세요.";
    }
    state.exportBusy = false;
    render();
    return;
  }
  if (button.dataset.adminAction === "export-json") {
    const bundle = await loadNonPiiExport();
    // "non-pii"라는 이름은 오해를 부른다 — 연락처는 없지만 서술 원문이 그대로 담긴다.
    download(`over39-research-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(bundle, null, 2), "application/json");
  }
  if (button.dataset.adminAction === "export-csv") {
    const bundle = await loadNonPiiExport();
    const rows = exportSummaryRows(bundle);
    const fields = ["response_id", "sample_type", "include_in_policy_statistics", "institution_code", "route", "coordinate_scope", "status", "questionnaire_version", "classification_version", "source_language", "m_primary", "s_primary", "d_primary", "coordinate_status", "participant_action", "relationship_opt_in", "has_institution_feedback", "completed_at"];
    download(`over39-research-summary-${new Date().toISOString().slice(0, 10)}.csv`, [fields.join(","), ...rows.map((row) => fields.map((field) => csvValue(row[field])).join(","))].join("\n"), "text/csv;charset=utf-8");
  }
});

captureAuthCallback();
state.session = loadSession();
if (!state.session || !supabaseUrl || !anonKey) { state.status = "ready"; render(); }
else loadSessions().catch((error) => { clearSession(); state.error = error.message === "ADMIN_NOT_REGISTERED" ? "이 계정은 관리자 목록에 등록되지 않았습니다." : "관리자 권한을 확인하지 못했습니다."; state.status = "ready"; render(); });
