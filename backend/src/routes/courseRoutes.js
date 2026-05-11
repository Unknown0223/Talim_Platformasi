import { Router } from 'express';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseStudents, getCourseStats, updateCoursePrice } from '../controllers/courseController.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();
router.get('/', getCourses);
router.get('/:id/students', authMiddleware, requirePermission('student.manage'), getCourseStudents);
router.get('/:id/stats', authMiddleware, requirePermission('course.stats.view'), getCourseStats);
router.post('/', authMiddleware, requirePermission('course.create'), createCourse);
router.put('/:id', authMiddleware, updateCourse);
router.patch('/:id/price', authMiddleware, requirePermission('course.edit_price'), updateCoursePrice);
router.delete('/:id', authMiddleware, requirePermission('course.delete'), deleteCourse);
router.get('/:id', getCourseById);
export default router;
