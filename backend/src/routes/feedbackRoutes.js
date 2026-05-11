import { Router } from 'express';
import {
  createFeedback,
  listMyFeedback,
  listAllFeedback,
  feedbackStats,
  updateFeedback,
  deleteFeedback,
} from '../controllers/feedbackController.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/my', requirePermission('feedback.submit'), listMyFeedback);
router.post('/', requirePermission('feedback.submit'), createFeedback);

router.get('/', requirePermission('feedback.manage'), listAllFeedback);
router.get('/stats', requirePermission('feedback.manage'), feedbackStats);
router.patch('/:id', requirePermission('feedback.manage'), updateFeedback);
router.delete('/:id', deleteFeedback);

export default router;
