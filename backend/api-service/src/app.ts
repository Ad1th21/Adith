import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { HTTP_STATUS } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';
import { db } from './database';
import { redis } from './redis';
import { vehiclesRouter } from './routes/vehicles';
import { telemetryRouter } from './routes/telemetry';
import { alertsRouter } from './routes/alerts';

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbHealthy = await db.isHealthy();
  const redisHealthy = redis.isHealthy();

  const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';

  res.status(status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: { status: dbHealthy ? 'up' : 'down' },
      redis: { status: redisHealthy ? 'up' : 'down' },
    },
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/v1/vehicles', vehiclesRouter);
app.use('/api/v1/telemetry', telemetryRouter);
app.use('/api/v1/alerts', alertsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Vehicle Telemetry API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      vehicles: '/api/v1/vehicles',
      telemetry: '/api/v1/telemetry/:vin',
      alerts: '/api/v1/alerts',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: 'Internal server error',
    message: config.env === 'development' ? err.message : undefined,
  });
});

export default app;
