"use client";
import { useEffect, useRef, useState } from "react";
import type { Answers, Field, Worksheet } from "@/worksheets/types";
import { getStore, useVault } from "./useVault";
import { FolderBar } from "./FolderBar";
import { KeptPanel } from "@/service/KeptPanel";
import { StarterAnswersPanel } from "@/starters/StarterAnswersPanel";
import { worksheetCard } from "@/cards/build";
import { encodeCard } from "@/lib/scorecard/encode";

// HTML here is generated at build time from the workbook's own draft files in this repo,
// never from anything a visitor typed, so rendering it directly is safe.
const Html = ({ html, className }: { html: string; className?: string }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

// B worksheets have a form-to-file twin in the skill builder.
const SKILL_BUILDER: Record<string, string> = {
  B1: "1-weekly-task",
  B2: "2-writing-voice",
  B3: "3-brand-rules",
  B4: "4-research-and-cite",
  B5: "5-fact-check-pass",
  B6: "6-post-skill",
};

export function WorksheetForm({ ws }: { ws: Worksheet }) {
  const vault = useVault();
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [completedAt, setCompletedAt] = useState<string | undefined>();
  const [checkStep, setCheckStep] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getStore().get(ws.id).then((r) => {
      if (r) setAnswers(r.answers);
      setCompletedAt(r?.completedAt);
      setLoaded(true);
    });
  }, [ws.id]);

  // Autosave to this device a moment after typing stops.
  function update(key: string, value: string) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const rec = await getStore().save(ws.id, next);
      setSavedAt(new Date(rec.updatedAt).toLocaleTimeString());
      vault.refresh();
    }, 600);
  }

  const input = (f: Field, ariaLabel: string) => {
    const v = answers[f.key] ?? "";
    if (f.kind === "check")
      return (
        <label className="check">
          <input type="checkbox" checked={!!v} onChange={(e) => update(f.key, e.target.checked ? "done" : "")} /> Done
        </label>
      );
    if (f.kind === "long") return <textarea aria-label={ariaLabel} rows={3} value={v} onChange={(e) => update(f.key, e.target.value)} />;
    return <input aria-label={ariaLabel} value={v} onChange={(e) => update(f.key, e.target.value)} />;
  };

  return (
    <article className="worksheet">
      <p className="crumb">
        <a href="/workbook">Workbook</a> · Part {ws.part}
      </p>
      <h1>
        {ws.id}. {ws.title}
      </h1>
      <Html className="promise" html={ws.promiseHtml} />
      {ws.draft && <p className="draftnote">Draft: a few lines are still being written.</p>}
      <p className="fineprint">This stays in your vault: this browser and, if you choose, a folder on your computer. We never see it.</p>
      <KeptPanel path={`/workbook/${ws.id}`} />
      <StarterAnswersPanel worksheetId={ws.id} />

      <h2>Why this matters</h2>
      <Html html={ws.whyHtml} />

      {/* Service versions only: a labeled illustration on a standing persona, never a founder story (Oct 26 2026). */}
      <h2>{ws.exampleHeading}</h2>
      <Html html={ws.exampleHtml} />

      <h2>Your turn</h2>
      {!loaded ? (
        <p>Loading your answers from this device…</p>
      ) : (
        <div className="yourturn">
          {ws.yourTurn.map((s, i) => {
            if (s.type === "md") return <Html key={i} html={s.html} />;
            if (s.type === "table")
              return (
                <table key={i} className="filltable">
                  <thead>
                    <tr>{s.header.map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r, ri) => (
                      <tr key={ri}>
                        {r.cells.map((c, ci) =>
                          ci === s.blankCol && r.field ? (
                            <td key={ci}>{input(r.field, `${r.field.label}: ${s.header[ci]}`)}</td>
                          ) : (
                            <td key={ci} dangerouslySetInnerHTML={{ __html: c }} />
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            return (
              <section key={i} className="item">
                <span className="num">{s.n}</span>
                <div>
                  <Html html={s.html} />
                  <div className="fields">
                    {s.fields.map((f) => (
                      <div key={f.key} className={f.label && f.kind !== "check" ? "labeled" : ""}>
                        {f.label && f.kind !== "check" && <span className="flabel">{f.label}</span>}
                        {input(f, f.label ? `${s.question}: ${f.label}` : s.question)}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {savedAt && <p className="saved">Saved on this device at {savedAt}.</p>}

      {ws.howToHtml && <Html className="howto" html={ws.howToHtml} />}

      {SKILL_BUILDER[ws.id] && (
        <p className="meta">
          Rather fill boxes and download the file? <a href={`/skills/${SKILL_BUILDER[ws.id]}`}>The skill builder</a> writes the same skill
          for you.
        </p>
      )}

      {ws.version2Html && (
        <>
          <h2 id="version-2">{ws.version2Heading}</h2>
          <Html html={ws.version2Html} />
        </>
      )}

      <h2>Why this compounds</h2>
      <Html html={ws.compoundsHtml} />

      <section className="done">
        <h2>Done with this worksheet</h2>
        {completedAt && <p className="meta">You sent a scorecard for this on {completedAt.slice(0, 10)}. Sending again records a revisit.</p>}
        <label className="check">
          <input type="checkbox" checked={checkStep} onChange={(e) => setCheckStep(e.target.checked)} /> I did the check step
        </label>
        <p>
          <a className="primarylink" href={`/review#${encodeCard(worksheetCard({ worksheetId: ws.id, revisited: !!completedAt, checkStepDone: checkStep }))}`}>
            Review the scorecard
          </a>
        </p>
        <p className="fineprint">The scorecard says which worksheet and that you finished it. None of your answers are on it. You'll see it before anything is sent.</p>
      </section>

      <FolderBar vault={vault} />
    </article>
  );
}
