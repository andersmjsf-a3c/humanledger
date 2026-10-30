import { notFound } from "next/navigation";
import { STARTERS, starterById } from "@/service";
import { StarterMaker } from "@/starters/StarterMaker";

export function generateStaticParams() {
  return STARTERS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const s = starterById((await params).id);
  return s ? { title: s.title, description: s.oneLine } : {};
}

export default async function StartPage({ params }: { params: Promise<{ id: string }> }) {
  const s = starterById((await params).id);
  if (!s) notFound();
  return (
    <main className="starter">
      <p className="crumb">
        <a href="/#starters">Starters</a>
      </p>
      <h1>{s.title}</h1>
      <p className="lede">{s.oneLine}</p>
      <StarterMaker s={s} />
    </main>
  );
}
