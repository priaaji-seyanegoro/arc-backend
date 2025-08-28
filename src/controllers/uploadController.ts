import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { logger } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
  file?: Express.Multer.File;
}

export class UploadController {
  /**
   * Upload single product image
   */
  static async uploadProductImage(req: MulterRequest, res: Response): Promise<Response> {
    try {
      const file = req.file;
      
      if (!file) {
        return sendError(res, 'No file uploaded', undefined, 400);
      }

      const result = await FileService.uploadImage(
        file.buffer,
        file.originalname,
        'PRODUCTS',
        {
          width: 1200,
          height: 1200,
          quality: 85,
          format: 'webp',
          generateThumbnail: true,
          thumbnailWidth: 300,
          thumbnailHeight: 300
        }
      );

      logger.info(`Product image uploaded: ${result.filename}`);
      
      return sendSuccess(res, 'Image uploaded successfully', {
        image: {
          filename: result.filename,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          size: result.size
        }
      });
    } catch (error) {
      logger.error('Product image upload error:', error);
      return sendError(
        res,
        'Failed to upload image',
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }

  /**
   * Upload multiple product images
   */
  static async uploadProductImages(req: MulterRequest, res: Response): Promise<Response> {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return sendError(res, 'No files uploaded', undefined, 400);
      }

      if (files.length > 10) {
        return sendError(res, 'Maximum 10 images allowed', undefined, 400);
      }

      const fileData = files.map(file => ({
        buffer: file.buffer,
        originalName: file.originalname
      }));

      const results = await FileService.uploadMultipleImages(
        fileData,
        'PRODUCTS',
        {
          width: 1200,
          height: 1200,
          quality: 85,
          format: 'webp',
          generateThumbnail: true,
          thumbnailWidth: 300,
          thumbnailHeight: 300
        }
      );

      const images = results.map(result => ({
        filename: result.filename,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        size: result.size
      }));

      logger.info(`${images.length} product images uploaded`);
      
      return sendSuccess(res, 'Images uploaded successfully', {
        images,
        count: images.length
      });
    } catch (error) {
      logger.error('Product images upload error:', error);
      return sendError(
        res,
        'Failed to upload images',
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }

  /**
   * Upload category image
   */
  static async uploadCategoryImage(req: MulterRequest, res: Response): Promise<Response> {
    try {
      const file = req.file;
      
      if (!file) {
        return sendError(res, 'No file uploaded', undefined, 400);
      }

      const result = await FileService.uploadImage(
        file.buffer,
        file.originalname,
        'CATEGORIES',
        {
          width: 800,
          height: 600,
          quality: 85,
          format: 'webp',
          generateThumbnail: true,
          thumbnailWidth: 200,
          thumbnailHeight: 150
        }
      );

      logger.info(`Category image uploaded: ${result.filename}`);
      
      return sendSuccess(res, 'Category image uploaded successfully', {
        image: {
          filename: result.filename,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          size: result.size
        }
      });
    } catch (error) {
      logger.error('Category image upload error:', error);
      return sendError(
        res,
        'Failed to upload category image',
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }

  /**
   * Delete uploaded file
   */
  static async deleteFile(req: Request, res: Response) {
    try {
      const { bucket, filename } = req.params;
      
      if (!bucket || !filename) {
        return sendError(res, 'Bucket and filename are required', undefined, 400);
      }

      // Validate bucket
      const validBuckets = ['PRODUCTS', 'CATEGORIES', 'USERS'];
      if (!validBuckets.includes(bucket.toUpperCase())) {
        return sendError(res, 'Invalid bucket name', undefined, 400);
      }

      await FileService.deleteFile(bucket.toUpperCase() as any, filename);
      
      // Also delete thumbnail if exists
      const thumbnailFilename = `thumb_${filename}`;
      try {
        await FileService.deleteFile(bucket.toUpperCase() as any, thumbnailFilename);
      } catch (error) {
        // Thumbnail might not exist, ignore error
        logger.info(`Thumbnail not found or already deleted: ${thumbnailFilename}`);
      }

      logger.info(`File deleted: ${filename}`);
      
      return sendSuccess(res, 'File deleted successfully');
    } catch (error) {
      logger.error('File deletion error:', error);
      return sendError(
        res,
        'Failed to delete file',
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(req: Request, res: Response) {
    try {
      const { bucket, filename } = req.params;
      
      if (!bucket || !filename) {
        return sendError(res, 'Bucket and filename are required', undefined, 400);
      }

      // Validate bucket
      const validBuckets = ['PRODUCTS', 'CATEGORIES', 'USERS'];
      if (!validBuckets.includes(bucket.toUpperCase())) {
        return sendError(res, 'Invalid bucket name', undefined, 400);
      }

      const fileExists = await FileService.fileExists(bucket.toUpperCase() as any, filename);
      
      if (!fileExists) {
        return sendError(res, 'File not found', undefined, 404);
      }

      const fileInfo = await FileService.getFileInfo(bucket.toUpperCase() as any, filename);
      const fileUrl = await FileService.getFileUrl(bucket.toLowerCase(), filename);
      
      return sendSuccess(res, 'File info retrieved successfully', {
        filename,
        url: fileUrl,
        ...fileInfo
      });
    } catch (error) {
      logger.error('Get file info error:', error);
      return sendError(
        res,
        'Failed to get file info',
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }
}

export default UploadController;