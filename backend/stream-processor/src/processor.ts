import { ProcessedTelemetry, TelemetryPacket, REDIS_KEYS, WS_EVENTS } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';
import { redis } from './redis';
import { db } from './database';
import { alertDetector } from './alerts';

export class StreamProcessor {
  private isRunning: boolean = false;
  private processedCount: number = 0;

  async start(): Promise<void> {
    this.isRunning = true;
    logger.info('Stream processor starting...');

    // Create consumer group if it doesn't exist
    await redis.createConsumerGroup(
      REDIS_KEYS.TELEMETRY_STREAM,
      config.stream.consumerGroup
    );

    logger.info(`Consumer: ${config.stream.consumerName} in group ${config.stream.consumerGroup}`);

    // Start processing loop
    while (this.isRunning) {
      try {
        await this.processMessages();
      } catch (error) {
        logger.error('Error in processing loop:', error);
        // Wait before retrying
        await this.sleep(5000);
      }
    }
  }

  private async processMessages(): Promise<void> {
    const messages = await redis.readStream(
      REDIS_KEYS.TELEMETRY_STREAM,
      config.stream.consumerGroup,
      config.stream.consumerName,
      config.stream.batchSize,
      config.stream.blockMs
    );

    if (messages.length === 0) {
      return;
    }

    logger.debug(`Processing ${messages.length} messages`);

    for (const message of messages) {
      try {
        await this.processMessage(message);
        await redis.acknowledgeMessage(
          REDIS_KEYS.TELEMETRY_STREAM,
          config.stream.consumerGroup,
          message.id
        );
        this.processedCount++;
      } catch (error) {
        logger.error(`Failed to process message ${message.id}:`, error);
        // In production, implement dead letter queue or retry logic
      }
    }

    if (this.processedCount % 100 === 0) {
      logger.info(`Processed ${this.processedCount} messages`);
    }
  }

  private async processMessage(message: { id: string; data: TelemetryPacket }): Promise<void> {
    const telemetry: ProcessedTelemetry = message.data;

    // Get previous telemetry for enrichment and anomaly detection
    const previousTelemetry = await db.getLatestTelemetry(telemetry.vin);

    // Enrich telemetry with derived metrics
    if (previousTelemetry) {
      telemetry.distanceTraveled = this.calculateDistance(
        previousTelemetry.location,
        telemetry.location
      );

      const timeDiff = (new Date(telemetry.timestamp).getTime() - new Date(previousTelemetry.timestamp).getTime()) / 1000 / 60; // minutes
      if (timeDiff > 0) {
        telemetry.chargeRate = (telemetry.soc - previousTelemetry.soc) / timeDiff;
      }

      if (telemetry.voltage && telemetry.current) {
        telemetry.powerConsumption = (telemetry.voltage * Math.abs(telemetry.current)) / 1000; // kW
      }
    }

    // Detect alerts
    const alerts = await alertDetector.detectAlerts(telemetry, previousTelemetry);

    // Determine vehicle status
    const status = alertDetector.determineVehicleStatus(telemetry);

    // Save to database
    await db.saveTelemetry(telemetry);
    await db.updateVehicleStatus(telemetry.vin, status, telemetry.timestamp);

    // Publish WebSocket events for real-time updates
    await redis.publishWebSocketEvent(WS_EVENTS.TELEMETRY_UPDATE, telemetry);

    for (const alert of alerts) {
      await redis.publishWebSocketEvent(WS_EVENTS.ALERT_NEW, alert);
    }

    logger.debug(`Processed telemetry for VIN ${telemetry.vin}: status=${status}, alerts=${alerts.length}`);
  }

  private calculateDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.latitude)) *
        Math.cos(this.toRad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop(): void {
    logger.info('Stopping stream processor...');
    this.isRunning = false;
  }

  getProcessedCount(): number {
    return this.processedCount;
  }
}

export const streamProcessor = new StreamProcessor();
