import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : undefined));

export const createPoolSchema = z
  .object({
    name: z.string().trim().min(3).max(100),
    description: optionalText,
    imageUrl: z.string().trim().url().optional(),
    isPrivate: z.boolean().default(false),
    password: z.string().min(4).max(100).optional(),
    maxParticipants: z.number().int().min(2).max(10000).nullable().optional()
  })
  .superRefine((value, context) => {
    if (value.isPrivate && !value.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bolao privado precisa de senha",
        path: ["password"]
      });
    }
  });

export const updatePoolSchema = z
  .object({
    name: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    imageUrl: z.string().trim().url().nullable().optional(),
    isPrivate: z.boolean().optional(),
    password: z.string().min(4).max(100).nullable().optional(),
    maxParticipants: z.number().int().min(2).max(10000).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar"
  });

export const joinPoolSchema = z.object({
  joinCode: z.string().trim().min(4).max(12).toUpperCase(),
  password: z.string().min(1).max(100).optional()
});

export const transferPoolOwnerSchema = z.object({
  userId: z.string().min(1)
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type UpdatePoolInput = z.infer<typeof updatePoolSchema>;
export type JoinPoolInput = z.infer<typeof joinPoolSchema>;
export type TransferPoolOwnerInput = z.infer<typeof transferPoolOwnerSchema>;
