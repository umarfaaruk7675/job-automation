"use client";

import { m } from "framer-motion";

// Re-mounts on every route change, giving each page a short entrance.
// It only moves; starting at opacity 0 would hide the whole page until
// JavaScript loads and delay Largest Contentful Paint.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      {children}
    </m.div>
  );
}
