import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation
} from '../validators/categoryValidators';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../utils/validation';
import { cache, invalidateCache, cacheConfigs, createInvalidationPatterns } from '../middleware/cache';

const router = Router();

// Public routes (with caching)
router.get('/', cache(cacheConfigs.long), getCategories);
router.get('/:id', categoryIdValidation, handleValidationErrors, cache(cacheConfigs.static), getCategoryById);

// Admin only routes (with cache invalidation)
router.post('/', 
  authenticate, 
  authorize('admin'), 
  createCategoryValidation, 
  handleValidationErrors,
  invalidateCache(createInvalidationPatterns.resource('categories')),
  createCategory
);

router.put('/:id', 
  authenticate, 
  authorize('admin'), 
  updateCategoryValidation, 
  handleValidationErrors,
  invalidateCache((req) => [`cache:*:*/categories*`, `cache:*:*/categories/${req.params.id}*`]),
  updateCategory
);

router.delete('/:id', 
  authenticate, 
  authorize('admin'), 
  categoryIdValidation, 
  handleValidationErrors,
  invalidateCache((req) => [`cache:*:*/categories*`, `cache:*:*/categories/${req.params.id}*`]),
  deleteCategory
);

export default router;