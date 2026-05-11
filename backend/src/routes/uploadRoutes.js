import { Router } from 'express';
import { uploadAvatar, uploadBrandingAsset, uploadTeacherCover } from '../controllers/uploadController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.post('/cover', authMiddleware, upload.single('cover'), uploadTeacherCover);
router.post('/branding', authMiddleware, roleCheck('admin'), upload.single('asset'), uploadBrandingAsset);

export default router;
