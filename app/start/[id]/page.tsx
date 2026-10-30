import { notFound } from "next/navigation";
import { STARTERS, starterById } from "@/service";
import { StarterMaker } from "@/starters/StarterMaker";
import { isMemoryStarter } from "@/starters/fill";
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
        <h2>{isMemoryStarter(s) ? "Give it to Claude's memory" : "Load it into Claude"}</h2>
        {isMemoryStarter(s) ? (
          <p>
            Copy the line, paste it into a new conversation, and send it. Then open another new conversation and ask what it knows
            about you; fix anything it got wrong. Memory has to be on: in the web app it&apos;s Settings &gt; Your Claude, in the
            desktop app Settings &gt; Memory. Keep the file. The memory is a copy; this is the master.
          </p>
        ) : (
          <p>
            Download the ZIP, then in Claude open Customize &gt; Skills and add it. After that, name the job in any conversation and
            it uses the skill.
          </p>
        )}
        <Shots list={shotsFor.starter(s.id)} />
      </section>
    </main>
  );
}
