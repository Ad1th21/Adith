import app from './app';
import { config } from './config';
import { logger } from './logger';
import { redisClient } from './redis';
import { mqttClient } from './mqtt';

async function start() {
  try {
    logger.info('Starting Ingestion Service...');

    // Initialize MQTT connection
    try {
      await mqttClient.connect();
      logger.info('MQTT client initialized');
    } catch (error) {
      logger.warn('MQTT client failed to initialize, continuing with REST-only mode:', error);
    }

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Ingestion Service listening on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await mqttClient.close();
          logger.info('MQTT client closed');
        } catch (error) {
          logger.error('Error closing MQTT client:', error);
        }

        try {
          await redisClient.close();
          logger.info('Redis client closed');
        } catch (error) {
          logger.error('Error closing Redis client:', error);
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
    logger.error('Failed to start Ingestion Service:', error);
    process.exit(1);
  }
}

start();
