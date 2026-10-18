import type { NextFunction, Request, Response } from 'express';
import { signUpSchema, signInSchema } from '../schemas/auth.schema.js';
import { signInService, signUpService } from '../services/auth.service.js';

export const signUpController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = signUpSchema.parse(req.body);
    const user = await signUpService(userData);
    res.status(202).json({
      message: 'User Signed Up',
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const signInController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = signInSchema.parse(req.body);
    const token = await signInService(userData);
    res.status(200).json({ token: token });
  } catch (err) {
    next(err);
  }
};
