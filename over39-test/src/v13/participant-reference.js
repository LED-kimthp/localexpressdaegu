// A participant-facing reference is deliberately not an access credential.
// The code helps a person recognise their record; a separate opaque token is
// required by the server for any future record or mailbox access.

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytes(size, randomValues) {
  const output = new Uint8Array(size);
  if (randomValues) return randomValues(output) || output;
  if (!globalThis.crypto?.getRandomValues) throw new Error("SECURE_RANDOM_UNAVAILABLE");
  return globalThis.crypto.getRandomValues(output);
}

function pick(alphabet, count, randomValues) {
  const source = bytes(count, randomValues);
  return [...source].map((value) => alphabet[value % alphabet.length]).join("");
}

export function createParticipantCode({ randomValues } = {}) {
  // 12 base32-ish characters (~60 bits). This is a recognition code only and
  // is never sufficient to read a response, contact detail, or greeting.
  const raw = pick(CODE_ALPHABET, 12, randomValues);
  return raw.match(/.{1,4}/g).join("-");
}

export function createParticipantAccessToken({ randomValues } = {}) {
  // 32 URL-safe random characters (~192 bits when crypto is used).
  return pick(TOKEN_ALPHABET, 32, randomValues);
}

export function createParticipantReference({ randomValues } = {}) {
  return {
    code: createParticipantCode({ randomValues }),
    access_token: createParticipantAccessToken({ randomValues }),
    access_model: "opaque_token_required",
    version: "over39-participant-reference-v1-2026-08-14",
  };
}

export function publicParticipantReference(reference = {}) {
  return {
    code: String(reference.code || "").trim() || null,
    access_model: "opaque_token_required",
    version: reference.version || "over39-participant-reference-v1-2026-08-14",
  };
}

