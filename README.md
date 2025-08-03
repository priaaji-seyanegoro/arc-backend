# ARC Backend

## 📋 Project Description

ARC Backend is a comprehensive e-commerce backend system that provides complete APIs for product management, user management, cart functionality, order processing, and discount systems. Built with Node.js, TypeScript, and MongoDB for optimal performance and scalability.

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

### 🔐 Authentication Routes

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123!",
  "confirmPassword": "password123!",
  "phone": "+1234567890"
}
```

#### Login User

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123!"
}
```

#### Verify Email

```http
GET /auth/verify-email/:token
```

#### Request Password Reset

```http
POST /auth/request-password-reset
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

#### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "newPassword123!",
  "confirmPassword": "newPassword123!"
}
```

#### Refresh Token

```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### 🔒 Protected Routes (Require Authentication)

#### Get User Profile

```http
GET /auth/profile
Authorization: Bearer <access_token>
```

#### Update User Profile

```http
PUT /auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Change Password

```http
PUT /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword123!"
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

#### Send Verification Email

```http
POST /auth/send-verification
Authorization: Bearer <access_token>
```

## 🧪 Testing with cURL

### Register Example

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123!",
    "confirmPassword": "password123!"
  }'
```

### Login Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123!"
  }'
```

### Reset Password Example

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_reset_token",
    "newPassword": "newPassword123!",
    "confirmPassword": "newPassword123!"
  }'
```

## ⚙️ Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT
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

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `yarn install`
3. Set up environment variables in `.env`
4. Start the server: `yarn run dev`
5. Server will run on `http://localhost:3000`

## ✅ Tested Endpoints

- ✅ User Registration
- ✅ User Login
- ✅ Email Verification
- ✅ Password Reset Request
- ✅ Password Reset
- ✅ Token Refresh
- ✅ User Profile Management
- ✅ Password Change
