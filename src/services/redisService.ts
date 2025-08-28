import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      } as any,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected', { service: 'redis-service' });
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client ready', { service: 'redis-service' });
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis client error', { 
        error: error.message, 
        service: 'redis-service' 
      });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis client disconnected', { service: 'redis-service' });
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        logger.info('Redis connection established', { service: 'redis-service' });
      }
    } catch (error) {
      logger.error('Failed to connect to Redis', { 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        logger.info('Redis disconnected successfully', { service: 'redis-service' });
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis', { 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Set a key-value pair with optional expiration
   */
  async set(key: string, value: string | object, expirationInSeconds?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache set', { key, service: 'redis-service' });
        return;
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (expirationInSeconds) {
        await this.client.setEx(key, expirationInSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      logger.debug('Cache set successfully', { key, service: 'redis-service' });
    } catch (error) {
      logger.error('Error setting cache', { 
        key, 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
    }
  }

  /**
   * Get a value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache get', { key, service: 'redis-service' });
        return null;
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error('Error getting cache', { 
        key, 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
      return null;
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache delete', { key, service: 'redis-service' });
        return;
      }

      await this.client.del(key);
      logger.debug('Cache deleted successfully', { key, service: 'redis-service' });
    } catch (error) {
      logger.error('Error deleting cache', { 
        key, 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
    }
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping pattern delete', { pattern, service: 'redis-service' });
        return;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug('Cache pattern deleted successfully', { pattern, count: keys.length, service: 'redis-service' });
      }
    } catch (error) {
      logger.error('Error deleting cache pattern', { 
        pattern, 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking cache existence', { 
        key, 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
      return false;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await this.client.expire(key, seconds);
      logger.debug('Cache expiration set', { key, seconds, service: 'redis-service' });
    } catch (error) {
      logger.error('Error setting cache expiration', { 
        key, 
        seconds, 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
    }
  }

  /**
   * Get TTL (time to live) for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1;
      }

      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Error getting cache TTL', { 
        key, 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
      return -1;
    }
  }

  /**
   * Flush all cache
   */
  async flushAll(): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await this.client.flushAll();
      logger.info('All cache flushed', { service: 'redis-service' });
    } catch (error) {
      logger.error('Error flushing cache', { 
        error: (error as Error).message, 
        service: 'redis-service' 
      });
    }
  }
}

// Create and export a singleton instance
export const redisService = new RedisService();
export default redisService;