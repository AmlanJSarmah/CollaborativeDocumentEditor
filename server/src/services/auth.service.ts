import { AppError } from '../lib/error.js';
import { prisma } from '../lib/prisma.js';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { User, SignIn, SignUp } from '../types/auth.types.js';

export const signUpService = async (userData: SignUp): Promise<User> => {
  // check if user already exists
  const userWithSameEmail = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
  });
  const userWithSameName = await prisma.user.findUnique({
    where: {
      username: userData.username,
    },
  });
  // CASE: User already exists
  if (userWithSameEmail) {
    throw new AppError(409, 'User with same Email already exists');
  } else if (userWithSameName) {
    throw new AppError(409, 'Username already taken');
  }
  // CASE: User doesn't exist
  else {
    const user = await prisma.user.create({
      data: {
        passwordHash: await hash(userData.password, 12),
        username: userData.username,
        email: userData.email,
      },
    });
    return user;
  }
};

export const signInService = async (userData: SignIn) => {
  //check if user exist
  const user = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
  });
  // CASE: User doesn't exist
  if (!user) throw new AppError(404, "User doesn't exist");
  // CASE: Wrong password
  if (!(await compare(userData.password, user.passwordHash))) {
    throw new AppError(401, 'Wrong Password');
  }
  // CASE: All Ok
  return jwt.sign(
    {
      email: user.email,
      id: user.id,
    },
    env.JWT_PRIVATE_KEY,
    { expiresIn: '1h' }
  );
};
