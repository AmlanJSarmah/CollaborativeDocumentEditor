import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { AppError } from '../lib/error.js';
import { authorizedUserSchmea } from '../schemas/auth.schema.js';

export const authorization = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header) throw new Error();
    const user = authorizedUserSchmea.parse(
      jwt.verify(header.split(' ')[1], env.JWT_PRIVATE_KEY)
    );
    req.authorizedUser = user;
    next();
  } catch (err) {
    next(new AppError(401, 'Unauthorized: Please log in before continuing'));
  }
};
