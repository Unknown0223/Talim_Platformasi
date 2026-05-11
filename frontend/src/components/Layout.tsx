import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import { hasPermission } from "../utils/permissions";
import { useAuth } from "../context/AuthContext";
import {
  IHome,
  IBook,
  IUsers,
  IGraduation,
  IDashboard,
  IChat,
  ICalendar,
  IMap,
  IWallet,
  ISearch,
  IBell,
  ISun,
  IMoon,
  IMenu,
  ITrophy,
  ILogout,
  IPin,
  IArrow,
} from "./icons";
import {
  Avatar,
  Badge,
  Button,
  Modal,
  Input,
  NameEmoji,
  NameWithEmoji,
  NAME_EMOJI_ANIMATIONS,
  POPULAR_NAME_EMOJIS,
  type NameEmojiAnim,
} from "./ui";
import { auth as authApi, notifications as notificationsApi, settings as settingsApi, uploads as uploadsApi } from "../services/api";
import { getSocket } from "../services/socket";
import { useToast } from "../context/ToastContext";

export type Page =
  | "landing"
  | "login"
  | "register"
  | "courses"
  | "course-detail"
  | "teachers"
  | "student-dashboard"
  | "teacher-dashboard"
  | "admin"
  | "admin-access"
  | "admin-finance"
  | "admin-users"
  | "library"
  | "messages"
  | "tests"
  | "study-plan"
  | "map"
  | "parent"
  | "cashier"
  | "attendance"
  | "reception"
  | "feedback";

type NavItem = {
  page: Page;
  label: string;
  icon: typeof IHome;
  badge?: string;
  permission?: string;
};

type Section = { title: string; items: NavItem[] };

const studentSections: Section[] = [
  {
    title: "Asosiy",
    items: [
      { page: "student-dashboard", label: "Bosh panel", icon: IDashboard },
      { page: "courses", label: "Kurslar", icon: IBook, permission: "course.view" },
      { page: "teachers", label: "Ustozlar", icon: IUsers },
    ],
  },
  {
    title: "O'qish",
    items: [
      { page: "tests", label: "Testlar", icon: ITrophy, badge: "3" },
      { page: "study-plan", label: "O'quv reja", icon: ICalendar },
      { page: "library", label: "Kutubxona", icon: IGraduation },
    ],
  },
  {
    title: "Aloqa",
    items: [
      { page: "messages", label: "Xabarlar", icon: IChat, badge: "5", permission: "message.send" },
      { page: "feedback", label: "Taklif/Shikoyat", icon: IBell, permission: "feedback.submit" },
      { page: "map", label: "Markazlar", icon: IMap },
    ],
  },
];

const teacherSections: Section[] = [
  {
    title: "Asosiy",
    items: [
      { page: "teacher-dashboard", label: "Bosh panel", icon: IDashboard },
      { page: "courses", label: "Mening kurslarim", icon: IBook, permission: "course.view" },
      { page: "attendance", label: "Davomat", icon: ICalendar, permission: "attendance.mark" },
    ],
  },
  {
    title: "Aloqa",
    items: [
      { page: "messages", label: "Xabarlar", icon: IChat, badge: "2", permission: "message.send" },
      { page: "feedback", label: "Taklif/Shikoyat", icon: IBell, permission: "feedback.submit" },
      { page: "library", label: "Kutubxona", icon: IGraduation },
    ],
  },
];

const adminSections: Section[] = [
  {
    title: "Boshqaruv",
    items: [
      { page: "admin", label: "Bosh panel", icon: IDashboard },
      { page: "admin-access", label: "Dostuplar", icon: IPin },
      { page: "admin-finance", label: "Moliyaviy tahlil", icon: IWallet },
      { page: "admin-users", label: "Foydalanuvchilar", icon: IUsers },
      { page: "courses", label: "Fanlar", icon: IBook },
    ],
  },
  {
    title: "Operatsiyalar",
    items: [
      { page: "cashier", label: "Kassa", icon: IWallet, permission: "payment.view" },
      { page: "map", label: "Joylar", icon: IMap },
      { page: "messages", label: "Xabarlar", icon: IChat, permission: "message.send" },
      { page: "feedback", label: "Taklif/Shikoyat", icon: IBell, permission: "feedback.manage" },
    ],
  },
];

const receptionSections: Section[] = [
  {
    title: "Qabulxona",
    items: [
      { page: "reception", label: "Qabul paneli", icon: IDashboard },
      { page: "map", label: "Markazlar", icon: IMap },
      { page: "messages", label: "Xabarlar", icon: IChat, permission: "message.send" },
      { page: "feedback", label: "Taklif/Shikoyat", icon: IBell, permission: "feedback.submit" },
    ],
  },
];

const cashierSections: Section[] = [
  {
    title: "Kassa",
    items: [
      { page: "cashier", label: "Kassa paneli", icon: IWallet, permission: "payment.view" },
      { page: "courses", label: "Kurslar", icon: IBook, permission: "course.view" },
      { page: "messages", label: "Xabarlar", icon: IChat, permission: "message.send" },
      { page: "feedback", label: "Taklif/Shikoyat", icon: IBell, permission: "feedback.submit" },
    ],
  },
];

const parentSections: Section[] = [
  {
    title: "Ota-ona",
    items: [
      { page: "parent", label: "Farzandlar paneli", icon: IDashboard },
      { page: "messages", label: "Xabarlar", icon: IChat, permission: "message.send" },
      { page: "feedback", label: "Taklif/Shikoyat", icon: IBell, permission: "feedback.submit" },
      { page: "map", label: "Markazlar", icon: IMap },
    ],
  },
];

export type Persona = "guest" | "talaba" | "ustoz" | "admin" | "kassir" | "ota-ona" | "qabulxona";

type LayoutProps = {
  children: ReactNode;
  page: Page;
  onNavigate: (p: Page) => void;
  persona: Persona;
  setPersona: (p: Persona) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
};

export function Layout({
  children,
  page,
  onNavigate,
  persona,
  setPersona,
  theme,
  toggleTheme,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brand, setBrand] = useState<any>({
    name: "Talim",
    subtitle: "Learn Platform",
    logoText: "T",
    primaryColor: "#5a8aff",
    accentColor: "#8b5cf6",
    animationEffect: "none",
  });
  const { user } = useAuth();

  useEffect(() => {
    settingsApi.public().then((d) => {
      if (d?.brand) setBrand(d.brand);
    }).catch(() => {});
  }, []);

  const isPublic = page === "landing" || page === "login" || page === "register";

  if (isPublic || persona === "guest") {
    return (
      <PublicShell
        page={page}
        onNavigate={onNavigate}
        theme={theme}
        toggleTheme={toggleTheme}
        setPersona={setPersona}
        brand={brand}
      >
        {children}
      </PublicShell>
    );
  }

  const rawSections =
    persona === "ustoz"
      ? teacherSections
      : persona === "admin"
        ? adminSections
        : persona === "qabulxona"
          ? receptionSections
          : persona === "kassir"
            ? cashierSections
          : persona === "ota-ona"
            ? parentSections
            : studentSections;
  const sections = rawSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(user, item.permission)),
    }))
    .filter((section) => section.items.length);

  const adminTone = persona === "admin";
  const flatNav = sections.flatMap((s) => s.items);

  return (
    <div className={cn("flex min-h-screen bg-transparent")}>
      {/* Sidebar (desktop) */}
      <aside
        className={cn(
          "hidden lg:flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/80 backdrop-blur-xl",
        )}
      >
        <BrandBlock onClick={() => onNavigate("landing")} adminTone={adminTone} brand={brand} />
        <SidebarNav
          sections={sections}
          page={page}
          onNavigate={onNavigate}
          adminTone={adminTone}
        />
        <PersonaSwitcher persona={persona} setPersona={setPersona} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/85 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-white/10 bg-ink-900 flex flex-col animate-fade-in">
            <BrandBlock
              onClick={() => {
                onNavigate("landing");
                setMobileOpen(false);
              }}
              adminTone={adminTone}
              brand={brand}
            />
            <SidebarNav
              sections={sections}
              page={page}
              onNavigate={(p) => {
                onNavigate(p);
                setMobileOpen(false);
              }}
              adminTone={adminTone}
            />
            <PersonaSwitcher persona={persona} setPersona={setPersona} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <TopBar
          onMenu={() => setMobileOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          persona={persona}
          adminTone={adminTone}
          brand={brand}
        />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div key={page} className="animate-fade-in">{children}</div>
        </main>
        <MobileBottomNav
          nav={flatNav.slice(0, 5)}
          page={page}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

/* ==================== Brand block ==================== */
function BrandBlock({
  onClick,
  adminTone,
  brand,
}: {
  onClick: () => void;
  adminTone?: boolean;
  brand?: any;
}) {
  const primary = brand?.primaryColor || (adminTone ? "#f59e0b" : "#5a8aff");
  const accent = brand?.accentColor || (adminTone ? "#ea580c" : "#8b5cf6");
  const brandName = brand?.name || "Talim";
  const effect = brand?.animationEffect && brand.animationEffect !== "none" ? `brand-${brand.animationEffect}` : "";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-5 text-left"
    >
      <div
        className={cn("relative flex h-10 w-10 items-center justify-center rounded-xl shadow-lg", effect)}
        style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
      >
        <span className="text-base font-bold text-white">{brand?.logoText || brandName.slice(0, 1)}</span>
        <span className="absolute -inset-1 -z-10 rounded-2xl blur-md" style={{ background: `linear-gradient(135deg, ${primary}44, ${accent}44)` }} />
      </div>
      <div>
        <div className={cn("text-[15px] font-semibold tracking-tight text-white", effect)}>
          {brandName}
          <span className="ml-1 text-[10px] font-medium text-primary-400">v3</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
          {adminTone ? "Admin Console" : brand?.subtitle || "Learn Platform"}
        </div>
      </div>
    </button>
  );
}

/* ==================== Sidebar nav ==================== */
function SidebarNav({
  sections,
  page,
  onNavigate,
  adminTone,
}: {
  sections: Section[];
  page: Page;
  onNavigate: (p: Page) => void;
  adminTone?: boolean;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
      {sections.map((s, si) => (
        <div key={si}>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            {s.title}
          </div>
          <div className="space-y-0.5">
            {s.items.map((item, i) => {
              const Icon = item.icon;
              const active = item.page === page;
              return (
                <button
                  key={i}
                  onClick={() => onNavigate(item.page)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                    active
                      ? adminTone
                        ? "bg-amber-500/[0.08] text-amber-300"
                        : "bg-white/[0.05] text-white"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white",
                  )}
                >
                  {active && (
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full",
                        adminTone ? "bg-amber-400" : "bg-primary-400",
                      )}
                    />
                  )}
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition",
                      active && (adminTone ? "text-amber-400" : "text-primary-400"),
                    )}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        adminTone
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-primary-500/20 text-primary-300",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ==================== Persona switcher ==================== */
function PersonaSwitcher({
  persona,
  setPersona,
}: {
  persona: Persona;
  setPersona: (p: Persona) => void;
}) {
  const { user } = useAuth();
  const allowedPersonas: Persona[] =
    user?.role === "admin"
      ? ["admin", "ustoz", "talaba", "kassir", "qabulxona", "ota-ona"]
      : user?.role === "teacher"
        ? ["ustoz"]
        : user?.role === "cashier"
          ? ["kassir"]
          : user?.role === "receptionist"
            ? ["qabulxona"]
            : user?.role === "parent"
              ? ["ota-ona"]
              : ["talaba"];
  if (allowedPersonas.length <= 1) return null;
  return (
    <div className="border-t border-white/[0.05] p-3">
      <select
        value={persona}
        onChange={(e) => {
          const next = e.target.value as Persona;
          if (allowedPersonas.includes(next)) setPersona(next);
        }}
        className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 hover:bg-white/5 focus:border-primary-500/60 focus:outline-none"
      >
        {allowedPersonas.includes("talaba") && <option value="talaba">Talaba ko'rinishi</option>}
        {allowedPersonas.includes("ustoz") && <option value="ustoz">Ustoz ko'rinishi</option>}
        {allowedPersonas.includes("admin") && <option value="admin">Admin ko'rinishi</option>}
        {allowedPersonas.includes("kassir") && <option value="kassir">Kassir ko'rinishi</option>}
        {allowedPersonas.includes("ota-ona") && <option value="ota-ona">Ota-ona ko'rinishi</option>}
        {allowedPersonas.includes("qabulxona") && <option value="qabulxona">Qabulxona ko'rinishi</option>}
      </select>
    </div>
  );
}

/* ==================== Top bar ==================== */
function TopBar({
  onMenu,
  theme,
  toggleTheme,
  persona,
  adminTone,
  brand: _brand,
}: {
  onMenu: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  persona: Persona;
  adminTone?: boolean;
  brand?: any;
}) {
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifData, setNotifData] = useState<any>({ unreadCount: 0, notifications: [] });
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const loadNotifications = () => {
    if (!user) return;
    notificationsApi.list().then((d) => setNotifData(d || { unreadCount: 0, notifications: [] })).catch(() => {});
  };
  useEffect(() => {
    loadNotifications();
  }, [user?.id]);
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("notification:new", loadNotifications);
    return () => { socket.off("notification:new", loadNotifications); };
  }, [user?.id]);
  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8",
        adminTone && "border-amber-500/[0.1]",
      )}
    >
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
        aria-label="Menyu"
      >
        <IMenu />
      </button>
      <div className="relative w-full max-w-xl shrink min-w-0">
        <ISearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Kurs, ustoz yoki kitob qidiring..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !search.trim()) return;
            window.location.href = `/courses?q=${encodeURIComponent(search.trim())}`;
          }}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-16 text-sm text-slate-200 placeholder:text-slate-500 transition focus:border-primary-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline-block">
          Enter
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right md:block">
          <div className="text-[11px] text-slate-500">
            {now.toLocaleDateString("uz-UZ", { weekday: "long" })}
          </div>
          <div className="text-[13px] font-medium text-slate-300">
            {now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          aria-label="Mavzu"
        >
          {theme === "dark" ? <ISun /> : <IMoon />}
        </button>
        <button
          className="relative rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            loadNotifications();
            setNotifOpen(true);
          }}
          aria-label="Bildirishnomalar"
        >
          <IBell />
          {notifData.unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{notifData.unreadCount}</span>}
          {notifData.unreadCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-rose-400" />
          </span>}
        </button>
        {notifOpen && <NotificationModal data={notifData} onClose={() => setNotifOpen(false)} onReload={loadNotifications} />}

        {user ? (
          <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-1.5 py-1 transition",
              profileOpen
                ? "border-white/20 bg-white/[0.06]"
                : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06]",
            )}
            aria-label="Profil menyusi"
          >
            <Avatar
              size="sm"
              initials={(user?.name || "?").slice(0, 2).toUpperCase()}
              imageUrl={user?.avatar || undefined}
              color={
                persona === "ustoz"
                  ? "from-violet-500 to-purple-600"
                  : persona === "admin"
                    ? "from-amber-500 to-orange-600"
                    : persona === "kassir"
                      ? "from-emerald-500 to-teal-600"
                      : persona === "qabulxona"
                        ? "from-pink-500 to-rose-600"
                        : "from-primary-500 to-accent-500"
              }
              online
            />
            <div className="hidden pr-1 text-left lg:block">
              <div className="max-w-[160px] truncate text-[12px] font-semibold leading-tight text-white">
                <NameWithEmoji
                  name={user?.name || ""}
                  emoji={(user as any)?.nameEmoji}
                  anim={(user as any)?.nameEmojiAnim}
                />
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                {user?.role || persona}
              </div>
            </div>
          </button>
          {profileOpen ? (
            <ProfileMenu
              persona={persona}
              onClose={() => setProfileOpen(false)}
              onOpenProfile={() => {
                setProfileOpen(false);
                setProfileModalOpen(true);
              }}
              onOpenPassword={() => {
                setProfileOpen(false);
                setPasswordModalOpen(true);
              }}
            />
            ) : null}
          </div>
        ) : (
          <div className="hidden md:block">
            <Badge
              variant={
                persona === "ustoz" ? "ustoz" : persona === "admin" ? "admin" : "talaba"
              }
              dot
            >
              {persona === "guest" ? "Mehmon" : persona}
            </Badge>
          </div>
        )}
      </div>

      <ProfileSettingsModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </header>
  );
}

/* ==================== Profile menu (avatar dropdown) ==================== */
function ProfileMenu({
  persona,
  onClose,
  onOpenProfile,
  onOpenPassword,
}: {
  persona: Persona;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenPassword: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = (user?.name || "?").slice(0, 2).toUpperCase();

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-950/95 shadow-2xl backdrop-blur-xl"
    >
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            size="lg"
            initials={initials}
            imageUrl={user?.avatar || undefined}
            ring
            online
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              <NameWithEmoji
                name={user?.name || "Foydalanuvchi"}
                emoji={(user as any)?.nameEmoji}
                anim={(user as any)?.nameEmojiAnim}
              />
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge
                variant={
                  persona === "ustoz" ? "ustoz" : persona === "admin" ? "admin" : "talaba"
                }
                dot
              >
                {user?.role || persona}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <nav className="p-1.5">
        <ProfileMenuItem
          icon="👤"
          label="Profil sozlamalari"
          hint="Ism, avatar, tug'ilgan sana"
          onClick={onOpenProfile}
        />
        <ProfileMenuItem
          icon="🔐"
          label="Parolni o'zgartirish"
          hint="Hisob xavfsizligi"
          onClick={onOpenPassword}
        />
        <div className="my-1.5 h-px bg-white/[0.06]" />
        <button
          type="button"
          onClick={() => {
            onClose();
            logout();
            navigate("/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-rose-500/[0.08]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300">
            <ILogout className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-rose-300">Hisobdan chiqish</div>
            <div className="text-[11px] text-rose-400/70">Tizimdan xavfsiz chiqish</div>
          </div>
        </button>
      </nav>
    </div>
  );
}

function ProfileMenuItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: string;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-base">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{label}</div>
        {hint ? <div className="truncate text-[11px] text-slate-500">{hint}</div> : null}
      </div>
      <span className="text-slate-500">›</span>
    </button>
  );
}

/* ==================== Profile settings modal ==================== */
function ProfileSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nameEmoji, setNameEmoji] = useState<string>("");
  const [nameEmojiAnim, setNameEmojiAnim] = useState<NameEmojiAnim>("pulse");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setName(user?.name || "");
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setBirthDate(
      (user as any)?.birthDate ? String((user as any).birthDate).slice(0, 10) : "",
    );
    setNameEmoji((user as any)?.nameEmoji || "");
    const animVal = (user as any)?.nameEmojiAnim;
    setNameEmojiAnim(
      (NAME_EMOJI_ANIMATIONS.some((a) => a.value === animVal) ? animVal : "pulse") as NameEmojiAnim,
    );
  }, [open, user?.id]);

  const onAvatarPick = async (file: File) => {
    try {
      setUploadingAvatar(true);
      await uploadsApi.avatar(file);
      await refresh();
      toast.success("Avatar yangilandi");
    } catch (e: any) {
      toast.error(e?.message || "Avatar yuklab bo'lmadi");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      await authApi.updateMe({
        name: name.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        birthDate: birthDate || undefined,
        nameEmoji: nameEmoji || null,
        nameEmojiAnim: nameEmoji ? nameEmojiAnim : null,
      });
      await refresh();
      toast.success("Profil sozlamalari saqlandi", { title: "✓ Bajarildi" });
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const onAvatarRemove = async () => {
    try {
      setUploadingAvatar(true);
      await authApi.updateMe({ avatar: null });
      await refresh();
      toast.success("Avatar olib tashlandi");
    } catch (e: any) {
      toast.error(e?.message || "Olib tashlab bo'lmadi");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Profil sozlamalari" size="lg">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <Avatar
              size="xl"
              initials={(user?.name || "?").slice(0, 2).toUpperCase()}
              imageUrl={user?.avatar || undefined}
              ring
            />
            <label
              className={cn(
                "absolute -bottom-1 -right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-ink-950 bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white shadow-lg transition hover:scale-110",
                uploadingAvatar && "pointer-events-none opacity-60",
              )}
              title="Avatarni o'zgartirish"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onAvatarPick(f);
                  e.target.value = "";
                }}
              />
              {uploadingAvatar ? "…" : "📷"}
            </label>
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center gap-1 text-base font-semibold text-white sm:justify-start">
              <NameWithEmoji name={user?.name || ""} emoji={nameEmoji} anim={nameEmojiAnim} />
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</div>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <label
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[12px] font-semibold text-slate-200 transition hover:bg-white/[0.08]",
                  uploadingAvatar && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onAvatarPick(f);
                    e.target.value = "";
                  }}
                />
                <span>📷</span>
                {uploadingAvatar ? "Yuklanmoqda…" : user?.avatar ? "Rasmni almashtirish" : "Rasm yuklash"}
              </label>
              {user?.avatar ? (
                <button
                  type="button"
                  onClick={onAvatarRemove}
                  disabled={uploadingAvatar}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-[12px] font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60"
                >
                  ✕ Olib tashlash
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <NameEmojiPicker
          emoji={nameEmoji}
          anim={nameEmojiAnim}
          onEmojiChange={setNameEmoji}
          onAnimChange={setNameEmojiAnim}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Ism"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ism"
          />
          <Input
            label="Familiya"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Familiya"
          />
        </div>
        <Input
          label="To'liq ism (ko'rsatiladigan)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ism Familiya"
        />
        <Input
          label="Tug'ilgan sana"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-400">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Email</div>
              <div className="font-semibold text-slate-200">{user?.email}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Rol</div>
              <div className="font-semibold text-slate-200">{user?.role}</div>
            </div>
            {(user as any)?.coins != null ? (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Coin</div>
                <div className="font-semibold text-amber-300">{(user as any).coins}</div>
              </div>
            ) : null}
            {(user as any)?.xp != null ? (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">XP</div>
                <div className="font-semibold text-emerald-300">{(user as any).xp}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Yopish</Button>
          <Button variant="gradient" onClick={onSave} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ==================== Change password modal ==================== */
function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShow(false);
  }, [open]);

  const submit = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Joriy va yangi parolni kiriting");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Yangi parollar mos emas");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("Yangi parol joriy paroldan farq qilishi kerak");
      return;
    }
    try {
      setSaving(true);
      const res = await authApi.changePassword({ currentPassword, newPassword });
      toast.success(res?.message || "Parol yangilandi", { title: "✓ Bajarildi" });
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Parolni yangilab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Parolni o'zgartirish">
      <div className="space-y-4 pt-2">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
          Xavfsizlik uchun yangi parolni hech kim bilan ulashmang. Kamida 6 ta belgidan iborat bo'lsin.
        </div>

        <Input
          label="Joriy parol"
          type={show ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <Input
          label="Yangi parol"
          type={show ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Kamida 6 ta belgi"
          autoComplete="new-password"
        />
        <Input
          label="Yangi parol (qayta)"
          type={show ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Yangi parolni qayta kiriting"
          autoComplete="new-password"
        />

        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          Parollarni ko'rsatish
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Yopish</Button>
          <Button variant="gradient" onClick={submit} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Yangilash"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function NotificationModal({ data, onClose, onReload }: { data: any; onClose: () => void; onReload: () => void }) {
  const list = Array.isArray(data?.notifications) ? data.notifications : [];
  const [activeId, setActiveId] = useState<string>(list[0]?.id || "");
  const active = list.find((n: any) => n.id === activeId) || list[0];
  useEffect(() => {
    if (!activeId && list[0]?.id) setActiveId(list[0].id);
  }, [list.length]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="h-[70vh] w-[78vw] max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <div className="text-lg font-bold text-white">Bildirishnomalar</div>
            <div className="text-xs text-slate-500">{data?.unreadCount || 0} ta o‘qilmagan</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={async () => { await notificationsApi.readAll(); onReload(); }}>Hammasini o‘qildi</Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Yopish</Button>
          </div>
        </div>
        <div className="grid h-[calc(70vh-73px)] grid-cols-[320px_1fr]">
          <div className="overflow-y-auto border-r border-white/[0.06]">
            {list.length === 0 ? <div className="p-4 text-sm text-slate-500">Bildirishnoma yo‘q.</div> : list.map((n: any) => (
              <button key={n.id} onClick={() => setActiveId(n.id)} className={cn("w-full border-b border-white/[0.04] p-4 text-left hover:bg-white/[0.03]", active?.id === n.id && "bg-white/[0.05]")}>
                <div className="flex items-center gap-2">
                  {!n.readAt && <span className="h-2 w-2 rounded-full bg-rose-400" />}
                  <span className="truncate text-sm font-semibold text-white">{n.title}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-slate-500">{n.body}</div>
              </button>
            ))}
          </div>
          <div className="overflow-y-auto p-6">
            {active ? (
              <>
                <Badge variant="primary" dot className="mb-3">{active.category || "general"}</Badge>
                <h3 className="text-2xl font-bold text-white">{active.title}</h3>
                <div className="mt-2 text-xs text-slate-500">{active.createdAt ? new Date(active.createdAt).toLocaleString("uz-UZ") : ""}</div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{active.body}</p>
                {!active.readAt && <Button className="mt-6" onClick={async () => { await notificationsApi.read(active.id); onReload(); }}>O‘qildi deb belgilash</Button>}
              </>
            ) : <div className="text-sm text-slate-500">Chapdan bildirishnoma tanlang.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== Mobile bottom nav ==================== */
function MobileBottomNav({
  nav,
  page,
  onNavigate,
}: {
  nav: NavItem[];
  page: Page;
  onNavigate: (p: Page) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5">
        {nav.map((item, i) => {
          const Icon = item.icon;
          const active = item.page === page;
          return (
            <button
              key={i}
              onClick={() => onNavigate(item.page)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] transition",
                active ? "text-primary-400" : "text-slate-500",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-primary-400" />
              )}
              <Icon className="h-[19px] w-[19px]" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ==================== Public Shell ==================== */
function homePageForRole(role?: string | null): Page {
  if (role === "admin") return "admin";
  if (role === "teacher") return "teacher-dashboard";
  if (role === "cashier") return "cashier";
  if (role === "receptionist") return "reception";
  if (role === "parent") return "parent";
  return "student-dashboard";
}

function personaForRole(role?: string | null): Persona {
  if (role === "admin") return "admin";
  if (role === "teacher") return "ustoz";
  if (role === "cashier") return "kassir";
  if (role === "receptionist") return "qabulxona";
  if (role === "parent") return "ota-ona";
  return "talaba";
}

function PublicShell({
  children,
  page,
  onNavigate,
  theme,
  toggleTheme,
  setPersona,
  brand,
}: {
  children: ReactNode;
  page: Page;
  onNavigate: (p: Page) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  setPersona: (p: Persona) => void;
  brand?: any;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cn(
          "sticky top-0 z-30 transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate("landing")}
            className="group flex items-center gap-2.5"
          >
            <div
              className={cn("relative flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition", brand?.animationEffect && brand.animationEffect !== "none" && `brand-${brand.animationEffect}`)}
              style={{ background: `linear-gradient(135deg, ${brand?.primaryColor || "#5a8aff"}, ${brand?.accentColor || "#8b5cf6"})` }}
            >
              <span className="text-sm font-bold text-white">{brand?.logoText || "T"}</span>
              <span className="absolute -inset-1 -z-10 rounded-2xl blur-md opacity-60" style={{ background: `linear-gradient(135deg, ${brand?.primaryColor || "#5a8aff"}55, ${brand?.accentColor || "#8b5cf6"}55)` }} />
            </div>
            <div>
              <span className={cn("text-lg font-semibold tracking-tight text-white", brand?.animationEffect && brand.animationEffect !== "none" && `brand-${brand.animationEffect}`)}>
                {brand?.name || "Talim"}
              </span>
              <span className="ml-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-300">
                Beta
              </span>
            </div>
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { l: "Kurslar", p: "courses" as Page },
              { l: "Ustozlar", p: "teachers" as Page },
              { l: "Kutubxona", p: "library" as Page },
              { l: "Markazlar", p: "map" as Page },
            ].map((n) => (
              <button
                key={n.l}
                onClick={() => onNavigate(n.p)}
                className="rounded-lg px-3.5 py-2 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                {n.l}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5"
              aria-label="Mavzu"
            >
              {theme === "dark" ? <ISun /> : <IMoon />}
            </button>
            {!user && page !== "login" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("login")}
              >
                Kirish
              </Button>
            )}
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                if (user) {
                  setPersona(personaForRole(user.role));
                  onNavigate(homePageForRole(user.role));
                } else {
                  onNavigate("login");
                }
              }}
            >
              {user ? "Mening kabinetim" : "Boshlash"} <IArrow className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="relative mt-12 border-t border-white/[0.06] bg-ink-950/60 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5 lg:px-8">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-lg shadow-primary-500/30">
                <span className="text-sm font-bold text-white">T</span>
              </div>
              <span className="text-lg font-semibold text-white">Talim</span>
            </div>
            <p className="max-w-md text-sm text-slate-400">
              Zamonaviy ta'lim va boshqaruv platformasi. Onlayn va oflayn
              kurslar, testlar, kutubxona — barchasi bitta joyda.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {["📘", "📷", "🐦", "▶️"].map((s) => (
                <button
                  key={s}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-sm transition hover:bg-white/[0.06]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <FooterCol
            title="Mahsulot"
            links={["Kurslar", "Ustozlar", "Kutubxona", "Testlar", "Quiz Battle"]}
          />
          <FooterCol
            title="Kompaniya"
            links={["Biz haqimizda", "Markazlar", "Vakansiyalar", "Hamkorlik", "Aloqa"]}
          />
          <FooterCol
            title="Yordam"
            links={["FAQ", "Foydalanish shartlari", "Maxfiylik", "Yordam markazi"]}
          />
        </div>
        <div className="relative border-t border-white/[0.05]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
            <span>© 2026 Talim. Barcha huquqlar himoyalangan.</span>
            <span className="flex items-center gap-1.5">
              <IPin className="h-3.5 w-3.5" /> Toshkent, O'zbekiston · O'zbek tilida
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="mb-3 text-[13px] font-semibold text-white">{title}</div>
      <ul className="space-y-2.5 text-sm text-slate-400">
        {links.map((l) => (
          <li key={l} className="cursor-pointer transition hover:text-white">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ==================== Name Emoji Picker (kompakt, Telegram Premium-style) ==================== */
function NameEmojiPicker({
  emoji,
  anim,
  onEmojiChange,
  onAnimChange,
}: {
  emoji: string;
  anim: NameEmojiAnim;
  onEmojiChange: (v: string) => void;
  onAnimChange: (v: NameEmojiAnim) => void;
}) {
  const [animOpen, setAnimOpen] = useState(false);
  const [emojiExpanded, setEmojiExpanded] = useState(false);
  const animRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!animOpen) return;
    const handler = (e: MouseEvent) => {
      if (animRef.current && !animRef.current.contains(e.target as Node)) {
        setAnimOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [animOpen]);

  const currentAnim =
    NAME_EMOJI_ANIMATIONS.find((a) => a.value === anim) ?? NAME_EMOJI_ANIMATIONS[0];

  // Kichik ekranlar uchun avval 20 ta ko'rsatamiz
  const displayedEmojis = emojiExpanded ? POPULAR_NAME_EMOJIS : POPULAR_NAME_EMOJIS.slice(0, 20);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.05] via-primary-500/[0.04] to-pink-500/[0.05] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="text-lg">✨</span>
            <span className="truncate">Ism yonidagi animatsiyali emoji</span>
            <Badge variant="warning" className="shrink-0">Premium</Badge>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Emoji tanlang va animatsiya ustiga bosib boshqa variantlarni ko'ring.
          </p>
        </div>
        {emoji && (
          <button
            type="button"
            onClick={() => onEmojiChange("")}
            className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
          >
            Olib tashlash
          </button>
        )}
      </div>

      {/* Tanlangan ko'rinish + animatsiya popover trigger */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Oldindan ko'rish</div>
          <div className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-white">
            <NameWithEmoji name="Sizning ismingiz" emoji={emoji || "✨"} anim={anim} />
          </div>
        </div>

        <div className="relative" ref={animRef}>
          <button
            type="button"
            onClick={() => setAnimOpen((v) => !v)}
            className={cn(
              "flex h-[58px] items-center gap-2 rounded-xl border px-3 transition",
              animOpen
                ? "border-primary-400/60 bg-gradient-to-br from-primary-500/20 to-accent-500/15 text-white"
                : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]",
            )}
            title={currentAnim.hint}
          >
            <NameEmoji emoji={emoji || "✨"} anim={currentAnim.value} className="text-lg" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Animatsiya</div>
              <div className="text-[12px] font-semibold leading-tight">{currentAnim.label}</div>
            </div>
            <svg
              className={cn("h-3.5 w-3.5 text-slate-400 transition", animOpen && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {animOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-white/[0.08] bg-ink-900 p-2 shadow-2xl">
              <div className="grid grid-cols-2 gap-1.5">
                {NAME_EMOJI_ANIMATIONS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => {
                      onAnimChange(a.value);
                      setAnimOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                      anim === a.value
                        ? "border-primary-400/60 bg-gradient-to-br from-primary-500/15 to-accent-500/10 text-white"
                        : "border-white/[0.04] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]",
                    )}
                    title={a.hint}
                  >
                    <NameEmoji emoji={emoji || "✨"} anim={a.value} className="text-base" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold leading-tight">{a.label}</div>
                      <div className="truncate text-[10px] text-slate-500">{a.hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emoji ro'yxati: dastlab 20 ta, "Ko'proq" bilan kengaytiriladi */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Emoji</div>
        <button
          type="button"
          onClick={() => setEmojiExpanded((v) => !v)}
          className="text-[11px] font-semibold text-primary-300 hover:text-primary-200"
        >
          {emojiExpanded ? "Yashirish" : `Yana (${POPULAR_NAME_EMOJIS.length - 20}+)`}
        </button>
      </div>
      <div
        className={cn(
          "mb-3 grid gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2",
          "grid-cols-10 sm:grid-cols-12",
        )}
      >
        {displayedEmojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onEmojiChange(e)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:scale-110 hover:bg-white/[0.08]",
              emoji === e && "bg-gradient-to-br from-primary-500/30 to-accent-500/30 ring-1 ring-primary-400/50",
            )}
            title={e}
          >
            {e}
          </button>
        ))}
      </div>

      <Input
        value={emoji}
        onChange={(e) => onEmojiChange(e.target.value.slice(0, 12))}
        placeholder="Yoki o'zingizning emojingiz: 🐲"
      />
    </div>
  );
}
