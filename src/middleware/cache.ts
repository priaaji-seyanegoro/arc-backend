import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request, res: Response) => boolean;
  onlySuccessful?: boolean; // Only cache successful responses (2xx status codes)
}

/**
 * Generate default cache key from request
 */
function generateDefaultKey(req: Request): string {
  const { method, originalUrl, query, user } = req;
  const userId = user?.id || 'anonymous';
  const queryString = Object.keys(query).length > 0 ? JSON.stringify(query) : '';
  return `cache:${method}:${originalUrl}:${userId}:${queryString}`;
}

/**
 * Cache middleware factory
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // Default 5 minutes
    keyGenerator = generateDefaultKey,
    skipCache = () => false,
    onlySuccessful = true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if custom skip condition is met
    if (skipCache(req, res)) {
      return next();
    }

    // Skip if Redis is not connected
    if (!redisService.isReady()) {
      logger.debug('Redis not ready, skipping cache', { service: 'cache-middleware' });
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get cached response
      const cachedResponse = await redisService.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug('Cache hit', { key: cacheKey, service: 'cache-middleware' });
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        });
        
        return res.json(cachedResponse);
      }

      logger.debug('Cache miss', { key: cacheKey, service: 'cache-middleware' });

      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = function(data: any) {
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey
        });

        // Cache the response if conditions are met
        if (!onlySuccessful || (res.statusCode >= 200 && res.statusCode < 300)) {
          redisService.set(cacheKey, data, ttl).catch(error => {
            logger.error('Error caching response', {
              key: cacheKey,
              error: error.message,
              service: 'cache-middleware'
            });
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', {
        key: cacheKey,
        error: (error as Error).message,
        service: 'cache-middleware'
      });
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(patterns: string[] | ((req: Request) => string[])) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    const invalidatePatterns = typeof patterns === 'function' ? patterns(req) : patterns;

    const performInvalidation = async () => {
      if (!redisService.isReady()) {
        return;
      }

      try {
        for (const pattern of invalidatePatterns) {
          await redisService.delPattern(pattern);
          logger.debug('Cache invalidated', { pattern, service: 'cache-middleware' });
        }
      } catch (error) {
        logger.error('Error invalidating cache', {
          patterns: invalidatePatterns,
          error: (error as Error).message,
          service: 'cache-middleware'
        });
      }
    };

    // Override response methods to invalidate cache after successful response
    res.json = function(data: any) {
      const result = originalJson(data);
      
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        performInvalidation();
      }
      
      return result;
    };

    res.send = function(data: any) {
      const result = originalSend(data);
      
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        performInvalidation();
      }
      
      return result;
    };

    next();
  };
}

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
  // Short cache for frequently changing data
  short: { ttl: 60 }, // 1 minute
  
  // Medium cache for moderately changing data
  medium: { ttl: 300 }, // 5 minutes
  
  // Long cache for rarely changing data
  long: { ttl: 3600 }, // 1 hour
  
  // Very long cache for static data
  static: { ttl: 86400 }, // 24 hours
  
  // User-specific cache
  userSpecific: {
    ttl: 300,
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || 'anonymous';
      return `cache:user:${userId}:${req.method}:${req.originalUrl}`;
    }
  },
  
  // Public cache (no user-specific data)
  public: {
    ttl: 600,
    keyGenerator: (req: Request) => {
      const queryString = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : '';
      return `cache:public:${req.method}:${req.originalUrl}:${queryString}`;
    }
  }
};

/**
 * Helper function to create cache invalidation patterns
 */
export const createInvalidationPatterns = {
  // Invalidate all caches for a specific resource
  resource: (resourceName: string) => [`cache:*:*/${resourceName}*`],
  
  // Invalidate user-specific caches
  user: (userId: string) => [`cache:user:${userId}:*`, `cache:*:*:${userId}:*`],
  
  // Invalidate all public caches
  public: () => ['cache:public:*'],
  
  // Invalidate specific endpoint caches
  endpoint: (endpoint: string) => [`cache:*:${endpoint}*`],
  
  // Invalidate all caches
  all: () => ['cache:*']
};