import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsedBody.data.email }
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Ja existe uma conta com este e-mail" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(parsedBody.data.password);

  await prisma.user.create({
    data: {
      name: parsedBody.data.name,
      email: parsedBody.data.email,
      passwordHash,
      role: "PARTICIPANT"
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
