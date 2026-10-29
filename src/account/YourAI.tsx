"use client";
import { useEffect, useMemo, useState } from "react";
import { buildDashboard, needsRetest, type Card } from "@/dashboard/model";
import { DashboardView } from "@/dashboard/DashboardView";
import { confirmMemory, useVaultSummary } from "@/dashboard/useVaultSummary";
import { CHANGES } from "@/service/reference";

// The signed-in page. Vault facts are read in this browser; the only thing fetched is the
// person's own scorecards from the ledger.
export function YourAI() {
  const { summary, reload } = useVaultSummary();
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    fetch("/api/ledger", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((j) => setCards(j.cards ?? []))
      .catch(() => setCards([]));
  }, []);

  const d = useMemo(
    () =>
      summary && cards
        ? buildDashboard({
            now: new Date(),
            ...summary,
            cards,
            releases: CHANGES.map((c) => ({ id: c.id, date: c.date, title: c.title, needsRetest: needsRetest(c.reTest) })),
          })
        : null,
    [summary, cards],
  );

  if (!d) return <p className="wrap">Reading your vault on this device…</p>;
  return (
    <DashboardView
      d={d}
      onConfirmMemory={async () => {
        await confirmMemory(true);
        reload();
      }}
    />
  );
}
