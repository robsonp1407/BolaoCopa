import type { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/lib/security/password";
import type { CreatePoolInput } from "@/lib/validations/pool";
import { createAuditLog } from "@/services/tournament/audit";

import { DEFAULT_SCORE_RULE } from "./default-score-rule";
import { generateJoinCode } from "./join-code";
import { buildSlugCandidate } from "./slug";

export async function createPool(
  prisma: PrismaClient,
  input: CreatePoolInput & { ownerId: string }
) {
  const [slug, joinCode, passwordHash] = await Promise.all([
    createUniqueSlug(prisma, input.name),
    createUniqueJoinCode(prisma),
    input.password ? hashPassword(input.password) : Promise.resolve(null)
  ]);

  return prisma.$transaction(async (tx) => {
    const pool = await tx.pool.create({
      data: {
        slug,
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
        passwordHash,
        joinCode,
        isPrivate: input.isPrivate,
        maxParticipants: input.maxParticipants ?? null,
        ownerId: input.ownerId,
        members: {
          create: {
            userId: input.ownerId,
            role: "OWNER"
          }
        },
        scoreRule: {
          create: DEFAULT_SCORE_RULE
        }
      },
      include: {
        members: true,
        scoreRule: true
      }
    });

    await createAuditLog(tx, {
      action: "POOL_CREATED",
      entity: "Pool",
      entityId: pool.id,
      userId: input.ownerId,
      metadata: {
        name: pool.name,
        joinCode: pool.joinCode,
        isPrivate: pool.isPrivate,
        maxParticipants: pool.maxParticipants
      }
    });

    return pool;
  });
}

async function createUniqueSlug(prisma: PrismaClient, name: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = buildSlugCandidate(
      name,
      attempt === 0 ? undefined : String(attempt + 1)
    );
    const existingPool = await prisma.pool.findUnique({ where: { slug } });

    if (!existingPool) {
      return slug;
    }
  }

  return buildSlugCandidate(name, generateJoinCode(4).toLowerCase());
}

async function createUniqueJoinCode(prisma: PrismaClient) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const joinCode = generateJoinCode();
    const existingPool = await prisma.pool.findUnique({ where: { joinCode } });

    if (!existingPool) {
      return joinCode;
    }
  }

  throw new Error("Nao foi possivel gerar codigo unico para o bolao");
}
