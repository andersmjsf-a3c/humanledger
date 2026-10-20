import { notFound } from "next/navigation";
import { WORKSHEETS, worksheetById } from "@/worksheets";
import { WorksheetForm } from "@/vault/ui/WorksheetForm";

export function generateStaticParams() {
  return WORKSHEETS.map((w) => ({ id: w.id }));
}

export default async function WorksheetPage({ params }: { params: Promise<{ id: string }> }) {
  const ws = worksheetById((await params).id);
  if (!ws) notFound();
  return (
    <main>
      <WorksheetForm ws={ws} />
    </main>
  );
}
