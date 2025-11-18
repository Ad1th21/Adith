// ============================================================================
// Core Telemetry Types
// ============================================================================

/**
 * GPS Location coordinates
 */
export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/**
 * Main telemetry packet from vehicle
 */
export interface TelemetryPacket {
  vin: string;
  timestamp: string; // ISO 8601
  speed: number; // km/h
  soc: number; // State of Charge (0-100%)
  location: Location;
  odometer?: number; // Total distance in km
  temperature?: number; // Battery temperature in °C
  voltage?: number; // Battery voltage in V
  current?: number; // Battery current in A
  heading?: number; // Direction in degrees (0-360)
  [key: string]: any; // Extensible parameters
}

/**
 * Processed telemetry with derived metrics
 */
export interface ProcessedTelemetry extends TelemetryPacket {
  id?: number;
  distanceTraveled?: number; // Since last packet
  chargeRate?: number; // SOC change rate
  powerConsumption?: number; // kW
  efficiency?: number; // km/kWh
}

// ============================================================================
// Vehicle Types
// ============================================================================

export interface Vehicle {
  vin: string;
  fleetId?: string;
  model: string;
  manufacturer: string;
  year?: number;
  batteryCapacity?: number; // kWh
  maxSpeed?: number; // km/h
  status: VehicleStatus;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export enum VehicleStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  IDLE = 'idle',
  CHARGING = 'charging',
  DRIVING = 'driving',
  ALERT = 'alert',
}

// ============================================================================
// Alert Types
// ============================================================================

export interface Alert {
  id: number;
  vin: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  metadata?: Record<string, any>;
}

export enum AlertType {
  LOW_BATTERY = 'low_battery',
  OVERSPEED = 'overspeed',
  HIGH_TEMPERATURE = 'high_temperature',
  GEOFENCE_VIOLATION = 'geofence_violation',
  OFFLINE = 'offline',
  MAINTENANCE_DUE = 'maintenance_due',
  BATTERY_ANOMALY = 'battery_anomaly',
  CUSTOM = 'custom',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface TelemetryQueryParams {
  vin: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface TelemetryResponse {
  data: ProcessedTelemetry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  total: number;
}

export interface AlertListResponse {
  alerts: Alert[];
  total: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    mqtt?: ServiceHealth;
  };
  uptime: number;
}

export interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface WebSocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: string;
}

export interface SubscribeMessage {
  type: 'subscribe' | 'unsubscribe';
  target: 'vehicle' | 'fleet' | 'alerts';
  vin?: string;
  fleetId?: string;
}

export interface TelemetryUpdateEvent {
  event: 'telemetry:update';
  data: ProcessedTelemetry;
}

export interface AlertEvent {
  event: 'alert:new' | 'alert:acknowledged' | 'alert:resolved';
  data: Alert;
}

export interface VehicleStatusEvent {
  event: 'vehicle:online' | 'vehicle:offline' | 'vehicle:status';
  data: {
    vin: string;
    status: VehicleStatus;
    timestamp: string;
  };
}

// ============================================================================
// Stream Processing Types
// ============================================================================

export interface RedisStreamMessage {
  id: string;
  data: TelemetryPacket;
}

export interface StreamProcessorConfig {
  consumerGroup: string;
  consumerName: string;
  streamKey: string;
  batchSize: number;
  blockMs: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface RedisConfig {
  url: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface MqttConfig {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  topics: string[];
}
