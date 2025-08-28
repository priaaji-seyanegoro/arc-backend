import { body, param } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Validation for creating payment
 */
export const createPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid order ID format');
      }
      return true;
    })
];

/**
 * Validation for payment status check
 */
export const getPaymentStatusValidation = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid order ID format');
      }
      return true;
    })
];

/**
 * Validation for cancel payment
 */
export const cancelPaymentValidation = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid order ID format');
      }
      return true;
    })
];

/**
 * Validation for webhook notification
 * Note: Webhook validation is primarily done through signature verification
 * in the controller, but we can add basic structure validation here
 */
export const webhookNotificationValidation = [
  body('order_id')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('transaction_status')
    .notEmpty()
    .withMessage('Transaction status is required')
    .isIn(['capture', 'settlement', 'pending', 'deny', 'cancel', 'expire', 'failure'])
    .withMessage('Invalid transaction status'),
  body('signature_key')
    .notEmpty()
    .withMessage('Signature key is required'),
  body('status_code')
    .notEmpty()
    .withMessage('Status code is required'),
  body('gross_amount')
    .notEmpty()
    .withMessage('Gross amount is required')
    .isNumeric()
    .withMessage('Gross amount must be a number')
];