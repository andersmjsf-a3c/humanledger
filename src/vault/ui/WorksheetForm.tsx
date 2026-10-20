"use client";
import { useEffect, useRef, useState } from "react";
import type { Answers, Field, Worksheet } from "@/worksheets/types";
import { getStore, useVault } from "./useVault";
import { FolderBar } from "./FolderBar";

// HTML here is generated at build time from the workbook's own draft files in this repo,
// never from anything a visitor typed, so rendering it directly is safe.
const Html = ({ html, className }: { html: string; className?: string }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

export function WorksheetForm({ ws }: { ws: Worksheet }) {
  const vault = useVault();
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getStore().get(ws.id).then((r) => {
      if (r) setAnswers(r.answers);
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
      {ws.draft && <p className="draftnote">Draft: a few lines are still marked for Mark to fill in.</p>}

      <h2>Why this matters</h2>
      <Html html={ws.whyHtml} />

      <h2>Mark's example</h2>
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

      <h2>Why this compounds</h2>
      <Html html={ws.compoundsHtml} />

      <FolderBar vault={vault} />
    </article>
  );
}
