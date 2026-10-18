import express from 'express';
import type { Request, Response } from 'express';
import { treeifyError, ZodError } from 'zod';
import { createServer } from 'node:http';
import { AppError } from './lib/error.js';
// ENV
import './lib/env.js';
import { env } from './lib/env.js';
// Prisma
import { prisma } from './lib/prisma.js';
// Routes
import authRouter from './routes/auth.routes.js';

const app = express();
const httpServer = createServer(app);
let isShuttingDown = false;

// Register Routes
app.use(express.json());

app.use('/api/v1/auth/', authRouter);

app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    'health status': 'healthy',
  });
});

// Global Error Handling
app.use((error: unknown, _req: Request, res: Response) => {
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
  console.error('ERROR : Internal Server Error');
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
  } catch (disconnectError) {
    console.error('ERROR: Failed to disconnect Prisma', disconnectError);
  }
  process.exitCode = 1;
});
