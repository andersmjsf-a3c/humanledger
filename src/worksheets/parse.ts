// Turns one workbook draft (the compounding-ai-workbook skill's Markdown) into a Worksheet.
// Rules, so the drafts stay the single source:
//   - a line that is only "_____" under a numbered question is that question's answer field
//   - a "- " bullet containing "_____" becomes a labeled field (text before the blank is the label)
//   - "( )" on such a bullet is a small extra field
//   - a table cell that is "_____" becomes a field for that row
//   - a numbered question with no blank gets a "Done" checkbox
//   - underscores inside a sentence ("I will ______ instead") are part of the question, not a field

import { marked } from "marked";
import type { Field, FieldKind, Segment, Worksheet } from "./types";

const BLANK_LINE = /^_{3,}$/;
const BLANK = /_{5}/g;
const NUMBER_WORDS: Record<string, number> = {
  five: 5, ten: 10, fifteen: 15, twenty: 20, "twenty-five": 25, thirty: 30, forty: 40, "forty-five": 45, sixty: 60,
};

export const slug = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[`*_]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-$/, "") || "x";

const md = (s: string) => marked.parse(s.trim(), { async: false, gfm: true }) as string;

// [MARK: ...] brackets show in the brand's flag color so nobody mistakes them for finished text.
function flagBrackets(html: string): string {
  return html
    .replace(/<code>(\[MARK:[^<]*\])<\/code>/g, '<span class="bracket">$1</span>')
    .replace(/(?<!>)(\[MARK:[^\]<]*\])/g, '<span class="bracket">$1</span>');
}
const html = (s: string) => flagBrackets(md(s));

// Split on "## " headings, but not inside ``` fences: example skills carry their own ## headings.
function sections(text: string): Record<string, string> {
  const out: Record<string, string> = { _head: "" };
  let key = "_head";
  let fenced = false;
  for (const line of text.split("\n")) {
    if (/^```/.test(line)) fenced = !fenced;
    const h = !fenced && line.match(/^## (.+)$/);
    if (h) {
      key = h[1].trim();
      out[key] = "";
      continue;
    }
    out[key] += line + "\n";
  }
  return out;
}

function kindFor(expected?: string): FieldKind {
  if (!expected) return "short";
  return /\b(two|three|four|five|lines|sentences|paragraph)\b/i.test(expected) && !/^one line/i.test(expected) ? "long" : "short";
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim());
}

function parseTable(lines: string[], id: string): Segment | null {
  const rows = lines.filter((l) => l.trim().startsWith("|"));
  if (rows.length < 3) return null;
  const header = splitRow(rows[0]);
  const body = rows.slice(2).map(splitRow);
  const blankCol = body.length ? body[0].findIndex((c) => BLANK_LINE.test(c)) : -1;
  if (blankCol < 0) return null;
  return {
    type: "table",
    id,
    html: "",
    header,
    blankCol,
    rows: body.map((cells) => ({
      cells: cells.map((c) => (BLANK_LINE.test(c) ? "" : (md(c).replace(/^<p>|<\/p>\s*$/g, "")))),
      field: BLANK_LINE.test(cells[blankCol] ?? "") ? { key: `${slug(header[0])}.${slug(cells[0])}`, label: cells[0], kind: "short" as FieldKind } : undefined,
    })),
  };
}

function parseItem(n: number, lines: string[]): Segment {
  const raw: { label?: string; kind: FieldKind }[] = [];
  const fields: Field[] = [];
  const body: string[] = [];
  let bulletFields = 0;
  let plainBlanks = 0;

  for (const line of lines) {
    const t = line.trim();
    if (BLANK_LINE.test(t)) {
      plainBlanks++;
      continue;
    }
    if (/^(-|\d+\.)\s/.test(t) && (t.includes("_____") || t.includes("( )"))) {
      bulletFields++;
      const label = t.replace(/^(-|\d+\.)\s+/, "").split("_____")[0].replace(/[:\s]+$/, "").trim();
      const blanks = (t.match(BLANK) ?? []).length;
      for (let b = 0; b < blanks; b++) raw.push({ label: label || `Item ${bulletFields}`, kind: "short" });
      if (t.includes("( )")) raw.push({ label: `Item ${bulletFields}, mark`, kind: "short" });
      continue;
    }
    body.push(line);
  }

  const text = body.join("\n").trim();
  const question = (text.match(/^\*\*(.+?)\*\*/)?.[1] ?? text.split("\n")[0]).replace(/[.:]$/, "");
  const firstPara = text.split(/\n\s*\n/)[0].replace(/\n/g, " ");
  const lastPara = text.split(/\n\s*\n/).at(-1)!.replace(/\n/g, " ");
  const lengthHint = [...firstPara.matchAll(/\(([^()]*\b(?:lines?|sentences?|words?)\b[^()]*)\)/gi)].at(-1)?.[1];
  const expected = ((lastPara.match(/\(([^()]+)\)\s*$/) ?? firstPara.match(/\(([^()]+)\)\s*$/))?.[1] ?? lengthHint)?.replace(/\.$/, "");
  // With no stated length, a paragraph-sized ask still gets a big box.
  const sizeHint = expected ?? (/\b(paragraph|\d+ to \d+ words|one or two lines|two or three|a sentence each)\b/i.test(firstPara) ? "two lines" : undefined);

  // Answer keys follow the question, not its position, so inserting or reordering questions in
  // the workbook never attaches a saved answer to the wrong question. Rewording the bold question
  // changes its key; the importer reports that, because readers' saved answers won't carry over.
  const base = slug(question);
  for (let i = 0; i < plainBlanks; i++) raw.push({ kind: kindFor(sizeHint) });
  if (!raw.length) raw.push({ kind: "check", label: "Done" });
  const used = new Set<string>();
  for (const [i, r] of raw.entries()) {
    let key = raw.length === 1 ? base : `${base}.${r.label ? slug(r.label) : i + 1}`;
    while (used.has(key)) key += "-2";
    used.add(key);
    fields.push({ key, kind: r.kind, ...(r.label ? { label: r.label } : {}) });
  }

  return { type: "item", n, question, html: html(text), expected, fields };
}

function parseYourTurn(text: string): { segments: Segment[]; howTo?: string } {
  const howAt = text.search(/^\*How to:/m);
  const howTo = howAt >= 0 ? text.slice(howAt).trim() : undefined;
  const lines = (howAt >= 0 ? text.slice(0, howAt) : text).split("\n");

  const segments: Segment[] = [];
  let loose: string[] = [];
  let tables = 0;

  const flushLoose = () => {
    const block = loose.join("\n").trim();
    loose = [];
    if (!block) return;
    // A loose table with blanks is a fill-in table; anything else is prose.
    const tableLines = block.split("\n").filter((l) => l.trim().startsWith("|"));
    if (tableLines.length) {
      const before = block.slice(0, block.indexOf(tableLines[0])).trim();
      const after = block.slice(block.lastIndexOf(tableLines.at(-1)!) + tableLines.at(-1)!.length).trim();
      const table = parseTable(tableLines, `t${++tables}`);
      if (table) {
        if (before) segments.push({ type: "md", html: html(before) });
        segments.push(table);
        if (after) segments.push({ type: "md", html: html(after) });
        return;
      }
    }
    segments.push({ type: "md", html: html(block) });
  };

  let i = 0;
  let fenced = false;
  while (i < lines.length) {
    if (/^```/.test(lines[i])) fenced = !fenced;
    const m = !fenced && lines[i].match(/^(\d+)\.\s+(.*)$/);
    if (!m) {
      loose.push(lines[i++]);
      continue;
    }
    flushLoose();
    const n = Number(m[1]);
    const item = [m[2]];
    i++;
    while (i < lines.length && (lines[i].trim() === "" || /^ {2,}/.test(lines[i]))) {
      item.push(lines[i].replace(/^ {3}/, ""));
      i++;
    }
    segments.push(parseItem(n, item));
  }
  flushLoose();
  return { segments, howTo };
}

export function parseWorksheet(text: string, source: string): Worksheet {
  const h1 = text.match(/^# WS ([0-9A-C]+\.?\d*)\.\s+(.+)$/m);
  if (!h1) throw new Error(`${source}: first line must be "# WS <id>. <title>"`);
  const [, id, title] = h1;
  const s = sections(text);
  // Service versions say "An example" (a labeled illustration); the book's drafts said "Mark's example".
  const exampleKey = ["An example", "Mark's example"].find((k) => k in s);
  for (const need of ["Why this matters", "Your turn", "Why this compounds"]) {
    if (!(need in s)) throw new Error(`${source}: missing "## ${need}"`);
  }
  if (!exampleKey) throw new Error(`${source}: missing "## An example"`);
  const version2Key = Object.keys(s).find((k) => /^Version 2\b/.test(k));
  const promiseText = s._head.replace(/^# .*$/m, "").trim();
  const minutesWord = promiseText.match(/\b([A-Za-z-]+|\d+) minutes\b/i)?.[1]?.toLowerCase();
  const minutes = minutesWord ? (Number(minutesWord) || NUMBER_WORDS[minutesWord]) : undefined;
  const { segments, howTo } = parseYourTurn(s["Your turn"]);
  const slug = source.replace(/^.*\//, "").replace(/^ws[A-C]?\d+-/, "").replace(/\.md$/, "");

  return {
    id,
    part: (/^[ABC]/.test(id) ? id[0] : "0") as Worksheet["part"],
    slug,
    title,
    promiseText,
    promiseHtml: html(promiseText),
    minutes,
    whyHtml: html(s["Why this matters"]),
    exampleHeading: exampleKey,
    exampleHtml: html(s[exampleKey]),
    yourTurn: segments,
    howToHtml: howTo ? html(howTo) : undefined,
    ...(version2Key ? { version2Heading: version2Key, version2Html: html(s[version2Key]) } : {}),
    compoundsHtml: html(s["Why this compounds"]),
    draft: text.includes("[MARK:"),
    source,
  };
}
