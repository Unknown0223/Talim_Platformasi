import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, NameWithEmoji, Tabs } from "../components/ui";
import {
  IFilter,
  ISearch,
  IStar,
  IUsers,
  IClock,
  IArrow,
  IPlay,
  IPlus,
} from "../components/icons";
import type { Page } from "../components/Layout";
import { dashboard as dashboardApi, enroll as enrollApi, payments, request } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatPrice(price: number) {
  if (!price || price <= 0) return "BEPUL";
  return `${Number(price).toLocaleString("uz-UZ")} so'm`;
}

function normalizeCourse(c: any) {
  const subjectObj = c?.subject && typeof c.subject === "object" ? c.subject : c?.subjectId;
  const teacherObj = c?.teacher && typeof c.teacher === "object" ? c.teacher : c?.teacherId;
  const subjectId =
    typeof c?.subjectId === "string"
      ? c.subjectId
      : String(subjectObj?.id || subjectObj?._id || "");
  const lessonsCount = Number(c?.lessonCount ?? c?._count?.lessons ?? c?.lessons?.length ?? 0);
  const studentsCount = Number(c?.studentCount ?? c?._count?.enrollments ?? c?.studentsCount ?? 0);
  const rating = Number(c?.rating ?? c?.avgRating ?? c?.teacher?.avgRating ?? 0);

  return {
    ...c,
    subjectIdNormalized: subjectId,
    subjectName: String(subjectObj?.name || ""),
    teacherName: String(teacherObj?.name || ""),
    lessonsCount,
    studentsCount,
    rating,
  };
}

function normalizeVariantText(value: any) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function courseVariantGroupKey(c: any) {
  return [
    normalizeVariantText(c.title),
    String(c.subjectIdNormalized || ""),
    String(c.level || ""),
    String(c.type || ""),
    normalizeVariantText(c.description),
    Number(c.price || 0),
  ].join("|");
}

function groupCourseVariants(courses: any[]) {
  const map = new Map<string, any[]>();
  for (const course of courses) {
    const key = String(course.variantGroupKey || courseVariantGroupKey(course));
    map.set(key, [...(map.get(key) || []), course]);
  }
  return Array.from(map.values()).map((items) => {
    const sorted = [...items].sort((a, b) => String(a.teacherName || "").localeCompare(String(b.teacherName || "")));
    const first = sorted[0];
    const prices = sorted.map((x) => Number(x.price || 0));
    return {
      ...first,
      groupedVariants: sorted,
      variantCount: sorted.length,
      teachers: sorted.map((x) => ({
        courseId: x.id || x._id,
        id: x.teacher?.id || x.teacherId?.id,
        name: x.teacherName || x.teacher?.name || x.teacherId?.name || "Ustoz",
        email: x.teacher?.email || x.teacherId?.email,
        avatar: x.teacher?.avatar || x.teacherId?.avatar,
        nameEmoji: x.teacher?.nameEmoji || x.teacherId?.nameEmoji,
        nameEmojiAnim: x.teacher?.nameEmojiAnim || x.teacherId?.nameEmojiAnim,
        rating: x.rating,
        reviewsCount: x.reviewsCount,
        price: Number(x.price || 0),
        studentCount: x.studentsCount,
        lessonCount: x.lessonsCount,
      })),
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      rating: sorted.reduce((sum, x) => sum + Number(x.rating || 0), 0) / Math.max(1, sorted.length),
      studentsCount: sorted.reduce((sum, x) => sum + Number(x.studentsCount || 0), 0),
      lessonsCount: Math.max(...sorted.map((x) => Number(x.lessonsCount || 0))),
    };
  });
}

/* ==================== Courses (role-aware orchestrator) ==================== */
export function Courses({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { user } = useAuth();
  const role = String(user?.role || "");
  const isStudent = !!user && role === "student";
  const isTeacher = !!user && role === "teacher";
  const hasRoleView = isStudent || isTeacher;

  const [view, setView] = useState<"mine" | "catalog">(hasRoleView ? "mine" : "catalog");

  useEffect(() => {
    setView(hasRoleView ? "mine" : "catalog");
  }, [hasRoleView]);

  if (hasRoleView && view === "mine") {
    return (
      <MyCoursesView
        role={isStudent ? "student" : "teacher"}
        onAddCourses={() => setView("catalog")}
      />
    );
  }

  return (
    <CoursesCatalog
      onNavigate={onNavigate}
      showBackToMine={isStudent && view === "catalog"}
      onBackToMine={() => setView("mine")}
    />
  );
}

/* ==================== My Courses (student/teacher) ==================== */
function MyCoursesView({
  role,
  onAddCourses,
}: {
  role: "student" | "teacher";
  onAddCourses: () => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const loader =
      role === "student"
        ? enrollApi
            .my()
            .then((rows) =>
              (Array.isArray(rows) ? rows : [])
                .filter((e: any) => ["active", "completed"].includes(String(e?.status || "active")))
                .map((e: any) => e?.course)
                .filter(Boolean),
            )
        : dashboardApi
            .teacher()
            .then((d: any) => (Array.isArray(d?.courses) ? d.courses : []));

    loader
      .then((rows) => {
        setItems(rows);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Ma'lumotlarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, [role]);

  const courses = useMemo(() => items.map(normalizeCourse), [items]);
  const isStudent = role === "student";

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant={isStudent ? "talaba" : "ustoz"} className="mb-3" dot>
            {isStudent ? "Mening kurslarim" : "Mening fanlarim"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {isStudent ? "Sotib olgan kurslarim" : "Men o'qitayotgan kurslar"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {loading ? (
              "Yuklanmoqda..."
            ) : isStudent ? (
              <>
                Sizda jami{" "}
                <span className="font-semibold text-white">{courses.length}</span> ta faol kurs bor.
                Yangi kurs qo'shish uchun pastdagi tugmani bosing.
              </>
            ) : (
              <>
                Siz{" "}
                <span className="font-semibold text-white">{courses.length}</span> ta kursni
                o'qitayapsiz. Yangi fan/kurs admin tomonidan biriktiriladi.
              </>
            )}
          </p>
        </div>
        {isStudent ? (
          <Button variant="gradient" size="md" onClick={onAddCourses}>
            <IPlus className="h-4 w-4" /> Kurslar qo'shish
          </Button>
        ) : (
          <Badge variant="outline" className="self-start sm:self-auto">
            🔒 Admin biriktirgan
          </Badge>
        )}
      </div>

      {error ? (
        <EmptyState
          icon="⚠️"
          title="Backendga ulanib bo'lmadi"
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Qayta urinish
            </Button>
          }
        />
      ) : loading ? (
        <Card className="p-6 text-slate-300">Yuklanmoqda...</Card>
      ) : courses.length === 0 ? (
        isStudent ? (
          <EmptyState
            icon="🎓"
            title="Hozircha sotib olingan kursingiz yo'q"
            description="Katalogdan o'zingizga mos kursni tanlab, to'lov qiling. Kassir tasdiqlagandan so'ng kurs bu yerda paydo bo'ladi."
            action={
              <Button variant="gradient" onClick={onAddCourses}>
                <IPlus className="h-4 w-4" /> Kurslar qo'shish
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="📚"
            title="Sizga hali kurs biriktirilmagan"
            description="Yangi fan yoki kurs faqat administrator tomonidan biriktiriladi. Iltimos, admin bilan bog'laning."
          />
        )
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id || c._id || c.title}
              course={c}
              onNavigate={() => (window.location.href = `/courses/${c.id || c._id}`)}
              formatPrice={formatPrice}
              ownedBadge={isStudent}
            />
          ))}
        </div>
      )}

      {isStudent && courses.length > 0 ? (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" size="lg" onClick={onAddCourses}>
            <IPlus className="h-4 w-4" /> Yangi kurs qo'shish
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* ==================== Courses Catalog (full list view) ==================== */
function CoursesCatalog({
  onNavigate: _onNavigate,
  showBackToMine = false,
  onBackToMine,
}: {
  onNavigate: (p: Page) => void;
  showBackToMine?: boolean;
  onBackToMine?: () => void;
}) {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<{ id: string; name: string } | null>(null);
  const [mode, setMode] = useState<"Barchasi" | "online" | "offline">("Barchasi");
  const [level, setLevel] = useState<string>("");
  const [sort, setSort] = useState<"popular" | "rating" | "new">("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [subjects, setSubjects] = useState<Array<{ id?: string; _id?: string; name: string }>>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      request<Array<{ id?: string; _id?: string; name: string }>>("/api/subjects"),
      request<any[]>("/api/courses"),
    ])
      .then(([subs, crs]) => {
        setSubjects(subs || []);
        setCourses(crs || []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Ma'lumotlarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  // Read URL query params (for recommendations / deep links)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const qParam = sp.get("q");
    const typeParam = sp.get("type");
    const levelParam = sp.get("level");
    const subjectIdParam = sp.get("subjectId");

    if (qParam != null) setQ(qParam);
    if (levelParam != null) setLevel(levelParam);
    if (typeParam === "online" || typeParam === "offline") setMode(typeParam);
    if (subjectIdParam) {
      const s = subjects.find((x) => String(x.id || x._id || "") === String(subjectIdParam));
      if (s) setSubject({ id: String(s.id || s._id || ""), name: s.name });
      // if query subjectId not found, don't lock filter to a non-existing id
      else setSubject(null);
    }
    // only once after subjects load (so we can resolve name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects.length]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let arr = courses.map(normalizeCourse).filter((c) => {
      const title = String(c?.title || "").toLowerCase();
      const teacher = c.teacherName.toLowerCase();
      const subjectName = c.subjectName.toLowerCase();
      const subjectOk = !subject?.id || c.subjectIdNormalized === subject.id;
      const modeOk = mode === "Barchasi" ? true : c?.type === mode;
      const levelOk = !level || String(c?.level || "") === String(level);
      const qOk = !qq || title.includes(qq) || teacher.includes(qq) || subjectName.includes(qq);
      return subjectOk && modeOk && levelOk && qOk;
    });

    arr = groupCourseVariants(arr);

    if (sort === "new") {
      arr = [...arr].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
    } else if (sort === "rating") {
      arr = [...arr].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      arr = [...arr].sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
    }
    return arr;
  }, [courses, q, subject, mode, level, sort]);

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      {showBackToMine && onBackToMine ? (
        <button
          type="button"
          onClick={onBackToMine}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition cursor-pointer"
        >
          ← Mening kurslarim
        </button>
      ) : null}
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="primary" className="mb-3" dot>
            Intellektual Katalog
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Barcha Kurslar va Fanlar
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {loading ? (
              "Yuklanmoqda..."
            ) : (
              <>Sizga moslashtirilgan <span className="font-semibold text-white">{filtered.length}</span> ta kurs varianti</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "▦" },
              { value: "list", label: "≡" },
            ]}
            size="sm"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-10 cursor-pointer rounded-xl border border-white/10 bg-ink-950 px-3 text-[13px] text-slate-200 hover:bg-white/[0.05] focus:border-primary-500/60 focus:outline-none"
          >
            <option value="popular">Ommaboplik bo'yicha</option>
            <option value="rating">Reyting bo'yicha</option>
            <option value="new">Yangilari</option>
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="h-10 cursor-pointer rounded-xl border border-white/10 bg-ink-950 px-3 text-[13px] text-slate-200 hover:bg-white/[0.05] focus:border-primary-500/60 focus:outline-none"
          >
            <option value="">Daraja: Barchasi</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <Button variant="outline" size="sm" className="h-10" disabled>
            <IFilter className="h-4 w-4" /> Saralash
          </Button>
        </div>
      </div>

      {/* Filters with Glow effect */}
      <Card className="mb-8 p-5 relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 via-accent-500 to-mint-500 opacity-65" />
        <div className="flex flex-col gap-5">
          <div className="relative">
            <Input
              placeholder="Kurs nomi, fan yoki o'qituvchi ismini kiriting..."
              icon={<ISearch className="h-5 w-5" />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="py-3.5 pr-10 text-base"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Fanlar bo'yicha saralash
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar py-1">
                <Chip
                  key="all-subjects"
                  active={!subject?.id}
                  onClick={() => setSubject(null)}
                >
                  Barchasi
                </Chip>
                {subjects.map((s) => (
                  <Chip
                    key={s.id || s._id || s.name}
                    active={(subject?.id || "") === String(s.id || s._id || "")}
                    onClick={() => {
                      const id = String(s.id || s._id || "");
                      setSubject(id ? { id, name: s.name } : null);
                    }}
                  >
                    {s.name}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.05] pt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Dars Formati
                </span>
                {(["Barchasi", "online", "offline"] as const).map((m) => (
                  <Chip
                    key={m}
                    active={mode === m}
                    onClick={() => setMode(m)}
                    tone="primary"
                  >
                    {m === "online" ? "🌐 Onlayn" : m === "offline" ? "🏛️ Oflayn" : "Barchasi"}
                  </Chip>
                ))}
              </div>

              {q || subject?.id || mode !== "Barchasi" || level ? (
                <button
                  onClick={() => {
                    setQ("");
                    setSubject(null);
                    setMode("Barchasi");
                    setLevel("");
                  }}
                  className="ml-auto text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  Filtrlarni tozalash ✕
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Courses Display */}
      {error ? (
        <EmptyState
          icon="⚠️"
          title="Backendga ulanib bo'lmadi"
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Qayta urinish
            </Button>
          }
        />
      ) : loading ? (
        <Card className="p-6 text-slate-300">Yuklanmoqda...</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="Siz qidirgan kurs topilmadi"
          description="Iltimos, boshqa qidiruv so'zidan yoki filtrlardan foydalaning."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setSubject(null);
                setMode("Barchasi");
                setLevel("");
                setSort("popular");
              }}
            >
              Katalogga qaytish
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard
              key={c.id || c._id || c.title}
              course={c}
              onNavigate={() => (window.location.href = `/courses/${c.id || c._id}`)}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((c) => (
              <div
                key={c.id || c._id || c.title}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 transition hover:bg-white/[0.02]"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${courseGradient(c)} bg-cover bg-center text-3xl shadow-lg`}
                  style={c.imageUrl ? { backgroundImage: `linear-gradient(rgba(2,6,23,.25), rgba(2,6,23,.45)), url(${c.imageUrl})` } : undefined}
                >
                  {!c.imageUrl && courseIcon(c)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-semibold text-primary-300">{c.subjectName || c.subject?.name || c.subjectId?.name}</span>
                    <span className="text-slate-600">•</span>
                    <Badge variant={c.type === "online" ? "primary" : "default"}>
                      {c.type}
                    </Badge>
                    <Badge variant="outline">{c.level || "-"}</Badge>
                    {Number(c.variantCount || 0) > 1 ? (
                      <Badge variant="success">{c.variantCount} ta ustoz</Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 text-lg font-bold text-white truncate">
                    {c.title}
                  </div>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-1">{c.description || ""}</p>
                  {Number(c.variantCount || 0) > 1 ? (
                    <p className="mt-1 text-xs text-primary-300">
                      {(c.teachers || []).slice(0, 2).map((t: any) => t.name).join(", ")}
                      {Number(c.variantCount || 0) > 2 ? ` +${Number(c.variantCount) - 2}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/[0.05] pt-3 sm:pt-0">
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-white">
                      {formatPrice(c.price || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500">{c.lessonsCount ? `${c.lessonsCount} ta dars` : "—"}</div>
                  </div>
                  <Button
                    size="md"
                    onClick={() => (window.location.href = `/courses/${c.id || c._id}`)}
                  >
                    Batafsil <IArrow className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CourseCard({
  course: c,
  onNavigate,
  formatPrice,
  ownedBadge = false,
}: {
  course: any;
  onNavigate: () => void;
  formatPrice: (p: number) => string;
  ownedBadge?: boolean;
}) {
  return (
    <Card className="group overflow-hidden flex flex-col h-full relative" hover>
      <div
        className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${courseGradient(c)} bg-cover bg-center`}
        style={c.imageUrl ? { backgroundImage: `linear-gradient(rgba(2,6,23,.15), rgba(2,6,23,.55)), url(${c.imageUrl})` } : undefined}
      >
        <div className="absolute inset-0 bg-grid opacity-25" />
        <span className="text-8xl drop-shadow-2xl transition-transform duration-300 group-hover:scale-110">
          {courseIcon(c)}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {ownedBadge ? (
          <Badge
            className="absolute left-3.5 top-3.5 bg-emerald-500/80 text-white backdrop-blur border-emerald-300/30"
            dot
          >
            Sotib olingan
          </Badge>
        ) : (
          <Badge
            className="absolute left-3.5 top-3.5 bg-black/50 text-white backdrop-blur border-white/10"
            dot
          >
            {c.type}
          </Badge>
        )}
        <Badge
          className="absolute right-3.5 top-3.5 bg-black/50 text-white backdrop-blur border-white/10"
        >
          {c.level || "-"}
        </Badge>
        {Number(c.variantCount || 0) > 1 ? (
          <Badge className="absolute bottom-3.5 left-3.5 bg-emerald-500/85 text-white backdrop-blur border-emerald-300/30">
            {c.variantCount} ta ustoz
          </Badge>
        ) : null}
        <button className="absolute right-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-950 opacity-0 shadow-2xl transition duration-300 group-hover:opacity-100 group-hover:scale-105 active:scale-95 cursor-pointer">
          <IPlay className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col p-5">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <span className="text-primary-300 font-bold">{c.subjectName || c.subject?.name || c.subjectId?.name}</span>
          <span>•</span>
          <span>
            {Number(c.variantCount || 0) > 1
              ? `${c.variantCount} ta ustoz`
              : c.teacher?.name || c.teacherId?.name || "-"}
          </span>
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug text-white group-hover:text-primary-300 transition duration-150 flex-1 line-clamp-2">
          {c.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-2">
          {c.description || ""}
        </p>
        {Number(c.variantCount || 0) > 1 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(c.teachers || []).slice(0, 3).map((t: any) => (
              <span key={t.courseId || t.id || t.name} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-300">
                {t.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <IStar className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-bold text-white">{c.rating ? c.rating.toFixed(1) : "—"}</span>
          </span>
          <span className="flex items-center gap-1">
            <IUsers className="h-3.5 w-3.5" /> {c.studentsCount || "—"}
          </span>
          <span className="flex items-center gap-1">
            <IClock className="h-3.5 w-3.5" /> {c.lessonsCount || "—"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
          <div>
            <div className="text-base font-extrabold text-white">
              {formatPrice(c.price || 0)}
            </div>
            <div className="text-[10px] text-slate-500">{ownedBadge ? "ochiq · davom eting" : "oylik to'lov"}</div>
          </div>
          <Button size="sm" onClick={onNavigate}>
            {ownedBadge ? "Davom etish" : "Batafsil"} <IArrow className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function courseIcon(c: any) {
  const subject = String(c?.subjectName || c?.subject?.name || c?.subjectId?.name || "").toLowerCase();
  if (c?.icon) return c.icon;
  if (subject.includes("matemat")) return "📐";
  if (subject.includes("fizika")) return "⚛️";
  if (subject.includes("ingliz")) return "🌐";
  if (subject.includes("informat")) return "💻";
  if (subject.includes("kimyo")) return "🧪";
  if (subject.includes("tarix")) return "🏛️";
  if (subject.includes("biolog")) return "🧬";
  if (subject.includes("geograf")) return "🗺️";
  if (subject.includes("ona")) return "📖";
  return "📘";
}

function courseGradient(c: any) {
  return c?.color || "from-primary-500/40 via-indigo-600/35 to-accent-500/40";
}

export function CourseDetail({
  courseId,
  onPay,
}: {
  courseId: string;
  onPay?: (courseId: string) => void;
}) {
  const { user } = useAuth();
  const [c, setC] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "syllabus" | "reviews">("overview");
  const [teacherReviews, setTeacherReviews] = useState<any[]>([]);
  const [teacherStats, setTeacherStats] = useState<any | null>(null);
  const [paymentState, setPaymentState] = useState<any | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState(courseId);

  useEffect(() => {
    setLoading(true);
    request<any>(`/api/courses/${courseId}`)
      .then((data) => {
        setC(data);
        setSelectedVariantId(String(data?.id || data?._id || courseId));
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Kurs topilmadi"))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    const variants = Array.isArray(c?.variants) && c.variants.length ? c.variants : c ? [c] : [];
    const selectedVariant = variants.find((v: any) => String(v.id || v._id) === String(selectedVariantId)) || c;
    const teacherId = String(selectedVariant?.teacher?.id || selectedVariant?.teacherId?.id || "");
    if (!teacherId) {
      setTeacherReviews([]);
      setTeacherStats(null);
      return;
    }
    request<any>(`/api/teachers/${teacherId}`)
      .then((d) => {
        setTeacherReviews(Array.isArray(d?.reviews) ? d.reviews : []);
        setTeacherStats(d?.stats || null);
      })
      .catch(() => {
        setTeacherReviews([]);
        setTeacherStats(null);
      });
  }, [c, selectedVariantId]);

  useEffect(() => {
    if (!user?.id || !selectedVariantId) {
      setPaymentState(null);
      return;
    }
    payments
      .my()
      .then((rows) => {
        const match = (Array.isArray(rows) ? rows : []).find((p: any) => String(p.courseId) === String(selectedVariantId));
        setPaymentState(match || null);
      })
      .catch(() => setPaymentState(null));
  }, [user?.id, selectedVariantId]);

  if (loading) return <Card className="p-6 text-slate-300">Yuklanmoqda...</Card>;
  if (error || !c) {
    return (
      <EmptyState
        icon="⚠️"
        title="Kurs topilmadi"
        description={error || "Kurs topilmadi"}
        action={<Button variant="outline" onClick={() => (window.location.href = "/courses")}>Kurslarga qaytish</Button>}
      />
    );
  }

  const variants = Array.isArray(c?.variants) && c.variants.length ? c.variants : [c];
  const selectedVariant = variants.find((v: any) => String(v.id || v._id) === String(selectedVariantId)) || c;
  const lessons = Array.isArray(selectedVariant?.lessons) ? selectedVariant.lessons : Array.isArray(c?.lessons) ? c.lessons : [];

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <button
        onClick={() => (window.location.href = "/courses")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
      >
        ← Kurslar katalogi
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div
              className={`relative flex h-72 items-center justify-center bg-gradient-to-br ${courseGradient(c)} bg-cover bg-center`}
              style={c.imageUrl ? { backgroundImage: `linear-gradient(rgba(2,6,23,.15), rgba(2,6,23,.55)), url(${c.imageUrl})` } : undefined}
            >
              <div className="absolute inset-0 bg-grid opacity-25" />
              <span className="text-9xl drop-shadow-2xl animate-float">
                {courseIcon(c)}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-white text-ink-950 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-primary-500/30 cursor-pointer">
                <IPlay className="h-7 w-7" />
              </button>
            </div>
            <div className="space-y-4 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary" dot>{selectedVariant.type || c.type}</Badge>
                <Badge>{selectedVariant.level || c.level || "-"}</Badge>
                {lessons.length ? (
                  <Badge variant="success">{lessons.length} ta dars</Badge>
                ) : (
                  <Badge variant="warning">Darslar kiritilmagan</Badge>
                )}
                {variants.length > 1 ? <Badge variant="outline">{variants.length} ta ustoz varianti</Badge> : null}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {c.title}
              </h1>
              <p className="text-base leading-relaxed text-slate-400">
                {c.description || "Kurs tavsifi kiritilmagan."}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.05] pt-5 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <IStar className="h-4.5 w-4.5 text-amber-400" />
                  <strong className="text-white text-base">
                    {typeof teacherStats?.rating === "number" ? teacherStats.rating.toFixed(1) : "—"}
                  </strong>
                  <span className="text-slate-500">
                    ({typeof teacherStats?.reviewsCount === "number" ? teacherStats.reviewsCount : 0} ta sharh)
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <IUsers className="h-4.5 w-4.5" /> {lessons.length ? `${lessons.length} ta dars` : "—"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <IClock className="h-4.5 w-4.5" /> {selectedVariant.type === "online" ? "Onlayn" : selectedVariant.type === "offline" ? "Oflayn" : "—"}
                </span>
              </div>
            </div>
          </Card>

          {variants.length > 1 ? (
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">O‘qituvchi variantini tanlang</h2>
                <p className="mt-1 text-xs text-slate-500">To‘lov va kurs ochilishi tanlangan ustoz variantiga bog‘lanadi.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {variants.map((v: any) => {
                  const id = String(v.id || v._id || "");
                  const teacherName = v.teacher?.name || v.teacherId?.name || "Ustoz";
                  const active = id === String(selectedVariantId);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedVariantId(id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-primary-400/60 bg-primary-500/15 shadow-lg shadow-primary-500/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-white">{teacherName}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            ★ {Number(v.rating || 0) ? Number(v.rating).toFixed(1) : "—"} · {Number(v.studentCount || 0)} talaba
                          </div>
                        </div>
                        {active ? <Badge variant="success">Tanlangan</Badge> : null}
                      </div>
                      <div className="mt-3 text-lg font-extrabold text-white">{formatPrice(Number(v.price || 0))}</div>
                    </button>
                  );
                })}
              </div>
            </Card>
          ) : null}

          {/* Detailed Tabs */}
          <Card className="p-6">
            <Tabs
              value={tab}
              onChange={setTab}
              options={[
                { value: "overview", label: "Kurs haqida" },
                { value: "syllabus", label: "Darslar", count: lessons.length || undefined },
                { value: "reviews", label: "Ustoz sharhlari", count: teacherReviews.length || undefined },
              ]}
            />
            <div className="mt-6">
              {tab === "overview" && (
                <div className="space-y-6 text-sm text-slate-300">
                  <div>
                    <h3 className="mb-3 text-base font-bold text-white">Kurs yakunida nimalarga ega bo'lasiz?</h3>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {[
                        "Eng samarali test strategiyalari",
                        "Amaliy mashqlar va materiallar",
                        "Reading: intensiv o'qish va tahlil",
                        "Listening: turli aksentlarni farqlash",
                        "Writing: tez va bexato insholar yozish",
                        "Speaking: ravon va qo'rquvsiz gapirish",
                        "Sifatli o'quv qurollari va materiallar",
                        "Shaxsiy mentor bilan individual tahlil",
                      ].map((x) => (
                        <div
                          key={x}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 transition hover:bg-white/[0.03]"
                        >
                          <span className="text-emerald-400 text-base">✓</span>
                          <span className="text-[13px]">{x}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {tab === "syllabus" && (
                lessons.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-400">
                    Hozircha bu kursga darslar qo‘shilmagan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((l: any, i: number) => (
                      <div
                        key={l.id || i}
                        className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 transition hover:bg-white/[0.03]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-sm font-bold text-primary-300">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{l.title || `Dars ${i + 1}`}</div>
                          <div className="text-xs text-slate-500">
                            {l.type || "video"}
                            {(l.videoUrl || l.liveLink) ? " · havola mavjud" : ""}
                          </div>
                        </div>
                        <span className="text-emerald-400 text-base">✓</span>
                      </div>
                    ))}
                  </div>
                )
              )}
              {tab === "reviews" && (
                teacherReviews.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-400">
                    Hozircha sharhlar yo‘q.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teacherReviews.slice(0, 20).map((r: any, i: number) => (
                      <div
                        key={r.id || i}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <div className="mb-2.5 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-white truncate">
                            {r?.student?.name || "Talaba"}
                          </span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.max(0, Math.min(5, Number(r?.rating || 0))) }).map((_, k) => (
                              <IStar key={k} className="h-3.5 w-3.5 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        {r?.comment ? (
                          <p className="text-sm leading-relaxed text-slate-400">{r.comment}</p>
                        ) : (
                          <p className="text-sm leading-relaxed text-slate-500">Izoh qoldirilmagan.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card glow className="sticky top-20 p-6 relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-pink-500 opacity-60" />
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {formatPrice(selectedVariant.price || 0)}
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              {selectedVariant.type === "online" ? "Onlayn kurs" : selectedVariant.type === "offline" ? "Oflayn kurs" : "Kurs turi"}
            </div>
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tanlangan ustoz</div>
              <div className="mt-1 text-sm font-bold text-white">
                <NameWithEmoji
                  name={selectedVariant.teacher?.name || selectedVariant.teacherId?.name || "Ustoz"}
                  emoji={selectedVariant.teacher?.nameEmoji || selectedVariant.teacherId?.nameEmoji}
                  anim={selectedVariant.teacher?.nameEmojiAnim || selectedVariant.teacherId?.nameEmojiAnim}
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              1 oy uchun darslar va doimiy yordamchi mentor darslari
            </p>
            {paymentState ? (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-sm">
                <div className="text-slate-400">To‘lov holati</div>
                <div className={paymentState.status === "confirmed" ? "font-bold text-emerald-300" : "font-bold text-amber-300"}>
                  {paymentState.status === "confirmed" ? "Tasdiqlangan, kurs ochilgan" : "Kassir tasdiqlashi kutilmoqda"}
                </div>
              </div>
            ) : null}
            <Button
              variant="gradient"
              size="lg"
              className="mt-6 w-full font-bold"
              onClick={() => onPay?.(String(selectedVariant?.id || selectedVariant?._id || courseId))}
            >
              Kurs uchun to'lov qilish
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="mt-2.5 w-full"
              onClick={() => {
                const teacherId = String(selectedVariant?.teacher?.id || selectedVariant?.teacherId?.id || "");
                const draft = `Assalomu alaykum! Men "${c?.title || "kurs"}" bo‘yicha bepul sinov darsi haqida ma’lumot olmoqchiman.`;
                const qs = new URLSearchParams();
                if (teacherId) qs.set("to", teacherId);
                qs.set("text", draft);
                window.location.href = "/messages" + (qs.toString() ? `?${qs.toString()}` : "");
              }}
            >
              <IPlay className="h-4 w-4" /> Bepul Sinov Darsi
            </Button>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                lessons.length ? `${lessons.length} ta dars (kursdagi materiallar)` : "Darslar (kiritilgandan so‘ng ko‘rinadi)",
                "Haftalik bepul IELTS Mock testlari",
                "Doimiy shaxsiy mentor yordami",
                "Kutubxona kitoblaridan bepul foydalanish",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 text-sm mt-0.5">✓</span>
                  <span className="text-[13px]">{x}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sertifikatlangan Ustoz
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/60 to-accent-500/50 text-base font-bold text-white shadow-xl"
              >
                {(selectedVariant.teacher?.name || selectedVariant.teacherId?.name || "Ustoz").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  <NameWithEmoji
                    name={selectedVariant.teacher?.name || selectedVariant.teacherId?.name || "Ustoz"}
                    emoji={selectedVariant.teacher?.nameEmoji || selectedVariant.teacherId?.nameEmoji}
                    anim={selectedVariant.teacher?.nameEmojiAnim || selectedVariant.teacherId?.nameEmojiAnim}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {c.subject?.name || c.subjectId?.name || "Kurs ustozi"}
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-400">
                  ★ {typeof teacherStats?.rating === "number" ? teacherStats.rating.toFixed(1) : "—"} ·{" "}
                  {typeof teacherStats?.reviewsCount === "number" ? `${teacherStats.reviewsCount} ta sharh` : "sharhlar"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
  tone = "default",
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "default" | "primary";
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
        active
          ? tone === "primary"
            ? "border-primary-500/60 bg-primary-500/15 text-primary-300 shadow-md shadow-primary-500/10"
            : "border-white/20 bg-white/[0.08] text-white"
          : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
