import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductSKU,
  updateProductSKU,
  deleteProductSKU
} from '../controllers/productController';
import {
  createProductValidation,
  updateProductValidation,
  getProductValidation,
  deleteProductValidation
} from '../validators/productValidators';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductValidation, getProductById);

// Protected routes (require authentication)
router.post('/', authenticate, createProductValidation, createProduct);
router.put('/:id', authenticate, updateProductValidation, updateProduct);
router.delete('/:id', authenticate, deleteProductValidation, deleteProduct);

// SKU management routes
router.post('/:id/skus', authenticate, addProductSKU);
router.put('/:id/skus/:skuId', authenticate, updateProductSKU);
router.delete('/:id/skus/:skuId', authenticate, deleteProductSKU);

export default router;