import { Router } from 'express';
import { getLessonsByCourse, createLesson } from '../controllers/lessonController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = Router();
router.get('/course/:courseId', getLessonsByCourse);
router.post('/', authMiddleware, roleCheck('teacher', 'admin'), createLesson);
export default router;
