import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductSKU,
  updateProductSKU,
  deleteProductSKU,
  addProductImages,
  removeProductImage,
  updateProductImageOrder,
  addSKUImages,
  removeSKUImage
} from '../controllers/productController';
import {
  createProductValidation,
  updateProductValidation,
  getProductValidation,
  deleteProductValidation
} from '../validators/productValidators';
import {
  addProductImagesValidation,
  removeProductImageValidation,
  updateProductImageOrderValidation,
  addSKUImagesValidation,
  removeSKUImageValidation
} from '../validators/uploadValidators';
import { authenticate } from '../middleware/auth';
import { cache, invalidateCache, cacheConfigs, createInvalidationPatterns } from '../middleware/cache';

const router = Router();

// Public routes (with caching)
router.get('/', cache(cacheConfigs.medium), getProducts);
router.get('/:id', getProductValidation, cache(cacheConfigs.long), getProductById);

// Protected routes (require authentication) with cache invalidation
router.post('/', authenticate, createProductValidation, invalidateCache(createInvalidationPatterns.resource('products')), createProduct);
router.put('/:id', authenticate, updateProductValidation, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), updateProduct);
router.delete('/:id', authenticate, deleteProductValidation, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), deleteProduct);

// SKU management routes with cache invalidation
router.post('/:id/skus', authenticate, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), addProductSKU);
router.put('/:id/skus/:skuId', authenticate, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), updateProductSKU);
router.delete('/:id/skus/:skuId', authenticate, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), deleteProductSKU);

// Product image management routes with cache invalidation
router.post('/:id/images', authenticate, addProductImagesValidation, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), addProductImages);
router.delete('/:id/images', authenticate, removeProductImageValidation, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), removeProductImage);
router.put('/:id/images/order', authenticate, updateProductImageOrderValidation, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), updateProductImageOrder);

// SKU image management routes with cache invalidation
router.post('/:id/skus/:skuId/images', authenticate, addSKUImagesValidation, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), addSKUImages);
router.delete('/:id/skus/:skuId/images', authenticate, removeSKUImageValidation, invalidateCache((req) => [`cache:*:*/products*`, `cache:*:*/products/${req.params.id}*`]), removeSKUImage);

export default router;