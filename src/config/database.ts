import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { dbConfig } from "./env";

// Konfigurasi connection options untuk optimasi performa
const connectionOptions: mongoose.ConnectOptions = {
  // Connection timeout settings
  serverSelectionTimeoutMS: dbConfig.serverSelectionTimeoutMS,
  socketTimeoutMS: dbConfig.socketTimeoutMS,
  connectTimeoutMS: dbConfig.connectTimeoutMS,
  
  // Connection pool settings
  maxPoolSize: dbConfig.maxPoolSize,
  minPoolSize: dbConfig.minPoolSize,
  maxIdleTimeMS: dbConfig.maxIdleTimeMS,
  
  // Heartbeat settings
  heartbeatFrequencyMS: dbConfig.heartbeatFrequencyMS,
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
};

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = dbConfig.uri;

    // Set mongoose options untuk optimasi
    mongoose.set('strictQuery', false);
    mongoose.set('bufferCommands', false); // Disable buffering untuk menghindari timeout
    
    // Connect dengan retry logic
    await connectWithRetry(mongoURI);

    // Event listeners untuk monitoring koneksi
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Fungsi retry untuk koneksi database
const connectWithRetry = async (mongoURI: string, retries = dbConfig.retryAttempts): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(mongoURI, connectionOptions);
      return; // Koneksi berhasil
    } catch (error) {
      logger.warn(`MongoDB connection attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        throw error; // Throw error pada attempt terakhir
      }
      
      // Wait sebelum retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, i), 10000); // Max 10 seconds
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;
