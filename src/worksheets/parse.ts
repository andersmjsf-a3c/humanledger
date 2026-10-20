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

const md = (s: string) => marked.parse(s.trim(), { async: false, gfm: true }) as string;

// [MARK: ...] brackets show in the brand's flag color so nobody mistakes them for finished text.
function flagBrackets(html: string): string {
  return html
    .replace(/<code>(\[MARK:[^<]*\])<\/code>/g, '<span class="bracket">$1</span>')
    .replace(/(?<!>)(\[MARK:[^\]<]*\])/g, '<span class="bracket">$1</span>');
}
const html = (s: string) => flagBrackets(md(s));

function sections(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = text.split(/^## /m);
  out._head = parts[0];
  for (const p of parts.slice(1)) {
    const nl = p.indexOf("\n");
    out[p.slice(0, nl).trim()] = p.slice(nl + 1);
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
    rows: body.map((cells, r) => ({
      cells: cells.map((c) => (BLANK_LINE.test(c) ? "" : (md(c).replace(/^<p>|<\/p>\s*$/g, "")))),
      field: BLANK_LINE.test(cells[blankCol] ?? "") ? { key: `${id}.${r + 1}`, label: cells[0], kind: "short" as FieldKind } : undefined,
    })),
  };
}

function parseItem(n: number, lines: string[]): Segment {
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
    if (/^- /.test(t) && (t.includes("_____") || t.includes("( )"))) {
      bulletFields++;
      const label = t.replace(/^- /, "").split("_____")[0].replace(/[:\s]+$/, "").trim();
      const blanks = (t.match(BLANK) ?? []).length;
      for (let b = 0; b < blanks; b++) {
        fields.push({ key: `q${n}.${fields.length + 1}`, label: label || `Item ${bulletFields}`, kind: "short" });
      }
      if (t.includes("( )")) fields.push({ key: `q${n}.${fields.length + 1}`, label: `Item ${bulletFields}, mark`, kind: "short" });
      continue;
    }
    body.push(line);
  }

  const text = body.join("\n").trim();
  const question = (text.match(/^\*\*(.+?)\*\*/)?.[1] ?? text.split("\n")[0]).replace(/[.:]$/, "");
  const firstPara = text.split(/\n\s*\n/)[0].replace(/\n/g, " ");
  const lastPara = text.split(/\n\s*\n/).at(-1)!.replace(/\n/g, " ");
  const expected = (lastPara.match(/\(([^()]+)\)\s*$/) ?? firstPara.match(/\(([^()]+)\)\s*$/))?.[1]?.replace(/\.$/, "");

  for (let i = 0; i < plainBlanks; i++) {
    const key = plainBlanks === 1 && !fields.length ? `q${n}` : `q${n}.${fields.length + 1}`;
    fields.push({ key, kind: kindFor(expected) });
  }
  if (!fields.length) fields.push({ key: `q${n}`, kind: "check", label: "Done" });

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
  while (i < lines.length) {
    const m = lines[i].match(/^(\d+)\.\s+(.*)$/);
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
  for (const need of ["Why this matters", "Mark's example", "Your turn", "Why this compounds"]) {
    if (!(need in s)) throw new Error(`${source}: missing "## ${need}"`);
  }
  const promiseText = s._head.replace(/^# .*$/m, "").trim();
  const minutesWord = promiseText.match(/\b([A-Za-z-]+|\d+) minutes\b/i)?.[1]?.toLowerCase();
  const minutes = minutesWord ? (Number(minutesWord) || NUMBER_WORDS[minutesWord]) : undefined;
  const { segments, howTo } = parseYourTurn(s["Your turn"]);
  const slug = source.replace(/^.*\//, "").replace(/^ws\d+-/, "").replace(/\.md$/, "");

  return {
    id,
    part: (/^[ABC]/.test(id) ? id[0] : "0") as Worksheet["part"],
    slug,
    title,
    promiseText,
    promiseHtml: html(promiseText),
    minutes,
    whyHtml: html(s["Why this matters"]),
    exampleHtml: html(s["Mark's example"]),
    yourTurn: segments,
    howToHtml: howTo ? html(howTo) : undefined,
    compoundsHtml: html(s["Why this compounds"]),
    draft: text.includes("[MARK:"),
    source,
  };
}
