// Foydalanuvchini ko'rsatish uchun ortiqcha emas, lekin to'liq displayga yetarli
// minimal maydonlar to'plami. nameEmoji/nameEmojiAnim har doim qaytariladi.
export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  role: true,
  nameEmoji: true,
  nameEmojiAnim: true,
};

export const PUBLIC_USER_SELECT_WITH_EMAIL = {
  ...PUBLIC_USER_SELECT,
  email: true,
};
