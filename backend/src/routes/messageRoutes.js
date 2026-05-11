import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { sendMessage, getChatHistory, getContacts, searchUsers, createInvite, listInvites, respondInvite, createGroup, createCallSession, updateCallSession } from '../controllers/messageController.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();
const uploadDir = path.join(process.cwd(), 'uploads', 'messages');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.\-]+/g, '_')}`),
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get('/contacts', authMiddleware, getContacts);
router.get('/search', authMiddleware, searchUsers);
router.get('/invites', authMiddleware, listInvites);
router.post('/invites', authMiddleware, requirePermission('message.invite'), createInvite);
router.post('/invites/:inviteId/respond', authMiddleware, respondInvite);
router.post('/groups', authMiddleware, requirePermission('message.group_create'), createGroup);
router.post('/calls', authMiddleware, requirePermission('message.call'), createCallSession);
router.patch('/calls/:callId', authMiddleware, requirePermission('message.call'), updateCallSession);
router.post('/upload', authMiddleware, requirePermission('message.upload_media'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Fayl talab qilinadi' });
  res.status(201).json({
    name: req.file.originalname,
    url: `/uploads/messages/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
});
router.post('/send', authMiddleware, requirePermission('message.send'), sendMessage);
router.get('/history/:otherUserId', authMiddleware, getChatHistory);

export default router;
