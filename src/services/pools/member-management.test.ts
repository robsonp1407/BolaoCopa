import { describe, expect, it, vi } from "vitest";

import { removePoolMember } from "./remove-member";
import { transferPoolOwner } from "./transfer-owner";

describe("pool member management", () => {
  it("removes a non-owner member and records audit", async () => {
    const tx = {
      poolMember: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ role: "OWNER" })
          .mockResolvedValueOnce({ id: "member-2", role: "MEMBER" }),
        delete: vi.fn(async () => ({}))
      },
      auditLog: { create: vi.fn(async () => ({})) }
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    await expect(
      removePoolMember(prisma as never, {
        poolId: "pool-1",
        targetUserId: "user-2",
        actorUserId: "user-1",
        actorRole: "ORGANIZER"
      })
    ).resolves.toEqual({ ok: true });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POOL_MEMBER_REMOVED" })
      })
    );
  });

  it("blocks removing the owner", async () => {
    const tx = {
      poolMember: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ role: "OWNER" })
          .mockResolvedValueOnce({ id: "member-1", role: "OWNER" })
      }
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    await expect(
      removePoolMember(prisma as never, {
        poolId: "pool-1",
        targetUserId: "user-1",
        actorUserId: "user-1",
        actorRole: "ORGANIZER"
      })
    ).rejects.toMatchObject({ code: "OWNER_CANNOT_BE_REMOVED" });
  });

  it("transfers ownership to an existing member", async () => {
    const tx = {
      pool: {
        findUnique: vi.fn(async () => ({
          id: "pool-1",
          ownerId: "user-1",
          status: "ACTIVE",
          members: [
            { id: "member-1", userId: "user-1", role: "OWNER" },
            { id: "member-2", userId: "user-2", role: "MEMBER" }
          ]
        })),
        update: vi.fn(async () => ({}))
      },
      poolMember: {
        update: vi.fn(async () => ({}))
      },
      auditLog: { create: vi.fn(async () => ({})) }
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    await expect(
      transferPoolOwner(prisma as never, {
        poolId: "pool-1",
        newOwnerUserId: "user-2",
        actorUserId: "user-1",
        actorRole: "ORGANIZER"
      })
    ).resolves.toEqual({ ok: true });
    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { ownerId: "user-2" }
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POOL_OWNER_TRANSFERRED" })
      })
    );
  });
});
