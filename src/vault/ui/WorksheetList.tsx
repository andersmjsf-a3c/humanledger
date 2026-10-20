"use client";
import { useEffect, useState } from "react";
import { WORKSHEETS } from "@/worksheets";
import { getStore, useVault } from "./useVault";
import { FolderBar } from "./FolderBar";

export function WorksheetList() {
  const vault = useVault();
  const [started, setStarted] = useState<Set<string>>(new Set());
  useEffect(() => {
    getStore().all().then((rs) => setStarted(new Set(rs.filter((r) => Object.values(r.answers).some((v) => v.trim())).map((r) => r.id))));
  }, [vault.unsaved]);

  return (
    <>
      <FolderBar vault={vault} />
      <ol className="worksheets">
        {WORKSHEETS.map((w) => (
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
    </>
  );
}
