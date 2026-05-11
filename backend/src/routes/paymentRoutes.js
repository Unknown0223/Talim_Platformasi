import { Router } from 'express';
import { createPayment, confirmPayment, getPendingPayments, getPaymentsByStudentId, listStudentsForPayment, getPaymentSummary, getMyPayments, listPayments } from '../controllers/paymentController.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/pending', authMiddleware, getPendingPayments);
router.get('/list', authMiddleware, requirePermission('payment.view'), listPayments);
router.get('/my', authMiddleware, getMyPayments);
router.get('/summary', authMiddleware, requirePermission('payment.analytics'), getPaymentSummary);
router.get('/pick/students', authMiddleware, requirePermission('payment.view'), listStudentsForPayment);
router.post('/create', authMiddleware, createPayment);
router.post('/:paymentId/confirm', authMiddleware, confirmPayment);
router.get('/student/:studentId', authMiddleware, getPaymentsByStudentId);

export default router;
