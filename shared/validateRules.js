import * as z from "zod";

export const signUpSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Use only letters, numbers and underscores.",
    }),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(64),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().max(64),
});
