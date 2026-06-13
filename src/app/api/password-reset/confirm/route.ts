import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { hashToken } from "@/lib/security/token";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = resetPasswordSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(parsedBody.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash }
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Token invalido ou expirado" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsedBody.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  return NextResponse.json({ ok: true });
}
