# 📁 Upload API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [File Requirements](#file-requirements)
- [Rate Limiting](#rate-limiting)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
  - [Product Image Upload](#product-image-upload)
  - [Category Image Upload](#category-image-upload)
  - [File Management](#file-management)
  - [Product SKU Images](#product-sku-images)
- [Integration Examples](#integration-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Upload API provides secure file upload functionality for the ARC e-commerce platform. It supports image uploads for products, categories, and SKUs with automatic optimization, thumbnail generation, and cloud storage integration.

**Key Features:**
- ✅ Multiple file format support (JPEG, PNG, WebP)
- ✅ Automatic image optimization and compression
- ✅ Thumbnail generation
- ✅ Cloud storage with MinIO
- ✅ File validation and security checks
- ✅ Rate limiting and abuse prevention
- ✅ Batch upload support
- ✅ File management operations

**Base URL**: `http://localhost:3000/api/upload`

## Authentication

All upload endpoints require admin authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <admin_access_token>
```

**Required Role**: `admin`

## File Requirements

### Supported Formats
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)

### File Constraints
- **Maximum file size**: 5MB per file
- **Maximum files per request**: 10 files
- **Minimum dimensions**: 100x100 pixels
- **Maximum dimensions**: 4000x4000 pixels
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### Automatic Processing
- **Compression**: Images are automatically compressed for optimal web delivery
- **Format conversion**: All images are converted to WebP for better performance
- **Thumbnail generation**: 300x300px thumbnails are created automatically
- **Filename sanitization**: Filenames are sanitized and timestamped

## Rate Limiting

Upload endpoints have specific rate limits to prevent abuse:

- **Single file uploads**: 20 requests per 15 minutes per user
- **Multiple file uploads**: 10 requests per 15 minutes per user
- **File deletion**: 30 requests per 15 minutes per user

Rate limit headers:
```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 18
X-RateLimit-Reset: 1640995200
```

## Environment Configuration

Configure these environment variables in your `.env` file:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_PRODUCTS=products
MINIO_BUCKET_CATEGORIES=categories

# Upload Configuration
UPLOAD_MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_MAX_FILES=10
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp

# Image Processing
IMAGE_QUALITY=80
THUMBNAIL_SIZE=300
MAX_IMAGE_WIDTH=2000
MAX_IMAGE_HEIGHT=2000
```

---

# API Endpoints

## Product Image Upload

### Upload Single Product Image

Upload a single image for a product.

```http
POST /api/upload/products/single
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
```

**Form Data:**
- `image` (File, required): Image file to upload

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/upload/products/single" \
  -H "Authorization: Bearer your_admin_token" \
  -F "image=@/path/to/product-image.jpg"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image": {
      "filename": "product_1704067200123.webp",
      "originalName": "product-image.jpg",
      "url": "http://localhost:9000/products/product_1704067200123.webp",
      "thumbnailUrl": "http://localhost:9000/products/thumb_product_1704067200123.webp",
      "size": 245760,
      "dimensions": {
        "width": 800,
        "height": 600
      },
      "mimeType": "image/webp",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Upload Multiple Product Images

Upload multiple images for a product in a single request.

```http
POST /api/upload/products/multiple
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
```

**Form Data:**
- `images` (File[], required): Array of image files (max 10)

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/upload/products/multiple" \
  -H "Authorization: Bearer your_admin_token" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.png"
```

**Response (200):**
```json
{
  "success": true,
  "message": "3 images uploaded successfully",
  "data": {
    "images": [
      {
        "filename": "product_1704067200123.webp",
        "originalName": "image1.jpg",
        "url": "http://localhost:9000/products/product_1704067200123.webp",
        "thumbnailUrl": "http://localhost:9000/products/thumb_product_1704067200123.webp",
        "size": 245760,
        "dimensions": {
          "width": 800,
          "height": 600
        },
        "mimeType": "image/webp"
      },
      {
        "filename": "product_1704067200124.webp",
        "originalName": "image2.jpg",
        "url": "http://localhost:9000/products/product_1704067200124.webp",
        "thumbnailUrl": "http://localhost:9000/products/thumb_product_1704067200124.webp",
        "size": 198432,
        "dimensions": {
          "width": 1200,
          "height": 800
        },
        "mimeType": "image/webp"
      }
    ],
    "count": 3,
    "totalSize": 687104,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Category Image Upload

### Upload Category Image

Upload an image for a product category.

```http
POST /api/upload/categories/single
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
```

**Form Data:**
- `image` (File, required): Category image file

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/upload/categories/single" \
  -H "Authorization: Bearer your_admin_token" \
  -F "image=@/path/to/category-image.jpg"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category image uploaded successfully",
  "data": {
    "image": {
      "filename": "category_1704067200125.webp",
      "originalName": "category-image.jpg",
      "url": "http://localhost:9000/categories/category_1704067200125.webp",
      "thumbnailUrl": "http://localhost:9000/categories/thumb_category_1704067200125.webp",
      "size": 156789,
      "dimensions": {
        "width": 600,
        "height": 400
      },
      "mimeType": "image/webp",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## File Management

### Get File Information

Retrieve information about an uploaded file.

```http
GET /api/upload/:bucket/:filename/info
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `bucket` (string): Storage bucket name (products, categories)
- `filename` (string): File name

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/upload/products/product_1704067200123.webp/info" \
  -H "Authorization: Bearer your_admin_token"
```

**Response (200):**
```json
{
  "success": true,
  "message": "File information retrieved successfully",
  "data": {
    "file": {
      "filename": "product_1704067200123.webp",
      "bucket": "products",
      "url": "http://localhost:9000/products/product_1704067200123.webp",
      "thumbnailUrl": "http://localhost:9000/products/thumb_product_1704067200123.webp",
      "size": 245760,
      "lastModified": "2024-01-01T00:00:00.000Z",
      "contentType": "image/webp",
      "etag": "d41d8cd98f00b204e9800998ecf8427e"
    }
  }
}
```

### Delete File

Delete an uploaded file from storage.

```http
DELETE /api/upload/:bucket/:filename
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `bucket` (string): Storage bucket name (products, categories)
- `filename` (string): File name to delete

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/upload/products/product_1704067200123.webp" \
  -H "Authorization: Bearer your_admin_token"
```

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "filename": "product_1704067200123.webp",
    "bucket": "products",
    "deletedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Product SKU Images

### Upload SKU-specific Images

Upload images for specific product SKUs (size/color variants).

```http
POST /api/upload/products/:productId/sku/:skuId/images
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `productId` (string): Product ID
- `skuId` (string): SKU ID

**Form Data:**
- `images` (File[], required): SKU-specific images

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/upload/products/prod123/sku/sku456/images" \
  -H "Authorization: Bearer your_admin_token" \
  -F "images=@/path/to/sku-image1.jpg" \
  -F "images=@/path/to/sku-image2.jpg"
```

### Get Product Images

Retrieve all images associated with a product.

```http
GET /api/upload/products/:productId/images
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product images retrieved successfully",
  "data": {
    "productId": "prod123",
    "images": {
      "main": [
        {
          "filename": "product_1704067200123.webp",
          "url": "http://localhost:9000/products/product_1704067200123.webp",
          "thumbnailUrl": "http://localhost:9000/products/thumb_product_1704067200123.webp",
          "size": 245760
        }
      ],
      "skus": {
        "sku456": [
          {
            "filename": "sku_1704067200124.webp",
            "url": "http://localhost:9000/products/sku_1704067200124.webp",
            "thumbnailUrl": "http://localhost:9000/products/thumb_sku_1704067200124.webp",
            "size": 198432
          }
        ]
      }
    },
    "totalImages": 2,
    "totalSize": 444192
  }
}
```

---

# Integration Examples

## Frontend Integration

### React.js Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setFiles(validFiles);
  };

  const uploadImages = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post(
        '/api/upload/products/multiple',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      );

      onUploadSuccess(response.data.data.images);
      setFiles([]);
      setProgress(0);
    } catch (error) {
      console.error('Upload failed:', error.response?.data || error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      {files.length > 0 && (
        <div className="file-preview">
          <h4>Selected Files ({files.length}):</h4>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span>{file.name}</span>
              <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={uploadImages} 
        disabled={uploading || files.length === 0}
      >
        {uploading ? `Uploading... ${progress}%` : 'Upload Images'}
      </button>
      
      {uploading && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
```

### Vue.js Example

```vue
<template>
  <div class="image-upload">
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      @change="handleFileSelect"
      :disabled="uploading"
    />
    
    <div v-if="selectedFiles.length > 0" class="file-preview">
      <h4>Selected Files ({{ selectedFiles.length }}):</h4>
      <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
        <span>{{ file.name }}</span>
        <span>({{ (file.size / 1024 / 1024).toFixed(2) }} MB)</span>
      </div>
    </div>
    
    <button 
      @click="uploadImages" 
      :disabled="uploading || selectedFiles.length === 0"
    >
      {{ uploading ? `Uploading... ${progress}%` : 'Upload Images' }}
    </button>
    
    <div v-if="uploading" class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ImageUpload',
  data() {
    return {
      selectedFiles: [],
      uploading: false,
      progress: 0
    };
  },
  methods: {
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      
      this.selectedFiles = files.filter(file => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024;
        return isValidType && isValidSize;
      });
    },
    
    async uploadImages() {
      if (this.selectedFiles.length === 0) return;
      
      this.uploading = true;
      const formData = new FormData();
      
      this.selectedFiles.forEach(file => {
        formData.append('images', file);
      });
      
      try {
        const response = await axios.post(
          '/api/upload/products/multiple',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${this.$store.state.auth.adminToken}`
            },
            onUploadProgress: (progressEvent) => {
              this.progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
            }
          }
        );
        
        this.$emit('upload-success', response.data.data.images);
        this.selectedFiles = [];
        this.progress = 0;
        this.$refs.fileInput.value = '';
      } catch (error) {
        console.error('Upload failed:', error.response?.data || error.message);
        this.$emit('upload-error', error);
      } finally {
        this.uploading = false;
      }
    }
  }
};
</script>
```

## Backend Integration

### Node.js/Express Example

```javascript
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload product images via proxy
router.post('/products/:productId/images', upload.array('images', 10), async (req, res) => {
  try {
    const { productId } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }
    
    // Create form data for ARC API
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });
    
    // Forward to ARC Upload API
    const response = await axios.post(
      'http://localhost:3000/api/upload/products/multiple',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': req.headers.authorization
        }
      }
    );
    
    // Update product with new image URLs
    const imageUrls = response.data.data.images.map(img => img.url);
    await updateProductImages(productId, imageUrls);
    
    res.json({
      success: true,
      message: 'Images uploaded and product updated successfully',
      data: response.data.data
    });
  } catch (error) {
    console.error('Upload proxy error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

async function updateProductImages(productId, imageUrls) {
  // Implementation to update product with new image URLs
  // This would typically involve updating your database
}

module.exports = router;
```

---

# Error Handling

## Common Error Responses

### File Too Large (413)
```json
{
  "success": false,
  "message": "File too large",
  "error": {
    "code": "FILE_TOO_LARGE",
    "details": "File size exceeds 5MB limit",
    "maxSize": 5242880
  }
}
```

### Invalid File Type (400)
```json
{
  "success": false,
  "message": "Invalid file type",
  "error": {
    "code": "INVALID_FILE_TYPE",
    "details": "Only JPEG, PNG, and WebP files are allowed",
    "allowedTypes": ["image/jpeg", "image/png", "image/webp"]
  }
}
```

### Too Many Files (400)
```json
{
  "success": false,
  "message": "Too many files",
  "error": {
    "code": "TOO_MANY_FILES",
    "details": "Maximum 10 files allowed per request",
    "maxFiles": 10,
    "receivedFiles": 15
  }
}
```

### Storage Error (500)
```json
{
  "success": false,
  "message": "Storage error",
  "error": {
    "code": "STORAGE_ERROR",
    "details": "Failed to upload file to storage"
  }
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "details": "Admin access token required for file uploads"
  }
}
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "details": "Too many upload requests. Please try again later.",
    "retryAfter": 900
  }
}
```

---

# Best Practices

## File Optimization

1. **Pre-upload Validation**
   ```javascript
   function validateFile(file) {
     const maxSize = 5 * 1024 * 1024; // 5MB
     const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
     
     if (file.size > maxSize) {
       throw new Error('File too large');
     }
     
     if (!allowedTypes.includes(file.type)) {
       throw new Error('Invalid file type');
     }
     
     return true;
   }
   ```

2. **Image Compression**
   ```javascript
   function compressImage(file, quality = 0.8) {
     return new Promise((resolve) => {
       const canvas = document.createElement('canvas');
       const ctx = canvas.getContext('2d');
       const img = new Image();
       
       img.onload = () => {
         canvas.width = img.width;
         canvas.height = img.height;
         ctx.drawImage(img, 0, 0);
         
         canvas.toBlob(resolve, 'image/webp', quality);
       };
       
       img.src = URL.createObjectURL(file);
     });
   }
   ```

3. **Progress Tracking**
   ```javascript
   const uploadWithProgress = async (files, onProgress) => {
     const formData = new FormData();
     files.forEach(file => formData.append('images', file));
     
     return axios.post('/api/upload/products/multiple', formData, {
       onUploadProgress: (progressEvent) => {
         const progress = Math.round(
           (progressEvent.loaded * 100) / progressEvent.total
         );
         onProgress(progress);
       }
     });
   };
   ```

## Security Considerations

1. **File Type Validation**: Always validate file types on both client and server
2. **Size Limits**: Enforce strict file size limits to prevent abuse
3. **Filename Sanitization**: Sanitize filenames to prevent path traversal attacks
4. **Virus Scanning**: Consider implementing virus scanning for uploaded files
5. **Access Control**: Ensure only authorized users can upload files
6. **Rate Limiting**: Implement rate limiting to prevent abuse

## Performance Optimization

1. **Batch Uploads**: Use multiple file upload for better efficiency
2. **Compression**: Enable automatic image compression
3. **CDN Integration**: Use CDN for faster file delivery
4. **Lazy Loading**: Implement lazy loading for image galleries
5. **Caching**: Cache frequently accessed images

---

# Troubleshooting

## Common Issues

### Upload Fails with "Network Error"
**Cause**: Usually indicates a connection issue or server timeout.

**Solutions**:
- Check network connectivity
- Verify server is running
- Increase request timeout
- Check file size limits

### "Invalid File Type" Error
**Cause**: File type not in allowed list.

**Solutions**:
- Convert file to supported format (JPEG, PNG, WebP)
- Check file extension matches content type
- Verify MIME type detection

### "File Too Large" Error
**Cause**: File exceeds size limit.

**Solutions**:
- Compress image before upload
- Resize image dimensions
- Use image optimization tools
- Check server upload limits

### Upload Succeeds but Images Don't Display
**Cause**: URL generation or storage configuration issue.

**Solutions**:
- Verify MinIO configuration
- Check bucket permissions
- Validate URL generation
- Test direct file access

### Slow Upload Performance
**Cause**: Large files or network issues.

**Solutions**:
- Implement image compression
- Use progressive upload
- Optimize network settings
- Consider chunked uploads

## Debug Mode

Enable debug logging by setting:
```env
DEBUG_UPLOAD=true
LOG_LEVEL=debug
```

This will provide detailed logs for troubleshooting upload issues.

---

**Need more help?** Check out our [API Reference](./API_REFERENCE.md) or [Getting Started Guide](./GETTING_STARTED.md).