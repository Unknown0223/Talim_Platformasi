import { Router } from 'express';
import { askReceptionAI } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/reception-ask', authMiddleware, askReceptionAI);

export default router;
