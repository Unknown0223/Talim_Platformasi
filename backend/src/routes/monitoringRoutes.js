import express from 'express';
import { getActiveClasses, getOnlineUsers } from '../controllers/monitoringController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, roleCheck('admin', 'teacher', 'receptionist'));

// Admin yoki ruxsatli xodimlar uchun
router.get('/active-classes', getActiveClasses);
router.get('/online', getOnlineUsers);

export default router;
