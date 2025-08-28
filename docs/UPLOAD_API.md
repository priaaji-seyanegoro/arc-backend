# File Upload API Documentation

## Overview
Sistem upload file untuk mengelola gambar produk dan kategori dengan dukungan MinIO storage, optimisasi gambar menggunakan Sharp, dan thumbnail generation.

## Features
- Upload gambar produk (single/multiple)
- Upload gambar kategori
- Optimisasi gambar otomatis (resize, compress, format conversion)
- Thumbnail generation
- File management (delete, info)
- Validasi file (type, size)
- Integration dengan product management

## Configuration

### Environment Variables
```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=arc-storage

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

## API Endpoints

### Upload Product Images

#### Upload Single Product Image
```http
POST /api/upload/products/single
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- image: File (required)
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image": {
      "filename": "product_1234567890.webp",
      "url": "http://localhost:9000/products/product_1234567890.webp",
      "thumbnailUrl": "http://localhost:9000/products/thumb_product_1234567890.webp",
      "size": 245760
    }
  }
}
```

#### Upload Multiple Product Images
```http
POST /api/upload/products/multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- images: File[] (required, max 10 files)
```

**Response:**
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

```http
POST /api/upload/categories/single
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- image: File (required)
```

**Response:**
```json
{
  "success": true,
  "message": "Category image uploaded successfully",
  "data": {
    "image": {
      "filename": "category_1234567890.webp",
      "url": "http://localhost:9000/categories/category_1234567890.webp",
      "thumbnailUrl": "http://localhost:9000/categories/thumb_category_1234567890.webp",
      "size": 180240
    }
  }
}
```

### File Management

#### Delete File
```http
DELETE /api/upload/:bucket/:filename
Authorization: Bearer <token>
```

**Parameters:**
- `bucket`: Bucket name (products, categories, users)
- `filename`: File name to delete

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### Get File Info
```http
GET /api/upload/:bucket/:filename/info
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "File info retrieved successfully",
  "data": {
    "filename": "product_1234567890.webp",
    "url": "http://localhost:9000/products/product_1234567890.webp",
    "size": 245760,
    "lastModified": "2024-01-01T00:00:00.000Z",
    "etag": "d41d8cd98f00b204e9800998ecf8427e"
  }
}
```

## Product Image Management

### Add Images to Product
```http
POST /api/products/:id/images
Content-Type: application/json
Authorization: Bearer <token>

{
  "images": [
    "http://localhost:9000/products/product_1234567890.webp",
    "http://localhost:9000/products/product_1234567891.webp"
  ]
}
```

### Remove Image from Product
```http
DELETE /api/products/:id/images
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageUrl": "http://localhost:9000/products/product_1234567890.webp"
}
```

### Update Product Image Order
```http
PUT /api/products/:id/images/order
Content-Type: application/json
Authorization: Bearer <token>

{
  "images": [
    "http://localhost:9000/products/product_1234567891.webp",
    "http://localhost:9000/products/product_1234567890.webp"
  ]
}
```

## SKU Image Management

### Add Images to SKU
```http
POST /api/products/:id/skus/:skuId/images
Content-Type: application/json
Authorization: Bearer <token>

{
  "images": [
    "http://localhost:9000/products/sku_1234567890.webp"
  ]
}
```

### Remove Image from SKU
```http
DELETE /api/products/:id/skus/:skuId/images
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageUrl": "http://localhost:9000/products/sku_1234567890.webp"
}
```

## Image Processing

### Product Images
- **Resolution**: 1200x1200px
- **Format**: WebP
- **Quality**: 85%
- **Thumbnail**: 300x300px

### Category Images
- **Resolution**: 800x600px
- **Format**: WebP
- **Quality**: 85%
- **Thumbnail**: 200x150px

## File Validation

### Allowed File Types
- image/jpeg
- image/png
- image/webp

### File Size Limits
- Maximum file size: 5MB
- Maximum files per upload: 10 (for multiple upload)

## Error Handling

### Common Error Responses

#### File Too Large
```json
{
  "success": false,
  "message": "File too large",
  "error": "Maximum file size is 5MB"
}
```

#### Invalid File Type
```json
{
  "success": false,
  "message": "Invalid file type",
  "error": "Only JPEG, PNG, and WebP images are allowed"
}
```

#### No File Uploaded
```json
{
  "success": false,
  "message": "No file uploaded",
  "error": "Please select a file to upload"
}
```

#### Storage Error
```json
{
  "success": false,
  "message": "Failed to upload file",
  "error": "Storage service unavailable"
}
```

## Usage Examples

### Upload and Add to Product (Complete Flow)

1. **Upload images:**
```bash
curl -X POST \
  http://localhost:3000/api/upload/products/multiple \
  -H 'Authorization: Bearer <token>' \
  -F 'images=@image1.jpg' \
  -F 'images=@image2.jpg'
```

2. **Add uploaded images to product:**
```bash
curl -X POST \
  http://localhost:3000/api/products/64a1b2c3d4e5f6789012345/images \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "images": [
      "http://localhost:9000/products/product_1234567890.webp",
      "http://localhost:9000/products/product_1234567891.webp"
    ]
  }'
```

### JavaScript/TypeScript Example

```typescript
// Upload multiple images
const uploadImages = async (files: FileList) => {
  const formData = new FormData();
  
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  
  const response = await fetch('/api/upload/products/multiple', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  return result.data.images;
};

// Add images to product
const addImagesToProduct = async (productId: string, imageUrls: string[]) => {
  const response = await fetch(`/api/products/${productId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ images: imageUrls })
  });
  
  return response.json();
};
```

## Setup Requirements

### MinIO Server
1. Install MinIO server
2. Start MinIO with default credentials
3. Create required buckets (handled automatically by the service)

### Dependencies
- multer: File upload handling
- sharp: Image processing
- minio: MinIO client
- express-validator: Input validation

## Security Considerations

1. **Authentication**: All upload endpoints require valid JWT token
2. **File Validation**: Strict file type and size validation
3. **Sanitization**: Filename sanitization to prevent path traversal
4. **Rate Limiting**: Consider implementing rate limiting for upload endpoints
5. **Virus Scanning**: Consider adding virus scanning for uploaded files

## Performance Optimization

1. **Image Compression**: Automatic compression with WebP format
2. **Thumbnail Generation**: Pre-generated thumbnails for faster loading
3. **Async Processing**: Non-blocking image processing
4. **CDN Integration**: Consider CDN for better performance (future enhancement)

## Monitoring and Logging

- All upload operations are logged with Winston
- Error tracking for failed uploads
- File operation metrics
- Storage usage monitoring