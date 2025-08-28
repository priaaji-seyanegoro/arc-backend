import express from 'express';
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection
} from '../controllers/collectionController';
import { authenticate } from '../middleware/auth';
import { cache, invalidateCache, cacheConfigs, createInvalidationPatterns } from '../middleware/cache';

const router = express.Router();

// Public routes (with caching)
router.get('/', cache(cacheConfigs.medium), getCollections);
router.get('/:id', cache(cacheConfigs.long), getCollectionById);

// Protected routes (admin only) with cache invalidation
router.post('/', authenticate, invalidateCache(createInvalidationPatterns.resource('collections')), createCollection);
router.put('/:id', authenticate, invalidateCache((req) => [`cache:*:*/collections*`, `cache:*:*/collections/${req.params.id}*`]), updateCollection);
router.delete('/:id', authenticate, invalidateCache((req) => [`cache:*:*/collections*`, `cache:*:*/collections/${req.params.id}*`]), deleteCollection);

export default router;