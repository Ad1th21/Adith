import Redis from 'ioredis';
import { REDIS_KEYS } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';

export class RedisClient {
  private client: Redis;
  private subscriber: Redis;
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

    // Separate connection for pub/sub
    this.subscriber = new Redis(config.redis.url);

    this.client.on('connect', () => {
      logger.info('Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', (err: Error) => {
      logger.error('Redis connection error:', err);
      this.isConnected = false;
    });

    this.subscriber.on('error', (err: Error) => {
      logger.error('Redis subscriber error:', err);
    });
  }

  async getLatestTelemetry(vin: string): Promise<any | null> {
    try {
      const key = `${REDIS_KEYS.LATEST_TELEMETRY}:${vin}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Failed to get cached telemetry for ${vin}:`, error);
      return null;
    }
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getClient(): Redis {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    await this.client.quit();
    await this.subscriber.quit();
  }
}

export const redis = new RedisClient();
