import { Router } from 'express';
import { getSchedules, createSchedule } from '../controllers/scheduleController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = Router();
router.get('/', getSchedules);
router.post('/', authMiddleware, roleCheck('teacher', 'admin'), createSchedule);
export default router;
