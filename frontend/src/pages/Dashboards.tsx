import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, NameWithEmoji, Progress, Ring, SectionHeader } from "../components/ui";
import {
  IArrow,
  IBook,
  ICalendar,
  IClock,
  IPlay,
  IStar,
  ITrophy,
  IUsers,
  IWallet,
  IChat,
  IPlus,
} from "../components/icons";
import { attendance as attendanceApi, battle as battleApi, dashboard as dashboardApi, discounts as discountsApi, downloadBlob, parent as parentApi, tests as testsApi } from "../services/api";
import type { Page } from "../components/Layout";
import { useAuth } from "../context/AuthContext";

function stableProgressPercent(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  return 25 + (h % 70);
}

/* ==================== STUDENT DASHBOARD ==================== */
export function StudentDashboard({
  onNavigate,
}: {
  onNavigate: (p: Page) => void;
}) {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [discountAwards, setDiscountAwards] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .student()
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Dashboard yuklanmadi"))
      .finally(() => setLoading(false));
    discountsApi.awards().then((rows) => setDiscountAwards(Array.isArray(rows) ? rows : [])).catch(() => setDiscountAwards([]));
  }, []);

  const enrollments = Array.isArray(data?.enrollments) ? data.enrollments : [];
  const testResults = Array.isArray(data?.testResults) ? data.testResults : [];
  const attendance = data?.attendance;

  const avgTestScore = useMemo(() => {
    if (!testResults.length) return 0;
    const sum = testResults.reduce((acc: number, r: any) => acc + Number(r.score ?? 0), 0);
    return Math.round(sum / testResults.length);
  }, [testResults]);

  const totalLessonMaterials = useMemo(() => {
    return enrollments.reduce((n: number, e: any) => n + (e?.course?.lessons?.length || 0), 0);
  }, [enrollments]);

  const upcomingLessons = useMemo(() => {
    const lessons = enrollments
      .flatMap((e: any) => e?.course?.lessons || [])
      .slice(0, 6);
    return lessons;
  }, [enrollments]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      {/* Hero welcome */}
      <Card glow className="overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div className="hero-glow absolute inset-0 opacity-55" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge variant="talaba" dot className="mb-3">
                Xush kelibsiz
              </Badge>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Salom, <NameWithEmoji name={user?.name || "Talaba"} emoji={user?.nameEmoji} anim={user?.nameEmojiAnim} />! 👋
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300">
                {error ? (
                  <span className="text-rose-300">{error}</span>
                ) : loading ? (
                  "Yuklanmoqda..."
                ) : (
                  <>
                    Sizda <strong className="text-white">{enrollments.length} ta kurs</strong> va{" "}
                    <strong className="text-amber-300">{testResults.length} ta test natijasi</strong> bor.
                  </>
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button variant="gradient" onClick={() => onNavigate("tests")}>
                  <ITrophy className="h-4.5 w-4.5" /> Quiz Battle 2.0
                </Button>
                <Button variant="outline" onClick={() => onNavigate("courses")}>
                  Barcha Kurslarni ko'rish
                </Button>
                {discountAwards.length > 0 ? (
                  <Badge variant="success">{discountAwards.length} ta chegirma/g‘oliblik</Badge>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur">
              <Ring value={Math.min(100, avgTestScore || (enrollments.length ? 40 : 0))} size={76} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Testlar bo‘yicha o‘rtacha
                </div>
                <div className="text-xl font-extrabold text-white">
                  {testResults.length ? `${avgTestScore} ball` : "—"}
                </div>
                <div className="mt-1 text-xs text-emerald-400">
                  {totalLessonMaterials > 0
                    ? `${totalLessonMaterials} ta video/dars materiallari`
                    : "Kurslarga yoziling — materiallar shu yerda"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Mening kurslarim" value={`${enrollments.length} ta`} icon={IBook} tone="primary" />
        <StatCard
          label="So'nggi test (ball)"
          value={`${testResults[0]?.score ?? "—"}`}
          icon={IStar}
          tone="warning"
        />
        <StatCard label="Test natijalari" value={`${testResults.length} ta`} icon={ITrophy} tone="success" />
        <StatCard
          label="Davomat (yozuvlar)"
          value={
            attendance?.ratePct != null ? `${attendance.ratePct}%` : "—"
          }
          icon={ICalendar}
          tone="default"
        />
      </div>

      <MyAttendanceCard />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today schedule */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Bugungi va Kelgusi Darslar
              </h2>
              <p className="text-xs text-slate-500">
                Reja asosidagi darslar
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("study-plan")}
            >
              Haftalik dars jadvali <IArrow className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-3">
            {(upcomingLessons.length ? upcomingLessons : []).map((l: any, idx: number) => (
              <div
                key={l.id || l.title || idx}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 transition hover:bg-white/[0.03]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/10 ring-1 ring-white/[0.06]">
                  <IPlay className="h-4.5 w-4.5 text-primary-300 group-hover:scale-110 transition duration-150" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {l.title || "Dars"}
                  </div>
                  <div className="text-xs text-slate-400">{l.course?.title || "—"}</div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-white/[0.05] pt-2 sm:pt-0">
                  <Badge
                    variant={
                      "default"
                    }
                    dot
                  >
                    Dars
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <IClock className="h-3.5 w-3.5" /> —
                  </div>
                  <Button
                    variant="soft"
                    size="sm"
                    className="sm:opacity-0 transition group-hover:opacity-100"
                  >
                    Xonaga kirish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Progress */}
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Kurs o'zlashtirishi</h2>
            <Badge variant="success" dot>
              {enrollments.filter((e: any) => e.status === "active").length} ta faol
            </Badge>
          </div>
          <div className="space-y-5">
            {enrollments.slice(0, 4).map((e: any, i: number) => {
              const title = e?.course?.title || "Kurs";
              const subj = e?.course?.subject?.name || "";
              const cid = e?.course?.id || String(i);
              const p =
                e.status === "completed"
                  ? 100
                  : Math.min(95, stableProgressPercent(cid) + (e?.course?.lessons?.length ? 5 : 0));
              return (
                <div key={e.id || i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 truncate text-slate-300">
                      <span className="text-lg leading-none">📘</span>
                      <span className="truncate font-medium">{title}</span>
                    </span>
                    <span className="font-bold text-white">{p}%</span>
                  </div>
                  <Progress value={p} color="from-primary-500 to-accent-500" />
                  <div className="text-[10px] text-slate-600 truncate">{subj}</div>
                </div>
              );
            })}
            {enrollments.length === 0 && (
              <div className="text-sm text-slate-500">Hozircha yozilgan kurs yo‘q.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent activity + tests */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-white">
            So'nggi test natijalari
          </h2>
          <div className="space-y-3">
            {testResults.slice(0, 6).map((r: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3.5 hover:bg-white/[0.03] transition duration-150"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold shadow-md ${
                    Number(r.score) >= 90
                      ? "bg-emerald-500/15 text-emerald-300"
                      : Number(r.score) >= 75
                        ? "bg-primary-500/15 text-primary-300"
                        : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {r.score ?? "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {r.subject?.name || "Test"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.level || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Siz uchun tavsiyalar</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("courses")}>
              Hammasini ko'rish
            </Button>
          </div>
          <div className="space-y-3">
            {enrollments.slice(0, 3).map((e: any, idx: number) => (
              <div
                key={e?.course?.id || e?.courseId || idx}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 transition hover:bg-white/[0.02]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/10 text-2xl shadow-md">
                  📘
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-bold text-white">
                    {e?.course?.title || "Kurs"}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span>{e?.course?.subject?.name || "—"}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-300">{e?.course?.price ? `${e.course.price.toLocaleString("uz-UZ")} so'm` : "Bepul"}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavigate("courses")}>
                  Ko'rish
                </Button>
              </div>
            ))}
            {enrollments.length === 0 && (
              <div
                className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 text-sm text-slate-400"
              >
                Hozircha kursga yozilmagansiz. “Kurslar” bo‘limidan kurs tanlang.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ==================== TEACHER DASHBOARD ==================== */
export function TeacherDashboard({
  onNavigate,
}: {
  onNavigate: (p: Page) => void;
}) {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseId, setCourseId] = useState("");
  const [battleResult, setBattleResult] = useState<any | null>(null);
  const [questionRows, setQuestionRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState("");
  const [manualQuestion, setManualQuestion] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    level: "Beginner",
  });

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .teacher()
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Ustoz dashboard yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const lessons = Array.isArray(data?.lessons) ? data.lessons : [];
  const teacherInfo = data?.teacher || {};
  const activeCourseId = courseId || courses[0]?.id || "";

  useEffect(() => {
    if (!courseId && courses[0]?.id) setCourseId(courses[0].id);
  }, [courseId, courses.length]);

  const loadQuestions = () => {
    if (!activeCourseId) return;
    testsApi.manageQuestions({ courseId: activeCourseId }).then((rows) => setQuestionRows(Array.isArray(rows) ? rows : [])).catch(() => setQuestionRows([]));
  };

  useEffect(() => {
    loadQuestions();
  }, [activeCourseId]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(60% 50% at 0% 0%, rgba(139,92,246,0.3) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge variant="ustoz" dot className="mb-3">
                Ustoz boshqaruvi
              </Badge>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Salom, <NameWithEmoji name={user?.name || "Ustoz"} emoji={user?.nameEmoji} anim={user?.nameEmojiAnim} /> 👋
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300">
                {error ? (
                  <span className="text-rose-300">{error}</span>
                ) : loading ? (
                  "Yuklanmoqda..."
                ) : (
                  <>
                    Sizda <strong className="text-white">{courses.length} ta kurs</strong> va{" "}
                    <strong className="text-violet-300">{teacherInfo.studentCount ?? 0} ta talaba</strong> bor.
                  </>
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button variant="gradient" onClick={() => onNavigate("attendance")}>
                  <ICalendar className="h-4.5 w-4.5" /> Davomat olish
                </Button>
                <Button variant="outline">
                  <IPlus className="h-4.5 w-4.5" /> Yangi dars dars dasturi
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/15 to-primary-500/10 p-5 backdrop-blur shadow-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                Joriy oylik tushum
              </div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                {(teacherInfo.balance ?? 0).toLocaleString("uz-UZ")}
              </div>
              <div className="text-xs text-slate-400">so'm (daromad)</div>
              <div className="mt-2 text-xs text-slate-500">
                Oxirgi tasdiqlangan to‘lovlardan keyingi balans
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Mening kurslarim" value={`${courses.length} ta`} icon={IBook} tone="primary" />
        <StatCard label="Jami talabalar" value={`${teacherInfo.studentCount ?? 0} ta`} icon={IUsers} tone="default" />
        <StatCard label="Dars materiallari" value={`${lessons.length} ta`} icon={ITrophy} tone="success" />
        <StatCard label="O'rtacha reyting" value={`${teacherInfo.averageRating ?? "—"}`} icon={IStar} tone="warning" />
      </div>

      <MyAttendanceCard />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Battle"
            title="Kurs talabalari uchun battle uyushtirish"
            description="Xona faqat tanlangan kursga yozilgan active talabalarga ochiladi."
          />
          <TeacherCourseSelect courses={courses} value={activeCourseId} onChange={setCourseId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              variant="gradient"
              disabled={!activeCourseId}
              onClick={async () => {
                const room = await battleApi.create({ courseId: activeCourseId, questionCount: 10, durationMinutes: 20 });
                setBattleResult(room);
              }}
            >
              Battle xona yaratish
            </Button>
            {battleResult && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                <div className="text-slate-500">Room code</div>
                <div className="text-2xl font-extrabold tracking-widest text-primary-300">{battleResult.roomCode}</div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Excel"
            title="Savollar import/export"
            description="Template yuklab oling, to‘g‘ri javobni A/B/C/D bilan belgilang va Excelni yuklang."
          />
          <TeacherCourseSelect courses={courses} value={activeCourseId} onChange={setCourseId} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={async () => downloadBlob(await testsApi.template(), "test-question-template.xlsx")}>
              Template yuklab olish
            </Button>
            <Button variant="outline" disabled={!activeCourseId} onClick={async () => downloadBlob(await testsApi.exportQuestions(activeCourseId), "questions.xlsx")}>
              Savollar export
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.04]">
              Excel import
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={async (e) => {
                  const file = e.currentTarget.files?.[0];
                  if (!file) return;
                  const result = await testsApi.importQuestions(file, activeCourseId);
                  setImportResult(`${result.count || 0} ta savol import qilindi, xato: ${result.errorCount || 0}`);
                  e.currentTarget.value = "";
                  loadQuestions();
                }}
              />
            </label>
          </div>
          {importResult && <div className="mt-3 text-sm text-slate-300">{importResult}</div>}
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeader
          eyebrow="Savollar banki"
          title="Qo‘lda savol qo‘shish va ko‘rish"
          description={`${questionRows.length} ta savol tanlangan kursga bog‘langan.`}
        />
        <TeacherCourseSelect courses={courses} value={activeCourseId} onChange={setCourseId} />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <input value={manualQuestion.question} onChange={(e) => setManualQuestion({ ...manualQuestion, question: e.target.value })} placeholder="Savol matni" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200" />
            {(["optionA", "optionB", "optionC", "optionD"] as const).map((key) => (
              <input key={key} value={manualQuestion[key]} onChange={(e) => setManualQuestion({ ...manualQuestion, [key]: e.target.value })} placeholder={key} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200" />
            ))}
            <div className="flex gap-2">
              <select value={manualQuestion.correctOption} onChange={(e) => setManualQuestion({ ...manualQuestion, correctOption: e.target.value })} className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200">
                {["A", "B", "C", "D"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <Button
                disabled={!activeCourseId || !manualQuestion.question.trim()}
                onClick={async () => {
                  const options = [manualQuestion.optionA, manualQuestion.optionB, manualQuestion.optionC, manualQuestion.optionD].filter(Boolean);
                  const idx = "ABCD".indexOf(manualQuestion.correctOption);
                  await testsApi.create({
                    courseId: activeCourseId,
                    question: manualQuestion.question,
                    options,
                    correctAnswer: options[idx],
                    level: manualQuestion.level,
                  });
                  setManualQuestion({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", level: "Beginner" });
                  loadQuestions();
                }}
              >
                Savol qo‘shish
              </Button>
            </div>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {questionRows.slice(0, 20).map((q: { id: string; question: string; level?: string; correctAnswer?: string }) => (
              <div key={q.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-sm font-semibold text-white">{q.question}</div>
                <div className="mt-1 text-xs text-slate-500">{q.level} · To‘g‘ri: {q.correctAnswer}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Siz dars beradigan guruhlar
            </h2>
            <Button variant="ghost" size="sm">
              Guruhlarni tahrirlash
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-3 font-semibold">Kurs nomi</th>
                  <th className="pb-3 font-semibold">Talabalar</th>
                  <th className="pb-3 font-semibold">Reyting</th>
                  <th className="pb-3 font-semibold">Guruh Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {courses.slice(0, 6).map((c: any) => (
                  <tr key={c.id} className="transition hover:bg-white/[0.02]">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/10 text-lg shadow-md"
                        >
                          📘
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {c.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.subject?.name || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-300 font-medium">
                      {typeof c.enrollmentCount === "number" ? `${c.enrollmentCount} ta` : "—"}
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <IStar className="h-3.5 w-3.5" /> —
                      </span>
                    </td>
                    <td>
                      <Badge variant="success" dot>
                        Faol guruh
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-white">
            Bugungi darslar jadvali
          </h2>
          <div className="space-y-3">
            {lessons.slice(0, 6).map((l: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3.5"
              >
                <div className="text-sm font-bold text-primary-300 font-mono">—</div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {l.title || "Dars"}
                  </div>
                  <div className="truncate text-xs text-slate-500">{l.course?.title || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Moliyaviy — real oylik ajratma keyin qo‘shiladi; hozir balans kartada */}
      <Card className="p-6">
        <SectionHeader
          eyebrow="Moliyaviy"
          title="Daromad bo‘yicha diagramma"
          description="To‘liq oylik tarix backend’da bog‘langach avtomatik chiqadi. Hozir joriy balans yuqoridagi kartada."
        />
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-slate-400">
          Grafik uchun oylik to‘lovlar jadvali hali ulanmagan — balans va kurslar real ma’lumot.
        </div>
      </Card>
    </div>
  );
}

/* ==================== STAT CARD ==================== */
function MyAttendanceCard() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    attendanceApi
      .my()
      .then((list) => {
        setRows(Array.isArray(list) ? list : []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Davomat yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const presentLike = new Set(["present", "+", "keldi"]);
  const absentLike = new Set(["absent", "-", "kelmadi"]);
  const present = rows.filter((r) => presentLike.has(String(r.status).toLowerCase())).length;
  const rate = rows.length ? Math.round((present / rows.length) * 100) : 0;
  const calendar = useMemo(() => {
    const base = rows[0]?.date ? new Date(rows[0].date) : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const byDay = new Map<string, any>();
    rows.forEach((row) => {
      if (!row.date) return;
      const d = new Date(row.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      byDay.set(d.toISOString().slice(0, 10), row);
    });
    const weeks: Array<Array<{ day: number | null; row?: any; key: string }>> = [];
    let week: Array<{ day: number | null; row?: any; key: string }> = [];
    const mondayOffset = (first.getDay() + 6) % 7;
    for (let i = 0; i < mondayOffset; i++) week.push({ day: null, key: `blank-start-${i}` });
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(year, month, day);
      const key = d.toISOString().slice(0, 10);
      week.push({ day, row: byDay.get(key), key });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push({ day: null, key: `blank-end-${week.length}` });
      weeks.push(week);
    }
    return {
      title: base.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" }),
      weeks,
    };
  }, [rows]);

  const statusTone = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (presentLike.has(normalized)) return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
    if (absentLike.has(normalized)) return "border-rose-500/40 bg-rose-500/15 text-rose-200";
    if (status) return "border-amber-500/40 bg-amber-500/15 text-amber-200";
    return "border-white/[0.06] bg-white/[0.02] text-slate-500";
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Mening davomatim</h2>
          <p className="text-xs text-slate-500">
            {calendar.title} · har qator bitta hafta, oy boshidan.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-white">{rows.length ? `${rate}%` : "—"}</div>
          <div className="text-xs text-slate-500">{rows.length} ta yozuv</div>
        </div>
      </div>
      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
      ) : loading ? (
        <div className="text-sm text-slate-400">Davomat yuklanmoqda...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-400">
          Hozircha siz uchun davomat yozuvi yo‘q.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="space-y-1.5">
            {calendar.weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1.5">
                {week.map((cell) => (
                  <div
                    key={cell.key}
                    className={`min-h-10 rounded-lg border px-1.5 py-1 text-center ${cell.day ? statusTone(cell.row?.status) : "border-transparent bg-transparent"}`}
                    title={cell.row?.status ? `${cell.day}: ${cell.row.status}` : cell.day ? `${cell.day}: yozuv yo‘q` : ""}
                  >
                    {cell.day ? (
                      <>
                        <div className="text-xs font-extrabold">{cell.day}</div>
                        <div className="mt-1 text-[9px] leading-none">
                          {cell.row
                            ? presentLike.has(String(cell.row.status).toLowerCase())
                              ? "Keldi"
                              : absentLike.has(String(cell.row.status).toLowerCase())
                                ? "Kelmadi"
                                : String(cell.row.status || "—")
                            : "—"}
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Keldi</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Kelmadi</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/20" /> Yozuv yo‘q</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function TeacherCourseSelect({ courses, value, onChange }: { courses: any[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-3 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200"
    >
      {courses.map((c: any) => (
        <option key={c.id} value={c.id}>
          {c.title} ({c.enrollmentCount ?? 0} talaba)
        </option>
      ))}
    </select>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: typeof IBook;
  tone: "primary" | "success" | "warning" | "default";
}) {
  const tones: Record<string, string> = {
    primary: "from-primary-500/20 to-primary-500/0 text-primary-300",
    success: "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
    warning: "from-amber-500/20 to-amber-500/0 text-amber-300",
    default: "from-slate-500/20 to-slate-500/0 text-slate-300",
  };
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        {delta && (
          <span className="text-[11px] font-semibold text-emerald-400">
            ↗ {delta}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-white">
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </Card>
  );
}

/* ==================== PARENT PANEL ==================== */
export function ParentPanel() {
  const [children, setChildren] = useState<any[]>([]);
  const [childId, setChildId] = useState<string>("");
  const [stats, setStats] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    parentApi
      .children()
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setChildren(list);
        if (!childId && list[0]?.id) setChildId(list[0].id);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Farzandlar yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!childId) return;
    setLoading(true);
    Promise.all([parentApi.childStats(childId), parentApi.childAttendance(childId)])
      .then(([s, a]) => {
        setStats(s);
        setAttendance(Array.isArray(a) ? a : []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Ma'lumotlar yuklanmadi"))
      .finally(() => setLoading(false));
  }, [childId]);

  const child = stats?.child || children.find((c) => c.id === childId) || null;
  const childName = child?.name || "Farzand";
  const testResults = Array.isArray(stats?.testResults) ? stats.testResults : [];
  const enrollments = Array.isArray(stats?.enrollments) ? stats.enrollments : [];
  const presentCount = attendance.filter((x) => String(x.status) === "+" || String(x.status) === "present").length;
  const attendancePct = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(60% 50% at 100% 0%, rgba(16,185,129,0.25) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="success" dot className="mb-3">
                Ota-ona nazorat oynasi
              </Badge>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Farzand ko'rsatkichlari
              </h1>
              <div className="mt-2.5 flex items-center gap-3">
                <Avatar
                  initials={(childName || "F").slice(0, 2).toUpperCase()}
                  imageUrl={child?.avatar || undefined}
                  color="from-emerald-500 to-teal-600"
                  size="lg"
                  ring
                />
                <div>
                  <div className="text-base font-bold text-white">
                    <NameWithEmoji name={childName} emoji={child?.nameEmoji} anim={child?.nameEmojiAnim} />
                  </div>
                  <div className="text-xs text-slate-400">
                    {loading ? "Yuklanmoqda..." : error ? error : `${children.length} ta farzand`}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="h-9 rounded-xl border border-white/[0.08] bg-ink-950/40 px-3 text-sm text-slate-200"
                >
                  {children.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button variant="outline">
              <IChat className="h-4 w-4" /> Sinf rahbari bilan bog'lanish
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Umumiy Davomat" value={`${attendancePct}%`} icon={ICalendar} tone="success" />
        <StatCard label="Testlar" value={`${testResults.length} ta`} icon={IStar} tone="warning" />
        <StatCard label="Faol kurslar" value={`${enrollments.length} ta`} icon={IBook} tone="primary" />
        <StatCard label="XP" value={`${stats?.child?.xp ?? "—"}`} icon={IWallet} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-white">
            Fanlar bo'yicha baholar
          </h2>
          <div className="space-y-3.5">
            {testResults.slice(0, 8).map((r: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3.5"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${
                    (r.score ?? 0) >= 90
                      ? "bg-emerald-500/15 text-emerald-300"
                      : (r.score ?? 0) >= 75
                        ? "bg-primary-500/15 text-primary-300"
                        : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {r.score ?? "—"}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{r.subject?.name || "Test"}</div>
                  <div className="text-xs text-slate-500">{r.level || "—"}</div>
                </div>
                <Progress value={Math.min(100, Math.max(0, Number(r.score || 0)))} size="sm" color={Number(r.score || 0) >= 90 ? "from-emerald-500 to-teal-500" : "from-primary-500 to-accent-500"} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-white">
            Ustozlar ro'yxati
          </h2>
          <div className="space-y-3">
            {enrollments.slice(0, 8).map((e: any, i: number) => (
              <div
                key={e?.course?.id || i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 hover:bg-white/[0.03] transition duration-150"
              >
                <Avatar initials="U" color="from-primary-500 to-accent-500" online />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{e?.course?.title || "Kurs"}</div>
                  <div className="text-xs text-slate-400">Kurs</div>
                </div>
                <Button variant="outline" size="sm">
                  <IChat className="h-4 w-4" /> SMS
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
