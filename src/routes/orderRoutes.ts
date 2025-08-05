import { Router } from 'express';
import {
  checkout,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats
} from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// User routes (require authentication)
router.use(authenticate);

// User order operations
router.post('/checkout', checkout);
router.get('/my-orders', getUserOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/cancel', cancelOrder);

// Admin routes (require admin role)
router.get('/', requireAdmin, getAllOrders);
router.patch('/:orderId/status', requireAdmin, updateOrderStatus);
router.patch('/:orderId/payment', requireAdmin, updatePaymentStatus);
router.get('/admin/stats', requireAdmin, getOrderStats);

export default router;