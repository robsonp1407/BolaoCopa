import { describe, expect, it } from "vitest";

import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} from "@/lib/validations/auth";

describe("auth validations", () => {
  it("normalizes e-mail during login validation", () => {
    const parsed = loginSchema.parse({
      email: " USER@EXAMPLE.COM ",
      password: "secret"
    });

    expect(parsed.email).toBe("user@example.com");
  });

  it("requires strong enough passwords during registration", () => {
    const parsed = registerSchema.safeParse({
      name: "Robson",
      email: "robson@example.com",
      password: "somenteletras"
    });

    expect(parsed.success).toBe(false);
  });

  it("validates password reset requests", () => {
    expect(
      requestPasswordResetSchema.safeParse({ email: "pessoa@example.com" }).success
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        token: "a".repeat(64),
        password: "senha123"
      }).success
    ).toBe(true);
  });
});
