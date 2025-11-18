import { ProcessedTelemetry, Alert, AlertType, AlertSeverity, VehicleStatus } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';
import { db } from './database';

export class AlertDetector {
  async detectAlerts(telemetry: ProcessedTelemetry, previousTelemetry: ProcessedTelemetry | null): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Low battery alert
    if (telemetry.soc <= config.alerts.lowBattery) {
      alerts.push(this.createAlert(
        telemetry.vin,
        AlertType.LOW_BATTERY,
        telemetry.soc <= 10 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        `Low battery: ${telemetry.soc}%`,
        telemetry.timestamp,
        { soc: telemetry.soc }
      ));
    }

    // Overspeed alert
    if (telemetry.speed > config.alerts.overspeed) {
      alerts.push(this.createAlert(
        telemetry.vin,
        AlertType.OVERSPEED,
        AlertSeverity.WARNING,
        `Overspeed detected: ${telemetry.speed} km/h`,
        telemetry.timestamp,
        { speed: telemetry.speed, limit: config.alerts.overspeed }
      ));
    }

    // High temperature alert
    if (telemetry.temperature && telemetry.temperature > config.alerts.highTemperature) {
      alerts.push(this.createAlert(
        telemetry.vin,
        AlertType.HIGH_TEMPERATURE,
        telemetry.temperature > 80 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        `High temperature: ${telemetry.temperature}°C`,
        telemetry.timestamp,
        { temperature: telemetry.temperature }
      ));
    }

    // Battery anomaly detection (rapid discharge)
    if (previousTelemetry && previousTelemetry.soc > telemetry.soc) {
      const socDiff = previousTelemetry.soc - telemetry.soc;
      const timeDiff = (new Date(telemetry.timestamp).getTime() - new Date(previousTelemetry.timestamp).getTime()) / 1000 / 60; // minutes

      if (timeDiff > 0) {
        const dischargeRate = socDiff / timeDiff; // % per minute

        if (dischargeRate > 1) { // More than 1% per minute
          alerts.push(this.createAlert(
            telemetry.vin,
            AlertType.BATTERY_ANOMALY,
            AlertSeverity.WARNING,
            `Rapid battery discharge detected: ${dischargeRate.toFixed(2)}% per minute`,
            telemetry.timestamp,
            { dischargeRate, socDiff, timeDiff }
          ));
        }
      }
    }

    // Save alerts to database
    for (const alert of alerts) {
      try {
        await db.createAlert(alert);
      } catch (error) {
        logger.error(`Failed to save alert for VIN ${alert.vin}:`, error);
      }
    }

    return alerts;
  }

  private createAlert(
    vin: string,
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    timestamp: string,
    metadata?: Record<string, any>
  ): Alert {
    return {
      id: 0,
      vin,
      type,
      severity,
      message,
      timestamp,
      acknowledged: false,
      metadata,
    };
  }

  determineVehicleStatus(telemetry: ProcessedTelemetry): VehicleStatus {
    if (telemetry.speed > 5) {
      return VehicleStatus.DRIVING;
    } else if (telemetry.current && telemetry.current < -1) {
      return VehicleStatus.CHARGING;
    } else if (telemetry.speed === 0) {
      return VehicleStatus.IDLE;
    }
    return VehicleStatus.ONLINE;
  }
}

export const alertDetector = new AlertDetector();
