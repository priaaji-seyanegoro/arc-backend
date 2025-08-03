import { body } from 'express-validator';
import { emailValidation, passwordValidation, nameValidation, phoneValidation } from '../utils/validation';

export const registerValidation = [
  nameValidation('firstName'),
  nameValidation('lastName'),
  emailValidation(),
  passwordValidation(),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  phoneValidation().optional(),
  body('referralCode')
    .optional()
    .isLength({ min: 6, max: 10 })
    .withMessage('Referral code must be between 6-10 characters')
    .isAlphanumeric()
    .withMessage('Referral code must contain only letters and numbers')
];

export const loginValidation = [
  emailValidation(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format')
];

export const updateProfileValidation = [
  nameValidation('firstName').optional(),
  nameValidation('lastName').optional(),
  phoneValidation().optional(),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other')
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordValidation('newPassword'),
  body('confirmNewPassword')
    .notEmpty()
    .withMessage('Confirm new password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
];