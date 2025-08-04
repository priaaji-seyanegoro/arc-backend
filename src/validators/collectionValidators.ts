import { body } from 'express-validator';

export const createCollectionValidator = [
  body('name')
    .notEmpty()
    .withMessage('Collection name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Collection name must be between 2 and 100 characters'),
  
  body('code')
    .notEmpty()
    .withMessage('Collection code is required')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Collection code must contain only uppercase letters, numbers, and hyphens')
    .isLength({ min: 2, max: 20 })
    .withMessage('Collection code must be between 2 and 20 characters'),
  
  body('type')
    .optional()
    .isIn(['seasonal', 'capsule', 'limited', 'regular'])
    .withMessage('Invalid collection type'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.body.startDate && endDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

export const updateCollectionValidator = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Collection name must be between 2 and 100 characters'),
  
  body('code')
    .optional()
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Collection code must contain only uppercase letters, numbers, and hyphens')
    .isLength({ min: 2, max: 20 })
    .withMessage('Collection code must be between 2 and 20 characters'),
  
  body('type')
    .optional()
    .isIn(['seasonal', 'capsule', 'limited', 'regular'])
    .withMessage('Invalid collection type'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];