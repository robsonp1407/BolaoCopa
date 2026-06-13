import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { transferPoolOwnerSchema } from "@/lib/validations/pool";
import { poolErrorResponse } from "@/services/pools/http";
import { transferPoolOwner } from "@/services/pools/transfer-owner";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id || !session.user.role) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = transferPoolOwnerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const params = await context.params;

  try {
    const result = await transferPoolOwner(prisma, {
      poolId: params.id,
      newOwnerUserId: parsedBody.data.userId,
      actorUserId: session.user.id,
      actorRole: session.user.role
    });

    return NextResponse.json(result);
  } catch (error) {
    return poolErrorResponse(error);
  }
}
