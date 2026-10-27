// All page copy lives here so it can be edited without touching components.
// "Shortlist" is a working name; change it in one place.

export const site = {
  name: "Shortlist",
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  primaryCta: { label: "Upload your resume", href: "#start" },
  signIn: { label: "Sign in", href: "/signin" },
  hero: {
    headline: "Job applications you'd sign your name to.",
    body:
      "Shortlist finds jobs posted this week on company career pages, tailors your resume to each one using only what you've confirmed, and sends nothing without your say.",
    secondaryCta: { label: "See how it works", href: "#how-it-works" },
    note: "Free to start. No card needed.",
  },
} as const;
