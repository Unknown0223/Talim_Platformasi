import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Input, Tabs } from "../components/ui";
import { IDownload, ISearch, IStar } from "../components/icons";
import { library as libraryApi } from "../services/api";
import { cn } from "../utils/cn";

function stableRating(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 9;
  return `4.${hash + 1}`;
}

export function Library() {
  const [tab, setTab] = useState<"all" | "saved" | "recent">("all");
  const [q, setQ] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("library_saved_ids");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      return [];
    }
  });
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("library_recent_ids");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setLoading(true);
    libraryApi
      .list()
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Kutubxona yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let arr = list;
    if (qq) {
      arr = arr.filter(
        (b) =>
          String(b?.title || "").toLowerCase().includes(qq) ||
          String(b?.author || "").toLowerCase().includes(qq),
      );
    }
    return arr;
  }, [list, q]);

  const displayed = useMemo(() => {
    const idOf = (b: any) => String(b?._id || b?.id || "");
    if (tab === "saved") {
      const set = new Set(savedIds);
      return filtered.filter((b) => set.has(idOf(b)));
    }
    if (tab === "recent") {
      const map = new Map(filtered.map((b) => [idOf(b), b]));
      return recentIds.map((id) => map.get(id)).filter(Boolean);
    }
    return filtered;
  }, [filtered, tab, savedIds, recentIds]);

  const categories = useMemo(
    () => Array.from(new Set(displayed.map((b) => b.category).filter(Boolean))),
    [displayed],
  );

  const persistSaved = (next: string[]) => {
    setSavedIds(next);
    localStorage.setItem("library_saved_ids", JSON.stringify(next));
  };

  const persistRecent = (bookId: string) => {
    if (!bookId) return;
    setRecentIds((prev) => {
      const next = [bookId, ...prev.filter((x) => x !== bookId)].slice(0, 30);
      localStorage.setItem("library_recent_ids", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="success" dot className="mb-3">
            📚 PDF kutubxona
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Bilim manbalari
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            <span className="font-semibold text-white">{loading ? "…" : displayed.length}</span> ta
            PDF kitob va o'quv qo'llanma · {categories.length} ta kategoriya
          </p>
        </div>
        <div className="w-full sm:w-80">
          <Input
            placeholder="Kitob qidirish..."
            icon={<ISearch className="h-4 w-4" />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Featured banner */}
      <Card glow className="mb-6 overflow-hidden">
        <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="hero-glow absolute inset-0 opacity-40" />
          <div className="relative">
            <Badge variant="warning" dot className="mb-3">
              ⭐ Hafta tavsiyasi
            </Badge>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Cambridge IELTS 17 — to'liq ko'rsatma
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              4 ta to'liq mock test, audio fayllar va batafsil javoblar bilan.
              Bepul yuklab oling.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              <span>184 bet</span>
              <span>·</span>
              <span>12 MB</span>
              <span>·</span>
              <span className="text-amber-400">★ 4.9 (128 sharh)</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-5xl shadow-2xl animate-float">
              📕
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "Barchasi", count: filtered.length },
            { value: "saved", label: "Saqlangan", count: savedIds.length },
            { value: "recent", label: "So'nggi", count: recentIds.length },
          ]}
        />
      </div>

      {error ? (
        <Card className="p-5 border-rose-500/20 bg-rose-500/10 text-rose-200">{error}</Card>
      ) : loading ? (
        <Card className="p-5 text-slate-300">Yuklanmoqda...</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((b) => {
            const bookId = String(b?._id || b?.id || "");
            const isSaved = !!bookId && savedIds.includes(bookId);
            return (
            <Card key={b._id || b.id || b.title} hover className="overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              <div className="relative">
                <div
                  className="flex h-24 w-18 shrink-0 items-center justify-center rounded-lg text-4xl shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    width: "72px",
                  }}
                >
                  📕
                </div>
                {bookId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const next = isSaved
                        ? savedIds.filter((x) => x !== bookId)
                        : [bookId, ...savedIds];
                      persistSaved(next);
                    }}
                    className={cn(
                      "absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition",
                      isSaved ? "bg-amber-400 text-amber-950" : "bg-white/10 text-slate-200 hover:bg-white/15",
                    )}
                    title={isSaved ? "Saqlangandan olib tashlash" : "Saqlash"}
                  >
                    ★
                  </button>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Badge className="mb-2">{b.category || "Kitob"}</Badge>
                <h3 className="truncate text-sm font-semibold text-white">
                  {b.title}
                </h3>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {b.author}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{b.pages || "—"} bet</span>
                  <span>·</span>
                  <span>{b.size || "—"}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <IStar className="h-3 w-3" /> {stableRating(bookId || b.title || "book")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex border-t border-white/[0.05]">
              <button
                className="flex-1 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.04]"
                onClick={() => {
                  // backendda "view" endpoint yo‘q; hozircha download link bo‘lsa ochamiz
                  if (bookId) persistRecent(bookId);
                  if (b.fileUrl) window.open(b.fileUrl, "_blank");
                }}
              >
                Ochish
              </button>
              <div className="w-px bg-white/[0.05]" />
              <button
                className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary-300 transition hover:bg-white/[0.04]"
                onClick={() => {
                  if (bookId) persistRecent(bookId);
                  if (b.fileUrl) window.open(b.fileUrl, "_blank");
                }}
              >
                <IDownload className="h-3.5 w-3.5" /> Yuklash
              </button>
            </div>
          </Card>
          );
          })}
        </div>
      )}
    </div>
  );
}
