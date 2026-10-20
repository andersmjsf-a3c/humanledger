"use client";
import { useEffect, useState } from "react";
import { WORKSHEETS } from "@/worksheets";
import { getStore, useVault } from "./useVault";
import { FolderBar } from "./FolderBar";

// Part names from the workbook outline.
const PARTS = [
  { part: "0", title: "Part 0: Set up" },
  { part: "A", title: "Part A: Train it on you" },
  { part: "B", title: "Part B: Train it on your work" },
  { part: "C", title: "Part C: Train it on your business" },
];

export function WorksheetList() {
  const vault = useVault();
  const [started, setStarted] = useState<Set<string>>(new Set());
  useEffect(() => {
    getStore().all().then((rs) => setStarted(new Set(rs.filter((r) => Object.values(r.answers).some((v) => v.trim())).map((r) => r.id))));
  }, [vault.unsaved]);

  return (
    <>
      <FolderBar vault={vault} />
      {PARTS.filter((p) => WORKSHEETS.some((w) => w.part === p.part)).map((p) => (
        <section key={p.part}>
          <h2>{p.title}</h2>
      <ol className="worksheets">
        {WORKSHEETS.filter((w) => w.part === p.part).map((w) => (
          <li key={w.id}>
            <a href={`/workbook/${w.id}`}>
              <span className="wsid">{w.id}</span> <span className="wstitle">{w.title}</span>
            </a>
            <span className="meta">
              {w.minutes ? `${w.minutes} min` : ""}{started.has(w.id) ? " · started" : ""}
              {vault.unsaved.includes(w.id) ? " · not in your folder yet" : ""}
            </span>
          </li>
        ))}
      </ol>
        </section>
      ))}
    </>
  );
}
