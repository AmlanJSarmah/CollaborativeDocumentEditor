import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { treeifyError, ZodError } from 'zod';
import { createServer } from 'node:http';
import { AppError } from './lib/error.js';
// ENV
import './lib/env.js';
import { env } from './lib/env.js';
// Prisma and Redis
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
// WebSockets
import { initSocket } from './sockets/index.js';
// Routes
import authRouter from './routes/auth.routes.js';
import { authorization } from './middleware/authorization.js';
import notesRouter from './routes/notes.routes.js';

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);
let isShuttingDown = false;

// Register Routes
app.use(express.json());

app.use('/api/v1/auth/', authRouter);

app.use('/api/v1/notes/', authorization, notesRouter);

app.get('/api/v1', authorization, (_req, res) => {
  res.status(200).json({
    'health status': 'healthy',
  });
});

// Redis
redis.on('connect', () => {
  console.info('INFO: Redis connected');
});
redis.on('error', error => {
  console.error('ERROR: Redis error', error);
});

// Sockets
io.on('connection', socket => {
  console.info(`INFO: Client connected via socket ${socket.id}`);

  socket.on('disconnect', () => {
    console.info(`INFO: Client disconneced ${socket.id}`);
  });
});

// Global Error Handling
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: treeifyError(error),
    });
  }
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }
  console.error(error);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Server Start and Stop
async function startServer(): Promise<void> {
  await prisma.$connect();
  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(env.PORT, () => {
      httpServer.off('error', reject);
      resolve();
    });
  });
  console.info(`INFO: Server running on port ${env.PORT}`);
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.info(`INFO: Received ${signal}. Shutting down...`);
  // Stop accepting new connections and wait for existing ones.
  if (httpServer.listening) {
    await new Promise<void>(resolve => {
      httpServer.close(() => resolve());
    });
  }
  // Disconnect Prisma after requests have drained.
  await prisma.$disconnect();
  await redis.quit();
  await io.close();
  console.info('INFO: Server shut down successfully');
}

// Graceful Shutdown in event of signals
process.once('SIGINT', () => {
  void shutdown('SIGINT').catch(console.error);
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM').catch(console.error);
});

// Start Server
startServer().catch(async (error: unknown) => {
  console.error('FATAL: Failed to start server', error);
  try {
    await prisma.$disconnect();
    await redis.quit();
    await io.close();
  } catch (disconnectError) {
    console.error(
      'ERROR: Failed to disconnect Prisma or Redis',
      disconnectError
    );
  }
  process.exitCode = 1;
});
