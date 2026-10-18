import express from 'express';
import { createServer } from 'node:http';
// ENV
import './lib/env.js';
import { env } from './lib/env.js';
// Prisma
import { prisma } from './lib/prisma.js';

const app = express();
const httpServer = createServer(app);

let isShuttingDown = false;

async function startServer(): Promise<void> {
  await prisma.$connect();
  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(env.port, () => {
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
