import { describe, expect, it } from "vitest";
import { createParticipantAccessToken, createParticipantCode, createParticipantReference, publicParticipantReference } from "./participant-reference.js";

const deterministicRandom = (buffer) => {
  buffer.forEach((_, index) => { buffer[index] = index + 1; });
  return buffer;
};

describe("participant reference contract", () => {
  it("keeps the readable reference separate from the opaque access token", () => {
    const reference = createParticipantReference({ randomValues: deterministicRandom });
    expect(reference.code).toMatch(/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){2}$/);
    expect(reference.access_token).toHaveLength(32);
    expect(reference.access_token).not.toContain(reference.code.replaceAll("-", ""));
    expect(publicParticipantReference(reference)).toEqual({
      code: reference.code,
      access_model: "opaque_token_required",
      version: "over39-participant-reference-v1-2026-08-14",
    });
  });

  it("does not use a sequential identifier as a participant code", () => {
    expect(createParticipantCode({ randomValues: deterministicRandom })).not.toMatch(/^\d+$/);
    expect(createParticipantAccessToken({ randomValues: deterministicRandom })).not.toMatch(/^\d+$/);
  });
});

