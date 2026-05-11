import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  show: (input: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => string;
  success: (message: string, opts?: { title?: string; duration?: number }) => string;
  error: (message: string, opts?: { title?: string; duration?: number }) => string;
  info: (message: string, opts?: { title?: string; duration?: number }) => string;
  warning: (message: string, opts?: { title?: string; duration?: number }) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // SSR yoki provider'sigizdan tashqari chaqirilsa — sokin no-op
    const noop = (msg: string) => {
      if (typeof console !== "undefined") console.info("[toast]", msg);
      return "";
    };
    return {
      show: noop as any,
      success: noop,
      error: noop,
      info: noop,
      warning: noop,
      dismiss: () => {},
    } satisfies ToastContextValue;
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timersRef.current.get(id);
    if (tm) {
      window.clearTimeout(tm);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback<ToastContextValue["show"]>(
    (input) => {
      const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = input.duration ?? 3500;
      const item: ToastItem = {
        id,
        title: input.title,
        message: input.message,
        variant: input.variant ?? "info",
        duration,
      };
      setToasts((prev) => [...prev, item].slice(-5));
      if (duration > 0) {
        const tm = window.setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, tm);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback<ToastContextValue["success"]>(
    (message, opts) => show({ message, variant: "success", ...opts }),
    [show],
  );
  const error = useCallback<ToastContextValue["error"]>(
    (message, opts) => show({ message, variant: "error", duration: 5000, ...opts }),
    [show],
  );
  const info = useCallback<ToastContextValue["info"]>(
    (message, opts) => show({ message, variant: "info", ...opts }),
    [show],
  );
  const warning = useCallback<ToastContextValue["warning"]>(
    (message, opts) => show({ message, variant: "warning", ...opts }),
    [show],
  );

  useEffect(() => {
    const ref = timersRef;
    return () => {
      ref.current.forEach((tm) => window.clearTimeout(tm));
      ref.current.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ show, success, error, info, warning, dismiss }),
    [show, success, error, info, warning, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: string; bg: string; iconBg: string }> = {
  success: {
    ring: "ring-emerald-500/30",
    icon: "✓",
    bg: "from-emerald-500/15 to-teal-500/5",
    iconBg: "bg-emerald-500/20 text-emerald-300",
  },
  error: {
    ring: "ring-rose-500/30",
    icon: "!",
    bg: "from-rose-500/15 to-pink-500/5",
    iconBg: "bg-rose-500/20 text-rose-300",
  },
  info: {
    ring: "ring-primary-500/30",
    icon: "i",
    bg: "from-primary-500/15 to-accent-500/5",
    iconBg: "bg-primary-500/20 text-primary-200",
  },
  warning: {
    ring: "ring-amber-500/30",
    icon: "⚠",
    bg: "from-amber-500/15 to-orange-500/5",
    iconBg: "bg-amber-500/20 text-amber-300",
  },
};

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[1100] flex flex-col items-center gap-2.5 px-3 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:px-0"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const v = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${v.bg} bg-ink-900 shadow-2xl ring-1 ${v.ring} animate-toast-in`}
            role="status"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${v.iconBg}`}
              >
                {v.icon}
              </div>
              <div className="min-w-0 flex-1">
                {t.title ? (
                  <div className="text-sm font-semibold text-white">{t.title}</div>
                ) : null}
                <div className={`text-[13px] leading-snug ${t.title ? "mt-0.5 text-slate-300" : "text-white"}`}>
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>
            {t.duration > 0 ? (
              <div className="h-0.5 w-full overflow-hidden bg-white/[0.04]">
                <div
                  className="h-full origin-left bg-gradient-to-r from-primary-500 to-accent-500 animate-toast-bar"
                  style={{ animationDuration: `${t.duration}ms` }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
