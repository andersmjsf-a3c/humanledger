import { notFound } from "next/navigation";
import { TEMPLATES, templateById } from "@/skills";
import { SkillBuilder } from "@/vault/ui/SkillBuilder";
import { StarterAnswersPanel } from "@/starters/StarterAnswersPanel";
import { Shots } from "@/service/Shot";
import { shotsFor } from "@/service/screenshots";

// The agent job description is workbook C2, Version 2 of the work register starter.
const CODE: Record<string, string> = { "7-agent-job-description": "C2" };

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const t = templateById((await params).id);
  if (!t) notFound();
  return (
    <main>
      {CODE[t.id] && <StarterAnswersPanel worksheetId={CODE[t.id]} />}
      <SkillBuilder t={t} />
      <Shots list={shotsFor.skill(t.id)} />
    </main>
  );
}
