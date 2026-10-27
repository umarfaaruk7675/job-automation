// All page copy lives here so it can be edited without touching components.
// "Shortlist" is a working name; change it in one place.

export const site = {
  name: "Shortlist",
  nav: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  primaryCta: { label: "Get started free", href: "/signup" },
  signIn: { label: "Log in", href: "/signin" },
  hero: {
    eyebrow: "AI job applications, with you in control",
    headline: "Apply to jobs that",
    typed: ["actually fit you.", "were posted this week.", "you'd sign your name to."],
    body:
      "Shortlist finds fresh jobs on company career pages, scores each one against your resume, tailors your resume using only what's true, and asks before anything is sent.",
    note: "Free while in beta. No card needed.",
  },
  features: [
    { icon: "radar", title: "Fresh jobs, every day", body: "Straight from company career pages on Greenhouse, Lever and Ashby. Only roles posted in the last 7 days, newest first." },
    { icon: "gauge", title: "A match score with reasons", body: "Every job gets a score out of 100 and plain-English reasons, so you know why it was picked." },
    { icon: "file", title: "Truthful resume tailoring", body: "Your resume is reworded for each job using only facts you've confirmed. No invented skills, ever." },
    { icon: "message", title: "It asks instead of guessing", body: "When a great job asks for something not on your profile, you get a yes/no question, not a made-up answer." },
    { icon: "check", title: "Proof for every application", body: "Track what you applied to, when, and with which resume. Get a receipt by email." },
    { icon: "shield", title: "Private by default", body: "Your resume sits in a private folder only you can open. No LinkedIn or Indeed bots, no account bans." },
  ],
  steps: [
    { title: "Add your resume", body: "We read it and build a profile you check and correct in a few minutes." },
    { title: "Review your matches", body: "Each morning, jobs above your match bar wait for you with reasons and any questions." },
    { title: "Approve and apply", body: "Download the tailored resume, apply on the company's page, and we track the rest." },
  ],
  faq: [
    { q: "Does Shortlist apply without asking me?", a: "No. Every application waits for your approval. Autopilot only becomes available after you've approved 10 applications yourself, and you can turn it off at any time." },
    { q: "Where do the jobs come from?", a: "From companies' own job boards on Greenhouse, Lever and Ashby, checked every day. You can also follow any company by pasting its careers link." },
    { q: "Will it add skills I don't have?", a: "No. Tailoring only rewords and reorders what's already in your confirmed profile. If a job needs something you haven't listed, we ask you first." },
    { q: "Do you use LinkedIn or Indeed?", a: "No. Their terms forbid bots, and automated applications there can get your account restricted. We work with company career pages instead." },
    { q: "What does it cost?", a: "It's free while in beta. If paid plans are added later, prices will be on this page and you'll be able to cancel any time." },
    { q: "Who can see my resume?", a: "Only you. It's stored in a private folder tied to your account, and it's never used to train AI models." },
  ],
} as const;
