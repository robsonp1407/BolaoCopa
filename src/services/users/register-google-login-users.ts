import type { Prisma, PrismaClient } from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

export type GoogleLoginUserInput = {
  name: string;
  email: string;
};

export type RegisterGoogleLoginUsersOptions = {
  joinCode?: string;
};

export type RegisteredGoogleLoginUser = {
  id: string;
  name: string | null;
  email: string;
  userCreated: boolean;
  poolMembershipCreated: boolean;
};

export type RegisterGoogleLoginUsersSummary = {
  usersCreated: number;
  usersUpdated: number;
  poolMembershipsCreated: number;
  poolMembershipsExisting: number;
  users: RegisteredGoogleLoginUser[];
};

export async function registerGoogleLoginUsers(
  prisma: PrismaClient,
  users: GoogleLoginUserInput[],
  options: RegisterGoogleLoginUsersOptions = {}
): Promise<RegisterGoogleLoginUsersSummary> {
  return prisma.$transaction(async (tx) => {
    const pool = options.joinCode
      ? await tx.pool.findUnique({
          where: { joinCode: options.joinCode },
          select: {
            id: true,
            status: true,
            joinCode: true,
            maxParticipants: true,
            members: { select: { userId: true } }
          }
        })
      : null;

    if (options.joinCode && (!pool || pool.status !== "ACTIVE")) {
      throw new Error("Bolao ativo nao encontrado para o codigo informado.");
    }

    const normalizedUsers = normalizeUsers(users);

    const registeredUsers: RegisteredGoogleLoginUser[] = [];
    let usersCreated = 0;
    let usersUpdated = 0;
    let poolMembershipsCreated = 0;
    let poolMembershipsExisting = 0;

    for (const input of normalizedUsers) {
      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
        select: { id: true }
      });

      const user = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: { name: input.name },
            select: { id: true, name: true, email: true }
          })
        : await tx.user.create({
            data: {
              name: input.name,
              email: input.email,
              role: "PARTICIPANT"
            },
            select: { id: true, name: true, email: true }
          });

      if (existingUser) {
        usersUpdated += 1;
      } else {
        usersCreated += 1;
      }

      const poolMembershipCreated = pool
        ? await ensurePoolMembership(tx, {
            poolId: pool.id,
            joinCode: pool.joinCode,
            maxParticipants: pool.maxParticipants,
            userId: user.id
          })
        : false;

      if (poolMembershipCreated) {
        poolMembershipsCreated += 1;
      } else if (pool) {
        poolMembershipsExisting += 1;
      }

      registeredUsers.push({
        ...user,
        userCreated: !existingUser,
        poolMembershipCreated
      });
    }

    return {
      usersCreated,
      usersUpdated,
      poolMembershipsCreated,
      poolMembershipsExisting,
      users: registeredUsers
    };
  });
}

function normalizeUsers(users: GoogleLoginUserInput[]) {
  const seenEmails = new Set<string>();

  return users.map((user) => {
    const email = user.email.trim().toLowerCase();
    const name = user.name.trim();

    if (!email || !name) {
      throw new Error("Nome e e-mail sao obrigatorios.");
    }

    if (seenEmails.has(email)) {
      throw new Error(`E-mail duplicado na lista: ${email}`);
    }

    seenEmails.add(email);

    return { name, email };
  });
}

async function ensurePoolMembership(
  tx: TransactionClient,
  input: {
    poolId: string;
    joinCode: string;
    maxParticipants: number | null;
    userId: string;
  }
) {
  const existingMembership = await tx.poolMember.findUnique({
    where: {
      poolId_userId: {
        poolId: input.poolId,
        userId: input.userId
      }
    },
    select: { id: true }
  });

  if (existingMembership) {
    return false;
  }

  if (input.maxParticipants !== null) {
    const membersCount = await tx.poolMember.count({
      where: { poolId: input.poolId }
    });

    if (membersCount >= input.maxParticipants) {
      throw new Error("Limite de participantes do bolao seria excedido.");
    }
  }

  await tx.poolMember.create({
    data: {
      poolId: input.poolId,
      userId: input.userId,
      role: "MEMBER"
    }
  });

  await tx.auditLog.create({
    data: {
      action: "POOL_JOINED",
      entity: "Pool",
      entityId: input.poolId,
      userId: input.userId,
      metadata: {
        joinCode: input.joinCode,
        source: "register-google-login-users"
      }
    }
  });

  return true;
}
