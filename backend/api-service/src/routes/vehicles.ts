import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '@telemetry/shared';
import { db } from '../database';
import { logger } from '../logger';

export const vehiclesRouter = Router();

/**
 * GET /api/v1/vehicles
 * List all vehicles with their current status
 */
vehiclesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const result = await db.getAllVehicles();
    res.json(result);
  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch vehicles',
    });
  }
});

/**
 * GET /api/v1/vehicles/:vin
 * Get detailed information about a specific vehicle
 */
vehiclesRouter.get('/:vin', async (req: Request, res: Response) => {
  try {
    const { vin } = req.params;
    const vehicle = await db.getVehicleByVin(vin);

    if (!vehicle) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Vehicle not found',
      });
    }

    // Get additional stats
    const stats = await db.getVehicleStats(vin);

    res.json({
      vehicle,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching vehicle:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch vehicle',
    });
  }
});
