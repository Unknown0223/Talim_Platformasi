import { Router } from 'express';
import { getStudyPlan } from '../controllers/studyPlanController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.get('/', authMiddleware, getStudyPlan);
export default router;
