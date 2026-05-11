import { Router } from 'express';
import { enrollCourse, getMyEnrollments } from '../controllers/enrollController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireTelegramSubscription } from '../middleware/telegramCheck.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requireTelegramSubscription, enrollCourse);
router.get('/my', authMiddleware, getMyEnrollments);
export default router;
