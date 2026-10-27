// All page copy lives here so it can be edited without touching components.
// "Shortlist" is a working name; change it in one place.

export const site = {
  name: "Shortlist",
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  primaryCta: { label: "Get started free", href: "/signup" },
  signIn: { label: "Sign in", href: "/signin" },
  hero: {
    headline: "Job applications you'd sign your name to.",
    body:
      "Shortlist finds jobs posted this week on company career pages, tailors your resume to each one using only what you've confirmed, and sends nothing without your say.",
    secondaryCta: { label: "See how it works", href: "#how-it-works" },
    steps: [
      { title: "Add your resume", body: "We read it and turn it into a profile you check and correct." },
      { title: "Set your limits", body: "Choose where you want to work and the lowest match you'll accept." },
      { title: "Approve and track", body: "Fresh jobs arrive daily with a match score and reasons. You approve what gets sent." },
    ],
    note: "Free to start. No card needed.",
  },
} as const;
