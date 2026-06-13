import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { joinPoolSchema } from "@/lib/validations/pool";
import { poolErrorResponse } from "@/services/pools/http";
import { joinPool } from "@/services/pools/join-pool";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = joinPoolSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const member = await joinPool(prisma, {
      ...parsedBody.data,
      userId: session.user.id
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return poolErrorResponse(error);
  }
}
