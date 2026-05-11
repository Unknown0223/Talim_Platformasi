import { useMemo, useState } from "react";
import { Button, Card, Input, Badge } from "../components/ui";
import { ICheck, IStar } from "../components/icons";
import type { Page, Persona } from "../components/Layout";
import { auth } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function Login({
  onNavigate,
  setPersona,
}: {
  onNavigate: (p: Page) => void;
  setPersona: (p: Persona) => void;
}) {
  const { login: saveLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const personaFromRole = useMemo(() => {
    return (role?: string | null): Persona => {
      if (role === "teacher") return "ustoz";
      if (role === "admin") return "admin";
      if (role === "parent") return "ota-ona";
      if (role === "cashier") return "kassir";
      if (role === "receptionist") return "qabulxona";
      return "talaba";
    };
  }, []);

  const homePageForPersona = (persona: Persona): Page => {
    if (persona === "admin") return "admin";
    if (persona === "ustoz") return "teacher-dashboard";
    if (persona === "ota-ona") return "parent";
    if (persona === "kassir") return "cashier";
    if (persona === "qabulxona") return "reception";
    return "student-dashboard";
  };

  const loginAsDemo = async (email: string, persona: Persona, page: Page) => {
    setError("");
    setLoading(true);
    try {
      const { user, token } = await auth.login({ email, password: "password123" });
      saveLogin(user, token);
      setPersona(persona);
      onNavigate(page);
    } catch (err: any) {
      setError(err?.message || "Demo login xatosi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Xush kelibsiz! 👋"
      subtitle="Hisobingizga kiring va o'qishni davom ettiring"
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setLoading(true);
          try {
            const { user, token } = await auth.login({ email, password });
            saveLogin(user, token);
            const persona = personaFromRole(user.role || "student");
            setPersona(persona);
            onNavigate(homePageForPersona(persona));
          } catch (err: any) {
            setError(err?.message || "Login xatosi");
          } finally {
            setLoading(false);
          }
        }}
      >
        <Input
          label="Email yoki telefon"
          placeholder="siz@talim.uz"
          type="email"
          icon={<span className="text-base">✉</span>}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Parol"
          placeholder="••••••••"
          type="password"
          icon={<span className="text-base">🔒</span>}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-400">
            <input type="checkbox" className="accent-primary-500" />
            Eslab qolish
          </label>
          <button
            type="button"
            className="text-primary-400 hover:text-primary-300"
          >
            Parolni unutdingizmi?
          </button>
        </div>
        <Button variant="gradient" size="lg" className="w-full" type="submit" disabled={loading}>
          {loading ? "Kirilmoqda..." : "Kirish"}
        </Button>

        <div className="relative my-3 text-center text-[11px] uppercase tracking-wider text-slate-500">
          <span className="relative bg-ink-900/0 px-3">Yoki demo sifatida</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-white/[0.08]" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <DemoButton
            color="sky"
            emoji="👨‍🎓"
            label="Talaba"
            onClick={() => void loginAsDemo("student@talim.uz", "talaba", "student-dashboard")}
          />
          <DemoButton
            color="violet"
            emoji="👨‍🏫"
            label="Ustoz"
            onClick={() => void loginAsDemo("teacher@talim.uz", "ustoz", "teacher-dashboard")}
          />
          <DemoButton
            color="amber"
            emoji="⚙️"
            label="Admin"
            onClick={() => void loginAsDemo("admin@talim.uz", "admin", "admin")}
          />
        </div>

        <p className="text-center text-sm text-slate-400">
          Hisobingiz yo'qmi?{" "}
          <button
            type="button"
            onClick={() => onNavigate("register")}
            className="font-medium text-primary-400 hover:text-primary-300"
          >
            Ro'yxatdan o'ting
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

function DemoButton({
  color,
  emoji,
  label,
  onClick,
}: {
  color: "sky" | "violet" | "amber";
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  const colors = {
    sky: "border-sky-500/25 bg-sky-500/5 text-sky-300 hover:bg-sky-500/15",
    violet: "border-violet-500/25 bg-violet-500/5 text-violet-300 hover:bg-violet-500/15",
    amber: "border-amber-500/25 bg-amber-500/5 text-amber-300 hover:bg-amber-500/15",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border py-2.5 text-xs font-medium transition ${colors[color]}`}
    >
      <div className="text-lg transition-transform group-hover:scale-110">
        {emoji}
      </div>
      <div className="mt-0.5">{label}</div>
    </button>
  );
}

export function Register({
  onNavigate,
  setPersona,
}: {
  onNavigate: (p: Page) => void;
  setPersona: (p: Persona) => void;
}) {
  const [role, setRole] = useState<"talaba" | "ustoz" | "ota-ona">("talaba");
  const { login: saveLogin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <AuthShell
      title="Talim'ga qo'shiling"
      subtitle="Bepul hisob yarating va birinchi darsingizni boshlang"
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setLoading(true);
          try {
            const parts = fullName.trim().split(/\s+/);
            const firstName = parts[0] || "";
            const lastName = parts.slice(1).join(" ") || "-";
            const apiRole = role === "ustoz" ? "teacher" : role === "ota-ona" ? "parent" : "student";
            const { user, token } = await auth.register({
              firstName,
              lastName,
              birthDate,
              email,
              password,
              role: apiRole,
            });
            saveLogin(user, token);
            const persona: Persona = role;
            setPersona(persona);
            onNavigate(role === "ustoz" ? "teacher-dashboard" : role === "ota-ona" ? "parent" : "student-dashboard");
          } catch (err: any) {
            setError(err?.message || "Ro'yxatdan o'tishda xato");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <span className="mb-2 block text-[13px] font-medium text-slate-300">
            Rolingiz
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: "talaba", l: "Talaba", e: "🎓" },
                { v: "ustoz", l: "Ustoz", e: "👨‍🏫" },
                { v: "ota-ona", l: "Ota-ona", e: "👨‍👩‍👧" },
              ] as const
            ).map((r) => (
              <button
                type="button"
                key={r.v}
                onClick={() => setRole(r.v)}
                className={`relative rounded-xl border px-3 py-3.5 text-xs transition ${
                  role === r.v
                    ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                }`}
              >
                {role === r.v && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">
                    ✓
                  </span>
                )}
                <div className="text-xl">{r.e}</div>
                <div className="mt-1 font-medium">{r.l}</div>
              </button>
            ))}
          </div>
        </div>
        <Input label="To'liq ism" placeholder="Akmal Botirov" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Email" placeholder="siz@talim.uz" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Tug'ilgan sana" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <Input
          label="Parol"
          placeholder="Kamida 8 belgi"
          type="password"
          hint="Katta harf, raqam va belgi bo'lsin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-400">
          <input type="checkbox" className="mt-0.5 accent-primary-500" />
          <span>
            <a className="text-primary-400 hover:text-primary-300">Foydalanish shartlari</a>{" "}
            va{" "}
            <a className="text-primary-400 hover:text-primary-300">maxfiylik siyosati</a>
            ga roziman
          </span>
        </label>
        <Button variant="gradient" size="lg" className="w-full" type="submit" disabled={loading}>
          {loading ? "Yaratilmoqda..." : "Hisob yaratish"}
        </Button>
        <p className="text-center text-sm text-slate-400">
          Hisobingiz bormi?{" "}
          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="font-medium text-primary-400 hover:text-primary-300"
          >
            Kirish
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10">
        <div className="hero-glow absolute inset-x-0 top-0 h-[600px]" />
        <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>
      <div className="relative mx-auto grid min-h-[calc(100vh-128px)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left side */}
        <div className="hidden lg:block">
          <Badge variant="primary" className="mb-5" dot>
            Talim — yangi avlod LMS
          </Badge>
          <h2 className="text-4xl font-bold leading-tight text-white">
            Bilim — bu eng yaxshi{" "}
            <span className="text-gradient">sarmoya</span>
          </h2>
          <p className="mt-4 text-slate-400">
            12 400+ talaba, 240+ ustoz va 180 kurs sizni kutmoqda.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              { e: "🎓", t: "Onlayn va oflayn kurslar" },
              { e: "🏆", t: "Quiz Battle, trivia, mehmon testi" },
              { e: "📚", t: "PDF kutubxona — 100+ kitob" },
              { e: "📊", t: "Davomat va ota-ona paneli" },
            ].map((x) => (
              <div
                key={x.t}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/10 text-base">
                  {x.e}
                </div>
                <span className="text-sm text-slate-200">{x.t}</span>
                <ICheck className="ml-auto h-4 w-4 text-emerald-400" />
              </div>
            ))}
          </div>

          {/* Mini stats */}
          <Card className="mt-6 p-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["AB", "MA", "SK", "NQ"].map((i, k) => (
                  <div
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink-900 bg-gradient-to-br text-[10px] font-bold text-white ${
                      ["from-blue-500 to-indigo-600", "from-rose-500 to-red-600", "from-emerald-500 to-teal-600", "from-violet-500 to-purple-600"][k]
                    }`}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IStar key={i} className="h-3 w-3 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-semibold text-white">4.9/5</span>
                </div>
                <p className="text-[11px] text-slate-500">12 400+ baxtli foydalanuvchi</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right side */}
        <Card glow className="p-7 sm:p-9">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 mb-6 text-sm text-slate-400">{subtitle}</p>
          {children}
        </Card>
      </div>
    </div>
  );
}
