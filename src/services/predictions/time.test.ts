import { describe, expect, it } from "vitest";

import { isPredictionOpen } from "./time";

describe("isPredictionOpen", () => {
  it("allows predictions only before match start", () => {
    const startsAt = new Date("2026-06-11T19:00:00.000Z");

    expect(
      isPredictionOpen(startsAt, new Date("2026-06-11T18:59:59.000Z"))
    ).toBe(true);
    expect(
      isPredictionOpen(startsAt, new Date("2026-06-11T19:00:00.000Z"))
    ).toBe(false);
  });

  it("closes predictions when match start is unknown", () => {
    expect(isPredictionOpen(null, new Date("2026-06-11T18:00:00.000Z"))).toBe(
      false
    );
  });
});
