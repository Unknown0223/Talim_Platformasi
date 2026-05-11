const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "");

function getToken() {
  return localStorage.getItem("token");
}

let onAuthExpired: null | (() => void) = null;

export function setAuthExpiredCallback(cb: null | (() => void)) {
  onAuthExpired = cb;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Tarmoq xatosi: serverga ulanib bo'lmadi");
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onAuthExpired?.();
    throw new Error("Sessiya muddati tugagan. Iltimos, qayta kiring.");
  }

  if (!res.ok) throw new Error((data && data.message) || res.statusText);
  return data as T;
}

export async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onAuthExpired?.();
    throw new Error("Sessiya muddati tugagan. Iltimos, qayta kiring.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data && data.message) || res.statusText);
  }
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type AuthUser = {
  id?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  telegramId?: string | null;
  avatar?: string | null;
  nameEmoji?: string | null;
  nameEmojiAnim?: string | null;
  permissions?: string[];
  permissionsOverride?: boolean;
};

export const auth = {
  register: (body: any) =>
    request<{ user: AuthUser; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: any) =>
    request<{ user: AuthUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMe: () => request<AuthUser>("/api/auth/me"),
  updateMe: (body: {
    firstName?: string;
    lastName?: string;
    name?: string;
    birthDate?: string;
    nameEmoji?: string | null;
    nameEmojiAnim?: string | null;
    avatar?: string | null;
  }) => request<AuthUser>("/api/auth/me", { method: "PUT", body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("/api/auth/me/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  telegramLink: () => request<{ code: string }>("/api/auth/telegram/link", { method: "POST" }),
};

export const subjects = {
  list: () => request<Array<{ id?: string; _id?: string; name: string }>>("/api/subjects"),
};

export type Course = {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  type?: "online" | "offline";
  level?: string;
  price?: number;
  subjectId?: { id?: string; _id?: string; name: string };
  teacherId?: { id?: string; _id?: string; name: string };
  subject?: { id: string; name: string };
  teacher?: { id: string; name: string };
  icon?: string | null;
  imageUrl?: string | null;
  color?: string | null;
};

export const courses = {
  list: (params?: { subjectId?: string; level?: string; type?: string; q?: string }) => {
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v != null && String(v).trim() !== ""),
    );
    const qs = new URLSearchParams(clean as any).toString();
    return request<Course[]>("/api/courses" + (qs ? `?${qs}` : ""));
  },
  get: (id: string) => request<Course>(`/api/courses/${id}`),
  stats: (id: string) => request<any>(`/api/courses/${id}/stats`),
  update: (id: string, body: any) =>
    request<Course>(`/api/courses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  updatePrice: (id: string, price: number) =>
    request<Course>(`/api/courses/${id}/price`, { method: "PATCH", body: JSON.stringify({ price }) }),
  students: (id: string) => request<any[]>(`/api/courses/${id}/students`),
};

export const teachers = {
  list: () => request<any[]>("/api/teachers"),
  get: (id: string) => request<any>(`/api/teachers/${id}`),
  addReview: (teacherId: string, body: { rating: number; comment?: string }) =>
    request<any>(`/api/teachers/${teacherId}/review`, { method: "POST", body: JSON.stringify(body) }),
};

export const library = {
  list: () => request<any[]>("/api/library"),
};

export const locations = {
  list: () => request<any[]>("/api/locations"),
};

export const tests = {
  guestSubject: (subjectId: string, params?: { count?: number }) =>
    request<any[]>(`/api/tests/guest/subject/${subjectId}${params?.count ? `?${new URLSearchParams({ count: String(params.count) })}` : ""}`),
  guestSubmit: (body: any) =>
    request<any>("/api/tests/guest/submit", { method: "POST", body: JSON.stringify(body) }),
  placementQuestions: (params?: { count?: number; subjectIds?: string[] }) => {
    const qs = new URLSearchParams();
    if (params?.count != null) qs.set("count", String(params.count));
    if (params?.subjectIds?.length) qs.set("subjectIds", params.subjectIds.join(","));
    return request<any[]>(`/api/tests/guest/placement${qs.toString() ? `?${qs.toString()}` : ""}`);
  },
  placementSubmit: (body: any) =>
    request<any>("/api/tests/guest/placement/submit", { method: "POST", body: JSON.stringify(body) }),
  bySubject: (subjectId: string) => request<any[]>(`/api/tests/${subjectId}`),
  submit: (body: any) =>
    request<any>("/api/tests/submit", { method: "POST", body: JSON.stringify(body) }),
  manageQuestions: (params?: { courseId?: string }) =>
    request<any[]>(`/api/tests/manage/questions${params?.courseId ? `?${new URLSearchParams({ courseId: params.courseId })}` : ""}`),
  create: (body: any) =>
    request<any>("/api/tests", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) => request<any>(`/api/tests/${id}`, { method: "DELETE" }),
  template: () => requestBlob("/api/tests/template/download"),
  exportQuestions: (courseId?: string) =>
    requestBlob(`/api/tests/export/questions${courseId ? `?${new URLSearchParams({ courseId })}` : ""}`),
  importQuestions: (file: File, courseId?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (courseId) fd.append("courseId", courseId);
    return request<any>("/api/tests/import/questions", { method: "POST", body: fd });
  },
};

export const battle = {
  create: (body: any) =>
    request<any>("/api/battle/create", { method: "POST", body: JSON.stringify(body) }),
  join: (code: string) =>
    request<any>("/api/battle/join", { method: "POST", body: JSON.stringify({ code }) }),
  get: (code: string) => request<any>(`/api/battle/${code}`),
  submit: (code: string, body: any) =>
    request<any>(`/api/battle/${code}/submit`, { method: "POST", body: JSON.stringify(body) }),
};

export const payments = {
  pending: () => request<any[]>("/api/payment/pending"),
  list: (params?: { status?: string; q?: string; method?: string }) => {
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v != null && String(v).trim() !== ""),
    );
    const qs = new URLSearchParams(clean as any).toString();
    return request<any[]>("/api/payment/list" + (qs ? `?${qs}` : ""));
  },
  my: () => request<any[]>("/api/payment/my"),
  summary: () => request<any>("/api/payment/summary"),
  pickStudents: () => request<any[]>("/api/payment/pick/students"),
  create: (body: any) =>
    request<any>("/api/payment/create", { method: "POST", body: JSON.stringify(body) }),
  confirm: (paymentId: string) =>
    request<any>(`/api/payment/${paymentId}/confirm`, { method: "POST" }),
  byStudentId: (studentId: string) => request<any[]>(`/api/payment/student/${studentId}`),
};

export const discounts = {
  campaigns: () => request<any[]>("/api/discounts/campaigns"),
  createCampaign: (body: any) =>
    request<any>("/api/discounts/campaigns", { method: "POST", body: JSON.stringify(body) }),
  refresh: (id: string) => request<any>(`/api/discounts/campaigns/${id}/refresh`, { method: "POST" }),
  awards: (campaignId?: string, params?: { userId?: string; courseId?: string }) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v)) as Record<string, string>).toString();
    const base = campaignId ? `/api/discounts/campaigns/${campaignId}/awards` : "/api/discounts/awards";
    return request<any[]>(base + (qs ? `?${qs}` : ""));
  },
  manualAward: (campaignId: string, body: any) =>
    request<any>(`/api/discounts/campaigns/${campaignId}/awards`, { method: "POST", body: JSON.stringify(body) }),
  available: (params: { userId: string; courseId: string }) =>
    request<any>(`/api/discounts/available?${new URLSearchParams(params)}`),
};

export const admin = {
  stats: () => request<any>("/api/admin/stats"),
  paymentAnalytics: () => request<any>("/api/admin/analytics/payments"),
  users: () => request<any[]>("/api/admin/users"),
  permissionDefinitions: () => request<any>("/api/admin/permissions/definitions"),
  createUser: (body: any) =>
    request<any>("/api/admin/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id: string, body: any) =>
    request<any>(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  updateRolePermissions: (role: string, permissions: string[]) =>
    request<any>(`/api/admin/permissions/roles/${role}`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),
  updateUserPermissions: (id: string, permissions: string[]) =>
    request<any>(`/api/admin/users/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),
  resetUserPermissions: (id: string) =>
    request<any>(`/api/admin/users/${id}/permissions`, { method: "DELETE" }),
  deleteUser: (id: string) => request<any>(`/api/admin/users/${id}`, { method: "DELETE" }),
  parentLinks: (params?: { parentId?: string; childId?: string }) => {
    const search = new URLSearchParams();
    if (params?.parentId) search.set("parentId", params.parentId);
    if (params?.childId) search.set("childId", params.childId);
    const qs = search.toString();
    return request<any[]>(`/api/admin/parent-links${qs ? `?${qs}` : ""}`);
  },
  linkParentChild: (parentId: string, childId: string) =>
    request<any>("/api/admin/parent-links", {
      method: "POST",
      body: JSON.stringify({ parentId, childId }),
    }),
  unlinkParentChild: (parentId: string, childId: string) =>
    request<any>(`/api/admin/parent-links/${parentId}/${childId}`, { method: "DELETE" }),
  updateBrand: (body: any) =>
    request<any>("/api/admin/brand", { method: "PUT", body: JSON.stringify(body) }),
  news: () => request<any[]>("/api/admin/news"),
  createNews: (body: any) =>
    request<any>("/api/admin/news", { method: "POST", body: JSON.stringify(body) }),
  updateNews: (id: string, body: any) =>
    request<any>(`/api/admin/news/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteNews: (id: string) => request<any>(`/api/admin/news/${id}`, { method: "DELETE" }),
  sendNotification: (body: any) =>
    request<any>("/api/admin/notifications/send", { method: "POST", body: JSON.stringify(body) }),
  export: (type: string) => requestBlob(`/api/admin/export/${type}`),
  createSubject: (body: any) =>
    request<any>("/api/admin/subjects", { method: "POST", body: JSON.stringify(body) }),
  createLocation: (body: any) =>
    request<any>("/api/admin/locations", { method: "POST", body: JSON.stringify(body) }),
};

export const settings = {
  public: () => request<any>("/api/settings/public"),
};

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  type?: string;
  icon?: string | null;
  color?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  audienceRoles: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  priority?: number;
  isPublished?: boolean;
  requiresParticipation?: boolean;
  maxParticipants?: number | null;
  prize?: string | null;
  participantsCount?: number;
  isJoined?: boolean;
  limitReached?: boolean;
  expired?: boolean;
  recentParticipants?: Array<{
    id: string;
    userId: string;
    joinedAt: string;
    isWinner: boolean;
    user: { id: string; name: string; avatar?: string | null } | null;
  }>;
};

export const news = {
  active: () => request<NewsItem[]>("/api/news/active"),
  list: () => request<NewsItem[]>("/api/news"),
  create: (body: Partial<NewsItem>) =>
    request<NewsItem>("/api/news", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<NewsItem>) =>
    request<NewsItem>(`/api/news/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ ok: true }>(`/api/news/${id}`, { method: "DELETE" }),
  join: (id: string) =>
    request<NewsItem>(`/api/news/${id}/join`, { method: "POST" }),
  leave: (id: string) =>
    request<NewsItem>(`/api/news/${id}/leave`, { method: "DELETE" }),
  participants: (id: string) =>
    request<Array<{ id: string; userId: string; joinedAt: string; isWinner: boolean; user: any }>>(
      `/api/news/${id}/participants`,
    ),
  pickWinners: (id: string, count: number) =>
    request<NewsItem>(`/api/news/${id}/pick-winners`, {
      method: "POST",
      body: JSON.stringify({ count }),
    }),
};

export const notifications = {
  list: () => request<any>("/api/notifications"),
  read: (id: string) => request<any>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  readAll: () => request<any>("/api/notifications/read-all", { method: "PATCH" }),
};

export const parent = {
  children: () => request<any[]>("/api/parent/children"),
  childStats: (childId: string) => request<any>(`/api/parent/child-stats/${childId}`),
  childAttendance: (childId: string) => request<any[]>(`/api/parent/child-attendance/${childId}`),
};

export const messages = {
  contacts: () => request<any[]>("/api/messages/contacts"),
  searchUsers: (q: string) => request<any[]>(`/api/messages/search?${new URLSearchParams({ q })}`),
  invites: () => request<any>("/api/messages/invites"),
  createInvite: (body: { receiverId: string; message?: string }) =>
    request<any>("/api/messages/invites", { method: "POST", body: JSON.stringify(body) }),
  respondInvite: (inviteId: string, action: "accept" | "reject") =>
    request<any>(`/api/messages/invites/${inviteId}/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  createGroup: (body: { title: string; memberIds?: string[] }) =>
    request<any>("/api/messages/groups", { method: "POST", body: JSON.stringify(body) }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<any>("/api/messages/upload", { method: "POST", body: fd });
  },
  history: (otherUserId: string) => request<any[]>(`/api/messages/history/${otherUserId}`),
  send: (body: any) =>
    request<{ ok?: boolean; message?: string }>("/api/messages/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createCall: (body: any) =>
    request<any>("/api/messages/calls", { method: "POST", body: JSON.stringify(body) }),
  updateCall: (callId: string, body: any) =>
    request<any>(`/api/messages/calls/${callId}`, { method: "PATCH", body: JSON.stringify(body) }),
};

export const attendance = {
  my: () => request<any[]>("/api/attendance/my"),
  list: (params: Record<string, string>) =>
    request<any[]>(`/api/attendance/list?${new URLSearchParams(params)}`),
  mark: (body: any) =>
    request<any>("/api/attendance/mark", { method: "POST", body: JSON.stringify(body) }),
};

export const dashboard = {
  student: () => request<any>("/api/dashboard/student"),
  teacher: () => request<any>("/api/dashboard/teacher"),
};

export const studyPlan = {
  get: () => request<any>("/api/study-plan"),
};

export const schedule = {
  list: (params?: { courseId?: string; locationId?: string }) => {
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v != null && String(v).trim() !== ""),
    );
    const qs = new URLSearchParams(clean as any).toString();
    return request<any[]>("/api/schedule" + (qs ? `?${qs}` : ""));
  },
  create: (body: any) =>
    request<any>("/api/schedule", { method: "POST", body: JSON.stringify(body) }),
};

export const uploads = {
  avatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return request<any>("/api/uploads/avatar", { method: "POST", body: fd });
  },
  cover: (file: File) => {
    const fd = new FormData();
    fd.append("cover", file);
    return request<any>("/api/uploads/cover", { method: "POST", body: fd });
  },
};

export const enroll = {
  create: (body: { courseId: string }) =>
    request<any>("/api/enroll", { method: "POST", body: JSON.stringify(body) }),
  my: () => request<any[]>("/api/enroll/my"),
};

export type FeedbackItem = {
  id: string;
  userId: string;
  type: "suggestion" | "complaint" | "question" | "praise";
  category: "general" | "teacher" | "course" | "center" | "system" | "payment";
  subject: string;
  body: string;
  status: "new" | "in_review" | "resolved" | "rejected";
  priority: "low" | "normal" | "high";
  isAnonymous: boolean;
  targetUserId?: string | null;
  targetCourseId?: string | null;
  adminResponse?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email?: string | null; role?: string; avatar?: string | null } | null;
  targetUser?: { id: string; name: string; email?: string | null; role?: string } | null;
  targetCourse?: { id: string; title: string } | null;
  respondedBy?: { id: string; name: string; email?: string | null; role?: string } | null;
};

export type FeedbackInput = {
  type?: FeedbackItem["type"];
  category?: FeedbackItem["category"];
  subject: string;
  body: string;
  priority?: FeedbackItem["priority"];
  isAnonymous?: boolean;
  targetUserId?: string | null;
  targetCourseId?: string | null;
};

export const feedback = {
  my: () => request<FeedbackItem[]>("/api/feedback/my"),
  create: (body: FeedbackInput) =>
    request<FeedbackItem>("/api/feedback", { method: "POST", body: JSON.stringify(body) }),
  list: (params?: { status?: string; type?: string; category?: string; q?: string }) => {
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v != null && String(v).trim() !== ""),
    );
    const qs = new URLSearchParams(clean as any).toString();
    return request<FeedbackItem[]>("/api/feedback" + (qs ? `?${qs}` : ""));
  },
  stats: () =>
    request<{
      total: number;
      newCount: number;
      inReviewCount: number;
      resolvedCount: number;
      rejectedCount: number;
      byType: Record<string, number>;
    }>("/api/feedback/stats"),
  update: (id: string, body: { status?: FeedbackItem["status"]; adminResponse?: string; priority?: FeedbackItem["priority"] }) =>
    request<FeedbackItem>(`/api/feedback/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => request<{ ok: boolean }>(`/api/feedback/${id}`, { method: "DELETE" }),
};

export const rankings = {
  teachers: () => request<any[]>("/api/rankings/teachers"),
  course: (courseId: string) => request<any[]>(`/api/rankings/course/${courseId}`),
  students: (params?: { limit?: number; subjectId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.subjectId) qs.set("subjectId", String(params.subjectId));
    return request<any[]>(`/api/rankings/students${qs.toString() ? `?${qs.toString()}` : ""}`);
  },
};

