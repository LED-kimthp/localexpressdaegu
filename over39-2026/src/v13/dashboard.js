import { buildConnectionProfile, connectionTopics, coordinateInsight, rankedMatches } from "./connection.js";

const root = document.querySelector("#dashboard-root");
const pendingKey = "over39-v13-pilot-pending-submission";
const connectionKey = (responseId) => `over39-v13-connection-${responseId}`;

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const demoProfiles = [
  {
    response_id: "DEMO-TEHRAN-ARTIST",
    opt_in: true,
    role: "시각예술가",
    role_group: "CREATION",
    languages: ["en"],
    locations: ["Iran, Tehran"],
    coordinate: coordinateInsight({ mPrimary: "M3", sPrimary: "S4", dPrimary: "D3" }),
    needs: ["CRITIQUE", "TRANSLATION", "RECORD"],
    offers: ["COLLABORATION", "SPACE"],
    reply_modes: ["MEDIATED_WEB"],
    introduction: "작업의 맥락을 다른 언어와 지역에서 함께 읽어 볼 동료를 찾고 있습니다.",
    visibility: "RESEARCHER_ONLY",
    status: "review_required",
    sample: true,
  },
  {
    response_id: "DEMO-TAIWAN-CRITIC",
    opt_in: true,
    role: "비평가·연구자",
    role_group: "CRITICISM",
    languages: ["zh", "en"],
    locations: ["Taiwan, Taipei"],
    coordinate: coordinateInsight({ mPrimary: "M3", sPrimary: "S1", dPrimary: "D3" }),
    needs: ["RECORD", "COLLABORATION"],
    offers: ["CRITIQUE", "TRANSLATION", "RECORD"],
    reply_modes: ["MEDIATED_WEB"],
    introduction: "서로 다른 지역의 작업과 기록이 어떻게 연결되는지 읽고 싶습니다.",
    visibility: "RESEARCHER_ONLY",
    status: "review_required",
    sample: true,
  },
  {
    response_id: "DEMO-DAEGU-SPACE",
    opt_in: true,
    role: "독립공간 운영자",
    role_group: "SPACE",
    languages: ["ko", "en"],
    locations: ["Korea, Daegu"],
    coordinate: coordinateInsight({ mPrimary: "M4", sPrimary: "S2", dPrimary: "D4" }),
    needs: ["AUDIENCE", "SUSTAINABILITY"],
    offers: ["SPACE", "EXHIBITION", "COLLABORATION"],
    reply_modes: ["MEDIATED_WEB", "EMAIL_NOTICE"],
    introduction: "지역의 작업과 관객이 오래 만날 수 있는 방식을 나누고 싶습니다.",
    visibility: "RESEARCHER_ONLY",
    status: "review_required",
    sample: true,
  },
];

let selectedId = demoProfiles[0].response_id;
let filter = "all";
let decisions = {};

function loadLocalProfile() {
  try {
    const response = JSON.parse(localStorage.getItem(pendingKey) || "null");
    if (!response?.response_id) return null;
    const connection = JSON.parse(localStorage.getItem(connectionKey(response.response_id)) || "null") || {};
    const profile = response.connection_profile || buildConnectionProfile(response, connection);
    return profile.opt_in ? { ...profile, sample: false } : null;
  } catch {
    return null;
  }
}

function profiles() {
  const local = loadLocalProfile();
  return local ? [local, ...demoProfiles] : demoProfiles;
}

function choiceTags(values) {
  return values.length ? values.map((value) => `<span>${esc(connectionTopics[value] || value)}</span>`).join("") : "<span>선택 없음</span>";
}

function statusLabel(profile) {
  if (decisions[profile.response_id] === "approved") return "연결 제안 승인";
  if (decisions[profile.response_id] === "hold") return "추가 검토";
  return profile.status === "review_required" ? "연구자 검토 필요" : profile.status;
}

function profileCard(profile, selected) {
  const coordinate = profile.coordinate;
  return `<button type="button" class="dashboard-profile ${selected ? "selected" : ""}" data-profile-id="${esc(profile.response_id)}"><div><span>${profile.sample ? "SAMPLE" : "THIS DEVICE"}</span><strong>${esc(profile.role || "응답자")}</strong></div><p>${esc(profile.locations.join(" · ") || "위치 미입력")}</p><small>${esc(coordinate?.title || "분석 대기")}</small><em>${esc(statusLabel(profile))}</em></button>`;
}

function render() {
  const allProfiles = profiles();
  const visible = filter === "all" ? allProfiles : allProfiles.filter((profile) => statusLabel(profile).includes(filter === "review" ? "검토" : "승인"));
  const selected = allProfiles.find((profile) => profile.response_id === selectedId) || allProfiles[0];
  if (!selected) {
    root.innerHTML = "<main class='dashboard-shell'><p>연결 의향이 있는 응답이 아직 없습니다.</p></main>";
    return;
  }
  const matches = rankedMatches(selected, allProfiles).slice(0, 4);
  root.innerHTML = `<div class="site-shell dashboard-shell"><header class="topbar"><div class="brand"><span class="brand-mark">LED</span><span>Local Express Daegu</span></div><div class="topbar-project"><span>RESEARCHER VIEW</span><strong>〈만 39세 이상〉</strong></div><div class="dashboard-mode">CONNECTION REVIEW · BETA</div></header><main class="dashboard-grid"><aside class="dashboard-sidebar"><div class="dashboard-sidebar-head"><div><span>CONNECTION QUEUE</span><strong>${allProfiles.length}</strong></div><div class="dashboard-filters"><button data-filter="all" class="${filter === "all" ? "active" : ""}">전체</button><button data-filter="review" class="${filter === "review" ? "active" : ""}">검토</button><button data-filter="approved" class="${filter === "approved" ? "active" : ""}">승인</button></div></div><div class="dashboard-profile-list">${visible.map((profile) => profileCard(profile, selected.response_id === profile.response_id)).join("")}</div></aside><section class="dashboard-main"><div class="dashboard-kicker">RESPONSE ANALYSIS · ${selected.sample ? "SAMPLE RECORD" : "LOCAL BETA RECORD"}</div><div class="dashboard-title-row"><div><h1>${esc(selected.coordinate?.title || "분석 대기")}</h1><p>${esc(selected.coordinate?.description || "좌표를 생성할 정보가 아직 충분하지 않습니다.")}</p></div><span class="dashboard-status">${esc(statusLabel(selected))}</span></div><div class="dashboard-axis-grid"><div><span>직군</span><strong>${esc(selected.role || "미입력")}</strong></div><div><span>지역</span><strong>${esc(selected.locations.join(" · ") || "미입력")}</strong></div><div><span>언어</span><strong>${esc(selected.languages.join(" · ") || "미입력")}</strong></div><div><span>답장 방식</span><strong>${esc(selected.reply_modes.join(" · ") || "미선택")}</strong></div></div><section class="dashboard-detail-grid"><div><span>필요한 연결</span><div class="tag-list">${choiceTags(selected.needs)}</div></div><div><span>나눌 수 있는 경험</span><div class="tag-list">${choiceTags(selected.offers)}</div></div></section><section class="dashboard-note"><span>연결 카드 메모</span><p>${esc(selected.introduction || "아직 남긴 메모가 없습니다.")}</p></section><div class="dashboard-actions"><button class="secondary-button" data-decision="hold">추가 검토</button><button class="primary-button" data-decision="approved">매칭 제안 승인</button></div><section class="match-section"><div class="match-section-head"><div><span>MATCHING SUGGESTIONS</span><h2>AI 보조 후보, 연구자 승인 전</h2></div><p>AI는 필요·제안·역할·언어·응답 좌표의 접점을 정리합니다. 실제 안부와 질문 전달은 두 참여자의 범위와 연구자의 검토가 확인된 뒤에만 시작합니다.</p></div>${matches.length ? `<div class="match-list">${matches.map(({ profile, match }) => `<article class="match-card"><div class="match-card-head"><div><span>${profile.sample ? "SAMPLE" : "RESPONSE"}</span><h3>${esc(profile.role || "응답자")}</h3></div><strong>${match.score} / 100</strong></div><p>${esc(profile.locations.join(" · ") || "위치 미입력")}</p><ul>${match.reasons.map((reason) => `<li>${esc(reason)}</li>`).join("")}</ul><button type="button" class="secondary-button" data-match-target="${esc(profile.response_id)}">중계 제안 검토</button></article>`).join("")}</div>` : "<div class='empty-match'>현재 조건으로는 자동 후보가 없습니다. 연구자가 직접 다른 응답을 탐색할 수 있습니다.</div>"}</section></section></main></div>`;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.profileId) { selectedId = button.dataset.profileId; render(); return; }
  if (button.dataset.filter) { filter = button.dataset.filter; render(); return; }
  if (button.dataset.decision) { decisions[selectedId] = button.dataset.decision; render(); return; }
  if (button.dataset.matchTarget) { decisions[selectedId] = "hold"; selectedId = button.dataset.matchTarget; render(); }
});

render();
