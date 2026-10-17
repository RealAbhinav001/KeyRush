import * as z from "zod";

export const signUp = z.object({
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
