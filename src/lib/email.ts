import "server-only";

/** Sends one email through Resend. Does nothing when no key is set. */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  const from = process.env.RESEND_FROM || "Shortlist <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) console.error("Resend error", res.status, (await res.text()).slice(0, 300));
  return res.ok;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function layout(title: string, body: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://job-automation-jet.vercel.app";
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#151515">
  <p style="font-weight:800;font-size:18px">Shortlist</p>
  <h1 style="font-size:20px">${esc(title)}</h1>
  ${body}
  <p style="margin-top:24px"><a href="${site}/dashboard" style="background:#151515;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open your dashboard</a></p>
  <p style="color:#68645c;font-size:12px;margin-top:24px">You get this because you use Shortlist. Turn these emails off in Settings.</p>
</div>`;
}

export { esc };
