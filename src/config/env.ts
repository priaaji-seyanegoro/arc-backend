import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
  'EMAIL_USER',
  'EMAIL_PASS',
  'MIDTRANS_SERVER_KEY',
  'MIDTRANS_CLIENT_KEY'
];

// Optional environment variables for shipping and geocoding services
const optionalEnvVars = [
  'RAJAONGKIR_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'OPENCAGE_API_KEY',
  'GOJEK_API_KEY',
  'GRAB_API_KEY',
  'DHL_API_KEY',
  'FEDEX_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Database configuration dengan default values
export const dbConfig = {
  uri: process.env.MONGODB_URI!,
  serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
  socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
  connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'),
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '5'),
  maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME || '30000'),
  heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY || '10000'),
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '5'),
};

// Export environment variables
export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Midtrans configuration
export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
export const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY!;
export const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION || 'false';

// Email configuration
export const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
export const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
export const EMAIL_USER = process.env.EMAIL_USER!;
export const EMAIL_PASS = process.env.EMAIL_PASS!;
export const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER!;

// MinIO configuration
export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
export const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000');
export const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
export const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'arc-storage';

// Redis configuration
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// App configuration
export const PORT = parseInt(process.env.PORT || '3000');
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const APP_NAME = process.env.APP_NAME || 'Action Romance Comedy';
export const APP_URL = process.env.APP_URL || 'http://localhost:3000';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// File upload configuration
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB
export const ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp';

// Shipping and Geocoding API configuration
export const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || '';
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
export const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY || '';
export const GOJEK_API_KEY = process.env.GOJEK_API_KEY || '';
export const GRAB_API_KEY = process.env.GRAB_API_KEY || '';
export const DHL_API_KEY = process.env.DHL_API_KEY || '';
export const FEDEX_API_KEY = process.env.FEDEX_API_KEY || '';

// Shipping configuration
export const DEFAULT_ORIGIN_CITY = process.env.DEFAULT_ORIGIN_CITY || 'Jakarta';
export const DEFAULT_ORIGIN_PROVINCE = process.env.DEFAULT_ORIGIN_PROVINCE || 'DKI Jakarta';
export const DEFAULT_ORIGIN_COORDINATES = {
  latitude: parseFloat(process.env.DEFAULT_ORIGIN_LATITUDE || '-6.2088'),
  longitude: parseFloat(process.env.DEFAULT_ORIGIN_LONGITUDE || '106.8456')
};

export {}; // Make this a module