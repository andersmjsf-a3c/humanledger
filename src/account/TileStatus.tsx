"use client";
import { useEffect, useState } from "react";
import { buildDashboard, needsRetest, type CapCard } from "@/dashboard/model";
import { useVaultSummary } from "@/dashboard/useVaultSummary";
import { CHANGES } from "@/service/reference";
import { useSignedIn } from "./useSignedIn";

const short = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// Signed in, a homepage tile shows its state dot and one line: the file and version, or when it was
// tried, or nothing. Read from this browser's vault. The tile still opens its content page.
let cache: Promise<CapCard[]> | null = null;

export function TileStatus({ slug, part }: { slug: string; part: "dot" | "line" }) {
  const signedIn = useSignedIn();
  const { summary } = useVaultSummary();
  const [card, setCard] = useState<CapCard | null>(null);

  useEffect(() => {
    if (!signedIn || !summary) return;
    cache ??= Promise.resolve(
      buildDashboard({
        now: new Date(),
        ...summary,
        cards: [],
        releases: CHANGES.map((c) => ({ id: c.id, date: c.date, title: c.title, needsRetest: needsRetest(c.reTest) })),
      }).cards,
    );
    cache.then((cs) => setCard(cs.find((c) => c.cap.slug === slug) ?? null));
  }, [signedIn, summary, slug]);

  if (!signedIn || !card) return null;
  if (part === "dot") return <span className={`dot dot-${card.state}`} aria-label={card.state.replace("_", " ")} />;
  const v = card.fileLine ? card.fileLine.split(" · changed")[0] : card.state === "tried" && summary?.tried[slug] ? `Tried ${short(summary.tried[slug])}` : "";
  return v ? <span className="tile-line">{v}</span> : null;
}
