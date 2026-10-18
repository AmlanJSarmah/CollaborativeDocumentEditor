import 'dotenv/config';
import { envSchema } from '../schemas/env.schema.js';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('FATAL : Invalid environment variables.');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
} else {
  console.info('INFO: Environment variables parsed successfully');
}

export const env = parsed.data;
