import { Request, Response } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

// Get user's cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name slug basePrice images isActive skus'
      });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    const response: ApiResponse = {
      success: true,
      message: 'Cart retrieved successfully',
      data: cart
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get cart error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve cart'
    };
    res.status(500).json(response);
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId, skuCode, quantity = 1 } = req.body;

    // Validate product and SKU
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      const response: ApiResponse = {
        success: false,
        message: 'Product not found or inactive'
      };
      res.status(404).json(response);
      return;
    }

    // Find SKU by sku code (string)
    const sku = product.skus.find(s => s.sku === skuCode);
    if (!sku) {
      const response: ApiResponse = {
        success: false,
        message: 'SKU not found'
      };
      res.status(404).json(response);
      return;
    }

    if (sku.stock < quantity) {
      const response: ApiResponse = {
        success: false,
        message: 'Insufficient stock'
      };
      res.status(400).json(response);
      return;
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.sku === skuCode
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      if (cart.items[existingItemIndex].quantity > sku.stock) {
        const response: ApiResponse = {
          success: false,
          message: 'Total quantity exceeds available stock'
        };
        res.status(400).json(response);
        return;
      }
    } else {
      // Add new item - sku is stored as string
      cart.items.push({
        product: productId,
        sku: skuCode,
        quantity,
        price: sku.price,
        addedAt: new Date()
      });
    }

    await cart.save();
    
    // Populate cart for response
    await cart.populate({
      path: 'items.product',
      select: 'name slug basePrice images isActive skus'
    });

    const response: ApiResponse = {
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Add to cart error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to add item to cart'
    };
    res.status(500).json(response);
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      const response: ApiResponse = {
        success: false,
        message: 'Quantity must be at least 1'
      };
      res.status(400).json(response);
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const response: ApiResponse = {
        success: false,
        message: 'Cart not found'
      };
      res.status(404).json(response);
      return;
    }

    // Find item by _id in items array
    const item = cart.items.find(item => item._id?.toString() === itemId);
    if (!item) {
      const response: ApiResponse = {
        success: false,
        message: 'Cart item not found'
      };
      res.status(404).json(response);
      return;
    }

    // Check stock availability
    const product = await Product.findById(item.product);
    const sku = product?.skus.find(s => s.sku === item.sku);
    
    if (!sku || sku.stock < quantity) {
      const response: ApiResponse = {
        success: false,
        message: 'Insufficient stock'
      };
      res.status(400).json(response);
      return;
    }

    item.quantity = quantity;
    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'items.product',
      select: 'name slug basePrice images isActive skus'
    });

    const response: ApiResponse = {
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update cart item error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update cart item'
    };
    res.status(500).json(response);
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const response: ApiResponse = {
        success: false,
        message: 'Cart not found'
      };
      res.status(404).json(response);
      return;
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);
    if (itemIndex === -1) {
      const response: ApiResponse = {
        success: false,
        message: 'Cart item not found'
      };
      res.status(404).json(response);
      return;
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'items.product',
      select: 'name slug basePrice images isActive skus'
    });

    const response: ApiResponse = {
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Remove from cart error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to remove item from cart'
    };
    res.status(500).json(response);
  }
};

// Clear cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const response: ApiResponse = {
        success: false,
        message: 'Cart not found'
      };
      res.status(404).json(response);
      return;
    }

    cart.items = [];
    await cart.save();

    const response: ApiResponse = {
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Clear cart error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to clear cart'
    };
    res.status(500).json(response);
  }
};