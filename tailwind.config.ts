import type { Config } from "tailwindcss";

/*
 * Design tokens for Shortlist (working name).
 * Concept: a job application you can sign your name to. The palette borrows
 * from paperwork — plain paper, dark ink, a green "sent" stamp and an amber
 * "needs you" flag — so colour always carries meaning, never decoration.
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
        sent: { DEFAULT: "rgb(var(--sent) / <alpha-value>)", soft: "rgb(var(--sent-soft) / <alpha-value>)" }, // submitted, approved
        hold: { DEFAULT: "rgb(var(--hold) / <alpha-value>)", soft: "rgb(var(--hold-soft) / <alpha-value>)" }, // waiting for the user
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
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
        lift: "0 1px 0 rgb(var(--rule)), 0 12px 32px -16px rgb(22 33 29 / 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
