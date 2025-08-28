import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';
import { logger } from './utils/logger';
import { redisService } from './services/redisService';
import paymentService from './services/paymentService';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize services
const initializeServices = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Connect to Redis
    await redisService.connect();
    
    logger.info('✅ All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
};

initializeServices();

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Action Romance Comedy Backend running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    try {
      // Disconnect from Redis
      await redisService.disconnect();
      logger.info('✅ Redis disconnected');
      
      // Close database connection
      await require('mongoose').connection.close();
      logger.info('✅ Database disconnected');
      
      logger.info('Process terminated');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

export default server;