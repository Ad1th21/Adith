import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '@telemetry/shared';
import { db } from '../database';
import { logger } from '../logger';

export const alertsRouter = Router();

/**
 * GET /api/v1/alerts
 * Get alerts with optional filtering
 */
alertsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { vin, acknowledged } = req.query;

    const result = await db.getAlerts(
      vin as string | undefined,
      acknowledged !== undefined ? acknowledged === 'true' : undefined
    );

    res.json(result);
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch alerts',
    });
  }
});

/**
 * PATCH /api/v1/alerts/:id/acknowledge
 * Acknowledge an alert
 */
alertsRouter.patch('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.id, 10);
    const { acknowledgedBy } = req.body;

    if (!acknowledgedBy) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'acknowledgedBy is required',
      });
    }

    await db.acknowledgeAlert(alertId, acknowledgedBy);

    res.json({
      success: true,
      message: 'Alert acknowledged',
    });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to acknowledge alert',
    });
  }
});
