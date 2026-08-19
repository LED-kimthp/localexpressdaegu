import { translate } from "./v13/i18n.js";
import { hasPdfSignature, normalizePortfolioUrls, validatePortfolioSelection } from "./open-call-validation.js";
import { openCallPhrase } from "./open-call-i18n.js";

const form = document.querySelector("#open-call-form");
const receipt = document.querySelector("#receipt");
const errorsBox = document.querySelector("#form-errors");
const gate = document.querySelector("#application-gate");
const workLinks = document.querySelector("#work-links");
const languageSelect = document.querySelector("#call-language");
const endpoint = String(window.OVER39_SUPABASE_OPEN_CALL_URL || "").trim();
const anonKey = String(window.OVER39_SUPABASE_ANON_KEY || "").trim();
const submissionsEnabled = window.OVER39_OPEN_CALL_SUBMISSIONS_ENABLED === true;
const draftKey = "over39-open-call-v2-draft";
const submissionIdKey = "over39-open-call-v2-submission-id";
const interfaceLanguageKey = "over39-interface-language";
const query = new URLSearchParams(location.search);
const supportedLanguages = ["ko", "en", "ja", "zh-Hans", "zh-Hant", "nl", "es", "fr", "ms"];
const requestedLanguage = query.get("lang") || localStorage.getItem(interfaceLanguageKey) || "ko";
const language = supportedLanguages.includes(requestedLanguage) ? requestedLanguage : "ko";
const t = (value) => openCallPhrase(language, value) || translate(language, value);

function currentPortfolioUrls() {
  return normalizePortfolioUrls([...form.querySelectorAll('[name="portfolio_urls"]')].map((input) => input.value));
}

function linkRow(value = "") {
  const row = document.createElement("div");
  row.className = "work-link-row";
  row.innerHTML = `<input type="url" name="portfolio_urls" value="${String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;")}" placeholder="https://" aria-label="${t("작업 링크")}" /><button type="button" data-remove-work-link aria-label="${t("이 작업 링크 삭제")}">${t("삭제")}</button>`;
  return row;
}

function addWorkLink(value = "", { focus = false } = {}) {
  if (workLinks.children.length >= 10) return;
  const row = linkRow(value);
  workLinks.append(row);
  if (focus) row.querySelector("input")?.focus();
  updateLinkControls();
}

function updateLinkControls() {
  const rows = [...workLinks.children];
  rows.forEach((row) => { row.querySelector("[data-remove-work-link]").disabled = rows.length === 1; });
  const addButton = document.querySelector("[data-add-work-link]");
  if (addButton) addButton.disabled = rows.length >= 10;
}

function saveDraft() {
  const draft = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (value instanceof File) continue;
    draft[key] = Object.prototype.hasOwnProperty.call(draft, key) ? [draft[key], String(value)].flat() : String(value);
  }
  draft.portfolio_urls = [...form.querySelectorAll('[name="portfolio_urls"]')].map((input) => input.value);
  localStorage.setItem(draftKey, JSON.stringify(draft));
}

function restoreDraft() {
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem(draftKey) || "null"); }
  catch (error) { console.warn("Open-call draft restore skipped", error); }
  const urls = Array.isArray(draft?.portfolio_urls) ? draft.portfolio_urls : draft?.portfolio_url ? [draft.portfolio_url] : [""];
  urls.slice(0, 10).forEach((value) => addWorkLink(value));
  if (!workLinks.children.length) addWorkLink();
  if (!draft) return;
  for (const [name, stored] of Object.entries(draft)) {
    if (["portfolio_urls", "portfolio_url", "record_id"].includes(name)) continue;
    const selected = Array.isArray(stored) ? stored : [stored];
    [...form.elements].filter((element) => element.name === name).forEach((control) => {
      if (["radio", "checkbox"].includes(control.type)) control.checked = selected.includes(control.value || "on");
      else if (control.type !== "file") control.value = String(stored || "");
    });
  }
}

function connectCurrentRecord() {
  const recordId = String(query.get("record_id") || "").trim().slice(0, 120);
  const field = form.elements.record_id;
  const status = document.querySelector("#record-link-status");
  field.value = recordId;
  const linkChoices = [...form.querySelectorAll('[name="record_link"]')];
  if (recordId) {
    if (!linkChoices.some((choice) => choice.checked && choice.value !== "none")) form.querySelector('[name="record_link"][value="summary"]').checked = true;
    status.textContent = t("현재 참여 기록을 자동으로 연결했습니다. 아래에서 함께 볼 범위를 선택해주세요.");
  } else {
    linkChoices.filter((choice) => choice.value !== "none").forEach((choice) => { choice.disabled = true; });
    form.querySelector('[name="record_link"][value="none"]').checked = true;
    status.textContent = t("설문 참여 기록에서 공모로 이동하면 기록 번호를 입력하지 않아도 자동으로 연결됩니다.");
  }
}

function updateCounters() {
  document.querySelectorAll("[data-counter-for]").forEach((node) => {
    const field = form.elements[node.dataset.counterFor];
    if (field) node.textContent = `${field.value.length} / ${field.maxLength}`;
  });
}

function markInvalid(field, message, errors) { field?.classList.add("invalid"); errors.push(message); }

async function validate() {
  form.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));
  errorsBox.textContent = "";
  const data = new FormData(form);
  const errors = [];
  if (!String(data.get("name") || "").trim()) markInvalid(form.elements.name, t("이름 또는 활동명을 적어주세요."), errors);
  if (!String(data.get("email") || "").trim() || !form.elements.email.checkValidity()) markInvalid(form.elements.email, t("연락받을 이메일 형식을 확인해주세요."), errors);
  const file = form.elements.portfolio_file.files?.[0] || null;
  const portfolioUrls = currentPortfolioUrls();
  const materials = validatePortfolioSelection({ file, portfolioUrls });
  materials.errors.forEach((message) => markInvalid(file ? form.elements.portfolio_file : form.querySelector('[name="portfolio_urls"]'), t(message), errors));
  if (file && materials.fileValid) {
    const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!hasPdfSignature(signature)) markInvalid(form.elements.portfolio_file, t("파일 내용이 실제 PDF인지 확인해주세요."), errors);
  }
  if (!data.get("open_call_consent")) markInvalid(form.elements.open_call_consent, t("공모 자료 사용 동의를 확인해주세요."), errors);
  if (!data.get("contact_consent")) markInvalid(form.elements.contact_consent, t("공모 연락처 보관 안내를 확인해주세요."), errors);
  data.delete("portfolio_urls");
  portfolioUrls.forEach((url) => data.append("portfolio_urls", url));
  errorsBox.innerHTML = errors.map((message) => `<div>${message}</div>`).join("");
  return { valid: errors.length === 0, data, portfolioUrls };
}

function materialLabel(data, portfolioUrls) {
  const linkLabel = portfolioUrls.length ? (language === "ko" ? `작업 링크 ${portfolioUrls.length}개` : `${t("작업 링크")} × ${portfolioUrls.length}`) : "";
  return [data.get("portfolio_file")?.name, linkLabel].filter(Boolean).join(" · ");
}

function showReceipt(result, data, portfolioUrls) {
  document.querySelector("#receipt-id").textContent = result.submission_id;
  document.querySelector("#receipt-name").textContent = String(data.get("name") || "");
  document.querySelector("#receipt-material").textContent = materialLabel(data, portfolioUrls);
  document.querySelector("#receipt-time").textContent = new Intl.DateTimeFormat(language, { dateStyle: "long", timeStyle: "short" }).format(new Date(result.stored_at));
  receipt.hidden = false; form.hidden = true; receipt.focus(); receipt.scrollIntoView({ behavior: "smooth", block: "start" });
}

function stableSubmissionId() {
  const existing = localStorage.getItem(submissionIdKey);
  if (existing) return existing;
  const created = `OC-${crypto.randomUUID()}`;
  localStorage.setItem(submissionIdKey, created);
  return created;
}

async function submit(data) {
  const submissionId = stableSubmissionId();
  data.set("action", "submit");
  data.set("submission_id", submissionId);
  data.set("idempotency_key", submissionId);
  data.set("project_context_acknowledged", "yes");
  const response = await fetch(endpoint, { method: "POST", headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, body: data });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error_code || "OPEN_CALL_SUBMIT_FAILED");
  return result;
}

function translateStaticPage() {
  document.documentElement.lang = language;
  languageSelect.value = language;
  if (language === "ko") return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) { return node.parentElement?.closest("script,style,option") || !node.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const source = node.nodeValue.trim();
    const translated = t(source);
    if (translated !== source) node.nodeValue = node.nodeValue.replace(source, translated);
  });
  form.querySelectorAll("[placeholder]").forEach((input) => { const translated = t(input.placeholder); if (translated !== input.placeholder) input.placeholder = translated; });
}

form.addEventListener("input", () => { saveDraft(); updateCounters(); });
form.addEventListener("change", saveDraft);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!submissionsEnabled || !endpoint || !anonKey) { errorsBox.textContent = t("공모 일정과 운영 내용이 확정되면 이곳에서 접수를 시작합니다."); return; }
  const result = await validate();
  if (!result.valid) { form.querySelector(".invalid")?.focus(); return; }
  const button = form.querySelector(".submit-button");
  button.disabled = true; button.setAttribute("aria-busy", "true"); errorsBox.textContent = t("제출 자료를 안전하게 저장하고 있습니다.");
  try {
    showReceipt(await submit(result.data), result.data, result.portfolioUrls);
    localStorage.removeItem(draftKey); localStorage.removeItem(submissionIdKey);
  } catch (error) { console.error(error); errorsBox.textContent = t("접수를 저장하지 못했습니다. 잠시 뒤 다시 시도해주세요."); }
  finally { button.disabled = false; button.removeAttribute("aria-busy"); }
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-add-work-link]")) { addWorkLink("", { focus: true }); saveDraft(); return; }
  const remove = event.target.closest("[data-remove-work-link]");
  if (remove && workLinks.children.length > 1) { remove.closest(".work-link-row").remove(); updateLinkControls(); saveDraft(); }
});

languageSelect.addEventListener("change", () => {
  localStorage.setItem(interfaceLanguageKey, languageSelect.value);
  const next = new URL(location.href); next.searchParams.set("lang", languageSelect.value); location.href = next.href;
});
document.querySelector("#edit-application").addEventListener("click", () => { receipt.hidden = true; form.hidden = false; form.scrollIntoView({ behavior: "smooth" }); });
document.querySelector("#print-application").addEventListener("click", () => window.print());

gate.textContent = submissionsEnabled ? t("접수 중 · PDF 또는 작업 링크 가운데 하나 이상을 준비해주세요.") : t("공모 일정과 운영 내용이 확정되면 이곳에서 접수를 시작합니다.");
form.querySelector("[data-open-call-submit]").hidden = !submissionsEnabled;
form.querySelector("[data-open-call-closed]").hidden = submissionsEnabled;
restoreDraft(); connectCurrentRecord(); updateCounters(); translateStaticPage();
