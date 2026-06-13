import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { updatePoolSchema } from "@/lib/validations/pool";
import { deletePool } from "@/services/pools/delete-pool";
import { getPoolDetails } from "@/services/pools/get-pools";
import { poolErrorResponse } from "@/services/pools/http";
import { updatePool } from "@/services/pools/update-pool";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const params = await context.params;
  const pool = await getPoolDetails(prisma, {
    poolId: params.id,
    userId: session?.user.id
  });

  if (!pool) {
    return NextResponse.json({ error: "Bolao nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ pool });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id || !session.user.role) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = updatePoolSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const params = await context.params;

  try {
    const pool = await updatePool(prisma, {
      poolId: params.id,
      userId: session.user.id,
      userRole: session.user.role,
      data: parsedBody.data
    });

    return NextResponse.json({ pool });
  } catch (error) {
    return poolErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id || !session.user.role) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const pool = await deletePool(prisma, {
      poolId: params.id,
      userId: session.user.id,
      userRole: session.user.role
    });

    return NextResponse.json({ pool });
  } catch (error) {
    return poolErrorResponse(error);
  }
}
