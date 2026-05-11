import { Router } from 'express';
import { getTeachersList, getTeacherDetail, addReview } from '../controllers/teacherController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', getTeachersList);
router.get('/:id', getTeacherDetail);
router.post('/:teacherId/review', authMiddleware, addReview);

export default router;
