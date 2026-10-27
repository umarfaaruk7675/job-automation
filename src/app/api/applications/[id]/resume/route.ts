import { NextResponse, type NextRequest } from "next/server";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { createClient } from "@/lib/supabase/server";
import type { ResumeData, TailoredResume } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Downloads the tailored resume for one application as an ATS-friendly DOCX. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const [{ data: app }, { data: resume }, { data: profile }] = await Promise.all([
    supabase.from("applications").select("tailored, jobs(title, companies(name))").eq("id", Number(params.id)).eq("user_id", userId).single(),
    supabase.from("resume_profiles").select("*").eq("user_id", userId).single(),
    supabase.from("profiles").select("full_name, email, phone, city, country").eq("id", userId).single(),
  ]);
  if (!app || !resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const r = resume as unknown as ResumeData;
  const t = (app.tailored as TailoredResume | null) ?? { summary: r.summary, skills: r.skills, experience: r.experience, changes: [] };
  const job = app.jobs as unknown as { title: string; companies: { name: string } | null };

  const font = "Calibri";
  const text = (s: string, o: { bold?: boolean; size?: number } = {}) => new TextRun({ text: s, font, bold: o.bold, size: o.size ?? 21 });
  const heading = (s: string) =>
    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [text(s.toUpperCase(), { bold: true, size: 22 })] });

  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [text(profile?.full_name ?? "", { bold: true, size: 32 })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [text([profile?.email, profile?.phone, [profile?.city, profile?.country].filter(Boolean).join(", "), r.links?.linkedin, r.links?.github].filter(Boolean).join(" | "))],
    }),
  ];
  if (t.summary) children.push(heading("Summary"), new Paragraph({ children: [text(t.summary)] }));
  if (t.skills.length) children.push(heading("Skills"), new Paragraph({ children: [text(t.skills.join(", "))] }));
  if (t.experience.length) {
    children.push(heading("Experience"));
    t.experience.forEach((e, i) => {
      const orig = r.experience[i];
      const dates = orig ? [orig.start, orig.current ? "Present" : orig.end].filter(Boolean).join(" - ") : "";
      children.push(new Paragraph({ spacing: { before: 120 }, children: [text(`${e.title}, ${e.company}`, { bold: true }), text(dates ? `   ${dates}` : "")] }));
      e.bullets.forEach((b) => children.push(new Paragraph({ bullet: { level: 0 }, children: [text(b)] })));
    });
  }
  if (r.projects?.length) {
    children.push(heading("Projects"));
    r.projects.forEach((p) => children.push(new Paragraph({ children: [text(p.name, { bold: true }), text(p.description ? `: ${p.description}` : "")] })));
  }
  if (r.education?.length) {
    children.push(heading("Education"));
    r.education.forEach((e) =>
      children.push(new Paragraph({ children: [text(`${e.degree}${e.field ? ` in ${e.field}` : ""}, ${e.institution}`, { bold: true }), text([e.end, e.grade].filter(Boolean).length ? `   ${[e.end, e.grade].filter(Boolean).join(", ")}` : "")] })),
    );
  }
  if (r.certifications?.length) {
    children.push(heading("Certifications"));
    r.certifications.forEach((c) => children.push(new Paragraph({ children: [text([c.name, c.issuer, c.year].filter(Boolean).join(", "))] })));
  }

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 800, right: 800 } } }, children }] });
  const buf = await Packer.toBuffer(doc);
  const fileName = `${(profile?.full_name ?? "Resume").replace(/\W+/g, "_")}_${(job.companies?.name ?? "").replace(/\W+/g, "_")}.docx`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
