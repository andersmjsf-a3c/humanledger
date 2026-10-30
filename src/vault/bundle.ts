// What goes into the person's folder: one readable Markdown file per worksheet, one SKILL.md per
// skill they've started (ready to upload), and one answers file the app can reopen. Pure functions.

import { WORKSHEETS, worksheetById } from "@/worksheets";
import { fieldsOf } from "@/worksheets/types";
import { fileNameFor, renderMarkdown } from "@/worksheets/render";
import { TEMPLATES, templateById } from "@/skills";
import { skillFile } from "@/skills/render";
import { SHARED_NAME } from "@/skills/parse";
import { SHARED_ID, SKILL_PREFIX, STARTER_PREFIX, type StoredWorksheet } from "./storage";
import { STARTERS, starterById } from "@/service";
import { fillStarter, type Starter, type StarterAnswers } from "@/starters/fill";

export const ANSWERS_PATH = ".workbook/answers.json";
const FORMAT = "workbook-answers";
const MAX_ANSWER_CHARS = 20_000;

export type FileMap = Record<string, string>;

const isSkill = (id: string) => id.startsWith(SKILL_PREFIX) && id !== SHARED_ID;
const hasText = (a: Record<string, string>) => Object.values(a).some((v) => v.trim());

export function sharedOf(records: StoredWorksheet[]): Record<string, string> {
  return records.find((r) => r.id === SHARED_ID)?.answers ?? {};
}

// The finished file for one skill record, with the shared name merged in.
export function skillFileFor(rec: StoredWorksheet, shared: Record<string, string>) {
  const t = templateById(rec.id.slice(SKILL_PREFIX.length));
  return t ? skillFile(t, { ...shared, ...rec.answers }) : undefined;
}

const isStarter = (id: string) => id.startsWith(STARTER_PREFIX) && !!starterById(id.slice(STARTER_PREFIX.length));

// Stored answers (flat, list items as key.1..key.3) to the shape a starter fills from, and back.
export function starterAnswersOf(s: Starter, flat: Record<string, string>): StarterAnswers {
  return Object.fromEntries(s.questions.map((q) => [q.key, q.type === "list3" ? [1, 2, 3].map((i) => flat[`${q.key}.${i}`] ?? "") : flat[q.key] ?? ""]));
}
export function flatStarterAnswers(a: StarterAnswers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) {
    if (Array.isArray(v)) v.forEach((x, i) => (out[`${k}.${i + 1}`] = x));
    else out[k] = v;
  }
  return out;
}
const starterKeys = (s: Starter) => new Set(s.questions.flatMap((q) => (q.type === "list3" ? [1, 2, 3].map((i) => `${q.key}.${i}`) : [q.key])));

export function starterFileFor(rec: StoredWorksheet) {
  const s = starterById(rec.id.slice(STARTER_PREFIX.length));
  return s ? { path: `skills/${s.id}/SKILL.md`, content: fillStarter(s, starterAnswersOf(s, rec.answers)) } : undefined;
}

export function buildBundle(records: StoredWorksheet[], now = new Date()): FileMap {
  const day = now.toISOString().slice(0, 10);
  const shared = sharedOf(records);
  const files: FileMap = {};
  for (const r of records) {
    const ws = worksheetById(r.id);
    if (ws) files[fileNameFor(ws)] = renderMarkdown(ws, r.answers, day);
    if (isSkill(r.id) && hasText(r.answers)) {
      const f = skillFileFor(r, shared);
      if (f) files[f.path] = f.content;
    }
    if (isStarter(r.id) && hasText(r.answers)) {
      const f = starterFileFor(r)!;
      files[f.path] = f.content;
    }
  }
  const pick = (r: StoredWorksheet) => ({ answers: r.answers, updatedAt: r.updatedAt, ...(r.version ? { version: r.version } : {}) });
  const payload = {
    format: FORMAT,
    version: 1,
    exportedAt: now.toISOString(),
    worksheets: Object.fromEntries(records.filter((r) => worksheetById(r.id)).map((r) => [r.id, pick(r)])),
    skills: Object.fromEntries(records.filter((r) => isSkill(r.id)).map((r) => [r.id.slice(SKILL_PREFIX.length), pick(r)])),
    shared: { answers: shared },
    starters: Object.fromEntries(records.filter((r) => isStarter(r.id)).map((r) => [r.id.slice(STARTER_PREFIX.length), pick(r)])),
  };
  files[ANSWERS_PATH] = JSON.stringify(payload, null, 2);
  return files;
}

function allowedKeys(kind: "worksheet" | "skill", id: string): Set<string> {
  if (kind === "worksheet") return new Set(fieldsOf(worksheetById(id)!).map((f) => f.key));
  return new Set(templateById(id)!.fields.map((f) => f.key).filter((k) => k !== SHARED_NAME));
}

function cleanAnswers(raw: any, allowed: Set<string>): { answers: Record<string, string>; skipped: number } {
  const answers: Record<string, string> = {};
  let skipped = 0;
  for (const [k, v] of Object.entries(raw ?? {})) {
    if (allowed.has(k) && typeof v === "string" && v.length <= MAX_ANSWER_CHARS) answers[k] = v;
    else skipped++;
  }
  return { answers, skipped };
}

const validTime = (s: any) => (typeof s === "string" && !isNaN(Date.parse(s)) ? s : new Date().toISOString());

// Reads an answers file back in. Strict: unknown worksheets, skills, or fields, and non-text values,
// are dropped, so a stray or tampered file can't put anything odd into the app.
export function parseBundle(text: string): { records: StoredWorksheet[]; skipped: number } {
  const data = JSON.parse(text);
  if (data?.format !== FORMAT || data?.version !== 1 || typeof data.worksheets !== "object") {
    throw new Error("This doesn't look like a workbook answers file.");
  }
  const knownWs = new Set(WORKSHEETS.map((w) => w.id));
  const knownSkills = new Set(TEMPLATES.map((t) => t.id));
  const records: StoredWorksheet[] = [];
  let skipped = 0;

  for (const [id, entry] of Object.entries<any>(data.worksheets)) {
    if (!knownWs.has(id) || typeof entry?.answers !== "object") { skipped++; continue; }
    const c = cleanAnswers(entry.answers, allowedKeys("worksheet", id));
    skipped += c.skipped;
    const at = validTime(entry.updatedAt);
    records.push({ id, answers: c.answers, updatedAt: at, savedToFolderAt: at });
  }
  for (const [id, entry] of Object.entries<any>(data.skills ?? {})) {
    if (!knownSkills.has(id) || typeof entry?.answers !== "object") { skipped++; continue; }
    const c = cleanAnswers(entry.answers, allowedKeys("skill", id));
    skipped += c.skipped;
    const at = validTime(entry.updatedAt);
    const version = Number.isInteger(entry.version) && entry.version > 0 && entry.version < 10_000 ? entry.version : undefined;
    records.push({ id: SKILL_PREFIX + id, answers: c.answers, updatedAt: at, savedToFolderAt: at, ...(version ? { version } : {}) });
  }
  for (const [id, entry] of Object.entries<any>(data.starters ?? {})) {
    const s = STARTERS.find((x) => x.id === id);
    if (!s || typeof entry?.answers !== "object") { skipped++; continue; }
    const c = cleanAnswers(entry.answers, starterKeys(s));
    skipped += c.skipped;
    const at = validTime(entry.updatedAt);
    const version = Number.isInteger(entry.version) && entry.version > 0 && entry.version < 10_000 ? entry.version : undefined;
    records.push({ id: STARTER_PREFIX + id, answers: c.answers, updatedAt: at, savedToFolderAt: at, ...(version ? { version } : {}) });
  }
  if (data.shared?.answers) {
    const c = cleanAnswers(data.shared.answers, new Set([SHARED_NAME]));
    skipped += c.skipped;
    if (Object.keys(c.answers).length) {
      const at = new Date().toISOString();
      records.push({ id: SHARED_ID, answers: c.answers, updatedAt: at, savedToFolderAt: at });
    }
  }
  return { records, skipped };
}

// Small, synchronous fingerprint for "did this skill file change since last time?" (not security).
export function fingerprint(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

// Before a save or download: bump the local version of any skill whose file changed.
export function bumpVersions(records: StoredWorksheet[]): StoredWorksheet[] {
  const shared = sharedOf(records);
  const changed: StoredWorksheet[] = [];
  for (const r of records.filter((r) => (isSkill(r.id) || isStarter(r.id)) && hasText(r.answers))) {
    const f = isStarter(r.id) ? starterFileFor(r) : skillFileFor(r, shared);
    if (!f) continue;
    const h = fingerprint(f.content);
    if (h !== r.exportedHash) changed.push({ ...r, version: (r.version ?? 0) + 1, exportedHash: h });
  }
  return changed;
}
