import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { predictionErrorResponse } from "@/services/predictions/http";
import { listPredictions } from "@/services/predictions/list-predictions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const result = await listPredictions(prisma, {
      poolId: params.id,
      userId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return predictionErrorResponse(error);
  }
}
