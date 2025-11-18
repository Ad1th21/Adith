export interface Vehicle {
  vin: string;
  fleetId?: string;
  model: string;
  manufacturer: string;
  year?: number;
  batteryCapacity?: number;
  maxSpeed?: number;
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

export interface Telemetry {
  id?: number;
  vin: string;
  timestamp: string;
  speed: number;
  soc: number;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  odometer?: number;
  temperature?: number;
  voltage?: number;
  current?: number;
  heading?: number;
}

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
