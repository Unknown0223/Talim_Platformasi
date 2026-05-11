import { Router } from 'express';
import { getLocations, createLocation } from '../controllers/locationController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = Router();
router.get('/', getLocations);
router.post('/', authMiddleware, roleCheck('teacher', 'admin'), createLocation);
export default router;
