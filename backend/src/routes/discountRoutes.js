import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import {
  availableDiscountForPayment,
  createDiscountCampaign,
  listDiscountAwards,
  listDiscountCampaigns,
  refreshDiscountAwards,
  upsertManualAward,
} from '../controllers/discountController.js';

const router = Router();

router.use(authMiddleware);
router.get('/campaigns', requirePermission('discount.view'), listDiscountCampaigns);
router.post('/campaigns', requirePermission('discount.manage'), createDiscountCampaign);
router.post('/campaigns/:id/refresh', requirePermission('discount.manage'), refreshDiscountAwards);
router.get('/campaigns/:id/awards', requirePermission('discount.view'), listDiscountAwards);
router.post('/campaigns/:id/awards', requirePermission('discount.override'), upsertManualAward);
router.get('/awards', requirePermission('discount.view'), listDiscountAwards);
router.get('/available', requirePermission('discount.apply'), availableDiscountForPayment);

export default router;
