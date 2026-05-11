import { Router } from 'express';
import { markAttendance, getAttendanceByDate, getMyAttendance, getCourseAttendance } from '../controllers/attendanceController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = Router();

router.get('/list', authMiddleware, roleCheck('teacher', 'admin', 'receptionist'), getAttendanceByDate);
router.get('/course', authMiddleware, roleCheck('teacher', 'admin', 'receptionist'), getCourseAttendance);
router.post('/mark', authMiddleware, roleCheck('teacher', 'admin', 'receptionist'), markAttendance);
router.get('/my', authMiddleware, getMyAttendance);

export default router;
