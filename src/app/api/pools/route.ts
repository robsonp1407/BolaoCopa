import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createPoolSchema } from "@/lib/validations/pool";
import { createPool } from "@/services/pools/create-pool";
import { listVisiblePools } from "@/services/pools/get-pools";
import { poolErrorResponse } from "@/services/pools/http";
import { canCreatePool } from "@/services/pools/permissions";

export async function GET() {
  const session = await auth();
  const pools = await listVisiblePools(prisma, {
    userId: session?.user.id
  });

  return NextResponse.json({ pools });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  if (!canCreatePool(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createPoolSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const pool = await createPool(prisma, {
      ...parsedBody.data,
      ownerId: session.user.id
    });

    return NextResponse.json({ pool }, { status: 201 });
  } catch (error) {
    return poolErrorResponse(error);
  }
}
