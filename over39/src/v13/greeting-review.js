import { greetingSimplificationCopy } from "./greeting-simplification-i18n.js";
import { greetingFirstCopy } from "./greeting-first-i18n.js";
import { greetingUiCopy } from "./greetings-ui-i18n.js";
import { responseDocumentFrame } from "./response-document-i18n.js";
import { greetingVisibilityCopy } from "./stage1-i18n.js";
import { task7Copy } from "./task7-i18n.js";

const root = document.querySelector("#greeting-review-root");
const query = new URLSearchParams(window.location.search);
const isPublishedTestPath = /^\/over39-test(?:\/|$)/u.test(window.location.pathname);
const isLocalTestHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const reviewAllowed = window.OVER39_TEST_REVIEW_BUILD === true
  && query.get("review") === "greeting"
  && (isPublishedTestPath || isLocalTestHost)
  && window.OVER39_OPEN_CALL_SUBMISSIONS_ENABLED === false
  && window.OVER39_GLOBAL_GREETINGS_ENABLED === false;

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

if (!root || !reviewAllowed) {
  if (root) root.innerHTML = `<main class="relay-layout"><section class="relay-card"><h1>TEST REVIEW unavailable</h1><p class="relay-lead">This route is available only in the isolated over39 test build while both public gates remain off.</p></section></main>`;
} else {
  const language = "ko";
  const copy = greetingSimplificationCopy(language);
  const first = greetingFirstCopy(language);
  const greeting = greetingUiCopy(language);
  const record = responseDocumentFrame(language);
  const task7 = task7Copy(language);
  const visibility = greetingVisibilityCopy(language);
  const mockGreeting = copy.exampleText;
  const screens = new Set(["entry", "received", "position", "writing", "preview"]);
  const initialScreen = screens.has(query.get("screen")) ? query.get("screen") : "entry";
  const state = {
    screen: initialScreen,
    message: "",
    senderVisibility: "",
    translationAllowed: "",
    confirmed: false,
    status: "",
  };

  document.documentElement.lang = language;
  document.body.dataset.greetingReviewActive = "true";

  function reviewNavigation() {
    const labels = { entry: "ENTRY", received: "RECEIVED", position: "TODAY’S POSITION", writing: "WRITING", preview: "PREVIEW" };
    return `<nav class="test-review-navigation" aria-label="Greeting review screens">${[...screens].map((screen) => `<button type="button" data-review-screen="${screen}" aria-pressed="${state.screen === screen}">${labels[screen]}</button>`).join("")}</nav>`;
  }

  function reviewFrame(content) {
    return `${reviewNavigation()}${content}`;
  }

  function renderEntry() {
    return `<main class="relay-layout greeting-review-layout"><section class="relay-card greeting-review-entry"><div class="archive-label">${esc(copy.projectLabel)}</div><h1>${esc(first.greetingChoiceTitle)}</h1><p class="relay-lead">${esc(first.greetingChoiceHelp)}</p><div class="greeting-opt-in-actions"><button class="primary-button" type="button" data-review-action="open-greeting">${esc(first.greetingChoicePrimary)} <span aria-hidden="true">→</span></button><button class="secondary-button" type="button" data-review-action="finish">${esc(first.greetingChoiceSecondary)}</button></div>${state.status ? `<p class="test-review-local-status" role="status">${esc(state.status)}</p>` : ""}</section></main>`;
  }

  function renderReceived() {
    return `<main class="relay-layout greeting-review-layout"><section class="relay-card relay-card-received greeting-arrival"><div class="archive-label">${esc(copy.projectLabel)}</div><h1>${esc(first.receivedTitle)}</h1><p class="relay-lead">${esc(first.seedHelp)}</p><section class="relay-messages relay-received-message"><article class="relay-letter"><p lang="ko">${esc(mockGreeting)}</p></article></section><section class="relay-message-language"><span>${esc(first.seedNote)} · ${esc(greeting.original)} · ko</span></section><section class="relay-reply relay-read-actions"><div class="relay-actions relay-next-actions"><button class="primary-button" type="button" data-review-action="position">${esc(first.beginStory)} <span aria-hidden="true">→</span></button></div></section></section></main>`;
  }

  function renderPosition() {
    const axes = [[first.coordinateAxes[0], record.axis.M2], [first.coordinateAxes[1], record.axis.S3], [first.coordinateAxes[2], record.axis.D3]];
    return `<main class="relay-layout greeting-review-layout"><section class="relay-card greeting-review-position"><section class="completion-coordinate" aria-labelledby="review-coordinate-title"><div class="archive-label">${esc(first.coordinateLabel)}</div><h1 id="review-coordinate-title">${esc(first.coordinateTitle)}</h1><p class="completion-coordinate-help">${esc(first.coordinateHelp)}</p><div class="completion-coordinate-axes">${axes.map(([label, value], index) => `<div><span>${String(index + 1).padStart(2, "0")} · ${esc(label)}</span><strong>${esc(value)}</strong><i aria-hidden="true"></i></div>`).join("")}</div><p class="completion-coordinate-disclaimer">${esc(first.coordinateDisclaimer)}</p></section><section class="rc2-greeting-hub"><div class="greeting-hub-copy"><div class="archive-label">${esc(copy.projectLabel)}</div><h2>${esc(first.coordinateTransitionTitle)}</h2><p>${esc(first.coordinateTransitionHelp)}</p><div class="greeting-opt-in-actions"><button class="primary-button" type="button" data-review-action="write">${esc(first.continuationPrimary)} <span aria-hidden="true">→</span></button><button class="secondary-button" type="button" data-review-action="finish">${esc(first.continuationSecondary)}</button></div></div></section></section></main>`;
  }

  function choiceButtons(field, options, selected) {
    return `<div class="choice-list">${options.map(([value, label]) => `<button type="button" class="choice ${selected === value ? "selected" : ""}" data-review-choice="${field}" data-review-value="${value}" aria-pressed="${selected === value}"><span aria-hidden="true">${selected === value ? "✓" : ""}</span><strong>${esc(label)}</strong></button>`).join("")}</div>`;
  }

  function renderWriting() {
    const canPreview = Boolean(state.message.trim() && state.senderVisibility && state.translationAllowed);
    return `<main class="relay-layout greeting-review-layout"><section class="relay-card"><div class="archive-label">${esc(copy.projectLabel)}</div><section class="relay-reply greeting-review-writing"><h1>${esc(copy.writingTitle)}</h1><p class="greeting-writing-help">${esc(copy.writingHelp)}</p><textarea class="text-input" data-review-message maxlength="1400" placeholder="${esc(greeting.messagePlaceholder)}">${esc(state.message)}</textarea><aside class="greeting-writing-example" aria-label="${esc(copy.exampleLabel)}"><span>${esc(copy.exampleLabel)}</span><p>${esc(copy.exampleText)}</p></aside><h3>${esc(task7.senderVisibilityTitle)}</h3>${choiceButtons("senderVisibility", [["NAMED", visibility[0]], ["CONTEXTUAL", visibility[1]], ["ANONYMOUS", visibility[2]]], state.senderVisibility)}<h3>${esc(task7.translationTitle)}</h3>${choiceButtons("translationAllowed", [["YES", greeting.translatedYes], ["NO", greeting.translatedNo]], state.translationAllowed)}<div class="relay-actions"><button class="secondary-button" type="button" data-review-action="back-received">${esc(greeting.previous)}</button><button class="primary-button" type="button" data-review-action="preview" ${canPreview ? "" : "disabled"}>${esc(task7.previewAction)} <span aria-hidden="true">→</span></button></div></section></section></main>`;
  }

  function renderPreview() {
    const displayMessage = state.message.trim() || "다음 사람에게 남길 안부가 이곳에 보입니다.";
    const visibilityLabel = { NAMED: visibility[0], CONTEXTUAL: visibility[1], ANONYMOUS: visibility[2] }[state.senderVisibility] || "—";
    const translationLabel = state.translationAllowed === "YES" ? greeting.translationAllowed : state.translationAllowed === "NO" ? greeting.originalOnly : "—";
    return `<main class="relay-layout greeting-review-layout"><section class="relay-card"><div class="archive-label">${esc(copy.projectLabel)}</div><section class="relay-reply relay-preview greeting-preview"><h1>${esc(greeting.previewTitle)}</h1><article class="relay-letter"><span>${esc(greeting.original)} · ko</span><p>${esc(displayMessage)}</p></article><div class="greeting-preview-disclosure"><dl class="greeting-preview-summary"><div><dt>${esc(greeting.publicContext)}</dt><dd>${esc(visibilityLabel)}</dd></div><div><dt>${esc(greeting.language)}</dt><dd>ko</dd></div><div><dt>${esc(greeting.translation)}</dt><dd>${esc(translationLabel)}</dd></div></dl><p class="greeting-privacy-note">${esc(greeting.previewPrivacy)}</p></div><label class="final-check greeting-preview-confirmation"><input type="checkbox" data-review-confirmed ${state.confirmed ? "checked" : ""} /><span>${esc(greeting.previewConfirm)}</span></label><div class="relay-actions greeting-preview-actions"><button class="secondary-button" type="button" data-review-action="back-writing">${esc(greeting.previous)}</button><button class="primary-button" type="button" data-review-action="entrust" ${state.confirmed ? "" : "disabled"}>${esc(greeting.save)} <span aria-hidden="true">→</span></button></div>${state.status ? `<p class="test-review-local-status" role="status">${esc(state.status)}</p>` : ""}</section></section></main>`;
  }

  function render() {
    const screen = state.screen === "received" ? renderReceived() : state.screen === "position" ? renderPosition() : state.screen === "writing" ? renderWriting() : state.screen === "preview" ? renderPreview() : renderEntry();
    root.innerHTML = reviewFrame(screen);
  }

  document.addEventListener("click", (event) => {
    const navigation = event.target.closest("[data-review-screen]");
    if (navigation) {
      state.screen = navigation.dataset.reviewScreen;
      state.status = "";
      render();
      return;
    }
    const choice = event.target.closest("[data-review-choice]");
    if (choice) {
      state[choice.dataset.reviewChoice] = choice.dataset.reviewValue;
      state.confirmed = false;
      render();
      return;
    }
    const action = event.target.closest("[data-review-action]")?.dataset.reviewAction;
    if (!action) return;
    if (action === "open-greeting") state.screen = "received";
    if (action === "position") { state.screen = "position"; state.status = "TEST REVIEW · 설문 완료 뒤의 화면으로 이동했습니다."; }
    if (action === "write") state.screen = "writing";
    if (action === "back-received") state.screen = "received";
    if (action === "back-writing") state.screen = "writing";
    if (action === "preview" && state.message.trim() && state.senderVisibility && state.translationAllowed) state.screen = "preview";
    if (action === "finish") { state.screen = "entry"; state.status = "TEST REVIEW · 화면만 확인했습니다. 실제 데이터는 저장되지 않았습니다."; }
    if (action === "entrust" && state.confirmed) state.status = "TEST REVIEW · 안부 맡기기 화면을 확인했습니다. 실제 데이터는 저장되지 않았습니다.";
    render();
  });

  document.addEventListener("input", (event) => {
    if (!event.target.matches("[data-review-message]")) return;
    state.message = event.target.value;
    state.confirmed = false;
    const previewButton = document.querySelector('[data-review-action="preview"]');
    if (previewButton) previewButton.disabled = !(state.message.trim() && state.senderVisibility && state.translationAllowed);
  });

  document.addEventListener("change", (event) => {
    if (!event.target.matches("[data-review-confirmed]")) return;
    state.confirmed = event.target.checked;
    render();
  });

  render();
}
