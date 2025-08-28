import { Request, Response } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import User from '../models/User';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';
import { NotificationService } from '../services/notificationService';
import { ShippingService } from '../services/shippingService';
import { GeocodingService } from '../services/geocodingService';

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

    // Validate and geocode shipping address
    const geocodeResult = await GeocodingService.validateAddress(shippingAddress);
    let validatedShippingAddress = shippingAddress;
    if (geocodeResult) {
      validatedShippingAddress = {
        ...shippingAddress,
        latitude: geocodeResult.coordinates.latitude,
        longitude: geocodeResult.coordinates.longitude,
        formattedAddress: geocodeResult.address.formattedAddress
      };
    }

    // Calculate total weight for shipping
    const totalWeight = orderItems.reduce((total, item) => total + (item.weight * item.quantity), 0);
    
    // Get shipping options and calculate cost
    let shippingCost = 0;
    let selectedShippingOption = null;
    
    if (shippingMethod && shippingMethod.includes(':')) {
      // Format: "COURIER:SERVICE" (e.g., "JNE:REG")
      const [courier, service] = shippingMethod.split(':');
      selectedShippingOption = await ShippingService.getShippingOption(
        courier,
        service,
        validatedShippingAddress,
        totalWeight
      );
      shippingCost = selectedShippingOption?.cost || calculateShippingCost(shippingMethod, orderItems);
    } else {
      // Fallback to old calculation method
      shippingCost = calculateShippingCost(shippingMethod, orderItems);
    }

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

    // Send order confirmation notification
    try {
      const user = await User.findById(userId);
      if (user) {
        await NotificationService.sendOrderConfirmation(order, user);
      }
    } catch (notificationError) {
      logger.error('Failed to send order confirmation notification', {
        orderId: order._id,
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      });
      // Don't fail the order creation if notification fails
    }

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

// Get shipping options for an address
export const getShippingOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, weight } = req.body;

    if (!address || !weight) {
      const response: ApiResponse = {
        success: false,
        message: 'Address and weight are required'
      };
      res.status(400).json(response);
      return;
    }

    // Validate and geocode address
    const geocodeResult = await GeocodingService.validateAddress(address);
    if (!geocodeResult) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid address or geocoding failed'
      };
      res.status(400).json(response);
      return;
    }

    // Convert to ShippingAddress format
    const shippingAddress = {
      street: geocodeResult.address.street || '',
      city: geocodeResult.address.city || '',
      state: geocodeResult.address.state || '',
      postalCode: geocodeResult.address.postalCode || '',
      country: geocodeResult.address.country || '',
      latitude: geocodeResult.coordinates.latitude,
      longitude: geocodeResult.coordinates.longitude
    };

    // Get shipping options
    const shippingOptions = await ShippingService.calculateShippingCosts(
      shippingAddress,
      weight
    );

    const response: ApiResponse = {
      success: true,
      message: 'Shipping options retrieved successfully',
      data: {
        address: geocodeResult.address,
        coordinates: geocodeResult.coordinates,
        mapUrl: GeocodingService.getMapUrl(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude
        ),
        mapEmbedUrl: GeocodingService.getMapEmbedUrl(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude
        ),
        shippingOptions
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get shipping options error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get shipping options'
    };
    res.status(500).json(response);
  }
};

// Validate address and get coordinates
export const validateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.body;

    if (!address) {
      const response: ApiResponse = {
        success: false,
        message: 'Address is required'
      };
      res.status(400).json(response);
      return;
    }

    // Validate and geocode address
    const geocodeResult = await GeocodingService.validateAddress(address);
    if (!geocodeResult) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid address or geocoding failed'
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Address validated successfully',
      data: {
        originalAddress: address,
        validatedAddress: geocodeResult.address,
        coordinates: geocodeResult.coordinates,
        accuracy: geocodeResult.accuracy,
        mapUrl: GeocodingService.getMapUrl(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude
        ),
        mapEmbedUrl: GeocodingService.getMapEmbedUrl(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude
        )
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Validate address error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to validate address'
    };
    res.status(500).json(response);
  }
};

// Get delivery zones and distance calculation
export const getDeliveryInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { destinationAddress } = req.body;
    
    if (!destinationAddress) {
      const response: ApiResponse = {
        success: false,
        message: 'Destination address is required'
      };
      res.status(400).json(response);
      return;
    }

    // Default origin (your warehouse/store location)
    const originCoords = {
      latitude: -6.2088, // Jakarta coordinates
      longitude: 106.8456
    };

    // Geocode destination
    const destGeocode = await GeocodingService.validateAddress(destinationAddress);
    if (!destGeocode) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid destination address'
      };
      res.status(400).json(response);
      return;
    }

    // Calculate distance and delivery zone
    const distance = GeocodingService.calculateDistance(
      originCoords.latitude,
      originCoords.longitude,
      destGeocode.coordinates.latitude,
      destGeocode.coordinates.longitude
    );

    const deliveryZone = GeocodingService.getDeliveryZone(
      originCoords.latitude,
      originCoords.longitude,
      destGeocode.coordinates.latitude,
      destGeocode.coordinates.longitude
    );

    const response: ApiResponse = {
      success: true,
      message: 'Delivery information calculated successfully',
      data: {
        origin: {
          coordinates: originCoords,
          address: 'Jakarta, Indonesia' // Your store location
        },
        destination: {
          coordinates: destGeocode.coordinates,
          address: destGeocode.address
        },
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        deliveryZone,
        mapUrl: GeocodingService.getMapUrl(
          destGeocode.coordinates.latitude,
          destGeocode.coordinates.longitude
        )
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get delivery info error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get delivery information'
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

    const previousStatus = order.status;
    order.status = 'cancelled';
    order.cancelReason = cancelReason;
    await order.save();

    // Send cancellation notification
    try {
      const user = await User.findById(userId);
      if (user) {
        await NotificationService.handleOrderStatusChange(order, user, previousStatus, 'cancelled');
      }
    } catch (notificationError) {
      logger.error('Failed to send order cancellation notification', {
        orderId: order._id,
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      });
      // Don't fail the cancellation if notification fails
    }

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
    const previousStatus = order.status;
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    await order.save();

    // Send status change notification
    try {
      const user = await User.findById(order.user);
      if (user && previousStatus !== status) {
        await NotificationService.handleOrderStatusChange(order, user, previousStatus, status);
      }
    } catch (notificationError) {
      logger.error('Failed to send order status change notification', {
        orderId: order._id,
        previousStatus,
        newStatus: status,
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      });
      // Don't fail the status update if notification fails
    }

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

    const previousPaymentStatus = order.paymentStatus;
    const previousOrderStatus = order.status;
    
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

    // Send payment and order status change notifications
    try {
      const user = await User.findById(order.user);
      if (user) {
        // Send payment status notification
        if (previousPaymentStatus !== paymentStatus) {
          await NotificationService.handlePaymentStatusChange(order, user, previousPaymentStatus, paymentStatus);
        }
        
        // Send order status notification if it changed
        if (previousOrderStatus !== order.status) {
          await NotificationService.handleOrderStatusChange(order, user, previousOrderStatus, order.status);
        }
      }
    } catch (notificationError) {
      logger.error('Failed to send payment status change notification', {
        orderId: order._id,
        previousPaymentStatus,
        newPaymentStatus: paymentStatus,
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      });
      // Don't fail the payment update if notification fails
    }

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