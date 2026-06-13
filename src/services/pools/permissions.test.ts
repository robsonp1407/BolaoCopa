import { describe, expect, it } from "vitest";

import { canCreatePool, canDeletePool, canManagePool } from "./permissions";

describe("pool permissions", () => {
  it("allows only admin and organizer to create pools", () => {
    expect(canCreatePool("ADMIN")).toBe(true);
    expect(canCreatePool("ORGANIZER")).toBe(true);
    expect(canCreatePool("PARTICIPANT")).toBe(false);
  });

  it("allows pool owner/admin or app admin to manage pools", () => {
    expect(canManagePool("ADMIN", undefined)).toBe(true);
    expect(canManagePool("PARTICIPANT", "OWNER")).toBe(true);
    expect(canManagePool("PARTICIPANT", "ADMIN")).toBe(true);
    expect(canManagePool("PARTICIPANT", "MEMBER")).toBe(false);
  });

  it("allows only owner or app admin to delete pools", () => {
    expect(canDeletePool("ADMIN", undefined)).toBe(true);
    expect(canDeletePool("PARTICIPANT", "OWNER")).toBe(true);
    expect(canDeletePool("ORGANIZER", "ADMIN")).toBe(false);
  });
});
