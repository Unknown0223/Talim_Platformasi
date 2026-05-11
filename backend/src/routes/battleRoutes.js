import { Router } from 'express';
import { createBattle, joinBattle, getBattle, submitBattle } from '../controllers/battleController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.post('/create', authMiddleware, createBattle);
router.post('/join', authMiddleware, joinBattle);
router.get('/:code', authMiddleware, getBattle);
router.post('/:code/submit', authMiddleware, submitBattle);
export default router;
