import { notFound } from "next/navigation";
import { STARTERS, starterById } from "@/service";
import { StarterMaker } from "@/starters/StarterMaker";
import { Shots } from "@/service/Shot";
import { shotsFor } from "@/service/screenshots";

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
      <section className="load-it">
        <h2>Load it into Claude</h2>
        <p>
          Download the ZIP, then in Claude open Customize &gt; Skills and add it. After that, name the job in any conversation and
          it uses the skill.
        </p>
        <Shots list={shotsFor.starter(s.id)} />
      </section>
    </main>
  );
}
