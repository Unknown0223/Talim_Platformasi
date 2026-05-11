import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Layout, type Page, type Persona } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login, Register } from "./pages/Auth";
import { Courses, CourseDetail } from "./pages/Courses";
import { Teachers, TeacherProfile } from "./pages/Teachers";
import { Library } from "./pages/Library";
import { MapPage } from "./pages/MapPage";
import {
  StudentDashboard,
  TeacherDashboard,
  ParentPanel,
} from "./pages/Dashboards";
import { Admin, CashierPage } from "./pages/Admin";
import { Messages, Tests, StudyPlan, Attendance, Feedback } from "./pages/Misc";
import { Reception } from "./pages/Reception";
import { EduParticles } from "./components/EduParticles";
import { Card, Modal, Button, Input } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import { admin as adminApi, auth as authApi, courses as coursesApi, dashboard as dashboardApi, discounts as discountsApi, locations as locationsApi, messages as messagesApi, payments as paymentsApi, schedule as scheduleApi, teachers as teachersApi } from "./services/api";
import { cn } from "./utils/cn";
import { hasPermission } from "./utils/permissions";

function parseUzMoney(value: any) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function formatUzMoney(n: number | string) {
  const num = typeof n === "number" ? n : parseUzMoney(n);
  return num ? String(Math.max(0, Math.round(num))).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
}

function coursePaymentLabel(c: any) {
  const teacher = c?.teacher?.name || c?.teacherId?.name;
  return teacher ? `${c?.title || "Kurs"} — ${teacher}` : c?.title || "Kurs";
}

function courseSubjectName(c: any) {
  return c?.subject?.name || c?.subjectId?.name || "Fan";
}

function courseTeacherName(c: any) {
  return c?.teacher?.name || c?.teacherId?.name || "Ustoz";
}

function cashierCourseGroupKey(c: any) {
  return [
    String(courseSubjectName(c)).trim().toLowerCase(),
    String(c?.title || "").trim().toLowerCase(),
    String(c?.level || ""),
    String(c?.type || ""),
  ].join("|");
}

function cashierCourseGroupLabel(c: any) {
  const typeLabel = c?.type === "online" ? "Onlayn" : c?.type === "offline" ? "Oflayn" : c?.type || "Kurs";
  return `${courseSubjectName(c)} — ${c?.title || "Kurs"} (${typeLabel})`;
}

function pageToPath(p: Page): string {
  switch (p) {
    case "landing": return "/";
    case "login": return "/login";
    case "register": return "/register";
    case "courses": return "/courses";
    // course-detail requires an id; sidebar should not hardcode one
    case "course-detail": return "/courses";
    case "teachers": return "/teachers";
    case "library": return "/library";
    case "map": return "/map";
    case "student-dashboard": return "/dashboard";
    case "teacher-dashboard": return "/dashboard/teacher";
    case "admin": return "/admin";
    case "admin-access": return "/admin/access";
    case "admin-finance": return "/admin/finance";
    case "admin-users": return "/admin/users";
    case "cashier": return "/cashier";
    case "reception": return "/reception";
    case "messages": return "/messages";
    case "tests": return "/tests";
    case "study-plan": return "/study-plan";
    case "attendance": return "/attendance";
    case "parent": return "/parent";
    case "feedback": return "/feedback";
    default: return "/";
  }
}

function pathToPage(pathname: string): Page {
  if (pathname === "/") return "landing";
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/register")) return "register";
  if (pathname.startsWith("/courses/")) return "course-detail";
  if (pathname.startsWith("/courses")) return "courses";
  if (pathname.startsWith("/teachers")) return "teachers";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/dashboard/teacher")) return "teacher-dashboard";
  if (pathname.startsWith("/dashboard")) return "student-dashboard";
  if (pathname.startsWith("/admin/access")) return "admin-access";
  if (pathname.startsWith("/admin/finance")) return "admin-finance";
  if (pathname.startsWith("/admin/users")) return "admin-users";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/cashier")) return "cashier";
  if (pathname.startsWith("/reception")) return "reception";
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/tests")) return "tests";
  if (pathname.startsWith("/study-plan")) return "study-plan";
  if (pathname.startsWith("/attendance")) return "attendance";
  if (pathname.startsWith("/parent")) return "parent";
  if (pathname.startsWith("/feedback")) return "feedback";
  return "landing";
}

function CourseDetailWithPayment({
  onPay,
}: {
  onPay: (courseId: string) => void;
}) {
  const { id } = useParams();
  const courseId = id || "1";
  return (
    <div className="relative">
      <CourseDetail courseId={courseId} onPay={onPay} />
    </div>
  );
}

function RequireAuth({
  user,
  loading,
  children,
}: {
  user: any;
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading) return <Card className="p-6 text-slate-300">Sessiya tekshirilmoqda...</Card>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({
  user,
  loading,
  roles,
  children,
}: {
  user: any;
  loading: boolean;
  roles: string[];
  children: React.ReactNode;
}) {
  if (loading) return <Card className="p-6 text-slate-300">Sessiya tekshirilmoqda...</Card>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(String(user.role))) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequirePermission({
  user,
  loading,
  permission,
  children,
}: {
  user: any;
  loading: boolean;
  permission: string;
  children: React.ReactNode;
}) {
  if (loading) return <Card className="p-6 text-slate-300">Sessiya tekshirilmoqda...</Card>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasPermission(user, permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function homePathForRole(role?: string | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/dashboard/teacher";
    case "cashier":
      return "/cashier";
    case "receptionist":
      return "/reception";
    case "parent":
      return "/parent";
    default:
      return "/dashboard";
  }
}

function StudentDashboardRoute({
  user,
  loading,
  children,
}: {
  user: any;
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading) return <Card className="p-6 text-slate-300">Sessiya tekshirilmoqda...</Card>;
  if (!user) return <Navigate to="/login" replace />;
  const role = String(user.role || "");
  if (role !== "student" && role !== "admin") {
    return <Navigate to={homePathForRole(role)} replace />;
  }
  return <>{children}</>;
}

function AppShell() {
  const location = useLocation();
  const navigateRR = useNavigate();

  const page = useMemo(() => pathToPage(location.pathname), [location.pathname]);
  const adminSection = useMemo(() => {
    if (location.pathname.startsWith("/admin/access")) return "access";
    if (location.pathname.startsWith("/admin/finance")) return "finance";
    if (location.pathname.startsWith("/admin/users")) return "users";
    return "overview";
  }, [location.pathname]);
  const { user, loading: authLoading } = useAuth();
  const [persona, setPersona] = useState<Persona>("guest");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Global Interactive Modal States
  const [activeModal, setActiveModal] = useState<
    | null
    | "payment"
    | "add-class"
    | "add-user"
    | "sms"
    | "success"
  >(null);

  // Form Fields State — to‘lov modali (talaba yoki kassa)
  const [paymentMode, setPaymentMode] = useState<"student" | "cashier">("student");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCourseId, setPaymentCourseId] = useState<string>("");
  const [paymentMeta, setPaymentMeta] = useState<{ title?: string; price?: number } | null>(null);
  const [paymentTargetUserId, setPaymentTargetUserId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Click");
  const [paymentDiscount, setPaymentDiscount] = useState<any | null>(null);
  const [cashierCourses, setCashierCourses] = useState<any[]>([]);
  const [cashierCourseGroup, setCashierCourseGroup] = useState("");
  const [cashierStudents, setCashierStudents] = useState<any[]>([]);
  const canApplyDiscount = hasPermission(user, "discount.apply");
  const cashierCourseGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const course of cashierCourses) {
      const key = cashierCourseGroupKey(course);
      map.set(key, [...(map.get(key) || []), course]);
    }
    return Array.from(map.entries()).map(([key, variants]) => ({
      key,
      label: cashierCourseGroupLabel(variants[0]),
      variants: [...variants].sort((a, b) => courseTeacherName(a).localeCompare(courseTeacherName(b))),
    }));
  }, [cashierCourses]);
  const selectedCashierGroup = cashierCourseGroups.find((group) => group.key === cashierCourseGroup) || cashierCourseGroups[0];
  
  const [classTitle, setClassTitle] = useState("");
  const [classTime, setClassTime] = useState("14:00");
  const [classDate, setClassDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [classCourseId, setClassCourseId] = useState<string>("");
  const [classLocationId, setClassLocationId] = useState<string>("");
  const [classCourses, setClassCourses] = useState<any[]>([]);
  const [classLocations, setClassLocations] = useState<any[]>([]);

  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("talaba");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("password123");

  const [smsText, setSmsText] = useState("");
  const [smsRecipientId, setSmsRecipientId] = useState<string>("");
  const [smsRecipients, setSmsRecipients] = useState<any[]>([]);

  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setPersona("guest");
      return;
    }
    if (user.role === "admin") setPersona("admin");
    else if (user.role === "teacher") setPersona("ustoz");
    else if (user.role === "cashier") setPersona("kassir");
    else if (user.role === "parent") setPersona("ota-ona");
    else if (user.role === "receptionist") setPersona("qabulxona");
    else setPersona("talaba");
  }, [user]);

  // Load data for interactive modals when logged in
  useEffect(() => {
    if (!user) return;
    // Teacher "add-class" modal needs courses+locations
    if (user.role === "teacher" || user.role === "admin") {
      dashboardApi
        .teacher()
        .then((d) => {
          const cs = Array.isArray(d?.courses) ? d.courses : [];
          setClassCourses(cs);
          if (!classCourseId && cs[0]?.id) setClassCourseId(cs[0].id);
        })
        .catch(() => {});
      locationsApi
        .list()
        .then((d) => {
          const ls = Array.isArray(d) ? d : [];
          setClassLocations(ls);
          if (!classLocationId && ls[0]?.id) setClassLocationId(ls[0].id);
        })
        .catch(() => {});
    }

    // Parent "sms" modal should have at least teachers to message
    teachersApi
      .list()
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setSmsRecipients(list);
        if (!smsRecipientId && list[0]?.id) setSmsRecipientId(list[0].id);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (activeModal !== "payment" || paymentMode !== "student" || !paymentCourseId) return;
    let cancelled = false;
    coursesApi
      .get(paymentCourseId)
      .then((c) => {
        if (cancelled) return;
        setPaymentMeta({ title: coursePaymentLabel(c), price: Number(c.price ?? 0) });
        setPaymentAmount(formatUzMoney(Number(c.price ?? 0)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeModal, paymentMode, paymentCourseId]);

  useEffect(() => {
    if (activeModal !== "payment" || paymentMode !== "cashier") return;
    let cancelled = false;
    Promise.all([coursesApi.list(), paymentsApi.pickStudents()])
      .then(([courses, studs]) => {
        if (cancelled) return;
        const cs = Array.isArray(courses) ? courses : [];
        const students = Array.isArray(studs) ? studs : [];
        setCashierCourses(cs);
        setCashierStudents(students);
        const firstC = cs[0];
        const firstS = students[0];
        if (firstC?.id) {
          setCashierCourseGroup(cashierCourseGroupKey(firstC));
          setPaymentCourseId(firstC.id);
          setPaymentMeta({ title: coursePaymentLabel(firstC), price: Number(firstC.price ?? 0) });
          setPaymentAmount(formatUzMoney(Number(firstC.price ?? 0)));
        }
        if (firstS?.id) setPaymentTargetUserId(firstS.id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeModal, paymentMode]);

  useEffect(() => {
    if (activeModal !== "payment" || paymentMode !== "cashier" || !selectedCashierGroup?.variants?.length) return;
    const hasSelected = selectedCashierGroup.variants.some((variant) => String(variant.id) === String(paymentCourseId));
    if (hasSelected) return;
    const course = selectedCashierGroup.variants[0];
    setPaymentCourseId(course.id);
    setPaymentMeta({ title: coursePaymentLabel(course), price: Number(course.price ?? 0) });
    setPaymentAmount(formatUzMoney(Number(course.price ?? 0)));
  }, [activeModal, paymentMode, selectedCashierGroup, paymentCourseId]);

  useEffect(() => {
    if (activeModal !== "payment" || paymentMode !== "cashier" || !paymentTargetUserId || !paymentCourseId || !canApplyDiscount) {
      setPaymentDiscount(null);
      return;
    }
    discountsApi
      .available({ userId: paymentTargetUserId, courseId: paymentCourseId })
      .then((d) => setPaymentDiscount(d?.award || null))
      .catch(() => setPaymentDiscount(null));
  }, [activeModal, paymentMode, paymentTargetUserId, paymentCourseId, canApplyDiscount]);

  // Scroll top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  const navigate = (p: Page) => navigateRR(pageToPath(p));

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setActiveModal("success");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* High-tech educational interactive canvas particle system */}
      <EduParticles theme={theme} />

      {/* Decorative moving blur orbs */}
      <div className="pointer-events-none absolute -left-24 top-1/5 -z-30 h-[420px] w-[420px] rounded-full bg-primary-500/14 blur-[120px] animate-orb-1 dark:bg-primary-500/12" />
      <div className="pointer-events-none absolute -right-24 top-1/2 -z-30 h-[480px] w-[480px] rounded-full bg-accent-500/12 blur-[130px] animate-orb-2 dark:bg-accent-500/10" />
      <div className="pointer-events-none absolute left-1/3 bottom-0 -z-30 h-[360px] w-[360px] rounded-full bg-pink-500/10 blur-[120px] animate-orb-1 dark:bg-pink-500/08" />
      <div className="pointer-events-none absolute right-1/4 top-0 -z-30 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[120px] animate-orb-2 dark:bg-emerald-500/08" />

      {/* Event Listeners / Interactivity hooks on Window object */}
      <Layout
        page={page}
        onNavigate={navigate}
        persona={persona}
        setPersona={setPersona}
        theme={theme}
        toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Routes>
          <Route path="/" element={<Landing onNavigate={navigate} />} />
          <Route path="/login" element={<Login onNavigate={navigate} setPersona={setPersona} />} />
          <Route path="/register" element={<Register onNavigate={navigate} setPersona={setPersona} />} />
          <Route path="/courses" element={<Courses onNavigate={navigate} />} />
          <Route
            path="/courses/:id"
            element={
              <CourseDetailWithPayment
                onPay={(courseId) => {
                  if (!user) {
                    navigateRR("/login");
                    return;
                  }
                  setPaymentMode("student");
                  setPaymentCourseId(courseId);
                  setPaymentMeta(null);
                  setActiveModal("payment");
                }}
              />
            }
          />
          <Route path="/teachers" element={<Teachers />} />
          <Route
            path="/teachers/:id"
            element={<TeacherProfileRoute />}
          />
          <Route path="/library" element={<Library />} />
          <Route path="/map" element={<MapPage />} />
          <Route
            path="/dashboard"
            element={
              <StudentDashboardRoute user={user} loading={authLoading}>
                <StudentDashboard onNavigate={navigate} />
              </StudentDashboardRoute>
            }
          />
          <Route
            path="/dashboard/teacher"
            element={
              <RequireRole user={user} loading={authLoading} roles={["teacher", "admin"]}>
                <div className="space-y-6">
                  <TeacherDashboard onNavigate={navigate} />
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="gradient"
                      onClick={() => {
                        const t = new Date();
                        t.setDate(t.getDate() + 1);
                        setClassDate(t.toISOString().slice(0, 10));
                        setActiveModal("add-class");
                      }}
                    >
                      ➕ Yangi Dars Qo'shish (Interactive)
                    </Button>
                  </div>
                </div>
              </RequireRole>
            }
          />
          <Route
            path="/admin/:section?"
            element={
              <RequireRole user={user} loading={authLoading} roles={["admin"]}>
                <div className="space-y-6">
                  <Admin section={adminSection} />
                  <div className="flex justify-center gap-4 pb-8">
                    <Button variant="gradient" onClick={() => setActiveModal("add-user")}>
                      👤 Yangi Foydalanuvchi Qo'shish (Interactive)
                    </Button>
                  </div>
                </div>
              </RequireRole>
            }
          />
          <Route
            path="/cashier"
            element={
              <RequirePermission user={user} loading={authLoading} permission="payment.view">
                <div className="space-y-6">
                  <CashierPage
                    onNewPayment={() => {
                      setPaymentMode("cashier");
                      setCashierCourseGroup("");
                      setPaymentCourseId("");
                      setPaymentMeta(null);
                      setPaymentAmount("");
                      setPaymentTargetUserId("");
                      setActiveModal("payment");
                    }}
                  />
                  <div className="flex justify-center gap-4 pb-8">
                    <Button
                      variant="gradient"
                      onClick={() => {
                        setPaymentMode("cashier");
                        setCashierCourseGroup("");
                        setPaymentCourseId("");
                        setPaymentMeta(null);
                        setPaymentAmount("");
                        setPaymentTargetUserId("");
                        setActiveModal("payment");
                      }}
                    >
                      💸 Yangi To'lov Qabul Qilish (Interactive)
                    </Button>
                  </div>
                </div>
              </RequirePermission>
            }
          />
          <Route
            path="/reception"
            element={
              <RequireRole user={user} loading={authLoading} roles={["receptionist", "admin"]}>
                <Reception />
              </RequireRole>
            }
          />
          <Route
            path="/messages"
            element={
              <RequirePermission user={user} loading={authLoading} permission="message.send">
                <Messages />
              </RequirePermission>
            }
          />
          <Route path="/tests" element={<Tests />} />
          <Route
            path="/study-plan"
            element={
              <RequireAuth user={user} loading={authLoading}>
                <div className="space-y-6">
                  <StudyPlan />
                  <div className="flex justify-center">
                    <Button
                      variant="gradient"
                      onClick={() => {
                        setClassDate(new Date().toISOString().slice(0, 10));
                        setActiveModal("add-class");
                      }}
                    >
                      📅 Rejaga yangi dars qo'shish (Interactive)
                    </Button>
                  </div>
                </div>
              </RequireAuth>
            }
          />
          <Route
            path="/attendance"
            element={
              <RequirePermission user={user} loading={authLoading} permission="attendance.mark">
                <Attendance />
              </RequirePermission>
            }
          />
          <Route
            path="/feedback"
            element={
              <RequireAuth user={user} loading={authLoading}>
                <Feedback />
              </RequireAuth>
            }
          />
          <Route
            path="/parent"
            element={
              <RequireRole user={user} loading={authLoading} roles={["parent", "admin"]}>
                <div className="space-y-6">
                  <ParentPanel />
                  <div className="flex justify-center">
                    <Button
                      variant="gradient"
                      onClick={() => {
                        setSmsText("");
                        setActiveModal("sms");
                      }}
                    >
                      💬 Sinf rahbari bilan bog'lanish (Interactive)
                    </Button>
                  </div>
                </div>
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* ========================================================= */}
      {/* GLOBAL MODAL INTERACTIVE DIALOGS                          */}
      {/* ========================================================= */}

      {/* 1. PAYMENT MODAL */}
      <Modal
        open={activeModal === "payment"}
        onClose={() => setActiveModal(null)}
        title={paymentMode === "cashier" ? "Kassa: yangi to‘lov" : "To‘lov yuborish"}
      >
        <div className="space-y-4 pt-2">
          {paymentMode === "student" ? (
            <>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Kurs</div>
                <div className="font-semibold text-white">{paymentMeta?.title || "Yuklanmoqda..."}</div>
                {paymentMeta?.price != null ? (
                  <div className="mt-1 text-xs text-slate-400">
                    Narxi: {formatUzMoney(paymentMeta.price)} so‘m (summani o‘zgartirsangiz ham bo‘ladi)
                  </div>
                ) : null}
              </div>
              <div className="text-xs text-slate-400">
                Talaba sifatida to‘lov yuborasiz — holati “kutilmoqda”. Kassir tasdiqlagach kurs ochiladi.
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-semibold text-slate-300">Talaba</span>
                  <select
                    value={paymentTargetUserId}
                    onChange={(e) => setPaymentTargetUserId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
                  >
                    {cashierStudents.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-2 block text-xs font-semibold text-slate-300">Fan/kurs</span>
                  <select
                    value={cashierCourseGroup || selectedCashierGroup?.key || ""}
                    onChange={(e) => {
                      const key = e.target.value;
                      setCashierCourseGroup(key);
                      const c = cashierCourseGroups.find((group) => group.key === key)?.variants?.[0];
                      if (c) {
                        setPaymentCourseId(c.id);
                        setPaymentMeta({ title: coursePaymentLabel(c), price: Number(c.price ?? 0) });
                        setPaymentAmount(formatUzMoney(Number(c.price ?? 0)));
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
                  >
                    {cashierCourseGroups.map((group) => (
                      <option key={group.key} value={group.key}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedCashierGroup?.variants?.length > 1 ? (
                <div>
                  <span className="mb-2 block text-xs font-semibold text-slate-300">O‘qituvchi varianti</span>
                  <select
                    value={paymentCourseId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setPaymentCourseId(id);
                      const c = cashierCourses.find((x: any) => x.id === id);
                      if (c) {
                        setPaymentMeta({ title: coursePaymentLabel(c), price: Number(c.price ?? 0) });
                        setPaymentAmount(formatUzMoney(Number(c.price ?? 0)));
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
                  >
                    {selectedCashierGroup.variants.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {courseTeacherName(c)} · {formatUzMoney(Number(c.price ?? 0))} so‘m
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-400">
                  O‘qituvchi avtomatik tanlandi: <span className="font-semibold text-white">{selectedCashierGroup?.variants?.[0] ? courseTeacherName(selectedCashierGroup.variants[0]) : "—"}</span>
                </div>
              )}
              <div className="text-xs text-slate-400">
                Kassa talaba va kursni tanlab pending to‘lov yaratadi; jadvaldan “Tasdiqlash”ni bosing.
              </div>
              {!canApplyDiscount ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Chegirma qo‘llash uchun `discount.apply` dostupi kerak. Admin Dostuplar bo‘limidan berishi mumkin.
                </div>
              ) : paymentDiscount ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  Chegirma qo‘llanmoqda: {paymentDiscount.campaign?.title} · {Number(paymentDiscount.discountAmount || 0).toLocaleString("uz-UZ")} so‘m
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-500">
                  Tanlangan talaba/kurs uchun aktiv chegirma topilmadi.
                </div>
              )}
            </>
          )}
          <Input
            label="To'lov summasi (so'm)"
            placeholder="Masalan: 1 200 000"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(formatUzMoney(e.target.value))}
          />
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">To‘lov usuli</span>
            <div className="grid grid-cols-3 gap-2">
              {["Click", "Payme", "Naqd"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-semibold transition",
                    paymentMethod === method
                      ? "border-primary-500/50 bg-primary-500/15 text-primary-200"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]",
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="gradient"
              onClick={async () => {
                try {
                  if (!user) {
                    setActiveModal(null);
                    navigateRR("/login");
                    return;
                  }
                  const amount = parseUzMoney(paymentAmount);
                  const courseId = paymentCourseId || "";
                  if (!courseId) throw new Error("Kurs tanlang");
                  if (amount <= 0) throw new Error("Summa noto‘g‘ri");
                  if (paymentMode === "cashier") {
                    if (!paymentTargetUserId) throw new Error("Talaba tanlang");
                    await paymentsApi.create({
                      courseId,
                      amount,
                      userId: paymentTargetUserId,
                      method: paymentMethod,
                      discountAwardId: canApplyDiscount ? paymentDiscount?.id : undefined,
                    });
                    setActiveModal(null);
                    triggerSuccess("To‘lov yaratildi (pending). Jadvaldan tasdiqlang.");
                  } else {
                    await paymentsApi.create({
                      courseId,
                      amount,
                      method: paymentMethod,
                    });
                    setActiveModal(null);
                    triggerSuccess(
                      "To‘lov yuborildi (pending). Kassir tasdiqlagach kurs ochiladi.",
                    );
                  }
                } catch (e: any) {
                  triggerSuccess(e?.message || "To'lov yuborilmadi");
                }
              }}
            >
              Yuborish
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. ADD CLASS MODAL */}
      <Modal
        open={activeModal === "add-class"}
        onClose={() => setActiveModal(null)}
        title="Yangi Dars Qo'shish"
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Dars mavzusi"
            placeholder="Masalan: Trigonometriya asoslari"
            value={classTitle}
            onChange={(e) => setClassTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-300">Kurs</span>
              <select
                value={classCourseId}
                onChange={(e) => setClassCourseId(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
              >
                {classCourses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-300">Markaz</span>
              <select
                value={classLocationId}
                onChange={(e) => setClassLocationId(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
              >
                {classLocations.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dars sanasi"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
            />
            <Input
              label="Dars vaqti"
              value={classTime}
              onChange={(e) => setClassTime(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="gradient"
              onClick={async () => {
                try {
                  if (!classCourseId || !classLocationId) throw new Error("Kurs va markaz tanlang");
                  await scheduleApi.create({
                    courseId: classCourseId,
                    locationId: classLocationId,
                    date: classDate,
                    time: classTime,
                    topic: classTitle || null,
                  });
                  setActiveModal(null);
                  triggerSuccess(`Dars jadvalga qo‘shildi: ${classDate} ${classTime}`);
                } catch (e: any) {
                  triggerSuccess(e?.message || "Dars qo'shilmadi");
                }
              }}
            >
              Qo'shish
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. ADD USER MODAL */}
      <Modal
        open={activeModal === "add-user"}
        onClose={() => setActiveModal(null)}
        title="Yangi Foydalanuvchi Yaratish"
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Foydalanuvchi To'liq Ismi"
            placeholder="Masalan: Sardor Yusupov"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
          <Input
            label="Email"
            placeholder="Masalan: user@talim.uz"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
          />
          <Input
            label="Parol"
            placeholder="Masalan: password123"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
          />
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">
              Roli va vakolati
            </span>
            <div className="grid grid-cols-3 gap-2">
              {["talaba", "ustoz", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setNewUserRole(r)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold uppercase transition ${
                    newUserRole === r
                      ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="gradient"
              onClick={async () => {
                try {
                  const roleMap: Record<string, string> = {
                    talaba: "student",
                    ustoz: "teacher",
                    admin: "admin",
                  };
                  const [firstName, ...rest] = String(newUserName || "").trim().split(" ");
                  const lastName = rest.join(" ");
                  const role = roleMap[newUserRole] || "student";
                  if (user?.role === "admin") {
                    await adminApi.createUser({
                      name: `${firstName || "User"}${lastName ? ` ${lastName}` : ""}`,
                      email: newUserEmail,
                      password: newUserPassword,
                      role,
                    });
                  } else {
                    await authApi.register({
                      firstName: firstName || "User",
                      lastName: lastName || "",
                      email: newUserEmail,
                      password: newUserPassword,
                      role,
                    });
                  }
                  setActiveModal(null);
                  triggerSuccess(`Foydalanuvchi yaratildi. Agar roli student bo‘lmasa, admin tasdiqlashi kerak bo‘ladi.`);
                  setNewUserName("");
                  setNewUserEmail("");
                } catch (e: any) {
                  triggerSuccess(e?.message || "Yaratilmadi");
                }
              }}
            >
              Yaratish
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. SMS MODAL */}
      <Modal
        open={activeModal === "sms"}
        onClose={() => setActiveModal(null)}
        title="Sinf rahbari bilan bog'lanish"
      >
        <div className="space-y-4 pt-2">
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">Kimga</span>
            <select
              value={smsRecipientId}
              onChange={(e) => setSmsRecipientId(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
            >
              {smsRecipients.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="w-full h-32 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary-500/60 focus:outline-none"
            placeholder="Xabaringizni bu yerga yozing..."
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="gradient"
              onClick={async () => {
                try {
                  if (!smsRecipientId) throw new Error("Qabul qiluvchini tanlang");
                  await messagesApi.send({ recipientId: smsRecipientId, content: smsText });
                  setActiveModal(null);
                  triggerSuccess("Xabar yuborildi.");
                  setSmsText("");
                } catch (e: any) {
                  triggerSuccess(e?.message || "Xabar yuborilmadi");
                }
              }}
            >
              SMS yuborish
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. SUCCESS DIALOG */}
      <Modal
        open={activeModal === "success"}
        onClose={() => setActiveModal(null)}
        title="✓ Amaliyot Muvaffaqiyatli Yakunlandi"
      >
        <div className="space-y-4 text-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mx-auto text-3xl">
            ✓
          </div>
          <p className="text-[15px] text-slate-300 leading-relaxed font-semibold px-2">
            {successMsg}
          </p>
          <div className="pt-4">
            <Button variant="gradient" onClick={() => setActiveModal(null)}>
              Tushunarli
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TeacherProfileRoute() {
  const { id } = useParams();
  const teacherId = id || "";
  return <TeacherProfile teacherId={teacherId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
