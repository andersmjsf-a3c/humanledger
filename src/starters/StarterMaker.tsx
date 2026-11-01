"use client";
import { useEffect, useMemo, useState } from "react";
import { strToU8, zipSync } from "fflate";
import { fillParts, fillStarter, isMemoryStarter, listHints, memoryLine, memoryParagraph, missing, optional, splitHint, type Starter, type StarterAnswers } from "./fill";
import { confirmMemory } from "@/dashboard/useVaultSummary";
import { downloadBytes } from "@/vault/folder";
import { getStore } from "@/vault/ui/useVault";
import { STARTER_PREFIX } from "@/vault/storage";
import { fingerprint, flatStarterAnswers, starterAnswersOf } from "@/vault/bundle";
import { useSignedIn } from "@/account/useSignedIn";
import { rememberReturn } from "@/account/returnTo";

const DRAFT = (id: string) => `starter:${id}`;

// Answers in progress stay in this browser (localStorage, because the sign-in link usually opens
// in a new tab) for a day at most, and are cleared once the file is kept.
const DAY_MS = 86_400_000;
function loadDraft(id: string): StarterAnswers | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT(id)) ?? "null");
    return d && Date.now() - d.at < DAY_MS ? d.answers : null;
  } catch {
    return null;
  }
}
function saveDraft(id: string, answers: StarterAnswers) {
  try {
    localStorage.setItem(DRAFT(id), JSON.stringify({ answers, at: Date.now() }));
  } catch {
    // storage blocked: answers live only on this page
  }
}
function clearDraft(id: string) {
  try {
    localStorage.removeItem(DRAFT(id));
  } catch {
    // nothing to clear
  }
}

// Three questions, then the finished file. Nothing here is sent anywhere: the file is built in
// this browser, downloaded by the person, or kept in their own vault on this device.
export function StarterMaker({ s }: { s: Starter }) {
  const blank = useMemo(() => Object.fromEntries(s.questions.map((q) => [q.key, q.type === "list3" ? ["", "", ""] : ""])) as StarterAnswers, [s]);
  const [answers, setAnswers] = useState<StarterAnswers>(blank);
  const [step, setStep] = useState<"ask" | "file">("ask");
  const [kept, setKept] = useState<{ version: number } | null>(null);
  const [note, setNote] = useState("");
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const signedIn = useSignedIn();

  // Back from sign-in (or a reload): pick up the answers, and finish the keep if that's why they left.
  useEffect(() => {
    const d = loadDraft(s.id);
    getStore()
      .get(STARTER_PREFIX + s.id)
      .then((rec) => {
        if (d) setAnswers(d);
        else if (rec) setAnswers(starterAnswersOf(s, rec.answers));
        if (d || rec) setStep("file");
        if (rec) setKept({ version: rec.version ?? 1 });
      });
  }, [s]);
  useEffect(() => {
    if (signedIn && step === "file" && new URLSearchParams(window.location.search).has("keep")) {
      window.history.replaceState(null, "", window.location.pathname);
      keep();
    }
  }, [signedIn, step]);

  const set = (key: string, v: string, i?: number) => {
    const next = { ...answers, [key]: i === undefined ? v : (answers[key] as string[]).map((x, j) => (j === i ? v : x)) };
    setAnswers(next);
    saveDraft(s.id, next);
  };

  const content = () => fillStarter(s, answers);
  const memory = isMemoryStarter(s);

  async function keep() {
    if (!signedIn) {
      saveDraft(s.id, answers);
      rememberReturn(`/start/${s.id}?keep=1`);
      window.location.href = "/login";
      return;
    }
    const store = getStore();
    const prev = await store.get(STARTER_PREFIX + s.id);
    const flat = flatStarterAnswers(answers);
    const same = prev && JSON.stringify(prev.answers) === JSON.stringify(flat);
    const version = prev ? (same ? prev.version ?? 1 : (prev.version ?? 1) + 1) : 1;
    // Downloaded this exact file before keeping it? Then it already counts as exported for Claude.
    const hash = fingerprint(content());
    const exportedHash = downloaded === hash ? hash : same ? prev?.exportedHash : undefined;
    await store.replaceAll([
      { ...(prev ?? {}), id: STARTER_PREFIX + s.id, answers: flat, updatedAt: same && prev ? prev.updatedAt : new Date().toISOString(), version, ...(exportedHash ? { exportedHash } : {}) },
    ]);
    clearDraft(s.id);
    setKept({ version });
    setNote(`Kept in your vault as version ${version}.`);
  }

  // The file left for Claude (downloaded, or the memory line copied): remember which version did.
  async function markExported(text: string) {
    setDownloaded(fingerprint(text));
    const store = getStore();
    const rec = await store.get(STARTER_PREFIX + s.id);
    if (rec && JSON.stringify(rec.answers) === JSON.stringify(flatStarterAnswers(answers))) {
      await store.replaceAll([{ ...rec, exportedHash: fingerprint(text) }]);
    }
  }

  async function download() {
    const text = content();
    if (memory) {
      downloadBytes(strToU8(text), `${s.id}.md`);
      await markExported(text);
      setNote("Downloaded. Keep this file; the memory is a copy of it.");
      return;
    }
    downloadBytes(zipSync({ [`${s.id}/SKILL.md`]: strToU8(text) }), `${s.id}.zip`);
    await markExported(text);
    setNote("Downloaded. In Claude, add the ZIP under Customize > Skills, then name the job.");
  }

  async function copyLine() {
    try {
      await navigator.clipboard.writeText(memoryLine(memoryParagraph(s, answers) ?? ""));
      await markExported(content());
      setNote("Copied. Paste it into a new conversation in Claude and send it.");
    } catch {
      setNote("Couldn't copy. Select the line above and copy it yourself.");
    }
  }

  async function confirmed() {
    await confirmMemory(true);
    setNote("Marked as in Claude's memory. Your AI shows it connected.");
  }

  if (step === "ask") {
    const gaps = missing(s, answers);
    return (
      <form
        className="starter-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!gaps.length) setStep("file");
        }}
      >
        <p className="fineprint">This stays in your vault. Three answers, then your file is ready.</p>
        {s.questions.map((q, n) => (
          <div key={q.key} className="starter-q">
            <label className="qlabel" htmlFor={`${q.key}-0`}>
              {n + 1}. {q.label}
              {optional(q) && <span className="meta"> (optional)</span>}
            </label>
            {q.type === "text" && splitHint(q.hint).guidance && <span className="meta">{splitHint(q.hint).guidance}</span>}
            {q.type === "list3" ? (
              listHints(q.hint).map((h, i) => (
                <input key={i} id={`${q.key}-${i}`} aria-label={`${q.label} ${i + 1}`} placeholder={h} value={(answers[q.key] as string[])[i]} onChange={(e) => set(q.key, e.target.value, i)} />
              ))
            ) : (
              <input id={`${q.key}-0`} placeholder={splitHint(q.hint).example} value={answers[q.key] as string} onChange={(e) => set(q.key, e.target.value)} />
            )}
          </div>
        ))}
        <button className="primary" type="submit" disabled={gaps.length > 0}>
          Make my file
        </button>
      </form>
    );
  }

  return (
    <div className="starter-file">
      <p className="lede">
        Here&apos;s your {memory ? "paragraph" : "keep"}. The <span className="yours">green</span> parts are yours; everything else is ready as written.
        {!memory && <span className="meta"> A keep is a file your AI reads before it works for you: a standing order you own. You take it from Keelsound and add it to Claude in a few clicks.</span>}
      </p>
      {memory && (
        <div className="memory-line">
          <p className="qlabel">The one line to paste into Claude</p>
          <p className="paste" aria-label="The line to paste">
            {memoryLine(memoryParagraph(s, answers) ?? "")}
          </p>
        </div>
      )}
      <div className="actions">
        {memory ? (
          <>
            <button className="primary" onClick={copyLine}>
              Copy for Claude
            </button>
            <button className="secondary" onClick={download}>
              Download the file
            </button>
          </>
        ) : (
          <button className="primary" onClick={download}>
            Download for Claude
          </button>
        )}
        <button className="secondary" onClick={keep}>
          {kept ? `Kept, version ${kept.version}. Save changes` : "Keep it in my vault"}
        </button>
        <button className="linklike" onClick={() => setStep("ask")}>
          Change my answers
        </button>
      </div>
      {note && <p className="saved">{note}</p>}
      {memory && downloaded && (
        <p className="fineprint">
          Asked Claude what it knows about you, in a new conversation, and it had this right?{" "}
          <button className="linklike" onClick={confirmed}>
            Yes, it remembers
          </button>
        </p>
      )}
      <pre className="skillfile" aria-label={memory ? "Your about-me file" : "Your keep file"}>
        {fillParts(s, answers).map((p, i) => ("text" in p ? <span key={i}>{p.text}</span> : <mark key={i} className="yours">{p.answer}</mark>))}
      </pre>
      <p className="fineprint">
        {signedIn ? "" : "Keeping it asks you to sign in, once. "}
        We keep the scores. Your files stay in your vault; we never read them.
      </p>
    </div>
  );
}
