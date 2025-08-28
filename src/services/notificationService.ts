import { IOrder } from '../models/Order';
import { IUser } from '../models/User';
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendPaymentConfirmationEmail,
  OrderNotificationData
} from './emailService';
import { logger } from '../utils/logger';

/**
 * Notification Service for handling order-related notifications
 */
export class NotificationService {
  /**
   * Send order confirmation notification
   */
  static async sendOrderConfirmation(order: IOrder, user: IUser): Promise<void> {
    try {
      const notificationData: OrderNotificationData = {
        orderNumber: order.orderNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        totalAmount: order.totalAmount,
        items: order.items.map(item => ({
          productName: item.productName,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          recipientName: order.shippingAddress.recipientName,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode
        }
      };

      await sendOrderConfirmationEmail(notificationData);
      
      logger.business('Order confirmation email sent', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        totalAmount: order.totalAmount
      });
    } catch (error) {
      logger.error('Failed to send order confirmation email', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send payment confirmation notification
   */
  static async sendPaymentConfirmation(order: IOrder, user: IUser): Promise<void> {
    try {
      const notificationData: OrderNotificationData = {
        orderNumber: order.orderNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        totalAmount: order.totalAmount,
        items: order.items.map(item => ({
          productName: item.productName,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          recipientName: order.shippingAddress.recipientName,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode
        }
      };

      await sendPaymentConfirmationEmail(notificationData);
      
      logger.business('Payment confirmation email sent', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount
      });
    } catch (error) {
      logger.error('Failed to send payment confirmation email', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send order shipped notification
   */
  static async sendOrderShipped(order: IOrder, user: IUser): Promise<void> {
    try {
      const notificationData: OrderNotificationData = {
        orderNumber: order.orderNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        totalAmount: order.totalAmount,
        items: order.items.map(item => ({
          productName: item.productName,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          recipientName: order.shippingAddress.recipientName,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode
        },
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery
      };

      await sendOrderShippedEmail(notificationData);
      
      logger.business('Order shipped email sent', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        trackingNumber: order.trackingNumber
      });
    } catch (error) {
      logger.error('Failed to send order shipped email', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send order delivered notification
   */
  static async sendOrderDelivered(order: IOrder, user: IUser): Promise<void> {
    try {
      const notificationData: OrderNotificationData = {
        orderNumber: order.orderNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        totalAmount: order.totalAmount,
        items: order.items.map(item => ({
          productName: item.productName,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          recipientName: order.shippingAddress.recipientName,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode
        }
      };

      await sendOrderDeliveredEmail(notificationData);
      
      logger.business('Order delivered email sent', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email
      });
    } catch (error) {
      logger.error('Failed to send order delivered email', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send order cancelled notification
   */
  static async sendOrderCancelled(order: IOrder, user: IUser): Promise<void> {
    try {
      const notificationData: OrderNotificationData & { cancelReason?: string } = {
        orderNumber: order.orderNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        totalAmount: order.totalAmount,
        items: order.items.map(item => ({
          productName: item.productName,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          recipientName: order.shippingAddress.recipientName,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode
        },
        cancelReason: order.cancelReason
      };

      await sendOrderCancelledEmail(notificationData);
      
      logger.business('Order cancelled email sent', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        cancelReason: order.cancelReason
      });
    } catch (error) {
      logger.error('Failed to send order cancelled email', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: user.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle order status change and send appropriate notifications
   */
  static async handleOrderStatusChange(
    order: IOrder, 
    user: IUser, 
    previousStatus: string, 
    newStatus: string
  ): Promise<void> {
    logger.business('Order status changed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus,
      customerEmail: user.email
    });

    try {
      switch (newStatus) {
        case 'confirmed':
          await this.sendOrderConfirmation(order, user);
          break;
        case 'shipped':
          await this.sendOrderShipped(order, user);
          break;
        case 'delivered':
          await this.sendOrderDelivered(order, user);
          break;
        case 'cancelled':
          await this.sendOrderCancelled(order, user);
          break;
        default:
          logger.info('No notification configured for status', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: newStatus
          });
      }
    } catch (error) {
      logger.error('Failed to handle order status change notification', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw error to prevent blocking the main order update process
    }
  }

  /**
   * Handle payment status change and send appropriate notifications
   */
  static async handlePaymentStatusChange(
    order: IOrder, 
    user: IUser, 
    previousStatus: string, 
    newStatus: string
  ): Promise<void> {
    logger.business('Payment status changed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus,
      customerEmail: user.email,
      paymentMethod: order.paymentMethod
    });

    try {
      switch (newStatus) {
        case 'paid':
          await this.sendPaymentConfirmation(order, user);
          break;
        default:
          logger.info('No notification configured for payment status', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: newStatus
          });
      }
    } catch (error) {
      logger.error('Failed to handle payment status change notification', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw error to prevent blocking the main payment update process
    }
  }
}

export default NotificationService;