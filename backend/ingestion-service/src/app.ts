import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateTelemetryPacket, BatchTelemetrySchema, HTTP_STATUS } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';
import { redisClient } from './redis';
import { mqttClient } from './mqtt';
import { metricsMiddleware, register } from './metrics';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(metricsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const redisHealthy = redisClient.isHealthy();
  const mqttHealthy = mqttClient.isHealthy();

  const status = redisHealthy && mqttHealthy ? 'healthy' : 'degraded';

  res.status(status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      redis: { status: redisHealthy ? 'up' : 'down' },
      mqtt: { status: mqttHealthy ? 'up' : 'down' },
    },
  });
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Single telemetry ingestion endpoint
app.post('/api/v1/telemetry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateTelemetryPacket(req.body);

    if (!validation.success) {
      logger.warn('Invalid telemetry packet:', validation.error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation failed',
        details: validation.error,
      });
    }

    // Publish to Redis stream
    const streamId = await redisClient.publishTelemetry(validation.data);
    await redisClient.setLatestTelemetry(validation.data!.vin, validation.data);

    logger.debug(`Telemetry ingested: VIN=${validation.data!.vin}, StreamID=${streamId}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      streamId,
      vin: validation.data!.vin,
    });
  } catch (error) {
    next(error);
  }
});

// Batch telemetry ingestion endpoint
app.post('/api/v1/telemetry/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = BatchTelemetrySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const telemetryBatch = result.data;
    const results = [];

    for (const telemetry of telemetryBatch) {
      try {
        const streamId = await redisClient.publishTelemetry(telemetry);
        await redisClient.setLatestTelemetry(telemetry.vin, telemetry);
        results.push({ vin: telemetry.vin, streamId, success: true });
      } catch (error) {
        results.push({ vin: telemetry.vin, success: false, error: String(error) });
      }
    }

    logger.info(`Batch ingestion: ${results.length} packets processed`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: 'Internal server error',
    message: config.env === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Not found',
    path: req.path,
  });
});

export default app;
