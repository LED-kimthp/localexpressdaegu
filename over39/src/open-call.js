const form = document.querySelector("#open-call-form");
const receipt = document.querySelector("#receipt");
const errorsBox = document.querySelector("#form-errors");
const draftKey = "over39-open-call-v042-draft";
const submittedKey = "over39-open-call-v042-submitted";

function values(formData, name) {
  return formData.getAll(name).map((value) => String(value));
}

function saveDraft() {
  const data = new FormData(form);
  const draft = {};
  for (const [key, value] of data.entries()) {
    if (value instanceof File) continue;
    if (Object.prototype.hasOwnProperty.call(draft, key)) {
      draft[key] = Array.isArray(draft[key]) ? [...draft[key], String(value)] : [draft[key], String(value)];
    } else {
      draft[key] = String(value);
    }
  }
  localStorage.setItem(draftKey, JSON.stringify(draft));
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
    if (!draft || typeof draft !== "object") return;
    for (const [name, stored] of Object.entries(draft)) {
      const controls = [...form.elements].filter((element) => element.name === name);
      const selected = Array.isArray(stored) ? stored : [stored];
      controls.forEach((control) => {
        if (["radio", "checkbox"].includes(control.type)) control.checked = selected.includes(control.value);
        else if (control.type !== "file") control.value = String(stored ?? "");
      });
    }
  } catch (error) {
    console.warn("Open-call draft restore skipped", error);
  }
}

function updateCounters() {
  document.querySelectorAll("[data-counter-for]").forEach((node) => {
    const field = form.elements[node.dataset.counterFor];
    if (field) node.textContent = `${field.value.length} / ${field.maxLength}`;
  });
}

function clearInvalid() {
  form.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));
  errorsBox.textContent = "";
}

function markInvalid(field, message, errors) {
  field?.classList.add("invalid");
  errors.push(message);
}

function validate() {
  clearInvalid();
  const data = new FormData(form);
  const errors = [];
  const eligibility = data.get("eligibility");
  if (!eligibility) markInvalid(form.querySelector('[name="eligibility"]'), "만 39세 이상 여부를 선택해주세요.", errors);
  else if (eligibility !== "yes") markInvalid(form.querySelector('[name="eligibility"][value="no"]'), "현재 공모 대상은 만 39세 이상 작가·창작자입니다.", errors);

  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  if (!name) markInvalid(form.elements.name, "이름 또는 활동명을 적어주세요.", errors);
  if (!email) markInvalid(form.elements.email, "연락받을 이메일을 적어주세요.", errors);
  else if (!form.elements.email.checkValidity()) markInvalid(form.elements.email, "이메일 형식을 확인해주세요.", errors);
  if (!data.get("contact_consent")) markInvalid(form.elements.contact_consent, "공모 연락 안내를 확인해주세요.", errors);

  const recordLink = String(data.get("record_link") || "none");
  const recordId = String(data.get("record_id") || "").trim();
  if (recordLink !== "none" && !recordId) markInvalid(form.elements.record_id, "연결할 참여 기록 번호를 적어주세요.", errors);

  errorsBox.innerHTML = errors.map((message) => `<div>${message}</div>`).join("");
  return { valid: errors.length === 0, data };
}

function fileMetadata(input) {
  const file = input?.files?.[0];
  return file ? { name: file.name, size: file.size, type: file.type } : null;
}

function buildPayload(data) {
  const portfolioFile = fileMetadata(form.elements.portfolio_file);
  return {
    release_version: "open-call-simple-v0.4.2-2026-08-07",
    submitted_at: new Date().toISOString(),
    submission_id: `OC-${crypto.randomUUID()}`,
    eligibility: String(data.get("eligibility") || ""),
    applicant: {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim() || null,
      region: String(data.get("region") || "").trim() || null,
    },
    materials: {
      portfolio_file: portfolioFile,
      portfolio_url: String(data.get("portfolio_url") || "").trim() || null,
      note: String(data.get("note") || "").trim() || null,
    },
    record_link: {
      scope: String(data.get("record_link") || "none"),
      record_id: String(data.get("record_id") || "").trim() || null,
    },
    contact_consent: Boolean(data.get("contact_consent")),
    transport: "local_browser_only",
  };
}

function materialLabel(payload) {
  const parts = [];
  if (payload.materials.portfolio_file?.name) parts.push(payload.materials.portfolio_file.name);
  if (payload.materials.portfolio_url) parts.push("작업 링크");
  return parts.length ? parts.join(" · ") : "이름과 연락처로 접수";
}

function showReceipt(payload) {
  document.querySelector("#receipt-id").textContent = payload.submission_id;
  document.querySelector("#receipt-name").textContent = payload.applicant.name;
  document.querySelector("#receipt-material").textContent = materialLabel(payload);
  document.querySelector("#receipt-time").textContent = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(payload.submitted_at));
  receipt.hidden = false;
  form.hidden = true;
  receipt.focus();
  receipt.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("input", () => {
  saveDraft();
  updateCounters();
});
form.addEventListener("change", saveDraft);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = validate();
  if (!result.valid) {
    form.querySelector(".invalid")?.focus();
    return;
  }
  const payload = buildPayload(result.data);
  localStorage.setItem(submittedKey, JSON.stringify(payload));
  saveDraft();
  showReceipt(payload);
});

document.querySelector("#edit-application").addEventListener("click", () => {
  receipt.hidden = true;
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector("#print-application").addEventListener("click", () => window.print());

restoreDraft();
updateCounters();
