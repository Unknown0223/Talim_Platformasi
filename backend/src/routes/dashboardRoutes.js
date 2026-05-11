import { Router } from 'express';
import { studentDashboard, teacherDashboard } from '../controllers/dashboardController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = Router();
router.get('/student', authMiddleware, roleCheck('student', 'admin'), studentDashboard);
router.get('/teacher', authMiddleware, roleCheck('teacher', 'admin'), teacherDashboard);
export default router;
