// Linter 1, the baseline: a TypeScript port of the generic parts of ai_tells.py (humanize-mark-voice).
// Rules come from Wikipedia's "Signs of AI writing" and apply to anyone. Mark's house style (hedges,
// honesty framing, intensifiers), his dash rules, and exclamation points are deliberately not here; a reader can choose
// rules like those for themselves in the voice linter.
// tests/10-linters.test.ts checks this port line for line against the original on sample texts.
// Flags are pointers to rewrite the idea, never word swaps.

import rules from "./baseline-rules.json";
import type { Flag, Report } from "./types";

const HARD = rules.HARD as Record<string, string[]>;
const TELLS = rules.TELLS as Record<string, string[]>;
const HARD_PATTERNS = rules.HARD_PATTERNS as Record<string, string>;
const PATTERNS = rules.PATTERNS as Record<string, string>;

// Python's \w is Unicode-aware; JavaScript's isn't, so translate it for the u flag.
function pyToJs(pattern: string): string {
  let out = "";
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "\\" && i + 1 < pattern.length) {
      const n = pattern[i + 1];
      if (n === "w") out += inClass ? "\\p{L}\\p{N}_" : "[\\p{L}\\p{N}_]";
      else out += c + n;
      i++;
      continue;
    }
    if (c === "[" && !inClass) inClass = true;
    else if (c === "]" && inClass) inClass = false;
    out += c;
  }
  return out;
}

const rx = (p: string, flags = "gimu") => new RegExp(pyToJs(p), flags);
const findCount = (p: string, s: string) => [...s.matchAll(rx(p))].length;
const countSub = (hay: string, needle: string) => (needle ? hay.split(needle).length - 1 : 0);
const pySplit = (s: string) => s.trim().split(/\s+/).filter(Boolean);

// Python repr() of a list of strings, so report lines match the original exactly.
function pyRepr(list: string[]): string {
  const one = (s: string) => {
    const q = s.includes("'") && !s.includes('"') ? '"' : "'";
    return q + s.replace(/\\/g, "\\\\").replace(new RegExp(q, "g"), `\\${q}`) + q;
  };
  return `[${list.map(one).join(", ")}]`;
}

// Python's "{:.0%}" rounds half to even.
function pct(x: number): string {
  const v = x * 100;
  const f = Math.floor(v);
  const diff = v - f;
  const r = Math.abs(diff - 0.5) < 1e-9 ? (f % 2 === 0 ? f : f + 1) : Math.round(v);
  return `${r}%`;
}

function sentences(t: string): string[] {
  const flat = t.replace(/\s+/g, " ");
  return flat.split(/(?<=[.!?])\s+(?=[A-Z"(])/).filter((s) => pySplit(s).length >= 3);
}

function scan(groups: Record<string, string[]>, low: string, group: Flag["group"], suffix = ""): Flag[] {
  const out: Flag[] = [];
  for (const [cat, words] of Object.entries(groups)) {
    const items = words
      .map((w) => ({ text: w.replace(/^,+|,+$/g, ""), raw: w, count: countSub(low, w) }))
      .filter((x) => x.count)
      .map((x, i) => ({ ...x, i }))
      .sort((a, b) => b.count - a.count || a.i - b.i);
    if (items.length) {
      out.push({
        group,
        category: cat,
        count: items.reduce((n, x) => n + x.count, 0),
        items: items.map((x) => ({ text: x.text, count: x.count })),
        label: `${cat.toUpperCase()}${suffix}: ` + items.map((x) => `'${x.text}' x${x.count}`).join(", "),
      });
    }
  }
  return out;
}

const flag = (group: Flag["group"], category: string, count: number, label: string): Flag => ({ group, category, count, items: [], label });

export function lintBaseline(text: string, opts: { email?: boolean } = {}): Report {
  const body = text;
  const low = body.toLowerCase();
  const hard: Flag[] = [];
  const tells: Flag[] = [];

  hard.push(...scan(HARD, low, "hard", " (hard zero)"));
  for (const [name, pat] of Object.entries(HARD_PATTERNS)) {
    const n = findCount(pat, body);
    if (n) hard.push(flag("hard", name, n, `${name.toUpperCase()} x${n} (hard zero)`));
  }

  tells.push(...scan(TELLS, low, "tells"));
  for (const [name, pat] of Object.entries(PATTERNS)) {
    const n = findCount(pat, body);
    if (n) tells.push(flag("tells", name, n, `${name.toUpperCase()} x${n}`));
  }
  const rt = findCount("\\brather than\\b", low);
  if (rt >= 2) tells.push(flag("tells", "'y rather than x'", rt, `'Y RATHER THAN X' x${rt} (reversed negative parallelism)`));
  if (rx(rules.CURLY as string, "u").test(body) && /["']/.test(body)) tells.push(flag("tells", "mixed curly and straight quotes", 1, "MIXED CURLY AND STRAIGHT QUOTES"));

  const heads = [...body.matchAll(/^#{1,6} (.+)$/gm)].map((m) => m[1]);
  const isUpper = (c: string) => /\p{Lu}/u.test(c);
  const isAlpha = (c: string) => /\p{L}/u.test(c);
  const tc = heads.filter((h) => {
    const ws = pySplit(h);
    return ws.length >= 4 && ws.filter((w) => isAlpha(w[0])).filter((w) => isUpper(w[0])).length >= ws.length - 1;
  });
  if (tc.length) tells.push(flag("tells", "title case headers", tc.length, `TITLE CASE HEADERS x${tc.length} (use sentence case): ${pyRepr(tc.slice(0, 3))}`));
  const ch = heads.filter((h) => h.includes(":"));
  if (ch.length) tells.push(flag("tells", "colon headers", ch.length, `COLON HEADERS x${ch.length}: ${pyRepr(ch.slice(0, 3))}`));
  const xy = heads.filter((h) => /^[A-Za-z]+ (?:and|&) [A-Za-z]+$/.test(h.trim()));
  if (xy.length >= 2) tells.push(flag("tells", "'x and y' headers", xy.length, `'X AND Y' HEADERS x${xy.length}: ${pyRepr(xy.slice(0, 3))}`));

  const lines = body.split(/\r\n|\r|\n/);
  let empty = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].startsWith("#")) continue;
    const level = lines[i].length - lines[i].replace(/^#+/, "").length;
    const next = lines.slice(i + 1).find((l) => l.trim()) ?? "";
    if (next.startsWith("#".repeat(level + 1))) empty++;
  }
  if (empty) tells.push(flag("tells", "heading with only subheadings", empty, `HEADING WITH ONLY SUBHEADINGS x${empty}`));

  const breaks = [...body.matchAll(/^(?:---|\*\*\*|___)\s*$/gm)].length;
  if (breaks >= 4) tells.push(flag("tells", "thematic break between sections", breaks, `THEMATIC BREAK BETWEEN SECTIONS x${breaks} (fine for Growth Brief essay separators)`));

  const wc = pySplit(body).length;
  const bold = [...body.matchAll(/\*\*[^*]+\*\*/g)].length;
  if (wc && (bold / wc) * 300 > 2) tells.push(flag("tells", "bold density", bold, `BOLD DENSITY ${bold} in ${wc} words`));
  if (opts.email && /^#|\*\*|^\s*[-*] /m.test(body)) hard.push(flag("hard", "markdown in email", 1, "MARKDOWN IN EMAIL (renders as symbols)"));
  const tri = findCount("\\b[\\w'-]+, [\\w'-]+,? and [\\w'-]+\\b", body);
  if (wc && (tri / wc) * 1000 > 6) tells.push(flag("tells", "rule of three", tri, `RULE OF THREE ${tri} in ${wc} words`));

  const s = sentences(body);
  if (s.length >= 12) {
    const lens = s.map((x) => pySplit(x).length);
    const band = lens.filter((l) => l >= 14 && l <= 24).length / lens.length;
    const short = lens.filter((l) => l <= 6).length / lens.length;
    if (band > 0.55) tells.push(flag("tells", "sentence monotony", 1, `SENTENCE MONOTONY ${pct(band)} in the 14-24 word band`));
    if (short < 0.08) tells.push(flag("tells", "few short sentences", 1, `FEW SHORT SENTENCES (${pct(short)} at 6 words or fewer)`));
  }

  return { flags: [...hard, ...tells], words: wc };
}
