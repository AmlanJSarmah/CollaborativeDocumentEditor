import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  PORT: z.coerce.number(),
  JWT_PRIVATE_KEY: z.string(),
  REDIS_PORT: z.coerce.number(),
});
