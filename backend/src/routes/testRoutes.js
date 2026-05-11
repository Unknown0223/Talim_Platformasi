import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { getTestsBySubject, submitTest, getGuestRandomTests, getGuestSubjectTests, submitGuestTest, createTest, updateTest, deleteTest, getGuestPlacementQuestions, submitGuestPlacement, listTeacherQuestions, downloadTestTemplate, importTests, exportTests } from '../controllers/testController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import { requireTelegramSubscription } from '../middleware/telegramCheck.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 daqiqa
  max: 20, // 20 javob
  message: 'Juda ko\'p test yuborildi. 10 daqiqadan so\'ng qayta urinib ko\'ring.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Guest routes (no auth required)
router.get('/guest/random', getGuestRandomTests);
router.get('/guest/subject/:subjectId', getGuestSubjectTests);
router.post('/guest/submit', submissionLimiter, submitGuestTest);
router.get('/guest/placement', getGuestPlacementQuestions);
router.post('/guest/placement/submit', submissionLimiter, submitGuestPlacement);

// Protected routes
router.get('/manage/questions', authMiddleware, roleCheck('admin', 'teacher'), listTeacherQuestions);
router.get('/template/download', authMiddleware, roleCheck('admin', 'teacher'), downloadTestTemplate);
router.post('/import/questions', authMiddleware, roleCheck('admin', 'teacher'), upload.single('file'), importTests);
router.get('/export/questions', authMiddleware, roleCheck('admin', 'teacher'), exportTests);
router.get('/:subjectId', authMiddleware, getTestsBySubject);
router.post('/submit', authMiddleware, requireTelegramSubscription, submissionLimiter, submitTest);

// Admin/Teacher test management
router.post('/', authMiddleware, roleCheck('admin', 'teacher'), createTest);
router.put('/:id', authMiddleware, roleCheck('admin', 'teacher'), updateTest);
router.delete('/:id', authMiddleware, roleCheck('admin', 'teacher'), deleteTest);

export default router;
