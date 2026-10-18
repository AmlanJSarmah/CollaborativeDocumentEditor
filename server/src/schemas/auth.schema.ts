import { z } from 'zod';

export const signUpSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string(),
});

export const signInSchema = z.object({
  email: z.string(),
  password: z.string(),
});
