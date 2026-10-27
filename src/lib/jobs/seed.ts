// Starting list of companies with public job boards, weighted towards
// employers hiring in India. Boards that stop responding are switched off
// automatically after repeated failures, and users can add more by pasting a
// careers link.
type Seed = { name: string; ats: "greenhouse" | "lever" | "ashby" | "workable" | "smartrecruiters" | "recruitee"; slug: string };

export const SEED_COMPANIES: Seed[] = [
  // Greenhouse
  { name: "Stripe", ats: "greenhouse", slug: "stripe" },
  { name: "Airbnb", ats: "greenhouse", slug: "airbnb" },
  { name: "Figma", ats: "greenhouse", slug: "figma" },
  { name: "Databricks", ats: "greenhouse", slug: "databricks" },
  { name: "Cloudflare", ats: "greenhouse", slug: "cloudflare" },
  { name: "GitLab", ats: "greenhouse", slug: "gitlab" },
  { name: "Dropbox", ats: "greenhouse", slug: "dropbox" },
  { name: "Discord", ats: "greenhouse", slug: "discord" },
  { name: "Reddit", ats: "greenhouse", slug: "reddit" },
  { name: "Groww", ats: "greenhouse", slug: "groww" },
  { name: "Coinbase", ats: "greenhouse", slug: "coinbase" },
  { name: "Okta", ats: "greenhouse", slug: "okta" },
  { name: "MongoDB", ats: "greenhouse", slug: "mongodb" },
  { name: "Elastic", ats: "greenhouse", slug: "elastic" },
  { name: "Twilio", ats: "greenhouse", slug: "twilio" },
  { name: "Samsara", ats: "greenhouse", slug: "samsara" },
  { name: "Toast", ats: "greenhouse", slug: "toast" },
  { name: "Druva", ats: "greenhouse", slug: "druva" },
  { name: "InMobi", ats: "greenhouse", slug: "inmobi" },
  { name: "Sprinklr", ats: "greenhouse", slug: "sprinklr" },
  { name: "Nutanix", ats: "greenhouse", slug: "nutanix" },
  { name: "Rubrik", ats: "greenhouse", slug: "rubrik" },
  { name: "Gojek", ats: "greenhouse", slug: "gojek" },
  // Lever
  { name: "Palantir", ats: "lever", slug: "palantir" },
  { name: "Meesho", ats: "lever", slug: "meesho" },
  { name: "CRED", ats: "lever", slug: "cred" },
  { name: "Zeta", ats: "lever", slug: "zeta" },
  { name: "Swiggy", ats: "lever", slug: "swiggy" },
  { name: "Paytm", ats: "lever", slug: "paytm" },
  { name: "Dream11", ats: "lever", slug: "dreamsports" },
  { name: "upGrad", ats: "lever", slug: "upgrad" },
  { name: "Atlassian", ats: "lever", slug: "atlassian" },
  { name: "Canva", ats: "lever", slug: "canva" },
  { name: "Spotify", ats: "lever", slug: "spotify" },
  { name: "Mindtickle", ats: "lever", slug: "mindtickle" },
  { name: "Hevo Data", ats: "lever", slug: "hevodata" },
  // Ashby
  { name: "OpenAI", ats: "ashby", slug: "openai" },
  { name: "Notion", ats: "ashby", slug: "notion" },
  { name: "Linear", ats: "ashby", slug: "linear" },
  { name: "Ramp", ats: "ashby", slug: "ramp" },
  { name: "Supabase", ats: "ashby", slug: "supabase" },
  { name: "Zepto", ats: "ashby", slug: "zepto" },
  { name: "Sarvam AI", ats: "ashby", slug: "sarvam" },
  { name: "Deel", ats: "ashby", slug: "deel" },
  // SmartRecruiters
  { name: "Visa", ats: "smartrecruiters", slug: "Visa" },
  { name: "Bosch", ats: "smartrecruiters", slug: "BoschGroup" },
  { name: "ServiceNow", ats: "smartrecruiters", slug: "ServiceNow" },
  { name: "Freshworks", ats: "smartrecruiters", slug: "Freshworks" },
  { name: "Wipro", ats: "smartrecruiters", slug: "Wipro" },
  // Workable and Recruitee
  { name: "Hugging Face", ats: "workable", slug: "huggingface" },
  { name: "Workable", ats: "workable", slug: "workable" },
  { name: "Recruitee", ats: "recruitee", slug: "recruitee" },
];
