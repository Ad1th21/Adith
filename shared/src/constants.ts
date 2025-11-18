// ============================================================================
// System Constants
// ============================================================================

/**
 * Redis Stream keys
 */
export const REDIS_KEYS = {
  TELEMETRY_STREAM: 'telemetry:stream',
  LATEST_TELEMETRY: 'telemetry:latest',
  VEHICLE_STATUS: 'vehicle:status',
  ALERTS: 'alerts:active',
} as const;

/**
 * Redis consumer group configuration
 */
export const STREAM_CONFIG = {
  CONSUMER_GROUP: 'telemetry-processors',
  CONSUMER_NAME_PREFIX: 'processor',
  BATCH_SIZE: 10,
  BLOCK_MS: 5000,
  IDLE_TIMEOUT_MS: 60000,
} as const;

/**
 * Alert thresholds
 */
export const ALERT_THRESHOLDS = {
  LOW_BATTERY: 20, // %
  CRITICAL_BATTERY: 10, // %
  OVERSPEED: 120, // km/h
  HIGH_TEMPERATURE: 60, // °C
  CRITICAL_TEMPERATURE: 80, // °C
  OFFLINE_TIMEOUT_MS: 300000, // 5 minutes
} as const;

/**
 * Database configuration
 */
export const DB_CONFIG = {
  POOL_MIN: 2,
  POOL_MAX: 10,
  IDLE_TIMEOUT_MS: 30000,
  CONNECTION_TIMEOUT_MS: 5000,
} as const;

/**
 * MQTT topics
 */
export const MQTT_TOPICS = {
  TELEMETRY: 'vehicle/+/telemetry',
  STATUS: 'vehicle/+/status',
  COMMAND: 'vehicle/+/command',
} as const;

/**
 * WebSocket events
 */
export const WS_EVENTS = {
  // Client to Server
  SUBSCRIBE_VEHICLE: 'subscribe:vehicle',
  SUBSCRIBE_FLEET: 'subscribe:fleet',
  SUBSCRIBE_ALERTS: 'subscribe:alerts',
  UNSUBSCRIBE_VEHICLE: 'unsubscribe:vehicle',
  UNSUBSCRIBE_FLEET: 'unsubscribe:fleet',
  UNSUBSCRIBE_ALERTS: 'unsubscribe:alerts',

  // Server to Client
  TELEMETRY_UPDATE: 'telemetry:update',
  ALERT_NEW: 'alert:new',
  ALERT_ACKNOWLEDGED: 'alert:acknowledged',
  ALERT_RESOLVED: 'alert:resolved',
  VEHICLE_ONLINE: 'vehicle:online',
  VEHICLE_OFFLINE: 'vehicle:offline',
  VEHICLE_STATUS: 'vehicle:status',
  CONNECTION_ERROR: 'connection:error',
} as const;

/**
 * API rate limits
 */
export const RATE_LIMITS = {
  INGESTION_PER_MINUTE: 1000,
  API_PER_MINUTE: 100,
  WEBSOCKET_MESSAGES_PER_SECOND: 10,
} as const;

/**
 * Time-series retention policies
 */
export const RETENTION_POLICIES = {
  HOT_DATA_DAYS: 7,
  WARM_DATA_DAYS: 30,
  COLD_DATA_DAYS: 90,
  COMPRESSION_AFTER_DAYS: 7,
} as const;

/**
 * Logging levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Default pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
} as const;

/**
 * Cache TTLs (in seconds)
 */
export const CACHE_TTL = {
  VEHICLE_STATUS: 60,
  LATEST_TELEMETRY: 5,
  ALERT_LIST: 30,
  AGGREGATED_METRICS: 300,
} as const;

/**
 * Service ports
 */
export const SERVICE_PORTS = {
  INGESTION: 3000,
  API: 3001,
  FRONTEND: 5173,
  POSTGRES: 5432,
  REDIS: 6379,
  MQTT: 1883,
  PROMETHEUS: 9090,
  GRAFANA: 3000,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REDIS_ERROR: 'REDIS_ERROR',
  MQTT_ERROR: 'MQTT_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Export all constants
export default {
  REDIS_KEYS,
  STREAM_CONFIG,
  ALERT_THRESHOLDS,
  DB_CONFIG,
  MQTT_TOPICS,
  WS_EVENTS,
  RATE_LIMITS,
  RETENTION_POLICIES,
  LOG_LEVELS,
  HTTP_STATUS,
  PAGINATION,
  CACHE_TTL,
  SERVICE_PORTS,
  ERROR_CODES,
};
