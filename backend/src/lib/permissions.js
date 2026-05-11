export const PERMISSIONS = [
  { key: 'course.view', label: 'Kurslarni ko‘rish', group: 'Kurslar', icon: '📚', roles: ['admin', 'teacher', 'cashier', 'receptionist', 'student'] },
  { key: 'course.stats.view', label: 'Kurs statistikalarini ko‘rish', group: 'Kurslar', icon: '📊', roles: ['admin', 'teacher', 'cashier'] },
  { key: 'course.create', label: 'Kurs yaratish', group: 'Kurslar', icon: '➕', roles: ['admin', 'teacher'] },
  { key: 'course.edit', label: 'Kurs tahrirlash', group: 'Kurslar', icon: '✏️', roles: ['admin', 'teacher'] },
  { key: 'course.edit_price', label: 'Kurs narxini o‘zgartirish', group: 'Kurslar', icon: '💰', roles: ['admin', 'cashier'] },
  { key: 'course.delete', label: 'Kurs o‘chirish', group: 'Kurslar', icon: '🗑️', roles: ['admin'] },
  { key: 'payment.view', label: 'To‘lovlarni ko‘rish', group: 'To‘lov', icon: '💳', roles: ['admin', 'cashier'] },
  { key: 'payment.confirm', label: 'To‘lov tasdiqlash', group: 'To‘lov', icon: '✅', roles: ['admin', 'cashier'] },
  { key: 'payment.discounted_confirm', label: 'Chegirmali to‘lov tasdiqlash', group: 'To‘lov', icon: '🏷️', roles: ['admin', 'cashier'] },
  { key: 'payment.refund', label: 'To‘lov qaytarish', group: 'To‘lov', icon: '↩️', roles: ['admin'] },
  { key: 'payment.analytics', label: 'To‘lov analitikasi', group: 'To‘lov', icon: '📊', roles: ['admin', 'cashier'] },
  { key: 'discount.view', label: 'Chegirmalarni ko‘rish', group: 'Chegirma', icon: '🎟️', roles: ['admin', 'cashier', 'student'] },
  { key: 'discount.manage', label: 'Chegirma kampaniyalarini boshqarish', group: 'Chegirma', icon: '⚙️', roles: ['admin'] },
  { key: 'discount.override', label: 'Chegirma ro‘yxatini qo‘lda nazorat qilish', group: 'Chegirma', icon: '🧾', roles: ['admin'] },
  { key: 'discount.apply', label: 'Chegirmani to‘lovga qo‘llash', group: 'Chegirma', icon: '🏷️', roles: ['admin', 'cashier'] },
  { key: 'message.send', label: 'Xabar yuborish', group: 'Chat', icon: '💬', roles: ['admin', 'teacher', 'cashier', 'receptionist', 'student', 'parent'] },
  { key: 'message.invite', label: 'Chat taklif yuborish', group: 'Chat', icon: '🤝', roles: ['admin', 'teacher', 'cashier', 'receptionist', 'student'] },
  { key: 'message.upload_media', label: 'Media/fayl yuborish', group: 'Chat', icon: '📎', roles: ['admin', 'teacher', 'cashier', 'receptionist', 'student'] },
  { key: 'message.group_create', label: 'Group chat yaratish', group: 'Chat', icon: '👥', roles: ['admin', 'teacher'] },
  { key: 'message.call', label: 'Audio/video call', group: 'Chat', icon: '📞', roles: ['admin', 'teacher', 'cashier', 'receptionist', 'student'] },
  { key: 'notification.send', label: 'Bildirishnoma yuborish', group: 'Bildirishnoma', icon: '🔔', roles: ['admin'] },
  { key: 'notification.read_all', label: 'Barcha bildirishnomalar', group: 'Bildirishnoma', icon: '📨', roles: ['admin'] },
  { key: 'brand.manage', label: 'Brand sozlash', group: 'Sozlamalar', icon: '🎨', roles: ['admin'] },
  { key: 'news.manage', label: 'Yangiliklar boshqarish', group: 'Yangiliklar', icon: '📰', roles: ['admin'] },
  { key: 'news.participate', label: 'Tanlov/sovrinli tadbirda qatnashish', group: 'Yangiliklar', icon: '🎯', roles: ['admin', 'teacher', 'cashier', 'receptionist', 'student', 'parent'] },
  { key: 'settings.manage', label: 'Tizim sozlamalari', group: 'Sozlamalar', icon: '⚙️', roles: ['admin'] },
  { key: 'attendance.mark', label: 'Davomat belgilash', group: 'O‘quv jarayoni', icon: '📅', roles: ['admin', 'teacher', 'receptionist'] },
  { key: 'student.manage', label: 'Talabalarni boshqarish', group: 'Foydalanuvchi', icon: '🎓', roles: ['admin', 'receptionist'] },
  { key: 'teacher.approve', label: 'Ustoz tasdiqlash', group: 'Foydalanuvchi', icon: '🧑‍🏫', roles: ['admin'] },
  { key: 'location.manage', label: 'Binolar/filiallar', group: 'Joylar', icon: '📍', roles: ['admin', 'receptionist'] },
  { key: 'subject.manage', label: 'Fanlar boshqarish', group: 'Fanlar', icon: '🧩', roles: ['admin'] },
  { key: 'feedback.submit', label: 'Taklif/shikoyat yuborish', group: 'Aloqa', icon: '📝', roles: ['admin', 'teacher', 'cashier', 'receptionist', 'student', 'parent'] },
  { key: 'feedback.manage', label: 'Taklif/shikoyatlarni boshqarish', group: 'Aloqa', icon: '🛡️', roles: ['admin'] },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export function defaultPermissionsForRole(role) {
  if (role === 'admin') return PERMISSION_KEYS;
  return PERMISSIONS.filter((p) => p.roles.includes(role)).map((p) => p.key);
}

export const ROLE_PERMISSION_SETTING_KEY = 'rolePermissions';

export const SYSTEM_ROLES = ['admin', 'teacher', 'cashier', 'receptionist', 'student', 'parent'];

export function defaultRolePermissionPresets() {
  return Object.fromEntries(SYSTEM_ROLES.map((role) => [role, defaultPermissionsForRole(role)]));
}

export async function getRolePermissionPresets(prisma) {
  const defaults = defaultRolePermissionPresets();
  const setting = await prisma.setting.findUnique({ where: { key: ROLE_PERMISSION_SETTING_KEY } }).catch(() => null);
  const saved = setting?.value && typeof setting.value === 'object' ? setting.value : {};
  return Object.fromEntries(
    SYSTEM_ROLES.map((role) => [
      role,
      normalizePermissions(Array.isArray(saved?.[role]) ? saved[role] : defaults[role]),
    ]),
  );
}

export function normalizePermissions(values = []) {
  const input = Array.isArray(values) ? values : [];
  return Array.from(new Set(input.map(String).filter((key) => PERMISSION_KEYS.includes(key))));
}

export function userHasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const rolePermissions = Array.isArray(user.rolePermissions)
    ? user.rolePermissions
    : defaultPermissionsForRole(user.role);
  const extraPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  return [...rolePermissions, ...extraPermissions].includes(permission);
}

export function effectivePermissionsForUser(user) {
  if (!user) return [];
  if (user.role === 'admin') return PERMISSION_KEYS;
  const rolePermissions = Array.isArray(user.rolePermissions)
    ? user.rolePermissions
    : defaultPermissionsForRole(user.role);
  return normalizePermissions([...rolePermissions, ...(Array.isArray(user.permissions) ? user.permissions : [])]);
}
