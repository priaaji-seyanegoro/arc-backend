import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { sendError } from './response';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};
    
    errors.array().forEach((error: any) => {
      // Fix: Handle different error types properly
      const field = error.path || error.param || 'general';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });
    
    return sendError(
      res,
      'Validation failed',
      'Please check your input data',
      400,
      formattedErrors
    );
  }
  
  next();
};

// Common validation rules
export const emailValidation = () => 
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address');

export const passwordValidation = (field: string = 'password') => 
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const nameValidation = (field: string) => 
  body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${field} can only contain letters and spaces`);

export const phoneValidation = () => 
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number');

// Additional validation helpers
export const confirmPasswordValidation = () => 
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    });

export const objectIdValidation = (field: string) => 
  body(field)
    .isMongoId()
    .withMessage(`${field} must be a valid ID`);