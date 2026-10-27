"use client";

import { m } from "framer-motion";

// Re-mounts on every route change, giving each page a short fade-in transition.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      {children}
    </m.div>
  );
}
