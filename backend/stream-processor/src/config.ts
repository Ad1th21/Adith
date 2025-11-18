import dotenv from 'dotenv';
import { STREAM_CONFIG, ALERT_THRESHOLDS } from '@telemetry/shared';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://telemetry_user:telemetry_pass@localhost:5432/telemetry',
  },

  stream: {
    consumerGroup: process.env.CONSUMER_GROUP || STREAM_CONFIG.CONSUMER_GROUP,
    consumerName: process.env.CONSUMER_NAME || `${STREAM_CONFIG.CONSUMER_NAME_PREFIX}-${Date.now()}`,
    batchSize: parseInt(process.env.BATCH_SIZE || String(STREAM_CONFIG.BATCH_SIZE), 10),
    blockMs: parseInt(process.env.BLOCK_MS || String(STREAM_CONFIG.BLOCK_MS), 10),
  },

  alerts: {
    lowBattery: parseInt(process.env.ALERT_LOW_BATTERY_THRESHOLD || String(ALERT_THRESHOLDS.LOW_BATTERY), 10),
    overspeed: parseInt(process.env.ALERT_OVERSPEED_THRESHOLD || String(ALERT_THRESHOLDS.OVERSPEED), 10),
    highTemperature: parseInt(process.env.ALERT_HIGH_TEMPERATURE_THRESHOLD || String(ALERT_THRESHOLDS.HIGH_TEMPERATURE), 10),
  },
};
