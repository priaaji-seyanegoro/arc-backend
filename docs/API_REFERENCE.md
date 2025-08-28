# 📚 API Reference

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
  - [Authentication & User Management](#authentication--user-management)
  - [Product Management](#product-management)
  - [Category Management](#category-management)
  - [Shopping Cart](#shopping-cart)
  - [Order Management](#order-management)
  - [File Upload](#file-upload)
  - [Payment Processing](#payment-processing)
  - [Shipping & Delivery](#shipping--delivery)
  - [Admin Operations](#admin-operations)
  - [System Health](#system-health)

## Overview

The ARC Backend API is a RESTful API that provides comprehensive e-commerce functionality. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `http://localhost:3000/api` (development)

**API Version**: v1

**Content-Type**: `application/json` (unless specified otherwise)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid access token.

### Token Types
- **Access Token**: Short-lived token for API access (15 minutes)
- **Refresh Token**: Long-lived token for obtaining new access tokens (7 days)

### Authentication Header
```http
Authorization: Bearer <access_token>
```

### Token Refresh
When an access token expires, use the refresh token to obtain a new one:

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    // Array of items
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Error Handling

### HTTP Status Codes
- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation errors
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_FAILED` - Invalid credentials
- `TOKEN_EXPIRED` - Access token expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **File upload endpoints**: 10 requests per 15 minutes per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

# API Endpoints

## Authentication & User Management

### Register User
Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "phone": "+1234567890"
}
```

**Validation Rules:**
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 8 characters, must contain uppercase, lowercase, number, and special character
- `confirmPassword`: Must match password
- `phone`: Optional, valid phone number format

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "isEmailVerified": false,
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Login User
Authenticate user and receive access tokens.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "isEmailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

### Get User Profile
Retrieve current user's profile information.

```http
GET /api/auth/profile
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "isEmailVerified": true,
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Update User Profile
Update current user's profile information.

```http
PUT /api/auth/profile
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### Change Password
Change current user's password.

```http
PUT /api/auth/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### Email Verification
Verify user's email address.

```http
GET /api/auth/verify-email/:token
```

### Request Password Reset
Request password reset email.

```http
POST /api/auth/request-password-reset
```

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

### Reset Password
Reset password using reset token.

```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### Logout
Invalidate current session.

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

---

## Product Management

### Get All Products
Retrieve a paginated list of products with filtering options.

```http
GET /api/products
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `category` (string): Filter by category slug
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `search` (string): Search in product name and description
- `sort` (string): Sort by field (name, price, createdAt)
- `order` (string): Sort order (asc, desc)
- `inStock` (boolean): Filter by stock availability

**Example Request:**
```http
GET /api/products?page=1&limit=10&category=tops&minPrice=100000&maxPrice=500000&search=shirt&sort=price&order=asc
```

**Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "product_id",
      "name": "Oversized Cotton T-Shirt",
      "slug": "oversized-cotton-t-shirt",
      "description": "Comfortable oversized cotton t-shirt",
      "category": {
        "id": "category_id",
        "name": "Tops",
        "slug": "tops"
      },
      "basePrice": 299000,
      "images": [
        "http://localhost:9000/products/product_1.webp",
        "http://localhost:9000/products/product_2.webp"
      ],
      "skus": [
        {
          "id": "sku_id",
          "sku": "ARC-TOP-S-WHT-001",
          "size": "S",
          "color": "White",
          "price": 299000,
          "stock": 50,
          "weight": 190
        }
      ],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Product by Slug
Retrieve a single product by its slug.

```http
GET /api/products/:slug
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "id": "product_id",
      "name": "Oversized Cotton T-Shirt",
      "slug": "oversized-cotton-t-shirt",
      "description": "Comfortable oversized cotton t-shirt perfect for casual wear. Made from 100% premium cotton.",
      "category": {
        "id": "category_id",
        "name": "Tops",
        "slug": "tops",
        "description": "T-shirts, shirts, and tops"
      },
      "basePrice": 299000,
      "images": [
        "http://localhost:9000/products/product_1.webp",
        "http://localhost:9000/products/product_2.webp"
      ],
      "skus": [
        {
          "id": "sku_id",
          "sku": "ARC-TOP-S-WHT-001",
          "size": "S",
          "color": "White",
          "price": 299000,
          "stock": 50,
          "weight": 190,
          "isActive": true
        }
      ],
      "tags": ["cotton", "casual", "oversized"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create Product (Admin)
Create a new product.

```http
POST /api/products
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Oversized Cotton T-Shirt",
  "description": "Comfortable oversized cotton t-shirt",
  "category": "category_id",
  "basePrice": 299000,
  "images": [
    "http://localhost:9000/products/product_1.webp",
    "http://localhost:9000/products/product_2.webp"
  ],
  "skus": [
    {
      "sku": "ARC-TOP-S-WHT-001",
      "size": "S",
      "color": "White",
      "price": 299000,
      "stock": 50,
      "weight": 190
    }
  ],
  "tags": ["cotton", "casual", "oversized"]
}
```

### Update Product (Admin)
Update an existing product.

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
```

### Delete Product (Admin)
Delete a product.

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

---

## Category Management

### Get All Categories
Retrieve all product categories.

```http
GET /api/categories
```

**Response (200):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "category_id",
      "name": "Tops",
      "slug": "tops",
      "description": "T-shirts, shirts, and tops",
      "image": "http://localhost:9000/categories/tops.webp",
      "isActive": true,
      "productCount": 25,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Category by Slug
Retrieve a single category with its products.

```http
GET /api/categories/:slug
```

**Query Parameters:**
- `includeProducts` (boolean): Include category products (default: false)
- `page` (number): Page number for products
- `limit` (number): Products per page

### Create Category (Admin)
Create a new category.

```http
POST /api/categories
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Tops",
  "description": "T-shirts, shirts, and tops",
  "image": "http://localhost:9000/categories/tops.webp"
}
```

---

## Shopping Cart

### Get User Cart
Retrieve current user's shopping cart.

```http
GET /api/cart
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "id": "cart_id",
      "userId": "user_id",
      "items": [
        {
          "id": "item_id",
          "product": {
            "id": "product_id",
            "name": "Oversized Cotton T-Shirt",
            "slug": "oversized-cotton-t-shirt",
            "images": ["http://localhost:9000/products/product_1.webp"]
          },
          "sku": {
            "id": "sku_id",
            "sku": "ARC-TOP-S-WHT-001",
            "size": "S",
            "color": "White",
            "price": 299000,
            "stock": 50,
            "weight": 190
          },
          "quantity": 2,
          "subtotal": 598000,
          "addedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "summary": {
        "itemCount": 2,
        "totalWeight": 380,
        "subtotal": 598000,
        "tax": 59800,
        "total": 657800
      },
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Add Item to Cart
Add a product to the shopping cart.

```http
POST /api/cart/add
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "productId": "product_id",
  "sku": "ARC-TOP-S-WHT-001",
  "quantity": 2
}
```

### Update Cart Item
Update quantity of a cart item.

```http
PUT /api/cart/item/:itemId
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove Item from Cart
Remove an item from the cart.

```http
DELETE /api/cart/item/:itemId
Authorization: Bearer <access_token>
```

### Clear Cart
Remove all items from the cart.

```http
DELETE /api/cart/clear
Authorization: Bearer <access_token>
```

---

## Order Management

### Checkout (Create Order)
Create a new order from cart items.

```http
POST /api/orders/checkout
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "shippingAddress": {
    "recipientName": "John Doe",
    "phone": "+6281234567890",
    "street": "Jl. Sudirman No. 123",
    "city": "Jakarta",
    "state": "DKI Jakarta",
    "postalCode": "12345",
    "country": "Indonesia"
  },
  "shippingMethod": "standard",
  "paymentMethod": "bank_transfer",
  "notes": "Please handle with care"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "ARC-2024-001",
      "userId": "user_id",
      "status": "pending",
      "paymentStatus": "pending",
      "items": [
        {
          "product": {
            "id": "product_id",
            "name": "Oversized Cotton T-Shirt",
            "slug": "oversized-cotton-t-shirt"
          },
          "sku": {
            "sku": "ARC-TOP-S-WHT-001",
            "size": "S",
            "color": "White",
            "price": 299000
          },
          "quantity": 2,
          "price": 299000,
          "subtotal": 598000
        }
      ],
      "shippingAddress": {
        "recipientName": "John Doe",
        "phone": "+6281234567890",
        "street": "Jl. Sudirman No. 123",
        "city": "Jakarta",
        "state": "DKI Jakarta",
        "postalCode": "12345",
        "country": "Indonesia"
      },
      "pricing": {
        "subtotal": 598000,
        "shippingCost": 15000,
        "tax": 61300,
        "total": 674300
      },
      "shippingMethod": "standard",
      "paymentMethod": "bank_transfer",
      "notes": "Please handle with care",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Get User Orders
Retrieve current user's orders.

```http
GET /api/orders/my-orders
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (string): Filter by order status
- `paymentStatus` (string): Filter by payment status
- `page` (number): Page number
- `limit` (number): Orders per page

### Get Order by ID
Retrieve a specific order.

```http
GET /api/orders/:orderId
Authorization: Bearer <access_token>
```

### Cancel Order
Cancel a pending order.

```http
PATCH /api/orders/:orderId/cancel
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "cancelReason": "Changed my mind"
}
```

---

## File Upload

### Upload Product Images
Upload single or multiple product images.

```http
POST /api/upload/products/single
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>

Form Data:
- image: File (required)
```

```http
POST /api/upload/products/multiple
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>

Form Data:
- images: File[] (required, max 10 files)
```

**File Requirements:**
- **Formats**: JPEG, PNG, WebP
- **Max Size**: 5MB per file
- **Max Files**: 10 files per request

**Response (200):**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": {
    "images": [
      {
        "filename": "product_1234567890.webp",
        "url": "http://localhost:9000/products/product_1234567890.webp",
        "thumbnailUrl": "http://localhost:9000/products/thumb_product_1234567890.webp",
        "size": 245760
      }
    ],
    "count": 1
  }
}
```

### Upload Category Image
Upload category image.

```http
POST /api/upload/categories/single
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>

Form Data:
- image: File (required)
```

### Delete File
Delete an uploaded file.

```http
DELETE /api/upload/:bucket/:filename
Authorization: Bearer <admin_token>
```

---

## Payment Processing

### Create Payment
Initiate payment for an order.

```http
POST /api/payments/create
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "orderId": "order_id",
  "paymentMethod": "bank_transfer"
}
```

### Payment Notification
Handle payment gateway notifications (webhook).

```http
POST /api/payments/notification
```

### Get Payment Status
Check payment status for an order.

```http
GET /api/payments/status/:orderId
Authorization: Bearer <access_token>
```

---

## Shipping & Delivery

### Get Shipping Options
Calculate shipping costs and options.

```http
POST /api/orders/shipping-options
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "destination": {
    "street": "Jl. Sudirman No. 123",
    "city": "Jakarta",
    "state": "DKI Jakarta",
    "postalCode": "12345",
    "country": "Indonesia"
  },
  "weight": 500,
  "courier": "jne",
  "service": "REG"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Shipping options retrieved successfully",
  "data": {
    "domestic": [
      {
        "courier": "jne",
        "service": "REG",
        "description": "Layanan Reguler",
        "cost": 15000,
        "etd": "2-3 hari"
      }
    ],
    "instant": [
      {
        "courier": "gojek",
        "service": "instant",
        "description": "Same Day Delivery",
        "cost": 25000,
        "etd": "2-4 jam"
      }
    ],
    "international": []
  }
}
```

### Validate Address
Validate and geocode shipping address.

```http
POST /api/orders/validate-address
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "address": "Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110"
}
```

### Get Delivery Information
Get detailed delivery information.

```http
POST /api/orders/delivery-info
Authorization: Bearer <access_token>
```

---

## Admin Operations

### Get All Orders (Admin)
Retrieve all orders with filtering.

```http
GET /api/orders
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` (string): Filter by order status
- `paymentStatus` (string): Filter by payment status
- `search` (string): Search in customer name or order number
- `page` (number): Page number
- `limit` (number): Orders per page
- `startDate` (string): Filter orders from date (ISO format)
- `endDate` (string): Filter orders to date (ISO format)

### Update Order Status (Admin)
Update order status and tracking information.

```http
PATCH /api/orders/:orderId/status
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "JNE123456789",
  "notes": "Package shipped via JNE"
}
```

### Update Payment Status (Admin)
Update payment status for an order.

```http
PATCH /api/orders/:orderId/payment
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "paymentId": "midtrans_transaction_id",
  "paidAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Order Statistics (Admin)
Retrieve order and sales statistics.

```http
GET /api/orders/admin/stats
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `period` (string): Time period (today, week, month, year)
- `startDate` (string): Custom start date
- `endDate` (string): Custom end date

**Response (200):**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "orders": {
      "total": 150,
      "pending": 25,
      "processing": 30,
      "shipped": 70,
      "delivered": 20,
      "cancelled": 5
    },
    "revenue": {
      "total": 15000000,
      "thisMonth": 3000000,
      "lastMonth": 2500000,
      "growth": 20
    },
    "products": {
      "totalSold": 300,
      "topSelling": [
        {
          "productId": "product_id",
          "name": "Oversized Cotton T-Shirt",
          "sold": 50
        }
      ]
    }
  }
}
```

---

## System Health

### Health Check
Check system health and status.

```http
GET /api/health
```

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0",
    "services": {
      "database": "connected",
      "redis": "connected",
      "minio": "connected"
    }
  }
}
```

---

## Status Values Reference

### Order Status
- `pending` - Order created, awaiting payment
- `paid` - Payment confirmed
- `processing` - Order being prepared
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled
- `refunded` - Order refunded

### Payment Status
- `pending` - Payment not yet made
- `paid` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded
- `cancelled` - Payment cancelled

### Shipping Methods
- `standard` - Standard shipping (2-3 days)
- `express` - Express shipping (1-2 days)
- `instant` - Same day delivery
- `pickup` - Store pickup

### Payment Methods
- `bank_transfer` - Bank transfer
- `credit_card` - Credit card
- `e_wallet` - E-wallet (GoPay, OVO, etc.)
- `cod` - Cash on delivery

---

## SDK and Code Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

class ARCClient {
  constructor(baseURL, accessToken) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getProducts(params = {}) {
    const response = await this.client.get('/products', { params });
    return response.data;
  }

  async addToCart(productId, sku, quantity) {
    const response = await this.client.post('/cart/add', {
      productId,
      sku,
      quantity
    });
    return response.data;
  }

  async checkout(orderData) {
    const response = await this.client.post('/orders/checkout', orderData);
    return response.data;
  }
}

// Usage
const client = new ARCClient('http://localhost:3000/api', 'your_access_token');
const products = await client.getProducts({ category: 'tops', limit: 10 });
```

### cURL Examples

```bash
# Get products with filtering
curl -X GET "http://localhost:3000/api/products?category=tops&limit=10" \
  -H "Content-Type: application/json"

# Add item to cart
curl -X POST "http://localhost:3000/api/cart/add" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product_id",
    "sku": "ARC-TOP-S-WHT-001",
    "quantity": 2
  }'

# Create order
curl -X POST "http://localhost:3000/api/orders/checkout" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "recipientName": "John Doe",
      "phone": "+6281234567890",
      "street": "Jl. Sudirman No. 123",
      "city": "Jakarta",
      "state": "DKI Jakarta",
      "postalCode": "12345",
      "country": "Indonesia"
    },
    "shippingMethod": "standard",
    "paymentMethod": "bank_transfer"
  }'
```

---

**Need help?** Check out our [Getting Started Guide](./GETTING_STARTED.md) or [Troubleshooting Guide](./TROUBLESHOOTING.md).