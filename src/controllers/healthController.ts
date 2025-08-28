import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Health check endpoint
 * Checks database connection and system status
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'disconnected',
        responseTime: 0
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
      }
    };

    // Check database connection
    const dbStartTime = Date.now();
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        // Test database with a simple query
        await mongoose.connection.db.admin().ping();
        healthStatus.database.status = 'connected';
        healthStatus.database.responseTime = Date.now() - dbStartTime;
      } else {
        healthStatus.database.status = 'disconnected';
        healthStatus.status = 'unhealthy';
      }
    } catch (dbError) {
      logger.error('Database health check failed:', dbError);
      healthStatus.database.status = 'error';
      healthStatus.status = 'unhealthy';
    }

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    const message = healthStatus.status === 'healthy' ? 'System is healthy' : 'System is unhealthy';
    
    return sendSuccess(
      res,
      message,
      healthStatus,
      statusCode
    );
  } catch (error) {
    logger.error('Health check error:', error);
    return sendError(
      res,
      'Health check failed',
      error instanceof Error ? error.message : 'Unknown error',
      503
    );
  }
};

/**
 * Simple liveness probe
 * Returns 200 if the service is running
 */
export const liveness = (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness probe
 * Returns 200 if the service is ready to accept traffic
 */
export const readiness = async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Test database connectivity
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    } else {
      throw new Error('Database connection not available');
    }
    
    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    return res.status(503).json({
      status: 'not ready',
      reason: 'Database connectivity issue',
      timestamp: new Date().toISOString()
    });
  }
};