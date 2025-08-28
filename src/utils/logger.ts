import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}] [${service || 'arc-backend'}]: ${message} ${metaStr}`;
  })
);

// Production format (JSON for log aggregation)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger with enhanced configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: process.env.NODE_ENV === 'production' ? productionFormat : customFormat,
  defaultMeta: { service: 'arc-backend' },
  transports: [
    // Error logs with daily rotation
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Combined logs with daily rotation
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    
    // Access logs for HTTP requests
    new DailyRotateFile({
      filename: 'logs/access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    
    // Performance logs
    new DailyRotateFile({
      filename: 'logs/performance-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.type === 'performance' ? info : false;
        })()
      )
    })
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: customFormat
  }));
}

// Enhanced logger with additional methods
class EnhancedLogger {
  private winston: winston.Logger;
  
  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }
  
  // Standard logging methods
  error(message: string, meta?: any) {
    this.winston.error(message, meta);
  }
  
  warn(message: string, meta?: any) {
    this.winston.warn(message, meta);
  }
  
  info(message: string, meta?: any) {
    this.winston.info(message, meta);
  }
  
  debug(message: string, meta?: any) {
    this.winston.debug(message, meta);
  }
  
  // HTTP request logging
  http(message: string, meta?: any) {
    this.winston.log('http', message, meta);
  }
  
  // Performance logging
  performance(operation: string, duration: number, meta?: any) {
    this.winston.info(`Performance: ${operation}`, {
      type: 'performance',
      operation,
      duration,
      ...meta
    });
  }
  
  // Security logging
  security(event: string, meta?: any) {
    this.winston.warn(`Security Event: ${event}`, {
      type: 'security',
      event,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
  
  // Business logic logging
  business(event: string, meta?: any) {
    this.winston.info(`Business Event: ${event}`, {
      type: 'business',
      event,
      ...meta
    });
  }
  
  // Database operation logging
  database(operation: string, collection: string, duration?: number, meta?: any) {
    this.winston.info(`Database: ${operation} on ${collection}`, {
      type: 'database',
      operation,
      collection,
      duration,
      ...meta
    });
  }
  
  // API logging
  api(method: string, endpoint: string, statusCode: number, duration: number, meta?: any) {
    this.winston.http(`API: ${method} ${endpoint} - ${statusCode}`, {
      type: 'api',
      method,
      endpoint,
      statusCode,
      duration,
      ...meta
    });
  }
}

// Request tracking middleware
interface RequestWithId extends Request {
  id?: string;
  startTime?: number;
}

const requestLogger = (req: RequestWithId, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.id = uuidv4();
  req.startTime = Date.now();
  
  // Log incoming request
  enhancedLogger.http(`Incoming request: ${req.method} ${req.originalUrl}`, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    headers: req.headers
  });
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - (req.startTime || 0);
    
    enhancedLogger.api(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      {
        requestId: req.id,
        responseSize: Buffer.byteLength(data || ''),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Performance monitoring decorator
const performanceMonitor = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
  const method = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    const className = target.constructor.name;
    const methodName = `${className}.${propertyName}`;
    
    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;
      
      enhancedLogger.performance(methodName, duration, {
        success: true,
        args: args.length
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.performance(methodName, duration, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        args: args.length
      });
      
      throw error;
    }
  };
  
  return descriptor;
};

const enhancedLogger = new EnhancedLogger(logger);

export { enhancedLogger as logger, requestLogger, performanceMonitor };
export type { RequestWithId };