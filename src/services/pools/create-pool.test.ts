import { describe, expect, it, vi } from "vitest";

import { createPool } from "./create-pool";
import { DEFAULT_SCORE_RULE } from "./default-score-rule";

describe("createPool", () => {
  it("creates pool, owner membership, default score rule and audit", async () => {
    const tx = {
      pool: {
        create: vi.fn(async ({ data }) => ({
          id: "pool-1",
          name: data.name,
          joinCode: data.joinCode,
          isPrivate: data.isPrivate,
          maxParticipants: data.maxParticipants,
          members: [{ userId: "user-1", role: "OWNER" }],
          scoreRule: DEFAULT_SCORE_RULE
        }))
      },
      auditLog: { create: vi.fn(async () => ({})) }
    };
    const prisma = {
      pool: { findUnique: vi.fn(async () => null) },
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    const pool = await createPool(prisma as never, {
      ownerId: "user-1",
      name: "Bolao Familia Pavan",
      description: "Bolao privado",
      isPrivate: true,
      password: "123456",
      maxParticipants: 50
    });

    expect(pool.members).toEqual([{ userId: "user-1", role: "OWNER" }]);
    expect(pool.scoreRule).toEqual(DEFAULT_SCORE_RULE);
    expect(tx.pool.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "bolao-familia-pavan",
          passwordHash: expect.not.stringMatching("123456"),
          members: { create: { userId: "user-1", role: "OWNER" } },
          scoreRule: { create: DEFAULT_SCORE_RULE }
        })
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POOL_CREATED" })
      })
    );
  });
});
