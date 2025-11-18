import { Pool, PoolClient } from 'pg';
import { ProcessedTelemetry, Alert, VehicleStatus } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';

export class DatabaseClient {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error:', err);
    });
  }

  async saveTelemetry(telemetry: ProcessedTelemetry): Promise<void> {
    const query = `
      INSERT INTO telemetry (
        vin, timestamp, speed, soc, latitude, longitude, 
        altitude, odometer, temperature, voltage, current, heading, raw_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const values = [
      telemetry.vin,
      telemetry.timestamp,
      telemetry.speed,
      telemetry.soc,
      telemetry.location.latitude,
      telemetry.location.longitude,
      telemetry.location.altitude || null,
      telemetry.odometer || null,
      telemetry.temperature || null,
      telemetry.voltage || null,
      telemetry.current || null,
      telemetry.heading || null,
      telemetry.raw_data ? JSON.stringify(telemetry.raw_data) : null,
    ];

    try {
      await this.pool.query(query, values);
      logger.debug(`Telemetry saved for VIN: ${telemetry.vin}`);
    } catch (error) {
      logger.error(`Failed to save telemetry for VIN ${telemetry.vin}:`, error);
      throw error;
    }
  }

  async updateVehicleStatus(vin: string, status: VehicleStatus, lastSeen: string): Promise<void> {
    const query = `
      UPDATE vehicles
      SET status = $1, last_seen = $2, updated_at = NOW()
      WHERE vin = $3
    `;

    try {
      const result = await this.pool.query(query, [status, lastSeen, vin]);

      if (result.rowCount === 0) {
        logger.warn(`Vehicle not found for status update: ${vin}`);
      }
    } catch (error) {
      logger.error(`Failed to update vehicle status for VIN ${vin}:`, error);
      throw error;
    }
  }

  async createAlert(alert: Omit<Alert, 'id' | 'acknowledged' | 'acknowledgedAt' | 'acknowledgedBy'>): Promise<void> {
    const query = `
      INSERT INTO alerts (vin, type, severity, message, timestamp, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [
      alert.vin,
      alert.type,
      alert.severity,
      alert.message,
      alert.timestamp,
      alert.metadata ? JSON.stringify(alert.metadata) : null,
    ];

    try {
      await this.pool.query(query, values);
      logger.info(`Alert created: ${alert.type} for VIN ${alert.vin}`);
    } catch (error) {
      logger.error(`Failed to create alert for VIN ${alert.vin}:`, error);
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
      logger.error(`Failed to get latest telemetry for VIN ${vin}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabaseClient();
