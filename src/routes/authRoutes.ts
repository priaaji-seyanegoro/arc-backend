import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  sendVerificationEmailController,
  verifyEmail,
  resendVerificationEmailController,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  updateProfileValidation,
  changePasswordValidation
} from '../validators/authValidators';
import { authenticate } from '../middleware/auth';
import {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  emailVerificationLimiter
} from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/refresh-token', authLimiter, refreshTokenValidation, refreshToken);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, changePassword);
router.post('/logout', authenticate, logout);

// Email verification routes
router.post('/send-verification', authenticate, emailVerificationLimiter, sendVerificationEmailController);
router.post('/resend-verification', emailVerificationLimiter, resendVerificationEmailController);
router.get('/verify-email/:token', verifyEmail);

// Password reset routes
router.post('/request-password-reset', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, resetPassword);

export default router;