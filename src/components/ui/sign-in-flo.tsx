"use client";

/*
 * Sign-up and sign-in card, adapted from the 21st.dev "sign-in-flo" component.
 * Changes from the original:
 * - One component for both pages via a `mode` prop; each mode has its own URL.
 * - Labels are tied to their inputs, errors are announced, and fields autocomplete.
 * - GitHub, Twitter and LinkedIn are replaced by Google, the only social sign-in
 *   the app supports. "Remember me" is removed because sessions persist anyway.
 * - The particle canvas stops on unmount, pauses in hidden tabs and is off for
 *   people who prefer reduced motion.
 * - Submits to Supabase Auth when it is configured.
 */

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { cn } from "@/lib/cn";

type Mode = "signup" | "signin";

type FieldProps = {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  autoComplete: string;
  invalid?: boolean;
  toggle?: { shown: boolean; onToggle: () => void };
};

function AnimatedFormField({ label, type, value, onChange, icon, autoComplete, invalid, toggle }: FieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-control border bg-sheet transition-colors duration-200",
        invalid ? "border-hold" : "border-rule focus-within:border-ink",
      )}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-ink"
        aria-hidden
      >
        {icon}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={invalid || undefined}
        className="peer w-full bg-transparent pb-2 pl-10 pr-12 pt-6 text-ink outline-none"
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-10 right-12 truncate transition-all duration-200",
          raised ? "top-2 text-xs font-semibold text-ink" : "top-1/2 -translate-y-1/2 text-muted",
        )}
      >
        {label}
      </label>
      {toggle && (
        <button
          type="button"
          onClick={toggle.onToggle}
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-control text-muted transition-colors hover:text-ink"
          aria-label={toggle.shown ? "Hide password" : "Show password"}
          aria-pressed={toggle.shown}
        >
          {toggle.shown ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      )}
      {hovering && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(200px circle at ${pos.x}px ${pos.y}px, rgb(var(--sent) / 0.08), transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}

function FloatingParticles() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;
    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      a: Math.random() * 0.25 + 0.05,
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w(), h());
      for (const d of dots) {
        d.x = (d.x + d.vx + w()) % w();
        d.y = (d.y + d.vy + h()) % h();
        ctx.fillStyle = `rgba(29, 115, 73, ${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    // Start after first paint so the particles never compete with loading.
    const start = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 1200);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden />;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

type Status = { tone: "error" | "info"; text: string } | null;

// Loaded on first use so the auth SDK isn't in the page's initial JavaScript.
async function loadSupabase() {
  const { getSupabase } = await import("@/lib/supabase/client");
  return getSupabase();
}

const COPY = {
  signup: {
    title: "Create your account",
    body: "Free to start. You'll confirm your profile before anything is sent.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/signin",
  },
  signin: {
    title: "Sign in",
    body: "Pick up where you left off.",
    submit: "Sign in",
    switchText: "New to Shortlist?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
} as const;

export function Component({ mode = "signup" }: { mode?: Mode }) {
  const copy = COPY[mode];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [tried, setTried] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const passwordOk = mode === "signin" ? password.length > 0 : password.length >= 8;
  const nameOk = mode === "signin" || name.trim().length > 0;

  const notConfigured = () =>
    setStatus({ tone: "error", text: "Sign-in isn't connected yet. Add the Supabase keys to .env.local to turn it on." });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setStatus(null);
    if (!nameOk || !emailOk || !passwordOk) {
      setStatus({
        tone: "error",
        text: !nameOk
          ? "Enter your full name."
          : !emailOk
            ? "Enter an email address like name@example.com."
            : mode === "signup"
              ? "Use a password of at least 8 characters."
              : "Enter your password.",
      });
      return;
    }
    const supabase = await loadSupabase();
    if (!supabase) return notConfigured();

    setSubmitting(true);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/` },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) return setStatus({ tone: "error", text: error.message });
    setStatus({
      tone: "info",
      text: mode === "signup" ? `Check ${email} for a link to confirm your account.` : "Signed in.",
    });
  }

  async function google() {
    const supabase = await loadSupabase();
    if (!supabase) return notConfigured();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) setStatus({ tone: "error", text: error.message });
  }

  async function resetPassword() {
    if (!emailOk) {
      setTried(true);
      return setStatus({ tone: "error", text: "Enter your email address first, then choose Forgot password." });
    }
    const supabase = await loadSupabase();
    if (!supabase) return notConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/signin` });
    setStatus(error ? { tone: "error", text: error.message } : { tone: "info", text: `Check ${email} for a reset link.` });
  }

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-paper px-4 py-12">
      <FloatingParticles />

      <m.div
        // Moves in but never starts invisible, because the heading is the LCP element.
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <path d="M3 3h11l5 5v11H3z" fill="rgb(var(--ink))" />
            <path d="M14 3v5h5" fill="rgb(var(--paper))" />
            <path d="M7 12.5l2.6 2.6L15 9.7" fill="none" stroke="rgb(var(--paper))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Shortlist
        </Link>

        <div className="rounded-panel border border-rule bg-sheet/90 p-6 shadow-lift backdrop-blur-xl sm:p-8">
          <div className="mb-7 text-center">
            <span className="mb-4 inline-grid h-14 w-14 place-items-center rounded-full bg-sent-soft text-sent" aria-hidden>
              <User className="h-7 w-7" />
            </span>
            <h1 className="text-h2 font-extrabold">{copy.title}</h1>
            <p className="mt-2 text-muted">{copy.body}</p>
          </div>

          <m.button
            type="button"
            onClick={google}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-control border border-rule bg-sheet font-semibold transition-colors hover:border-ink"
          >
            <GoogleMark />
            Continue with Google
          </m.button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-rule" />
            </div>
            <p className="relative mx-auto w-fit bg-sheet px-3 text-sm text-muted">or use your email</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === "signup" && (
              <AnimatedFormField
                label="Full name"
                type="text"
                value={name}
                onChange={setName}
                autoComplete="name"
                icon={<User size={18} />}
                invalid={tried && !nameOk}
              />
            )}
            <AnimatedFormField
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              icon={<Mail size={18} />}
              invalid={tried && !emailOk}
            />
            <AnimatedFormField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              icon={<Lock size={18} />}
              invalid={tried && !passwordOk}
              toggle={{ shown: showPassword, onToggle: () => setShowPassword((v) => !v) }}
            />

            {mode === "signup" && <p className="-mt-2 px-1 text-sm text-muted">Use 8 or more characters.</p>}

            {mode === "signin" && (
              <div className="flex justify-end">
                <button type="button" onClick={resetPassword} className="text-sm font-semibold underline-offset-4 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <div aria-live="polite" className="min-h-0">
              <AnimatePresence initial={false}>
                {status && (
                  <m.p
                    key={status.text}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "overflow-hidden rounded-control px-4 py-3 text-sm",
                      status.tone === "error" ? "bg-hold-soft text-ink" : "bg-sent-soft text-ink",
                    )}
                  >
                    {status.text}
                  </m.p>
                )}
              </AnimatePresence>
            </div>

            <m.button
              type="submit"
              disabled={submitting}
              whileHover={submitting ? undefined : { y: -1 }}
              whileTap={submitting ? undefined : { scale: 0.98 }}
              className="group relative h-12 w-full overflow-hidden rounded-control bg-ink font-semibold text-paper transition-colors hover:bg-sent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={cn("transition-opacity", submitting && "opacity-0")}>{copy.submit}</span>
              {submitting && (
                <span className="absolute inset-0 grid place-items-center" aria-label="Working">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
                </span>
              )}
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full"
              />
            </m.button>
          </form>

          {mode === "signup" && (
            <p className="mt-5 text-center text-xs text-muted">
              By creating an account you agree to the Terms and the Privacy Policy.
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {copy.switchText}{" "}
            <Link href={copy.switchHref} className="font-semibold text-ink underline-offset-4 hover:underline">
              {copy.switchLabel}
            </Link>
          </p>
        </div>
      </m.div>
    </div>
  );
}
