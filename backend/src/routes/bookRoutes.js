import { Router } from 'express';
import * as bookController from '../controllers/bookController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = Router();

// Reading Progress
router.get('/progress/:bookId', authMiddleware, bookController.getProgress);
router.post('/progress', authMiddleware, bookController.saveProgress);

router.get('/', bookController.listBooks);
router.post('/', authMiddleware, roleCheck('admin'), bookController.addBook);
router.put('/:id', authMiddleware, roleCheck('admin'), bookController.updateBook);
router.delete('/:id', authMiddleware, roleCheck('admin'), bookController.deleteBook);
router.get('/:id/download', bookController.downloadBook);

export default router;
