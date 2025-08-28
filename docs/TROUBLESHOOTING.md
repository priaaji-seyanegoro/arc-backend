# 🔧 Troubleshooting Guide

## Table of Contents
- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Database Problems](#database-problems)
- [Authentication Issues](#authentication-issues)
- [API Errors](#api-errors)
- [File Upload Problems](#file-upload-problems)
- [Performance Issues](#performance-issues)
- [Deployment Problems](#deployment-problems)
- [Environment Configuration](#environment-configuration)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check

First, check if your application is running properly:

```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  }
}
```

### System Status

```bash
# Check if services are running
ps aux | grep node
ps aux | grep mongod
ps aux | grep redis

# Check port usage
sudo netstat -tulpn | grep -E ":(3000|27017|6379)"

# Check disk space
df -h

# Check memory usage
free -h
```

### Log Analysis

```bash
# Application logs
tail -f logs/app.log

# Error logs only
grep -i error logs/app.log | tail -20

# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs arc-api
```

---

## Installation Issues

### Node.js Version Problems

**Problem**: Application fails to start with Node.js version errors.

**Solution**:
```bash
# Check Node.js version
node --version

# Install correct version (18 or higher)
# Using nvm
nvm install 18
nvm use 18

# Using n
sudo npm install -g n
sudo n 18
```

### Dependency Installation Failures

**Problem**: `yarn install` or `npm install` fails.

**Solutions**:
```bash
# Clear cache and reinstall
yarn cache clean
rm -rf node_modules
rm yarn.lock
yarn install

# Or with npm
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install

# Fix permission issues (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.yarn
```

### TypeScript Compilation Errors

**Problem**: Build fails with TypeScript errors.

**Solutions**:
```bash
# Check TypeScript version
npx tsc --version

# Clean build
rm -rf dist
yarn build

# Fix type errors
npx tsc --noEmit

# Update type definitions
yarn add -D @types/node @types/express
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE :::3000`

**Solutions**:
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different port
export PORT=3001
yarn dev
```

---

## Database Problems

### MongoDB Connection Failed

**Problem**: `MongoNetworkError: failed to connect to server`

**Diagnosis**:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection manually
mongo "mongodb://localhost:27017/arc_development"
```

**Solutions**:

1. **Start MongoDB**:
```bash
# Linux/macOS
sudo systemctl start mongod

# macOS with Homebrew
brew services start mongodb-community

# Docker
docker-compose up -d mongodb
```

2. **Check Configuration**:
```bash
# Verify MONGODB_URI in .env
echo $MONGODB_URI

# Test with correct URI
MONGODB_URI="mongodb://localhost:27017/arc_development" yarn dev
```

3. **Authentication Issues**:
```bash
# Create user if needed
mongo
> use arc_development
> db.createUser({
    user: "arc_user",
    pwd: "password",
    roles: ["readWrite"]
  })
```

### Database Performance Issues

**Problem**: Slow database queries.

**Solutions**:

1. **Check Indexes**:
```javascript
// Connect to MongoDB
db.products.getIndexes()
db.users.getIndexes()
db.orders.getIndexes()

// Create missing indexes
db.products.createIndex({ name: "text", description: "text" })
db.products.createIndex({ category: 1, status: 1 })
db.orders.createIndex({ userId: 1, createdAt: -1 })
```

2. **Enable Profiling**:
```javascript
// Enable slow query profiling
db.setProfilingLevel(2, { slowms: 100 })

// Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

### Redis Connection Issues

**Problem**: Redis connection failures.

**Diagnosis**:
```bash
# Test Redis connection
redis-cli ping

# Check Redis status
sudo systemctl status redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

**Solutions**:
```bash
# Start Redis
sudo systemctl start redis

# Or with Docker
docker-compose up -d redis

# Test with password
redis-cli -a your_password ping
```

---

## Authentication Issues

### JWT Token Problems

**Problem**: "Invalid token" or "Token expired" errors.

**Solutions**:

1. **Check JWT Secret**:
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Generate new secret if needed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Token Format Issues**:
```javascript
// Correct Authorization header format
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Test token validity
const jwt = require('jsonwebtoken');
const token = 'your_token_here';
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (error) {
  console.log('Token invalid:', error.message);
}
```

3. **Clock Synchronization**:
```bash
# Sync system clock
sudo ntpdate -s time.nist.gov

# Or use timedatectl
sudo timedatectl set-ntp true
```

### Session Management Issues

**Problem**: Users getting logged out unexpectedly.

**Solutions**:

1. **Check Session Configuration**:
```typescript
// Verify session settings in .env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

// Implement refresh token logic
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  // Verify and generate new access token
});
```

2. **Redis Session Storage**:
```bash
# Check Redis for sessions
redis-cli
> KEYS session:*
> TTL session:user_id
```

---

## API Errors

### 500 Internal Server Error

**Problem**: Server crashes or returns 500 errors.

**Diagnosis**:
```bash
# Check application logs
tail -f logs/app.log | grep -i error

# Check for uncaught exceptions
grep -i "uncaught" logs/app.log
```

**Common Causes & Solutions**:

1. **Database Connection Lost**:
```typescript
// Add connection error handling
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});
```

2. **Unhandled Promise Rejections**:
```typescript
// Add global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
```

### 404 Not Found Errors

**Problem**: API endpoints return 404.

**Solutions**:

1. **Check Route Registration**:
```typescript
// Verify routes are properly registered
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Add catch-all route for debugging
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});
```

2. **Check Base URL**:
```bash
# Correct API calls
curl http://localhost:3000/api/v1/products

# Not
curl http://localhost:3000/products
```

### CORS Issues

**Problem**: "Access to fetch at ... has been blocked by CORS policy"

**Solutions**:

1. **Configure CORS Properly**:
```typescript
// Update CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

2. **Environment-Specific CORS**:
```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN?.split(',') 
    : true,
  credentials: true
};
```

---

## File Upload Problems

### MinIO Connection Issues

**Problem**: File uploads fail with MinIO errors.

**Diagnosis**:
```bash
# Test MinIO connection
curl http://localhost:9000/minio/health/live

# Check MinIO logs
docker-compose logs minio
```

**Solutions**:

1. **Verify MinIO Configuration**:
```bash
# Check environment variables
echo $MINIO_ENDPOINT
echo $MINIO_ACCESS_KEY
echo $MINIO_SECRET_KEY

# Test with MinIO client
mc alias set local http://localhost:9000 access_key secret_key
mc ls local
```

2. **Create Missing Buckets**:
```bash
# Create buckets
mc mb local/products
mc mb local/categories

# Set bucket policy
mc policy set public local/products
```

### File Size Limits

**Problem**: "File too large" errors.

**Solutions**:

1. **Check Upload Limits**:
```typescript
// Update multer configuration
const upload = multer({
  storage: multerS3({
    s3: minioClient,
    bucket: 'products',
    key: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
```

2. **Nginx Upload Limits**:
```nginx
# In nginx.conf
client_max_body_size 10M;
```

### Image Processing Errors

**Problem**: Image optimization fails.

**Solutions**:

1. **Check Sharp Installation**:
```bash
# Reinstall sharp
yarn remove sharp
yarn add sharp

# For Docker
RUN yarn add sharp --platform=linux --arch=x64
```

2. **Handle Processing Errors**:
```typescript
try {
  const optimizedBuffer = await sharp(buffer)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
} catch (error) {
  logger.error('Image processing failed:', error);
  // Fallback to original image
}
```

---

## Performance Issues

### High Memory Usage

**Problem**: Application consumes too much memory.

**Diagnosis**:
```bash
# Monitor memory usage
top -p $(pgrep node)
htop

# Node.js memory usage
node --inspect dist/server.js
# Then open chrome://inspect
```

**Solutions**:

1. **Increase Memory Limit**:
```bash
# Set Node.js memory limit
node --max-old-space-size=2048 dist/server.js

# Or in package.json
"scripts": {
  "start": "node --max-old-space-size=2048 dist/server.js"
}
```

2. **Fix Memory Leaks**:
```typescript
// Proper cleanup
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  await redis.quit();
  process.exit(0);
});

// Avoid global variables
// Use weak references for caches
const cache = new WeakMap();
```

### Slow API Responses

**Problem**: API endpoints respond slowly.

**Solutions**:

1. **Add Response Time Monitoring**:
```typescript
import responseTime from 'response-time';

app.use(responseTime((req, res, time) => {
  if (time > 1000) {
    logger.warn(`Slow request: ${req.method} ${req.url} - ${time}ms`);
  }
}));
```

2. **Implement Caching**:
```typescript
// Redis caching middleware
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      redis.setex(key, duration, JSON.stringify(data));
      return originalSend.call(this, data);
    };
    
    next();
  };
};
```

3. **Database Query Optimization**:
```typescript
// Use lean queries
const products = await Product.find({ status: 'active' })
  .lean()
  .select('name price category')
  .limit(20);

// Use aggregation for complex queries
const stats = await Order.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: null, total: { $sum: '$total' } } }
]);
```

---

## Deployment Problems

### Docker Build Failures

**Problem**: Docker build fails.

**Solutions**:

1. **Check Dockerfile**:
```dockerfile
# Use specific Node.js version
FROM node:18-alpine

# Copy package files first
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Then copy source code
COPY . .
```

2. **Build Context Issues**:
```bash
# Check .dockerignore
echo "node_modules\n.git\nlogs\n*.log" > .dockerignore

# Build with verbose output
docker build --no-cache --progress=plain .
```

### Container Startup Issues

**Problem**: Container exits immediately.

**Diagnosis**:
```bash
# Check container logs
docker logs container_name

# Run container interactively
docker run -it --entrypoint /bin/sh image_name
```

**Solutions**:

1. **Health Checks**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

2. **Proper Signal Handling**:
```dockerfile
# Use dumb-init
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### SSL Certificate Issues

**Problem**: HTTPS not working in production.

**Solutions**:

1. **Let's Encrypt Setup**:
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Test renewal
sudo certbot renew --dry-run
```

2. **Manual Certificate**:
```bash
# Check certificate validity
openssl x509 -in cert.pem -text -noout

# Test SSL configuration
ssl-cert-check -c cert.pem
```

---

## Environment Configuration

### Missing Environment Variables

**Problem**: Application fails due to missing env vars.

**Solutions**:

1. **Environment Validation**:
```typescript
// src/config/env.ts
const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'REDIS_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

2. **Environment Templates**:
```bash
# Copy example file
cp .env.example .env

# Fill in required values
vim .env
```

### Configuration Conflicts

**Problem**: Different environments have conflicting configs.

**Solutions**:

1. **Environment-Specific Configs**:
```typescript
// src/config/index.ts
const config = {
  development: {
    port: 3000,
    logLevel: 'debug',
    cors: { origin: true }
  },
  production: {
    port: process.env.PORT || 3000,
    logLevel: 'info',
    cors: { origin: process.env.CORS_ORIGIN?.split(',') }
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

2. **Config Validation**:
```typescript
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required()
});

const { error, value } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
```

---

## Frequently Asked Questions

### General Questions

**Q: How do I reset the database?**

A: 
```bash
# Drop database
mongo
> use arc_development
> db.dropDatabase()

# Or with Docker
docker-compose down -v
docker-compose up -d
```

**Q: How do I change the default port?**

A:
```bash
# Set PORT environment variable
export PORT=8080
yarn dev

# Or in .env file
PORT=8080
```

**Q: How do I enable debug logging?**

A:
```bash
# Set log level
export LOG_LEVEL=debug

# Or use DEBUG environment variable
DEBUG=arc:* yarn dev
```

### Development Questions

**Q: How do I add a new API endpoint?**

A:
1. Create controller function
2. Add route definition
3. Register route in main app
4. Add validation middleware
5. Update API documentation

**Q: How do I test API endpoints?**

A:
```bash
# Using curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Using httpie
http POST localhost:3000/api/auth/login email=test@example.com password=password

# Run test suite
yarn test
```

**Q: How do I add database migrations?**

A:
```typescript
// Create migration file
// migrations/001-add-user-indexes.ts
export async function up() {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
}

export async function down() {
  await db.collection('users').dropIndex({ email: 1 });
}
```

### Production Questions

**Q: How do I monitor the application?**

A:
- Use PM2 monitoring: `pm2 monit`
- Check health endpoint: `curl /health`
- Monitor logs: `tail -f logs/app.log`
- Use APM tools: New Relic, DataDog

**Q: How do I scale the application?**

A:
```bash
# With PM2
pm2 scale arc-api 4

# With Docker
docker-compose up -d --scale app=3

# With Kubernetes
kubectl scale deployment arc-api --replicas=3
```

**Q: How do I backup the database?**

A:
```bash
# MongoDB backup
mongodump --uri="mongodb://user:pass@host:27017/database" --out=/backup/

# Automated backup script
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
mongodump --uri="$MONGODB_URI" --out="/backup/$DATE"
tar -czf "/backup/backup_$DATE.tar.gz" "/backup/$DATE"
```

### Security Questions

**Q: How do I secure the API?**

A:
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use strong JWT secrets
- Keep dependencies updated
- Follow OWASP guidelines

**Q: How do I handle sensitive data?**

A:
```typescript
// Encrypt sensitive data
import crypto from 'crypto';

const encrypt = (text: string) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Hash passwords
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(password, 12);
```

---

## Getting Help

### Before Asking for Help

1. **Check the logs** for error messages
2. **Search existing issues** in the repository
3. **Try the solutions** in this troubleshooting guide
4. **Test with minimal configuration** to isolate the problem
5. **Gather system information** (OS, Node.js version, etc.)

### How to Report Issues

When reporting issues, please include:

```markdown
## Environment
- OS: [e.g., Ubuntu 20.04, macOS 12.0, Windows 10]
- Node.js version: [e.g., 18.17.0]
- Package manager: [e.g., yarn 1.22.19, npm 9.8.1]
- Database: [e.g., MongoDB 6.0.8]

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
Describe what you expected to happen.

## Actual Behavior
Describe what actually happened.

## Error Messages
```
Paste any error messages here
```

## Additional Context
Add any other context about the problem here.
```

### Useful Commands for Debugging

```bash
# System information
uname -a
node --version
npm --version
yarn --version

# Application information
ps aux | grep node
netstat -tulpn | grep :3000

# Log analysis
tail -f logs/app.log
grep -i error logs/app.log | tail -20

# Database status
mongo --eval "db.runCommand('ping')"
redis-cli ping

# Docker information
docker --version
docker-compose --version
docker ps
docker logs container_name
```

### Community Resources

- **Documentation**: Check the [Getting Started Guide](./GETTING_STARTED.md)
- **API Reference**: See [API Reference](./API_REFERENCE.md)
- **Deployment**: Read [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- **GitHub Issues**: Search existing issues or create a new one
- **Stack Overflow**: Tag your questions with relevant technologies

### Professional Support

For production deployments or complex issues:

- Consider hiring a Node.js consultant
- Use managed services (MongoDB Atlas, Redis Cloud)
- Implement proper monitoring and alerting
- Set up automated backups and disaster recovery

---

**Remember**: Most issues can be resolved by carefully reading error messages and checking the logs. Take your time to understand the problem before implementing solutions.

**Need more help?** Check our other documentation:
- [Getting Started Guide](./GETTING_STARTED.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Upload API Guide](./UPLOAD_API.md)