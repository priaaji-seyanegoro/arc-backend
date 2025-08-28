import { Router } from 'express';
import {
  checkout,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  getShippingOptions,
  validateAddress,
  getDeliveryInfo
} from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { orderLimiter } from '../middleware/rateLimiter';
import { cache, invalidateCache, cacheConfigs } from '../middleware/cache';

const router = Router();

// User routes (require authentication)
router.use(authenticate);

// Shipping and delivery routes
router.post('/shipping-options', cache(cacheConfigs.short), getShippingOptions);
router.post('/validate-address', cache(cacheConfigs.short), validateAddress);
router.post('/delivery-info', cache(cacheConfigs.short), getDeliveryInfo);

// User order operations
router.post('/checkout', orderLimiter, invalidateCache((req) => [`cache:*:*/orders/my-orders*`, `cache:*:*/orders*`]), checkout);
router.get('/my-orders', cache(cacheConfigs.short), getUserOrders);
router.get('/:orderId', cache(cacheConfigs.short), getOrderById);
router.patch('/:orderId/cancel', invalidateCache((req) => [`cache:*:*/orders/my-orders*`, `cache:*:*/orders/${req.params.orderId}*`, `cache:*:*/orders*`]), cancelOrder);

// Admin routes (require admin role)
router.get('/', requireAdmin, cache(cacheConfigs.short), getAllOrders);
router.patch('/:orderId/status', requireAdmin, invalidateCache((req) => [`cache:*:*/orders*`, `cache:*:*/orders/${req.params.orderId}*`, `cache:*:*/orders/admin/stats*`]), updateOrderStatus);
router.patch('/:orderId/payment', requireAdmin, invalidateCache((req) => [`cache:*:*/orders*`, `cache:*:*/orders/${req.params.orderId}*`, `cache:*:*/orders/admin/stats*`]), updatePaymentStatus);
router.get('/admin/stats', requireAdmin, cache(cacheConfigs.medium), getOrderStats);

export default router;