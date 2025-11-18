import { Pool } from 'pg';
import {
  Vehicle,
  ProcessedTelemetry,
  Alert,
  TelemetryQueryParams,
  VehicleListResponse,
  TelemetryResponse,
  AlertListResponse,
} from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';

export class DatabaseClient {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err: Error) => {
      logger.error('Unexpected database error:', err);
    });
  }

  async getAllVehicles(): Promise<VehicleListResponse> {
    const query = `
      SELECT 
        v.*,
        COUNT(DISTINCT a.id) FILTER (WHERE a.acknowledged = false) as active_alerts
      FROM vehicles v
      LEFT JOIN alerts a ON v.vin = a.vin
      GROUP BY v.vin
      ORDER BY v.last_seen DESC NULLS LAST
    `;

    try {
      const result = await this.pool.query(query);
      const vehicles: Vehicle[] = result.rows.map((row) => ({
        vin: row.vin,
        fleetId: row.fleet_id,
        model: row.model,
        manufacturer: row.manufacturer,
        year: row.year,
        batteryCapacity: row.battery_capacity ? parseFloat(row.battery_capacity) : undefined,
        maxSpeed: row.max_speed ? parseFloat(row.max_speed) : undefined,
        status: row.status,
        lastSeen: row.last_seen?.toISOString(),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }));

      return { vehicles, total: vehicles.length };
    } catch (error) {
      logger.error('Failed to get vehicles:', error);
      throw error;
    }
  }

  async getVehicleByVin(vin: string): Promise<Vehicle | null> {
    const query = 'SELECT * FROM vehicles WHERE vin = $1';

    try {
      const result = await this.pool.query(query, [vin]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        vin: row.vin,
        fleetId: row.fleet_id,
        model: row.model,
        manufacturer: row.manufacturer,
        year: row.year,
        batteryCapacity: row.battery_capacity ? parseFloat(row.battery_capacity) : undefined,
        maxSpeed: row.max_speed ? parseFloat(row.max_speed) : undefined,
        status: row.status,
        lastSeen: row.last_seen?.toISOString(),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to get vehicle ${vin}:`, error);
      throw error;
    }
  }

  async getTelemetry(params: TelemetryQueryParams): Promise<TelemetryResponse> {
    const { vin, startTime, endTime, limit = 100, offset = 0 } = params;

    let query = `
      SELECT *
      FROM telemetry
      WHERE vin = $1
    `;

    const values: any[] = [vin];
    let paramCount = 1;

    if (startTime) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      values.push(startTime);
    }

    if (endTime) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      values.push(endTime);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    try {
      const result = await this.pool.query(query, values);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM telemetry
        WHERE vin = $1
        ${startTime ? `AND timestamp >= $2` : ''}
        ${endTime ? `AND timestamp >= $${startTime ? 3 : 2}` : ''}
      `;
      const countValues = [vin];
      if (startTime) countValues.push(startTime);
      if (endTime) countValues.push(endTime);

      const countResult = await this.pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].total, 10);

      const data: ProcessedTelemetry[] = result.rows.map((row) => ({
        id: row.id,
        vin: row.vin,
        timestamp: row.timestamp.toISOString(),
        speed: parseFloat(row.speed),
        soc: parseFloat(row.soc),
        location: {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          altitude: row.altitude ? parseFloat(row.altitude) : undefined,
        },
        odometer: row.odometer ? parseFloat(row.odometer) : undefined,
        temperature: row.temperature ? parseFloat(row.temperature) : undefined,
        voltage: row.voltage ? parseFloat(row.voltage) : undefined,
        current: row.current ? parseFloat(row.current) : undefined,
        heading: row.heading ? parseFloat(row.heading) : undefined,
      }));

      return {
        data,
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
      };
    } catch (error) {
      logger.error(`Failed to get telemetry for ${vin}:`, error);
      throw error;
    }
  }

  async getLatestTelemetry(vin: string): Promise<ProcessedTelemetry | null> {
    const query = `
      SELECT *
      FROM telemetry
      WHERE vin = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [vin]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        vin: row.vin,
        timestamp: row.timestamp.toISOString(),
        speed: parseFloat(row.speed),
        soc: parseFloat(row.soc),
        location: {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          altitude: row.altitude ? parseFloat(row.altitude) : undefined,
        },
        odometer: row.odometer ? parseFloat(row.odometer) : undefined,
        temperature: row.temperature ? parseFloat(row.temperature) : undefined,
        voltage: row.voltage ? parseFloat(row.voltage) : undefined,
        current: row.current ? parseFloat(row.current) : undefined,
        heading: row.heading ? parseFloat(row.heading) : undefined,
      };
    } catch (error) {
      logger.error(`Failed to get latest telemetry for ${vin}:`, error);
      throw error;
    }
  }

  async getAlerts(vin?: string, acknowledged?: boolean): Promise<AlertListResponse> {
    let query = `
      SELECT a.*, v.model, v.manufacturer
      FROM alerts a
      JOIN vehicles v ON a.vin = v.vin
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 0;

    if (vin) {
      paramCount++;
      query += ` AND a.vin = $${paramCount}`;
      values.push(vin);
    }

    if (acknowledged !== undefined) {
      paramCount++;
      query += ` AND a.acknowledged = $${paramCount}`;
      values.push(acknowledged);
    }

    query += ' ORDER BY a.timestamp DESC LIMIT 100';

    try {
      const result = await this.pool.query(query, values);

      const alerts: Alert[] = result.rows.map((row) => ({
        id: row.id,
        vin: row.vin,
        type: row.type,
        severity: row.severity,
        message: row.message,
        timestamp: row.timestamp.toISOString(),
        acknowledged: row.acknowledged,
        acknowledgedAt: row.acknowledged_at?.toISOString(),
        acknowledgedBy: row.acknowledged_by,
        metadata: row.metadata,
      }));

      return { alerts, total: alerts.length };
    } catch (error) {
      logger.error('Failed to get alerts:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: number, acknowledgedBy: string): Promise<void> {
    const query = `
      UPDATE alerts
      SET acknowledged = true, acknowledged_at = NOW(), acknowledged_by = $1
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [acknowledgedBy, alertId]);
    } catch (error) {
      logger.error(`Failed to acknowledge alert ${alertId}:`, error);
      throw error;
    }
  }

  async getVehicleStats(vin: string): Promise<any> {
    const query = `
      SELECT 
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MIN(soc) as min_soc,
        AVG(soc) as avg_soc,
        COUNT(*) as data_points
      FROM telemetry
      WHERE vin = $1
        AND timestamp >= NOW() - INTERVAL '24 hours'
    `;

    try {
      const result = await this.pool.query(query, [vin]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to get stats for ${vin}:`, error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabaseClient();
