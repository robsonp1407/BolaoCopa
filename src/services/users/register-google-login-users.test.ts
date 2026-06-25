import { describe, expect, it, vi } from "vitest";

import { registerGoogleLoginUsers } from "./register-google-login-users";

function createPrismaMock() {
  const tx = {
    pool: {
      findUnique: vi.fn(async () => ({
        id: "pool-1",
        status: "ACTIVE",
        joinCode: "ABC123",
        maxParticipants: null,
        members: []
      }))
    },
    user: {
      findMany: vi.fn(async () => []),
      findUnique: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "user-existing" }),
      create: vi.fn(async ({ data }) => ({
        id: "user-created",
        name: data.name,
        email: data.email
      })),
      update: vi.fn(async ({ data }) => ({
        id: "user-existing",
        name: data.name,
        email: "existing@example.com"
      }))
    },
    poolMember: {
      findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: "membership-existing"
      }),
      count: vi.fn(async () => 0),
      create: vi.fn(async ({ data }) => ({ id: "membership-created", ...data }))
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    }
  };

  return {
    tx,
    prisma: {
      $transaction: vi.fn(async (callback) => callback(tx))
    }
  };
}

describe("registerGoogleLoginUsers", () => {
  it("creates missing users, updates existing users and links pool memberships idempotently", async () => {
    const { prisma, tx } = createPrismaMock();

    const summary = await registerGoogleLoginUsers(
      prisma as never,
      [
        { name: "New User", email: " NEW@EXAMPLE.COM " },
        { name: "Existing User", email: "existing@example.com" }
      ],
      { joinCode: "ABC123" }
    );

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "New User",
          email: "new@example.com",
          role: "PARTICIPANT"
        })
      })
    );
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "Existing User" }
      })
    );
    expect(tx.poolMember.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "POOL_JOINED",
          metadata: expect.objectContaining({
            source: "register-google-login-users"
          })
        })
      })
    );
    expect(summary).toEqual(
      expect.objectContaining({
        usersCreated: 1,
        usersUpdated: 1,
        poolMembershipsCreated: 1,
        poolMembershipsExisting: 1
      })
    );
  });

  it("rejects duplicate emails before writing", async () => {
    const { prisma, tx } = createPrismaMock();

    await expect(
      registerGoogleLoginUsers(prisma as never, [
        { name: "User One", email: "same@example.com" },
        { name: "User Two", email: " SAME@example.com " }
      ])
    ).rejects.toThrow("E-mail duplicado");

    expect(tx.user.create).not.toHaveBeenCalled();
  });
});
