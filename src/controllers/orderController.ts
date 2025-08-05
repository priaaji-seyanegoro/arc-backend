import { Request, Response } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

// Checkout - Convert cart to order
export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    console.log('User ID:', userId);
    console.log('Request body:', req.body);
    
    const {
      shippingAddress,
      shippingMethod,
      paymentMethod,
      notes
    } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name slug basePrice images isActive skus'
    });
    
    console.log('Cart found:', cart);
    console.log('Cart items:', cart?.items);
    
    if (!cart || cart.items.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Cart is empty'
      };
      res.status(400).json(response);
      return;
    }

    // Validate stock and prepare order items
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);
      if (!product || !product.isActive) {
        const response: ApiResponse = {
          success: false,
          message: `Product ${cartItem.product} is no longer available`
        };
        res.status(400).json(response);
        return;
      }

      const sku = product.skus.find(s => s.sku === cartItem.sku);
      if (!sku || sku.stock < cartItem.quantity) {
        const response: ApiResponse = {
          success: false,
          message: `Insufficient stock for ${product.name} - ${cartItem.sku}`
        };
        res.status(400).json(response);
        return;
      }

      // Prepare order item with snapshot data
      orderItems.push({
        product: cartItem.product,
        sku: cartItem.sku,
        productName: product.name,
        size: sku.size,
        color: sku.color,
        quantity: cartItem.quantity,
        price: sku.price,
        weight: sku.weight,
        image: sku.images[0] || product.images[0] || ''
      });

      subtotal += sku.price * cartItem.quantity;
    }

    // Calculate shipping and total
    const shippingCost = calculateShippingCost(shippingMethod, orderItems);
    const taxAmount = 0; // Implement tax calculation if needed
    const discountAmount = 0; // Implement discount logic if needed
    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      totalAmount,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      notes
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.updateOne(
        { _id: item.product, 'skus.sku': item.sku },
        { $inc: { 'skus.$.stock': -item.quantity } }
      );
    }

    // Clear cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } }
    );

    const response: ApiResponse = {
      success: true,
      message: 'Order created successfully',
      data: order
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Detailed checkout error:', error);
    logger.error('Checkout error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create order'
    };
    res.status(500).json(response);
  }
};

// Get user orders
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    const filter: any = { user: userId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate({
        path: 'items.product',
        select: 'name slug images'
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(filter);

    const response: ApiResponse = {
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get user orders error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve orders'
    };
    res.status(500).json(response);
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate({
        path: 'items.product',
        select: 'name slug images'
      });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Order retrieved successfully',
      data: order
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get order by ID error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve order'
    };
    res.status(500).json(response);
  }
};

// Cancel order (user)
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { cancelReason } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found'
      };
      res.status(404).json(response);
      return;
    }

    // Only allow cancellation for pending/confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      const response: ApiResponse = {
        success: false,
        message: 'Order cannot be cancelled at this stage'
      };
      res.status(400).json(response);
      return;
    }

    // Restore stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, 'skus.sku': item.sku },
        { $inc: { 'skus.$.stock': item.quantity } }
      );
    }

    order.status = 'cancelled';
    order.cancelReason = cancelReason;
    await order.save();

    const response: ApiResponse = {
      success: true,
      message: 'Order cancelled successfully',
      data: order
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Cancel order error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to cancel order'
    };
    res.status(500).json(response);
  }
};

// Helper function to calculate shipping cost
function calculateShippingCost(shippingMethod: string, items: any[]): number {
  const totalWeight = items.reduce((total, item) => total + (item.weight * item.quantity), 0);
  
  switch (shippingMethod) {
    case 'regular':
      return Math.max(15000, totalWeight * 0.01); // Min 15k or 10 rupiah per gram
    case 'express':
      return Math.max(25000, totalWeight * 0.02); // Min 25k or 20 rupiah per gram
    case 'same_day':
      return Math.max(50000, totalWeight * 0.03); // Min 50k or 30 rupiah per gram
    default:
      return 15000;
  }
}


// ADMIN FUNCTIONS

// Get all orders (Admin)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, search } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.recipientName': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'items.product',
        select: 'name slug images'
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(filter);

    const response: ApiResponse = {
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get all orders error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve orders'
    };
    res.status(500).json(response);
  }
};

// Update order status (Admin)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, estimatedDelivery } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found'
      };
      res.status(404).json(response);
      return;
    }

    // Update status
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    await order.save();

    const response: ApiResponse = {
      success: true,
      message: 'Order status updated successfully',
      data: order
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update order status error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update order status'
    };
    res.status(500).json(response);
  }
};

// Update payment status (Admin)
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found'
      };
      res.status(404).json(response);
      return;
    }

    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;
    if (paymentStatus === 'paid') {
      order.paidAt = new Date();
      // Auto-confirm order when payment is confirmed
      if (order.status === 'pending') {
        order.status = 'confirmed';
      }
    }

    await order.save();

    const response: ApiResponse = {
      success: true,
      message: 'Payment status updated successfully',
      data: order
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update payment status error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update payment status'
    };
    res.status(500).json(response);
  }
};

// Get order statistics (Admin)
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    const [statusStats, paymentStats, totalRevenue, totalOrders] = await Promise.all([
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments(dateFilter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Order statistics retrieved successfully',
      data: {
        statusStats,
        paymentStats,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get order stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve order statistics'
    };
    res.status(500).json(response);
  }
};