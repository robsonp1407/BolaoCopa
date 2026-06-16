import { describe, expect, it } from "vitest";

import { getPrimaryNavigation } from "./navigation";

describe("getPrimaryNavigation", () => {
  it("returns public links for anonymous users", () => {
    expect(getPrimaryNavigation({ isAuthenticated: false })).toEqual([
      { label: "Login", href: "/login" },
      { label: "Cadastro", href: "/cadastro" }
    ]);
  });

  it("returns operational links for authenticated participants", () => {
    expect(
      getPrimaryNavigation({ isAuthenticated: true, role: "PARTICIPANT" })
    ).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Boloes", href: "/pools" }
    ]);
  });

  it("adds admin area only for admins", () => {
    expect(getPrimaryNavigation({ isAuthenticated: true, role: "ADMIN" })).toContainEqual({
      label: "Admin",
      href: "/admin"
    });
  });
});
