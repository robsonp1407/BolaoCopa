import { NextResponse } from "next/server";

import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { prisma } from "@/lib/db/prisma";
import { addMinutes, generatePasswordResetToken, hashToken } from "@/lib/security/token";
import { requestPasswordResetSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = requestPasswordResetSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsedBody.data.email }
  });

  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "Se o e-mail existir, enviaremos instrucoes para redefinir a senha."
    });
  }

  const token = generatePasswordResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = addMinutes(new Date(), 30);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const resetLink = `${appUrl}/redefinir-senha?token=${token}`;
  const emailResult = await sendPasswordResetEmail({
    email: user.email,
    resetLink,
    token
  });

  return NextResponse.json({
    ok: true,
    message: "Se o e-mail existir, enviaremos instrucoes para redefinir a senha.",
    developmentLink: process.env.NODE_ENV === "production" ? undefined : emailResult.developmentLink
  });
}
