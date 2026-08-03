const root = document.querySelector("#admin-root");
const supabaseUrl = String(window.OVER39_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = String(window.OVER39_SUPABASE_ANON_KEY || "");
const sessionKey = "over39-rc1-admin-session";
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
let state = { session: null, sessions: [], selected: null, detail: null, status: "loading", filter: "all", error: "" };

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

async function api(table, query = "") {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, { headers: { apikey: anonKey, Authorization: `Bearer ${state.session.access_token}` } });
  if (response.status === 401 || response.status === 403) throw new Error("ADMIN_ACCESS_DENIED");
  if (!response.ok) throw new Error(`ADMIN_HTTP_${response.status}`);
  return response.json();
}

async function verifyAdmin() {
  const rows = await api("over39_admins", "?select=user_id&limit=1");
  if (!rows.length) throw new Error("ADMIN_NOT_REGISTERED");
}

async function loadSessions() {
  await verifyAdmin();
  state.sessions = await api("over39_sessions", "?select=*&order=updated_at.desc&limit=500");
  state.status = "ready";
  render();
}

async function loadDetail(responseId) {
  state.selected = responseId;
  state.detail = null;
  render();
  const tables = ["over39_fixed_answers", "over39_axis_snapshots", "over39_depth_questions", "over39_depth_answers", "over39_ai_runs", "over39_participant_revisions", "over39_consent_events", "over39_connection_profiles", "over39_institution_feedback", "over39_operational_events"];
  const results = await Promise.all(tables.map((table) => api(table, `?select=*&response_id=eq.${encodeURIComponent(responseId)}`).catch(() => [])));
  state.detail = Object.fromEntries(tables.map((table, index) => [table, results[index]]));
  render();
}

function renderLogin() {
  const configured = Boolean(supabaseUrl && anonKey);
  return `<main class="admin-login"><div class="archive-label">OVER39 · RC1 ADMIN</div><h1>연구자 확인</h1><p>${configured ? "등록된 관리자 이메일로 일회용 로그인 링크를 받습니다." : "Supabase URL과 anon key가 아직 설정되지 않았습니다."}</p>${configured ? `<label for="admin-email">관리자 이메일</label><input id="admin-email" type="email" class="text-input text-input-single" placeholder="research@example.com" /><button class="primary-button" data-admin-action="login">로그인 링크 받기</button>` : ""}${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}</main>`;
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
    ${detailSection("기관 피드백", d.over39_institution_feedback, (row) => `<article><p>${esc(JSON.stringify(row.feedback))}</p></article>`)}
    ${detailSection("오류·운영 로그", d.over39_operational_events, (row) => `<article><strong>${esc(row.event_type)} · ${esc(row.severity)}</strong><p>${esc(JSON.stringify(row.details))}</p></article>`)}`;
}

function renderDashboard() {
  const totals = { all: state.sessions.length, institution_review: state.sessions.filter((item) => item.sample_type === "institution_review").length, test: state.sessions.filter((item) => item.sample_type === "test").length, research: state.sessions.filter((item) => item.sample_type === "research").length };
  return `<div class="site-shell dashboard-shell"><header class="topbar"><div class="brand"><span class="brand-mark">LED</span><span>Local Express Daegu</span></div><div class="topbar-project"><span>AUTHENTICATED RESEARCHER VIEW</span><strong>〈만 39세 이상〉 RC1</strong></div><button class="secondary-button" data-admin-action="logout">로그아웃</button></header><main class="dashboard-grid"><aside class="dashboard-sidebar"><div class="dashboard-sidebar-head"><div><span>RESPONSE QUEUE</span><strong>${totals.all}</strong></div><div class="dashboard-filters">${[["all", "전체"], ["institution_review", "기관"], ["test", "테스트"], ["research", "연구"]].map(([value, label]) => `<button data-admin-filter="${value}" class="${state.filter === value ? "active" : ""}">${label} ${totals[value]}</button>`).join("")}</div><button class="secondary-button" data-admin-action="export-json">비식별 JSON</button><button class="secondary-button" data-admin-action="export-csv">비식별 CSV</button></div><div class="dashboard-profile-list">${sessionRows().map(listCard).join("") || "<p>응답 없음</p>"}</div></aside><section class="dashboard-main">${renderDetail()}</section></main></div>`;
}

function render() { root.innerHTML = !state.session ? renderLogin() : state.status === "loading" ? "<main class='admin-login'><p>관리자 권한을 확인하고 있습니다.</p></main>" : renderDashboard(); }

function download(filename, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
function csvValue(value) { const text = String(value ?? ""); return `"${text.replaceAll('"', '""')}"`; }
const exportTables = ["over39_sessions", "over39_fixed_answers", "over39_axis_snapshots", "over39_depth_questions", "over39_depth_answers", "over39_ai_runs", "over39_participant_revisions", "over39_consent_events", "over39_connection_profiles", "over39_institution_feedback", "over39_operational_events"];
async function loadNonPiiExport() {
  const results = await Promise.all(exportTables.map((table) => api(table, "?select=*&limit=5000")));
  return Object.fromEntries(exportTables.map((table, index) => [table, results[index]]));
}
function exportSummaryRows(bundle) {
  return bundle.over39_sessions.map((session) => {
    const axes = bundle.over39_axis_snapshots.filter((row) => row.response_id === session.response_id);
    const final = axes.find((row) => row.stage === "participant_final") || axes.find((row) => row.stage === "research_derived") || {};
    const revision = bundle.over39_participant_revisions.find((row) => row.response_id === session.response_id) || {};
    const connection = bundle.over39_connection_profiles.find((row) => row.response_id === session.response_id) || {};
    return { ...session, coordinate_scope: final.coordinate_scope || session.coordinate_scope || "", m_primary: final.m_primary || "", s_primary: final.s_primary || "", d_primary: final.d_primary || "", coordinate_status: final.status || "", participant_action: revision.participant_action || "", relationship_opt_in: connection.opted_in ?? "", has_institution_feedback: bundle.over39_institution_feedback.some((row) => row.response_id === session.response_id || row.source_response_id === session.response_id) };
  });
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.responseId) return loadDetail(button.dataset.responseId);
  if (button.dataset.adminFilter) { state.filter = button.dataset.adminFilter; render(); return; }
  if (button.dataset.adminAction === "logout") { clearSession(); state.status = "ready"; render(); return; }
  if (button.dataset.adminAction === "login") {
    const email = document.querySelector("#admin-email")?.value.trim();
    if (!email) return;
    const response = await fetch(`${supabaseUrl}/auth/v1/otp`, { method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, options: { emailRedirectTo: location.href.split("#")[0] } }) });
    state.error = response.ok ? "로그인 링크를 보냈습니다. 이메일을 확인해 주세요." : "로그인 링크를 보내지 못했습니다.";
    render();
    return;
  }
  if (button.dataset.adminAction === "export-json") {
    const bundle = await loadNonPiiExport();
    download("over39-rc1-non-pii.json", JSON.stringify(bundle, null, 2), "application/json");
  }
  if (button.dataset.adminAction === "export-csv") {
    const bundle = await loadNonPiiExport();
    const rows = exportSummaryRows(bundle);
    const fields = ["response_id", "sample_type", "institution_code", "route", "coordinate_scope", "status", "questionnaire_version", "classification_version", "source_language", "m_primary", "s_primary", "d_primary", "coordinate_status", "participant_action", "relationship_opt_in", "has_institution_feedback", "completed_at"];
    download("over39-rc1-non-pii.csv", [fields.join(","), ...rows.map((row) => fields.map((field) => csvValue(row[field])).join(","))].join("\n"), "text/csv;charset=utf-8");
  }
});

captureAuthCallback();
state.session = loadSession();
if (!state.session || !supabaseUrl || !anonKey) { state.status = "ready"; render(); }
else loadSessions().catch((error) => { clearSession(); state.error = error.message === "ADMIN_NOT_REGISTERED" ? "이 계정은 관리자 목록에 등록되지 않았습니다." : "관리자 권한을 확인하지 못했습니다."; state.status = "ready"; render(); });
