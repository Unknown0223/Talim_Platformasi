import { Router } from 'express';
import { getChildStats, getChildAttendance, getChildren } from '../controllers/parentController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware, roleCheck('parent', 'admin'));

router.get('/children', getChildren);
router.get('/child-stats/:childId', getChildStats);
router.get('/child-attendance/:childId', getChildAttendance);

export default router;
