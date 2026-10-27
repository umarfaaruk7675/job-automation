// Shapes shared by the UI, server actions and the database's JSON columns.

export type ExperienceItem = {
  title: string;
  company: string;
  location?: string;
  start?: string; // "2022-06" or free text
  end?: string;
  current?: boolean;
  bullets: string[];
};

export type EducationItem = {
  degree: string;
  field?: string;
  institution: string;
  start?: string;
  end?: string;
  grade?: string;
};

export type ProjectItem = { name: string; description?: string; tech?: string[]; link?: string };
export type CertificationItem = { name: string; issuer?: string; year?: string };

export type ResumeData = {
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  headline?: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  links: { linkedin?: string; github?: string; portfolio?: string };
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  target_roles: string[];
  experience_level: string | null;
  years_experience: number | null;
  work_modes: string[];
  preferred_locations: string[];
  willing_to_relocate: boolean | null;
  expected_salary: number | null;
  salary_currency: string | null;
  notice_period: string | null;
  needs_sponsorship: boolean | null;
  authorized_countries: string[];
  excluded_companies: string[];
  match_threshold: number;
  daily_limit: number;
  submission_mode: "review" | "autopilot";
  digest_emails: boolean;
  onboarding_step: number;
  onboarding_completed_at: string | null;
};

export type Gap = { skill: string; question: string };

export type TailoredResume = {
  summary: string;
  skills: string[];
  experience: { title: string; company: string; bullets: string[] }[];
  changes: string[]; // human-readable list of what changed
};

export const EMPTY_RESUME: ResumeData = {
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  links: {},
};
