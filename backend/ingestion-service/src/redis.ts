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
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  async publishTelemetry(data: any): Promise<string> {
    try {
      const streamKey = REDIS_KEYS.TELEMETRY_STREAM;
      const id = await this.client.xadd(
        streamKey,
        '*',
        'data',
        JSON.stringify(data)
      );
      return id;
    } catch (error) {
      logger.error('Failed to publish to Redis stream:', error);
      throw error;
    }
  }

  async setLatestTelemetry(vin: string, data: any): Promise<void> {
    try {
      const key = `${REDIS_KEYS.LATEST_TELEMETRY}:${vin}`;
      await this.client.setex(key, 300, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to cache latest telemetry:', error);
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

export const redisClient = new RedisClient();
