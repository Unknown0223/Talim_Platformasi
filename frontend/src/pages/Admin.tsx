import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Input, Modal, NameWithEmoji, Progress } from "../components/ui";
import {
  IBook,
  IUsers,
  IWallet,
  ITrophy,
  IPlus,
  IPin,
  ISearch,
  IStar,
} from "../components/icons";
import { admin as adminApi, courses as coursesApi, discounts as discountsApi, downloadBlob, payments as paymentsApi, locations as locationsApi, news as newsApi, settings as settingsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { hasPermission } from "../utils/permissions";

function parseMoney(value: any) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function formatMoneyInput(value: any) {
  const num = typeof value === "number" ? value : parseMoney(value);
  return num ? num.toLocaleString("uz-UZ") : "";
}

function courseTeacherName(course: any) {
  return course?.teacher?.name || course?.teacherId?.name || "Ustoz";
}

function courseSubjectName(course: any) {
  return course?.subject?.name || course?.subjectId?.name || "Fan";
}

function courseGroupKey(course: any) {
  return [
    String(courseSubjectName(course)).trim().toLowerCase(),
    String(course?.title || "").trim().toLowerCase(),
    String(course?.level || ""),
    String(course?.type || ""),
  ].join("|");
}

function courseGroupLabel(course: any) {
  const typeLabel = course?.type === "online" ? "Onlayn" : course?.type === "offline" ? "Oflayn" : course?.type || "Kurs";
  return `${courseSubjectName(course)} — ${course?.title || "Kurs"} (${typeLabel})`;
}

/* ==================== ADMIN PANEL ==================== */
export function Admin({ section = "overview" }: { section?: "overview" | "access" | "finance" | "users" }) {
  const [stats, setStats] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [permissionDefs, setPermissionDefs] = useState<any>({ permissions: [], presets: {} });
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [discountCampaigns, setDiscountCampaigns] = useState<any[]>([]);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [brand, setBrand] = useState<any>({
    name: "Talim",
    subtitle: "Learn Platform",
    logoText: "T",
    primaryColor: "#5a8aff",
    accentColor: "#8b5cf6",
    textStyle: "gradient",
    animationEffect: "glow",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locLat, setLocLat] = useState("");
  const [locLng, setLocLng] = useState("");
  const adminSection = section;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.stats().catch(() => null),
      adminApi.paymentAnalytics().catch(() => null),
      adminApi.users().catch(() => []),
      locationsApi.list().catch(() => []),
      adminApi.permissionDefinitions().catch(() => ({ permissions: [], presets: {} })),
      newsApi.list().catch(() => []),
      settingsApi.public().catch(() => null),
      discountsApi.campaigns().catch(() => []),
    ])
      .then(([s, a, u, loc, defs, news, publicSettings, discounts]) => {
        setStats(s);
        setAnalytics(a);
        setUsers(Array.isArray(u) ? u : []);
        setLocations(Array.isArray(loc) ? loc : []);
        setPermissionDefs(defs || { permissions: [], presets: {} });
        setNewsItems(Array.isArray(news) ? news : []);
        setDiscountCampaigns(Array.isArray(discounts) ? discounts : []);
        if (publicSettings?.brand) setBrand(publicSettings.brand);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Admin ma'lumotlari yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const formatUzMoney = (n: any) => {
    const num = Number(n || 0);
    return num.toLocaleString("uz-UZ");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero (admin amber tone) */}
      <Card glow glowColor="amber" className="overflow-hidden border-amber-500/20">
        <div className="relative p-6 sm:p-8">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0) 60%)",
            }}
          />
          <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="admin" dot className="mb-3">
                Admin Console · v3.2
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Boshqaruv paneli
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Foydalanuvchilar, fanlar, joylar va sozlamalar — bir joyda
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={async () => downloadBlob(await adminApi.export("payments"), "payments.xlsx")}>
                To‘lovlar Excel
              </Button>
              <Button onClick={() => setCreateUserOpen(true)}>
                <IPlus className="h-4 w-4" /> Yangi foydalanuvchi
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <AdminStat
          label="Foydalanuvchilar"
          value={String(stats?.users ?? users.length ?? "—")}
          delta=" "
          icon={IUsers}
        />
        <AdminStat label="Kurslar" value={String(stats?.courses ?? "—")} delta=" " icon={IBook} />
        <AdminStat label="Yozilishlar" value={String(stats?.enrollments ?? "—")} delta=" " icon={IStar} />
        <AdminStat
          label="To'lovlar"
          value={String(stats?.payments ?? "—")}
          delta={stats?.paymentsPending != null ? `${stats.paymentsPending} pending` : " "}
          icon={IWallet}
        />
        <AdminStat
          label="Daromad (tasdiqlangan)"
          value={stats?.revenueConfirmed != null ? `${formatUzMoney(stats.revenueConfirmed)} so'm` : "—"}
          delta=" "
          icon={IPin}
        />
        <AdminStat label="Test natijalari" value={String(stats?.testResults ?? "—")} delta=" " icon={ITrophy} />
      </div>

      <div className="space-y-6">
          {adminSection === "overview" ? (
            <>
              <div className="grid gap-6 xl:grid-cols-2">
                <BrandPanel brand={brand} setBrand={setBrand} />
                <NotificationComposer />
              </div>

              <NewsPanel newsItems={newsItems} setNewsItems={setNewsItems} />

              <DiscountPanel campaigns={discountCampaigns} setCampaigns={setDiscountCampaigns} />

              <Card className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Faollik · so'nggi 14 kun</h2>
                    <p className="text-xs text-slate-500">Yangi foydalanuvchilar va kurslarga yozilish</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400" /> Tasdiqlangan tushum
                    </span>
                    <span className="flex items-center gap-1.5 text-primary-300">
                      <span className="h-2 w-2 rounded-full bg-primary-400" /> Yozilish
                    </span>
                  </div>
                </div>
                <DualBarChart data={analytics?.trend || []} />
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Markazlar</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const fresh = await locationsApi.list().catch(() => []);
                        setLocations(Array.isArray(fresh) ? fresh : []);
                      }}
                    >
                      <IPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {locations.map((c: any) => (
                      <div key={c.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                            <IPin className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{c.name}</div>
                            <div className="text-[11px] text-slate-500">{c.address}</div>
                          </div>
                        </div>
                        <Progress value={60} color="from-amber-500 to-orange-500" size="sm" />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">Fan qo‘shish</h2>
                  <div className="space-y-3">
                    <Input placeholder="Fan nomi" value={subjectName} onChange={(e: any) => setSubjectName(e.target.value)} />
                    <Input placeholder="Qisqa izoh (ixtiyoriy)" value={subjectDesc} onChange={(e: any) => setSubjectDesc(e.target.value)} />
                    <Button
                      onClick={async () => {
                        await adminApi.createSubject({ name: subjectName, description: subjectDesc });
                        setSubjectName("");
                        setSubjectDesc("");
                      }}
                    >
                      Saqlash
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">Markaz qo‘shish</h2>
                  <div className="space-y-3">
                    <Input placeholder="Nomi" value={locName} onChange={(e: any) => setLocName(e.target.value)} />
                    <Input placeholder="Manzil" value={locAddress} onChange={(e: any) => setLocAddress(e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Lat" value={locLat} onChange={(e: any) => setLocLat(e.target.value)} />
                      <Input placeholder="Lng" value={locLng} onChange={(e: any) => setLocLng(e.target.value)} />
                    </div>
                    <Button
                      onClick={async () => {
                        await adminApi.createLocation({ name: locName, address: locAddress, lat: Number(locLat), lng: Number(locLng) });
                        setLocName("");
                        setLocAddress("");
                        setLocLat("");
                        setLocLng("");
                        const fresh = await locationsApi.list().catch(() => []);
                        setLocations(Array.isArray(fresh) ? fresh : []);
                      }}
                    >
                      Saqlash
                    </Button>
                  </div>
                </Card>
              </div>
            </>
          ) : null}

          {adminSection === "access" ? (
            <AdminAccessPanel
              users={users}
              setUsers={setUsers}
              permissionDefs={permissionDefs}
              setPermissionDefs={setPermissionDefs}
            />
          ) : null}

          {adminSection === "finance" ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">To‘lov ulushlari</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <span className="text-slate-400">Tasdiqlangan tushum</span>
                    <span className="font-bold text-white">{formatUzMoney(analytics?.totals?.confirmedRevenue)} so'm</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <span className="text-slate-400">Ustozlar ulushi</span>
                    <span className="font-bold text-emerald-300">{formatUzMoney(analytics?.totals?.teacherShare)} so'm</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <span className="text-slate-400">Platforma ulushi</span>
                    <span className="font-bold text-amber-300">{formatUzMoney(analytics?.totals?.platformShare)} so'm</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6 lg:col-span-2">
                <h2 className="mb-4 text-lg font-semibold text-white">Kurslar bo‘yicha tushum</h2>
                <div className="space-y-2">
                  {(analytics?.byCourse || []).length === 0 ? (
                    <div className="text-sm text-slate-500">Hali tasdiqlangan to‘lov yo‘q.</div>
                  ) : (
                    analytics.byCourse.map((row: any) => (
                      <div key={row.courseId} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                        <span className="truncate text-white">{row.title}</span>
                        <span className="text-slate-400">{row.count} ta</span>
                        <span className="font-semibold text-emerald-300">{formatUzMoney(row.revenue)} so'm</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ) : null}

          {adminSection === "users" ? (
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">So'nggi foydalanuvchilar</h2>
                  <p className="text-xs text-slate-500">Oxirgi 10 ta account</p>
                </div>
                <div className="w-full sm:w-64">
                  <Input placeholder="Qidirish..." icon={<ISearch className="h-4 w-4" />} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-left text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Ism</th>
                      <th className="py-3 font-semibold">Rol</th>
                      <th className="py-3 font-semibold">Holat</th>
                      <th className="py-3 font-semibold">Qo'shilgan</th>
                      <th className="py-3 pr-5 text-right font-semibold">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(loading ? [] : users.slice(0, 10)).map((u, i) => (
                      <tr key={i} className="transition hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar initials={(u?.name || "?").slice(0, 2).toUpperCase()} imageUrl={u?.avatar || undefined} online={!!u?.lastSeen} size="sm" />
                            <div>
                              <div className="font-medium text-white">
                                <NameWithEmoji name={u.name || "—"} emoji={u.nameEmoji} anim={u.nameEmojiAnim} />
                              </div>
                              <div className="text-xs text-slate-500">{u.email || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant={u.role === "student" ? "talaba" : u.role === "teacher" ? "ustoz" : "default"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={u.isApproved ? "success" : "warning"} dot>
                            {u.isApproved ? "Faol" : "Tasdiq kutilmoqda"}
                          </Badge>
                        </td>
                        <td className="text-xs text-slate-500">{u.createdAt ? "—" : "—"}</td>
                        <td className="pr-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.role === "teacher" && (
                              <Button
                                size="sm"
                                variant={u.isApproved ? "outline" : "gradient"}
                                onClick={async () => {
                                  await adminApi.updateUser(u.id, { isApproved: !u.isApproved });
                                  const fresh = await adminApi.users().catch(() => []);
                                  setUsers(Array.isArray(fresh) ? fresh : []);
                                }}
                              >
                                {u.isApproved ? "O‘chirish" : "Tasdiqlash"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                await adminApi.deleteUser(u.id);
                                const fresh = await adminApi.users().catch(() => []);
                                setUsers(Array.isArray(fresh) ? fresh : []);
                              }}
                            >
                              O'chirish
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {adminSection === "users" ? (
            <ParentLinksPanel users={users} />
          ) : null}
      </div>

      <CreateUserModal
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onCreated={async () => {
          const fresh = await adminApi.users().catch(() => []);
          setUsers(Array.isArray(fresh) ? fresh : []);
          setCreateUserOpen(false);
        }}
      />
    </div>
  );
}

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "admin" | "cashier" | "receptionist" | "parent">("student");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setPassword("");
    setRole("student");
  }, [open]);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Ism, email va parolni to'liq kiriting");
      return;
    }
    if (password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }
    try {
      setSaving(true);
      await adminApi.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      toast.success(`${role} hisobi yaratildi`, { title: "✓ Foydalanuvchi qo'shildi" });
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "Foydalanuvchi yaratilmadi");
    } finally {
      setSaving(false);
    }
  };

  const ROLE_OPTIONS: { v: typeof role; label: string; emoji: string; tone: string }[] = [
    { v: "student", label: "Talaba", emoji: "🎓", tone: "from-primary-500/15 to-violet-500/10 border-primary-400/30" },
    { v: "teacher", label: "Ustoz", emoji: "👨‍🏫", tone: "from-violet-500/15 to-purple-500/10 border-violet-400/30" },
    { v: "parent", label: "Ota-ona", emoji: "👨‍👩‍👧", tone: "from-emerald-500/15 to-teal-500/10 border-emerald-400/30" },
    { v: "cashier", label: "Kassir", emoji: "💵", tone: "from-emerald-500/15 to-teal-500/10 border-emerald-400/30" },
    { v: "receptionist", label: "Qabulxona", emoji: "🎫", tone: "from-pink-500/15 to-rose-500/10 border-pink-400/30" },
    { v: "admin", label: "Admin", emoji: "👑", tone: "from-amber-500/15 to-orange-500/10 border-amber-400/30" },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Yangi foydalanuvchi yaratish" size="lg">
      <div className="space-y-4">
        <div>
          <span className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            Rol
          </span>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setRole(opt.v)}
                className={`relative flex flex-col items-center gap-1 rounded-xl border bg-gradient-to-br px-3 py-3 text-xs font-semibold transition ${
                  role === opt.v
                    ? `${opt.tone} text-white shadow-lg`
                    : "border-white/[0.06] from-white/[0.02] to-transparent text-slate-400 hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span>{opt.label}</span>
                {role === opt.v && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Input label="To'liq ism" placeholder="Akmal Botirov" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" placeholder="user@talim.uz" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Boshlang'ich parol" placeholder="kamida 6 ta belgi" type="text" value={password} onChange={(e) => setPassword(e.target.value)} hint="Foydalanuvchiga aytib bering, keyin o'zgartirsa bo'ladi" />

        {role === "parent" && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-100">
            💡 Ota-ona yaratilgach, "Ota-ona ↔ Farzand" panelidan farzandga bog'lab qo'ying.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button variant="gradient" onClick={submit} disabled={saving}>
            {saving ? "Yaratilmoqda..." : "Yaratish"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ParentLinksPanel({ users }: { users: any[] }) {
  const toast = useToast();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");
  const [saving, setSaving] = useState(false);

  const parents = useMemo(() => users.filter((u) => u.role === "parent"), [users]);
  const students = useMemo(() => users.filter((u) => u.role === "student"), [users]);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await adminApi.parentLinks();
      setLinks(Array.isArray(data) ? data : []);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleLink = async () => {
    if (!parentId || !childId) {
      toast.error("Ota-ona va farzandni tanlang");
      return;
    }
    try {
      setSaving(true);
      await adminApi.linkParentChild(parentId, childId);
      toast.success("Ota-ona farzandga bog'landi", { title: "✓ Bog'landi" });
      setParentId("");
      setChildId("");
      void reload();
    } catch (e: any) {
      toast.error(e?.message || "Bog'lab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (link: any) => {
    try {
      await adminApi.unlinkParentChild(link.parentId, link.childId);
      toast.info("Bog'lanish olib tashlandi");
      void reload();
    } catch (e: any) {
      toast.error(e?.message || "Olib tashlab bo'lmadi");
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">👨‍👩‍👧 Ota-ona ↔ Farzand bog'lanishlari</h2>
          <p className="text-xs text-slate-500">{links.length} ta faol bog'lanish · Ota-ona farzand davomati va natijalarini ko'radi</p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-white/[0.05] p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-500">Ota-ona</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-ink-950 px-3 text-sm text-slate-200"
          >
            <option value="">— ota-onani tanlang ({parents.length} ta) —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-500">Farzand (talaba)</label>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-ink-950 px-3 text-sm text-slate-200"
          >
            <option value="">— farzandni tanlang ({students.length} ta) —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.studentId ? `· #${s.studentId}` : ""}
              </option>
            ))}
          </select>
        </div>
        <Button variant="gradient" onClick={handleLink} disabled={saving}>
          {saving ? "Bog'lanmoqda..." : "🔗 Bog'lash"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Yuklanmoqda...</div>
        ) : links.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            Hozircha bog'lanish yo'q. Yuqoridagi formadan birinchi bog'lanishni qo'shing.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">Ota-ona</th>
                <th className="py-3 font-semibold">Farzand</th>
                <th className="py-3 pr-5 text-right font-semibold">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {links.map((l) => (
                <tr key={`${l.parentId}_${l.childId}`} className="transition hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" initials={(l.parent?.name || "?").slice(0, 2).toUpperCase()} imageUrl={l.parent?.avatar || undefined} />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          <NameWithEmoji name={l.parent?.name || "—"} emoji={l.parent?.nameEmoji} anim={l.parent?.nameEmojiAnim} />
                        </div>
                        <div className="text-xs text-slate-500">{l.parent?.email || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" initials={(l.child?.name || "?").slice(0, 2).toUpperCase()} imageUrl={l.child?.avatar || undefined} />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          <NameWithEmoji name={l.child?.name || "—"} emoji={l.child?.nameEmoji} anim={l.child?.nameEmojiAnim} />
                        </div>
                        <div className="text-xs text-slate-500">
                          {l.child?.studentId ? `ID: ${l.child.studentId}` : l.child?.email || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="pr-5 text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleUnlink(l)}>
                      ✕ Bog'lanishni uzish
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function DualBarChart({ data }: { data: any[] }) {
  const rows = data.length
    ? data
    : Array.from({ length: 14 }, (_, i) => ({
        day: String(i + 1),
        confirmedRevenue: 0,
        enrollments: 0,
      }));
  const max = Math.max(...rows.flatMap((d) => [Number(d.confirmedRevenue || 0), Number(d.enrollments || 0)]), 1);
  return (
    <div className="flex items-end justify-between gap-1.5 h-44">
      {rows.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="relative flex w-full flex-1 items-end gap-0.5">
            <div
              className="flex-1 rounded-t bg-gradient-to-t from-amber-500/40 to-amber-400 transition hover:from-amber-500/60"
              style={{ height: `${(Number(d.confirmedRevenue || 0) / max) * 100}%` }}
            />
            <div
              className="flex-1 rounded-t bg-gradient-to-t from-primary-500/40 to-primary-400 transition hover:from-primary-500/60"
              style={{ height: `${(Number(d.enrollments || 0) / max) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-600">{String(d.day || "").slice(5) || i + 1}</div>
        </div>
      ))}
    </div>
  );
}

const animationPresets = [
  "none", "pulse", "float", "shine", "glow", "gradientShift", "typewriter", "wave", "bounceSoft", "neon",
  "spark", "blurIn", "slideIn", "zoomIn", "rotateSoft", "letterSpacing", "rainbow", "shadowPulse", "underlineFlow", "matrixSoft",
];

function AdminAccessPanel({ users, setUsers, permissionDefs, setPermissionDefs }: { users: any[]; setUsers: (u: any[]) => void; permissionDefs: any; setPermissionDefs: (defs: any) => void }) {
  const [mode, setMode] = useState<"role" | "user">("role");
  const roles = Array.isArray(permissionDefs?.roles) ? permissionDefs.roles : ["admin", "teacher", "cashier", "receptionist", "student", "parent"];
  const permissions = Array.isArray(permissionDefs?.permissions) ? permissionDefs.permissions : [];
  const groupOrder = ["Chegirma", "To‘lov", "Kurslar", "Foydalanuvchi", "O‘quv jarayoni", "Chat", "Bildirishnoma", "Sozlamalar", "Yangiliklar", "Joylar", "Fanlar", "Boshqa"];
  const grouped = permissions.reduce((acc: Record<string, any[]>, p: any) => {
    acc[p.group || "Boshqa"] ||= [];
    acc[p.group || "Boshqa"].push(p);
    return acc;
  }, {});
  const orderedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const ai = groupOrder.indexOf(a);
    const bi = groupOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const [selectedRole, setSelectedRole] = useState("cashier");
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const roleBaseForUser = permissionDefs?.presets?.[selectedUser?.role] || [];
  const [selectedUserExtras, setSelectedUserExtras] = useState<string[]>([]);
  const roleEffectiveSet = new Set(selectedRolePermissions);
  const userBaseSet = new Set(roleBaseForUser);
  const userExtraSet = new Set(selectedUserExtras);
  const userEffectiveSet = new Set([...roleBaseForUser, ...selectedUserExtras]);

  useEffect(() => {
    setSelectedRolePermissions(permissionDefs?.presets?.[selectedRole] || []);
  }, [permissionDefs, selectedRole]);

  useEffect(() => {
    if (!selectedUserId && users[0]?.id) setSelectedUserId(users[0].id);
  }, [users, selectedUserId]);

  useEffect(() => {
    setSelectedUserExtras(Array.isArray(selectedUser?.permissions) ? selectedUser.permissions : []);
  }, [selectedUser?.id, selectedUser?.permissions]);

  const defaultForRole = (role: string) => {
    if (role === "admin") return permissions.map((p: any) => p.key);
    return permissions.filter((p: any) => Array.isArray(p.roles) && p.roles.includes(role)).map((p: any) => p.key);
  };

  const toggleRolePermission = (key: string) => {
    if (selectedRole === "admin") return;
    setSelectedRolePermissions((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);
  };

  const toggleUserExtra = (key: string) => {
    if (userBaseSet.has(key)) return;
    setSelectedUserExtras((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);
  };

  const saveRole = async () => {
    const result = await adminApi.updateRolePermissions(selectedRole, selectedRolePermissions);
    setPermissionDefs({ ...permissionDefs, presets: result.presets || { ...permissionDefs.presets, [selectedRole]: result.permissions } });
  };

  const saveUser = async () => {
    if (!selectedUser?.id) return;
    await adminApi.updateUserPermissions(selectedUser.id, selectedUserExtras);
    const fresh = await adminApi.users().catch(() => []);
    setUsers(Array.isArray(fresh) ? fresh : []);
  };

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Dostuplar va ruxsatlar</h2>
          <p className="text-xs text-slate-500">Rol bo‘yicha umumiy dostup bering yoki bitta foydalanuvchiga rolidan tashqari qo‘shimcha dostup qo‘shing.</p>
        </div>
        <Badge variant="admin" dot>{permissions.length} ta permission</Badge>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode("role")} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${mode === "role" ? "border-primary-500/40 bg-primary-500/15 text-primary-200" : "border-white/[0.06] text-slate-400"}`}>
              Rol bo‘yicha
            </button>
            <button type="button" onClick={() => setMode("user")} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${mode === "user" ? "border-primary-500/40 bg-primary-500/15 text-primary-200" : "border-white/[0.06] text-slate-400"}`}>
              Foydalanuvchi bo‘yicha
            </button>
          </div>

          {mode === "role" ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">Tanlangan rolga berilgan dostup shu roldagi barcha foydalanuvchilarga ta’sir qiladi.</div>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200">
                {roles.map((role: string) => <option key={role} value={role}>{role}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/[0.03] p-3 text-slate-400">Tanlangan: <span className="font-bold text-white">{selectedRolePermissions.length}</span></div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-slate-400">Foydalanuvchi: <span className="font-bold text-white">{users.filter((u) => u.role === selectedRole).length}</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedRolePermissions(defaultForRole(selectedRole))}>Tizim default</Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedRolePermissions(permissions.map((p: any) => p.key))}>Hammasi</Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedRolePermissions([])} disabled={selectedRole === "admin"}>Tozalash</Button>
                <Button size="sm" onClick={saveRole} disabled={selectedRole === "admin"}>Rolni saqlash</Button>
              </div>
              {selectedRole === "admin" ? <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">Admin roli doim barcha dostupga ega.</div> : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">Foydalanuvchi roli o‘zgarmaydi. Bu yerda faqat rolidan tashqari qo‘shimcha dostup beriladi.</div>
              <select value={selectedUser?.id || ""} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200">
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-white/[0.03] p-3 text-slate-400">Rol: <span className="font-bold text-white">{selectedUser?.role || "—"}</span></div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-slate-400">Rol dostupi: <span className="font-bold text-white">{roleBaseForUser.length}</span></div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-slate-400">Qo‘shimcha: <span className="font-bold text-emerald-300">{selectedUserExtras.length}</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedUserExtras([])}>Qo‘shimchani tozalash</Button>
                <Button size="sm" onClick={saveUser}>Foydalanuvchini saqlash</Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-2 text-sm font-bold text-white">Qoidalar</div>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="rounded-xl bg-white/[0.03] p-3">Rol bo‘yicha tanlangan dostuplar shu roldagi barcha foydalanuvchilarga beriladi.</div>
            <div className="rounded-xl bg-white/[0.03] p-3">Foydalanuvchi bo‘yicha tanlov faqat qo‘shimcha dostup beradi, rolini o‘zgartirmaydi.</div>
            <div className="rounded-xl bg-white/[0.03] p-3">Foydalanuvchi rejimida roldan kelgan dostuplar belgilangan va qulflangan ko‘rinadi.</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {orderedGroups.map(([group, list]) => (
          <div key={group} className={`rounded-2xl border p-4 ${group === "Chegirma" ? "border-emerald-500/25 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-white">{group}</div>
              <Badge variant={group === "Chegirma" ? "success" : "default"}>{(list as any[]).length}</Badge>
            </div>
            <div className="space-y-2">
              {(list as Array<{ key: string; label: string; icon?: string }>).map((p) => {
                const checked = mode === "role" ? roleEffectiveSet.has(p.key) : userEffectiveSet.has(p.key);
                const lockedByRole = mode === "user" && userBaseSet.has(p.key);
                const extra = mode === "user" && userExtraSet.has(p.key);
                return (
                  <label key={p.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 ${checked ? "border-primary-500/35 bg-primary-500/10" : "border-white/[0.06] bg-white/[0.02]"} ${lockedByRole ? "cursor-not-allowed opacity-80" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={lockedByRole}
                      onChange={() => mode === "role" ? toggleRolePermission(p.key) : toggleUserExtra(p.key)}
                    />
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06]">{p.icon || "•"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-white">{p.label}</span>
                      <span className="block truncate text-[10px] text-slate-500">
                        {p.key}{lockedByRole ? " · roldan" : extra ? " · qo‘shimcha" : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BrandPanel({ brand, setBrand }: { brand: any; setBrand: (b: any) => void }) {
  const [saving, setSaving] = useState(false);
  const update = (patch: any) => setBrand({ ...brand, ...patch });
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white">Brand sozlamalari</h2>
      <p className="mb-4 text-xs text-slate-500">Chap tepadagi nom, rang, logo harfi va animatsiya effektlari.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={brand.name || ""} onChange={(e) => update({ name: e.target.value })} placeholder="Brand nomi" />
        <Input value={brand.subtitle || ""} onChange={(e) => update({ subtitle: e.target.value })} placeholder="Subtitle" />
        <Input value={brand.logoText || ""} onChange={(e) => update({ logoText: e.target.value })} placeholder="Logo text" />
        <select value={brand.animationEffect || "none"} onChange={(e) => update({ animationEffect: e.target.value })} className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200">
          {animationPresets.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <label className="text-xs text-slate-400">Primary <input type="color" value={brand.primaryColor || "#5a8aff"} onChange={(e) => update({ primaryColor: e.target.value })} className="ml-2 align-middle" /></label>
        <label className="text-xs text-slate-400">Accent <input type="color" value={brand.accentColor || "#8b5cf6"} onChange={(e) => update({ accentColor: e.target.value })} className="ml-2 align-middle" /></label>
      </div>
      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})` }}>{brand.logoText || "T"}</div>
          <div>
            <div className="font-bold text-white">{brand.name || "Talim"}</div>
            <div className="text-xs text-slate-500">{brand.subtitle || "Learn Platform"}</div>
          </div>
        </div>
      </div>
      <Button className="mt-4" disabled={saving} onClick={async () => { setSaving(true); try { await adminApi.updateBrand(brand); } finally { setSaving(false); } }}>
        Brandni saqlash
      </Button>
    </Card>
  );
}

function NotificationComposer() {
  const [roles, setRoles] = useState<string[]>(["teacher"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");
  const toggle = (role: string) => setRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white">Bildirishnoma yuborish</h2>
      <p className="mb-4 text-xs text-slate-500">Admin, kassir, ustoz va qabulxonaga ichki inbox xabari yuboring.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {["admin", "teacher", "cashier", "receptionist"].map((r) => (
          <label key={r} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">
            <input type="checkbox" checked={roles.includes(r)} onChange={() => toggle(r)} className="mr-2" />{r}
          </label>
        ))}
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mavzu" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Xabar matni..." className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-500/60" />
      {result && <div className="mt-3 text-sm text-slate-300">{result}</div>}
      <Button className="mt-4" onClick={async () => {
        try {
          const res = await adminApi.sendNotification({ title, body, roles });
          setResult(res.message || "Yuborildi");
          setTitle("");
          setBody("");
        } catch (e: any) {
          setResult(e?.message || "Yuborilmadi");
        }
      }}>Yuborish</Button>
    </Card>
  );
}

function NewsPanel({ newsItems, setNewsItems }: { newsItems: any[]; setNewsItems: (items: any[]) => void }) {
  const [draft, setDraft] = useState<any>({
    title: "",
    body: "",
    type: "contest",
    icon: "🏆",
    color: "from-amber-500 to-orange-600",
    priority: 5,
    isPublished: true,
    requiresParticipation: true,
    maxParticipants: 50,
    prize: "",
    endsAt: "",
  });
  const [winnerCounts, setWinnerCounts] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string>("");

  const refresh = async () => {
    const fresh = await newsApi.list().catch(() => []);
    setNewsItems(Array.isArray(fresh) ? fresh : []);
  };

  const submit = async () => {
    const payload = {
      ...draft,
      maxParticipants: draft.requiresParticipation
        ? Number(draft.maxParticipants) || null
        : null,
      endsAt: draft.endsAt || null,
    };
    await newsApi.create(payload);
    await refresh();
    setDraft({
      title: "",
      body: "",
      type: "contest",
      icon: "🏆",
      color: "from-amber-500 to-orange-600",
      priority: 5,
      isPublished: true,
      requiresParticipation: true,
      maxParticipants: 50,
      prize: "",
      endsAt: "",
    });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Chegirmalar, imtihonlar va sovrinli tadbirlar</h2>
          <p className="text-xs text-slate-500">"Qatnashish" tugmali tanlovlar, muddat va sovrinlar bilan boshqaring.</p>
        </div>
        <Badge variant="primary">{newsItems.length} ta</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold text-slate-300">Yangi tadbir / yangilik</h3>
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Sarlavha" />
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Tavsif…"
            className="min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-500/60"
          />
          <div className="grid grid-cols-3 gap-2">
            <Input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="🏆" />
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200"
            >
              <option value="discount">Chegirma</option>
              <option value="exam">Imtihon</option>
              <option value="contest">Tanlov / sovrinli</option>
              <option value="event">Tadbir</option>
              <option value="news">Yangilik</option>
            </select>
            <Input
              type="number"
              value={String(draft.priority)}
              onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 0 })}
              placeholder="Priority"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <input
              type="checkbox"
              checked={!!draft.requiresParticipation}
              onChange={(e) => setDraft({ ...draft, requiresParticipation: e.target.checked })}
              className="h-4 w-4 accent-primary-500"
            />
            <span className="text-sm font-medium text-slate-200">"Qatnashish" tugmasi yoqilsin</span>
          </label>
          {draft.requiresParticipation && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={String(draft.maxParticipants ?? "")}
                onChange={(e) => setDraft({ ...draft, maxParticipants: Number(e.target.value) || "" })}
                placeholder="Max qatnashuvchi"
              />
              <Input
                value={draft.prize || ""}
                onChange={(e) => setDraft({ ...draft, prize: e.target.value })}
                placeholder="Sovrin (masalan: iPhone 15)"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Tugash sanasi (teskari sanoq)</label>
            <input
              type="datetime-local"
              value={draft.endsAt || ""}
              onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-500/60"
            />
          </div>
          <Button onClick={submit} className="w-full">+ Tadbirni qo'shish</Button>
        </div>

        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {newsItems.length === 0 ? (
            <div className="text-sm text-slate-500">Hali tadbir yo'q.</div>
          ) : (
            newsItems.map((n) => {
              const partCount = n.participantsCount ?? 0;
              const limit = n.maxParticipants || 0;
              const winners = (n.recentParticipants || []).filter((p: any) => p.isWinner);
              return (
                <div key={n.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className="text-lg">{n.icon || "📰"}</span>
                        <span className="truncate">{n.title}</span>
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{n.body}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <Badge variant="outline">{n.type}</Badge>
                        {n.requiresParticipation && (
                          <Badge variant="primary" dot>
                            {partCount}{limit > 0 ? `/${limit}` : ""} qatnashuvchi
                          </Badge>
                        )}
                        {n.prize && <Badge variant="warning">🎁 {n.prize}</Badge>}
                        {n.endsAt && (
                          <span className="text-[10px] text-slate-500">
                            ⏱ {new Date(n.endsAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        )}
                      </div>
                      {winners.length > 0 && (
                        <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                          🏆 G'oliblar:{" "}
                          {winners.map((w: any, idx: number) => w.user ? (
                            <span key={w.id || w.user.id}>
                              {idx > 0 ? ", " : ""}
                              <NameWithEmoji name={w.user.name} emoji={w.user.nameEmoji} anim={w.user.nameEmojiAnim} />
                            </span>
                          ) : null)}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      {n.requiresParticipation && partCount > 0 && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            value={winnerCounts[n.id] ?? 1}
                            onChange={(e) => setWinnerCounts((s) => ({ ...s, [n.id]: Math.max(1, Number(e.target.value) || 1) }))}
                            className="h-7 w-12 rounded border border-white/10 bg-ink-950 px-1.5 text-xs text-slate-200"
                          />
                          <Button
                            size="sm"
                            variant="soft"
                            disabled={busyId === n.id}
                            onClick={async () => {
                              setBusyId(n.id);
                              try {
                                await newsApi.pickWinners(n.id, winnerCounts[n.id] ?? 1);
                                await refresh();
                              } finally {
                                setBusyId("");
                              }
                            }}
                          >
                            🎲 G'olib
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await newsApi.remove(n.id);
                          await refresh();
                        }}
                      >
                        O'chirish
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

function DiscountPanel({ campaigns, setCampaigns }: { campaigns: any[]; setCampaigns: (items: any[]) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [picked, setPicked] = useState<any | null>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [draft, setDraft] = useState({ title: "", courseId: "", type: "percent", value: 10, maxWinners: 5, minScore: 70 });
  const [manualUserId, setManualUserId] = useState("");

  useEffect(() => {
    coursesApi.list().then((rows) => setCourses(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  const reload = async () => setCampaigns(await discountsApi.campaigns().catch(() => []));
  const loadAwards = async (campaign: any) => {
    setPicked(campaign);
    setAwards(await discountsApi.awards(campaign.id).catch(() => []));
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Chegirmalar va g‘oliblar</h2>
          <p className="text-xs text-slate-500">Avtomatik shartlar bo‘yicha eligible ro‘yxat, admin qo‘lda qo‘shish/olib tashlash nazorati.</p>
        </div>
        <Badge variant="admin">{campaigns.length} kampaniya</Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Kampaniya nomi" />
          <select value={draft.courseId} onChange={(e) => setDraft({ ...draft, courseId: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200">
            <option value="">Barcha kurslar</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200">
              <option value="percent">Foiz</option>
              <option value="fixed">Summa</option>
            </select>
            <Input value={String(draft.value)} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) as any })} placeholder="Qiymat" />
            <Input value={String(draft.maxWinners)} onChange={(e) => setDraft({ ...draft, maxWinners: Number(e.target.value) as any })} placeholder="G‘oliblar" />
          </div>
          <Input value={String(draft.minScore)} onChange={(e) => setDraft({ ...draft, minScore: Number(e.target.value) as any })} placeholder="Minimal score" />
          <Button onClick={async () => {
            await discountsApi.createCampaign({
              title: draft.title,
              courseId: draft.courseId || null,
              type: draft.type,
              value: Number(draft.value),
              maxWinners: Number(draft.maxWinners),
              rules: { minScore: Number(draft.minScore) },
              status: "active",
            });
            setDraft({ title: "", courseId: "", type: "percent", value: 10, maxWinners: 5, minScore: 70 });
            await reload();
          }}>Kampaniya yaratish</Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {campaigns.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => loadAwards(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") loadAwards(c);
                }}
                className="w-full cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.05]"
              >
                <div className="text-sm font-bold text-white">{c.title}</div>
                <div className="text-xs text-slate-500">{c.course?.title || "Barcha kurslar"} · {c.value}{c.type === "percent" ? "%" : " so‘m"} · {c._count?.awards || 0} eligible</div>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={async (e) => { e.stopPropagation(); await discountsApi.refresh(c.id); await reload(); await loadAwards(c); }}>Ro‘yxatni hisoblash</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-2 text-sm font-bold text-white">{picked ? `${picked.title} ro‘yxati` : "Kampaniya tanlang"}</div>
            {picked ? (
              <div className="mb-3 flex gap-2">
                <Input value={manualUserId} onChange={(e) => setManualUserId(e.target.value)} placeholder="Talaba userId" />
                <Button size="sm" onClick={async () => {
                  if (!manualUserId) return;
                  await discountsApi.manualAward(picked.id, { userId: manualUserId, courseId: picked.courseId, status: "eligible" });
                  setManualUserId("");
                  await loadAwards(picked);
                }}>Qo‘shish</Button>
              </div>
            ) : null}
            <div className="space-y-2">
              {awards.map((a) => (
                <div key={a.id} className="rounded-lg bg-white/[0.03] p-2 text-xs">
                  <div className="font-semibold text-white">{a.user?.name || a.userId}</div>
                  <div className="text-slate-500">{a.status} · {a.source} · {Number(a.discountAmount || 0).toLocaleString("uz-UZ")} so‘m</div>
                  <Button size="sm" variant="ghost" onClick={async () => { await discountsApi.manualAward(a.campaignId, { userId: a.userId, courseId: a.courseId, status: "excluded", reason: "Admin olib tashladi" }); await loadAwards(picked); }}>Olib tashlash</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AdminStat({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof IUsers;
}) {
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span className="text-[11px] font-semibold text-emerald-400">
          ↗ {delta}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-white">
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </Card>
  );
}

/* ==================== CASHIER ==================== */
export function CashierPage({ onNewPayment }: { onNewPayment?: () => void }) {
  const { user } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [paymentQ, setPaymentQ] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseGroupKey, setSelectedCourseGroupKey] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseStats, setCourseStats] = useState<any | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const canConfirmDiscounted = hasPermission(user, "payment.discounted_confirm");
  const canApplyDiscount = hasPermission(user, "discount.apply");

  const courseGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const course of courses) {
      const key = courseGroupKey(course);
      map.set(key, [...(map.get(key) || []), course]);
    }
    return Array.from(map.entries()).map(([key, variants]) => ({
      key,
      label: courseGroupLabel(variants[0]),
      variants: [...variants].sort((a, b) => courseTeacherName(a).localeCompare(courseTeacherName(b))),
    }));
  }, [courses]);

  const selectedGroup = courseGroups.find((group) => group.key === selectedCourseGroupKey) || courseGroups[0];
  const selectedCourse = courses.find((course) => String(course.id) === String(selectedCourseId));

  const discountSummary = useMemo(() => {
    const rows = [...payments, ...pending].filter((p, index, arr) => arr.findIndex((x) => x.id === p.id) === index);
    const discounted = rows.filter((p) => Number(p.discountAmount || 0) > 0 || p.discountAwardId);
    return {
      pendingCount: discounted.filter((p) => p.status === "pending").length,
      confirmedCount: discounted.filter((p) => p.status === "confirmed").length,
      totalDiscount: discounted.reduce((sum, p) => sum + Number(p.discountAmount || 0), 0),
    };
  }, [payments, pending]);

  const reload = () => {
    setLoading(true);
    Promise.all([
      paymentsApi.pending().catch(() => []),
      paymentsApi.summary().catch(() => null),
      paymentsApi
        .list({
          status: paymentStatus,
          method: paymentMethod,
          q: paymentQ,
        })
        .catch(() => []),
      coursesApi.list().catch(() => []),
    ])
      .then(([pendingList, s, allPayments, courseRows]) => {
        setPending(Array.isArray(pendingList) ? pendingList : []);
        setPayments(Array.isArray(allPayments) ? allPayments : []);
        setSummary(s);
        const cs = Array.isArray(courseRows) ? courseRows : [];
        setCourses(cs);
        if (!selectedCourseId && cs[0]?.id) {
          setSelectedCourseGroupKey(courseGroupKey(cs[0]));
          setSelectedCourseId(cs[0].id);
          setNewPrice(formatMoneyInput(cs[0].price || 0));
        }
        setError("");
      })
      .catch((e: any) => setError(e?.message || "To'lovlar yuklanmadi"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [paymentStatus, paymentMethod]);

  useEffect(() => {
    if (!selectedCourseId) return;
    coursesApi.stats(selectedCourseId).then((s) => {
      setCourseStats(s);
      setNewPrice(formatMoneyInput(s?.course?.price || 0));
    }).catch(() => setCourseStats(null));
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedGroup?.variants?.length) return;
    const hasSelected = selectedGroup.variants.some((variant) => String(variant.id) === String(selectedCourseId));
    if (!hasSelected) setSelectedCourseId(selectedGroup.variants[0].id);
  }, [selectedCourseGroupKey, selectedGroup, selectedCourseId]);

  const filteredPayments = payments.filter((p) => {
    const qq = paymentQ.trim().toLowerCase();
    if (!qq) return true;
    return (
      String(p?.user?.name || "").toLowerCase().includes(qq) ||
      String(p?.user?.email || "").toLowerCase().includes(qq) ||
      String(p?.course?.title || "").toLowerCase().includes(qq)
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="admin" dot className="mb-3">
            💼 Kassa zonasi
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Kassa boshqaruvi
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            To'lovlar, qabul va kvitansiyalar — bugun
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Kunlik hisobot</Button>
          <Button type="button" onClick={() => onNewPayment?.()}>
            <IPlus className="h-4 w-4" /> Yangi to'lov
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStat
          label="Kutilayotgan to'lovlar"
          value={String(summary?.pendingCount ?? pending.length)}
          delta=" "
          icon={IWallet}
        />
        <AdminStat
          label="Bugun tasdiqlangan"
          value={summary?.confirmedToday != null ? `${Number(summary.confirmedToday).toLocaleString("uz-UZ")} so'm` : "—"}
          delta=" "
          icon={IBook}
        />
        <AdminStat
          label="Oy bo'yicha tasdiqlangan"
          value={summary?.confirmedMonth != null ? `${Number(summary.confirmedMonth).toLocaleString("uz-UZ")} so'm` : "—"}
          delta=" "
          icon={ITrophy}
        />
        <AdminStat
          label="Tasdiqlangan to'lovlar"
          value={String(summary?.confirmedCount ?? "—")}
          delta=" "
          icon={IUsers}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-white">Chegirma nazorati</h2>
            <p className="mt-1 text-xs text-slate-500">Chegirmali to‘lovlar va dostup holati.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5">
              <div className="text-[11px] text-amber-200">Pending chegirmali</div>
              <div className="text-lg font-bold text-white">{summary?.discountedPendingCount ?? discountSummary.pendingCount}</div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
              <div className="text-[11px] text-emerald-200">Tasdiqlangan</div>
              <div className="text-lg font-bold text-white">{summary?.discountedConfirmedCount ?? discountSummary.confirmedCount}</div>
            </div>
            <div className="rounded-xl border border-primary-500/20 bg-primary-500/10 p-2.5">
              <div className="text-[11px] text-primary-200">Jami chegirma</div>
              <div className="text-lg font-bold text-white">{Number(summary?.discountTotal ?? discountSummary.totalDiscount).toLocaleString("uz-UZ")} so‘m</div>
            </div>
          </div>
          {!canConfirmDiscounted ? (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              `payment.discounted_confirm` yo‘q: chegirmali to‘lov uchun dostup kerak.
            </div>
          ) : null}
          {!canApplyDiscount ? (
            <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
              `discount.apply` yo‘q: yangi to‘lovda chegirma qo‘llanmaydi.
            </div>
          ) : null}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-base font-semibold text-white">Kurs narxi va statistikasi</h2>
          <div className="space-y-2.5 text-sm text-slate-400">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Fan va kurs</div>
                <select
                  value={selectedCourseGroupKey || selectedGroup?.key || ""}
                  onChange={(e) => setSelectedCourseGroupKey(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200"
                >
                  {courseGroups.map((group) => (
                    <option key={group.key} value={group.key}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
              {selectedGroup?.variants?.length > 1 ? (
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">O‘qituvchi</div>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200"
                  >
                    {selectedGroup.variants.map((c) => (
                      <option key={c.id} value={c.id}>
                        {courseTeacherName(c)} — {Number(c.price || 0).toLocaleString("uz-UZ")} so‘m
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">O‘qituvchi</div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-semibold text-white">
                    {selectedCourse ? courseTeacherName(selectedCourse) : "Avtomatik tanlanadi"}
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="truncate font-semibold text-white">{courseStats?.course?.title || "Kurs"}</div>
                <div className="mt-1 truncate text-slate-300">{courseStats?.course?.teacher?.name || "Ustoz"}</div>
                <div className="mt-1 text-xs text-slate-500">{courseStats?.enrollmentCount ?? 0} talaba · {Number(courseStats?.payments?.confirmedRevenue || 0).toLocaleString("uz-UZ")} so‘m tushum</div>
              </div>
              <div className="flex gap-2">
                <Input value={newPrice} onChange={(e) => setNewPrice(formatMoneyInput(e.target.value))} placeholder="Yangi narx" />
                <Button size="sm" onClick={async () => {
                  if (!selectedCourseId) return;
                  await coursesApi.updatePrice(selectedCourseId, parseMoney(newPrice));
                  const s = await coursesApi.stats(selectedCourseId);
                  setCourseStats(s);
                  setNewPrice(formatMoneyInput(s?.course?.price || 0));
                  setSuccess("Kurs narxi yangilandi.");
                }}>Saqlash</Button>
              </div>
            </div>
            <div className="text-xs text-slate-500">Narx faqat tanlangan ustoz variantiga qo‘llanadi.</div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold text-white">
            Kutilayotgan to'lovlar
          </h2>
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05] text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-3 font-semibold">Vaqt</th>
                  <th className="pb-3 font-semibold">Talaba</th>
                  <th className="pb-3 font-semibold">Kurs</th>
                  <th className="pb-3 font-semibold">Summa</th>
                  <th className="pb-3 font-semibold">Chegirma</th>
                  <th className="pb-3 font-semibold">Usul</th>
                  <th className="pb-3 font-semibold">Holat</th>
                  <th className="w-[92px] pb-3 text-center font-semibold">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan={8}>Yuklanmoqda...</td>
                  </tr>
                ) : pending.length === 0 ? (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan={8}>Kutilayotgan to‘lov yo‘q</td>
                  </tr>
                ) : (
                  pending.map((p: any) => {
                    const hasDiscount = Number(p.discountAmount || 0) > 0 || p.discountAwardId;
                    const confirmBlocked = hasDiscount && !canConfirmDiscounted;
                    return (
                      <tr key={p.id} className="transition hover:bg-white/[0.02]">
                        <td className="py-2.5 font-mono text-[11px] text-slate-500">
                          <div>{p.createdAt ? new Date(p.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                        </td>
                        <td className="max-w-[120px] truncate font-medium text-white">
                          {p.user ? <NameWithEmoji name={p.user.name || "—"} emoji={p.user.nameEmoji} anim={p.user.nameEmojiAnim} /> : "—"}
                        </td>
                        <td>
                          <div className="max-w-[170px] truncate text-slate-300">{p.course?.title || "—"}</div>
                          <div className="max-w-[170px] truncate text-[10px] text-slate-500">{p.course?.teacher?.name || "Ustoz"}</div>
                        </td>
                        <td>
                          <div className="whitespace-nowrap font-semibold text-white">{Number(p.amount || 0).toLocaleString("uz-UZ")}</div>
                          <div className="text-[10px] text-slate-600">so‘m</div>
                        </td>
                        <td>
                          {hasDiscount ? (
                            <div>
                              <div className="whitespace-nowrap font-semibold text-emerald-300">-{Number(p.discountAmount || 0).toLocaleString("uz-UZ")}</div>
                              <div className="max-w-[120px] truncate text-[10px] text-emerald-400/80">{p.discountAward?.campaign?.title || "Chegirma"}</div>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                          {hasDiscount && p.originalAmount ? (
                            <div className="whitespace-nowrap text-[10px] text-slate-500">Asl: {Number(p.originalAmount).toLocaleString("uz-UZ")}</div>
                          ) : null}
                        </td>
                        <td className="text-slate-400">{p.method || "—"}</td>
                        <td>
                          <Badge variant="warning" dot>Kutilmoqda</Badge>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            disabled={confirmBlocked}
                            className={`inline-flex h-7 min-w-[76px] items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition ${
                              confirmBlocked
                                ? "cursor-not-allowed border border-amber-500/20 bg-amber-500/10 text-amber-200"
                                : "border border-primary-400/30 bg-primary-500/15 text-primary-100 hover:bg-primary-500/25"
                            }`}
                            onClick={async () => {
                              try {
                                setSuccess("");
                                await paymentsApi.confirm(p.id);
                                setSuccess("To‘lov tasdiqlandi, kurs talaba uchun ochildi.");
                                reload();
                              } catch (e: any) {
                                setError(e?.message || "To‘lov tasdiqlanmadi");
                              }
                            }}
                          >
                            {confirmBlocked ? "Dostup kerak" : "Tasdiqlash"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

      <Card className="p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">To‘lovlar tarixi</h2>
            <p className="text-xs text-slate-500">Pending, tasdiqlangan va boshqa holatdagi to‘lovlar</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:w-[720px]">
            <Input
              placeholder="Talaba yoki kurs..."
              value={paymentQ}
              onChange={(e: any) => setPaymentQ(e.target.value)}
            />
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-ink-950 px-3 text-sm text-slate-200"
            >
              <option value="all">Holat: barchasi</option>
              <option value="pending">Kutilmoqda</option>
              <option value="confirmed">Tasdiqlangan</option>
              <option value="cancelled">Bekor qilingan</option>
            </select>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-ink-950 px-3 text-sm text-slate-200"
            >
              <option value="all">Usul: barchasi</option>
              <option value="Click">Click</option>
              <option value="Payme">Payme</option>
              <option value="Naqd">Naqd</option>
              <option value="Demo">Demo</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05] text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="pb-3 font-semibold">Sana</th>
                <th className="pb-3 font-semibold">Talaba</th>
                <th className="pb-3 font-semibold">Kurs</th>
                <th className="pb-3 font-semibold">Asl summa</th>
                <th className="pb-3 font-semibold">Chegirma</th>
                <th className="pb-3 font-semibold">To‘landi</th>
                <th className="pb-3 font-semibold">Usul</th>
                <th className="pb-3 font-semibold">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td className="py-4 text-slate-400" colSpan={8}>To‘lov topilmadi</td>
                </tr>
              ) : (
                filteredPayments.map((p: any) => {
                  const hasDiscount = Number(p.discountAmount || 0) > 0 || p.discountAwardId;
                  return (
                    <tr key={p.id} className="transition hover:bg-white/[0.02]">
                      <td className="py-2.5 text-[11px] text-slate-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("uz-UZ") : "—"}
                      </td>
                      <td className="max-w-[130px] truncate font-medium text-white">
                        {p.user ? <NameWithEmoji name={p.user.name || "—"} emoji={p.user.nameEmoji} anim={p.user.nameEmojiAnim} /> : "—"}
                      </td>
                      <td>
                        <div className="max-w-[190px] truncate text-slate-300">{p.course?.title || "—"}</div>
                        <div className="max-w-[190px] truncate text-[10px] text-slate-500">{p.course?.teacher?.name || "Ustoz"}</div>
                      </td>
                      <td className="whitespace-nowrap text-slate-300">
                        {Number(p.originalAmount || p.amount || 0).toLocaleString("uz-UZ")}
                      </td>
                      <td>
                        {hasDiscount ? (
                          <div>
                            <div className="whitespace-nowrap font-semibold text-emerald-300">-{Number(p.discountAmount || 0).toLocaleString("uz-UZ")}</div>
                            <div className="max-w-[130px] truncate text-[10px] text-emerald-400/80">{p.discountAward?.campaign?.title || "Chegirma"}</div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap font-semibold text-white">{Number(p.amount || 0).toLocaleString("uz-UZ")}</td>
                      <td className="text-slate-400">{p.method || "—"}</td>
                      <td>
                        <Badge variant={p.status === "confirmed" ? "success" : p.status === "pending" ? "warning" : "default"} dot>
                          {p.status || "—"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
