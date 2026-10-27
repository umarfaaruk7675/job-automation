export const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "Ireland", "Netherlands",
  "Singapore", "United Arab Emirates", "France", "Spain", "Sweden", "New Zealand", "Japan", "Other",
];

export const CURRENCIES = ["INR", "USD", "GBP", "EUR", "CAD", "AUD", "SGD", "AED"];

export const LEVELS = [
  { value: "intern", label: "Intern" },
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead or manager" },
  { value: "executive", label: "Director and above" },
] as const;

export const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

export const NOTICE = [
  { value: "", label: "Choose one" },
  { value: "immediate", label: "Immediately" },
  { value: "15 days", label: "Within 15 days" },
  { value: "30 days", label: "Within 30 days" },
  { value: "60 days", label: "Within 60 days" },
  { value: "90 days", label: "Within 90 days" },
];

export const ROLE_SUGGESTIONS = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Analyst",
  "Data Scientist", "Machine Learning Engineer", "Product Manager", "Product Designer", "DevOps Engineer",
  "QA Engineer", "Business Analyst",
];

export const STEPS = [
  { key: "resume", title: "Resume" },
  { key: "about", title: "About you" },
  { key: "experience", title: "Experience" },
  { key: "skills", title: "Skills and education" },
  { key: "preferences", title: "Job preferences" },
  { key: "matching", title: "Matching" },
  { key: "review", title: "Review" },
] as const;
