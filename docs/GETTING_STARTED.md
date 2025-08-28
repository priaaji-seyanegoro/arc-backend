# 🚀 Getting Started with ARC Backend

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [First API Call](#first-api-call)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (v5.0 or higher)
- **Redis** (v6.0 or higher)
- **Git**

### Optional but Recommended
- **MongoDB Compass** - GUI for MongoDB
- **Redis Commander** - GUI for Redis
- **Postman** or **Insomnia** - API testing
- **VS Code** with TypeScript extensions

### Verify Installation

```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check npm version
npm --version

# Check MongoDB
mongod --version

# Check Redis
redis-server --version
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd arc-backend
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Install Global Dependencies (Optional)

```bash
# TypeScript compiler (if not already installed)
npm install -g typescript

# Nodemon for development (if not already installed)
npm install -g nodemon
```

## Environment Setup

### 1. Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Open `.env` file and update the following essential variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/arc-backend

# JWT Secret (Generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Redis
REDIS_URL=redis://localhost:6379

# Email Configuration (for development, you can use Mailtrap)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=noreply@arcbackend.com

# MinIO (Object Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=arc-storage
```

### 3. Generate JWT Secrets

For security, generate strong JWT secrets:

```bash
# Generate random strings for JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Database Setup

### 1. Start MongoDB

```bash
# Start MongoDB service
# On macOS with Homebrew:
brew services start mongodb-community

# On Ubuntu/Debian:
sudo systemctl start mongod

# On Windows:
net start MongoDB
```

### 2. Start Redis

```bash
# Start Redis service
# On macOS with Homebrew:
brew services start redis

# On Ubuntu/Debian:
sudo systemctl start redis-server

# On Windows:
redis-server
```

### 3. Setup MinIO (Object Storage)

#### Option A: Using Docker (Recommended)

```bash
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio_data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

#### Option B: Local Installation

1. Download MinIO from [min.io](https://min.io/download)
2. Run MinIO server:

```bash
# On macOS/Linux
./minio server ~/minio-data

# On Windows
minio.exe server C:\minio-data
```

3. Access MinIO Console at `http://localhost:9001`
4. Login with `minioadmin` / `minioadmin`
5. Create bucket named `arc-storage`

### 4. Verify Database Connections

```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/arc-backend

# Test Redis connection
redis-cli ping
# Should return: PONG
```

## Running the Application

### 1. Development Mode

```bash
# Start the development server with hot reload
npm run dev

# Or with yarn
yarn dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### 2. Production Mode

```bash
# Build the TypeScript code
npm run build

# Start the production server
npm start
```

### 3. Verify Server is Running

Open your browser and navigate to:
- **Health Check**: `http://localhost:3000/api/health`
- **API Documentation**: `http://localhost:3000/api/docs` (if implemented)

You should see a JSON response indicating the server is running.

## First API Call

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0"
  }
}
```

### 2. Register Your First User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "phone": "+1234567890"
  }'
```

### 3. Login and Get Access Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123!"
  }'
```

Save the `accessToken` from the response for authenticated requests.

## Project Structure

```
arc-backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Database connection
│   │   └── env.ts       # Environment variables
│   ├── controllers/     # Route controllers
│   │   ├── authController.ts
│   │   ├── productController.ts
│   │   └── ...
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── cache.ts     # Caching middleware
│   │   └── ...
│   ├── models/          # MongoDB models
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   └── ...
│   ├── routes/          # API routes
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   └── ...
│   ├── services/        # Business logic services
│   │   ├── emailService.ts
│   │   ├── paymentService.ts
│   │   └── ...
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation schemas
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── docs/                # Documentation
├── tests/               # Test files
├── uploads/             # File uploads (development)
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Development Workflow

### 1. Making Changes

1. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the appropriate files

3. **Test your changes**:
   ```bash
   npm run test
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

### 2. Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Database
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database
```

### 3. Debugging

#### Enable Debug Logs

Set the `DEBUG` environment variable:

```bash
DEBUG=arc:* npm run dev
```

#### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug ARC Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

## Next Steps

Now that you have the basic setup running, here's what you can do next:

### 1. Explore the API
- 📖 Read the [API Documentation](../README.md#api-endpoints)
- 🔧 Check out the [Upload API Guide](./UPLOAD_API.md)
- 🚚 Learn about [Shipping Integration](../SHIPPING_INTEGRATION_GUIDE.md)

### 2. Development Resources
- 🏗️ [Deployment Guide](./DEPLOYMENT.md)
- 🐛 [Troubleshooting Guide](./TROUBLESHOOTING.md)
- 📋 [API Reference](./API_REFERENCE.md)

### 3. Customize for Your Needs
- Add new models and controllers
- Implement additional authentication methods
- Integrate with external services
- Set up monitoring and logging

### 4. Production Deployment
- Configure production environment variables
- Set up SSL certificates
- Configure reverse proxy (Nginx)
- Set up monitoring and logging
- Implement backup strategies

## Need Help?

If you encounter any issues:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review the logs in the console
3. Verify all environment variables are set correctly
4. Ensure all services (MongoDB, Redis, MinIO) are running
5. Check the [GitHub Issues](https://github.com/your-repo/issues) for known problems

---

**Happy coding! 🚀**