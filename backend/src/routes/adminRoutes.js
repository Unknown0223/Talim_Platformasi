import { Router } from 'express';
import { getUsers, getStats, getPaymentAnalytics, createSubject, createLocation, getReviews, updateUser, sendBroadcast, getNotificationStats, deleteUser, updateSubject, deleteSubject, updateLocation, deleteLocation, getAllSettings, updateSetting, createUser, getPermissionDefinitions, updateRolePermissions, updateUserPermissions, resetUserPermissions, updateBrand, listNews, createNews, updateNews, deleteNews, sendInAppNotification, listParentLinks, linkParentChild, unlinkParentChild } from '../controllers/adminController.js';
import { exportData, importData } from '../controllers/importController.js';
import { authMiddleware, roleCheck, requirePermission } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware, roleCheck('admin'));
router.get('/users', getUsers);
router.get('/stats', getStats);
router.get('/analytics/payments', getPaymentAnalytics);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.get('/permissions/definitions', getPermissionDefinitions);
router.put('/permissions/roles/:role', updateRolePermissions);
router.put('/users/:id/permissions', updateUserPermissions);
router.delete('/users/:id/permissions', resetUserPermissions);
router.delete('/users/:id', deleteUser);

// Ota-ona ↔ farzand bog'lanishlari
router.get('/parent-links', listParentLinks);
router.post('/parent-links', linkParentChild);
router.delete('/parent-links/:parentId/:childId', unlinkParentChild);

router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

router.post('/locations', createLocation);
router.put('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

router.get('/settings', getAllSettings);
router.post('/settings', updateSetting);
router.put('/brand', requirePermission('brand.manage'), updateBrand);

router.get('/news', requirePermission('news.manage'), listNews);
router.post('/news', requirePermission('news.manage'), createNews);
router.put('/news/:id', requirePermission('news.manage'), updateNews);
router.delete('/news/:id', requirePermission('news.manage'), deleteNews);

router.get('/reviews', getReviews);
router.post('/broadcast', sendBroadcast);
router.get('/notifications', getNotificationStats);
router.post('/notifications/send', requirePermission('notification.send'), sendInAppNotification);
router.post('/import/:type', upload.single('file'), importData);
router.get('/export/:type', exportData);
export default router;
