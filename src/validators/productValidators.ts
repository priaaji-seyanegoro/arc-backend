import { body, param } from "express-validator";

export const createProductValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("basePrice")
    .isFloat({ min: 0 })
    .withMessage("Base price must be a positive number"),

  body("category")
    .notEmpty()
    .withMessage("Category ID is required")
    .isMongoId()
    .withMessage("Invalid category ID format"),

  body("collection")
    .optional()
    .isMongoId()
    .withMessage("Invalid collection ID format"),

  body("images").optional().isArray().withMessage("Images must be an array"),

  body("images.*")
    .optional()
    .isString()
    .withMessage("Each image must be a string"),

  body("skus")
    .optional()
    .isArray()
    .withMessage("SKUs must be an array"),

  body("skus.*.sku")
    .notEmpty()
    .withMessage("SKU code is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("SKU must be between 1 and 50 characters"),

  body("skus.*.size")
    .notEmpty()
    .withMessage("Size is required"),

  body("skus.*.color")
    .notEmpty()
    .withMessage("Color is required"),

  body("skus.*.stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("skus.*.price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("skus.*.weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),

  body("features")
    .optional()
    .isArray()
    .withMessage("Features must be an array"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean")
];

export const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("basePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Base price must be a positive number"),

  body("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID format"),

  body("collection")
    .optional()
    .isMongoId()
    .withMessage("Invalid collection ID format"),

  body("images").optional().isArray().withMessage("Images must be an array"),

  body("images.*")
    .optional()
    .isString()
    .withMessage("Each image must be a string"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean")
];

export const getProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID format"),
];

export const deleteProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID format"),
];
