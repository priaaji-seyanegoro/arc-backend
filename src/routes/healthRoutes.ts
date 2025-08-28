import { Router } from 'express';
import { healthCheck, liveness, readiness } from '../controllers/healthController';

const router = Router();

/**
 * @route GET /api/health
 * @desc Comprehensive health check
 * @access Public
 */
router.get('/', healthCheck);

/**
 * @route GET /api/health/live
 * @desc Liveness probe - checks if service is running
 * @access Public
 */
router.get('/live', liveness);

/**
 * @route GET /api/health/ready
 * @desc Readiness probe - checks if service is ready to accept traffic
 * @access Public
 */
router.get('/ready', readiness);

export default router;