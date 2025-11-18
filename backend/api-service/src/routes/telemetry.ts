import { Router, Request, Response } from 'express';
import { TelemetryQuerySchema, HTTP_STATUS } from '@telemetry/shared';
import { db } from '../database';
import { redis } from '../redis';
import { logger } from '../logger';

export const telemetryRouter = Router();

/**
 * GET /api/v1/telemetry/:vin
 * Get historical telemetry data for a vehicle
 */
telemetryRouter.get('/:vin', async (req: Request, res: Response) => {
  try {
    const { vin } = req.params;
    const { startTime, endTime, limit, offset } = req.query;

    // Validate query parameters
    const validation = TelemetryQuerySchema.safeParse({
      vin,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    if (!validation.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
    }

    const result = await db.getTelemetry(validation.data);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching telemetry:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch telemetry',
    });
  }
});

/**
 * GET /api/v1/telemetry/:vin/latest
 * Get the most recent telemetry point for a vehicle
 */
telemetryRouter.get('/:vin/latest', async (req: Request, res: Response) => {
  try {
    const { vin } = req.params;

    // Try cache first
    let telemetry = await redis.getLatestTelemetry(vin);

    // Fallback to database
    if (!telemetry) {
      telemetry = await db.getLatestTelemetry(vin);
    }

    if (!telemetry) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'No telemetry data found for this vehicle',
      });
    }

    res.json(telemetry);
  } catch (error) {
    logger.error('Error fetching latest telemetry:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch latest telemetry',
    });
  }
});
