import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import {
  createPaymentValidation,
  getPaymentStatusValidation,
  cancelPaymentValidation,
  webhookNotificationValidation
} from '../validators/paymentValidators';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/payments/create
 * @desc    Create payment transaction
 * @access  Private (Customer)
 */
router.post('/create', 
  authenticate, 
  paymentLimiter,
  createPaymentValidation, 
  PaymentController.createPayment
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle payment notification webhook from Midtrans
 * @access  Public (Webhook)
 * @note    This endpoint is called by Midtrans, so no authentication required
 */
router.post('/webhook', 
  webhookNotificationValidation, 
  PaymentController.handleNotification
);

/**
 * @route   GET /api/payments/status/:orderId
 * @desc    Get payment status
 * @access  Private (Customer)
 */
router.get('/status/:orderId', 
  authenticate, 
  getPaymentStatusValidation, 
  PaymentController.getPaymentStatus
);

/**
 * @route   POST /api/payments/cancel/:orderId
 * @desc    Cancel payment
 * @access  Private (Customer)
 */
router.post('/cancel/:orderId', 
  authenticate, 
  paymentLimiter,
  cancelPaymentValidation, 
  PaymentController.cancelPayment
);

export default router;