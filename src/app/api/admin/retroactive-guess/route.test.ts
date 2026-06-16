import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  upsertRetroactivePrediction: vi.fn()
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "participant-1",
      role: "PARTICIPANT"
    }
  }))
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {}
}));

vi.mock("@/services/predictions/retroactive-prediction", () => ({
  upsertRetroactivePrediction: mocks.upsertRetroactivePrediction
}));

describe("POST /api/admin/retroactive-guess", () => {
  it("returns 403 for a common participant", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/retroactive-guess", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          match_id: "match-1",
          pool_id: "pool-1",
          home_score: 2,
          away_score: 1
        })
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Acesso negado" });
    expect(mocks.upsertRetroactivePrediction).not.toHaveBeenCalled();
  });
});
