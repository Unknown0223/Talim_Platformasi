import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card } from "../components/ui";
import { ICalendar, IMap, IUsers } from "../components/icons";
import { locations as locationsApi, schedule as scheduleApi } from "../services/api";

export function Reception() {
  const [locations, setLocations] = useState<any[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    locationsApi
      .list()
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setLocations(list);
        if (!locationId && list[0]?.id) setLocationId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    scheduleApi
      .list(locationId ? { locationId } : undefined)
      .then((d) => {
        setItems(Array.isArray(d) ? d : []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Jadval yuklanmadi"))
      .finally(() => setLoading(false));
  }, [locationId]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return items
      .map((x) => ({ ...x, _date: x.date ? new Date(x.date) : null }))
      .filter((x) => x._date && x._date >= new Date(now.getTime() - 86400000))
      .slice(0, 30);
  }, [items]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="default" dot className="mb-3">
                🏛️ Qabulxona
              </Badge>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Qabul paneli
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Markaz bo‘yicha bugungi/kelgusi darslar va uchrashuvlar ro‘yxati.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="h-9 rounded-xl border border-white/[0.08] bg-ink-950/40 px-3 text-sm text-slate-200"
              >
                <option value="">Barcha markazlar</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => scheduleApi.list(locationId ? { locationId } : undefined).then((d) => setItems(Array.isArray(d) ? d : []))}>
                Yangilash
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-xs text-slate-500">Rejada</div>
          <div className="mt-1 text-2xl font-bold text-white">{loading ? "…" : upcoming.length}</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <ICalendar className="h-4 w-4" /> dars/uchrashuv
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-slate-500">Markazlar</div>
          <div className="mt-1 text-2xl font-bold text-white">{locations.length}</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <IMap className="h-4 w-4" /> manzil
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-slate-500">Eslatma</div>
          <div className="mt-1 text-2xl font-bold text-white">—</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <IUsers className="h-4 w-4" /> navbat
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-slate-500">Holat</div>
          <div className="mt-1 text-2xl font-bold text-white">{error ? "Xato" : "OK"}</div>
          <div className="mt-3 text-xs text-slate-500">{error || "Server bilan ulandi"}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5 bg-ink-950/40">
          <div className="text-sm font-semibold text-slate-300">Jadval</div>
          <div className="text-xs text-slate-500">{loading ? "Yuklanmoqda..." : `${upcoming.length} ta`}</div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {error ? (
            <div className="p-4 text-sm text-rose-300">{error}</div>
          ) : loading ? (
            <div className="p-4 text-sm text-slate-400">Yuklanmoqda...</div>
          ) : upcoming.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">Hozircha jadval yo‘q</div>
          ) : (
            upcoming.map((s: any) => (
              <div key={s.id} className="p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-semibold text-white">
                    {s.course?.title || "Kurs"}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {s.date ? new Date(s.date).toLocaleDateString("uz-UZ") : "—"} · {s.time || "—"}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {s.location?.name || "—"} · {s.teacher?.name || "—"}
                  {s.topic ? ` · ${s.topic}` : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

