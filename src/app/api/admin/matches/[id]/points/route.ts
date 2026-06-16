import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { recalculateMatchPoints } from "@/services/scoring/recalculate-match-points";
import { canManageOfficialResults } from "@/services/tournament/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!canManageOfficialResults(session?.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const params = await context.params;
  const summary = await recalculateMatchPoints(prisma, {
    matchId: params.id,
    userId: session.user.id
  });

  return NextResponse.json({ ok: true, pointsRecalculation: summary });
}
