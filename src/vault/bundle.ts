// What goes into the person's folder: one readable Markdown file per worksheet, plus one
// answers file the app can reopen. Pure functions, so they're tested without a browser.

import { WORKSHEETS, worksheetById } from "@/worksheets";
import { fieldsOf } from "@/worksheets/types";
import { fileNameFor, renderMarkdown } from "@/worksheets/render";
import type { StoredWorksheet } from "./storage";

export const ANSWERS_PATH = ".workbook/answers.json";
const FORMAT = "workbook-answers";
const MAX_ANSWER_CHARS = 20_000;

export type FileMap = Record<string, string>;

export function buildBundle(records: StoredWorksheet[], now = new Date()): FileMap {
  const day = now.toISOString().slice(0, 10);
  const files: FileMap = {};
  for (const r of records) {
    const ws = worksheetById(r.id);
    if (ws) files[fileNameFor(ws)] = renderMarkdown(ws, r.answers, day);
  }
  const payload = {
    format: FORMAT,
    version: 1,
    exportedAt: now.toISOString(),
    worksheets: Object.fromEntries(records.map((r) => [r.id, { answers: r.answers, updatedAt: r.updatedAt }])),
  };
  files[ANSWERS_PATH] = JSON.stringify(payload, null, 2);
  return files;
}

function promptKeys(id: string): Set<string> {
  return new Set(fieldsOf(worksheetById(id)!).map((f) => f.key));
}

// Reads an answers file back in. Strict: unknown worksheets, unknown prompts, or non-text
// values are dropped, so a stray or tampered file can't put anything odd into the app.
export function parseBundle(text: string): { records: StoredWorksheet[]; skipped: number } {
  const data = JSON.parse(text);
  if (data?.format !== FORMAT || data?.version !== 1 || typeof data.worksheets !== "object") {
    throw new Error("This doesn't look like a workbook answers file.");
  }
  const known = new Set(WORKSHEETS.map((w) => w.id));
  const records: StoredWorksheet[] = [];
  let skipped = 0;
  for (const [id, entry] of Object.entries<any>(data.worksheets)) {
    if (!known.has(id) || typeof entry?.answers !== "object") {
      skipped++;
      continue;
    }
    const allowed = promptKeys(id);
    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(entry.answers)) {
      if (allowed.has(k) && typeof v === "string" && v.length <= MAX_ANSWER_CHARS) answers[k] = v;
      else skipped++;
    }
    const updatedAt = typeof entry.updatedAt === "string" && !isNaN(Date.parse(entry.updatedAt)) ? entry.updatedAt : new Date().toISOString();
    records.push({ id, answers, updatedAt, savedToFolderAt: updatedAt });
  }
  return { records, skipped };
}
