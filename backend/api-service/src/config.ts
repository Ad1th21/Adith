import dotenv from 'dotenv';
import { PAGINATION, CACHE_TTL } from '@telemetry/shared';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://telemetry_user:telemetry_pass@localhost:5432/telemetry',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  websocket: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10),
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '10000', 10),
  },

  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || String(PAGINATION.DEFAULT_PAGE_SIZE), 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || String(PAGINATION.MAX_PAGE_SIZE), 10),
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL_SECONDS || String(CACHE_TTL.LATEST_TELEMETRY), 10),
  },
};
