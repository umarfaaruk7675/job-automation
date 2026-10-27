"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-control border border-rule bg-sheet px-3.5 py-2.5 text-ink placeholder:text-muted/70 transition-colors focus:border-ink focus:outline-none focus-visible:outline-none";

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-hold">{error}</p> : hint ? <p className="mt-1.5 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={id}>
      <input id={id} {...props} className={cn(control, error && "border-hold")} aria-invalid={error ? true : undefined} />
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} className={className} htmlFor={id}>
      <textarea id={id} {...props} className={cn(control, "min-h-[6rem] resize-y leading-relaxed")} />
    </Field>
  );
}

export function Select({
  label,
  hint,
  options,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} className={className} htmlFor={id}>
      <select id={id} {...props} className={cn(control, "appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9")}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2356655e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** A set of pill buttons; single or multiple choice. */
export function ChoiceGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  multiple,
}: {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  multiple?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <m.button
              key={o.value}
              type="button"
              aria-pressed={on}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o.value) : [...value, o.value]) : [o.value])}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                on ? "border-ink bg-ink text-paper" : "border-rule bg-sheet hover:border-ink",
              )}
            >
              {o.label}
            </m.button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </fieldset>
  );
}

/** Free-text tags: type and press Enter or comma. */
export function TagInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  max = 40,
  suggestions = [],
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
  suggestions?: string[];
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.length < max) next.push(p);
    onChange(next);
    setDraft("");
  };
  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 8);
  return (
    <Field label={label} hint={hint ?? `Press Enter after each one. Up to ${max}.`} htmlFor={id}>
      <div className="flex min-h-[2.875rem] flex-wrap items-center gap-1.5 rounded-control border border-rule bg-sheet px-2 py-1.5 transition-colors focus-within:border-ink">
        <AnimatePresence initial={false}>
          {value.map((v) => (
            <m.span
              key={v}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 rounded-full bg-paper py-1 pl-3 pr-1 text-sm font-medium"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-rule hover:text-ink"
                aria-label={`Remove ${v}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </m.span>
          ))}
        </AnimatePresence>
        <input
          id={id}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 outline-none placeholder:text-muted/70"
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-rule px-2.5 py-1 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-sent" : "bg-rule")}
      >
        <m.span
          className="absolute top-1 h-5 w-5 rounded-full bg-sheet shadow"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </button>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  busy,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={cn(
        "relative inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 font-semibold transition-[background-color,border-color,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-ink text-paper hover:bg-sent",
        variant === "secondary" && "border border-rule bg-sheet hover:border-ink",
        variant === "ghost" && "text-muted hover:bg-paper hover:text-ink",
        className,
      )}
    >
      {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}
