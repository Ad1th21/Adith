import http from 'http';
import app from './app';
import { config } from './config';
import { logger } from './logger';
import { db } from './database';
import { redis } from './redis';
import { WebSocketServer } from './websocket';

async function start() {
  try {
    logger.info('Starting API Service...');

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize WebSocket server
    const wsServer = new WebSocketServer(httpServer);
    logger.info('WebSocket server initialized');

    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info(`API Service listening on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`WebSocket: ws://localhost:${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        try {
          await redis.close();
          logger.info('Redis client closed');
        } catch (error) {
          logger.error('Error closing Redis client:', error);
        }

        try {
          await db.close();
          logger.info('Database connection closed');
        } catch (error) {
          logger.error('Error closing database connection:', error);
        }

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start API Service:', error);
    process.exit(1);
  }
}

start();
