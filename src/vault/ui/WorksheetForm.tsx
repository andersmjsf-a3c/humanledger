"use client";
import { useEffect, useRef, useState } from "react";
import type { Answers, Worksheet } from "@/worksheets/types";
import { getStore, useVault } from "./useVault";
import { FolderBar } from "./FolderBar";

const isBracket = (s: string) => /^\[MARK:/.test(s);

export function WorksheetForm({ ws }: { ws: Worksheet }) {
  const vault = useVault();
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");
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

  return (
    <article className="worksheet">
      <p className="crumb">
        <a href="/workbook">Workbook</a> · Part {ws.part}
      </p>
      <h1>
        {ws.id}. {ws.title}
      </h1>
      <p className="promise">{ws.promise}</p>
      {ws.draft && <p className="draftnote">Draft worksheet. Final wording comes with the workbook.</p>}

      <h2>Why this matters</h2>
      <p className={isBracket(ws.why) ? "bracket" : ""}>{ws.why}</p>

      <h2>Mark's example</h2>
      <p className={isBracket(ws.example) ? "bracket" : ""}>{ws.example}</p>

      <h2>Your turn</h2>
      {!loaded ? (
        <p>Loading your answers from this device…</p>
      ) : (
        <ol className="prompts">
          {ws.prompts.map((p) => (
            <li key={p.id}>
              <label htmlFor={p.id}>{p.label}</label>
              {p.expected && <span className="expected">({p.expected})</span>}
              {p.kind === "short" && <input id={p.id} value={answers[p.id] ?? ""} onChange={(e) => update(p.id, e.target.value)} />}
              {p.kind === "date" && <input id={p.id} type="date" value={answers[p.id] ?? ""} onChange={(e) => update(p.id, e.target.value)} />}
              {p.kind === "long" && <textarea id={p.id} rows={4} value={answers[p.id] ?? ""} onChange={(e) => update(p.id, e.target.value)} />}
              {p.kind === "table" && (
                <table>
                  <thead>
                    <tr>
                      <th />
                      {p.columns!.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.rows!.map((row, r) => (
                      <tr key={row}>
                        <th scope="row">{row}</th>
                        {p.columns!.map((c, ci) => {
                          const key = `${p.id}.${r}.${ci}`;
                          return (
                            <td key={c}>
                              <input aria-label={`${row}: ${c}`} value={answers[key] ?? ""} onChange={(e) => update(key, e.target.value)} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          ))}
        </ol>
      )}
      {savedAt && <p className="saved">Saved on this device at {savedAt}.</p>}

      <h2>Why this compounds</h2>
      <p>{ws.compounds}</p>

      <FolderBar vault={vault} />
    </article>
  );
}
