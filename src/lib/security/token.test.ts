import { describe, expect, it } from "vitest";

import { addMinutes, generatePasswordResetToken, hashToken } from "@/lib/security/token";

describe("password reset tokens", () => {
  it("generates random hex tokens", () => {
    const firstToken = generatePasswordResetToken();
    const secondToken = generatePasswordResetToken();

    expect(firstToken).toHaveLength(64);
    expect(secondToken).toHaveLength(64);
    expect(firstToken).not.toBe(secondToken);
  });

  it("hashes the same token consistently", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe("abc");
  });

  it("adds minutes to a date", () => {
    const date = new Date("2026-06-11T12:00:00.000Z");

    expect(addMinutes(date, 30).toISOString()).toBe("2026-06-11T12:30:00.000Z");
  });
});
