import type { NextFunction, Request, Response } from 'express';
import { signUpSchema } from '../schemas/auth.schema.js';
import { signUpService } from '../services/auth.service.js';

export const signUpController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = signUpSchema.parse(req.body);
    signUpService(userData);
    res.status(202).json({
      message: 'User Signed Up',
    });
  } catch (err) {
    next(err);
  }
};
