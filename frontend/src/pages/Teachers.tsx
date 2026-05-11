import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Input, NameWithEmoji, StarRating, Tabs } from "../components/ui";
import { IArrow, IChat, ISearch } from "../components/icons";
import { dashboard as dashboardApi, teachers as teachersApi, uploads as uploadsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";

export function Teachers() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [tab, setTab] = useState<"mine" | "all" | "online" | "top">(() => (isStudent ? "mine" : "all"));
  const [q, setQ] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [myTeacherIds, setMyTeacherIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [presence, setPresence] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    teachersApi
      .list()
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Ustozlar yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isStudent) {
      setTab((prev) => prev === "mine" ? "all" : prev);
      setMyTeacherIds(new Set());
      return;
    }
    setTab((prev) => (prev === "all" ? "mine" : prev));
    dashboardApi
      .student()
      .then((data) => {
        const ids = new Set<string>();
        (Array.isArray(data?.enrollments) ? data.enrollments : []).forEach((enrollment: any) => {
          const teacherId = enrollment?.course?.teacher?.id || enrollment?.course?.teacherId;
          if (teacherId) ids.add(String(teacherId));
        });
        setMyTeacherIds(ids);
      })
      .catch(() => setMyTeacherIds(new Set()));
  }, [isStudent]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onPresence = ({ userId, online }: any) => setPresence((prev) => ({ ...prev, [String(userId)]: !!online }));
    socket.on("presence:update", onPresence);
    return () => { socket.off("presence:update", onPresence); };
  }, []);

  const isTeacherOnline = (t: any) => {
    const id = String(t?.id || t?._id || "");
    if (presence[id] !== undefined) return presence[id];
    if (!t?.lastSeen) return false;
    return Date.now() - new Date(t.lastSeen).getTime() < 2 * 60 * 1000;
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let arr = list;
    if (tab === "mine") {
      arr = arr.filter((t) => myTeacherIds.has(String(t?.id || t?._id || "")));
    }
    if (qq) {
      arr = arr.filter((t) => String(t?.name || "").toLowerCase().includes(qq));
    }
    if (tab === "online") arr = arr.filter(isTeacherOnline);
    if (tab === "top") {
      arr = [...arr].sort((a, b) => (b?.avgRating || 0) - (a?.avgRating || 0));
    }
    return arr;
  }, [list, q, tab, presence, myTeacherIds]);

  const onlineCount = list.filter(isTeacherOnline).length;
  const myTeachersCount = list.filter((t) => myTeacherIds.has(String(t?.id || t?._id || ""))).length;
  const listLabel = isStudent && tab === "mine" ? "sizning ustozlaringiz" : "professional ustoz";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="ustoz" dot className="mb-3">
            👨‍🏫 Sertifikatlangan
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ustozlar katalogi
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            <span className="font-semibold text-white">{loading ? "…" : filtered.length}</span> ta
            {listLabel} · barchasi sertifikatlangan
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Ustoz qidirish..."
            icon={<ISearch className="h-4 w-4" />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <Tabs<"mine" | "all" | "online" | "top">
          value={tab}
          onChange={setTab}
          options={[
            ...(isStudent ? [{ value: "mine" as const, label: "Mening ustozlarim", count: myTeachersCount }] : []),
            { value: "all", label: "Barchasi", count: list.length },
            { value: "online", label: "Onlayn", count: onlineCount },
            { value: "top", label: "Top reyting" },
          ]}
        />
      </div>

      {error ? (
        <Card className="p-5 border-rose-500/20 bg-rose-500/10 text-rose-200">{error}</Card>
      ) : loading ? (
        <Card className="p-5 text-slate-300">Yuklanmoqda...</Card>
      ) : filtered.length === 0 && tab === "mine" ? (
        <Card className="p-6 text-slate-300">
          <div className="text-lg font-semibold text-white">Hozircha sizga biriktirilgan ustoz yo‘q.</div>
          <p className="mt-2 text-sm text-slate-400">Barcha ustozlarni ko‘rish uchun “Barchasi”ni bosing.</p>
          <Button className="mt-4" size="sm" onClick={() => setTab("all")}>Barchasini ko‘rish</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const online = isTeacherOnline(t);
            return (
            <Card key={t._id || t.id || t.name} hover className="overflow-hidden">
            {/* Cover */}
            <div className="relative h-20 bg-gradient-to-br from-primary-500/30 to-accent-500/20">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div className="px-5 pb-5">
              <div className="-mt-8 flex items-end justify-between">
                <div className="relative">
                  <Avatar
                    initials={(t?.name || "?").slice(0, 2).toUpperCase()}
                    color="from-primary-500 to-accent-500"
                    size="lg"
                    ring
                    imageUrl={t?.avatar || undefined}
                  />
                  <span className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-ink-900 ${online ? "bg-emerald-400" : "bg-rose-500"}`}>
                    {online && <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-400" />}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StarRating value={Number(t?.avgRating || 0)} readOnly size="sm" />
                  <span className="text-xs font-semibold text-amber-300">
                    {Number(t?.avgRating || 0).toFixed(1)}
                  </span>
                </div>
                <Badge variant="success">{Number(t?.ratingScore || 0)} ball</Badge>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-semibold text-white">
                  <NameWithEmoji name={t.name} emoji={t.nameEmoji} anim={t.nameEmojiAnim} />
                </h3>
                <div className="mt-0.5 text-xs text-slate-500">
                  {t.subject?.name || t.subjectId?.name || "Ustoz"}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                {t.bio || "Tajriba va kurslar bo'yicha ma'lumotlar tez orada qo'shiladi."}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <Stat l="Reyting" v={String(Number(t?.avgRating || 0).toFixed(1))} />
                <div className="border-x border-white/[0.05]">
                  <Stat l="Kurs" v={String(t?.coursesCount ?? "—")} />
                </div>
                <Stat l="Holat" v={online ? "Onlayn" : "Offline"} />
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const id = String(t?.id || t?._id || "");
                    if (id) window.location.href = `/teachers/${id}`;
                  }}
                >
                  Profil <IArrow className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const id = String(t?.id || t?._id || "");
                    if (!id) return;
                    window.location.href = `/messages?to=${encodeURIComponent(id)}`;
                  }}
                >
                  <IChat className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
          );})}
        </div>
      )}
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-white">{v}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div>
    </div>
  );
}

export function TeacherProfile({ teacherId }: { teacherId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    setLoading(true);
    teachersApi
      .get(teacherId)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Ustoz topilmadi"))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const teacher = data?.teacher || null;
  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  const recentReviews = Array.isArray(data?.recentReviews) ? data.recentReviews : reviews.slice(0, 5);
  const stats = data?.stats || {};
  const funFacts = Array.isArray(data?.funFacts) ? data.funFacts : [];

  if (loading) return <Card className="mx-auto max-w-5xl p-6 text-slate-300">Yuklanmoqda...</Card>;
  if (error || !teacher) {
    return (
      <Card className="mx-auto max-w-5xl p-6 text-rose-200 border border-rose-500/20 bg-rose-500/10">
        {error || "Ustoz topilmadi"}
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <button
        onClick={() => (window.location.href = "/teachers")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
      >
        ← Ustozlar katalogi
      </button>

      <Card className="overflow-hidden">
        <div
          className="relative h-36 bg-gradient-to-br from-primary-500/30 to-accent-500/20"
          style={
            teacher?.coverImage
              ? {
                  backgroundImage: `url(${teacher.coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-grid opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {user?.id === teacher?.id ? (
            <div className="absolute right-4 top-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingCover(true);
                      await uploadsApi.cover(file);
                      const d = await teachersApi.get(teacherId);
                      setData(d);
                    } catch (err: any) {
                      alert(err?.message || "Cover yuklanmadi");
                    } finally {
                      setUploadingCover(false);
                      e.target.value = "";
                    }
                  }}
                />
                <Button size="sm" variant="outline" disabled={uploadingCover}>
                  {uploadingCover ? "Yuklanmoqda..." : "Cover qo‘yish"}
                </Button>
              </label>
            </div>
          ) : null}
        </div>
        <div className="p-6 sm:p-7">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar
                initials={(teacher?.name || "?").slice(0, 2).toUpperCase()}
                color="from-primary-500 to-accent-500"
                size="lg"
                ring
                imageUrl={teacher?.avatar || undefined}
              />
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {teacher ? <NameWithEmoji name={teacher.name} emoji={teacher.nameEmoji} anim={teacher.nameEmojiAnim} /> : null}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {teacher?.teacherDetails?.specialization || "Ustoz"} · {stats?.coursesCount ?? courses.length} ta kurs
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <StarRating value={Number(stats?.rating || 0)} readOnly size="sm" />
                    <span className="text-amber-300 font-semibold">
                      {Number(stats?.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <Badge>Sharhlar: {stats?.reviewsCount ?? reviews.length}</Badge>
                  <Badge variant="success">O‘quvchilar: {stats?.totalStudents ?? "—"}</Badge>
                  <Badge variant="primary">{Number(stats?.ratingScore || 0)} ball</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `/messages?to=${encodeURIComponent(String(teacher.id))}`;
                }}
              >
                <IChat className="h-4 w-4" /> Xabar yozish
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {funFacts.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {funFacts.slice(0, 3).map((f: any) => (
            <Card key={f.title} hover className="p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{f.title}</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{f.value}</div>
              <div className="mt-1 text-xs text-slate-500">{f.hint}</div>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white">Kurslar</h2>
          <p className="mt-1 text-xs text-slate-500">Ustoz o‘qitadigan kurslar ro‘yxati</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {courses.length === 0 ? (
              <div className="text-sm text-slate-400">Hozircha kurs yo‘q.</div>
            ) : (
              courses.map((c: any) => (
                <Card key={c.id} hover className="p-4">
                  <div className="text-sm font-semibold text-white">{c.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {c.subject?.name || ""} · {c.level} · {c.type}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                    <span>📚 {c.lessonCount ?? c?._count?.lessons ?? 0} dars</span>
                    <span>·</span>
                    <span>👥 {c.studentCount ?? "—"} o‘quvchi</span>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" onClick={() => (window.location.href = `/courses/${c.id}`)}>
                      Kursni ochish <IArrow className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-white">Sharh qoldirish</h2>
          <p className="mt-1 text-xs text-slate-500">Faqat login bo‘lgan talaba bera oladi.</p>
          {!user ? (
            <div className="mt-4 text-sm text-slate-400">
              Sharh qoldirish uchun <Button size="sm" variant="outline" onClick={() => (window.location.href = "/login")}>kirish</Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <span className="mb-2 block text-xs font-semibold text-slate-300">
                  Bahoyingiz ({rating} / 5)
                </span>
                <StarRating value={rating} onChange={setRating} size="lg" />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Yulduzga bosib bahoyingizni tanlang
                </p>
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-300">Izoh</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="h-28 w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary-500/60 focus:outline-none"
                  placeholder="Qisqa fikringiz..."
                />
              </div>
              <Button
                variant="gradient"
                disabled={sending}
                onClick={async () => {
                  try {
                    setSending(true);
                    await teachersApi.addReview(String(teacher.id), { rating, comment: comment.trim() || undefined });
                    const d = await teachersApi.get(String(teacher.id));
                    setData(d);
                    setComment("");
                  } catch (e: any) {
                    alert(e?.message || "Sharh yuborilmadi");
                  } finally {
                    setSending(false);
                  }
                }}
              >
                Sharh yuborish
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-white">Sharhlar</h2>
        <p className="mt-1 text-xs text-slate-500">Oxirgi {Math.min(recentReviews.length, 5)} ta</p>
        <div className="mt-4 space-y-3">
          {recentReviews.length === 0 ? (
            <div className="text-sm text-slate-400">Hozircha sharh yo‘q.</div>
          ) : (
            recentReviews.slice(0, 5).map((r: any) => (
              <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white truncate">
                    {r?.student ? (
                      <NameWithEmoji name={r.student.name || "Talaba"} emoji={r.student.nameEmoji} anim={r.student.nameEmojiAnim} />
                    ) : "Talaba"}
                  </div>
                  <StarRating value={Number(r?.rating || 0)} readOnly size="sm" />
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {r?.comment || "Izoh qoldirilmagan."}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
