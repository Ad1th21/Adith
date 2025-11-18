import mqtt from 'mqtt';
import { validateTelemetryPacket } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';
import { redisClient } from './redis';

export class MqttClient {
  private client: mqtt.MqttClient | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(config.mqtt.brokerUrl, {
        clientId: config.mqtt.clientId,
        username: config.mqtt.username,
        password: config.mqtt.password,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      });

      this.client.on('connect', () => {
        logger.info('MQTT connected');
        this.isConnected = true;
        this.subscribeToTopics();
        resolve();
      });

      this.client.on('error', (err) => {
        logger.error('MQTT connection error:', err);
        this.isConnected = false;
        reject(err);
      });

      this.client.on('close', () => {
        logger.warn('MQTT connection closed');
        this.isConnected = false;
      });

      this.client.on('message', this.handleMessage.bind(this));
    });
  }

  private subscribeToTopics(): void {
    if (!this.client) return;

    config.mqtt.topics.forEach((topic) => {
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          logger.info(`Subscribed to MQTT topic: ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const data = JSON.parse(message.toString());
      logger.debug(`Received MQTT message from ${topic}:`, data);

      // Validate telemetry packet
      const validation = validateTelemetryPacket(data);
      if (!validation.success) {
        logger.warn(`Invalid telemetry packet from ${topic}: ${validation.error}`);
        return;
      }

      // Publish to Redis stream
      await redisClient.publishTelemetry(validation.data);
      await redisClient.setLatestTelemetry(validation.data!.vin, validation.data);

      logger.debug(`Telemetry from ${validation.data!.vin} published to stream`);
    } catch (error) {
      logger.error(`Failed to process MQTT message from ${topic}:`, error);
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.endAsync();
    }
  }
}

export const mqttClient = new MqttClient();
