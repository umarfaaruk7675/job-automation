"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, m } from "framer-motion";
import { addCompany, saveSettings } from "@/app/actions/app";
import { Button, TagInput, Toggle } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile, followed: initialFollowed }: { profile: Profile; followed: string[] }) {
  const [threshold, setThreshold] = useState(profile.match_threshold);
  const [daily, setDaily] = useState(profile.daily_limit);
  const [digest, setDigest] = useState(profile.digest_emails);
  const [excluded, setExcluded] = useState(profile.excluded_companies ?? []);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  const [url, setUrl] = useState("");
  const [followed, setFollowed] = useState(initialFollowed);
  const [followMsg, setFollowMsg] = useState<string | null>(null);
  const [following, startFollow] = useTransition();

  const save = () =>
    start(async () => {
      const res = await saveSettings({ match_threshold: threshold, daily_limit: daily, digest_emails: digest, excluded_companies: excluded });
      setStatus(res.ok ? { ok: true, text: "Settings saved." } : { ok: false, text: res.error ?? "That didn't save." });
    });

  return (
    <div className="space-y-5">
      <section className="rounded-panel border border-rule bg-sheet p-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="th" className="font-semibold">Lowest match to apply to</label>
          <span className="text-h3 font-extrabold tabular-nums">{threshold}%</span>
        </div>
        <input id="th" type="range" min={50} max={95} step={5} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="mt-3 w-full accent-[rgb(var(--primary))]" />
      </section>

      <section className="rounded-panel border border-rule bg-sheet p-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="dl" className="font-semibold">Most new jobs per day</label>
          <span className="text-h3 font-extrabold tabular-nums">{daily}</span>
        </div>
        <input id="dl" type="range" min={1} max={25} value={daily} onChange={(e) => setDaily(Number(e.target.value))} className="mt-3 w-full accent-[rgb(var(--primary))]" />
      </section>

      <section className="rounded-panel border border-rule bg-sheet p-5">
        <p className="font-semibold">Applying</p>
        <p className="mt-1 text-sm text-muted">The AI applies to every job at or above your match bar. It stops and asks you only when something the job needs is missing from your profile. Those jobs wait in Applications, under Needs your answer.</p>
      </section>

      <section className="rounded-panel border border-rule bg-sheet p-5">
        <Toggle label="Daily email" hint="A summary when jobs are waiting, and a receipt when you apply." checked={digest} onChange={setDigest} />
      </section>

      <section className="rounded-panel border border-rule bg-sheet p-5">
        <TagInput label="Companies to skip" value={excluded} onChange={setExcluded} placeholder="Company name" max={20} />
      </section>

      <div className="flex items-center gap-4">
        <Button busy={busy} onClick={save}>Save settings</Button>
        <AnimatePresence>
          {status && (
            <m.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={cn("text-sm", status.ok ? "text-sent" : "text-hold")} role="status">
              {status.text}
            </m.p>
          )}
        </AnimatePresence>
      </div>

      <section className="rounded-panel border border-rule bg-sheet p-5">
        <p className="font-semibold">Companies you follow</p>
        <p className="mt-1 text-sm text-muted">Paste a Greenhouse, Lever or Ashby careers link. We check it every day.</p>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => {
          e.preventDefault();
          startFollow(async () => {
            const r = await addCompany(url);
            setFollowMsg(r.ok ? (r.existed ? `${r.name} is already on our list.` : `Following ${r.name}.`) : r.error ?? "That didn't work.");
            if (r.ok && r.name) { setFollowed((f) => Array.from(new Set([r.name!, ...f]))); setUrl(""); }
          });
        }}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://boards.greenhouse.io/company" aria-label="Careers link" className="w-full rounded-control border border-rule bg-sheet px-3.5 py-2.5 focus:border-ink focus:outline-none" />
          <Button type="submit" variant="secondary" busy={following}>Follow</Button>
        </form>
        {followMsg && <p className="mt-2 text-sm text-muted">{followMsg}</p>}
        {followed.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{followed.map((n) => <span key={n} className="rounded-full bg-sand px-3 py-1 text-sm font-medium">{n}</span>)}</div>}
      </section>
    </div>
  );
}
