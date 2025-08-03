import { body, param } from 'express-validator';

export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
    
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
    
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
    
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
    
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
    
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('SKU must be between 1 and 50 characters'),
    
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
    
  body('dimensions')
    .optional()
    .isObject()
    .withMessage('Dimensions must be an object'),
    
  body('dimensions.length')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Length must be a positive number'),
    
  body('dimensions.width')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Width must be a positive number'),
    
  body('dimensions.height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number')
];

export const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
    
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
    
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),
    
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
    
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
    
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
    
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('SKU must be between 1 and 50 characters'),
    
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
    
  body('dimensions')
    .optional()
    .isObject()
    .withMessage('Dimensions must be an object'),
    
  body('dimensions.length')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Length must be a positive number'),
    
  body('dimensions.width')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Width must be a positive number'),
    
  body('dimensions.height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const getProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format')
];

export const deleteProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format')
];