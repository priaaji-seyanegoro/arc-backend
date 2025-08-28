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

## 🚀 API Endpoints

### 🔐 Authentication Routes

#### Register User

```http
POST /api/auth/register
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
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123!"
}
```

#### Verify Email

```http
GET /api/auth/verify-email/:token
```

#### Request Password Reset

```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

#### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "newPassword123!",
  "confirmPassword": "newPassword123!"
}
```

#### Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### 🔒 Protected Routes (Require Authentication)

#### Get User Profile

```http
GET /api/auth/profile
Authorization: Bearer <access_token>
```

#### Update User Profile

```http
PUT /api/auth/profile
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
PUT /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword123!"
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### Send Verification Email

```http
POST /api/auth/send-verification
Authorization: Bearer <access_token>
```

### 🛍️ Product Routes

#### Get All Products

```http
GET /api/products
GET /api/products?page=1&limit=10&category=tops&minPrice=100000&maxPrice=500000&search=shirt
```

#### Get Product by Slug

```http
GET /api/products/:slug
```

#### Create Product (Admin)

```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Oversized Cotton T-Shirt",
  "description": "Comfortable oversized cotton t-shirt",
  "category": "category_id",
  "basePrice": 299000,
  "images": ["image1.jpg", "image2.jpg"],
  "skus": [
    {
      "sku": "ARC-TOP-S-WHT-001",
      "size": "S",
      "color": "White",
      "price": 299000,
      "stock": 50,
      "weight": 190
    }
  ]
}
```

#### Update Product (Admin)

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
```

#### Delete Product (Admin)

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

### 📂 Category Routes

#### Get All Categories

```http
GET /api/categories
```

#### Get Category by Slug

```http
GET /api/categories/:slug
```

#### Create Category (Admin)

```http
POST /api/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Tops",
  "description": "T-shirts, shirts, and tops",
  "image": "tops-category.jpg"
}
```

### 🛒 Cart Routes

#### Get User Cart

```http
GET /api/cart
Authorization: Bearer <access_token>
```

#### Add Item to Cart

```http
POST /api/cart/add
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "product_id",
  "sku": "ARC-TOP-S-WHT-001",
  "quantity": 2
}
```

#### Update Cart Item

```http
PUT /api/cart/item/:itemId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart

```http
DELETE /api/cart/item/:itemId
Authorization: Bearer <access_token>
```

#### Clear Cart

```http
DELETE /api/cart/clear
Authorization: Bearer <access_token>
```

### 📦 Order Routes

#### Checkout (Create Order)

```http
POST /api/orders/checkout
Authorization: Bearer <access_token>
Content-Type: application/json

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

#### Get User Orders

```http
GET /api/orders/my-orders
GET /api/orders/my-orders?status=pending&page=1&limit=10
Authorization: Bearer <access_token>
```

#### Get Order by ID

```http
GET /api/orders/:orderId
Authorization: Bearer <access_token>
```

#### Cancel Order

```http
PATCH /api/orders/:orderId/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cancelReason": "Changed my mind"
}
```

### 👨‍💼 Admin Order Routes

#### Get All Orders (Admin)

```http
GET /api/orders
GET /api/orders?status=pending&paymentStatus=paid&search=John
Authorization: Bearer <admin_token>
```

#### Update Order Status (Admin)

```http
PATCH /api/orders/:orderId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "JNE123456789"
}
```

#### Update Payment Status (Admin)

```http
PATCH /api/orders/:orderId/payment
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentId": "midtrans_transaction_id"
}
```

#### Get Order Statistics (Admin)

```http
GET /api/orders/admin/stats
Authorization: Bearer <admin_token>
```

## 🧪 Testing with cURL

### Authentication Examples

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123!",
    "confirmPassword": "password123!"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123!"
  }'
```

### Cart Examples

```bash
# Add to cart
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": "689075e47bb05ac66160a8ca",
    "sku": "ARC-TOP-S-WHT-001",
    "quantity": 2
  }'

# Get cart
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Order Examples

```bash
# Checkout
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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

# Get orders with filter
curl -X GET "http://localhost:3000/api/orders/my-orders?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Cancel order
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"cancelReason": "Changed my mind"}'
```

## 📊 Available Status Values

### Order Status
- `pending` - Pesanan baru
- `confirmed` - Pesanan dikonfirmasi
- `processing` - Sedang diproses
- `shipped` - Sudah dikirim
- `delivered` - Sudah diterima
- `cancelled` - Dibatalkan
- `returned` - Dikembalikan

### Payment Status
- `pending` - Menunggu pembayaran
- `paid` - Sudah dibayar
- `failed` - Pembayaran gagal
- `refunded` - Sudah direfund

### Shipping Methods
- `regular` - Reguler (15k base cost)
- `express` - Express (25k base cost)
- `same_day` - Same Day (50k base cost)

### Payment Methods
- `midtrans` - Midtrans payment gateway
- `bank_transfer` - Bank transfer
- `cod` - Cash on delivery

## ⚙️ Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Database Connection Optimization
DB_SERVER_SELECTION_TIMEOUT=5000
DB_SOCKET_TIMEOUT=45000
DB_CONNECT_TIMEOUT=10000
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5
DB_MAX_IDLE_TIME=30000
DB_HEARTBEAT_FREQUENCY=10000
DB_RETRY_ATTEMPTS=5

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

## 🔧 Database Connection Optimization

### Masalah Koneksi Database

Jika Anda mengalami error seperti:
```
MongooseError: Operation `users.findOne()` buffering timed out after 10000ms
```

### Solusi yang Telah Diimplementasikan

1. **Connection Pooling Optimization**
   - `maxPoolSize`: Maksimum 10 koneksi simultan
   - `minPoolSize`: Minimum 5 koneksi yang selalu tersedia
   - `maxIdleTimeMS`: Tutup koneksi idle setelah 30 detik

2. **Timeout Configuration**
   - `serverSelectionTimeoutMS`: 5 detik untuk memilih server
   - `socketTimeoutMS`: 45 detik untuk operasi socket
   - `connectTimeoutMS`: 10 detik untuk koneksi awal

3. **Retry Logic**
   - Automatic retry dengan exponential backoff
   - Maksimum 5 percobaan koneksi
   - Delay yang meningkat: 1s, 2s, 4s, 8s, 10s

4. **Connection Monitoring**
   - Real-time monitoring koneksi database
   - Automatic reconnection saat koneksi terputus
   - Graceful shutdown handling

5. **Buffer Management**
   - Disabled mongoose buffering untuk menghindari timeout
   - Immediate error response saat koneksi bermasalah

### Konfigurasi Database Variables

| Variable | Default | Deskripsi |
|----------|---------|----------|
| `DB_SERVER_SELECTION_TIMEOUT` | 5000 | Timeout untuk memilih server MongoDB (ms) |
| `DB_SOCKET_TIMEOUT` | 45000 | Timeout untuk operasi socket (ms) |
| `DB_CONNECT_TIMEOUT` | 10000 | Timeout untuk koneksi awal (ms) |
| `DB_MAX_POOL_SIZE` | 10 | Maksimum koneksi dalam pool |
| `DB_MIN_POOL_SIZE` | 5 | Minimum koneksi dalam pool |
| `DB_MAX_IDLE_TIME` | 30000 | Waktu idle maksimum sebelum koneksi ditutup (ms) |
| `DB_HEARTBEAT_FREQUENCY` | 10000 | Frekuensi heartbeat untuk monitoring (ms) |
| `DB_RETRY_ATTEMPTS` | 5 | Jumlah percobaan retry koneksi |

### Troubleshooting

1. **Jika masih mengalami timeout:**
   - Periksa koneksi internet
   - Pastikan MongoDB Atlas cluster aktif
   - Verifikasi IP address sudah di-whitelist
   - Cek kredensial database

2. **Untuk development lokal:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/arc-backend
   ```

3. **Untuk production:**
   - Gunakan connection string dengan SSL
   - Set `DB_MAX_POOL_SIZE` sesuai kapasitas server
   - Monitor connection metrics

### Monitoring Koneksi

Server akan menampilkan log berikut:
- ✅ `MongoDB connected successfully` - Koneksi berhasil
- ⚠️ `MongoDB disconnected. Attempting to reconnect...` - Koneksi terputus
- ❌ `MongoDB connection error` - Error koneksi
- 🔄 `Retrying MongoDB connection in Xms...` - Sedang retry

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `yarn install`
3. Set up environment variables in `.env`
4. Start the server: `yarn run dev`
5. Server will run on `http://localhost:3000`

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
