import * as z from "zod";

export const signUpSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3,{error:"Username needs at least 3 characters"})
    .max(20,{error:"Username can be at most 20 characters"})
    .regex(/^[a-zA-Z0-9_]+$/, {
      error: "Username can only use letters, numbers and underscores",
    }),
  email: z.string().trim().toLowerCase().pipe(z.email({error:"Enter an email like name@example.com"})),
  password: z.string().min(8,{error:"Password needs at least 8 characters"}).max(64,{error:"Password can be at most 64 characters"}),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({error:"Enter an email like name@example.com"})),
  password: z.string().min(1,{error:"Enter your password"}).max(64,{error:"Password can be at most 64 characters"}),
});
