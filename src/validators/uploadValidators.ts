import { body, param } from 'express-validator';

// Validation for adding product images
export const addProductImagesValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('images')
    .isArray({ min: 1, max: 10 })
    .withMessage('Images must be an array with 1-10 items')
    .custom((images) => {
      for (const image of images) {
        if (typeof image !== 'string' || !image.trim()) {
          throw new Error('Each image must be a valid URL string');
        }
        // Basic URL validation
        try {
          new URL(image);
        } catch {
          throw new Error('Each image must be a valid URL');
        }
      }
      return true;
    })
];

// Validation for removing product image
export const removeProductImageValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('imageUrl')
    .isURL()
    .withMessage('Valid image URL is required')
];

// Validation for updating product image order
export const updateProductImageOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('images')
    .isArray({ min: 0, max: 20 })
    .withMessage('Images must be an array with maximum 20 items')
    .custom((images) => {
      for (const image of images) {
        if (typeof image !== 'string' || !image.trim()) {
          throw new Error('Each image must be a valid URL string');
        }
        // Basic URL validation
        try {
          new URL(image);
        } catch {
          throw new Error('Each image must be a valid URL');
        }
      }
      return true;
    })
];

// Validation for adding SKU images
export const addSKUImagesValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  param('skuId')
    .isMongoId()
    .withMessage('Invalid SKU ID'),
  body('images')
    .isArray({ min: 1, max: 10 })
    .withMessage('Images must be an array with 1-10 items')
    .custom((images) => {
      for (const image of images) {
        if (typeof image !== 'string' || !image.trim()) {
          throw new Error('Each image must be a valid URL string');
        }
        // Basic URL validation
        try {
          new URL(image);
        } catch {
          throw new Error('Each image must be a valid URL');
        }
      }
      return true;
    })
];

// Validation for removing SKU image
export const removeSKUImageValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  param('skuId')
    .isMongoId()
    .withMessage('Invalid SKU ID'),
  body('imageUrl')
    .isURL()
    .withMessage('Valid image URL is required')
];

// Validation for file upload endpoints
export const uploadValidation = [
  // File validation will be handled by multer middleware
  // This is for additional body parameters if needed
];

// Validation for file deletion
export const deleteFileValidation = [
  body('filename')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Filename is required')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Invalid filename format'),
  body('bucket')
    .optional()
    .isIn(['PRODUCTS', 'CATEGORIES', 'USERS'])
    .withMessage('Invalid bucket name')
];