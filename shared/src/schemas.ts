import { z } from 'zod';

// ============================================================================
// Validation Schemas using Zod
// ============================================================================

/**
 * Location schema
 */
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
});

/**
 * Telemetry packet schema for validation
 */
export const TelemetryPacketSchema = z.object({
  vin: z.string().min(17).max(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format'),
  timestamp: z.string().datetime(),
  speed: z.number().min(0).max(300),
  soc: z.number().min(0).max(100),
  location: LocationSchema,
  odometer: z.number().min(0).optional(),
  temperature: z.number().min(-40).max(100).optional(),
  voltage: z.number().min(0).max(1000).optional(),
  current: z.number().min(-500).max(500).optional(),
  heading: z.number().min(0).max(360).optional(),
});

/**
 * Vehicle schema
 */
export const VehicleSchema = z.object({
  vin: z.string().min(17).max(17),
  fleetId: z.string().optional(),
  model: z.string().min(1).max(100),
  manufacturer: z.string().min(1).max(100),
  year: z.number().min(1900).max(2100).optional(),
  batteryCapacity: z.number().min(0).optional(),
  maxSpeed: z.number().min(0).optional(),
  status: z.enum(['online', 'offline', 'idle', 'charging', 'driving', 'alert']),
  lastSeen: z.string().datetime().optional(),
});

/**
 * Alert schema
 */
export const AlertSchema = z.object({
  vin: z.string().min(17).max(17),
  type: z.enum([
    'low_battery',
    'overspeed',
    'high_temperature',
    'geofence_violation',
    'offline',
    'maintenance_due',
    'battery_anomaly',
    'custom',
  ]),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string().min(1).max(500),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Telemetry query parameters schema
 */
export const TelemetryQuerySchema = z.object({
  vin: z.string().min(17).max(17),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

/**
 * WebSocket subscribe message schema
 */
export const SubscribeMessageSchema = z.object({
  type: z.enum(['subscribe', 'unsubscribe']),
  target: z.enum(['vehicle', 'fleet', 'alerts']),
  vin: z.string().optional(),
  fleetId: z.string().optional(),
});

/**
 * Batch telemetry ingestion schema
 */
export const BatchTelemetrySchema = z.array(TelemetryPacketSchema).min(1).max(100);

// ============================================================================
// Type inference from schemas
// ============================================================================

export type TelemetryPacketInput = z.infer<typeof TelemetryPacketSchema>;
export type VehicleInput = z.infer<typeof VehicleSchema>;
export type AlertInput = z.infer<typeof AlertSchema>;
export type TelemetryQueryInput = z.infer<typeof TelemetryQuerySchema>;
export type SubscribeMessageInput = z.infer<typeof SubscribeMessageSchema>;
export type BatchTelemetryInput = z.infer<typeof BatchTelemetrySchema>;

// ============================================================================
// Validation helper functions
// ============================================================================

/**
 * Validate telemetry packet and return typed result
 */
export function validateTelemetryPacket(data: unknown): {
  success: boolean;
  data?: TelemetryPacketInput;
  error?: string;
} {
  try {
    const validated = TelemetryPacketSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate vehicle data
 */
export function validateVehicle(data: unknown): {
  success: boolean;
  data?: VehicleInput;
  error?: string;
} {
  try {
    const validated = VehicleSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate alert data
 */
export function validateAlert(data: unknown): {
  success: boolean;
  data?: AlertInput;
  error?: string;
} {
  try {
    const validated = AlertSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

// Export schemas
export {
  LocationSchema,
  TelemetryPacketSchema,
  VehicleSchema,
  AlertSchema,
  TelemetryQuerySchema,
  SubscribeMessageSchema,
  BatchTelemetrySchema,
};
