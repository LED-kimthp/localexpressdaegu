import { localizeQuestion, translate } from "./i18n.js";
import { COORDINATE_SCOPE_LABELS, buildCoordinateSnapshots, deriveCoordinateScope, deriveSContextTags } from "./classification.js";
import { buildConnectionProfile, connectionTopics } from "./connection.js";
import { applicableFixedQuestionIds, buildActiveScreens, fixedQuestionIdsForScreen, flowCounts, normalizedDScope, resetForRouteChange, sanitizeAnswersForRoute } from "./flow.js";
import { DEPTH_AXIS_OPTIONS, buildMinimalDepthContext, buildMinimalSummaryContext, createDepthPlan, createDepthSummary } from "./depth.js";
import { QUESTION_METADATA } from "./question-map.js";
import { createEnvelope, readOutbox, retryOutbox, sendEnvelope, splitResearchAndContact } from "./storage.js";

const root = document.querySelector("#root");
const schemaUrl = "./src/v13/over39_questionnaire_schema_v1.3.1-draft.json";
const depthBankUrl = "./src/v13/approved-depth-question-bank.json";
const edition = document.body.dataset.edition || "pilot";
const draftKey = `over39-${edition}-draft`;
const pendingKey = `over39-${edition}-pending-submission`;
const connectionKey = (responseId) => `over39-v13-connection-${responseId}`;
const googleAppsScriptUrl = String(window.OVER39_GOOGLE_APPS_SCRIPT_URL || "").trim();
const submitFunctionUrl = String(window.OVER39_SUPABASE_SUBMIT_URL || "").trim();
const aiFunctionUrl = String(window.OVER39_SUPABASE_AI_URL || "").trim();
const supabaseAnonKey = String(window.OVER39_SUPABASE_ANON_KEY || "").trim();
const aiMode = String(window.OVER39_AI_MODE || "fallback").trim();
const query = new URLSearchParams(window.location.search);
const institutionCode = String(query.get("institution") || "").trim().slice(0, 80);
const acquisitionSource = String(query.get("source") || "direct").trim().slice(0, 80);
const sampleType = institutionCode ? "institution_review" : query.get("sample") === "test" ? "test" : "research";

let schema;
let depthBank;
let state = { phase: "loading", step: 0, answers: {}, submitted: null, submissionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, summaryGenerating: false, responseId: null, language: "ko", feedback: {} };

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const values = (value) => Array.isArray(value) ? value : value ? [value] : [];
const question = (id) => localizeQuestion(state.language, schema.questions.find((item) => item.id === id));
const storedField = (item) => item?.store?.[0] || item?.id;
const answerFor = (id) => state.answers[storedField(question(id)) || id];
const setAnswer = (id, value) => { state.answers[storedField(question(id)) || id] = value; saveDraft(); };
const optionLabel = (option) => Array.isArray(option) ? option[1] : option?.label || option;
const optionValue = (option) => Array.isArray(option) ? option[0] : option?.value || option;
const depthOutcomeFields = ["depth_plan", "depth_source", "depth_m", "depth_m_text", "depth_s", "depth_s_text", "depth_d", "depth_d_text", "depth_summary", "depth_ai_runs", "reflection_action", "participant_revision", "participant_approved_text", "participant_m", "participant_s", "participant_d", "coordinate_snapshots"];
function clearDepthOutcome() { depthOutcomeFields.forEach((field) => delete state.answers[field]); }

const languages = [["ko", "한국어"], ["en", "EN"], ["ja", "日本語"], ["zh", "繁體中文"]];
const researchContactEmail = "over39@localexpressdaegu.org";
const creditRows = [["주최", "북성로사진관(모호주택)"], ["프로젝트", "〈만 39세 이상〉"], ["설문 운영·응답 관리", "Local Express Daegu"], ["지원", "한국문화예술위원회"]];
const t = (text) => translate(state.language, text);

function saveDraft() {
  if (state.phase === "survey") {
    localStorage.setItem(draftKey, JSON.stringify({
      answers: state.answers,
      step: state.step,
      language: state.language,
      responseId: state.responseId,
      feedback: state.feedback,
      savedAt: new Date().toISOString(),
    }));
  }
}

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(draftKey) || "null"); } catch { return null; }
}

function clearDraft() { localStorage.removeItem(draftKey); }
function savePending(response) { localStorage.setItem(pendingKey, JSON.stringify(response)); }
function loadPending() { try { return JSON.parse(localStorage.getItem(pendingKey) || "null"); } catch { return null; } }
function defaultConnection() { return { opt_in: "", needs: [], offers: [], reply_modes: [], visibility: "RESEARCHER_ONLY", contact_permission: "", contact_email: "", introduction: "" }; }
function loadConnection() { try { return JSON.parse(localStorage.getItem(connectionKey(state.responseId || state.submitted?.response_id)) || "null") || defaultConnection(); } catch { return defaultConnection(); } }
function getConnection() { state.connection = state.connection || loadConnection(); return state.connection; }
function saveConnection() { if (state.responseId || state.submitted?.response_id) localStorage.setItem(connectionKey(state.responseId || state.submitted?.response_id), JSON.stringify(getConnection())); }

function locationValues(value, max = 3) {
  return String(value || "").split(/[\n;]/).map((item) => item.trim()).filter(Boolean).slice(0, max).map((label) => {
    if (/^(online|온라인)$/i.test(label)) return { country_code: "", city: "", online: true, label };
    const [country, city = ""] = label.split(",").map((part) => part.trim());
    return { country_code: country, city, online: false, label };
  });
}

function isProfessionalContext() {
  return ["SELF", "BOTH"].includes(state.answers.route) || state.answers.response_position === "PROFESSIONAL";
}
function noRecall() { return state.answers.memory_type === "NO_RECALL"; }
function hasDContext() { return values(state.answers.d_context_tags).some((value) => value !== "NONE"); }

function activeScreens() {
  return buildActiveScreens(state.answers);
}

function progressMeta(id) {
  const screens = activeScreens();
  const fixedIds = applicableFixedQuestionIds(state.answers);
  const depthStage = { DEPTH_M: 1, DEPTH_S: 2, DEPTH_D: 3 }[id];
  if (depthStage) {
    return {
      label: state.answers.depth_source === "openai" ? "DEPTH INTERVIEW · API" : "DEPTH INTERVIEW · APPROVED BANK",
      count: `${String(depthStage).padStart(2, "0")} / 03`,
      progress: Math.round(((fixedIds.length + depthStage) / (fixedIds.length + 3)) * 100),
    };
  }
  if (id === "REFLECTION_REVIEW" || id === "SUBMIT") {
    return {
      label: id === "REFLECTION_REVIEW" ? "PARTICIPANT REVIEW" : "FINAL SUBMISSION",
      count: id === "REFLECTION_REVIEW" ? "확인" : "READY",
      progress: 100,
    };
  }
  const currentIndex = screens.indexOf(id);
  const completedIds = screens.slice(0, currentIndex + 1).flatMap((screen) => fixedQuestionIdsForScreen(screen, state.answers));
  const count = completedIds.filter((questionId) => fixedIds.includes(questionId)).length;
  return {
    label: fixedQuestionIdsForScreen(id, state.answers).length ? "FIXED RESEARCH" : "RESEARCH CONTEXT",
    count: fixedQuestionIdsForScreen(id, state.answers).length ? `${String(Math.min(count, fixedIds.length)).padStart(2, "0")} / ${String(fixedIds.length).padStart(2, "0")}` : `${currentIndex + 1} / ${screens.length}`,
    progress: Math.round((Math.min(count, fixedIds.length) / (fixedIds.length + 3)) * 100),
  };
}

function dScope() {
  return normalizedDScope(state.answers);
}

function dOptions(kind) {
  const scope = dScope();
  if (scope === "SELF_ROLE") {
    const role = state.answers.role_primary;
    const bank = schema.role_question_bank?.[role];
    const labels = bank?.[kind === "gap" ? "d01_options" : "d02_options"];
    return (labels || []).map((label, index) => [`D${index + 1}`, label]);
  }
  return schema.d_scope_bank?.[scope]?.[kind] || [];
}

function roleOptions(groupCode) {
  return schema.roles.filter((role) => role.group === groupCode).map((role) => [role.value, role.label]);
}

function realityOptions() {
  const scope = dScope();
  const key = scope === "SELF_ROLE" ? state.answers.role_primary || "OTHER" : scope;
  const indicators = (schema.role_reality_indicator_bank?.[key] || schema.role_reality_indicator_bank?.OTHER || []).filter((label) => !/기타.*직접/.test(label));
  return indicators.map((label, index) => [`${key}_${String(index + 1).padStart(2, "0")}`, label]).concat([["NONE", "해당 없음"], ["OTHER", "기타"]]);
}

function renderChoices(id, options, { multi = false, max = 0, exclusive = [] } = {}) {
  const current = values(answerFor(id));
  const atMax = multi && max && current.length >= max;
  return `<div class="choice-list">${options.map((option) => {
    const value = optionValue(option);
    const selected = current.includes(value);
    const blocked = Boolean(atMax && !selected && !exclusive.includes(value));
    return `<button class="choice ${selected ? "selected" : ""} ${blocked ? "blocked" : ""}" type="button" data-choice-id="${esc(id)}" data-choice="${esc(value)}" data-multi="${multi}" data-max="${max}" data-exclusive="${esc(exclusive.join(","))}" aria-pressed="${selected}" aria-disabled="${blocked}"><span aria-hidden="true">${selected ? "✓" : ""}</span><strong>${esc(t(optionLabel(option)))}</strong></button>`;
  }).join("")}</div>`;
}

function renderText(id, { placeholder = "짧게 적어도 괜찮습니다.", multiline = true, label = "", field = "", value = undefined } = {}) {
  const inputId = `input-${id}-${field || "default"}`.replaceAll(".", "-");
  const currentValue = value === undefined ? answerFor(id) || "" : value;
  const fieldAttr = field ? ` data-input-field="${esc(field)}"` : "";
  const input = multiline
    ? `<textarea id="${esc(inputId)}" class="text-input" data-input-id="${esc(id)}"${fieldAttr} maxlength="800" placeholder="${esc(t(placeholder))}">${esc(currentValue)}</textarea>`
    : `<input id="${esc(inputId)}" class="text-input text-input-single" data-input-id="${esc(id)}"${fieldAttr} value="${esc(currentValue)}" placeholder="${esc(t(placeholder))}" />`;
  return `<div class="text-field">${label ? `<label class="text-field-label" for="${esc(inputId)}">${esc(t(label))}</label>` : ""}${input}${multiline ? `<span class="text-field-meta">${esc(t("최대 800자"))}</span>` : ""}</div>`;
}

function renderOtherInput(id, label = "기타 내용을 짧게 적어주세요.") {
  const item = question(id);
  const selected = values(answerFor(id));
  if (!selected.includes("OTHER")) return "";
  const field = item?.store?.[1];
  return field ? renderText(id, { multiline: false, label, field, value: state.answers[field] || "" }) : "";
}

function screenHeading(title, help = "") {
  return `<div class="interview-head"><div class="interview-copy"><div class="interview-kicker">PUBLIC MEMORY INTERVIEW · INSTITUTION RC1</div><h2 id="question-title" tabindex="-1">${esc(t(title))}</h2>${help ? `<p>${esc(t(help))}</p>` : ""}</div></div><div class="answer-panel">`;
}

function renderConsent() {
  return `${screenHeading("이 조사의 목적과 참여 방식을 확인해 주세요.", "기억은 사라진 이름과 장면을 다시 불러오는 시작입니다. Local Express Daegu가 설문과 응답을 관리하며, 연구 참여는 언제든 중단할 수 있습니다.")}
    <div class="v13-notice">${esc(question("RC03_INFO").text)}</div>
    ${renderChoices("RC01", [["YES", question("RC01").text]])}
    ${renderChoices("RC02", [["YES", question("RC02").text]])}`;
}

function renderRoute() {
  const q = question("P01");
  return `${screenHeading(q.text, "답변은 한 사람의 고정 유형이 아니라, 지금 이 기억과 경험이 만나는 한 시점을 기록합니다.")}${renderChoices("P01", q.options)}`;
}

function renderResponsePosition() {
  const q = question("P01_CONTEXT");
  return `${screenHeading(q.text, "기억의 위치를 함께 남기면, 뒤의 질문이 경험에 더 맞게 이어집니다.")}${renderChoices("P01_CONTEXT", q.options)}`;
}

function renderRoleGroup() {
  const q = question("P02G");
  return `${screenHeading(q.text, "직군은 연구 결과를 해석하기 위한 맥락입니다. 한 가지만 먼저 골라주세요.")}${renderChoices("P02G", q.options)}`;
}

function renderRolePrimary() {
  const group = state.answers.role_group_primary;
  const q = question("P02");
  return `${screenHeading(q.text, "현재 답변의 중심이 되는 역할을 선택해 주세요.")}${renderChoices("P02", [...roleOptions(group), ["OTHER", "기타"]])}${renderOtherInput("P02", "역할을 직접 적어주세요.")}`;
}

function renderRoleParallel() {
  const q = question("P03");
  const otherRoles = schema.roles.filter((role) => role.value !== state.answers.role_primary).map((role) => [role.value, role.label]);
  return `${screenHeading(q.text, "겸하는 역할이 없으면 ‘없음’을 선택해 주세요.")}${renderChoices("P03", [...otherRoles, ["NON_ARTS", "문화예술 외 역할"], ["NONE", "없음"], ["OTHER", "기타"]], { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("P03", "함께 적고 싶은 역할을 직접 적어주세요.")}`;
}

function renderActivity() {
  const p05 = question("P05");
  const p06 = question("P06");
  const p07 = question("P07");
  return `${screenHeading("활동의 시간과 현재 상태를 알려주세요.")}
    <label class="field-label">${esc(isProfessionalContext() ? p05.text_professional : p05.text_audience)}</label>${renderChoices("P05", p05.options)}
    ${state.answers.activity_duration_band ? renderText("P05_YEAR", { multiline: false, placeholder: "예: 2008", label: question("P05_YEAR").text }) : ""}
    ${isProfessionalContext() ? `<label class="field-label">${esc(p06.text)}</label>${renderChoices("P06", p06.options)}${state.answers.activity_state === "ROLE_CHANGED" ? `<label class="field-label">${esc(question("P04").text)}</label>${renderChoices("P04", [...schema.roles.map((role) => [role.value, role.label]), ["NON_ARTS", "문화예술 외 역할"], ["NONE", "없음"], ["OTHER", "기타"]], { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("P04", "이전 역할을 직접 적어주세요.")}` : ""}<label class="field-label">${esc(p07.text)}</label>${renderChoices("P07", p07.options)}` : ""}`;
}

function renderProfile() {
  const p08 = question("P08");
  const locations = values(state.answers.activity_locations).map((location) => location.label || location).join("; ");
  return `${screenHeading("지금의 생활과 활동 범위를 알려주세요.", "원하지 않는 항목은 건너뛸 수 있습니다.")}
    <label class="field-label">${esc(p08.text)}</label>${renderChoices("P08", p08.options)}
    ${renderText("P09_COUNTRY", { multiline: false, placeholder: "예: 대한민국", label: "현재 머무는 나라 (선택)", field: "residence_country_code", value: state.answers.residence_country_code || "" })}
    ${renderText("P09_CITY", { multiline: false, placeholder: "예: 대구", label: question("P09").text, field: "residence_city", value: state.answers.residence_city || "" })}
    ${renderText("P10", { multiline: false, placeholder: "예: KR,대구; 온라인", label: isProfessionalContext() ? question("P10").text_professional : question("P10").text_audience, value: locations })}`;
}

function renderMemoryType() {
  const q = question("M01");
  return `${screenHeading(q.text, "이름이나 연도가 선명하지 않아도 괜찮습니다. 남아 있는 장면 하나에서, 이야기를 천천히 시작해 주세요.")}${renderChoices("M01", q.options)}`;
}

function renderMemoryClue() {
  const q = question("M02");
  return `${screenHeading(q.text, q.help)}${renderText("M02", { placeholder: "한 단어, 이름 일부, 혹은 짧은 장면" })}`;
}

function renderBranch() {
  const q = question("M03");
  const type = state.answers.memory_type;
  const follow = schema.branch_followup?.[type];
  if (!follow) return `${screenHeading("기억의 단서를 조금 더 남겨주세요.")}${renderText("M02")}`;
  return `${screenHeading(follow.question)}${renderChoices("M03", follow.options)}`;
}

function renderMeaning() {
  const q = question("M04");
  return `${screenHeading(q.text)}${renderChoices("M04", q.options)}`;
}

function renderMeaningTags() {
  const q = question("M05");
  return `${screenHeading(q.text, "최대 두 가지까지 선택할 수 있습니다.")}${renderChoices("M05", q.options, { multi: true, max: 2 })}`;
}

function renderMemoryTime() {
  const q = question("M06");
  const locations = values(state.answers.memory_locations).map((location) => location.label || location).join("; ");
  return `${screenHeading(q.text)}${renderChoices("M06", q.options)}${state.answers.memory_time_band ? renderText("M06_YEAR", { multiline: false, placeholder: "기억나는 연도", label: "기억나는 연도가 있다면 적어주세요. (선택)" }) : ""}
  ${renderText("M07", { multiline: false, placeholder: "예: KR,대구; KR,서울; 온라인", label: question("M07").text, value: locations })}`;
}

function renderEvidence() {
  const m08 = question("M08");
  const m09 = question("M09");
  const m10 = question("M10");
  return `${screenHeading("이 기억의 경험과 관계를 알려주세요.")}
    <label class="field-label">${esc(m08.text)}</label>${renderChoices("M08", m08.options, { multi: true, max: 2 })}
    <label class="field-label">${esc(m09.text)}</label>${renderChoices("M09", m09.options)}
    <label class="field-label">${esc(m10.text)}</label>${renderChoices("M10", m10.options)}${renderOtherInput("M10", "경험 방식을 직접 적어주세요.")}`;
}

function renderD1() {
  const focus = question("D_FOCUS");
  const d01 = question("D01");
  const focusPart = state.answers.route === "BOTH" ? `<label class="field-label">${esc(focus.text)}</label>${renderChoices("D_FOCUS", focus.options)}` : "";
  const options = dOptions("gap");
  const scope = dScope();
  const title = scope === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d01 : scope === "MEMORY_RECONNECT" ? "지금 이 기억을 다시 만나기 위해, 가장 먼저 채워지면 좋겠다고 느끼는 것은 무엇인가요?" : scope === "AUDIENCE" ? "문화예술을 더 가까이 만나기 위해, 지금 가장 아쉽게 느껴지는 것은 무엇인가요?" : "지금 가장 먼저 살펴보고 싶은 조건은 무엇인가요?";
  return `${screenHeading("현재 가장 비어 있다고 느끼는 조건을 골라주세요.")}${focusPart}${dScope() ? `<label class="field-label">${esc(title || d01.text)}</label>${renderChoices("D01", options)}` : `<p class="error">변화의 초점을 먼저 선택해 주세요.</p>`}`;
}

function renderD2() {
  const d02 = question("D02");
  const options = dOptions("desired");
  const title = options.length && dScope() === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d02 : d02.text;
  return `${screenHeading("가장 먼저 바라는 변화를 골라주세요.")}
    <label class="field-label">${esc(title || d02.text)}</label>${renderChoices("D02", options)}`;
}

function renderD3() {
  const d03 = question("D03");
  const scope = dScope();
  const options = realityOptions();
  const title = scope === "SELF_ROLE" ? schema.role_question_bank[state.answers.role_primary]?.d03 : d03.text;
  return `${screenHeading("그 변화가 필요한 현실의 맥락을 골라주세요.", "지금 답변의 위치에 맞는 조건을 최대 세 가지까지 남길 수 있습니다.")}
    <label class="field-label">${esc(title || d03.text)}</label>${renderChoices("D03", options, { multi: true, max: 3, exclusive: ["NONE"] })}${renderOtherInput("D03", "현실의 맥락을 직접 적어주세요.")}`;
}

function renderD4() {
  const q = question("D04");
  return `${screenHeading(q.text, q.help)}${renderText("D04", { placeholder: "이 조건이 활동·기억·관계에 남긴 영향을 적어주세요." })}`;
}

function renderReconnect() {
  const q = question("R01");
  return `${screenHeading(q.text, "선택하지 않아도 됩니다.")}${renderChoices("R01", q.options, { multi: true, max: 2 })}`;
}

function renderCommunity() {
  const c00 = question("C00");
  const c01 = question("C01");
  const c02 = question("C02");
  const c03 = question("C03");
  const yes = state.answers.community_module_opt_in === "YES";
  return `${screenHeading("공동 기억 목록을 더 살펴볼까요?", "이 단계는 선택 사항입니다. 목록이 아직 확정되지 않았으므로, 이번 파일럿에서는 이름이나 단서를 직접 적는 방식으로만 확인합니다.")}
    ${renderChoices("C00", c00.options)}
    ${yes ? `${renderText("C01", { placeholder: "작가·작품·공간·장면, 또는 목록 밖에서 떠오르는 이름", label: c01.text })}<label class="field-label">${esc(c02.text)}</label>${renderChoices("C02", c02.options)}<label class="field-label">${esc(c03.text)}</label>${renderChoices("C03", c03.options, { multi: true, max: 2 })}` : ""}`;
}

function renderFixedCheckpoint() {
  const counts = flowCounts(activeScreens(), state.answers);
  const fallbackNotice = aiMode === "live" && aiFunctionUrl
    ? "다음부터는 앞선 응답을 바탕으로 만든 심화 질문이 세 번 이어집니다."
    : "현재는 승인된 질문은행에서 고른 심화 질문 세 개가 이어집니다.";
  const savingNotice = state.fixedCheckpointSaving
    ? "고정 설문 응답을 보존하고 심화 질문을 준비하고 있습니다. 잠시만 기다려 주세요."
    : "다음 버튼을 누르면 고정 설문 응답을 먼저 보존한 뒤 심화 질문으로 이동합니다.";
  return `${screenHeading(`이 경로의 고정 연구질문 ${counts.fixedResearchQuestions}개를 모두 살펴보았습니다.`, "동의, 역할 선택, 안내 화면은 연구질문 수에 포함하지 않았습니다.")}
    <div class="notice">${esc(fallbackNotice)} ${esc(savingNotice)} 이 단계에서 멈추더라도 지금까지의 답변은 이 기기에 보존됩니다.</div>`;
}

function depthQuestion(axis) {
  return values(state.answers.depth_plan).find((item) => item.axis === axis) || null;
}

function renderQuestionIntent(item) {
  const intent = item?.intent || "앞선 답변과 이어지는 경험의 한 층위를 확인합니다.";
  return `<section class="question-intent" aria-label="이 질문이 놓인 자리"><span>이 질문이 놓인 자리</span><p>${esc(intent)}</p></section>`;
}

function renderDepth(axis, index) {
  const item = depthQuestion(axis);
  if (!item) return `${screenHeading("심화 질문을 준비하고 있습니다.")}<div class="notice">질문을 불러오지 못하면 승인 질문은행으로 자동 전환됩니다.</div>`;
  const field = `depth_${axis.toLowerCase()}`;
  return `${screenHeading(item.prompt, `심화질문 ${index} / 3 · 한 가지를 고르고, 필요하면 짧은 설명을 덧붙여 주세요.`)}
    ${renderChoices(field, DEPTH_AXIS_OPTIONS[axis])}
    ${renderText(`${field}_text`, { field: `${field}_text`, value: state.answers[`${field}_text`] || "", placeholder: "선택의 배경이나 함께 남기고 싶은 맥락 (선택)", label: "덧붙일 말" })}
    ${renderQuestionIntent(item)}`;
}

function renderReflectionReview() {
  const summary = state.answers.depth_summary?.summary || "응답을 한 문장으로 정리하지 않았습니다.";
  const action = state.answers.reflection_action;
  return `${screenHeading("지금까지의 응답을 이렇게 읽었습니다.", "이 문장은 결과를 확정하는 판단이 아니라, 당신이 확인하고 고칠 수 있는 임시 정리입니다.")}
    <div class="reflection-summary"><span>${state.answers.depth_summary?.source === "openai" ? "API가 정리한 임시 문장" : "규칙으로 정리한 임시 문장"}</span><p>${esc(summary)}</p></div>
    ${renderChoices("reflection_action", [["ACCEPT", "이 뜻과 가까워요"], ["EDIT", "일부를 수정할게요"], ["OTHER_DIRECTION", "다른 방향에 가까워요"], ["DROP", "이 요약은 남기지 않을게요"]])}
    ${action === "EDIT" ? renderText("participant_revision", { field: "participant_revision", value: state.answers.participant_revision || "", placeholder: "당신의 말로 고쳐 적어주세요.", label: "참여자가 수정한 문장" }) : ""}
    ${action === "OTHER_DIRECTION" ? `<div class="axis-correction"><label class="field-label">중요하게 남은 의미</label>${renderChoices("participant_m", DEPTH_AXIS_OPTIONS.M.slice(0, 4))}<label class="field-label">현재의 움직임</label>${renderChoices("participant_s", DEPTH_AXIS_OPTIONS.S.slice(0, 4))}<label class="field-label">변화가 필요한 자리</label>${renderChoices("participant_d", DEPTH_AXIS_OPTIONS.D.slice(0, 4))}</div>` : ""}
    ${renderQuestionIntent({ intent: "임시 해석을 참여자가 직접 승인하거나 수정하고, 남기지 않을 권리를 확인하는 자리입니다." })}`;
}

function renderSubmit() {
  const storageNotice = submitFunctionUrl
    ? "제출하면 연구 응답은 RC1 연구 저장소에 전송되며, 실패할 경우 이 기기의 재전송 대기열에 보관됩니다."
    : googleAppsScriptUrl ? "제출하면 연구 응답은 Google Sheets에 전송되며, 이 기기에도 사본이 남습니다." : "원격 저장소 설정 전에는 이 기기의 재전송 대기열과 JSON 사본으로 보존됩니다.";
  return `${screenHeading("연구 응답을 제출할 준비가 되었습니다.", storageNotice)}
    <div class="notice">연구 응답은 관계 참여나 연락처 입력보다 먼저 확정 저장됩니다. 관계 참여를 선택하지 않아도 결과 확인과 연구 제출에는 영향을 주지 않습니다.</div>`;
}

function screenBody(id) {
  return ({ CONSENT: renderConsent, P01: renderRoute, P01_CONTEXT: renderResponsePosition, ROLE_GROUP: renderRoleGroup, ROLE_PRIMARY: renderRolePrimary, ROLE_PARALLEL: renderRoleParallel, ACTIVITY: renderActivity, PROFILE: renderProfile, M01: renderMemoryType, M02: renderMemoryClue, M03: renderBranch, M04: renderMeaning, M05: renderMeaningTags, MEMORY_TIME: renderMemoryTime, MEMORY_EVIDENCE: renderEvidence, D01: renderD1, D02: renderD2, D03: renderD3, D04: renderD4, R01: renderReconnect, COMMUNITY: renderCommunity, FIXED_CHECKPOINT: renderFixedCheckpoint, DEPTH_M: () => renderDepth("M", 1), DEPTH_S: () => renderDepth("S", 2), DEPTH_D: () => renderDepth("D", 3), REFLECTION_REVIEW: renderReflectionReview, SUBMIT: renderSubmit })[id]();
}

function canContinue(id) {
  if (id === "CONSENT") return Boolean(answerFor("RC01") && answerFor("RC02"));
  if (id === "P01") return Boolean(state.answers.route);
  if (id === "P01_CONTEXT") return Boolean(state.answers.response_position);
  if (id === "ROLE_GROUP") return Boolean(state.answers.role_group_primary);
  if (id === "ROLE_PRIMARY") return Boolean(state.answers.role_primary);
  if (id === "M01") return Boolean(state.answers.memory_type);
  if (id === "M02") return Boolean(state.answers.memory_clue_text?.trim());
  if (id === "M04") return Boolean(state.answers.m_declared);
  if (id === "D01") return Boolean(state.answers.d_current_gap);
  if (id === "D02") return Boolean(state.answers.d_desired_change_primary);
  if (id === "DEPTH_M") return Boolean(state.answers.depth_m);
  if (id === "DEPTH_S") return Boolean(state.answers.depth_s);
  if (id === "DEPTH_D") return Boolean(state.answers.depth_d);
  if (id === "REFLECTION_REVIEW") {
    if (!state.answers.reflection_action) return false;
    if (state.answers.reflection_action === "EDIT") return Boolean(state.answers.participant_revision?.trim());
    if (state.answers.reflection_action === "OTHER_DIRECTION") return Boolean(state.answers.participant_m && state.answers.participant_s && state.answers.participant_d);
  }
  return true;
}

function createResponse(submissionPhase = "final") {
  const cleanedAnswers = sanitizeAnswersForRoute(state.answers);
  const rawAnswers = Object.entries(cleanedAnswers).map(([field, answer]) => ({ field, answer }));
  const snapshots = buildCoordinateSnapshots(cleanedAnswers);
  const finalSnapshot = snapshots.participant_final || snapshots.research_derived;
  const directLabels = Object.fromEntries([...DEPTH_AXIS_OPTIONS.M, ...DEPTH_AXIS_OPTIONS.S, ...DEPTH_AXIS_OPTIONS.D]);
  const directText = cleanedAnswers.participant_m && cleanedAnswers.participant_s && cleanedAnswers.participant_d
    ? `이번 응답에서 중요하게 남은 의미는 ${directLabels[cleanedAnswers.participant_m]}에 가깝고, 현재는 ${directLabels[cleanedAnswers.participant_s]}이며, 다음 변화는 ${directLabels[cleanedAnswers.participant_d]}에서 먼저 필요합니다.`
    : null;
  const approvedText = cleanedAnswers.reflection_action === "ACCEPT"
    ? cleanedAnswers.depth_summary?.summary || null
    : cleanedAnswers.reflection_action === "EDIT"
      ? cleanedAnswers.participant_revision?.trim() || null
      : cleanedAnswers.reflection_action === "OTHER_DIRECTION" ? directText : cleanedAnswers.reflection_action === "DROP" ? null : cleanedAnswers.depth_summary?.summary || null;
  const fixedQuestionIds = applicableFixedQuestionIds(cleanedAnswers);
  const coordinateScope = deriveCoordinateScope(cleanedAnswers);
  const sContextTags = deriveSContextTags(cleanedAnswers);
  return {
    response_id: state.responseId || `V13-${crypto.randomUUID()}`,
    payload_version: "over39-rc1-payload-1",
    questionnaire_version: schema.questionnaire_version,
    schema_version: schema.schema_version,
    grid_version: schema.versioning.grid_version,
    consent_version: schema.versioning.consent_version,
    classification_version: "m-s-d-coordinate-rc1",
    submission_phase: submissionPhase,
    submitted_at: new Date().toISOString(),
    source_language: state.language,
    route: cleanedAnswers.route,
    sample_type: sampleType,
    institution_code: institutionCode || null,
    acquisition_source: acquisitionSource,
    rc1_version: "rc1-2026-08-03",
    include_in_policy_statistics: sampleType === "research",
    coordinate_scope: coordinateScope,
    coordinate_subject: finalSnapshot.coordinate_subject,
    coordinate_status: finalSnapshot.status,
    coordinate_number: finalSnapshot.coordinate_number,
    coordinate_candidate: finalSnapshot.coordinate_candidate,
    axes: {
      m_declared: cleanedAnswers.m_declared || null,
      m_support_tags: values(cleanedAnswers.m_support_tags),
      d_current_gap: cleanedAnswers.d_current_gap || null,
      d_desired_change_primary: cleanedAnswers.d_desired_change_primary || null,
      d_context_tags: values(cleanedAnswers.d_context_tags),
      m_primary: finalSnapshot.m_primary,
      s_primary: finalSnapshot.s_primary,
      d_primary: finalSnapshot.d_primary,
      s_context_tags: sContextTags,
    },
    answers: cleanedAnswers,
    raw_answers: rawAnswers,
    fixed_questions: fixedQuestionIds.map((id) => ({ id, ...QUESTION_METADATA[id], answer: cleanedAnswers[storedField(question(id)) || id] ?? null })),
    fixed_question_count: fixedQuestionIds.length,
    depth_question_count: 3,
    depth_interview: {
      source: cleanedAnswers.depth_source || "approved_question_bank",
      questions: values(cleanedAnswers.depth_plan),
      answers: ["M", "S", "D"].map((axis) => ({ axis, value: cleanedAnswers[`depth_${axis.toLowerCase()}`] || null, text: cleanedAnswers[`depth_${axis.toLowerCase()}_text`]?.trim() || null })),
    },
    api_runs: values(cleanedAnswers.depth_ai_runs),
    reflection: {
      api_or_rule_summary: cleanedAnswers.depth_summary?.summary || null,
      summary_source: cleanedAnswers.depth_summary?.source || null,
      participant_action: cleanedAnswers.reflection_action || null,
      participant_revision: cleanedAnswers.participant_revision?.trim() || null,
      participant_approved_text: approvedText,
      public_approved: Boolean(approvedText && cleanedAnswers.reflection_action !== "DROP"),
    },
    coordinate_snapshots: snapshots,
    consent: {
      research: cleanedAnswers.research_consent === "YES",
      data_processing: cleanedAnswers.data_processing_consent === "YES",
      consent_version: schema.versioning.consent_version,
    },
    outbox_count: readOutbox().length,
  };
}

async function requestResearchStorage(response) {
  if (submitFunctionUrl) {
    return sendEnvelope(createEnvelope(response.submission_phase === "fixed_complete" ? "fixed_snapshot" : "research_submission", response), {
      endpoint: submitFunctionUrl,
      anonKey: supabaseAnonKey,
    });
  }
  if (!googleAppsScriptUrl) return sendEnvelope(createEnvelope("research_submission", response), {});
  try {
    await fetch(googleAppsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(response),
    });
    return await verifyResearchStorage(response.response_id);
  } catch (error) {
    console.warn("Research storage request failed", error);
    return { status: "failed" };
  }
}

async function verifyResearchStorage(responseId) {
  if (submitFunctionUrl) {
    const queued = readOutbox().some((item) => item.payload?.response_id === responseId);
    return { status: queued ? "unverified" : "confirmed" };
  }
  if (!googleAppsScriptUrl) return { status: "local_only" };
  try {
    const receiptUrl = new URL(googleAppsScriptUrl);
    receiptUrl.searchParams.set("submission_id", responseId);
    const response = await fetch(receiptUrl, { method: "GET", cache: "no-store" });
    if (!response.ok) return { status: "unverified" };
    const receipt = await response.json();
    return receipt.ok && receipt.exists ? { status: "confirmed" } : { status: "unverified" };
  } catch (error) {
    console.warn("Research storage verification unavailable", error);
    return { status: "unverified" };
  }
}

function creditBlock() {
  return `<section class="credit-block" aria-label="Credit hierarchy">${creditRows.map(([role, name]) => `<div class="credit-row"><span>${esc(role)}</span><strong>${esc(name)}</strong></div>`).join("")}</section>`;
}

function header() {
  return `<header class="topbar" aria-label="Site header"><div class="brand"><span class="brand-mark">LED</span><span>Local Express Daegu</span></div><div class="topbar-project"><span>PUBLIC MEMORY RESEARCH · RC1</span><strong>〈만 39세 이상〉</strong></div><div class="language-switch" aria-label="Language selector">${languages.map(([code, label]) => `<button type="button" data-lang="${code}" class="${state.language === code ? "active" : ""}" aria-pressed="${state.language === code}">${label}</button>`).join("")}</div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="footer-project"><strong>〈만 39세 이상〉</strong><span>PUBLIC MEMORY RESEARCH · INSTITUTION RC1</span><a href="mailto:${researchContactEmail}">${researchContactEmail}</a></div><div class="footer-credits">${creditRows.map(([role, name]) => `<span><em>${esc(role)}</em>${esc(name)}</span>`).join("")}</div></footer>`;
}

function renderAnalysisCard(response) {
  const profile = buildConnectionProfile(response, getConnection());
  const insight = profile.coordinate;
  if (!insight) {
    return `<section class="analysis-card analysis-card-pending"><div class="analysis-card-label">BETA ANALYSIS</div><h2>이번 응답의 연결 지도를 준비하고 있습니다.</h2><p>기억의 의미, 현재 흐름, 먼저 바라는 변화를 모두 확인하면 연결 위치를 더 구체적으로 보여드립니다.</p></section>`;
  }
  const approvedText = response.reflection?.participant_approved_text;
  const scopeLabel = COORDINATE_SCOPE_LABELS[response.coordinate_scope] || COORDINATE_SCOPE_LABELS.art_relationship;
  return `<section class="analysis-card"><div class="analysis-card-head"><span>RESPONSE EPISODE · PARTICIPANT REVIEWED</span></div><p class="analysis-scope">이번 결과가 읽는 범위 · <strong>${esc(scopeLabel)}</strong></p><h2>${esc(insight.title)}</h2>${approvedText ? `<p>${esc(approvedText)}</p>` : `<p>${esc(insight.description)}</p>`}<div class="axis-strip"><div><span>남아 있는 의미</span><strong>${esc(insight.axes.m.label)}</strong></div><div><span>응답자의 현재 흐름</span><strong>${esc(insight.axes.s.label)}</strong></div><div><span>먼저 바라는 변화</span><strong>${esc(insight.axes.d.label)}</strong></div></div><p class="analysis-disclaimer">이 위치는 기억 속 인물이나 참여자의 가치·자격을 평가하지 않습니다. 이번 응답에서 드러난 관계와 현재 조건을 한 시점의 리서치 지도로 정리한 결과이며, 내부 좌표 번호는 연구 관리 화면에서만 사용합니다.</p></section>`;
}

function renderConnectionChoices(field, options, { multi = false, max = 0 } = {}) {
  const connection = getConnection();
  const selected = values(connection[field]);
  return `<div class="choice-list connection-choice-list">${options.map(([value, label, help]) => {
    const active = multi ? selected.includes(value) : connection[field] === value;
    return `<button type="button" class="choice ${active ? "selected" : ""}" data-connection-field="${esc(field)}" data-connection-value="${esc(value)}" data-connection-multi="${multi}" data-connection-max="${max}" aria-pressed="${active}"><span class="choice-mark" aria-hidden="true">${active ? "✓" : ""}</span><div class="connection-choice-copy"><strong>${esc(label)}</strong>${help ? `<small>${esc(help)}</small>` : ""}</div></button>`;
  }).join("")}</div>`;
}

function connectionCanSave() {
  const connection = getConnection();
  if (!["YES", "NO"].includes(connection.opt_in)) return false;
  if (connection.opt_in !== "YES") return true;
  if (!values(connection.needs).length && !values(connection.offers).length) return false;
  return !values(connection.reply_modes).includes("EMAIL_NOTICE") || Boolean(connection.contact_email?.trim()) && connection.contact_permission === "YES";
}

function createConnectionUpdate() {
  const research = state.submitted || createResponse();
  const connection = getConnection();
  const profile = buildConnectionProfile(research, connection);
  const emailAllowed = values(connection.reply_modes).includes("EMAIL_NOTICE") && connection.contact_permission === "YES" && connection.contact_email?.trim();
  return {
    ...research,
    submission_phase: "connection_update",
    submitted_at: new Date().toISOString(),
    connection_profile: profile,
    pii: emailAllowed ? {
      email: connection.contact_email.trim(),
      display_name: "",
      role_label: profile.role,
      contact_reason: "mediated_connection_notice",
      consent_scope: ["follow_up_contact", "mediated_connection"],
    } : null,
  };
}

function renderConnection() {
  const connection = getConnection();
  const response = state.submitted || createResponse();
  const profile = buildConnectionProfile(response, connection);
  const topicOptions = Object.entries(connectionTopics).map(([value, label]) => [value, label]);
  const modeOptions = [["MEDIATED_WEB", "연구팀이 익명 안부 또는 질문을 중계", "이메일과 연락처는 상대에게 공개하지 않습니다."], ["EMAIL_NOTICE", "매칭 제안이 오면 이메일 알림 받기", "이메일은 연구팀의 연락 담당자만 확인합니다."]];
  const connectionStatusLabel = connection.opt_in === "YES" ? "연결 의향 작성 중" : connection.opt_in === "NO" ? "연구 응답만 보관" : "선택 전";
  return `<main class="connection-layout"><section class="connection-main"><div class="archive-label">CONNECTION LAYER · OPTIONAL</div><h1 tabindex="-1">이 응답에서 시작할 수 있는 대화를 열어둘까요?</h1><p class="connection-lead">AI는 누군가의 가치나 적합성을 판정하지 않습니다. 응답의 맥락과 연결 의향을 정리해 연구자에게 후보를 제안하고, 실제 연결은 양쪽의 선택과 연구팀의 검토 뒤에만 이루어집니다.</p>${renderAnalysisCard(response)}<section class="connection-section"><h2>다른 참여자와의 연결을 검토해도 될까요?</h2>${renderConnectionChoices("opt_in", [["YES", "네, 연구팀의 연결 제안을 받아보고 싶습니다"], ["NO", "아니요, 이번에는 연구 응답만 남기겠습니다"]])}</section>${connection.opt_in === "YES" ? `<section class="connection-section"><h2>지금 필요한 대화나 연결은 무엇인가요?</h2><p>최대 세 가지까지 고를 수 있습니다. 이 선택은 매칭 후보를 찾기 위한 단서일 뿐, 자동 연결을 뜻하지는 않습니다.</p>${renderConnectionChoices("needs", topicOptions, { multi: true, max: 3 })}</section><section class="connection-section"><h2>다른 참여자에게 나눌 수 있는 경험이나 관점이 있나요?</h2><p>전문 서비스나 약속이 아니라, 대화에서 나눌 수 있는 관심과 경험의 범위입니다.</p>${renderConnectionChoices("offers", topicOptions, { multi: true, max: 3 })}</section><section class="connection-section"><h2>어떤 방식이 편한가요?</h2>${renderConnectionChoices("reply_modes", modeOptions, { multi: true, max: 2 })}${values(connection.reply_modes).includes("EMAIL_NOTICE") ? `<label class="field-label" for="connection-email">후속 안내를 받을 이메일</label><input id="connection-email" class="text-input text-input-single" type="email" data-connection-input="contact_email" value="${esc(connection.contact_email)}" placeholder="name@example.com" /><div class="connection-consent">${renderConnectionChoices("contact_permission", [["YES", "이 이메일을 연구팀의 매칭 안내용으로 별도 보관하는 데 동의합니다"], ["NO", "이메일을 남기지 않겠습니다"]])}</div>` : ""}</section><section class="connection-section"><h2>연결 카드에 남길 한 줄이 있나요?</h2><p>활동명, 실명, 세부 연락처, 제3자 정보는 적지 않아도 됩니다. 연구팀 검토용이며, 다른 참여자에게 자동 공개되지 않습니다.</p><textarea class="text-input" data-connection-input="introduction" maxlength="400" placeholder="지금 나누고 싶은 질문, 현장, 작업의 조건을 짧게 적어주세요.">${esc(connection.introduction)}</textarea></section><section class="connection-section connection-safety"><h2>연결은 어떻게 이루어지나요?</h2><p>동의한 응답만 검토합니다. 연구팀은 매칭 이유와 공개 범위를 먼저 확인하고, 양쪽이 수락한 뒤에만 안부나 질문을 중계합니다. 자동으로 이메일이나 연락처를 서로 공개하지 않습니다.</p></section>` : ""}</section><aside class="connection-side"><div class="panel-title">CONNECTION STATUS</div><strong>${connectionStatusLabel}</strong><p>${profile.coordinate ? `${esc(profile.coordinate.shortTitle)} 위치를 출발점으로, 필요와 제안이 맞닿는 다른 응답을 연구자가 검토합니다.` : "분석 위치가 정리된 뒤 연결 후보를 검토할 수 있습니다."}</p><button class="primary-button wide-button" type="button" data-action="save-connection" ${connectionCanSave() ? "" : "disabled"}>연결 의향 저장 <span aria-hidden="true">→</span></button><button class="secondary-button wide-button" type="button" data-action="back-to-result">결과로 돌아가기</button><p class="connection-local-status">${state.connectionStatus === "confirmed" ? "연구용 저장소에 연결 의향을 저장했습니다." : submitFunctionUrl ? "저장 뒤 연구팀 검토 상태로 전환됩니다." : "원격 저장소 설정 전에는 이 기기의 재전송 대기열에 보관됩니다."}</p></aside></main>`;
}

function renderComplete() {
  const response = state.submitted;
  const status = state.submissionStatus || "local_only";
  const statusCopy = status === "confirmed"
    ? "RC1 연구 저장소에 응답이 저장되었습니다. 같은 제출은 중복으로 기록되지 않습니다."
    : status === "sending"
      ? "연구용 저장소에 전송하고 있습니다. 이 화면을 잠시 유지해 주세요."
      : status === "unverified"
        ? "전송 요청은 보냈지만 저장 여부를 자동으로 확인하지 못했습니다. 응답 사본은 이 기기에 남아 있습니다."
    : status === "failed"
      ? "연구용 저장소에 연결하지 못했습니다. 응답 사본은 이 기기에 남아 있으며, 다시 보내거나 JSON으로 보관할 수 있습니다."
      : "원격 저장소 설정 전이라 응답을 이 기기의 재전송 대기열에 보관했습니다. JSON 파일로도 내려받을 수 있습니다.";
  const statusClass = ["failed", "unverified"].includes(status) ? "failed" : status === "sending" ? "sending" : "";
  const retryButton = ["failed", "unverified"].includes(status) ? `<button class="secondary-button" type="button" data-action="resend">저장 다시 확인</button>` : "";
  const connection = getConnection();
  const analysisStatus = response.coordinate_status === "complete"
    ? "분석 좌표 정리됨"
    : response.coordinate_status === "mixed"
      ? "복합 응답으로 기록됨"
      : response.coordinate_status === "insufficient"
        ? "분석을 위한 단서가 더 필요함"
        : "베타 연결 좌표";
  const connectionCopy = connection.opt_in === "YES" ? "연결 의향을 남겼습니다. 연구팀 검토 뒤에만 다음 대화가 제안됩니다." : "이 응답을 바탕으로, 다른 지역과 역할의 참여자에게 건넬 수 있는 다음 대화를 선택할 수 있습니다.";
  const feedbackButton = sampleType === "institution_review" ? `<button class="secondary-button" type="button" data-action="institution-feedback">기관 검토 피드백</button>` : "";
  return `<main class="complete-grid"><section class="memory-card"><div class="card-header"><span>PUBLIC MEMORY RECORD</span><strong>${esc(response.response_id)}</strong></div><h1>공공 기억 기록</h1><p class="certificate-copy">응답을 기록했습니다. 연구 응답을 먼저 보존한 뒤에만, 원한다면 별도의 연결 의향을 남길 수 있습니다.</p><div class="submit-status ${statusClass}">${esc(statusCopy)}</div>${renderAnalysisCard(response)}<div class="connection-next"><strong>다음 대화의 가능성</strong><p>${esc(connectionCopy)}</p><button class="primary-button" type="button" data-action="connection">연결 의향 살펴보기 <span aria-hidden="true">→</span></button></div><dl><div><dt>RESPONSE ID</dt><dd>${esc(response.response_id)}</dd></div><div><dt>ROUTE</dt><dd>${esc(response.route || "—")}</dd></div><div><dt>MEMORY TYPE</dt><dd>${esc(response.answers.memory_type || "—")}</dd></div><div><dt>ANALYSIS STATUS</dt><dd>${esc(analysisStatus)}</dd></div></dl><div class="export-actions"><button class="secondary-button" type="button" data-action="download">JSON 저장</button>${retryButton}${feedbackButton}<button class="primary-button" type="button" data-action="restart">새 기억 입력</button></div></section></main>`;
}

function renderFeedbackChoices(field, options) {
  return `<div class="choice-list compact-choices">${options.map(([value, label]) => {
    const selected = state.feedback[field] === value;
    return `<button class="choice ${selected ? "selected" : ""}" type="button" data-feedback-field="${esc(field)}" data-feedback-value="${esc(value)}" aria-pressed="${selected}"><span aria-hidden="true">${selected ? "✓" : ""}</span><strong>${esc(label)}</strong></button>`;
  }).join("")}</div>`;
}

function feedbackCanSubmit() {
  return ["flow_clarity", "role_fit", "duration", "depth_repeat", "opened_thought", "felt_leading", "result_fit", "revision_clarity", "consent_separation", "share_readiness", "link_to_response"].every((field) => state.feedback[field]);
}

function renderInstitutionFeedback() {
  const scale = [["1", "전혀 그렇지 않다"], ["2", "그렇지 않은 편"], ["3", "보통"], ["4", "그런 편"], ["5", "매우 그렇다"]];
  const yesNo = [["YES", "예"], ["NO", "아니요"], ["UNSURE", "잘 모르겠다"]];
  const rows = [
    ["flow_clarity", "질문의 전체 흐름을 이해하기 쉬웠나요?", scale],
    ["role_fit", "선택한 역할에 질문이 잘 맞았나요?", scale],
    ["duration", "전체 소요시간은 어떠했나요?", [["SHORT", "짧았다"], ["RIGHT", "적당했다"], ["LONG", "길었다"]]],
    ["depth_repeat", "심화질문이 앞의 질문을 반복한다고 느꼈나요?", yesNo],
    ["opened_thought", "질문이 새로운 생각이나 경험을 열어 주었나요?", scale],
    ["felt_leading", "특정 답을 유도한다고 느꼈나요?", yesNo],
    ["result_fit", "최종 결과가 자신의 응답과 가까웠나요?", scale],
    ["revision_clarity", "결과를 수정하거나 남기지 않는 기능을 이해했나요?", yesNo],
    ["consent_separation", "연구 동의와 관계 참여 동의의 차이를 이해했나요?", yesNo],
    ["share_readiness", "기관 구성원에게 전달할 수 있는 수준인가요?", scale],
  ];
  return `<main class="feedback-layout"><section class="feedback-main"><div class="archive-label">INSTITUTION RC1 REVIEW · ${esc(institutionCode || "UNASSIGNED")}</div><h1 tabindex="-1">기관 사전검증 의견을 들려주세요.</h1><p class="connection-lead">이 피드백은 실제 연구 통계와 분리해 저장됩니다. 마지막 선택에서 동의한 경우에만 방금 제출한 연구응답과 함께 검토합니다.</p>${rows.map(([field, title, options], index) => `<section class="feedback-question"><span>${String(index + 1).padStart(2, "0")}</span><h2>${esc(title)}</h2>${renderFeedbackChoices(field, options)}</section>`).join("")}${renderText("feedback_must_fix", { field: "feedback_must_fix", value: state.feedback.must_fix || "", label: "공개 전에 반드시 고칠 부분", placeholder: "없다면 ‘없음’이라고 적어주세요." })}${renderText("feedback_other", { field: "feedback_other", value: state.feedback.other || "", label: "기타 의견 (선택)", placeholder: "질문, 디자인, 운영 방식에 대한 의견" })}<section class="feedback-question"><span>11</span><h2>이 피드백을 방금 제출한 응답과 함께 검토해도 될까요?</h2><p>동의하지 않으면 기관 피드백만 별도로 보관합니다.</p>${renderFeedbackChoices("link_to_response", [["YES", "네, 방금 응답과 함께 검토해도 됩니다"], ["NO", "아니요, 피드백만 따로 남깁니다"]])}</section><div class="survey-actions"><button class="secondary-button" type="button" data-action="back-to-result">결과로 돌아가기</button><button class="primary-button" type="button" data-action="submit-feedback" ${feedbackCanSubmit() ? "" : "disabled"}>기관 피드백 제출 <span aria-hidden="true">→</span></button></div></section></main>`;
}

function renderSurvey() {
  const screens = activeScreens();
  state.step = Math.min(state.step, screens.length - 1);
  const id = screens[state.step];
  const meta = progressMeta(id);
  const nextLabel = id === "SUBMIT" ? "연구 응답 제출" : id === "FIXED_CHECKPOINT" ? "심화 질문 3개 시작" : id === "DEPTH_D" && state.summaryGenerating ? "정리 중" : "다음";
  const nextDisabled = !canContinue(id) || state.fixedCheckpointSaving || state.summaryGenerating;
  return `<main class="interview-layout"><section class="interview-panel" aria-live="polite" aria-labelledby="question-title"><div class="progress-track" role="progressbar" aria-label="Survey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${meta.progress}"><span style="width:${meta.progress}%"></span></div><div class="interview-meta"><span>${esc(meta.label)}</span><strong>${esc(meta.count)}</strong></div>${screenBody(id)}</div><div class="survey-actions"><button class="secondary-button" type="button" data-action="back" ${state.step === 0 || state.fixedCheckpointSaving ? "disabled" : ""}><span aria-hidden="true">←</span> 이전</button><span></span><button class="primary-button" type="button" data-action="next" ${nextDisabled ? "disabled" : ""}>${nextLabel} <span aria-hidden="true">→</span></button></div><div class="draft-status" role="status"><span></span>이 기기에 임시 저장됨</div></section></main>`;
}

function researchJourney() {
  return `<section class="research-journey" aria-label="리서치 흐름">
    <div class="journey-heading"><span>THIS INTERVIEW HAS THREE MOVEMENTS</span><strong>기억은 기록이 되고, 기록은 다음 대화의 단서가 됩니다.</strong></div>
    <div class="journey-steps">
      <div><span>01</span><strong>기억의 단서</strong><p>작가, 공간, 전시, 장면 또는 남아 있는 감각에서 시작합니다.</p></div>
      <div><span>02</span><strong>조금 더 깊이</strong><p>현재의 조건과 바라는 변화를 묻고, 마지막에 짧은 심화 질문 3개가 이어집니다.</p></div>
      <div><span>03</span><strong>다음 대화의 가능성</strong><p>응답을 제출한 뒤에만, 원할 경우 연구팀의 연결 제안을 받아볼 수 있습니다.</p></div>
    </div>
    <div class="journey-meta"><span><strong>약 8-12분</strong><em>한 화면에 한 질문씩</em></span><span><strong>경로별 질문</strong><em>선택과 답변에 따라 달라집니다</em></span><span><strong>심화 질문 3개</strong><em>마지막에 의미·움직임·변화 확인</em></span></div>
  </section>`;
}

function renderIntro() {
  const draft = loadDraft();
  const pending = loadPending();
  const institutionLine = institutionCode ? `<div class="institution-invite"><span>INVITED REVIEW</span><strong>${esc(institutionCode)}</strong><p>이 링크의 응답은 기관 사전검증 자료로 분리 저장됩니다.</p></div>` : "";
  return `<main class="intro-grid"><section class="intro-main"><div class="archive-label">PUBLIC MEMORY RESEARCH · 2026 / OVER 39</div><h1 tabindex="-1">누가 이 작가를 기억하는가.</h1><div class="project-lockup"><p class="project-title">〈만 39세 이상〉</p><span>대구 시각예술 기억 수집과 창작 지속 조건 인식조사</span></div><p class="intro-copy">사라진 이름과 장면을 다시 불러오고, 지금의 조건을 함께 살핍니다. 이곳에 남긴 기억은 누군가를 판단하는 자료가 아니라, 아직 이어지지 않은 대화를 발견하기 위한 단서가 됩니다.</p>${institutionLine}${researchJourney()}<div class="intro-actions"><button class="primary-button" type="button" data-action="notice">리서치 흐름 보기 <span aria-hidden="true">→</span></button>${draft ? `<button class="secondary-button" type="button" data-action="resume">작성 이어가기</button>` : ""}${pending ? `<button class="secondary-button" type="button" data-action="recover-pending">이전 제출 상태 확인</button>` : ""}<span>ONE QUESTION AT A TIME · INSTITUTION RC1</span></div></section><aside class="intro-side"><div class="side-label"><span>ARCHIVE NOTE</span><strong>01</strong></div><p>이름이나 연도가 선명하지 않아도 괜찮습니다. 남아 있는 장면 하나와 지금의 경험에서, 이야기를 천천히 시작해 주세요.</p><div class="certificate-mini"><div><span>duration</span><strong>약 8-12분</strong></div><div><span>questions</span><strong>경로별 질문 + 심화 3개</strong></div><div><span>connection</span><strong>제출 뒤 선택 참여</strong></div><div><span>version</span><strong>RC1</strong></div></div>${creditBlock()}</aside></main>`;
}

function renderNotice() {
  const deliveryNotice = submitFunctionUrl
    ? "연구 응답은 관계 참여보다 먼저 RC1 연구 저장소에 보존합니다."
    : "원격 저장소 설정 전에는 응답을 이 기기의 재전송 대기열에 보관합니다.";
  return `<main class="notice-layout"><section class="notice-main"><div class="archive-label">응답 전 안내</div><h1 tabindex="-1">기억은 사라진 이름과 장면을 다시 불러오는 시작입니다.</h1><p>이 조사는 작가나 참여자를 평가하거나 즉시 선정하는 절차가 아닙니다. Local Express Daegu가 설문과 응답을 관리하며, 공개 활용과 연락처 제공은 별도 단계에서 분리해 다룹니다.</p><div class="notice-list"><div><span>01</span><strong>기억에서 시작</strong><p>정확하지 않은 단서도 연구의 시작점이 될 수 있습니다.</p></div><div><span>02</span><strong>경로에 맞는 질문</strong><p>선택한 경로와 답변에 따라 질문 수가 달라지며, 마지막에는 세 개의 심화질문이 이어집니다.</p></div><div><span>03</span><strong>제출 뒤, 선택할 수 있는 연결</strong><p>연결 의향은 선택 사항입니다. AI는 판단자가 아니라 대화의 단서를 정리하는 보조 장치입니다.</p></div></div></section><aside class="notice-side"><div class="panel-title">RESEARCH NOTICE</div><p class="notice-assurance">${esc(deliveryNotice)} 연락처와 관계 참여는 연구 응답과 분리해 다룹니다.</p><p class="notice-assurance">문의 · <a href="mailto:${researchContactEmail}">${researchContactEmail}</a></p><button class="primary-button wide-button" type="button" data-action="start">약 8-12분, 시작하기 <span aria-hidden="true">→</span></button></aside></main>`;
}

function render(focusHeading = false) {
  const scrollPosition = { x: window.scrollX, y: window.scrollY };
  document.documentElement.lang = state.language === "zh" ? "zh-Hant" : state.language;
  const content = state.phase === "loading" ? "<main class='interview-layout'>불러오는 중입니다.</main>" : state.phase === "intro" ? renderIntro() : state.phase === "notice" ? renderNotice() : state.phase === "complete" ? renderComplete() : state.phase === "connection" ? renderConnection() : state.phase === "feedback" ? renderInstitutionFeedback() : renderSurvey();
  root.innerHTML = `<div class="site-shell phase-${esc(state.phase)}">${header()}${content}${footer()}</div>`;
  requestAnimationFrame(() => {
    if (focusHeading) document.querySelector("h1[tabindex='-1'], h2[tabindex='-1']")?.focus({ preventScroll: true });
    else {
      const restoreScroll = () => window.scrollTo({ left: scrollPosition.x, top: scrollPosition.y, behavior: "auto" });
      restoreScroll();
      requestAnimationFrame(restoreScroll);
      window.setTimeout(restoreScroll, 0);
    }
  });
}

function changeChoice(id, value, multi, max, exclusive) {
  const item = question(id);
  const field = storedField(item) || id;
  if (!multi) {
    if (id === "P01") state.answers = resetForRouteChange(state.answers, value);
    else state.answers[field] = value;
    if (["P01_CONTEXT", "P02G", "P02", "P03", "P04", "P05", "P06", "P07", "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "D_FOCUS", "D01", "D02", "D03", "D04", "R01", "C00", "C01", "C02", "C03"].includes(id)) clearDepthOutcome();
    if (id === "P01_CONTEXT" && value !== "PROFESSIONAL") state.answers = sanitizeAnswersForRoute(state.answers);
    if (id === "P02G") { delete state.answers.role_primary; delete state.answers.role_primary_other; delete state.answers.roles_parallel; delete state.answers.roles_parallel_other; }
    if (id === "M01" && value === "NO_RECALL") ["memory_clue_text", "memory_branch_followup", "m_declared", "m_support_tags", "memory_time_band", "memory_year_optional", "memory_locations", "memory_experience_modes", "memory_experience_modes_other", "memory_relationship", "witness_role"].forEach((key) => delete state.answers[key]);
    if (id === "D_FOCUS") ["d_current_gap", "d_desired_change_primary", "d_context_tags", "d_context_tags_other", "d_context_impact_text"].forEach((key) => delete state.answers[key]);
    if (id === "reflection_action") {
      delete state.answers.participant_revision;
      delete state.answers.participant_m;
      delete state.answers.participant_s;
      delete state.answers.participant_d;
    }
  } else {
    let selected = values(state.answers[field]);
    if (selected.includes(value)) selected = selected.filter((itemValue) => itemValue !== value);
    else if (exclusive.includes(value)) selected = [value];
    else { selected = selected.filter((itemValue) => !exclusive.includes(itemValue)); if (!max || selected.length < max) selected.push(value); }
    state.answers[field] = selected;
    if (!["depth_m", "depth_s", "depth_d"].includes(id)) clearDepthOutcome();
  }
  saveDraft();
}

function changeConnectionChoice(field, value, multi, max) {
  const connection = getConnection();
  if (!multi) {
    connection[field] = value;
    if (field === "opt_in" && value !== "YES") {
      Object.assign(connection, defaultConnection());
    }
  } else {
    let selected = values(connection[field]);
    if (selected.includes(value)) selected = selected.filter((item) => item !== value);
    else if (!max || selected.length < max) selected.push(value);
    connection[field] = selected;
  }
  saveConnection();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.feedbackField) {
    state.feedback[target.dataset.feedbackField] = target.dataset.feedbackValue;
    saveDraft();
    render(false);
    return;
  }
  if (target.dataset.connectionField) {
    changeConnectionChoice(target.dataset.connectionField, target.dataset.connectionValue, target.dataset.connectionMulti === "true", Number(target.dataset.connectionMax || 0));
    render(false);
    return;
  }
  if (target.dataset.lang) { state.language = target.dataset.lang; saveDraft(); render(false); return; }
  if (target.dataset.choiceId) {
    if (target.getAttribute("aria-disabled") === "true") return;
    changeChoice(target.dataset.choiceId, target.dataset.choice, target.dataset.multi === "true", Number(target.dataset.max || 0), (target.dataset.exclusive || "").split(",").filter(Boolean));
    render(false);
    return;
  }
  if (target.dataset.action === "notice") { state.phase = "notice"; render(true); return; }
  if (target.dataset.action === "start") { state = { phase: "survey", step: 0, answers: {}, submitted: null, submissionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, summaryGenerating: false, responseId: `RC1-${crypto.randomUUID()}`, language: state.language, feedback: {} }; saveDraft(); render(true); return; }
  if (target.dataset.action === "resume") { const draft = loadDraft(); if (draft) { state = { phase: "survey", step: draft.step || 0, answers: sanitizeAnswersForRoute(draft.answers || {}), submitted: null, submissionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, summaryGenerating: false, responseId: draft.responseId || `RC1-${crypto.randomUUID()}`, language: draft.language || state.language, feedback: draft.feedback || {} }; } render(true); return; }
  if (target.dataset.action === "recover-pending") {
    const pending = loadPending();
    if (!pending) return;
    state = {
      phase: "complete",
      step: 0,
      answers: pending.answers || {},
      submitted: pending,
      submissionStatus: "sending",
      fixedCheckpointSaving: false,
      responseId: pending.response_id,
      language: pending.source_language || state.language,
      feedback: {},
    };
    render(true);
    verifyResearchStorage(pending.response_id).then((result) => {
      state.submissionStatus = result.status;
      render(false);
    });
    return;
  }
  if (target.dataset.action === "connection") {
    getConnection();
    state.phase = "connection";
    render(true);
    return;
  }
  if (target.dataset.action === "back-to-result") {
    state.phase = "complete";
    render(true);
    return;
  }
  if (target.dataset.action === "save-connection") {
    if (!connectionCanSave()) return;
    const update = createConnectionUpdate();
    saveConnection();
    state.connectionStatus = "sending";
    render(false);
    const separated = splitResearchAndContact(update);
    const relationEnvelope = createEnvelope("relationship_update", { ...separated.research, pii: undefined }, "relationship");
    const sends = [sendEnvelope(relationEnvelope, { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey })];
    if (separated.contact) sends.push(sendEnvelope(createEnvelope("contact_update", separated.contact, "contact"), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }));
    Promise.all(sends).then((results) => {
      const result = results[0];
      state.connectionStatus = result.status;
      state.submitted = separated.research;
      state.phase = "complete";
      render(true);
    });
    return;
  }
  if (target.dataset.action === "institution-feedback") { state.phase = "feedback"; render(true); return; }
  if (target.dataset.action === "submit-feedback") {
    if (!feedbackCanSubmit()) return;
    const linked = state.feedback.link_to_response === "YES";
    const payload = { response_id: linked ? state.responseId : `FB-${crypto.randomUUID()}`, source_response_id: linked ? state.responseId : null, institution_code: institutionCode, rc1_version: "rc1-2026-08-03", sample_type: "institution_review", feedback: state.feedback, submitted_at: new Date().toISOString() };
    state.submissionStatus = "sending";
    sendEnvelope(createEnvelope("institution_feedback", payload), { endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }).then((result) => {
      state.submissionStatus = result.status;
      state.phase = "complete";
      render(true);
    });
    return;
  }
  if (target.dataset.action === "back") { state.step = Math.max(0, state.step - 1); saveDraft(); render(true); return; }
  if (target.dataset.action === "next") {
    const id = activeScreens()[state.step];
    if (!canContinue(id) || state.submissionStatus === "sending") return;
    if (id === "FIXED_CHECKPOINT") {
      if (state.fixedCheckpointSaving) return;
      state.fixedCheckpointSaving = true;
      render(false);
      const fixedResponse = createResponse("fixed_complete");
      savePending(fixedResponse);
      const context = buildMinimalDepthContext(fixedResponse);
      Promise.all([
        requestResearchStorage(fixedResponse),
        createDepthPlan({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context, bank: depthBank }),
      ]).then(([, plan]) => {
        state.answers.depth_plan = plan.questions;
        state.answers.depth_source = plan.source;
        state.answers.depth_ai_runs = [plan.run];
        state.fixedCheckpointSaving = false;
        state.step += 1;
        saveDraft();
        render(true);
      });
      return;
    }
    if (id === "DEPTH_D") {
      if (state.summaryGenerating) return;
      state.summaryGenerating = true;
      render(false);
      const context = buildMinimalSummaryContext({ responseId: state.responseId, route: state.answers.route, coordinateScope: deriveCoordinateScope(state.answers), questions: state.answers.depth_plan, answers: state.answers });
      createDepthSummary({ endpoint: aiFunctionUrl, anonKey: supabaseAnonKey, mode: aiMode, context }).then((summary) => {
        state.answers.depth_summary = { summary: summary.summary, axes: summary.axes, evidence: summary.evidence, source: summary.source };
        state.answers.depth_ai_runs = [...values(state.answers.depth_ai_runs), summary.run];
        state.summaryGenerating = false;
        state.step += 1;
        saveDraft();
        render(true);
      });
      return;
    }
    if (id === "SUBMIT") {
      state.submitted = state.submitted || createResponse();
      savePending(state.submitted);
      state.submissionStatus = "sending";
      state.phase = "complete";
      render(true);
      requestResearchStorage(state.submitted).then((result) => {
        state.submissionStatus = result.status;
        if (result.status === "confirmed") clearDraft();
        render(false);
      });
      return;
    }
    state.step += 1;
    saveDraft();
    render(true);
    return;
  }
  if (target.dataset.action === "download") { const text = JSON.stringify(state.submitted, null, 2); const blob = new Blob([text], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${state.submitted.response_id}.json`; link.click(); URL.revokeObjectURL(url); return; }
  if (target.dataset.action === "resend") {
    const pending = loadPending();
    if (!pending || state.submissionStatus === "sending") return;
    state.submissionStatus = "sending";
    render(false);
    (submitFunctionUrl ? retryOutbox({ endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }) : requestResearchStorage(pending)).then((result) => {
      state.submissionStatus = Array.isArray(result) ? (readOutbox().length ? "unverified" : "confirmed") : result.status;
      if (result.status === "confirmed") clearDraft();
      render(false);
    });
    return;
  }
  if (target.dataset.action === "restart") { clearDraft(); state = { phase: "intro", step: 0, answers: {}, submitted: null, submissionStatus: null, fixedCheckpointSaving: false, depthGenerating: false, summaryGenerating: false, responseId: null, language: state.language, feedback: {} }; render(true); }
});

document.addEventListener("input", (event) => {
  const input = event.target;
  if (input.matches("[data-connection-input]")) {
    getConnection()[input.dataset.connectionInput] = input.value;
    saveConnection();
    const saveButton = document.querySelector("button[data-action='save-connection']");
    if (saveButton) saveButton.disabled = !connectionCanSave();
    return;
  }
  if (!input.matches("[data-input-id]")) return;
  const id = input.dataset.inputId;
  if (id.startsWith("feedback_")) {
    state.feedback[id.replace("feedback_", "")] = input.value;
    saveDraft();
    return;
  }
  const item = question(id);
  const field = input.dataset.inputField || (item ? storedField(item) : id === "M06_YEAR" ? "memory_year_optional" : id === "P05_YEAR" ? "activity_start_year" : id === "M07" ? "memory_locations" : "activity_locations");
  state.answers[field] = id === "M07" ? locationValues(input.value, 2) : id === "P10" ? locationValues(input.value, 3) : input.value;
  saveDraft();
  const nextButton = document.querySelector("button.primary-button[data-action='next']");
  if (nextButton) nextButton.disabled = !canContinue(activeScreens()[state.step]);
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches("[data-check-id]")) return;
  const item = question(input.dataset.checkId);
  state.answers[storedField(item)] = input.checked;
  saveDraft();
  render(false);
});

window.addEventListener("online", () => {
  if (!submitFunctionUrl || !readOutbox().length) return;
  const currentResponseId = state.submitted?.response_id || state.responseId;
  retryOutbox({ endpoint: submitFunctionUrl, anonKey: supabaseAnonKey }).then(() => {
    if (!currentResponseId) return;
    const currentStillQueued = readOutbox().some((item) => item.payload?.response_id === currentResponseId);
    state.submissionStatus = currentStillQueued ? "unverified" : "confirmed";
    if (!currentStillQueued) clearDraft();
    render(false);
  });
});

Promise.all([schemaUrl, depthBankUrl].map((url) => fetch(url).then((response) => response.ok ? response.json() : Promise.reject(new Error(`load failed: ${url}`)))))
  .then(([loadedSchema, loadedDepthBank]) => { schema = loadedSchema; depthBank = loadedDepthBank; state.phase = "intro"; render(); })
  .catch(() => { root.innerHTML = "<main class='shell'><p class='error'>질문 스키마를 불러오지 못했습니다.</p></main>"; });
