const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  teacher: [
    "course.view",
    "course.stats.view",
    "course.create",
    "course.edit",
    "message.send",
    "message.invite",
    "message.upload_media",
    "message.group_create",
    "message.call",
    "attendance.mark",
  ],
  cashier: [
    "course.view",
    "course.stats.view",
    "course.edit_price",
    "payment.view",
    "payment.confirm",
    "payment.discounted_confirm",
    "payment.analytics",
    "discount.view",
    "discount.apply",
    "message.send",
    "message.invite",
    "message.upload_media",
    "message.call",
  ],
  receptionist: [
    "course.view",
    "message.send",
    "message.invite",
    "message.upload_media",
    "message.call",
    "attendance.mark",
    "student.manage",
    "location.manage",
  ],
  student: ["course.view", "discount.view", "message.send", "message.invite", "message.upload_media", "message.call"],
  parent: ["message.send"],
};

export function effectivePermissions(user: any): string[] {
  if (!user) return [];
  if (user.role === "admin") return ["*"];
  const rolePermissions = Array.isArray(user.rolePermissions)
    ? user.rolePermissions
    : DEFAULT_PERMISSIONS[String(user.role)] || [];
  const extraPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  return Array.from(new Set([...rolePermissions, ...extraPermissions]));
}

export function hasPermission(user: any, permission: string) {
  const permissions = effectivePermissions(user);
  return permissions.includes("*") || permissions.includes(permission);
}
