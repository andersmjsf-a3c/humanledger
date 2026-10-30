"use client";
import { useEffect, useState } from "react";
import { STARTERS } from "@/service";
import { getStore } from "@/vault/ui/useVault";
import { STARTER_PREFIX } from "@/vault/storage";
import { starterAnswersOf } from "@/vault/bundle";
import type { Starter, StarterAnswers } from "./fill";

// Version 2 of a starter is a full worksheet. Show the person's three starter answers at the top,
// read from their own vault, so they start from what they already wrote.
export function StarterAnswersPanel({ worksheetId }: { worksheetId: string }) {
  const [found, setFound] = useState<{ s: Starter; a: StarterAnswers } | null>(null);
  useEffect(() => {
    const s = STARTERS.find((x) => x.worksheetV2 === worksheetId);
    if (!s) return;
    getStore()
      .get(STARTER_PREFIX + s.id)
      .then((rec) => rec && setFound({ s, a: starterAnswersOf(s, rec.answers) }));
  }, [worksheetId]);
  if (!found) return null;
  return (
    <aside className="kept">
      <p className="meta">
        Version 2 of your <a href={`/start/${found.s.id}`}>{found.s.title}</a> starter. Your three answers, to build on:
      </p>
      <ul>
        {found.s.questions.map((q) => {
          const v = found.a[q.key];
          return (
            <li key={q.key}>
              <strong>{q.label}:</strong> {Array.isArray(v) ? v.filter(Boolean).join("; ") : v || "(none yet)"}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
