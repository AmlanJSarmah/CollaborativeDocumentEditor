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

// User With JWT TOken verified stored in request
export const authorizedUserSchmea = z.object({
  email: z.string(),
  id: z.string(),
});

export const validTokenSchema = z.string();
