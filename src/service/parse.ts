import { marked } from "marked";
import { slug as slugify } from "@/worksheets/parse";
import type { DoPage, GlossaryTerm, PromptPart } from "./types";

const md = (s: string) => (s.trim() ? (marked.parse(s.trim(), { async: false, gfm: true }) as string) : "");

function frontmatter(text: string): { meta: Record<string, string | string[]>; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("missing frontmatter");
  const meta: Record<string, string | string[]> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    meta[kv[1]] = v.startsWith("[")
      ? v.slice(1, -1).split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean)
      : v;
  }
  return { meta, body: text.slice(m[0].length) };
}

function splitSections(body: string): { heading: string; text: string }[] {
  const out: { heading: string; text: string }[] = [];
  for (const chunk of body.split(/^## /m).slice(1)) {
    const nl = chunk.indexOf("\n");
    out.push({ heading: chunk.slice(0, nl).trim(), text: chunk.slice(nl + 1) });
  }
  return out;
}

export function promptParts(prompt: string): PromptPart[] {
  const parts: PromptPart[] = [];
  let last = 0;
  for (const m of prompt.matchAll(/\[([^\]]+)\]/g)) {
    if (m.index! > last) parts.push({ text: prompt.slice(last, m.index) });
    parts.push({ blank: m[1] });
    last = m.index! + m[0].length;
  }
  if (last < prompt.length) parts.push({ text: prompt.slice(last) });
  return parts;
}

export function parseDoPage(text: string, source: string): DoPage {
  const { meta, body } = frontmatter(text);
  const secs = splitSections(body);
  const find = (h: string) => secs.find((s) => s.heading.toLowerCase() === h.toLowerCase());
  const rule = find("The rule");
  const tryIt = find("Try it now");
  const keep = find("Keep this");
  if (!rule || !tryIt || !keep) throw new Error(`${source}: needs The rule, Try it now, and Keep this`);

  const lines = tryIt.text.split("\n");
  const first = lines.findIndex((l) => l.startsWith(">"));
  if (first < 0) throw new Error(`${source}: Try it now has no prompt to paste`);
  let end = first;
  while (end < lines.length && lines[end].startsWith(">")) end++;
  const prompt = lines.slice(first, end).map((l) => l.replace(/^>\s?/, "")).join("\n").trim();

  const n = Number(source.match(/(\d+)-[^/]*\.md$/)?.[1] ?? 0);
  return {
    n,
    slug: String(meta.slug),
    title: String(meta.title),
    summary: String(meta.summary ?? ""),
    worksheets: (meta.worksheets as string[]) ?? [],
    glossary: (meta.glossary as string[]) ?? [],
    persona: String(meta.persona ?? ""),
    ruleHtml: md(rule.text),
    tryIt: { beforeHtml: md(lines.slice(0, first).join("\n")), prompt: promptParts(prompt), afterHtml: md(lines.slice(end).join("\n")) },
    sections: secs.filter((s) => ![rule, tryIt, keep].includes(s)).map((s) => ({ heading: s.heading, html: md(s.text) })),
    keepHtml: md(keep.text),
    source,
  };
}

// The glossary table: | Term | Plain meaning | Chapter |. The chapter column is the book's and is left out.
// A plain term gets the plain slug ("Brief" -> brief); a qualified one ("Brief (or spec)") gets it
// only if no plain term claimed it, else the full form ("brief-or-spec").
export function parseGlossary(text: string): GlossaryTerm[] {
  // Rows written for the book ("this book recommends") stay in the book edition.
  const rows = text
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l))
    .slice(1)
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter(([, def]) => !/\bthis book\b/i.test(def));
  const base = (term: string) => slugify(term.replace(/\s*\(.*?\)\s*/g, " ").replace(/^the\s+/i, ""));
  const plain = new Set(rows.filter(([t]) => !t.includes("(")).map(([t]) => base(t)));
  const seen = new Set<string>();
  const terms = rows.map(([term, def]) => {
    let s = base(term);
    if (term.includes("(") && plain.has(s)) s = slugify(term);
    if (seen.has(s)) throw new Error(`glossary: two terms would share the slug ${s}`);
    seen.add(s);
    return { slug: s, term, definitionText: def, definitionHtml: (marked.parseInline(def, { async: false }) as string) };
  });
  return terms.sort((a, b) => a.term.localeCompare(b.term));
}

// Homepage tiles, from homepage-copy.md: "1. Title (what it covers)".
export function parseTiles(text: string): { n: number; title: string; covers: string }[] {
  return [...text.matchAll(/^(\d+)\. (.+?) \((.+)\)\s*$/gm)].map((m) => ({ n: Number(m[1]), title: m[2], covers: m[3] }));
}
