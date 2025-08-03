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

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', categoryIdValidation, handleValidationErrors, getCategoryById);

// Admin only routes
router.post('/', 
  authenticate, 
  authorize('admin'), 
  createCategoryValidation, 
  handleValidationErrors, 
  createCategory
);

router.put('/:id', 
  authenticate, 
  authorize('admin'), 
  updateCategoryValidation, 
  handleValidationErrors, 
  updateCategory
);

router.delete('/:id', 
  authenticate, 
  authorize('admin'), 
  categoryIdValidation, 
  handleValidationErrors, 
  deleteCategory
);

export default router;