"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CircleCheck, FileText, Loader } from "lucide-react";
import FileUpload, { formatFileSize, type ResumeFile } from "@/components/ui/file-upload";
import { getSupabase } from "@/lib/supabase/client";

export type StoredResume = { path: string; name: string; size: number; updatedAt: string | null };

type Status = { tone: "busy" | "done" | "error"; text: string } | null;

/** Shows the user's saved resume and uploads a new one to their private storage folder. */
export function ResumePanel({ userId, initial }: { userId: string; initial: StoredResume | null }) {
  const [current, setCurrent] = useState<StoredResume | null>(initial);
  const [status, setStatus] = useState<Status>(null);
  const [replacing, setReplacing] = useState(!initial);

  async function upload(file: ResumeFile | null) {
    if (!file) return;
    const supabase = getSupabase();
    if (!supabase) return setStatus({ tone: "error", text: "Uploads aren't connected yet." });

    setStatus({ tone: "busy", text: `Uploading ${file.name}` });
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${userId}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file.file, {
      contentType: file.file.type || undefined,
      upsert: false,
    });
    if (error) return setStatus({ tone: "error", text: `${file.name} wasn't uploaded: ${error.message}` });

    // Keep one resume: remove the previous file once the new one is safely stored.
    if (current) await supabase.storage.from("resumes").remove([current.path]);

    setCurrent({ path, name: file.name, size: file.size, updatedAt: new Date().toISOString() });
    setReplacing(false);
    setStatus({ tone: "done", text: `${file.name} is saved to your account.` });
  }

  return (
    <section aria-labelledby="resume-title" className="rounded-panel border border-rule bg-sheet p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="resume-title" className="text-h3 font-bold">
            Your resume
          </h2>
          <p className="mt-1 text-muted">We read it to build the profile your applications come from.</p>
        </div>
        {current && !replacing && (
          <button
            type="button"
            onClick={() => {
              setReplacing(true);
              setStatus(null);
            }}
            className="h-10 rounded-control border border-rule px-3 text-sm font-semibold transition-colors hover:border-ink"
          >
            Replace resume
          </button>
        )}
      </div>

      {current && !replacing && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-4 rounded-control border border-rule px-4 py-3.5"
        >
          <span className="relative shrink-0" aria-hidden>
            <FileText className="h-9 w-9 text-muted" />
            <CircleCheck className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-sheet text-sent" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{current.name}</p>
            <p className="text-sm text-muted">
              {formatFileSize(current.size)}
              {current.updatedAt && `, added ${new Date(current.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
            </p>
          </div>
        </m.div>
      )}

      {replacing && (
        <div className="mt-5">
          <FileUpload onReady={upload} />
          {current && (
            <button type="button" onClick={() => setReplacing(false)} className="text-sm font-semibold underline-offset-4 hover:underline">
              Keep {current.name}
            </button>
          )}
        </div>
      )}

      <div aria-live="polite">
        <AnimatePresence initial={false}>
          {status && (
            <m.p
              key={status.text}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={
                "mt-4 flex items-center gap-2 overflow-hidden rounded-control px-4 py-3 text-sm " +
                (status.tone === "error" ? "bg-hold-soft" : status.tone === "done" ? "bg-sent-soft" : "bg-paper")
              }
            >
              {status.tone === "busy" && <Loader className="h-4 w-4 animate-spin" aria-hidden />}
              {status.text}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
