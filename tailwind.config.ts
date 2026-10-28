import type { Config } from "tailwindcss";

/*
 * Design tokens for Shortlist (working name). Warm cream (and dark brown) surfaces, black actions, clay accent, green for
 * "applied" and amber for "needs you", so colour always carries meaning.
 * Matches the landing page.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)", // page background
        sheet: "rgb(var(--sheet) / <alpha-value>)", // raised surfaces
        ink: "rgb(var(--ink) / <alpha-value>)", // primary text and primary buttons
        muted: "rgb(var(--muted) / <alpha-value>)", // secondary text
        rule: "rgb(var(--rule) / <alpha-value>)", // borders and dividers
        sand: "rgb(var(--sand) / <alpha-value>)", // soft panels
        clay: { DEFAULT: "rgb(var(--clay) / <alpha-value>)", ink: "rgb(var(--clay-ink) / <alpha-value>)", soft: "rgb(var(--clay-soft) / <alpha-value>)" }, // accent
        primary: { DEFAULT: "rgb(var(--primary) / <alpha-value>)", hover: "rgb(var(--primary-hover) / <alpha-value>)", fg: "rgb(var(--primary-fg) / <alpha-value>)" }, // actions
        glow: "rgb(var(--glow) / <alpha-value>)", // card highlights
        sent: { DEFAULT: "rgb(var(--sent) / <alpha-value>)", soft: "rgb(var(--sent-soft) / <alpha-value>)" }, // submitted, approved
        hold: { DEFAULT: "rgb(var(--hold) / <alpha-value>)", soft: "rgb(var(--hold-soft) / <alpha-value>)", line: "rgb(var(--hold-line) / <alpha-value>)" }, // waiting for the user
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans Variable'", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Modular scale, ratio ~1.25 from a 17px body.
        "body": ["1.0625rem", { lineHeight: "1.6" }],
        "lede": ["1.25rem", { lineHeight: "1.5" }],
        "h3": ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "h2": ["clamp(1.875rem, 3.2vw + 1rem, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display": ["clamp(2.5rem, 5vw + 1rem, 4.5rem)", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
      },
      maxWidth: {
        page: "72rem",
        prose: "36rem",
      },
      borderRadius: {
        // Two radii only: small for controls, larger for panels.
        control: "0.5rem",
        panel: "1rem",
      },
      boxShadow: {
        lift: "0 18px 40px -22px rgb(94 64 34 / 0.35)",
        glow: "0 0 0 1px rgb(var(--glow) / 0.35), 0 14px 40px -14px rgb(var(--glow) / 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
