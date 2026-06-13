import { describe, expect, it, vi } from "vitest";

import { deletePool } from "./delete-pool";
import { leavePool } from "./leave-pool";
import { updatePool } from "./update-pool";

describe("pool mutation services", () => {
  it("updates a pool when user can manage it", async () => {
    const prisma = {
      poolMember: {
        findUnique: vi.fn(async () => ({ role: "OWNER" }))
      },
      pool: {
        update: vi.fn(async ({ data }) => ({ id: "pool-1", ...data }))
      },
      auditLog: { create: vi.fn(async () => ({})) }
    };

    const pool = await updatePool(prisma as never, {
      poolId: "pool-1",
      userId: "user-1",
      userRole: "ORGANIZER",
      data: { name: "Novo nome" }
    });

    expect(pool).toMatchObject({ id: "pool-1", name: "Novo nome" });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POOL_UPDATED" })
      })
    );
  });

  it("soft deletes a pool", async () => {
    const prisma = {
      poolMember: {
        findUnique: vi.fn(async () => ({ role: "OWNER" }))
      },
      pool: {
        update: vi.fn(async ({ data }) => ({ id: "pool-1", slug: "bolao", ...data }))
      },
      auditLog: { create: vi.fn(async () => ({})) }
    };

    const pool = await deletePool(prisma as never, {
      poolId: "pool-1",
      userId: "user-1",
      userRole: "ORGANIZER"
    });

    expect(pool.status).toBe("DELETED");
    expect(pool.deletedAt).toBeInstanceOf(Date);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POOL_DELETED" })
      })
    );
  });

  it("prevents owner from leaving without ownership transfer", async () => {
    const prisma = {
      $transaction: vi.fn(async (callback) =>
        callback({
          poolMember: {
            findUnique: vi.fn(async () => ({ id: "member-1", role: "OWNER" }))
          },
          auditLog: { create: vi.fn(async () => ({})) }
        })
      )
    };

    await expect(
      leavePool(prisma as never, { poolId: "pool-1", userId: "user-1" })
    ).rejects.toMatchObject({ code: "OWNER_CANNOT_LEAVE" });
  });

  it("allows a regular member to leave", async () => {
    const tx = {
      poolMember: {
        findUnique: vi.fn(async () => ({ id: "member-1", role: "MEMBER" })),
        delete: vi.fn(async () => ({}))
      },
      auditLog: { create: vi.fn(async () => ({})) }
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    await expect(
      leavePool(prisma as never, { poolId: "pool-1", userId: "user-1" })
    ).resolves.toEqual({ ok: true });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POOL_LEFT" })
      })
    );
  });
});
