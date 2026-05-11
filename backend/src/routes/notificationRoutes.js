import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', authMiddleware, listMyNotifications);
router.patch('/read-all', authMiddleware, markAllNotificationsRead);
router.patch('/:id/read', authMiddleware, markNotificationRead);

export default router;
