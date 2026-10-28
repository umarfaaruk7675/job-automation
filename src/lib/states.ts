export const STATE_LABEL: Record<string, string> = {
  queued: "Applying",
  review: "Applying",
  hold: "Needs your answer",
  approved: "Finish on site",
  applied: "Applied",
  skipped: "Rejected by you",
  rejected: "Not selected",
  interview: "Interview",
  offer: "Offer",
  closed: "Closed",
};

export type Tone = "neutral" | "sent" | "hold" | "ink";

export const STATE_TONE: Record<string, Tone> = {
  queued: "ink",
  review: "ink",
  hold: "hold",
  approved: "ink",
  applied: "sent",
  interview: "sent",
  offer: "sent",
  skipped: "neutral",
  rejected: "neutral",
  closed: "neutral",
};

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
