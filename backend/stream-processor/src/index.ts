import { config } from './config';
import { logger } from './logger';
import { redis } from './redis';
import { db } from './database';
import { streamProcessor } from './processor';

async function start() {
  try {
    logger.info('Starting Stream Processor Service...');
    logger.info(`Environment: ${config.env}`);
    logger.info(`Consumer: ${config.stream.consumerName}`);

    // Start stream processor
    await streamProcessor.start();
  } catch (error) {
    logger.error('Failed to start Stream Processor Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  streamProcessor.stop();

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

  logger.info(`Total messages processed: ${streamProcessor.getProcessedCount()}`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
