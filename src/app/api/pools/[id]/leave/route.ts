import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { poolErrorResponse } from "@/services/pools/http";
import { leavePool } from "@/services/pools/leave-pool";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const result = await leavePool(prisma, {
      poolId: params.id,
      userId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return poolErrorResponse(error);
  }
}
