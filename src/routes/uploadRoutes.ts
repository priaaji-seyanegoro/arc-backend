import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import {
  uploadValidation,
  deleteFileValidation
} from '../validators/uploadValidators';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// Product image upload routes
router.post(
  '/products/single',
  authenticate,
  uploadLimiter,
  uploadSingle('image'),
  UploadController.uploadProductImage as any
);

router.post(
  '/products/multiple',
  authenticate,
  uploadLimiter,
  uploadMultiple('images', 10),
  UploadController.uploadProductImages as any
);

// Category image upload routes
router.post(
  '/categories/single',
  authenticate,
  uploadLimiter,
  uploadSingle('image'),
  UploadController.uploadCategoryImage as any
);

// File management routes
router.delete(
  '/file',
  authenticate,
  deleteFileValidation,
  UploadController.deleteFile
);

router.get(
  '/:bucket/:filename/info',
  authenticate,
  UploadController.getFileInfo
);

export default router;