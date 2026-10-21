// Linter 2, the reader's voice: built only from the reader's own files, never from Mark's rules.
// Sources, all read in the browser:
//   - their writing-voice skill: "Words and phrases I never use" and the Rules section
//   - worksheet A3: never-say, punctuation or style, format, length, words
//   - worksheet A4: each correction's "what it should do"
// "Never" rules become phrases or patterns to flag; rules a program can't test become a checklist.
// Every flag names the rule that fired and where the reader wrote it.

import type { Flag, Report } from "./types";

export interface RuleSource {
  source: string; // shown to the reader, e.g. "A3 · Never say"
  text: string;
  neverList?: boolean; // every line or comma-separated item is a phrase to avoid
  correction?: boolean; // an A4 row: the rule is the "what it should do" half
}

export interface VoiceRule {
  kind: "phrase" | "pattern" | "max-words" | "reminder";
  rule: string; // the reader's words
  source: string;
  phrase?: string;
  pattern?: RegExp;
  patternName?: string;
  maxWords?: number;
}

const NEGATIVE = /\b(never|no|not|don'?t|do not|avoid|stop|without|ban|banned|cut)\b/i;
const QUOTED = /["“”'‘’]([^"“”‘’']{2,80})["“”'‘’]/g;

// Rules a program can actually test, in plain words a reader would write.
const KNOWN: { name: string; test: RegExp; pattern: RegExp }[] = [
  { name: "em dashes", test: /em[\s-]?dash|—/i, pattern: /—/g },
  { name: "en dashes used as dashes", test: /en[\s-]?dash|–/i, pattern: / – /g },
  { name: "exclamation points", test: /exclamation|!/i, pattern: /!(?!\[)/g },
  { name: "emoji", test: /emoji/i, pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu },
  { name: "semicolons", test: /semicolon|;(?!\s*$)/i, pattern: /;/g },
  { name: "ellipses", test: /ellips|\.\.\.|…/i, pattern: /…|\.\.\./g },
  { name: "hashtags", test: /hashtag/i, pattern: /(^|\s)#[\p{L}\p{N}_]+/gmu },
  { name: "bullet lists", test: /\b(bullet|lists?)\b/i, pattern: /^\s*(?:[-*•]|\d+\.)\s+/gm },
  { name: "headings", test: /\bhead(ing|er)s?\b/i, pattern: /^#{1,6}\s/gm },
  { name: "bold", test: /\bbold\b/i, pattern: /\*\*[^*]+\*\*/g },
  { name: "all caps", test: /all[\s-]?caps|shouting/i, pattern: /\b[A-Z]{4,}\b/g },
];

function clauses(text: string): string[] {
  return text
    .split(/\n|;(?=\s)|(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.replace(/^\s*(?:[-*•]|\d+\.)\s*/, "").trim())
    .filter((s) => s.length > 1);
}

// Each phrase with the reader's own line it came from, so the report quotes their rule back to them.
function phrasesFromList(text: string): { phrase: string; line: string }[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const quoted = lines.flatMap((line) => [...line.matchAll(QUOTED)].map((m) => ({ phrase: m[1].trim(), line })));
  if (quoted.length) return quoted;
  return text
    .split(/\n|,|;/)
    .map((s) => s.replace(/^\s*(?:[-*•]|\d+\.)\s*/, "").replace(/^(never say|never use|never|no|avoid|don'?t say)\s+/i, "").replace(/[.]+$/, "").trim())
    .filter((s) => s.length >= 2 && s.split(/\s+/).length <= 8)
    .map((s) => ({ phrase: s, line: s }));
}

export function rulesFrom(sources: RuleSource[]): VoiceRule[] {
  const out: VoiceRule[] = [];
  for (const s of sources) {
    if (!s.text.trim()) continue;
    if (s.neverList) {
      for (const { phrase, line } of phrasesFromList(s.text)) {
        const known = KNOWN.find((k) => k.test.test(phrase));
        if (known) out.push({ kind: "pattern", rule: line, source: s.source, pattern: known.pattern, patternName: known.name });
        else out.push({ kind: "phrase", rule: line, source: s.source, phrase });
      }
      continue;
    }
    for (let c of clauses(s.text)) {
      if (s.correction) {
        const parts = c.split(/\s*(?:→|->|=>|\|)\s*|\bshould\b/i).map((x) => x.trim()).filter(Boolean);
        c = parts.length > 1 ? parts[parts.length - 1] : c;
      }
      const negative = NEGATIVE.test(c);
      const quoted = [...c.matchAll(QUOTED)].map((m) => m[1].trim());
      const known = KNOWN.find((k) => k.test.test(c));
      const max = c.match(/\b(?:under|max(?:imum)?|no more than|at most|up to|fewer than|less than)\s+(\d{2,5})\s+words\b|\b(\d{2,5})\s+words\s+(?:max|or (?:less|fewer))\b/i);
      if (negative && quoted.length) for (const q of quoted) out.push({ kind: "phrase", rule: c, source: s.source, phrase: q });
      else if (negative && known) out.push({ kind: "pattern", rule: c, source: s.source, pattern: known.pattern, patternName: known.name });
      else if (max) out.push({ kind: "max-words", rule: c, source: s.source, maxWords: Number(max[1] ?? max[2]) });
      else out.push({ kind: "reminder", rule: c, source: s.source });
    }
  }
  // Same rule from two places: keep the first.
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.kind}|${(r.phrase ?? r.patternName ?? r.rule).toLowerCase()}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function phraseRegex(p: string): RegExp {
  const start = /^[\p{L}\p{N}]/u.test(p) ? "(?<![\\p{L}\\p{N}])" : "";
  const end = /[\p{L}\p{N}]$/u.test(p) ? "(?![\\p{L}\\p{N}])" : "";
  return new RegExp(start + esc(p).replace(/\s+/g, "\\s+") + end, "giu");
}

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const short = (s: string) => (s.length > 90 ? s.slice(0, 87) + "…" : s);

export interface VoiceReport extends Report {
  ruleCount: number;
}

export function lintVoice(text: string, rules: VoiceRule[]): VoiceReport {
  const flags: Flag[] = [];
  const wc = words(text);
  for (const r of rules) {
    if (r.kind === "phrase" || r.kind === "pattern") {
      const re = r.kind === "phrase" ? phraseRegex(r.phrase!) : new RegExp(r.pattern!.source, r.pattern!.flags.includes("g") ? r.pattern!.flags : r.pattern!.flags + "g");
      const hits = [...text.matchAll(re)].map((m) => m[0].trim() || m[0]);
      if (!hits.length) continue;
      const counts = new Map<string, number>();
      for (const h of hits) counts.set(h.toLowerCase(), (counts.get(h.toLowerCase()) ?? 0) + 1);
      const what = r.kind === "phrase" ? `"${r.phrase}"` : r.patternName!;
      flags.push({
        group: "hard",
        category: short(r.rule),
        count: hits.length,
        items: [...counts].map(([t, n]) => ({ text: t, count: n })),
        label: `${what} x${hits.length} (your rule: ${short(r.rule)})`,
        source: r.source,
      });
    } else if (r.kind === "max-words" && wc > r.maxWords!) {
      flags.push({ group: "tells", category: short(r.rule), count: 1, items: [], label: `${wc} words, over your ${r.maxWords} (your rule: ${short(r.rule)})`, source: r.source });
    } else if (r.kind === "reminder") {
      flags.push({ group: "style", category: short(r.rule), count: 0, items: [], label: short(r.rule), source: r.source });
    }
  }
  return { flags, words: wc, ruleCount: rules.length };
}
