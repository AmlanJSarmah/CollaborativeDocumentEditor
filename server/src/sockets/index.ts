import { Server } from 'socket.io';
import { Server as HttpServer } from 'node:http';
import { authorizeSocket } from './socket.auth.js';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.use(authorizeSocket);

  return io;
};
