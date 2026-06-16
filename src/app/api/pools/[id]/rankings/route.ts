import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rankingQuerySchema } from "@/lib/validations/ranking";
import { getPoolRanking } from "@/services/rankings/get-ranking";
import { poolErrorResponse } from "@/services/pools/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsedQuery = rankingQuerySchema.safeParse({
    scope: url.searchParams.get("scope") ?? undefined,
    scopeKey: url.searchParams.get("scopeKey") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Parametros invalidos",
        issues: parsedQuery.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const params = await context.params;

  try {
    const ranking = await getPoolRanking(prisma, {
      poolId: params.id,
      userId: session.user.id,
      ...parsedQuery.data
    });

    return NextResponse.json(ranking);
  } catch (error) {
    return poolErrorResponse(error);
  }
}
