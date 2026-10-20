"use client";
import { useEffect, useState } from "react";
import { TEMPLATES, STARTER_IDS } from "@/skills";
import { SKILL_PREFIX, type StoredWorksheet } from "../storage";
import { getStore, useVault } from "./useVault";
import { FolderBar } from "./FolderBar";

export function SkillList() {
  const vault = useVault();
  const [recs, setRecs] = useState<Record<string, StoredWorksheet>>({});
  useEffect(() => {
    getStore().all().then((rs) => setRecs(Object.fromEntries(rs.filter((r) => r.id.startsWith(SKILL_PREFIX)).map((r) => [r.id.slice(SKILL_PREFIX.length), r]))));
  }, [vault.unsaved]);

  const row = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    const r = recs[id];
    const started = r && Object.values(r.answers).some((v) => v.trim());
    return (
      <li key={id}>
        <a href={`/skills/${id}`}>{t.title.replace(/\[[^\]]+\]/g, "…")}</a>
        <span className="meta">
          {started ? "started" : ""}
          {r?.version ? ` · version ${r.version}` : ""}
          {vault.unsaved.includes(SKILL_PREFIX + id) ? " · not in your folder yet" : ""}
        </span>
      </li>
    );
  };

  return (
    <>
      <FolderBar vault={vault} />
      <h2>The five starter skills</h2>
      <ol className="worksheets">{STARTER_IDS.map(row)}</ol>
      <h2>More templates</h2>
      <ol className="worksheets">{TEMPLATES.filter((t) => !STARTER_IDS.includes(t.id)).map((t) => row(t.id))}</ol>
    </>
  );
}
