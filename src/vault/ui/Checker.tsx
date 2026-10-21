"use client";
import { useEffect, useMemo, useState } from "react";
import { lintBaseline } from "@/linters/baseline";
import { lintVoice, rulesFrom } from "@/linters/voice";
import { collectSources } from "@/linters/sources";
import { aiTellCounts, voiceCounts } from "@/linters/scorecard";
import type { Flag } from "@/linters/types";
import { getStore } from "./useVault";

const sum = (fs: Flag[], g: Flag["group"]) => fs.filter((f) => f.group === g).reduce((n, f) => n + f.count, 0);

function Flags({ flags, empty }: { flags: Flag[]; empty: string }) {
  if (!flags.length) return <p className="clean">{empty}</p>;
  return (
    <ul className="flags">
      {flags.map((f, i) => (
        <li key={i}>
          <span className="fcat">{f.category}</span>
          {f.count > 0 && <span className="fcount"> ×{f.count}</span>}
          {f.items.length > 0 && <span className="fitems"> {f.items.map((x) => `“${x.text}”${x.count > 1 ? ` ×${x.count}` : ""}`).join(", ")}</span>}
          {f.source && <span className="fsource"> · {f.source}</span>}
        </li>
      ))}
    </ul>
  );
}

// Paste, check, rewrite. Everything here runs in this browser; the text is never saved or sent.
export function Checker() {
  const [text, setText] = useState("");
  const [email, setEmail] = useState(false);
  const [records, setRecords] = useState<Record<string, Record<string, string>>>({});
  const [ran, setRan] = useState<{ base: Flag[]; voice: Flag[]; words: number; rules: number } | null>(null);
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    const s = getStore();
    s.all().then((rs) => setRecords(Object.fromEntries(rs.map((r) => [r.id, r.answers]))));
    s.runs().then((r) => setRuns(r.length));
  }, []);

  const rules = useMemo(() => rulesFrom(collectSources(records)), [records]);

  async function run() {
    const base = lintBaseline(text, { email });
    const voice = lintVoice(text, rules);
    setRan({ base: base.flags, voice: voice.flags, words: base.words, rules: rules.length });
    await getStore().addRun({
      at: new Date().toISOString(),
      words: base.words,
      baseline: { hard: sum(base.flags, "hard"), tells: sum(base.flags, "tells") },
      voice: { hard: sum(voice.flags, "hard"), tells: sum(voice.flags, "tells"), rules: rules.length },
      aiTellFlags: aiTellCounts(base.flags),
      voiceFlags: voiceCounts(voice.flags),
    });
    setRuns((n) => n + 1);
  }

  const counts = ran ? { ai: aiTellCounts(ran.base), voice: voiceCounts(ran.voice) } : null;

  return (
    <>
      <label htmlFor="draft" className="flabel">Paste a draft</label>
      <textarea id="draft" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste anything the AI wrote for you, or anything you're about to send." />
      <div className="actions">
        <button className="primary" onClick={run} disabled={!text.trim()}>Check it</button>
        <label className="check">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> This is an email
        </label>
      </div>
      <p className="fineprint">This page never saves or sends your draft. It keeps only the counts from each run, on this device.</p>

      {ran && (
        <>
          <p className="guidance">
            Each flag points at an idea to rewrite. Don't just swap the word: a new word on an empty claim still reads as
            empty. Say the specific thing instead.
          </p>

          <h2>Signs of AI writing</h2>
          <h3>Fix every one</h3>
          <Flags flags={ran.base.filter((f) => f.group === "hard")} empty="None. No chatbot leftovers, placeholders, or tracking links." />
          <h3>Rewrite the idea</h3>
          <Flags flags={ran.base.filter((f) => f.group === "tells")} empty="None found." />

          <h2>Your rules</h2>
          {ran.rules === 0 ? (
            <p className="clean">
              You haven't written any rules yet, so there's nothing of yours to check against. Start with{" "}
              <a href="/workbook/A3">A3: How you want it to talk to you</a>, then your <a href="/skills/2-writing-voice">writing-voice skill</a>.
            </p>
          ) : (
            <>
              <h3>Your never-rules</h3>
              <Flags flags={ran.voice.filter((f) => f.group === "hard")} empty="None broken." />
              <h3>Your checks</h3>
              <Flags flags={ran.voice.filter((f) => f.group === "tells")} empty="All passed." />
              <h3>Check these yourself</h3>
              <Flags flags={ran.voice.filter((f) => f.group === "style")} empty="Every rule you wrote can be checked automatically." />
            </>
          )}

          <h2>What gets recorded</h2>
          <p className="meta">
            Counts only, on this device (run {runs}). Later, you can choose to put counts like these on a scorecard. The draft
            itself is never kept.
          </p>
          <pre className="preview">{JSON.stringify({ words: ran.words, ai_tell_flags_found: counts!.ai, voice_flags_found: counts!.voice }, null, 2)}</pre>
        </>
      )}
    </>
  );
}
