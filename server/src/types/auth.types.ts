import { z } from 'zod';
import { signInSchema, signUpSchema } from '../schemas/auth.schema.js';

export type SignUp = z.infer<typeof signUpSchema>;

export type SignIn = z.infer<typeof signInSchema>;

export type User = {
  username: string;
  passwordHash: string;
  email: string;
  id: string;
  createdAt: string;
};

export type SignUpResponse = {
  message: string;
  user: {
    username: string;
    email: string;
  };
};

export type SignInResponse = {
  token: string;
};
