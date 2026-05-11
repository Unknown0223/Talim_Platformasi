import { Router } from 'express';
import {
  getActiveNews,
  listAllNews,
  createNews,
  updateNews,
  deleteNews,
  joinNews,
  leaveNews,
  listParticipants,
  pickWinners,
} from '../controllers/newsController.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/active', (req, res, next) => {
  if (!req.headers.authorization) return getActiveNews(req, res);
  return authMiddleware(req, res, () => getActiveNews(req, res, next));
});

router.get('/', authMiddleware, requirePermission('news.manage'), listAllNews);
router.post('/', authMiddleware, requirePermission('news.manage'), createNews);
router.patch('/:id', authMiddleware, requirePermission('news.manage'), updateNews);
router.delete('/:id', authMiddleware, requirePermission('news.manage'), deleteNews);

router.post('/:id/join', authMiddleware, requirePermission('news.participate'), joinNews);
router.delete('/:id/leave', authMiddleware, requirePermission('news.participate'), leaveNews);

router.get('/:id/participants', authMiddleware, requirePermission('news.manage'), listParticipants);
router.post('/:id/pick-winners', authMiddleware, requirePermission('news.manage'), pickWinners);

export default router;
