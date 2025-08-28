# 🚀 Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Storage Configuration](#storage-configuration)
- [Application Deployment](#application-deployment)
- [Load Balancing](#load-balancing)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Security Hardening](#security-hardening)
- [Performance Optimization](#performance-optimization)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## Overview

This guide covers deploying the ARC e-commerce platform to production environments. The platform is designed to be scalable, secure, and maintainable in production.

**Deployment Options:**
- 🐳 **Docker Containers** (Recommended)
- ☁️ **Cloud Platforms** (AWS, GCP, Azure)
- 🖥️ **Traditional Servers** (VPS, Dedicated)
- ⚡ **Serverless** (AWS Lambda, Vercel)

**Architecture Components:**
- Node.js/Express API Server
- MongoDB Database
- Redis Cache
- MinIO Object Storage
- Nginx Load Balancer
- SSL/TLS Termination

---

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

**Recommended for Production:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **Network**: 1 Gbps

### Software Dependencies

```bash
# Node.js (v18 or higher)
node --version

# Docker & Docker Compose
docker --version
docker-compose --version

# Git
git --version

# Optional: PM2 for process management
npm install -g pm2
```

### Domain & SSL

- Domain name configured with DNS
- SSL certificate (Let's Encrypt recommended)
- Firewall configuration

---

## Environment Setup

### Production Environment Variables

Create a production `.env` file:

```env
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key

# Database
MONGODB_URI=mongodb://username:password@mongodb-host:27017/arc_production
MONGODB_OPTIONS=retryWrites=true&w=majority&ssl=true

# Redis
REDIS_URL=redis://username:password@redis-host:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# MinIO Object Storage
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=443
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_USE_SSL=true
MINIO_BUCKET_PRODUCTS=products
MINIO_BUCKET_CATEGORIES=categories

# Email Service
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=ARC E-commerce <noreply@yourdomain.com>

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live

# Shipping APIs
RAJAONGKIR_API_KEY=your-rajaongkir-api-key
GOJEK_API_KEY=your-gojek-api-key
GRAB_API_KEY=your-grab-api-key

# Geocoding APIs
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
OPENCAGE_API_KEY=your-opencage-api-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-newrelic-license-key

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# File Upload
UPLOAD_MAX_FILE_SIZE=5242880
UPLOAD_MAX_FILES=10

# Cache
CACHE_TTL=3600
CACHE_MAX_KEYS=1000
```

### Environment Security

```bash
# Set proper file permissions
chmod 600 .env

# Use environment variable management tools
# Option 1: Docker Secrets
docker secret create arc_env .env

# Option 2: Kubernetes Secrets
kubectl create secret generic arc-secrets --from-env-file=.env

# Option 3: HashiCorp Vault
vault kv put secret/arc @.env
```

---

## Database Configuration

### MongoDB Production Setup

#### Option 1: MongoDB Atlas (Recommended)

```bash
# 1. Create MongoDB Atlas cluster
# 2. Configure network access
# 3. Create database user
# 4. Get connection string

# Connection string format:
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/arc_production?retryWrites=true&w=majority"
```

#### Option 2: Self-Hosted MongoDB

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    container_name: arc-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: arc_production
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/mongod.conf:/etc/mongod.conf
      - ./mongodb/init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "27017:27017"
    command: mongod --config /etc/mongod.conf
    networks:
      - arc-network

volumes:
  mongodb_data:
    driver: local

networks:
  arc-network:
    driver: bridge
```

#### MongoDB Configuration (`mongod.conf`)

```yaml
# mongod.conf
storage:
  dbPath: /data/db
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: reopen

net:
  port: 27017
  bindIp: 0.0.0.0

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled

replication:
  replSetName: "arc-replica-set"
```

#### Database Initialization

```javascript
// mongodb/init-scripts/01-init-users.js
db = db.getSiblingDB('arc_production');

db.createUser({
  user: 'arc_user',
  pwd: 'secure_password_here',
  roles: [
    {
      role: 'readWrite',
      db: 'arc_production'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1, status: 1 });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
```

### Redis Configuration

#### Option 1: Redis Cloud

```bash
# Use Redis Cloud or AWS ElastiCache
REDIS_URL="redis://username:password@redis-endpoint:6379"
```

#### Option 2: Self-Hosted Redis

```yaml
# docker-compose.yml (add to services)
redis:
  image: redis:7-alpine
  container_name: arc-redis
  restart: unless-stopped
  command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
  volumes:
    - redis_data:/data
    - ./redis/redis.conf:/etc/redis/redis.conf
  ports:
    - "6379:6379"
  networks:
    - arc-network

volumes:
  redis_data:
    driver: local
```

#### Redis Configuration (`redis.conf`)

```conf
# redis.conf
bind 0.0.0.0
port 6379
requirepass your_redis_password

# Memory management
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

---

## Storage Configuration

### MinIO Object Storage

#### Option 1: MinIO Cloud

```bash
# Use MinIO Cloud service
MINIO_ENDPOINT="play.min.io"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_USE_SSL=true
```

#### Option 2: Self-Hosted MinIO

```yaml
# docker-compose.yml (add to services)
minio:
  image: minio/minio:latest
  container_name: arc-minio
  restart: unless-stopped
  environment:
    MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
    MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
  volumes:
    - minio_data:/data
  ports:
    - "9000:9000"
    - "9001:9001"
  command: server /data --console-address ":9001"
  networks:
    - arc-network

volumes:
  minio_data:
    driver: local
```

#### MinIO Bucket Setup

```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure MinIO client
mc alias set myminio http://localhost:9000 access_key secret_key

# Create buckets
mc mb myminio/products
mc mb myminio/categories

# Set bucket policies
mc policy set public myminio/products
mc policy set public myminio/categories
```

---

## Application Deployment

### Docker Deployment (Recommended)

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install production dependencies
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: arc-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
    depends_on:
      - mongodb
      - redis
      - minio
    networks:
      - arc-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: arc-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - arc-network

  mongodb:
    image: mongo:6.0
    container_name: arc-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/mongod.conf:/etc/mongod.conf
    networks:
      - arc-network

  redis:
    image: redis:7-alpine
    container_name: arc-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - arc-network

  minio:
    image: minio/minio:latest
    container_name: arc-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    networks:
      - arc-network

volumes:
  mongodb_data:
  redis_data:
  minio_data:

networks:
  arc-network:
    driver: bridge
```

#### Deployment Commands

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps app
```

### PM2 Deployment

#### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'arc-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s'
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/arc-backend.git',
      path: '/var/www/arc-backend',
      'pre-deploy-local': '',
      'post-deploy': 'yarn install && yarn build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
```

#### PM2 Commands

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Monitor application
pm2 monit

# View logs
pm2 logs arc-api

# Restart application
pm2 restart arc-api

# Deploy with PM2
pm2 deploy production setup
pm2 deploy production
```

---

## Load Balancing

### Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Upstream servers
    upstream arc_backend {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
        # Add more servers for scaling
        # server app2:3000 max_fails=3 fail_timeout=30s;
        # server app3:3000 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://arc_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://arc_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://arc_backend;
            access_log off;
        }

        # Static files (if serving from nginx)
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy your SSL certificates
cp /path/to/fullchain.pem nginx/ssl/
cp /path/to/privkey.pem nginx/ssl/

# Set proper permissions
chmod 600 nginx/ssl/privkey.pem
chmod 644 nginx/ssl/fullchain.pem
```

---

## Monitoring & Logging

### Application Monitoring

#### Health Check Endpoint

```typescript
// src/routes/health.ts
import { Router } from 'express';
import mongoose from 'mongoose';
import redis from '../config/redis';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    services: {
      database: 'unknown',
      redis: 'unknown',
      storage: 'unknown'
    }
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      health.services.database = 'healthy';
    } else {
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Check Redis
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

#### Prometheus Metrics

```typescript
// src/middleware/metrics.ts
import promClient from 'prom-client';

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Metrics endpoint
export const metricsHandler = async (req: any, res: any) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
};
```

### Logging Configuration

```typescript
// src/config/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'arc-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport with rotation
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Error file transport
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

// Add Sentry transport for production
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  });
  
  logger.add(new winston.transports.Console({
    level: 'error',
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  }));
}

export default logger;
```

### Docker Logging

```yaml
# docker-compose.prod.yml (add to services)
app:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  # or use external logging driver
  # logging:
  #   driver: "fluentd"
  #   options:
  #     fluentd-address: localhost:24224
  #     tag: arc.app
```

---

## Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# scripts/backup-mongodb.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/mongodb"
DB_NAME="arc_production"
MONGO_URI="mongodb://username:password@localhost:27017"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --uri="$MONGO_URI" --db="$DB_NAME" --out="$BACKUP_DIR/$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongodb_backup_$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/$DATE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_backup_$DATE.tar.gz"
```

### Automated Backup with Cron

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-mongodb.sh

# Weekly backup to cloud storage
0 3 * * 0 /path/to/scripts/backup-to-cloud.sh
```

### Recovery Procedures

```bash
# Restore from backup
mongorestore --uri="mongodb://username:password@localhost:27017" --db="arc_production" /path/to/backup/

# Restore specific collection
mongorestore --uri="mongodb://username:password@localhost:27017" --db="arc_production" --collection="users" /path/to/backup/arc_production/users.bson
```

---

## Security Hardening

### Application Security

```typescript
// src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Security middleware
export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  }),
  
  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  // Data sanitization
  mongoSanitize(),
  xss(),
  hpp()
];
```

### Environment Security

```bash
# Firewall configuration (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Docker Security

```dockerfile
# Use non-root user
USER nodejs

# Read-only root filesystem
# docker run --read-only --tmpfs /tmp --tmpfs /var/run arc-app

# Drop capabilities
# docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE arc-app
```

---

## Performance Optimization

### Application Optimization

```typescript
// src/middleware/compression.ts
import compression from 'compression';

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});
```

### Database Optimization

```javascript
// Database indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.products.createIndex({ name: "text", description: "text" });
db.products.createIndex({ category: 1, status: 1 });
db.products.createIndex({ price: 1 });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Caching Strategy

```typescript
// src/middleware/cache.ts
import redis from '../config/redis';

export const cacheMiddleware = (duration: number = 300) => {
  return async (req: any, res: any, next: any) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const originalSend = res.json;
      res.json = function(data: any) {
        redis.setex(key, duration, JSON.stringify(data));
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: password
        ports:
          - 27017:27017
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Run tests
        run: yarn test
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://admin:password@localhost:27017/arc_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run linting
        run: yarn lint
      
      - name: Build application
        run: yarn build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: yourusername/arc-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/arc-backend
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d --no-deps app
            docker system prune -f
```

### Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
yarn install --frozen-lockfile

# Build application
yarn build

# Run database migrations
yarn migrate

# Restart application with PM2
pm2 reload ecosystem.config.js --env production

# Health check
sleep 10
if curl -f http://localhost:3000/health; then
  echo "Deployment successful!"
else
  echo "Deployment failed - rolling back"
  pm2 reload ecosystem.config.js --env production
  exit 1
fi
```

---

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
docker-compose logs app
pm2 logs arc-api

# Check environment variables
env | grep -E "(NODE_ENV|MONGODB_URI|REDIS_URL)"

# Check port availability
sudo netstat -tulpn | grep :3000
```

#### Database Connection Issues

```bash
# Test MongoDB connection
mongo "mongodb://username:password@host:27017/database"

# Check MongoDB status
sudo systemctl status mongod
docker-compose logs mongodb

# Test Redis connection
redis-cli -h host -p 6379 -a password ping
```

#### High Memory Usage

```bash
# Monitor memory usage
top -p $(pgrep node)
htop

# Check for memory leaks
node --inspect dist/server.js

# Adjust Node.js memory limit
node --max-old-space-size=1024 dist/server.js
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# Test SSL configuration
ssl-cert-check -c /path/to/cert.pem

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

### Performance Issues

```bash
# Monitor application performance
npm install -g clinic
clinic doctor -- node dist/server.js

# Database performance
db.runCommand({profile: 2})
db.system.profile.find().sort({ts: -1}).limit(5)

# Redis performance
redis-cli --latency-history
```

### Log Analysis

```bash
# Analyze error logs
grep -i error logs/app.log | tail -20

# Monitor real-time logs
tail -f logs/app.log | grep -i error

# Analyze access patterns
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
```

---

**Need help with deployment?** Check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [Getting Started Guide](./GETTING_STARTED.md).

**Production Checklist:**
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup procedures tested
- [ ] Security hardening applied
- [ ] Performance optimization enabled
- [ ] CI/CD pipeline configured