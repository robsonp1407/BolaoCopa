import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { poolErrorResponse } from "@/services/pools/http";
import { removePoolMember } from "@/services/pools/remove-member";

type RouteContext = {
  params: Promise<{ id: string; userId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id || !session.user.role) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const result = await removePoolMember(prisma, {
      poolId: params.id,
      targetUserId: params.userId,
      actorUserId: session.user.id,
      actorRole: session.user.role
    });

    return NextResponse.json(result);
  } catch (error) {
    return poolErrorResponse(error);
  }
}
