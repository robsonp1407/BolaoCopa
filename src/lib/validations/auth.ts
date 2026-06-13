import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Informe um e-mail valido")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Za-z]/, "A senha deve conter letras")
  .regex(/[0-9]/, "A senha deve conter numeros");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha")
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80, "Nome muito longo"),
  email: emailSchema,
  password: passwordSchema
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32, "Token invalido"),
  password: passwordSchema
});
