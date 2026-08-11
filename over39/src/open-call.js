import { productionBrandLockup } from "./brand-lockup.js";
import { hasPdfSignature, validatePortfolioSelection } from "./open-call-validation.js";

const form = document.querySelector("#open-call-form");
const receipt = document.querySelector("#receipt");
const errorsBox = document.querySelector("#form-errors");
const gate = document.querySelector("#application-gate");
const endpoint = String(window.OVER39_SUPABASE_OPEN_CALL_URL || "").trim();
const anonKey = String(window.OVER39_SUPABASE_ANON_KEY || "").trim();
const submissionsEnabled = window.OVER39_OPEN_CALL_SUBMISSIONS_ENABLED === true;
const draftKey = "over39-open-call-v1-draft";

document.querySelectorAll("[data-production-brand]").forEach((node) => { node.innerHTML = productionBrandLockup({ compact: true }); });

function saveDraft() {
  const draft = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (value instanceof File) continue;
    draft[key] = Object.prototype.hasOwnProperty.call(draft, key) ? [draft[key], String(value)].flat() : String(value);
  }
  localStorage.setItem(draftKey, JSON.stringify(draft));
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
    if (!draft) return;
    for (const [name, stored] of Object.entries(draft)) {
      const selected = Array.isArray(stored) ? stored : [stored];
      [...form.elements].filter((element) => element.name === name).forEach((control) => {
        if (["radio", "checkbox"].includes(control.type)) control.checked = selected.includes(control.value || "on");
        else if (control.type !== "file") control.value = String(stored || "");
      });
    }
  } catch (error) { console.warn("Open-call draft restore skipped", error); }
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
  const eligibility = data.get("eligibility");
  if (!eligibility) markInvalid(form.querySelector('[name="eligibility"]'), "만 39세 이상 여부를 선택해주세요.", errors);
  else if (eligibility !== "yes") markInvalid(form.querySelector('[name="eligibility"][value="no"]'), "현재 공모 대상은 만 39세 이상 작가·창작자입니다.", errors);
  if (!String(data.get("name") || "").trim()) markInvalid(form.elements.name, "이름 또는 활동명을 적어주세요.", errors);
  if (!String(data.get("email") || "").trim() || !form.elements.email.checkValidity()) markInvalid(form.elements.email, "연락받을 이메일 형식을 확인해주세요.", errors);

  const file = form.elements.portfolio_file.files?.[0] || null;
  const materials = validatePortfolioSelection({ file, portfolioUrl: data.get("portfolio_url") });
  materials.errors.forEach((message) => markInvalid(file ? form.elements.portfolio_file : form.elements.portfolio_url, message, errors));
  if (file && validatePortfolioSelection({ file, portfolioUrl: data.get("portfolio_url") }).valid) {
    const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!hasPdfSignature(signature)) markInvalid(form.elements.portfolio_file, "파일 내용이 실제 PDF인지 확인해주세요.", errors);
  }
  const recordLink = String(data.get("record_link") || "none");
  if (recordLink !== "none" && !String(data.get("record_id") || "").trim()) markInvalid(form.elements.record_id, "연결할 참여 기록 번호를 적어주세요.", errors);
  if (!data.get("open_call_consent")) markInvalid(form.elements.open_call_consent, "공모 자료 사용 동의를 확인해주세요.", errors);
  if (!data.get("contact_consent")) markInvalid(form.elements.contact_consent, "공모 연락처 보관 안내를 확인해주세요.", errors);
  errorsBox.innerHTML = errors.map((message) => `<div>${message}</div>`).join("");
  return { valid: errors.length === 0, data };
}

function materialLabel(data) {
  return [data.get("portfolio_file")?.name, data.get("portfolio_url") ? "포트폴리오 URL" : ""].filter(Boolean).join(" · ");
}

function showReceipt(result, data) {
  document.querySelector("#receipt-id").textContent = result.submission_id;
  document.querySelector("#receipt-name").textContent = String(data.get("name") || "");
  document.querySelector("#receipt-material").textContent = materialLabel(data);
  document.querySelector("#receipt-time").textContent = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(result.stored_at));
  receipt.hidden = false; form.hidden = true; receipt.focus(); receipt.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function submit(data) {
  const submissionId = `OC-${crypto.randomUUID()}`;
  data.set("action", "submit");
  data.set("submission_id", submissionId);
  data.set("idempotency_key", submissionId);
  const response = await fetch(endpoint, { method: "POST", headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, body: data });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error_code || "OPEN_CALL_SUBMIT_FAILED");
  return result;
}

form.addEventListener("input", () => { saveDraft(); updateCounters(); });
form.addEventListener("change", saveDraft);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!submissionsEnabled || !endpoint || !anonKey) { errorsBox.textContent = "운영 일정과 개인정보 보유기간을 확정한 뒤 접수를 엽니다."; return; }
  const result = await validate();
  if (!result.valid) { form.querySelector(".invalid")?.focus(); return; }
  const button = form.querySelector(".submit-button");
  button.disabled = true; button.setAttribute("aria-busy", "true"); errorsBox.textContent = "private storage에 안전하게 저장하고 있습니다.";
  try { showReceipt(await submit(result.data), result.data); localStorage.removeItem(draftKey); }
  catch (error) { console.error(error); errorsBox.textContent = "접수를 저장하지 못했습니다. 잠시 뒤 다시 시도해주세요."; }
  finally { button.disabled = false; button.removeAttribute("aria-busy"); }
});

document.querySelector("#edit-application").addEventListener("click", () => { receipt.hidden = true; form.hidden = false; form.scrollIntoView({ behavior: "smooth" }); });
document.querySelector("#print-application").addEventListener("click", () => window.print());

gate.textContent = submissionsEnabled ? "접수 중 · PDF 또는 URL 가운데 최소 하나를 준비해주세요." : "접수 준비 중 · 시작일, 마감일, 지원 범위와 개인정보 보유기간을 확정한 뒤 실제 접수를 엽니다.";
if (!submissionsEnabled) form.querySelector(".submit-button").disabled = true;
restoreDraft(); updateCounters();
