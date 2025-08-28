# ARC Backend

## 📋 Project Description

ARC Backend is a comprehensive e-commerce backend system that provides complete APIs for product management, user management, cart functionality, order processing, shipping integration, and payment systems. Built with Node.js, TypeScript, and MongoDB for optimal performance and scalability.

## 📚 Documentation

### Quick Start
- [🚀 Getting Started Guide](docs/GETTING_STARTED.md) - Complete setup and installation instructions
- [📖 API Reference](docs/API_REFERENCE.md) - Comprehensive API documentation with examples

### Feature Documentation
- [📤 Upload API Guide](docs/UPLOAD_API.md) - File upload and image management
- [🚚 Shipping Integration](docs/SHIPPING_INTEGRATION_GUIDE.md) - Shipping and geocoding services

### Operations & Deployment
- [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment and configuration
- [🔧 Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

### Quick Navigation
- [Tech Stack](#-tech-stack)
- [Features](#-tested--working-features)
- [Environment Setup](#-environment-variables)
- [Development](#-development)
- [Contributing](#-contributing)

## 🏗️ Tech Stack

### Backend Framework

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript

### Database & Storage

- **MongoDB** - Primary database with Mongoose ODM
- **Redis** - Caching and session storage
- **MinIO** - Object storage for file uploads

### Authentication & Security

- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **cors** - Cross-origin resource sharing

### File Processing

- **multer** - File upload handling
- **sharp** - Image processing and optimization

### Email & Communication

- **nodemailer** - Email service
- **handlebars** - Email template engine

### Payment Integration

- **midtrans-client** - Payment gateway

### Development Tools

- **nodemon** - Development server
- **eslint** - Code linting
- **prettier** - Code formatting
- **jest** - Testing framework
- **winston** - Logging

## 🚀 API Overview

The ARC Backend provides comprehensive REST APIs for e-commerce functionality. For detailed API documentation with complete request/response examples, please refer to our [📖 API Reference](docs/API_REFERENCE.md).

### Main API Categories

- **🔐 Authentication & Users** - Registration, login, profile management
- **🛍️ Products & Categories** - Product CRUD, search, filtering
- **🛒 Shopping Cart** - Cart management and checkout
- **📦 Orders** - Order processing and management
- **📤 File Upload** - Image and file management
- **🚚 Shipping** - Delivery options and address validation
- **💳 Payments** - Payment processing integration
- **👑 Admin** - Administrative operations

### Quick API Examples

```bash
# Get all products
curl -X GET "http://localhost:3000/api/products"

# User login
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get shipping options
curl -X POST "http://localhost:3000/api/orders/shipping-options" \
  -H "Content-Type: application/json" \
  -d '{"origin":"Jakarta","destination":"Bandung","weight":1000}'
```

> 📖 **For complete API documentation** with all endpoints, parameters, and examples, visit [API Reference](docs/API_REFERENCE.md)
## 🔧 Development

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB (local or Atlas)
- Redis server
- MinIO server (for file storage)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd arc-backend
   yarn install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   # Start development server
   yarn run dev
   
   # Server runs on http://localhost:3000
   ```

4. **Test API**
   ```bash
   # Health check
   curl http://localhost:3000/api/health
   
   # Get products
   curl http://localhost:3000/api/products
   ```

> 📖 **For detailed setup instructions**, see [Getting Started Guide](docs/GETTING_STARTED.md)

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email@domain.com

# File Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=arc-backend

# Redis Cache
REDIS_URL=redis://localhost:6379

# Shipping APIs
RAJAONGKIR_API_KEY=your-rajaongkir-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
OPENCAGE_API_KEY=your-opencage-key

# Payment Gateway
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

> 📖 **For complete environment setup**, see [Getting Started Guide](docs/GETTING_STARTED.md)

## ✅ Tested & Working Features

### Authentication System
- ✅ User Registration
- ✅ User Login
- ✅ Email Verification
- ✅ Password Reset Request
- ✅ Password Reset
- ✅ Token Refresh
- ✅ User Profile Management
- ✅ Password Change
- ✅ Logout

### Product Management
- ✅ Product CRUD Operations
- ✅ Product Search & Filtering
- ✅ Category Management
- ✅ SKU Management
- ✅ Stock Management
- ✅ Image Handling

### Shopping Cart
- ✅ Add Items to Cart
- ✅ Update Cart Items
- ✅ Remove Items from Cart
- ✅ Clear Cart
- ✅ Cart Validation
- ✅ Stock Checking
- ✅ Price Calculation

### Order Management
- ✅ Checkout Process
- ✅ Order Creation
- ✅ Order History
- ✅ Order Filtering by Status
- ✅ Order Cancellation
- ✅ Stock Management
- ✅ Shipping Cost Calculation
- ✅ Admin Order Management
- ✅ Order Status Updates
- ✅ Payment Status Updates
- ✅ Order Statistics

### 🚚 Shipping & Delivery System
- ✅ **Domestic Shipping (Indonesia)**
  - RajaOngkir API integration for JNE, J&T, POS Indonesia
  - Real-time shipping cost calculation
  - Multiple service types (REG, YES, OKE)
  - Weight-based pricing

- ✅ **Instant Delivery Services**
  - Gojek integration for same-day delivery
  - Grab integration for express delivery
  - Distance-based pricing
  - Real-time availability checking

- ✅ **International Shipping**
  - DHL Express integration
  - FedEx integration
  - EMS (Express Mail Service)
  - Country-specific restrictions
  - Customs declaration support

### 🗺️ Geocoding & Mapping System
- ✅ **Address Validation**
  - Google Maps Geocoding API
  - OpenCage Geocoding (fallback)
  - Nominatim OSM (free fallback)
  - Address component extraction

- ✅ **Location Services**
  - Accurate coordinate conversion
  - Reverse geocoding
  - Distance calculation (Haversine formula)
  - Delivery zone determination

- ✅ **Map Integration**
  - Static map generation
  - Interactive map embedding
  - Location pin accuracy
  - Multiple map providers support

### Security & Validation
- ✅ JWT Authentication
- ✅ Role-based Authorization
- ✅ Input Validation
- ✅ Error Handling
- ✅ Rate Limiting
- ✅ CORS Configuration

## 🎯 Next Development Steps

1. **Payment Integration**
   - Midtrans payment gateway
   - Payment webhooks
   - Payment verification

2. **File Upload System**
   - Image upload for products
   - Image optimization
   - File management

3. **Notification System**
   - Email notifications
   - Order status updates
   - Welcome emails

4. **Advanced Features**
   - Discount & coupon system
   - User address management
   - Product reviews & ratings
   - Wishlist functionality

5. **Analytics & Reporting**
   - Sales reports
   - User analytics
   - Product performance

## 📝 API Documentation

For detailed API documentation with request/response examples, please refer to the Postman collection or contact the development team.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
