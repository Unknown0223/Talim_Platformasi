import { Button, Card, Badge, Avatar } from "../components/ui";
import {
  IArrow,
  ICheck,
  IPlay,
  IStar,
  IUsers,
  IClock,
} from "../components/icons";
import type { Page } from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import { courses as coursesApi, news as newsApi, teachers as teachersApi, type NewsItem } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function Landing({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([coursesApi.list().catch(() => []), teachersApi.list().catch(() => []), newsApi.active().catch(() => [])])
      .then(([c, t, n]) => {
        setCourses(Array.isArray(c) ? c : []);
        setTeachers(Array.isArray(t) ? t : []);
        setNewsItems(Array.isArray(n) ? n : []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Ma'lumotlar yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const replaceNews = (next: NewsItem) => {
    setNewsItems((prev) => prev.map((item) => (item.id === next.id ? next : item)));
  };

  const topTeachers = useMemo(() => teachers.slice(0, 6), [teachers]);
  const topCourses = useMemo(() => courses.slice(0, 3), [courses]);

  return (
    <div className="overflow-x-hidden animate-fade-in">
      {/* ============ HERO ============ */}
      <section className="relative">
        <div className="hero-glow absolute inset-x-0 top-0 h-[700px] -z-10" />
        <div className="absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute left-[10%] top-32 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl animate-float-slow -z-10" />
        <div className="pointer-events-none absolute right-[8%] top-48 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl animate-float -z-10" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="primary" className="mb-6 px-3 py-1" dot>
              Yangi · Kurslar va dars jadvali yangilandi
            </Badge>
            <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl">
              Bilim olishning{" "}
              <span className="relative">
                <span className="text-gradient">zamonaviy</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                >
                  <path
                    d="M2 6 Q 50 0, 100 4 T 198 4"
                    stroke="url(#g)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="200" y2="0">
                      <stop offset="0" stopColor="#5a8aff" />
                      <stop offset="0.5" stopColor="#a78bfa" />
                      <stop offset="1" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>{" "}
              yo'li
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-slate-400 sm:text-lg">
              Onlayn va oflayn darsliklar, jonli darslar, testlar, kutubxona,
              davomat va ota-ona paneli — barchasi bitta zamonaviy platformada.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => onNavigate("register")}
                className="min-w-[200px]"
              >
                Bepul boshlash <IArrow className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate("courses")}
                className="min-w-[200px]"
              >
                <IPlay className="h-4 w-4" /> Kurslar katalogi
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate("tests")}
                className="min-w-[200px]"
              >
                🧠 Diagnostika test (Guest)
              </Button>
            </div>

            {/* Avatars trust */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <div className="flex -space-x-2.5">
                {topTeachers.slice(0, 5).map((t) => (
                  <Avatar
                    key={t.id || t._id || t.name}
                    initials={(t?.name || "?").slice(0, 2).toUpperCase()}
                    color="from-primary-500 to-accent-500"
                    size="sm"
                    imageUrl={t.imageUrl}
                    ring
                  />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center gap-0.5 sm:justify-start">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IStar key={i} className="h-3.5 w-3.5 text-amber-400" />
                  ))}
                  <span className="ml-1.5 text-xs font-semibold text-white">4.9</span>
                </div>
                <div className="text-xs text-slate-500">
                  {error ? error : loading ? "Yuklanmoqda..." : `${teachers.length}+ foydalanuvchi`}
                </div>
              </div>
            </div>
          </div>

          {/* ============ HERO PRODUCT MOCK ============ */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-primary-500/30 via-accent-500/30 to-pink-500/20 opacity-50 blur-2xl" />
            <Card className="relative overflow-hidden p-2 sm:p-3">
              <div className="rounded-2xl bg-ink-950/95 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <div className="ml-3 flex-1 rounded-md bg-white/[0.04] px-3 py-1 text-[11px] text-slate-500">
                    🔒 talim.uz/dashboard
                  </div>
                </div>
                {/* Inside */}
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-gradient-to-br from-primary-500/15 to-primary-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-wider text-primary-300">
                      Bugungi darslar
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white font-mono">3</div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">14:00 IELTS</span>
                        <Badge variant="primary">Jonli</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">16:30 Math</span>
                        <span className="text-slate-500">Oflayn</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-accent-500/15 to-accent-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-wider text-accent-400">
                      O'rtacha ball
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white font-mono">8.7</div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5 mt-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-pink-500" style={{ width: "87%" }} />
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">+0.4 bu hafta</div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-300">
                      Quiz Battle
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white font-mono">#3</div>
                    <div className="mt-3 flex items-center gap-1">
                      <span className="text-xs">🏆</span>
                      <span className="text-[11px] text-slate-400">980 ball</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 p-4 pt-0 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        Kurs progressi
                      </span>
                      <Badge variant="success" dot>4 faol</Badge>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { n: "IELTS 7.0+", p: 78 },
                        { n: "Frontend", p: 45 },
                        { n: "Matematika", p: 62 },
                      ].map((c) => (
                        <div key={c.n}>
                          <div className="mb-1 flex justify-between text-[11px]">
                            <span className="text-slate-400">{c.n}</span>
                            <span className="text-slate-500 font-mono">{c.p}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${c.p}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-3 text-xs font-semibold text-white">
                      Faol ustozlar
                    </div>
                    <div className="space-y-2">
                      {topTeachers.slice(0, 3).map((t) => (
                        <div
                          key={t.id || t._id || t.name}
                          className="flex items-center gap-2.5 rounded-lg p-1.5"
                        >
                          <Avatar
                            initials={(t?.name || "?").slice(0, 2).toUpperCase()}
                            color="from-primary-500 to-accent-500"
                            size="xs"
                            imageUrl={t.imageUrl}
                            online
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[11px] font-medium text-slate-200">
                              {t.name}
                            </div>
                            <div className="truncate text-[10px] text-slate-500">
                              {t.subject?.name || t.subjectId?.name || "Ustoz"}
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-400 font-semibold">
                            ★ {Number(t.avgRating || 0).toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Faol talabalar", value: "12 400+", icon: IUsers, color: "from-blue-500/20 to-blue-500/0" },
              { label: "Sertifikatlangan ustozlar", value: "240+", icon: IStar, color: "from-amber-500/20 to-amber-500/0" },
              { label: "Onlayn kurslar", value: "180 ta", icon: IClock, color: "from-violet-500/20 to-violet-500/0" },
              { label: "O'rtacha reyting", value: "4.9 / 5", icon: IStar, color: "from-pink-500/20 to-pink-500/0" },
            ].map((s, i) => {
              const Ic = s.icon;
              return (
                <Card key={i} className="p-5 transition hover:bg-white/[0.04]">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.color}`}>
                    <Ic className="h-4 w-4 text-white" />
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {newsItems.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="primary" dot className="mb-2">Yangiliklar</Badge>
              <h2 className="text-2xl font-bold text-white">Chegirmalar, imtihonlar va sovrinli tadbirlar</h2>
            </div>
            <span className="text-xs text-slate-500">{newsItems.length} ta faol xabar</span>
          </div>
          <div className="flex flex-col gap-4">
            {newsItems.map((item) => (
              <NewsItemCard
                key={item.id}
                item={item}
                isAuthenticated={!!user}
                userRole={user?.role || null}
                onLogin={() => onNavigate("login")}
                onJoined={replaceNews}
              />
            ))}
          </div>
        </section>
      )}

      {/* ============ Logos marquee ============ */}
      <section className="relative border-y border-white/[0.06] bg-ink-950/40 py-8">
        <div className="mb-4 text-center text-[11px] uppercase tracking-[0.2em] text-slate-600">
          Hamkorlarimiz va oliygohlar
        </div>
        <div className="overflow-hidden mask-fade">
          <div className="flex w-max animate-marquee gap-12 px-6">
            {[...Array(2)].flatMap((_, i) =>
              ["IELTS Cambridge", "Inha University", "TUIT", "Westminster", "Webster", "MDIS"].map((b, j) => (
                <div
                  key={`${i}-${j}`}
                  className="flex items-center gap-2 text-base font-semibold text-slate-600 hover:text-slate-400"
                >
                  <span className="h-2 w-2 rounded-full bg-slate-700" />
                  {b}
                </div>
              )),
            )}
          </div>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Badge variant="default" className="mb-4">
            ✨ Imkoniyatlar
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Hammasi <span className="text-gradient">bitta panelda</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Talabalar, ustozlar, ma'muriyat va ota-onalar uchun yagona ekosistema.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Onlayn va oflayn kurslar", d: "Istalgan formatdagi darslar. Filtrlash, yozilish va tugatish — bir necha bosishda.", e: "🎓", c: "from-blue-500/20 to-indigo-500/5" },
            { t: "Quiz Battle va testlar", d: "Trivia, mehmon testi va jamoaviy musobaqa formatlari. Jonli reyting.", e: "🏆", c: "from-amber-500/20 to-orange-500/5" },
            { t: "PDF kutubxona", d: "100+ kitob va o'quv qo'llanma — qidirish, yuklab olish, belgilash.", e: "📚", c: "from-emerald-500/20 to-teal-500/5" },
            { t: "Davomat va statistika", d: "Ustoz uchun davomat, talaba va ota-ona uchun aniq statistik hisobotlar.", e: "📊", c: "from-violet-500/20 to-purple-500/5" },
            { t: "Xabarlar va guruhlar", d: "Ichki chat, fayl almashish, e'lonlar va guruh muhokamalari.", e: "💬", c: "from-fuchsia-500/20 to-pink-500/5" },
            { t: "To'lovlar va kassa", d: "Onlayn to'lov, kassir paneli, kvitansiyalar va shaffof tarix.", e: "💳", c: "from-rose-500/20 to-red-500/5" },
          ].map((f) => (
            <Card key={f.t} hover className="group p-6">
              <div
                className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.c} text-2xl ring-1 ring-white/[0.06]`}
              >
                {f.e}
              </div>
              <h3 className="text-lg font-bold text-white">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.d}</p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary-400 opacity-0 transition group-hover:opacity-100">
                Batafsil <IArrow className="h-3.5 w-3.5" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ For roles ============ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">Har kim uchun</Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            6 ta rol — 1 ta platforma
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { r: "Talaba", e: "👨‍🎓", d: "Kurslar, testlar, reyting, sertifikatlar.", c: "from-sky-500/20 to-blue-600/10", t: "text-sky-300" },
            { r: "Ustoz", e: "👨‍🏫", d: "Darslar, davomat, balans, talaba boshqaruvi.", c: "from-violet-500/20 to-purple-600/10", t: "text-violet-300" },
            { r: "Admin", e: "⚙️", d: "Foydalanuvchilar, fanlar, joylar, sozlamalar.", c: "from-amber-500/20 to-orange-600/10", t: "text-amber-300" },
            { r: "Ota-ona", e: "👨‍👩‍👧", d: "Farzand statistikasi, davomat va to'lovlar.", c: "from-emerald-500/20 to-teal-600/10", t: "text-emerald-300" },
            { r: "Kassir", e: "💼", d: "To'lovlar, kvitansiyalar, kunlik hisobot.", c: "from-rose-500/20 to-red-600/10", t: "text-rose-300" },
            { r: "Qabulxona", e: "🏛️", d: "Qabul jadvali, navbat, hujjatlar.", c: "from-fuchsia-500/20 to-pink-600/10", t: "text-fuchsia-300" },
          ].map((p) => (
            <Card key={p.r} className={`relative overflow-hidden p-6`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${p.c} opacity-50`} />
              <div className="relative">
                <div className="mb-3 text-3xl">{p.e}</div>
                <div className={`text-sm font-semibold ${p.t}`}>{p.r}</div>
                <p className="mt-1 text-sm text-slate-400">{p.d}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ Popular courses ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <Badge variant="primary" className="mb-3" dot>Mashhur kurslar</Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Talabalar tanlovi
            </h2>
          </div>
          <Button variant="ghost" onClick={() => onNavigate("courses")}>
            Hammasi <IArrow className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topCourses.map((c) => (
            <Card key={c.id || c._id || c.title} hover className="overflow-hidden">
              <div
                className="relative h-36 bg-gradient-to-br from-primary-500/20 to-accent-500/10 flex items-center justify-center"
              >
                <span className="text-6xl drop-shadow-2xl animate-float">📘</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <Badge
                  variant="default"
                  className="absolute right-3 top-3 bg-black/40 text-white backdrop-blur"
                  dot
                >
                  {c.type}
                </Badge>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400">{c.subject?.name || c.subjectId?.name}</span>
                  <span>•</span>
                  <span>{c.level}</span>
                </div>
                <h3 className="text-base font-bold text-white">{c.title}</h3>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-xs">
                  <span className="flex items-center gap-1 text-amber-400">
                    <IStar className="h-3.5 w-3.5" /> —
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <IUsers className="h-3.5 w-3.5" /> —
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <IClock className="h-3.5 w-3.5" /> —
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ Teachers ============ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <Badge variant="default" className="mb-3">👨‍🏫 Ustozlar</Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Eng yaxshi ustozlar
            </h2>
          </div>
          <Button variant="ghost" onClick={() => onNavigate("teachers")}>
            Barchasi <IArrow className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {topTeachers.map((t) => (
            <Card key={t.id || t._id || t.name} hover className="p-5 text-center">
              <div className="relative inline-block">
                <Avatar
                  initials={(t?.name || "?").slice(0, 2).toUpperCase()}
                  color="from-primary-500 to-accent-500"
                  size="lg"
                  imageUrl={t.imageUrl}
                  online
                  ring
                />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-950 ring-2 ring-ink-950">
                  ★
                </span>
              </div>
              <div className="mt-3 truncate text-sm font-bold text-white">
                {t.name}
              </div>
              <div className="text-xs text-slate-500">{t.subject?.name || t.subjectId?.name || "Ustoz"}</div>
              <div className="mt-2.5 flex items-center justify-center gap-3 text-[11px] text-slate-500">
                <span>★ {Number(t.avgRating || 0).toFixed(1)}</span>
                <span>·</span>
                <span>{t.teacherDetails?.experience || "—"}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ Testimonials ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="default" className="mb-4">💬 Sharhlar</Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Talabalar nima deydi?
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "Akmal Botirov", r: "Talaba · IELTS 7.5", t: "6 oyda 5.5 dan 7.5 ga ko'tarildim. Mock testlar va shaxsiy mentorlik darslari juda ko'p yordam berdi.", i: "AB", c: "from-blue-500 to-indigo-600", av: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80" },
            { n: "Madina Ali", r: "Talaba · Frontend", t: "Onlayn formatda ham real darsdek hissiyot beradi. Endi o'zim sayt qila olaman va ishga topshira olaman!", i: "MA", c: "from-rose-500 to-red-600", av: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" },
            { n: "Botir Karimov", r: "Ota-ona", t: "Farzandimning davomati va ballarini real vaqtda ko'rish — bu men uchun juda qulay.", i: "BK", c: "from-emerald-500 to-teal-600", av: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80" },
          ].map((t) => (
            <Card key={t.n} className="p-6">
              <div className="mb-3 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <IStar key={i} className="h-4 w-4 text-amber-400" />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-slate-300">"{t.t}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-white/[0.05] pt-4">
                <Avatar initials={t.i} color={t.c} imageUrl={t.av} />
                <div>
                  <div className="text-sm font-bold text-white">{t.n}</div>
                  <div className="text-xs text-slate-500">{t.r}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Card glow className="relative overflow-hidden p-8 sm:p-12 lg:p-16">
          <div className="hero-glow absolute inset-0 opacity-70" />
          <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="primary" className="mb-4" dot>
                Hozir boshlang
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Bilim — eng yaxshi{" "}
                <span className="text-gradient">sarmoya</span>
              </h2>
              <p className="mt-4 text-slate-400">
                Kredit karta talab qilinmaydi. 1 daqiqada ro'yxatdan o'ting va
                birinchi 14 darsni mutlaqo bepul foydalaning.
              </p>
              <div className="mt-7 flex flex-col gap-3.5 sm:flex-row">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => onNavigate("register")}
                  className="font-bold"
                >
                  Bepul ro'yxatdan o'tish <IArrow className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onNavigate("login")}
                >
                  Kirish
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                "Onlayn / oflayn kurslar",
                "PDF kutubxona",
                "Quiz Battle 2.0",
                "Davomat va hisobot",
                "Ota-ona paneli",
                "Sertifikatlar",
                "24/7 yordam",
                "Mobil ilova",
              ].map((x) => (
                <div
                  key={x}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-slate-300 backdrop-blur"
                >
                  <ICheck className="h-4.5 w-4.5 shrink-0 text-emerald-400" /> {x}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* ==================== NewsItemCard ==================== */
function NewsItemCard({
  item,
  isAuthenticated,
  userRole,
  onLogin,
  onJoined,
}: {
  item: NewsItem;
  isAuthenticated: boolean;
  userRole?: string | null;
  onLogin: () => void;
  onJoined: (next: NewsItem) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<"join" | "leave" | null>(null);

  const isNewsOnly = (item.type || "news") === "news";
  const requiresParticipation = !isNewsOnly || !!item.requiresParticipation;
  const participantsCount = item.participantsCount || 0;
  const limit = item.maxParticipants || 0;
  const limitReached = !!item.limitReached;
  const expired = !!item.expired;
  const joined = !!item.isJoined;
  const recent = Array.isArray(item.recentParticipants) ? item.recentParticipants : [];
  const isStudent = userRole === "student";

  const fillPct = limit > 0 ? Math.min(100, Math.round((participantsCount / limit) * 100)) : null;

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.warning("Qatnashish uchun avval tizimga kiring", { title: "🔐 Login talab" });
      onLogin();
      return;
    }
    if (!isStudent) {
      toast.warning(
        "Chegirmalar, imtihonlar va sovrinli tadbirlarda faqat talabalar (student) qatnasha oladi.",
        { title: "👨‍🎓 Faqat talabalar uchun", duration: 5000 },
      );
      return;
    }
    setBusy("join");
    try {
      const next = await newsApi.join(item.id);
      onJoined(next);
      toast.success("Tabriklaymiz! Siz qatnashuvchilar ro'yxatiga qo'shildingiz", {
        title: "✓ Qatnashayapsiz",
      });
    } catch (e: any) {
      toast.error(e?.message || "Qatnashishda xatolik");
    } finally {
      setBusy(null);
    }
  };

  const handleLeave = async () => {
    setBusy("leave");
    try {
      const next = await newsApi.leave(item.id);
      onJoined(next);
      toast.info("Qatnashish bekor qilindi");
    } catch (e: any) {
      toast.error(e?.message || "Qaytarishda xatolik");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card hover className="relative overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${
            item.color || "from-primary-500 to-accent-500"
          } text-3xl shadow-[0_8px_24px_-8px_rgba(53,99,255,0.45)]`}
        >
          {item.icon || (item.type === "discount" ? "🏷️" : item.type === "exam" ? "📝" : item.type === "contest" ? "🏆" : "📰")}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{item.type || "news"}</Badge>
            {requiresParticipation && (
              <Badge variant={joined ? "success" : "primary"} dot>
                {joined ? "Qatnashayapsiz" : "Qatnashish ochiq"}
              </Badge>
            )}
            {item.prize && (
              <Badge variant="warning" dot>
                Sovrin: {item.prize}
              </Badge>
            )}
            {expired && <Badge variant="danger">Tugagan</Badge>}
          </div>

          <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>

          {requiresParticipation && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CountdownBox endsAt={item.endsAt || null} />

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <IUsers className="h-3.5 w-3.5" /> Qatnashuvchilar
                  </span>
                  <span className="font-mono text-slate-300">
                    {participantsCount}
                    {limit > 0 ? ` / ${limit}` : ""}
                  </span>
                </div>
                {fillPct !== null && (
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 via-accent-500 to-pink-500 transition-all"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                )}
                {recent.length > 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {recent.slice(0, 5).map((p) => (
                        <Avatar
                          key={p.id}
                          size="sm"
                          initials={(p.user?.name || "?").slice(0, 2).toUpperCase()}
                          imageUrl={p.user?.avatar || undefined}
                          ring
                        />
                      ))}
                    </div>
                    {participantsCount > 5 && (
                      <span className="text-xs text-slate-500">+{participantsCount - 5}</span>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">Hali qatnashuvchi yo‘q — birinchi bo‘ling!</p>
                )}
              </div>
            </div>
          )}

          {!isStudent && isAuthenticated && requiresParticipation && (
            <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200">
              ⚠️ Bu tadbirda faqat <span className="font-bold">talabalar</span> qatnasha oladi.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {requiresParticipation ? (
              joined ? (
                <Button
                  variant="soft"
                  size="md"
                  onClick={handleLeave}
                  disabled={busy === "leave" || expired}
                >
                  {busy === "leave" ? "Bekor qilinmoqda…" : "Qatnashishni bekor qilish"}
                </Button>
              ) : (
                <Button
                  variant={isAuthenticated && !isStudent ? "soft" : "gradient"}
                  size="md"
                  onClick={handleJoin}
                  disabled={busy === "join" || expired || limitReached}
                  className="font-bold"
                  title={
                    isAuthenticated && !isStudent
                      ? "Faqat talabalar (student) qatnasha oladi"
                      : undefined
                  }
                >
                  {busy === "join"
                    ? "Yuborilmoqda…"
                    : expired
                      ? "Muddat tugagan"
                      : limitReached
                        ? "Joylar tugagan"
                        : !isAuthenticated
                          ? "Qatnashish uchun kirish"
                          : !isStudent
                            ? "🔒 Faqat talabalar uchun"
                            : "🎯 Qatnashish"}
                  {!busy && !expired && !limitReached && isStudent && <IArrow className="h-4 w-4" />}
                </Button>
              )
            ) : null}

            {item.ctaUrl && (
              <a
                href={item.ctaUrl}
                target={item.ctaUrl.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-300 hover:text-primary-200"
              >
                {item.ctaLabel || "Batafsil"} <IArrow className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ==================== Countdown ==================== */
function CountdownBox({ endsAt }: { endsAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (!endsAt) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-center">
        <div className="text-xs uppercase tracking-wide text-slate-500 flex items-center justify-center gap-1.5">
          <IClock className="h-3.5 w-3.5" /> Muddat
        </div>
        <div className="mt-2 text-sm font-medium text-slate-300">Cheklanmagan</div>
      </div>
    );
  }

  const target = new Date(endsAt).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const finished = diff === 0;

  const Cell = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className={`min-w-[40px] rounded-lg px-2 py-1.5 font-mono text-base font-bold tabular-nums ${
          finished
            ? "bg-rose-500/10 text-rose-300"
            : "bg-gradient-to-br from-primary-500/15 to-accent-500/10 text-white"
        }`}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
        <span className="flex items-center gap-1.5">
          <IClock className="h-3.5 w-3.5" />
          {finished ? "Muddat tugadi" : "Tugashiga"}
        </span>
        <span className="text-[10px] text-slate-600">
          {new Date(endsAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-1.5 sm:gap-2">
        <Cell value={days} label="kun" />
        <span className="font-bold text-slate-600">:</span>
        <Cell value={hours} label="soat" />
        <span className="font-bold text-slate-600">:</span>
        <Cell value={minutes} label="daq" />
        <span className="font-bold text-slate-600">:</span>
        <Cell value={seconds} label="son" />
      </div>
    </div>
  );
}
