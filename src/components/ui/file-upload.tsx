"use client";

/*
 * Resume drop zone, adapted from the 21st.dev "file-upload" component.
 * Changes from the original:
 * - Uses framer-motion `m` components so it works inside the app's LazyMotion provider.
 * - Accepts one resume (PDF or DOCX, up to 5 MB) instead of any file type.
 * - Replaces the simulated upload progress with a real type-and-size check,
 *   so the bar never claims an upload that didn't happen.
 * - Uses the app's design tokens and is keyboard-operable.
 */

import { useCallback, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CircleCheck, CloudUpload, FileText, Loader, Trash2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export type ResumeFile = { name: string; size: number; type: string; file: File };

type Props = {
  onReady?: (file: ResumeFile | null) => void;
  maxBytes?: number;
  className?: string;
};

const ACCEPTED: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};
const ACCEPT_ATTR = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeOf(file: File): string | null {
  if (ACCEPTED[file.type]) return ACCEPTED[file.type];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "docx") return "DOCX";
  return null;
}

export default function FileUpload({ onReady, maxBytes = 5 * 1024 * 1024, className }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeFile | null>(null);

  const accept = useCallback(
    (list: FileList | null) => {
      setError(null);
      const file = list?.[0];
      if (!file) return;
      if (list && list.length > 1) {
        setError("Add one resume at a time.");
        return;
      }
      const kind = typeOf(file);
      if (!kind) {
        setError(`${file.name} isn't a PDF or DOCX file. Save your resume in one of those formats and try again.`);
        return;
      }
      if (file.size > maxBytes) {
        setError(`${file.name} is ${formatFileSize(file.size)}. Resumes need to be ${formatFileSize(maxBytes)} or smaller.`);
        return;
      }
      setChecking(true);
      // A short beat so the check reads as a step; the check itself is instant.
      window.setTimeout(() => {
        const ready = { name: file.name, size: file.size, type: kind, file };
        setResume(ready);
        setChecking(false);
        onReady?.(ready);
      }, 600);
    },
    [maxBytes, onReady],
  );

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    accept(e.target.files);
    e.target.value = "";
  };

  const remove = () => {
    setResume(null);
    setError(null);
    onReady?.(null);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_ATTR}
        className="peer sr-only"
        onChange={onSelect}
        aria-describedby={`${inputId}-hint ${error ? `${inputId}-error` : ""}`}
      />
      <m.label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        initial={false}
        animate={{ scale: dragging ? 1.015 : 1 }}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group relative block cursor-pointer rounded-panel border-2 border-dashed bg-sheet px-6 py-10 text-center transition-colors md:px-10 md:py-14",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ink",
          dragging ? "border-sent bg-sent-soft" : "border-rule hover:border-ink/40",
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <m.span
            animate={dragging ? { y: [-4, 0, -4] } : { y: 0 }}
            transition={{ duration: 1.4, repeat: dragging ? Infinity : 0, ease: "easeInOut" }}
            className={cn(
              "grid h-14 w-14 place-items-center rounded-full transition-colors",
              dragging ? "bg-sheet text-sent" : "bg-paper text-ink group-hover:text-sent",
            )}
            aria-hidden
          >
            <CloudUpload className="h-7 w-7" />
          </m.span>
          <div className="space-y-1.5">
            <p className="text-h3 font-bold">
              {dragging ? "Drop your resume here" : resume ? "Replace your resume" : "Add your resume"}
            </p>
            <p className="text-muted">
              Drag it here, or <span className="font-semibold text-ink underline underline-offset-4">choose a file</span>
            </p>
            <p id={`${inputId}-hint`} className="text-sm text-muted">
              PDF or DOCX, up to {formatFileSize(maxBytes)}
            </p>
          </div>
        </div>
      </m.label>

      <div className="mt-4 min-h-[5.5rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {error && (
            <m.p
              key="error"
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2.5 rounded-control bg-hold-soft px-4 py-3 text-sm text-ink"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-hold" aria-hidden />
              {error}
            </m.p>
          )}

          {!error && (checking || resume) && (
            <m.div
              key={checking ? "checking" : resume?.name}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="flex items-center gap-4 rounded-control border border-rule bg-sheet px-4 py-3.5"
            >
              <span className="relative shrink-0" aria-hidden>
                <FileText className="h-9 w-9 text-muted" />
                {resume && !checking && (
                  <m.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -bottom-1 -right-1 rounded-full bg-sheet"
                  >
                    <CircleCheck className="h-4 w-4 text-sent" />
                  </m.span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                {checking ? (
                  <>
                    <p className="flex items-center gap-2 font-medium">
                      <Loader className="h-4 w-4 animate-spin text-muted" aria-hidden />
                      Checking file type and size
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                      <m.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: "8%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </>
                ) : (
                  resume && (
                    <>
                      <p className="truncate font-semibold" title={resume.name}>
                        {resume.name}
                      </p>
                      <p className="text-sm text-muted">
                        {resume.type}, {formatFileSize(resume.size)}. Ready to read.
                      </p>
                    </>
                  )
                )}
              </div>
              {resume && !checking && (
                <m.button
                  type="button"
                  onClick={remove}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-paper hover:text-ink"
                  aria-label={`Remove ${resume.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </m.button>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
