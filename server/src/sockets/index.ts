import { Server } from 'socket.io';
import { Server as HttpServer } from 'node:http';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });
  return io;
};
