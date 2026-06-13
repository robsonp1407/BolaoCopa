import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { registerMatchResult } from "@/services/tournament/register-result";
import { canManageOfficialResults } from "@/services/tournament/admin-auth";
import { registerMatchResultSchema } from "@/lib/validations/tournament";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!canManageOfficialResults(session?.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = registerMatchResultSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const params = await context.params;
  const result = await registerMatchResult(prisma, {
    matchId: params.id,
    userId: session.user.id,
    ...parsedBody.data
  });

  return NextResponse.json({
    ok: true,
    matchId: result.match.id,
    recalculation: result.summary
  });
}
