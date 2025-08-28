import { Request, Response } from 'express';
import PaymentService from '../services/paymentService';
import { validationResult } from 'express-validator';
import Order from '../models/Order';
import User from '../models/User';
import crypto from 'crypto';
import { MIDTRANS_SERVER_KEY } from '../config/env';

// Define AuthenticatedRequest interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export class PaymentController {
  /**
   * Create payment transaction
   */
  static async createPayment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { orderId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get order details
      const order = await Order.findById(orderId).populate('user').populate('items.product');
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify order belongs to user
      if (order.user._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if order is already paid
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order is already paid'
        });
      }

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create payment transaction
      const paymentResult = await PaymentService.createTransaction({
        transaction_details: {
          order_id: order._id.toString(),
          gross_amount: order.totalAmount
        },
        customer_details: {
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phone || ''
        },
        item_details: order.items.map((item: any) => ({
          id: item.product._id.toString(),
          price: item.price,
          quantity: item.quantity,
          name: item.productName
        }))
      });

      // Update order with payment token
      order.paymentToken = paymentResult.token;
      order.paymentStatus = 'pending';
      await order.save();

      return res.status(200).json({
        success: true,
        message: 'Payment transaction created successfully',
        data: {
          token: paymentResult.token,
          redirect_url: paymentResult.redirect_url,
          order_id: order._id
        }
      });

    } catch (error) {
      console.error('Create payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Handle payment notification webhook from Midtrans
   */
  static async handleNotification(req: Request, res: Response): Promise<Response> {
    try {
      const notification = req.body;
      
      // Verify signature
      const signatureKey = notification.signature_key;
      const orderId = notification.order_id;
      const statusCode = notification.status_code;
      const grossAmount = notification.gross_amount;
      
      const expectedSignature = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY)
        .digest('hex');

      if (signatureKey !== expectedSignature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Verify payment status
      const paymentStatus = await PaymentService.getTransactionStatus(orderId);
      
      // Find and update order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Update order status based on payment status
      switch (paymentStatus.transaction_status) {
        case 'capture':
        case 'settlement':
          order.paymentStatus = 'paid';
          order.status = 'processing';
          order.paidAt = new Date();
          break;
        case 'pending':
          order.paymentStatus = 'pending';
          break;
        case 'deny':
        case 'cancel':
        case 'expire':
          order.paymentStatus = 'failed';
          order.status = 'cancelled';
          break;
        default:
          order.paymentStatus = 'pending';
      }

      await order.save();

      return res.status(200).json({
        success: true,
        message: 'Notification processed successfully'
      });

    } catch (error) {
      console.error('Payment notification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify order belongs to user
      if (order.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get payment status from Midtrans if order has payment token
      let paymentDetails = null;
      if (order.paymentToken) {
        try {
          paymentDetails = await PaymentService.getTransactionStatus(orderId);
        } catch (error) {
          console.error('Error getting payment details:', error);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: {
          order_id: order._id,
          payment_status: order.paymentStatus,
          order_status: order.status,
          total_amount: order.totalAmount,
          paid_at: order.paidAt,
          payment_details: paymentDetails
        }
      });

    } catch (error) {
      console.error('Get payment status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Cancel payment
   */
  static async cancelPayment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify order belongs to user
      if (order.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if order can be cancelled
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel paid order'
        });
      }

      // Update order status
      order.paymentStatus = 'cancelled';
      order.status = 'cancelled';
      await order.save();

      return res.status(200).json({
        success: true,
        message: 'Payment cancelled successfully',
        data: {
          order_id: order._id,
          status: order.status,
          payment_status: order.paymentStatus
        }
      });

    } catch (error) {
      console.error('Cancel payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}