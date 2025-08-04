import express from 'express';
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection
} from '../controllers/collectionController';
import { authenticate } from '../middleware/auth'; // Ganti authenticateToken dengan authenticate

const router = express.Router();

// Public routes
router.get('/', getCollections);
router.get('/:id', getCollectionById);

// Protected routes (admin only)
router.post('/', authenticate, createCollection); // Ganti authenticateToken dengan authenticate
router.put('/:id', authenticate, updateCollection); // Ganti authenticateToken dengan authenticate
router.delete('/:id', authenticate, deleteCollection); // Ganti authenticateToken dengan authenticate

export default router;