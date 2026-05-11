import express from 'express';
import { getSettings, updateSetting, getSettingByKey, getPublicSettings } from '../controllers/settingController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';

const router = express.Router();

router.get('/public', getPublicSettings);
router.get('/', authMiddleware, roleCheck('admin'), getSettings);
router.get('/:key', authMiddleware, roleCheck('admin'), getSettingByKey);
router.post('/', authMiddleware, roleCheck('admin'), updateSetting);

export default router;
