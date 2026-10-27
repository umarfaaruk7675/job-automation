// Starting list of companies with public job boards. Boards that stop
// responding are switched off automatically after repeated failures, and users
// can add more by pasting a careers link.
export const SEED_COMPANIES: { name: string; ats: "greenhouse" | "lever" | "ashby"; slug: string }[] = [
  { name: "Stripe", ats: "greenhouse", slug: "stripe" },
  { name: "Airbnb", ats: "greenhouse", slug: "airbnb" },
  { name: "Figma", ats: "greenhouse", slug: "figma" },
  { name: "Databricks", ats: "greenhouse", slug: "databricks" },
  { name: "Cloudflare", ats: "greenhouse", slug: "cloudflare" },
  { name: "GitLab", ats: "greenhouse", slug: "gitlab" },
  { name: "Dropbox", ats: "greenhouse", slug: "dropbox" },
  { name: "Discord", ats: "greenhouse", slug: "discord" },
  { name: "Reddit", ats: "greenhouse", slug: "reddit" },
  { name: "Postman", ats: "greenhouse", slug: "postman" },
  { name: "PhonePe", ats: "greenhouse", slug: "phonepe" },
  { name: "Groww", ats: "greenhouse", slug: "groww" },
  { name: "Palantir", ats: "lever", slug: "palantir" },
  { name: "Razorpay", ats: "lever", slug: "razorpay" },
  { name: "Meesho", ats: "lever", slug: "meesho" },
  { name: "CRED", ats: "lever", slug: "cred" },
  { name: "Zeta", ats: "lever", slug: "zeta" },
  { name: "OpenAI", ats: "ashby", slug: "openai" },
  { name: "Notion", ats: "ashby", slug: "notion" },
  { name: "Linear", ats: "ashby", slug: "linear" },
  { name: "Ramp", ats: "ashby", slug: "ramp" },
  { name: "Supabase", ats: "ashby", slug: "supabase" },
  { name: "Vercel", ats: "ashby", slug: "vercel" },
];
