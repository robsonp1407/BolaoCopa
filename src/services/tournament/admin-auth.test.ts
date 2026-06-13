import { describe, expect, it } from "vitest";

import { canManageOfficialResults } from "./admin-auth";

describe("canManageOfficialResults", () => {
  it("allows only admins to manage official results", () => {
    expect(canManageOfficialResults("ADMIN")).toBe(true);
    expect(canManageOfficialResults("ORGANIZER")).toBe(false);
    expect(canManageOfficialResults("PARTICIPANT")).toBe(false);
    expect(canManageOfficialResults(undefined)).toBe(false);
  });
});
