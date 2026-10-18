import type { z } from 'zod';
import { jwtVerifySchema } from '../schemas/auth.schema.ts';

declare global {
  namespace Express {
    interface Request {
      authorizedUser?: z.infer<typeof jwtVerifySchema>;
    }
  }
}
export {};
