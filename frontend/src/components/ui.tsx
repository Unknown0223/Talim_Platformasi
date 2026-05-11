import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

/* ==================== Button ==================== */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "soft" | "danger" | "gradient";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 whitespace-nowrap cursor-pointer";
  const sizes = {
    sm: "h-9 px-3.5 text-[13px]",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-[15px]",
    icon: "h-10 w-10",
  };
  const variants = {
    primary:
      "bg-primary-500 text-white hover:bg-primary-600 shadow-[0_8px_24px_-8px_rgba(53,99,255,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(53,99,255,0.8)]",
    gradient:
      "bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(139,92,246,0.8)]",
    ghost:
      "text-slate-300 hover:text-white hover:bg-white/[0.06]",
    outline:
      "border border-white/10 text-slate-200 hover:bg-white/[0.04] hover:border-white/20",
    soft: "bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 border border-white/[0.06]",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-[0_8px_24px_-8px_rgba(244,63,94,0.6)]",
  };
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ==================== Card (Har bir kurs yoki bo'lim uchun aylanuvchi ramka effekti qo'shildi) ==================== */
export function Card({
  className,
  children,
  glow = false,
  glowColor,
  hover = false,
}: {
  className?: string;
  children: ReactNode;
  glow?: boolean;
  glowColor?: "primary" | "amber";
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl",
        // Kursor borganda aylanuvchi chiziqli border animatsiyasi
        hover ? "glow-card-animated" : glow && (glowColor === "amber" ? "glow-border glow-border-amber" : "glow-border"),
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ==================== Badge ==================== */
type BadgeProps = {
  children: ReactNode;
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "talaba"
    | "ustoz"
    | "admin"
    | "outline";
  className?: string;
  dot?: boolean;
};

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-white/[0.05] text-slate-300 border-white/10",
    primary: "bg-primary-500/12 text-primary-300 border-primary-500/25",
    success: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
    warning: "bg-amber-500/12 text-amber-300 border-amber-500/25",
    danger: "bg-rose-500/12 text-rose-300 border-rose-500/25",
    talaba: "bg-sky-500/12 text-sky-300 border-sky-500/25",
    ustoz: "bg-violet-500/12 text-violet-300 border-violet-500/25",
    admin: "bg-amber-500/12 text-amber-300 border-amber-500/25",
    outline: "bg-transparent text-slate-300 border-white/15",
  };
  const dotColors: Record<string, string> = {
    default: "bg-slate-400",
    primary: "bg-primary-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    talaba: "bg-sky-400",
    ustoz: "bg-violet-400",
    admin: "bg-amber-400",
    outline: "bg-slate-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        variants[variant],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}

/* ==================== Input ==================== */
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  error?: string;
};

export function Input({ label, hint, icon, trailing, error, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">
          {label}
        </span>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={cn(
            "w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:bg-white/[0.05] focus:outline-none focus:ring-4",
            error
              ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-white/10 focus:border-primary-500/60 focus:ring-primary-500/15",
            icon && "pl-11",
            trailing && "pr-11",
            className,
          )}
        />
        {trailing && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            {trailing}
          </span>
        )}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </label>
  );
}

/* ==================== Modal ==================== */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  // Body scrollni qulflash + Esc bilan yopish
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      style={{ minHeight: "100dvh" }}
    >
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md animate-fade-in dark:bg-ink-950/85"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl animate-fade-in",
          "dark:bg-ink-900",
          widths[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
            <h3 className="truncate text-lg font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer"
              aria-label="Yopish"
            >
              ✕
            </button>
          </div>
        )}
        <div className={cn("flex-1 overflow-y-auto", title ? "px-6 py-5" : "p-6")}>{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Portal — Modal'ni document.body'ga ko'chiramiz; bu Layout ichidagi
  // har qanday transform/relative parent ta'siridan ozod qiladi va viewport
  // markazida ishonchli markazlashtirishni kafolatlaydi.
  if (typeof document === "undefined") return modalContent;
  return createPortal(modalContent, document.body);
}

/* ==================== Empty state ==================== */
export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] py-16 text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-3xl">
        {icon}
      </div>
      <h4 className="text-base font-bold text-slate-200">{title}</h4>
      {description && (
        <p className="mt-1 max-w-sm px-4 text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ==================== Name + animatsiyali emoji (Telegram Premium-style) ==================== */
export const NAME_EMOJI_ANIMATIONS = [
  { value: "pulse",     label: "Pulse",     hint: "Yumshoq nafas" },
  { value: "bounce",    label: "Bounce",    hint: "Sakrash" },
  { value: "spin",      label: "Spin",      hint: "Aylanish" },
  { value: "wave",      label: "Wave",      hint: "Salom (chayqaladi)" },
  { value: "float",     label: "Float",     hint: "Suzuvchi" },
  { value: "glow",      label: "Glow",      hint: "Yorqin shu'la" },
  { value: "shake",     label: "Shake",     hint: "Silkinish" },
  { value: "flip",      label: "Flip",      hint: "Aylantirish" },
  { value: "heartbeat", label: "Heartbeat", hint: "Yurak urishi" },
  { value: "rainbow",   label: "Rainbow",   hint: "Rangin" },
  { value: "none",      label: "Statik",    hint: "Animatsiyasiz" },
] as const;

export type NameEmojiAnim = typeof NAME_EMOJI_ANIMATIONS[number]["value"];

export const POPULAR_NAME_EMOJIS = [
  "⭐", "✨", "🌟", "💫", "🔥", "💎", "👑", "🏆", "🥇", "🎯",
  "🚀", "⚡", "💜", "❤️", "💙", "💚", "🩵", "💖", "🦄", "🌈",
  "🎨", "🎵", "🎮", "📚", "🧠", "💡", "🌙", "☀️", "🍀", "🌹",
  "🐉", "🦁", "🦅", "🐺", "🐱", "🐶", "🦊", "🐼", "🐧", "🦋",
  "🍎", "🍒", "🍓", "🥑", "🌶️", "🍕", "🍔", "🍦", "🍩", "🧋",
];

export function NameEmoji({
  emoji,
  anim = "pulse",
  className,
}: {
  emoji?: string | null;
  anim?: NameEmojiAnim | null | string;
  className?: string;
}) {
  if (!emoji) return null;
  const animClass = anim && anim !== "none" ? `name-emoji-${anim}` : "";
  return (
    <span
      className={cn("name-emoji ml-1 inline-block", animClass, className)}
      role="img"
      aria-label="name-emoji"
    >
      {emoji}
    </span>
  );
}

export function NameWithEmoji({
  name,
  emoji,
  anim = "pulse",
  className,
}: {
  name: string;
  emoji?: string | null;
  anim?: NameEmojiAnim | null | string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline", className)}>
      <span className="truncate">{name}</span>
      <NameEmoji emoji={emoji} anim={anim} />
    </span>
  );
}

/* ==================== Avatar (Haqiqiy rasm va fallback bilan) ==================== */
export function Avatar({
  initials,
  color = "from-primary-500 to-violet-600",
  size = "md",
  online,
  ring = false,
  imageUrl,
}: {
  initials: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  ring?: boolean;
  imageUrl?: string;
}) {
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };
  return (
    <div className="relative inline-block shrink-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={initials}
          className={cn(
            "rounded-full object-cover shadow-lg",
            sizes[size],
            ring && "ring-2 ring-white/20 ring-offset-2 ring-offset-ink-950",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-lg",
            color,
            sizes[size],
            ring && "ring-2 ring-white/10 ring-offset-2 ring-offset-ink-950",
          )}
        >
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-ink-950">
          <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-400" />
        </span>
      )}
    </div>
  );
}

/* ==================== Progress ==================== */
export function Progress({
  value,
  color = "from-primary-500 to-accent-500",
  size = "md",
}: {
  value: number;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-1", md: "h-1.5", lg: "h-2" };
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-white/5", sizes[size])}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ==================== Section header ==================== */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col",
      )}
    >
      <div>
        {eyebrow && (
          <Badge variant="primary" dot className="mb-3">
            {eyebrow}
          </Badge>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ==================== Tabs ==================== */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  size?: "sm" | "md";
}) {
  const sizes = { sm: "h-9 text-[13px] px-3", md: "h-10 text-sm px-4" };
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative rounded-lg font-semibold transition cursor-pointer",
            sizes[size],
            value === o.value
              ? "bg-white/[0.08] text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ==================== Stat ring ==================== */
export function Ring({
  value,
  size = 64,
  stroke = 6,
  color = "#3563ff",
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-white">{value}%</span>
        {label && <span className="text-[9px] text-slate-500">{label}</span>}
      </div>
    </div>
  );
}

/* ==================== Star rating ==================== */
type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  showValue?: boolean;
  className?: string;
};

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const interactive = !readOnly && typeof onChange === "function";
  const display = hover || value;

  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, idx) => {
        const i = idx + 1;
        const filled = i <= Math.floor(display);
        const half = !filled && i - 0.5 <= display;
        const Star = (
          <svg
            viewBox="0 0 24 24"
            className={cn(
              sizes[size],
              "transition-transform duration-150",
              interactive && "hover:scale-110",
            )}
          >
            <defs>
              <linearGradient id={`star-half-${i}-${idx}`} x1="0" x2="100%" y1="0" y2="0">
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5l2.95 6.36 6.95.79-5.2 4.78 1.5 6.83L12 17.77 5.8 21.26l1.5-6.83L2.1 9.65l6.95-.79L12 2.5z"
              fill={filled ? "#fbbf24" : half ? `url(#star-half-${i}-${idx})` : "rgba(255,255,255,0.10)"}
              stroke={filled || half ? "#f59e0b" : "rgba(255,255,255,0.18)"}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          </svg>
        );
        if (!interactive) {
          return (
            <span key={i} aria-hidden>
              {Star}
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i} yulduz`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            onClick={() => onChange?.(i)}
            className="cursor-pointer rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          >
            {Star}
          </button>
        );
      })}
      {showValue ? (
        <span className="ml-1 text-xs font-semibold text-amber-300">
          {Number(value || 0).toFixed(1)}
          <span className="text-slate-500"> / {max}</span>
        </span>
      ) : null}
    </div>
  );
}
