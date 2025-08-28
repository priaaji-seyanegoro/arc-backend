import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

const router = Router();

// Test notification endpoint
router.post('/test-notification', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { orderId, notificationType } = req.body;

    if (!orderId || !notificationType) {
      const response: ApiResponse = {
        success: false,
        message: 'Order ID and notification type are required'
      };
      return res.status(400).json(response);
    }

    // Find order and populate user
    const order = await Order.findById(orderId);
    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found'
      };
      return res.status(404).json(response);
    }

    const user = await User.findById(order.user);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Send notification based on type
    switch (notificationType) {
      case 'order_confirmation':
        await NotificationService.sendOrderConfirmation(order, user);
        break;
      case 'payment_confirmation':
        await NotificationService.sendPaymentConfirmation(order, user);
        break;
      case 'order_shipped':
        await NotificationService.sendOrderShipped(order, user);
        break;
      case 'order_delivered':
        await NotificationService.sendOrderDelivered(order, user);
        break;
      case 'order_cancelled':
        await NotificationService.sendOrderCancelled(order, user);
        break;
      default:
        const response: ApiResponse = {
          success: false,
          message: 'Invalid notification type'
        };
        return res.status(400).json(response);
    }

    logger.info('Test notification sent successfully', {
      orderId,
      notificationType,
      userEmail: user.email
    });

    const response: ApiResponse = {
      success: true,
      message: `${notificationType} notification sent successfully`,
      data: {
        orderId,
        notificationType,
        recipientEmail: user.email
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Test notification error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    const response: ApiResponse = {
      success: false,
      message: 'Failed to send test notification'
    };

    return res.status(500).json(response);
  }
});

// Create test order for notification testing
router.post('/create-test-order', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      const response: ApiResponse = {
        success: false,
        message: 'User email is required'
      };
      return res.status(400).json(response);
    }

    // Find or create test user
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: userEmail,
        password: 'testpassword123',
        isEmailVerified: true
      });
      await user.save();
    }

    // Create test order
    const testOrder = new Order({
      user: user._id,
      items: [
        {
          product: '507f1f77bcf86cd799439011', // Mock product ID
          sku: 'TEST-SKU-001',
          productName: 'Test Product',
          size: 'M',
          color: 'Blue',
          quantity: 2,
          price: 150000,
          weight: 500,
          image: 'https://example.com/test-image.jpg'
        }
      ],
      subtotal: 300000,
      shippingCost: 15000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 315000,
      shippingAddress: {
        recipientName: `${user.firstName} ${user.lastName}`,
        phone: '+6281234567890',
        street: 'Jl. Test Street No. 123',
        city: 'Jakarta',
        state: 'DKI Jakarta',
        postalCode: '12345',
        country: 'Indonesia'
      },
      shippingMethod: 'regular',
      paymentMethod: 'bank_transfer',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await testOrder.save();

    logger.info('Test order created successfully', {
      orderId: testOrder._id,
      orderNumber: testOrder.orderNumber,
      userEmail: user.email
    });

    const response: ApiResponse = {
      success: true,
      message: 'Test order created successfully',
      data: {
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userEmail: user.email,
        totalAmount: testOrder.totalAmount
      }
    };

    return res.status(201).json(response);
  } catch (error) {
    logger.error('Create test order error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    const response: ApiResponse = {
      success: false,
      message: 'Failed to create test order'
    };

    return res.status(500).json(response);
  }
});

export default router;