import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/products',
    'uploads/categories',
    'uploads/temp'
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  }
};

// Initialize upload directories
ensureUploadDirs();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Image processing utility
export const processImage = async (
  buffer: Buffer,
  filename: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    folder: string;
  }
): Promise<string> => {
  const {
    width = 800,
    height,
    quality = 80,
    format = 'webp',
    folder
  } = options;

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const processedFilename = `${timestamp}-${randomString}.${format}`;
  const outputPath = path.join('uploads', folder, processedFilename);

  // Process image with sharp
  let sharpInstance = sharp(buffer);

  // Resize if dimensions provided
  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Set format and quality
  switch (format) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality });
      break;
  }

  // Save processed image
  await sharpInstance.toFile(outputPath);

  logger.info(`Image processed and saved: ${outputPath}`);
  return processedFilename;
};

// Middleware for single image upload
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};

// Middleware for multiple image upload
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for processing uploaded images
export const processUploadedImages = (
  folder: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    generateThumbnail?: boolean;
    thumbnailWidth?: number;
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      const file = req.file as Express.Multer.File;

      if (!files && !file) {
        return next();
      }

      const processedImages: string[] = [];
      const filesToProcess = files || (file ? [file] : []);

      for (const uploadedFile of filesToProcess) {
        // Process main image
        const mainImage = await processImage(uploadedFile.buffer, uploadedFile.originalname, {
          ...options,
          folder
        });
        processedImages.push(mainImage);

        // Generate thumbnail if requested
        if (options.generateThumbnail) {
          const thumbnailImage = await processImage(uploadedFile.buffer, uploadedFile.originalname, {
            ...options,
            width: options.thumbnailWidth || 200,
            height: options.thumbnailWidth || 200,
            folder: `${folder}/thumbnails`
          });
          
          // Ensure thumbnails directory exists
          await fs.mkdir(path.join('uploads', folder, 'thumbnails'), { recursive: true });
        }
      }

      // Add processed filenames to request
      if (files) {
        req.body.processedImages = processedImages;
      } else if (file) {
        req.body.processedImage = processedImages[0];
      }

      next();
    } catch (error) {
      logger.error('Image processing error:', error);
      res.status(400).json({
        success: false,
        message: 'Image processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Utility function to delete uploaded files
export const deleteUploadedFile = async (filename: string, folder: string): Promise<void> => {
  try {
    const filePath = path.join('uploads', folder, filename);
    await fs.unlink(filePath);
    logger.info(`Deleted file: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to delete file: ${filename}`, error);
  }
};

// Utility function to get file URL
export const getFileUrl = (filename: string, folder: string): string => {
  return `/uploads/${folder}/${filename}`;
};

export default upload;