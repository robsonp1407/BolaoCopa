import { describe, expect, it } from "vitest";

import { hasRole, isAdmin, isOrganizerOrAdmin } from "@/lib/auth/roles";

describe("role helpers", () => {
  it("checks role hierarchy", () => {
    expect(hasRole("ADMIN", "PARTICIPANT")).toBe(true);
    expect(hasRole("ORGANIZER", "PARTICIPANT")).toBe(true);
    expect(hasRole("PARTICIPANT", "ORGANIZER")).toBe(false);
    expect(hasRole(undefined, "PARTICIPANT")).toBe(false);
  });

  it("detects admin and organizer permissions", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("ORGANIZER")).toBe(false);
    expect(isOrganizerOrAdmin("ADMIN")).toBe(true);
    expect(isOrganizerOrAdmin("ORGANIZER")).toBe(true);
    expect(isOrganizerOrAdmin("PARTICIPANT")).toBe(false);
  });
});
