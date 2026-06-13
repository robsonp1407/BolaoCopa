import type { AuditAction, Prisma } from "@prisma/client";

type AuditClient = {
  auditLog: {
    create: (args: {
      data: {
        action: AuditAction;
        entity: string;
        entityId?: string | null;
        userId?: string | null;
        metadata?: Prisma.InputJsonValue;
      };
    }) => Promise<unknown>;
  };
};

type AuditInput = {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog(client: AuditClient, input: AuditInput) {
  await client.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      userId: input.userId,
      metadata: input.metadata
    }
  });
}
