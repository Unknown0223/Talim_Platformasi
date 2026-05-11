import { Router } from 'express';
import { getCourseLeaderboard, getTeacherRanking, getStudentRanking } from '../controllers/rankingController.js';

const router = Router();

// Guest ham ko'ra oladi (marketing + qiziqtirish uchun)
router.get('/course/:courseId', getCourseLeaderboard);
router.get('/teachers', getTeacherRanking);
router.get('/students', getStudentRanking);

export default router;
