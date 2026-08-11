export const ANCHOR_ORDER = ["M04_TEXT", "P12", "P13_TEXT", "P19_TEXT", "D02_TEXT"];

export const ANCHOR_SCREEN_MAP = {
  AI_ANCHOR_M04_TEXT: "M04_TEXT",
  AI_ANCHOR_P12: "P12",
  AI_ANCHOR_P13_TEXT: "P13_TEXT",
  AI_ANCHOR_P19_TEXT: "P19_TEXT",
  AI_ANCHOR_D02_TEXT: "D02_TEXT",
};

export const ANCHOR_SOURCE_FIELDS = {
  M04_TEXT: "memory_meaning_text",
  P12: "transition_text",
  P13_TEXT: "invisible_continuity_text",
  P19_TEXT: "support_conditions_text",
  D02_TEXT: "desired_change_text",
};

export const ANCHOR_AXES = {
  M04_TEXT: "M",
  P12: "S",
  P13_TEXT: "S",
  P19_TEXT: "S",
  D02_TEXT: "D",
};

export const ANCHOR_CONTEXT_DEPENDENCIES = {
  M04_TEXT: ["M04_TEXT", "M02"],
  P12: ["P12", "P11", "P18"],
  P13_TEXT: ["P13_TEXT", "P13", "P12"],
  P19_TEXT: ["P19_TEXT", "P19", "P13_TEXT"],
  D02_TEXT: ["D02_TEXT", "D02", "P19_TEXT"],
};

const GLOBAL_ANCHOR_CONTEXT_QUESTION_IDS = new Set([
  "P01", "P01_CONTEXT", "P02G", "P02", "P03", "D_FOCUS",
]);

export function anchorsAffectedByChangedQuestion(questionId) {
  const id = String(questionId || "").trim();
  if (!id) return [];
  if (GLOBAL_ANCHOR_CONTEXT_QUESTION_IDS.has(id)) return [...ANCHOR_ORDER];
  return ANCHOR_ORDER.filter((anchorId) => ANCHOR_CONTEXT_DEPENDENCIES[anchorId]?.includes(id));
}

const STANDALONE_NO_RECALL_PATTERNS = [
  /^특별히\s*(?:떠오르는|기억나는)\s*(?:대상|것|내용)?(?:이|은|가)?\s*(?:없(?:어요|습니다|다)?|떠오르지\s*않(?:아요|습니다|는다)?)\s*[.!?…]*$/i,
  /^(?:기억(?:이|은)?\s*나지\s*않(?:아요|습니다|는다)?|기억나지\s*않(?:아요|습니다|는다)?|떠오르지\s*않(?:아요|습니다|는다)?|잘\s*모르겠(?:어요|습니다)?|모르겠(?:어요|습니다)?)\s*[.!?…]*$/i,
  /^nothing\s+(?:specific\s+)?comes?\s+to\s+mind\s*[.!?…]*$/i,
  /^(?:(?:i\s+)?(?:do\s+not|don't|can'?t)\s+remember|i\s+(?:do\s+not|don't)\s+know|not\s+sure)\s*[.!?…]*$/i,
  /^(?:特に.*思い浮か(?:びません|ばない)|思い出せ(?:ません|ない)|覚えて(?:いません|ない)|よく分かりません|よくわかりません)\s*[。！？.!?…]*$/i,
  /^(?:想不起來|想不起来|沒有.*想起|没有.*想起)\s*[。！？.!?…]*$/i,
  /^(?:tidak\s+(?:ingat|terfikir))\s*[.!?…]*$/i,
  /^no\s+recuerdo\s*[.!?…]*$/i,
  /^je\s+ne\s+(?:me\s+)?souviens\s+pas\s*[.!?…]*$/i,
  /^ik\s+weet\s+het\s+niet\s*[.!?…]*$/i,
];

const EXACT_NOISE = new Set([
  ".", "..", "...", "-", "--", "_", "?", "!", "ㅂㅂ", "ㅎㅎ", "ㅋㅋ", "ㅇㅇ", "ㄴㄴ",
  "asdf", "qwer", "qwerty", "test", "테스트", "모름", "몰라", "모르겠음", "없음", "해당 없음", "skip", "none", "n/a", "na",
]);

export function normalizedAnchorText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function lowInformationReason(value) {
  const text = normalizedAnchorText(value);
  if (!text) return "blank";
  const lower = text.toLowerCase();
  if (EXACT_NOISE.has(lower)) return "known_noise";
  if (STANDALONE_NO_RECALL_PATTERNS.some((pattern) => pattern.test(text))) return "no_recall";
  const compact = text.replace(/[\s\p{P}\p{S}]/gu, "");
  if (!compact) return "punctuation_only";
  if (/^[ㄱ-ㅎㅏ-ㅣ]+$/u.test(compact)) return "jamo_noise";
  if (/^(.)\1{1,}$/u.test(compact)) return "repeated_character";
  if (/^(?:asdf|qwer|zxcv|hjkl|1234|1111|0000)+$/i.test(compact)) return "keyboard_noise";
  return null;
}

export function isLowInformationText(value) {
  return Boolean(lowInformationReason(value));
}

export function anchorSourceText(answers = {}, anchorId) {
  return normalizedAnchorText(answers?.[ANCHOR_SOURCE_FIELDS[anchorId]] || "");
}

function semanticHash(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function anchorAnswerFingerprint(anchorId, answer) {
  return `${anchorId}:${semanticHash(normalizedAnchorText(answer).toLowerCase())}`;
}

function normalizedRoleRecord(value) {
  if (!value) return null;
  if (typeof value === "string") return { code: value, label: value };
  return {
    code: String(value.code || "").trim() || null,
    label: normalizedAnchorText(value.label || value.code || "") || null,
  };
}

export function anchorContextFingerprint(anchorId, context = {}) {
  const semantic = {
    anchor_id: anchorId,
    question_id: String(context.question_id || anchorId),
    question_label: normalizedAnchorText(context.question_label || ""),
    answer: normalizedAnchorText(context.verbatim_answer ?? context.answer ?? ""),
    adjacent_responses: (Array.isArray(context.adjacent_responses) ? context.adjacent_responses : []).map((item) => ({
      id: String(item?.id || ""),
      text: normalizedAnchorText(item?.text ?? item?.value ?? ""),
    })),
    role_primary: normalizedRoleRecord(context.role_primary),
    roles_parallel: (Array.isArray(context.roles_parallel) ? context.roles_parallel : []).map(normalizedRoleRecord).filter(Boolean),
    response_position: context.response_position || null,
    d_scope: context.d_scope || null,
    response_language: context.response_language || "ko",
    route: context.route || null,
  };
  return `${anchorId}:ctx:${semanticHash(semantic)}`;
}

const FALLBACKS = {
  ko: {
    M04_TEXT: "방금 적은 이유 가운데 지금도 가장 선명하게 남아 있는 한 가지를 조금 더 들려주세요.",
    P12: "그 변화가 실제로 느껴졌던 한 장면을 조금 더 들려주세요.",
    P13_TEXT: "겉으로 잘 보이지 않았던 때에도 이어지고 있던 것을 한 장면으로 들려주세요.",
    P19_TEXT: "그 조건이 실제로 도움이 되었던 장면을 한 가지 들려주세요.",
    D02_TEXT: "그 변화가 시작되었다고 느낄 수 있는 가장 작은 장면은 무엇인가요?",
  },
  en: {
    M04_TEXT: "What is one part of that reason that still feels especially vivid to you?",
    P12: "Can you describe one moment when that change became noticeable in practice?",
    P13_TEXT: "Can you describe one thing that continued even when it was not very visible from outside?",
    P19_TEXT: "Can you describe one moment when that condition actually helped?",
    D02_TEXT: "What would be the smallest sign that this change had begun?",
  },
  ja: {
    M04_TEXT: "今書いた理由の中で、今も特に鮮明に残っていることを一つだけもう少し教えてください。",
    P12: "その変化を実際に感じた場面を一つだけ、もう少し教えてください。",
    P13_TEXT: "外からは見えにくい時期にも続いていたことを、一つの場面として教えてください。",
    P19_TEXT: "その条件が実際に助けになった場面を一つ教えてください。",
    D02_TEXT: "その変化が始まったと感じられる最も小さな兆しは何でしょうか。",
  },
  "zh-Hans": {
    M04_TEXT: "在你刚写下的原因中，能再说一个至今仍最清晰的部分吗？",
    P12: "能再说一个你实际感受到这种变化的场景吗？",
    P13_TEXT: "即使外界不太看得见，当时仍在继续的事情是什么？请说一个场景。",
    P19_TEXT: "能说一个这个条件实际发挥作用的场景吗？",
    D02_TEXT: "什么最小的迹象会让你觉得这种变化已经开始？",
  },
  "zh-Hant": {
    M04_TEXT: "在你剛寫下的原因中，能再說一個至今仍最清晰的部分嗎？",
    P12: "能再說一個你實際感受到這種變化的場景嗎？",
    P13_TEXT: "即使外界不太看得見，當時仍在繼續的事情是什麼？請說一個場景。",
    P19_TEXT: "能說一個這個條件實際發揮作用的場景嗎？",
    D02_TEXT: "什麼最小的跡象會讓你覺得這種變化已經開始？",
  },
  fr: {
    M04_TEXT: "Parmi les raisons que vous venez d'écrire, quel élément reste aujourd'hui le plus vif ?",
    P12: "Pouvez-vous décrire une scène où ce changement est devenu concret ?",
    P13_TEXT: "Pouvez-vous décrire une chose qui a continué même lorsqu'elle était peu visible de l'extérieur ?",
    P19_TEXT: "Pouvez-vous décrire un moment où cette condition a réellement aidé ?",
    D02_TEXT: "Quel serait le plus petit signe indiquant que ce changement a commencé ?",
  },
  es: {
    M04_TEXT: "De la razón que acabas de escribir, ¿qué parte sigue siendo hoy la más nítida para ti?",
    P12: "¿Puedes describir una escena en la que ese cambio se hiciera concreto?",
    P13_TEXT: "¿Puedes describir algo que siguiera presente aunque fuera poco visible desde fuera?",
    P19_TEXT: "¿Puedes describir un momento en que esa condición realmente ayudó?",
    D02_TEXT: "¿Cuál sería la señal más pequeña de que ese cambio ha empezado?",
  },
  nl: {
    M04_TEXT: "Welk deel van de reden die je net noemde is je nu nog het duidelijkst bijgebleven?",
    P12: "Kun je één moment beschrijven waarop die verandering echt merkbaar werd?",
    P13_TEXT: "Kun je iets noemen dat doorging, ook toen het van buitenaf nauwelijks zichtbaar was?",
    P19_TEXT: "Kun je één moment beschrijven waarop die voorwaarde daadwerkelijk hielp?",
    D02_TEXT: "Wat zou het kleinste teken zijn dat deze verandering is begonnen?",
  },
  ms: {
    M04_TEXT: "Daripada sebab yang baru anda tulis, apakah satu perkara yang masih paling jelas dalam ingatan anda?",
    P12: "Boleh ceritakan satu saat apabila perubahan itu benar-benar terasa dalam kehidupan atau aktiviti anda?",
    P13_TEXT: "Boleh ceritakan satu perkara yang terus berjalan walaupun tidak begitu kelihatan dari luar?",
    P19_TEXT: "Boleh ceritakan satu saat apabila keadaan itu benar-benar membantu?",
    D02_TEXT: "Apakah tanda paling kecil yang membuat anda rasa perubahan itu sudah bermula?",
  },
};

function fallbackQuestion(anchorId, language = "ko") {
  const lang = FALLBACKS[language] ? language : "en";
  return FALLBACKS[lang]?.[anchorId] || FALLBACKS.en[anchorId] || "Could you tell me one more concrete detail from what you just wrote?";
}

function authHeaders(anonKey) {
  return {
    "Content-Type": "application/json",
    ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
  };
}

function questionTextFromBody(body) {
  if (body?.question && typeof body.question === "object") return String(body.question.prompt || body.question.question_text || body.question.text || "").trim();
  return String(body?.question_text || body?.prompt || body?.question || "").trim();
}

function makeTurn({ anchorId, questionText, source, language, run, context, serverQuestionText = null }) {
  const axis = ANCHOR_AXES[anchorId] || "S";
  const id = `AI_ANCHOR_${anchorId}`;
  return {
    id,
    question_id: id,
    checkpoint: anchorId,
    anchor_id: anchorId,
    axis,
    focus: anchorId,
    prompt: questionText,
    question_text: questionText,
    intent: "앞선 주관식 응답에서 직접 이어지는 한 가지를 조금 더 듣습니다.",
    language,
    answer_field: `anchor_answer_${anchorId}`,
    self_check_field: null,
    source,
    provider: run?.provider || null,
    model: run?.model || null,
    request_id: run?.request_id || null,
    client_request_id: run?.client_request_id || run?.client_request_id_sent || null,
    client_request_id_sent: run?.client_request_id_sent || run?.client_request_id || null,
    client_request_id_returned: run?.client_request_id_returned || null,
    client_request_id_match: run?.client_request_id_match === true,
    answer_fingerprint: run?.answer_fingerprint || null,
    context_fingerprint: run?.context_fingerprint || null,
    server_question_text: serverQuestionText || questionText,
    dom_match: null,
    referenced_answers: [anchorId, ...(Array.isArray(context?.adjacent_response_ids) ? context.adjacent_response_ids : [])],
  };
}

export function buildAnchorContext({
  anchorId,
  questionLabel,
  answer,
  answers = {},
  rolePrimary = null,
  rolesParallel = [],
  responsePosition = null,
  dScope = null,
  responseLanguage = "ko",
  route = null,
  sessionId = null,
  responseId = null,
}) {
  const adjacent = [];
  const addAdjacent = (id, value) => {
    const text = Array.isArray(value)
      ? value.map((item) => normalizedAnchorText(item)).filter(Boolean).join(", ")
      : normalizedAnchorText(value);
    if (text) adjacent.push({ id, text });
  };
  if (anchorId === "M04_TEXT") addAdjacent("M02", answers.memory_clue_text);
  if (anchorId === "P12") {
    addAdjacent("P11", answers.transition_state);
    addAdjacent("P18", answers.pause_context_text);
  }
  if (anchorId === "P13_TEXT") {
    addAdjacent("P13", answers.invisible_continuity_state);
    addAdjacent("P12", answers.transition_text);
  }
  if (anchorId === "P19_TEXT") {
    addAdjacent("P19", answers.support_conditions);
    addAdjacent("P13_TEXT", answers.invisible_continuity_text);
  }
  if (anchorId === "D02_TEXT") {
    addAdjacent("D02", answers.d_desired_change_primary);
    addAdjacent("P19_TEXT", answers.support_conditions_text);
  }
  return {
    anchor_id: anchorId,
    question_id: anchorId,
    question_label: String(questionLabel || anchorId).slice(0, 600),
    answer: normalizedAnchorText(answer),
    verbatim_answer: normalizedAnchorText(answer),
    role_primary: rolePrimary,
    roles_parallel: Array.isArray(rolesParallel) ? rolesParallel.slice(0, 3) : [],
    response_position: responsePosition || null,
    d_scope: dScope || null,
    response_language: responseLanguage || "ko",
    route: route || null,
    session_id: sessionId || null,
    response_id: responseId || null,
    adjacent_responses: adjacent.slice(0, 3),
    adjacent_response_ids: adjacent.map((item) => item.id),
  };
}

export async function createAnchorFollowup({
  endpoint,
  anonKey,
  anchorId,
  context,
  responseLanguage = "ko",
  fetchImpl = fetch,
  timeoutMs = 23000,
}) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const answer = context?.verbatim_answer ?? context?.answer ?? "";
  const lowInfo = lowInformationReason(answer);
  const clientRequestId = crypto.randomUUID();
  const answerFingerprint = anchorAnswerFingerprint(anchorId, answer);
  const contextFingerprint = anchorContextFingerprint(anchorId, context);

  if (lowInfo) {
    return {
      decision: "skip",
      question: null,
      source: "skipped_low_information",
      run: {
        status: "skipped",
        operation: "anchor_followup",
        checkpoint: anchorId,
        anchor_id: anchorId,
        source: "skipped_low_information",
        provider: null,
        model: null,
        request_id: null,
        client_request_id: clientRequestId,
        client_request_id_sent: clientRequestId,
        client_request_id_returned: null,
        client_request_id_match: false,
        started_at: startedAt,
        latency_ms: Math.round(performance.now() - started),
        http_status: null,
        error_code: null,
        fallback_reason: lowInfo,
        answer_fingerprint: answerFingerprint,
        context_fingerprint: contextFingerprint,
        network_calls: 0,
      },
    };
  }

  if (!endpoint) {
    const text = fallbackQuestion(anchorId, responseLanguage);
    const run = {
      status: "fallback",
      operation: "anchor_followup",
      checkpoint: anchorId,
      anchor_id: anchorId,
      source: "fallback",
      provider: null,
      model: null,
      request_id: null,
      client_request_id: clientRequestId,
      client_request_id_sent: clientRequestId,
      client_request_id_returned: null,
      client_request_id_match: false,
      started_at: startedAt,
      latency_ms: Math.round(performance.now() - started),
      http_status: null,
      error_code: "AI_ENDPOINT_MISSING",
      fallback_reason: "endpoint_missing",
      answer_fingerprint: answerFingerprint,
        context_fingerprint: contextFingerprint,
      network_calls: 0,
    };
    return { decision: "ask", source: "fallback", question: makeTurn({ anchorId, questionText: text, source: "fallback", language: responseLanguage, run, context }), run };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: authHeaders(anonKey),
      body: JSON.stringify({ operation: "anchor_followup", context: { ...context, client_request_id: clientRequestId } }),
      signal: controller.signal,
    });
    const raw = await response.text();
    let body = {};
    try { body = JSON.parse(raw || "{}"); } catch { body = { raw_text: raw }; }
    const requestId = String(body.request_id || response.headers?.get?.("x-request-id") || "").trim() || null;
    const serverClientRequestId = String(body.client_request_id || "").trim() || null;
    const clientRequestIdMatch = Boolean(serverClientRequestId && serverClientRequestId === clientRequestId);
    const provider = String(body.provider || "").toLowerCase() || null;
    const serverSource = String(body.source || "").toLowerCase() || null;
    const serverQuestion = questionTextFromBody(body);
    const runBase = {
      operation: "anchor_followup",
      checkpoint: anchorId,
      anchor_id: anchorId,
      provider,
      model: body.model || null,
      request_id: requestId,
      client_request_id: clientRequestId,
      client_request_id_sent: clientRequestId,
      client_request_id_returned: serverClientRequestId,
      client_request_id_match: clientRequestIdMatch,
      started_at: body.started_at || startedAt,
      latency_ms: body.latency_ms ?? Math.round(performance.now() - started),
      http_status: response.status,
      answer_fingerprint: answerFingerprint,
        context_fingerprint: contextFingerprint,
      network_calls: 1,
    };

    if (response.ok && serverSource === "skipped_low_information") {
      return {
        decision: "skip",
        question: null,
        source: "skipped_low_information",
        run: { ...runBase, status: "skipped", source: "skipped_low_information", error_code: null, fallback_reason: body.fallback_reason || "server_low_information" },
      };
    }

    if (response.ok && provider === "motif" && serverSource === "motif" && serverQuestion) {
      const run = { ...runBase, status: "success", source: "motif", error_code: null, fallback_reason: null };
      return {
        decision: "ask",
        source: "motif",
        question: makeTurn({ anchorId, questionText: serverQuestion, source: "motif", language: responseLanguage, run, context, serverQuestionText: serverQuestion }),
        run,
      };
    }

    const reason = response.ok ? "server_not_verified_motif" : (response.status === 429 ? "http_429" : `http_${response.status}`);
    const text = fallbackQuestion(anchorId, responseLanguage);
    const run = {
      ...runBase,
      status: "fallback",
      source: "fallback",
      error_code: body.error_code || body.error?.code || (response.ok ? "UNVERIFIED_PROVIDER_RESPONSE" : `HTTP_${response.status}`),
      fallback_reason: reason,
    };
    return { decision: "ask", source: "fallback", question: makeTurn({ anchorId, questionText: text, source: "fallback", language: responseLanguage, run, context }), run };
  } catch (error) {
    const errorCode = error?.name === "AbortError" ? "BROWSER_TIMEOUT" : (error?.message || "NETWORK_ERROR");
    const text = fallbackQuestion(anchorId, responseLanguage);
    const run = {
      status: "fallback",
      operation: "anchor_followup",
      checkpoint: anchorId,
      anchor_id: anchorId,
      source: "fallback",
      provider: null,
      model: null,
      request_id: null,
      client_request_id: clientRequestId,
      client_request_id_sent: clientRequestId,
      client_request_id_returned: null,
      client_request_id_match: false,
      started_at: startedAt,
      latency_ms: Math.round(performance.now() - started),
      http_status: null,
      error_code: errorCode,
      fallback_reason: error?.name === "AbortError" ? "browser_timeout" : "network_error",
      answer_fingerprint: answerFingerprint,
        context_fingerprint: contextFingerprint,
      network_calls: 1,
    };
    return { decision: "ask", source: "fallback", question: makeTurn({ anchorId, questionText: text, source: "fallback", language: responseLanguage, run, context }), run };
  } finally {
    clearTimeout(timer);
  }
}

export function upsertAnchorTurn(turns = [], turn) {
  if (!turn?.checkpoint) return [...turns];
  return [...turns.filter((item) => item?.checkpoint !== turn.checkpoint), turn];
}

export function reconcileAnchorTurnsAfterQuestionEdit({
  turns = [],
  runs = [],
  statuses = {},
  affectedAnchors = ANCHOR_ORDER,
  fingerprintForAnchor,
} = {}) {
  const removed = new Set();
  for (const anchorId of affectedAnchors) {
    const turn = [...turns].reverse().find((item) => item?.checkpoint === anchorId || item?.anchor_id === anchorId);
    const run = [...runs].reverse().find((item) => item?.checkpoint === anchorId || item?.anchor_id === anchorId);
    if (!turn && !run && !Object.hasOwn(statuses || {}, anchorId)) continue;
    const stored = turn?.context_fingerprint || run?.context_fingerprint || null;
    const current = typeof fingerprintForAnchor === "function" ? fingerprintForAnchor(anchorId) : null;
    if (!stored || !current || stored !== current) removed.add(anchorId);
  }
  return {
    removed: [...removed],
    turns: turns.filter((item) => !removed.has(item?.checkpoint || item?.anchor_id)),
    runs: runs.filter((item) => !removed.has(item?.checkpoint || item?.anchor_id)),
    statuses: Object.fromEntries(Object.entries(statuses || {}).filter(([key]) => !removed.has(key))),
  };
}

export function isStrictRealMotifPass(run, domMatch = run?.dom_match) {
  return Boolean(
    run?.source === "motif"
    && run?.provider === "motif"
    && run?.request_id
    && run?.client_request_id_match === true
    && domMatch === true
  );
}

export function aggregateAnchorSource(runs = []) {
  const real = runs.filter((run) => run?.operation === "anchor_followup" && ["motif", "fallback"].includes(run?.source));
  if (!real.length) return runs.some((run) => run?.source === "skipped_low_information") ? "skipped_low_information" : null;
  const sources = new Set(real.map((run) => run.source));
  if (sources.size === 1) return [...sources][0];
  return "mixed";
}

export function verifyDomQuestion(turn, domText) {
  const serverText = normalizedAnchorText(turn?.server_question_text || turn?.prompt || "");
  const rendered = normalizedAnchorText(domText || "");
  const renderedQuestion = rendered.startsWith("한 걸음 더 — ") ? rendered.slice("한 걸음 더 — ".length) : rendered;
  return Boolean(serverText && renderedQuestion && serverText === renderedQuestion);
}
