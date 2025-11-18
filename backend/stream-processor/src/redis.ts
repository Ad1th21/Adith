import Redis from 'ioredis';
import { REDIS_KEYS } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';

export class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', (err: Error) => {
      logger.error('Redis connection error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  async createConsumerGroup(streamKey: string, groupName: string): Promise<void> {
    try {
      await this.client.xgroup('CREATE', streamKey, groupName, '0', 'MKSTREAM');
      logger.info(`Consumer group created: ${groupName}`);
    } catch (error: any) {
      if (error.message.includes('BUSYGROUP')) {
        logger.info(`Consumer group already exists: ${groupName}`);
      } else {
        throw error;
      }
    }
  }

  async readStream(
    streamKey: string,
    groupName: string,
    consumerName: string,
    count: number,
    block: number
  ): Promise<any[]> {
    try {
      const result = await this.client.xreadgroup(
        'GROUP',
        groupName,
        consumerName,
        'COUNT',
        count,
        'BLOCK',
        block,
        'STREAMS',
        streamKey,
        '>'
      );

      if (!result) {
        return [];
      }

      const messages = [];
      for (const [stream, entries] of result) {
        for (const [id, fields] of entries) {
          const data = JSON.parse(fields[1]);
          messages.push({ id, data });
        }
      }

      return messages;
    } catch (error) {
      logger.error('Failed to read from stream:', error);
      throw error;
    }
  }

  async acknowledgeMessage(streamKey: string, groupName: string, messageId: string): Promise<void> {
    try {
      await this.client.xack(streamKey, groupName, messageId);
    } catch (error) {
      logger.error(`Failed to acknowledge message ${messageId}:`, error);
      throw error;
    }
  }

  async publishWebSocketEvent(event: string, data: any): Promise<void> {
    try {
      await this.client.publish('websocket:events', JSON.stringify({ event, data }));
    } catch (error) {
      logger.error('Failed to publish WebSocket event:', error);
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

export const redis = new RedisClient();
