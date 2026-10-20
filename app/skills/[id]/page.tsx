import { notFound } from "next/navigation";
import { TEMPLATES, templateById } from "@/skills";
import { SkillBuilder } from "@/vault/ui/SkillBuilder";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const t = templateById((await params).id);
  if (!t) notFound();
  return (
    <main>
      <SkillBuilder t={t} />
    </main>
  );
}
