import type { z } from 'zod';
import { authorizedUserSchmea } from '../schemas/auth.schema.ts';

declare global {
  namespace Express {
    interface Request {
      authorizedUser?: z.infer<typeof authorizedUserSchmea>;
    }
  }
}
export {};
