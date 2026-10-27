"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import FileUpload, { type ResumeFile } from "@/components/ui/file-upload";
import { Button, ChoiceGroup, Select, TagInput, TextArea, TextInput, Toggle } from "@/components/ui/form";
import { completeOnboarding, parseStoredResume, saveStep } from "@/app/actions/onboarding";
import { addCompany } from "@/app/actions/app";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import type { EducationItem, ExperienceItem, Profile, ProjectItem, ResumeData } from "@/lib/types";
import { COUNTRIES, CURRENCIES, LEVELS, NOTICE, ROLE_SUGGESTIONS, STEPS, WORK_MODES } from "./constants";

type Props = { userId: string; profile: Profile; resume: ResumeData; aiEnabled: boolean; hasResumeFile: boolean; editing?: boolean };

const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function OnboardingWizard({ userId, profile: initialProfile, resume: initialResume, aiEnabled, hasResumeFile, editing }: Props) {
  const [step, setStep] = useState(editing ? 1 : Math.min(initialProfile.onboarding_step ?? 0, STEPS.length - 1));
  const [savedNote, setSavedNote] = useState(false);
  const [dir, setDir] = useState(1);
  const [p, setP] = useState<Profile>(initialProfile);
  const [r, setR] = useState<ResumeData>(initialResume);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [finishing, startFinishing] = useTransition();

  const setProfile = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const setResume = (patch: Partial<ResumeData>) => setR((x) => ({ ...x, ...patch }));

  function validate(): string | null {
    const key = STEPS[step].key;
    if (key === "about" && !p.full_name?.trim()) return "Enter your full name.";
    if (key === "about" && !p.country) return "Choose the country you live in.";
    if (key === "experience" && r.experience.some((e) => !e.title.trim() || !e.company.trim())) return "Each role needs a job title and a company.";
    if (key === "skills" && r.skills.length < 3) return "Add at least 3 skills so we can match you.";
    if (key === "preferences" && p.target_roles.length === 0) return "Add at least one role you're looking for.";
    if (key === "preferences" && p.work_modes.length === 0) return "Choose at least one way of working.";
    return null;
  }

  function go(delta: number) {
    setError(null);
    if (delta > 0) {
      const problem = validate();
      if (problem) return setError(problem);
    }
    const nextStep = Math.max(0, Math.min(STEPS.length - 1, step + delta));
    startSaving(async () => {
      if (delta > 0) {
        const res = await saveStep(nextStep, profileFields(p), resumeFields(r));
        if (!res.ok) return setError(res.error);
      }
      setDir(delta);
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <Progress step={step} onJump={(i) => i < step && (setDir(-1), setStep(i))} />

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <m.div
          key={current.key}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          {current.key === "resume" && (
            <ResumeStep userId={userId} aiEnabled={aiEnabled} hasResumeFile={hasResumeFile} resume={r}
              onParsed={(data) => {
                setResume(data);
                setProfile({
                  full_name: p.full_name || data.full_name || null,
                  phone: p.phone || data.phone || null,
                  city: p.city || data.city || null,
                  country: p.country || data.country || null,
                  headline: p.headline || data.headline || null,
                });
              }}
              onNext={() => go(1)}
            />
          )}
          {current.key === "about" && <AboutStep p={p} set={setProfile} />}
          {current.key === "experience" && <ExperienceStep p={p} set={setProfile} r={r} setR={setResume} />}
          {current.key === "skills" && <SkillsStep r={r} setR={setResume} />}
          {current.key === "preferences" && <PreferencesStep p={p} set={setProfile} />}
          {current.key === "matching" && <MatchingStep p={p} set={setProfile} />}
          {current.key === "review" && <ReviewStep p={p} r={r} onEdit={(i) => (setDir(-1), setStep(i))} />}
        </m.div>
      </AnimatePresence>

      <AnimatePresence>
        {savedNote && current.key === "review" && (
          <m.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="mt-6 rounded-control bg-sent-soft px-4 py-3 text-sm">
            Saved. New matches will use your updated profile.
          </m.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error && (
          <m.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-6 rounded-control bg-hold-soft px-4 py-3 text-sm"
          >
            {error}
          </m.p>
        )}
      </AnimatePresence>

      {current.key !== "resume" && (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-rule pt-6">
          <Button variant="secondary" onClick={() => go(-1)} disabled={saving || finishing}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </Button>
          {current.key === "review" ? (
            <Button
              busy={finishing}
              onClick={() =>
                startFinishing(async () => {
                  const res = await saveStep(step, profileFields(p), resumeFields(r));
                  if (!res.ok) return setError(res.error);
                  if (editing) {
                    setSavedNote(true);
                    return;
                  }
                  await completeOnboarding();
                })
              }
            >
              {editing ? "Save changes" : "Confirm and start matching"} <Check className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button busy={saving} onClick={() => go(1)}>
              Save and continue <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function profileFields(p: Profile) {
  const { id, email, onboarding_completed_at, onboarding_step, ...rest } = p;
  void id; void email; void onboarding_completed_at; void onboarding_step;
  return rest;
}
function resumeFields(r: ResumeData) {
  return { summary: r.summary, skills: r.skills, experience: r.experience, education: r.education, projects: r.projects, certifications: r.certifications, links: r.links };
}

function Progress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  const pct = (step / (STEPS.length - 1)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="text-sm text-muted">Saved as you go</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-rule/70">
        <m.div className="h-full rounded-full bg-ink" initial={false} animate={{ width: `${Math.max(4, pct)}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <ol className="mt-3 hidden gap-1 sm:flex">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex-1">
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={i >= step}
              className={cn("w-full text-left text-xs font-semibold transition-colors", i === step ? "text-ink" : i < step ? "text-muted hover:text-ink" : "text-muted/50")}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-h2 font-extrabold">{title}</h1>
      <p className="mt-2 max-w-prose text-muted">{body}</p>
    </div>
  );
}

/* ---------------- Step 1: resume ---------------- */

function ResumeStep({
  userId,
  aiEnabled,
  hasResumeFile,
  resume,
  onParsed,
  onNext,
}: {
  userId: string;
  aiEnabled: boolean;
  hasResumeFile: boolean;
  resume: ResumeData;
  onParsed: (d: ResumeData) => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "uploading" | "reading" | "done">(hasResumeFile ? "done" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  async function handle(file: ResumeFile | null) {
    if (!file) return;
    setFailed(null);
    const supabase = getSupabase();
    if (!supabase) return setFailed("Uploads aren't connected yet.");
    setPhase("uploading");
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_").slice(-80)}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file.file, { contentType: file.file.type || undefined });
    if (error) {
      setPhase("idle");
      return setFailed(`The file wasn't uploaded: ${error.message}`);
    }
    setPhase("reading");
    const res = await parseStoredResume(path, file.name);
    if (!res.ok) {
      setPhase("idle");
      return setFailed(res.error);
    }
    onParsed(res.data);
    setPhase("done");
    const roles = res.data.experience.length;
    const skills = res.data.skills.length;
    setMessage(
      res.method === "ai"
        ? `We found ${roles} role${roles === 1 ? "" : "s"} and ${skills} skill${skills === 1 ? "" : "s"}. You'll check everything on the next steps.`
        : `We saved your resume and picked up your contact details. Add your roles and skills on the next steps.`,
    );
  }

  const counts = `${resume.experience.length} roles, ${resume.skills.length} skills on file`;

  return (
    <div>
      <StepHeader
        title="Start with your resume"
        body="We read it to fill in your profile, so you mostly check and correct instead of typing. It stays private to your account."
      />

      {phase === "done" ? (
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-panel border border-rule bg-sheet p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sent-soft text-sent" aria-hidden>
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Resume saved</p>
              <p className="mt-1 text-muted">{message ?? counts}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={onNext}>
              Check my details <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="secondary" onClick={() => setPhase("idle")}>
              Use a different file
            </Button>
          </div>
        </m.div>
      ) : phase === "idle" ? (
        <>
          <FileUpload onReady={handle} />
          {!aiEnabled && (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Automatic reading turns on once the Gemini key is added. Until then we save the file and pick up your contact details.
            </p>
          )}
          {failed && <p role="alert" className="mt-3 rounded-control bg-hold-soft px-4 py-3 text-sm">{failed}</p>}
          <div className="mt-8 rounded-panel border border-dashed border-rule p-5">
            <p className="font-semibold">No resume yet?</p>
            <p className="mt-1 text-muted">Answer a few questions instead and we'll build a clean, ATS-friendly resume from them.</p>
            <Button variant="secondary" className="mt-4" onClick={onNext}>
              Build my profile by hand
            </Button>
          </div>
        </>
      ) : (
        <Working phase={phase} />
      )}
    </div>
  );
}

function Working({ phase }: { phase: "uploading" | "reading" }) {
  const lines = phase === "uploading" ? ["Uploading your file"] : ["Reading your resume", "Finding your roles and dates", "Collecting your skills"];
  return (
    <div className="rounded-panel border border-rule bg-sheet p-8" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" aria-hidden />
        <p className="font-semibold">{phase === "uploading" ? "Uploading" : "Reading your resume"}</p>
      </div>
      <ul className="mt-5 space-y-2">
        {lines.map((l, i) => (
          <m.li key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }} className="text-muted">
            {l}
          </m.li>
        ))}
      </ul>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-paper">
        <m.div className="h-full w-1/3 rounded-full bg-ink" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    </div>
  );
}

/* ---------------- Step 2: about ---------------- */

function AboutStep({ p, set }: { p: Profile; set: (x: Partial<Profile>) => void }) {
  return (
    <div>
      <StepHeader title="About you" body="These go at the top of your resume and into application forms." />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label="Full name" value={p.full_name ?? ""} onChange={(e) => set({ full_name: e.target.value })} autoComplete="name" />
        <TextInput label="Phone" hint="Include the country code." value={p.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" />
        <Select label="Country you live in" value={p.country ?? ""} onChange={(e) => set({ country: e.target.value })}
          options={[{ value: "", label: "Choose a country" }, ...COUNTRIES.map((c) => ({ value: c, label: c }))]} />
        <TextInput label="City" value={p.city ?? ""} onChange={(e) => set({ city: e.target.value })} autoComplete="address-level2" />
        <TextInput className="sm:col-span-2" label="Headline" hint="One line about you, for example: Data analyst focused on dashboards and SQL." value={p.headline ?? ""} onChange={(e) => set({ headline: e.target.value })} maxLength={140} />
      </div>
    </div>
  );
}

/* ---------------- Step 3: experience ---------------- */

const emptyRole: ExperienceItem = { title: "", company: "", location: "", start: "", end: "", current: false, bullets: [] };

function ExperienceStep({ p, set, r, setR }: { p: Profile; set: (x: Partial<Profile>) => void; r: ResumeData; setR: (x: Partial<ResumeData>) => void }) {
  const update = (i: number, patch: Partial<ExperienceItem>) => setR({ experience: r.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  return (
    <div>
      <StepHeader title="Your experience" body="Check each role. Tailored resumes only ever use what's here, so it's worth getting right." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Experience level" value={p.experience_level ?? ""} onChange={(e) => set({ experience_level: e.target.value || null })}
          options={[{ value: "", label: "Choose one" }, ...LEVELS.map((l) => ({ value: l.value, label: l.label }))]} />
        <TextInput label="Years of experience" type="number" min={0} max={50} step={0.5} value={p.years_experience ?? ""}
          onChange={(e) => set({ years_experience: e.target.value === "" ? null : Number(e.target.value) })} />
      </div>

      <div className="mt-8 space-y-4">
        <AnimatePresence initial={false}>
          {r.experience.map((e, i) => (
            <m.div key={i} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-panel border border-rule bg-sheet p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">{e.title || "New role"}{e.company ? `, ${e.company}` : ""}</p>
                <button type="button" onClick={() => setR({ experience: r.experience.filter((_, j) => j !== i) })}
                  className="grid h-9 w-9 place-items-center rounded-control text-muted hover:bg-paper hover:text-ink" aria-label={`Remove ${e.title || "this role"}`}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Job title" value={e.title} onChange={(ev) => update(i, { title: ev.target.value })} />
                <TextInput label="Company" value={e.company} onChange={(ev) => update(i, { company: ev.target.value })} />
                <TextInput label="Start" placeholder="2023-06" value={e.start ?? ""} onChange={(ev) => update(i, { start: ev.target.value })} />
                <TextInput label="End" placeholder="2024-12" value={e.current ? "" : e.end ?? ""} disabled={e.current} onChange={(ev) => update(i, { end: ev.target.value })} />
                <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                  <input type="checkbox" checked={Boolean(e.current)} onChange={(ev) => update(i, { current: ev.target.checked })} className="h-4 w-4 accent-[rgb(var(--ink))]" />
                  I work here now
                </label>
                <TextArea className="sm:col-span-2" label="What you did" hint="One achievement per line. Keep numbers exact."
                  value={e.bullets.join("\n")} onChange={(ev) => update(i, { bullets: ev.target.value.split("\n") })}
                  onBlur={() => update(i, { bullets: e.bullets.map((b) => b.trim()).filter(Boolean) })} rows={4} />
              </div>
            </m.div>
          ))}
        </AnimatePresence>
        <Button variant="secondary" onClick={() => setR({ experience: [...r.experience, { ...emptyRole }] })}>
          <Plus className="h-4 w-4" aria-hidden /> Add a role
        </Button>
        {r.experience.length === 0 && <p className="text-sm text-muted">No work experience yet? That's fine. Add internships or skip this step, and put projects on the next step.</p>}
      </div>
    </div>
  );
}

/* ---------------- Step 4: skills, education, projects ---------------- */

function SkillsStep({ r, setR }: { r: ResumeData; setR: (x: Partial<ResumeData>) => void }) {
  const updEdu = (i: number, patch: Partial<EducationItem>) => setR({ education: r.education.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const updProj = (i: number, patch: Partial<ProjectItem>) => setR({ projects: r.projects.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  return (
    <div className="space-y-8">
      <StepHeader title="Skills and education" body="Skills drive matching. List the tools and abilities you'd be happy to be asked about in an interview." />
      <TagInput label="Skills" value={r.skills} onChange={(skills) => setR({ skills })} placeholder="SQL, Python, Figma…" max={40} />
      <TextArea label="Summary" hint="Two or three sentences. We'll adapt it for each job using only these facts." value={r.summary} onChange={(e) => setR({ summary: e.target.value })} rows={3} />

      <section>
        <h2 className="text-h3 font-bold">Education</h2>
        <div className="mt-4 space-y-4">
          {r.education.map((e, i) => (
            <div key={i} className="grid gap-4 rounded-panel border border-rule bg-sheet p-5 sm:grid-cols-2">
              <TextInput label="Degree" value={e.degree} onChange={(ev) => updEdu(i, { degree: ev.target.value })} placeholder="B.Tech" />
              <TextInput label="Field" value={e.field ?? ""} onChange={(ev) => updEdu(i, { field: ev.target.value })} placeholder="Computer Science" />
              <TextInput label="College or university" value={e.institution} onChange={(ev) => updEdu(i, { institution: ev.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <TextInput label="Year finished" value={e.end ?? ""} onChange={(ev) => updEdu(i, { end: ev.target.value })} placeholder="2024" />
                <TextInput label="Grade" value={e.grade ?? ""} onChange={(ev) => updEdu(i, { grade: ev.target.value })} placeholder="8.2 CGPA" />
              </div>
              <button type="button" className="justify-self-start text-sm font-semibold text-muted hover:text-ink sm:col-span-2" onClick={() => setR({ education: r.education.filter((_, j) => j !== i) })}>
                Remove
              </button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setR({ education: [...r.education, { degree: "", institution: "" }] })}>
            <Plus className="h-4 w-4" aria-hidden /> Add education
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-h3 font-bold">Projects</h2>
        <p className="mt-1 text-muted">Especially useful if you're early in your career.</p>
        <div className="mt-4 space-y-4">
          {r.projects.map((pr, i) => (
            <div key={i} className="grid gap-4 rounded-panel border border-rule bg-sheet p-5">
              <TextInput label="Project name" value={pr.name} onChange={(ev) => updProj(i, { name: ev.target.value })} />
              <TextArea label="What it does and what you built" value={pr.description ?? ""} onChange={(ev) => updProj(i, { description: ev.target.value })} rows={2} />
              <button type="button" className="justify-self-start text-sm font-semibold text-muted hover:text-ink" onClick={() => setR({ projects: r.projects.filter((_, j) => j !== i) })}>
                Remove
              </button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setR({ projects: [...r.projects, { name: "" }] })}>
            <Plus className="h-4 w-4" aria-hidden /> Add a project
          </Button>
        </div>
      </section>

      <TagInput label="Certifications" value={r.certifications.map((c) => c.name)} onChange={(names) => setR({ certifications: names.map((name) => r.certifications.find((c) => c.name === name) ?? { name }) })} placeholder="AWS Cloud Practitioner" max={15} />

      <div className="grid gap-5 sm:grid-cols-3">
        <TextInput label="LinkedIn" value={r.links.linkedin ?? ""} onChange={(e) => setR({ links: { ...r.links, linkedin: e.target.value } })} placeholder="linkedin.com/in/you" />
        <TextInput label="GitHub" value={r.links.github ?? ""} onChange={(e) => setR({ links: { ...r.links, github: e.target.value } })} placeholder="github.com/you" />
        <TextInput label="Portfolio" value={r.links.portfolio ?? ""} onChange={(e) => setR({ links: { ...r.links, portfolio: e.target.value } })} placeholder="yoursite.com" />
      </div>
    </div>
  );
}

/* ---------------- Step 5: preferences ---------------- */

function PreferencesStep({ p, set }: { p: Profile; set: (x: Partial<Profile>) => void }) {
  return (
    <div className="space-y-7">
      <StepHeader title="What you're looking for" body="We only show jobs that fit these. You can change them any time." />
      <TagInput label="Roles you want" value={p.target_roles} onChange={(target_roles) => set({ target_roles })} placeholder="Data Analyst" max={8} suggestions={ROLE_SUGGESTIONS} hint="Job titles, up to 8." />
      <ChoiceGroup label="How you want to work" multiple options={[...WORK_MODES]} value={p.work_modes as ("remote" | "hybrid" | "onsite")[]} onChange={(work_modes) => set({ work_modes })} />
      <TagInput label="Cities you'd work in" value={p.preferred_locations} onChange={(preferred_locations) => set({ preferred_locations })} placeholder="Bengaluru, Hyderabad" max={10} hint="Leave empty to use your city. Remote jobs are included if you chose Remote." />
      <ChoiceGroup label="Open to relocating?" options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
        value={p.willing_to_relocate == null ? [] : [p.willing_to_relocate ? "yes" : "no"]} onChange={([v]) => set({ willing_to_relocate: v === "yes" })} />
      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        <TextInput label="Expected yearly salary" hint="Used only to filter jobs and answer forms. Never shown to employers unless a form asks." type="number" min={0} value={p.expected_salary ?? ""}
          onChange={(e) => set({ expected_salary: e.target.value === "" ? null : Number(e.target.value) })} placeholder="1200000" />
        <Select label="Currency" value={p.salary_currency ?? "INR"} onChange={(e) => set({ salary_currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      </div>
      <Select label="When could you start?" value={p.notice_period ?? ""} onChange={(e) => set({ notice_period: e.target.value || null })} options={NOTICE} />
      <ChoiceGroup label="Do you need visa sponsorship to work in the countries you're applying to?" hint="We use your answer exactly as given on application forms."
        options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]}
        value={p.needs_sponsorship == null ? [] : [p.needs_sponsorship ? "yes" : "no"]} onChange={([v]) => set({ needs_sponsorship: v === "yes" })} />
      <TagInput label="Countries you're allowed to work in" value={p.authorized_countries} onChange={(authorized_countries) => set({ authorized_countries })} placeholder="India" max={10} suggestions={p.country && p.country !== "Other" ? [p.country] : []} />
    </div>
  );
}

/* ---------------- Step 6: matching ---------------- */

function MatchingStep({ p, set }: { p: Profile; set: (x: Partial<Profile>) => void }) {
  const [url, setUrl] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <div className="space-y-8">
      <StepHeader title="How matching works for you" body="You stay in control. Every application waits for your approval until you choose otherwise." />

      <div className="rounded-panel border border-rule bg-sheet p-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="threshold" className="font-semibold">Lowest match to show</label>
          <m.span key={p.match_threshold} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-h3 font-extrabold tabular-nums">
            {p.match_threshold}%
          </m.span>
        </div>
        <input id="threshold" type="range" min={50} max={95} step={5} value={p.match_threshold} onChange={(e) => set({ match_threshold: Number(e.target.value) })} className="mt-3 w-full accent-[rgb(var(--ink))]" />
        <p className="mt-2 text-sm text-muted">80% is a good start. Lower it to see more jobs; raise it to see fewer, closer fits.</p>
      </div>

      <div className="rounded-panel border border-rule bg-sheet p-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="daily" className="font-semibold">Most new jobs per day</label>
          <span className="text-h3 font-extrabold tabular-nums">{p.daily_limit}</span>
        </div>
        <input id="daily" type="range" min={1} max={25} value={p.daily_limit} onChange={(e) => set({ daily_limit: Number(e.target.value) })} className="mt-3 w-full accent-[rgb(var(--ink))]" />
        <p className="mt-2 text-sm text-muted">Fewer, better applications get more replies than many generic ones.</p>
      </div>

      <div className="rounded-panel border border-rule bg-sheet p-5">
        <p className="font-semibold">Review each application</p>
        <p className="mt-1 text-muted">On. You'll approve every application before it goes out. Autopilot becomes available after you've approved 10.</p>
      </div>

      <div className="rounded-panel border border-rule bg-sheet p-5">
        <Toggle label="Email me when jobs are waiting" hint="One email a day at most." checked={p.digest_emails} onChange={(digest_emails) => set({ digest_emails })} />
      </div>

      <div>
        <h2 className="text-h3 font-bold">Companies to follow</h2>
        <p className="mt-1 text-muted">Paste a careers link from a company you'd love to work at. Greenhouse, Lever and Ashby job boards work today.</p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!url.trim()) return;
            start(async () => {
              const res = await addCompany(url);
              if (res.ok) {
                setAdded((a) => [...a, res.name!]);
                setUrl("");
                setMsg(res.existed ? `${res.name} was already on our list.` : `Following ${res.name}.`);
              } else setMsg(res.error ?? "That didn't work.");
            });
          }}
        >
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://jobs.lever.co/company" aria-label="Careers link"
            className="w-full rounded-control border border-rule bg-sheet px-3.5 py-2.5 focus:border-ink focus:outline-none" />
          <Button type="submit" variant="secondary" busy={busy} className="shrink-0">Follow</Button>
        </form>
        {msg && <p className="mt-2 text-sm text-muted" aria-live="polite">{msg}</p>}
        {added.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {added.map((n) => (
              <span key={n} className="rounded-full bg-sent-soft px-3 py-1 text-sm font-semibold text-sent">{n}</span>
            ))}
          </div>
        )}
      </div>

      <TagInput label="Companies to skip" value={p.excluded_companies} onChange={(excluded_companies) => set({ excluded_companies })} placeholder="Your current employer" max={20} />
    </div>
  );
}

/* ---------------- Step 7: review ---------------- */

function ReviewStep({ p, r, onEdit }: { p: Profile; r: ResumeData; onEdit: (step: number) => void }) {
  const rows: { step: number; title: string; lines: string[] }[] = [
    { step: 1, title: "About you", lines: [p.full_name ?? "", [p.city, p.country].filter(Boolean).join(", "), p.phone ?? "", p.headline ?? ""].filter(Boolean) },
    { step: 2, title: "Experience", lines: r.experience.length ? r.experience.map((e) => `${e.title}, ${e.company}`) : ["No roles added"] },
    { step: 3, title: "Skills and education", lines: [r.skills.slice(0, 12).join(", ") + (r.skills.length > 12 ? ` and ${r.skills.length - 12} more` : ""), ...r.education.map((e) => `${e.degree}${e.field ? ` in ${e.field}` : ""}, ${e.institution}`)].filter(Boolean) },
    { step: 4, title: "Looking for", lines: [p.target_roles.join(", "), p.work_modes.join(", "), p.preferred_locations.join(", "), p.needs_sponsorship == null ? "" : p.needs_sponsorship ? "Needs sponsorship" : "No sponsorship needed"].filter(Boolean) },
    { step: 5, title: "Matching", lines: [`Show jobs at ${p.match_threshold}% or more`, `Up to ${p.daily_limit} new jobs a day`, "You review every application"] },
  ];
  return (
    <div>
      <StepHeader title="Check and confirm" body="This is the profile every application is built from. Nothing goes to an employer without your approval." />
      <div className="space-y-3">
        {rows.map((row, i) => (
          <m.div key={row.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start justify-between gap-4 rounded-panel border border-rule bg-sheet p-5">
            <div className="min-w-0">
              <p className="font-semibold">{row.title}</p>
              {row.lines.map((l) => (
                <p key={l} className="mt-1 break-words text-muted">{l}</p>
              ))}
            </div>
            <button type="button" onClick={() => onEdit(row.step)} className="inline-flex shrink-0 items-center gap-1.5 rounded-control px-2.5 py-1.5 text-sm font-semibold hover:bg-paper">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
            </button>
          </m.div>
        ))}
      </div>
    </div>
  );
}
