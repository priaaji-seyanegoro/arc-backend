import { Client as MinioClient } from 'minio';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import path from 'path';

// MinIO client configuration
const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Bucket names
const BUCKETS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  USERS: 'users'
};

// Initialize buckets
const initializeBuckets = async () => {
  try {
    for (const bucketName of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName);
        logger.info(`Created MinIO bucket: ${bucketName}`);
        
        // Set bucket policy to allow public read access
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`]
            }
          ]
        };
        
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        logger.info(`Set public read policy for bucket: ${bucketName}`);
      }
    }
  } catch (error) {
    logger.error('Failed to initialize MinIO buckets:', error);
  }
};

// Initialize buckets on startup
initializeBuckets();

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

interface UploadResult {
  filename: string;
  url: string;
  size: number;
  thumbnailFilename?: string;
  thumbnailUrl?: string;
}

export class FileService {
  /**
   * Upload and process image to MinIO
   */
  static async uploadImage(
    buffer: Buffer,
    originalName: string,
    bucket: keyof typeof BUCKETS,
    options: ImageProcessingOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        width = 1200,
        height,
        quality = 85,
        format = 'webp',
        generateThumbnail = true,
        thumbnailWidth = 300,
        thumbnailHeight = 300
      } = options;

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = format;
      const filename = `${timestamp}-${randomString}.${fileExtension}`;
      
      // Process main image
      let processedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality })
        .toBuffer();

      // Upload main image
      const bucketName = BUCKETS[bucket];
      await minioClient.putObject(
        bucketName,
        filename,
        processedBuffer,
        processedBuffer.length,
        {
          'Content-Type': `image/${format}`,
          'Cache-Control': 'max-age=31536000' // 1 year cache
        }
      );

      const url = await this.getFileUrl(bucketName, filename);
      
      const result: UploadResult = {
        filename,
        url,
        size: processedBuffer.length
      };

      // Generate and upload thumbnail if requested
      if (generateThumbnail) {
        const thumbnailBuffer = await sharp(buffer)
          .resize(thumbnailWidth, thumbnailHeight, {
            fit: 'cover',
            position: 'center'
          })
          .toFormat(format, { quality: 80 })
          .toBuffer();

        const thumbnailFilename = `thumb_${filename}`;
        
        await minioClient.putObject(
          bucketName,
          thumbnailFilename,
          thumbnailBuffer,
          thumbnailBuffer.length,
          {
            'Content-Type': `image/${format}`,
            'Cache-Control': 'max-age=31536000'
          }
        );

        result.thumbnailFilename = thumbnailFilename;
        result.thumbnailUrl = await this.getFileUrl(bucketName, thumbnailFilename);
      }

      logger.info(`Image uploaded successfully: ${filename}`);
      return result;
    } catch (error) {
      logger.error('Failed to upload image:', error);
      throw new Error('Image upload failed');
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: { buffer: Buffer; originalName: string }[],
    bucket: keyof typeof BUCKETS,
    options: ImageProcessingOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadImage(
        file.buffer,
        file.originalName,
        bucket,
        options
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * Delete file from MinIO
   */
  static async deleteFile(bucket: keyof typeof BUCKETS, filename: string): Promise<void> {
    try {
      const bucketName = BUCKETS[bucket];
      await minioClient.removeObject(bucketName, filename);
      logger.info(`File deleted: ${filename}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filename}`, error);
      throw new Error('File deletion failed');
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteMultipleFiles(
    bucket: keyof typeof BUCKETS,
    filenames: string[]
  ): Promise<void> {
    try {
      const bucketName = BUCKETS[bucket];
      const objectsList = filenames.map(filename => ({ name: filename }));
      await minioClient.removeObjects(bucketName, objectsList);
      logger.info(`Multiple files deleted: ${filenames.join(', ')}`);
    } catch (error) {
      logger.error('Failed to delete multiple files:', error);
      throw new Error('Multiple file deletion failed');
    }
  }

  /**
   * Get file URL
   */
  static async getFileUrl(bucket: string, filename: string): Promise<string> {
    try {
      // For public buckets, we can construct the URL directly
      const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const port = process.env.MINIO_PORT || '9000';
      const useSSL = process.env.MINIO_USE_SSL === 'true';
      const protocol = useSSL ? 'https' : 'http';
      
      return `${protocol}://${endpoint}:${port}/${bucket}/${filename}`;
    } catch (error) {
      logger.error('Failed to get file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(bucket: keyof typeof BUCKETS, filename: string): Promise<boolean> {
    try {
      const bucketName = BUCKETS[bucket];
      await minioClient.statObject(bucketName, filename);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(bucket: keyof typeof BUCKETS, filename: string) {
    try {
      const bucketName = BUCKETS[bucket];
      const stat = await minioClient.statObject(bucketName, filename);
      return {
        size: stat.size,
        lastModified: stat.lastModified,
        contentType: stat.metaData?.['content-type']
      };
    } catch (error) {
      logger.error('Failed to get file info:', error);
      throw new Error('Failed to get file info');
    }
  }
}

export { BUCKETS };
export default FileService;