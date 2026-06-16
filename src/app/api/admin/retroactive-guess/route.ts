import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { retroactivePredictionSchema } from "@/lib/validations/retroactive-prediction";
import { PredictionServiceError } from "@/services/predictions/errors";
import { upsertRetroactivePrediction } from "@/services/predictions/retroactive-prediction";
import { canManageOfficialResults } from "@/services/tournament/admin-auth";

export async function POST(request: Request) {
  const session = await auth();

  if (!canManageOfficialResults(session?.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = retroactivePredictionSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Dados invalidos",
        issues: parsedBody.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const result = await upsertRetroactivePrediction(prisma, {
      ...parsedBody.data,
      adminUserId: session.user.id
    });

    return NextResponse.json({
      ok: true,
      predictionId: result.prediction.id,
      pointsHistoryId: result.pointsHistory?.id ?? null
    });
  } catch (error) {
    if (error instanceof PredictionServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    throw error;
  }
}
