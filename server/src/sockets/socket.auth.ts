import type { Socket, DefaultEventsMap, ExtendedError } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
  authorizedUserSchmea,
  validTokenSchema,
} from '../schemas/auth.schema.js';
import { AppError } from '../lib/error.js';
import { env } from '../lib/env.js';

export const authorizeSocket = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  next: (err?: ExtendedError | undefined) => void
): void => {
  try {
    const token = validTokenSchema
      .parse(socket.handshake.auth.token)
      .split(' ')[1];
    const authorizedUser = authorizedUserSchmea.parse(
      jwt.verify(token, env.JWT_PRIVATE_KEY)
    );
    socket.data.user = authorizedUser;
    next();
  } catch (err) {
    next(new AppError(403, 'Forbidden invalid authentication token'));
  }
};
