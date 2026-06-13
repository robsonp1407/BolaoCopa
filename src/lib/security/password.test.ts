import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/security/password";

describe("password security", () => {
  it("hashes and verifies passwords with bcrypt", async () => {
    const hash = await hashPassword("senha123");

    expect(hash).not.toBe("senha123");
    await expect(verifyPassword("senha123", hash)).resolves.toBe(true);
    await expect(verifyPassword("outra123", hash)).resolves.toBe(false);
  });
});
