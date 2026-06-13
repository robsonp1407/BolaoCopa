import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/services/tournament/audit";
import { canManageOfficialResults } from "@/services/tournament/admin-auth";
import { recalculateTournament } from "@/services/tournament/recalculate-tournament";

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
  const summary = await recalculateTournament(prisma);

  await createAuditLog(prisma, {
    action: "TOURNAMENT_RECALCULATED",
    entity: "Tournament",
    entityId: params.id,
    userId: session.user.id,
    metadata: { recalculation: summary }
  });

  return NextResponse.json({
    ok: true,
    tournamentId: params.id,
    recalculation: summary
  });
}
