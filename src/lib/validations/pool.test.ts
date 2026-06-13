import { describe, expect, it } from "vitest";

import { createPoolSchema, joinPoolSchema, updatePoolSchema } from "./pool";

describe("pool validations", () => {
  it("requires password for private pools", () => {
    const parsed = createPoolSchema.safeParse({
      name: "Bolao Familia",
      isPrivate: true
    });

    expect(parsed.success).toBe(false);
  });

  it("normalizes join code", () => {
    const parsed = joinPoolSchema.parse({ joinCode: "abc123" });

    expect(parsed.joinCode).toBe("ABC123");
  });

  it("requires at least one field when updating", () => {
    expect(updatePoolSchema.safeParse({}).success).toBe(false);
    expect(updatePoolSchema.safeParse({ name: "Novo bolao" }).success).toBe(true);
  });
});
