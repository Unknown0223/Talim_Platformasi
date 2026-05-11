import { Router } from 'express';
import { completeCourse, getMyCertificates, downloadCertificate } from '../controllers/certificateController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
router.post('/complete', completeCourse);
router.get('/my', getMyCertificates);
router.get('/:id/download', authMiddleware, downloadCertificate);
export default router;
