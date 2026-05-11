import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card } from "../components/ui";
import { IPin, IUsers, IClock, IChat } from "../components/icons";
import { locations as locationsApi } from "../services/api";

export function MapPage() {
  const [centres, setCentres] = useState<any[]>([]);
  const [active, setActive] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const yandexKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

  useEffect(() => {
    setLoading(true);
    locationsApi
      .list()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setCentres(arr);
        setActive(arr[0]?.id || arr[0]?._id || "");
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Markazlar yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  // Stable pseudo map coordinates (x/y in %)
  const centresWithXY = useMemo(() => {
    return centres.map((c, idx) => {
      const key = String(c?.id || c?._id || idx);
      const lat = Number(c?.lat ?? c?.latitude ?? 41.311081 + idx * 0.015);
      const lng = Number(c?.lng ?? c?.longitude ?? 69.240562 + idx * 0.018);
      let h = 0;
      for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
      const x = 18 + (h % 64); // 18..81
      const y = 24 + ((h >>> 8) % 44); // 24..67
      return { ...c, id: c.id || c._id || key, x, y, lat, lng };
    });
  }, [centres]);

  const current =
    centresWithXY.find((c) => String(c.id) === String(active)) ||
    centresWithXY[0] ||
    ({ id: "_", name: "—", address: "—", students: 0, x: 50, y: 40, lat: 41.311081, lng: 69.240562 } as any);

  useEffect(() => {
    if (!yandexKey || !mapRef.current || loading || centresWithXY.length === 0) return;
    const init = () => {
      const ymaps = (window as any).ymaps;
      if (!ymaps || mapInstanceRef.current || !mapRef.current) return;
      ymaps.ready(() => {
        const center = [current.lat, current.lng];
        const map = new ymaps.Map(mapRef.current, { center, zoom: 11, controls: ["zoomControl", "fullscreenControl"] });
        centresWithXY.forEach((c) => {
          const placemark = new ymaps.Placemark([c.lat, c.lng], { balloonContentHeader: c.name, balloonContentBody: c.address }, { preset: "islands#blueEducationIcon" });
          placemark.events.add("click", () => setActive(c.id));
          map.geoObjects.add(placemark);
        });
        mapInstanceRef.current = map;
      });
    };
    if ((window as any).ymaps) return init();
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(yandexKey)}&lang=uz_UZ`;
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [yandexKey, loading, centresWithXY.length]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && current?.lat && current?.lng) map.setCenter([current.lat, current.lng], 12, { duration: 300 });
  }, [active, current?.lat, current?.lng]);

  const totalStudents = centresWithXY.reduce((s, c) => s + Number(c.students || 0), 0);

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="primary" dot className="mb-3">
            📍 Markazlar tarmog'i
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            O'quv Markazlarimiz Xaritada
          </h1>
          {error ? (
            <p className="mt-2 text-sm text-rose-300">{error}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              {loading ? (
                "Yuklanmoqda..."
              ) : (
                <>
                  Sizga eng yaqin bo'lgan{" "}
                  <span className="font-semibold text-white">{centresWithXY.length}</span> ta faol filial · Jami{" "}
                  <span className="font-semibold text-white">{totalStudents}+</span>{" "}
                  talaba tahsil olmoqda
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Centres list */}
        <div className="space-y-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1 no-scrollbar">
          {!loading && centresWithXY.length === 0 ? (
            <Card className="p-4 text-sm text-slate-400">Hozircha filial qo‘shilmagan.</Card>
          ) : null}
          {centresWithXY.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`group w-full rounded-2xl border p-4.5 text-left transition-all duration-300 ${
                active === c.id
                  ? "border-primary-500 bg-primary-500/[0.04] shadow-[0_8px_32px_-12px_rgba(53,99,255,0.5)]"
                  : "border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                    active === c.id
                      ? "bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30"
                      : "bg-white/[0.04] text-slate-400 group-hover:text-white group-hover:scale-105"
                  }`}
                >
                  <IPin className="h-5 w-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-white text-[15px]">{c.name}</div>
                    {active === c.id && <Badge variant="primary" dot className="px-2 py-0.5">Faol</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 line-clamp-1">{c.address}</div>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <IUsers className="h-3.5 w-3.5 text-primary-400" /> {Number(c.students || 0)} faol talaba
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <IClock className="h-3.5 w-3.5" /> Ochiq (09:00 - 21:00)
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Yandex map visualization */}
        <Card className="relative overflow-hidden min-h-[540px] border-white/[0.08]">
          {yandexKey ? (
            <div ref={mapRef} className="absolute inset-0 bg-ink-950" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-880 via-ink-950 to-ink-900 p-6">
              <div className="max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 text-center">
                <IPin className="mx-auto h-10 w-10 text-primary-300" />
                <h3 className="mt-3 text-lg font-bold text-white">Yandex Map API key kiritilmagan</h3>
                <p className="mt-2 text-sm text-slate-400">
                  `.env` faylga `VITE_YANDEX_MAPS_API_KEY` qo‘shilganda markerlar real xaritada ko‘rinadi. Chapdagi markazlar ro‘yxati ishlashda davom etadi.
                </p>
              </div>
            </div>
          )}

          {/* Active Detail overlay on bottom of the map */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <Card glow className="relative overflow-hidden">
              <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <Badge variant="primary" dot className="mb-2.5">
                    Tanlangan filial tafsiloti
                  </Badge>
                  <div className="text-xl font-extrabold text-white tracking-tight">
                    {current?.name || "—"}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">{current?.address || "—"}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-400">
                      <IUsers className="h-4 w-4 text-primary-400" /> {Number(current?.students || 0)} faol talaba
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <IClock className="h-4 w-4" /> Darslar: 09:00 — 21:00
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <IChat className="h-4 w-4" /> Bog'lanish
                  </Button>
                  <Button variant="gradient" size="sm">Yo'nalish xaritasi</Button>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
}
