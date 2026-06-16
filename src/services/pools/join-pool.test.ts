import { describe, expect, it, vi } from "vitest";

import { hashPassword } from "@/lib/security/password";

import { PoolServiceError } from "./errors";
import { joinPool } from "./join-pool";

function createPrismaMock(pool: unknown) {
  const tx = {
    pool: { findUnique: vi.fn(async () => pool) },
    poolMember: {
      create: vi.fn(async ({ data }) => ({ id: "member-1", ...data }))
    },
    auditLog: { create: vi.fn(async () => ({})) }
  };

  return {
    tx,
    prisma: {
      $transaction: vi.fn(async (callback) => callback(tx))
    }
  };
}

describe("joinPool", () => {
  it("allows joining by code", async () => {
    const { prisma, tx } = createPrismaMock({
      id: "pool-1",
      status: "ACTIVE",
      joinCode: "ABC123",
      passwordHash: null,
      maxParticipants: null,
      members: []
    });

    const member = await joinPool(prisma as never, {
      joinCode: "ABC123",
      userId: "user-1"
    });

    expect(member).toMatchObject({ poolId: "pool-1", userId: "user-1", role: "MEMBER" });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POOL_JOINED" })
      })
    );
  });

  it("allows joining protected pool with password", async () => {
    const passwordHash = await hashPassword("123456");
    const { prisma } = createPrismaMock({
      id: "pool-1",
      status: "ACTIVE",
      joinCode: "ABC123",
      passwordHash,
      maxParticipants: null,
      members: []
    });

    await expect(
      joinPool(prisma as never, {
        joinCode: "ABC123",
        password: "123456",
        userId: "user-1"
      })
    ).resolves.toMatchObject({ userId: "user-1" });
  });

  it("blocks wrong password", async () => {
    const passwordHash = await hashPassword("123456");
    const { prisma } = createPrismaMock({
      id: "pool-1",
      status: "ACTIVE",
      joinCode: "ABC123",
      passwordHash,
      maxParticipants: null,
      members: []
    });

    await expect(
      joinPool(prisma as never, {
        joinCode: "ABC123",
        password: "errada",
        userId: "user-1"
      })
    ).rejects.toMatchObject(new PoolServiceError("Senha do bolao invalida", 403, "POOL_PASSWORD_INVALID"));
  });

  it("blocks private pool without password hash", async () => {
    const { prisma } = createPrismaMock({
      id: "pool-1",
      status: "ACTIVE",
      joinCode: "ABC123",
      isPrivate: true,
      passwordHash: null,
      maxParticipants: null,
      members: []
    });

    await expect(
      joinPool(prisma as never, {
        joinCode: "ABC123",
        userId: "user-1"
      })
    ).rejects.toMatchObject({ code: "POOL_PASSWORD_INVALID" });
  });

  it("blocks participant limit and duplicate members", async () => {
    const limitMock = createPrismaMock({
      id: "pool-1",
      status: "ACTIVE",
      joinCode: "ABC123",
      passwordHash: null,
      maxParticipants: 1,
      members: [{ userId: "other-user" }]
    });
    const duplicateMock = createPrismaMock({
      id: "pool-1",
      status: "ACTIVE",
      joinCode: "ABC123",
      passwordHash: null,
      maxParticipants: null,
      members: [{ userId: "user-1" }]
    });

    await expect(
      joinPool(limitMock.prisma as never, { joinCode: "ABC123", userId: "user-1" })
    ).rejects.toMatchObject({ code: "POOL_PARTICIPANT_LIMIT" });
    await expect(
      joinPool(duplicateMock.prisma as never, { joinCode: "ABC123", userId: "user-1" })
    ).rejects.toMatchObject({ code: "POOL_MEMBER_DUPLICATE" });
  });
});
