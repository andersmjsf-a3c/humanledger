// Starters (Oct 30 2026): six skills already written, each with exactly three questions.
// The answers fill the {{placeholders}}; everything else ships as written.

export type QuestionType = "text" | "list3";
export interface StarterQuestion { key: string; label: string; hint: string; type: QuestionType }
export interface Starter {
  id: string;
  title: string;
  oneLine: string;
  file: string;
  questions: StarterQuestion[];
  worksheetV2: string;
  template: string;
}
export type StarterAnswers = Record<string, string | string[]>;

// A segment of the finished file: the starter's own words, or one of the person's answers.
export type Part = { text: string } | { answer: string; key: string };

export const optional = (q: StarterQuestion) => /leave (it )?blank/i.test(q.hint);

// The hint for a list3 question is one quoted string of three items: "Leverage. Circle back. ..."
export function listHints(hint: string): string[] {
  const inner = hint.match(/"([^"]+)"/)?.[1] ?? hint;
  const parts = inner.split(/(?<=[.!?])\s+/).map((s) => s.replace(/[.]$/, "").trim()).filter(Boolean);
  return [0, 1, 2].map((i) => parts[i] ?? "");
}

function answerFor(s: Starter, key: string, answers: StarterAnswers): string {
  const [base, idx] = key.split(".");
  const q = s.questions.find((x) => x.key === base);
  if (!q) throw new Error(`${s.id}: placeholder {{${key}}} has no question`);
  const v = answers[base];
  const raw = idx ? (Array.isArray(v) ? v[Number(idx) - 1] : undefined) : Array.isArray(v) ? v.join(", ") : v;
  return (raw ?? "").trim();
}

// Fill the template. Punctuation is tidied where an answer meets the starter's text, so
// "{{who}}." never ends in two periods and a sentence that ends on an answer still ends.
export function fillParts(s: Starter, answers: StarterAnswers): Part[] {
  const out: Part[] = [];
  const t = s.template;
  let last = 0;
  for (const m of t.matchAll(/\{\{([\w.]+)\}\}/g)) {
    const at = m.index!;
    if (at > last) out.push({ text: t.slice(last, at) });
    let a = answerFor(s, m[1], answers).replace(/[.]+$/, "");
    const after = t.slice(at + m[0].length);
    const lineStart = t.lastIndexOf("\n", at) + 1;
    const bullet = /^\s*-\s/.test(t.slice(lineStart, at));
    if (!a) a = "(none yet)";
    else if (!bullet && !/[!?]$/.test(a) && (/^\s+[A-Z]/.test(after) || /^\s*(\n|$)/.test(after))) a += ".";
    out.push({ answer: a, key: m[1] });
    last = at + m[0].length;
  }
  if (last < t.length) out.push({ text: t.slice(last) });
  return out;
}

export const fillStarter = (s: Starter, answers: StarterAnswers) => fillParts(s, answers).map((p) => ("text" in p ? p.text : p.answer)).join("");

export function missing(s: Starter, answers: StarterAnswers): string[] {
  return s.questions
    .filter((q) => !optional(q))
    .filter((q) => {
      const v = answers[q.key];
      return q.type === "list3" ? !Array.isArray(v) || v.filter((x) => x.trim()).length < 3 : !String(v ?? "").trim();
    })
    .map((q) => q.key);
}

// A text question's hint is guidance plus quoted examples: the examples become the placeholder,
// the guidance shows under the label. 'One sentence. "Two accountants." "Owners."' ->
// { guidance: "One sentence.", example: "Two accountants. / Owners." }
export function splitHint(hint: string): { guidance: string; example: string } {
  const quoted = [...hint.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim());
  const guidance = hint.replace(/"[^"]+"/g, "").replace(/\s+/g, " ").trim();
  return { guidance, example: quoted.length ? quoted.join(" / ") : hint };
}
