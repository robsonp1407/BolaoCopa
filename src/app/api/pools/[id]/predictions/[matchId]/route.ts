import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { predictionPayloadSchema } from "@/lib/validations/prediction";
import { predictionErrorResponse } from "@/services/predictions/http";
import { upsertPrediction } from "@/services/predictions/upsert-prediction";

type RouteContext = {
  params: Promise<{ id: string; matchId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = predictionPayloadSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Dados invalidos",
        issues: parsedBody.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const params = await context.params;

  try {
    const prediction = await upsertPrediction(prisma, {
      poolId: params.id,
      userId: session.user.id,
      matchId: params.matchId,
      data: parsedBody.data
    });

    return NextResponse.json({ prediction });
  } catch (error) {
    return predictionErrorResponse(error);
  }
}
