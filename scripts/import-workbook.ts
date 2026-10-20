// The workbook skill is the master; this site reads from it (Mark, Oct 20 2026).
// When a worksheet is revised, the handoff is the compounding-ai-workbook .skill file:
//
//   npm run import:workbook -- path/to/compounding-ai-workbook.skill
//
// It copies references/drafts/*.md into content/workbook/<part>/ unchanged, records where they
// came from in content/workbook/SOURCE.json, regenerates the pages' data, and reports what
// changed, including any answer keys that moved (readers' saved answers to those won't carry over).
// Nothing is written unless every draft in the file parses.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { parseWorksheet } from "../src/worksheets/parse";
import { fieldsOf, type Worksheet } from "../src/worksheets/types";
import { buildAll } from "./build-worksheets";

const sha = (b: Uint8Array | string) => createHash("sha256").update(b).digest("hex");
const partDir = (id: string) => `part${/^[ABC]/.test(id) ? id[0] : "0"}`;

export interface ImportReport {
  skillSha256: string;
  added: string[];
  changed: { id: string; keysRemoved: string[]; keysAdded: string[] }[];
  removed: string[];
  unchanged: string[];
}

export function importSkill(
  bytes: Uint8Array,
  opts: { contentRoot?: string; generatedPath?: string; now?: Date } = {},
): ImportReport {
  const root = opts.contentRoot ?? "content/workbook";
  const generatedPath = opts.generatedPath ?? "src/worksheets/generated/worksheets.json";
  const entries = unzipSync(bytes);

  const skillMd = Object.entries(entries).find(([p]) => /(^|\/)SKILL\.md$/.test(p));
  if (!skillMd || !/^name:\s*"?compounding-ai-workbook"?\s*$/m.test(strFromU8(skillMd[1]))) {
    throw new Error("This isn't the compounding-ai-workbook skill (SKILL.md name doesn't match).");
  }

  const drafts = Object.entries(entries)
    .map(([p, b]) => ({ m: p.match(/(?:^|\/)references\/drafts\/(ws[^/]+\.md)$/), b }))
    .filter((d) => d.m)
    .map((d) => ({ file: d.m![1], text: strFromU8(d.b) }));
  if (!drafts.length) throw new Error("No worksheet drafts found under references/drafts/.");

  // Parse everything first; a broken draft stops the import before any file is touched.
  const incoming = drafts.map((d) => {
    const ws = parseWorksheet(d.text, `${root}/x/${d.file}`);
    return { ...d, ws, path: `${root}/${partDir(ws.id)}/${d.file}` };
  });
  const ids = incoming.map((i) => i.ws.id);
  if (new Set(ids).size !== ids.length) throw new Error(`Two drafts share a worksheet id: ${ids.join(", ")}`);

  const before = new Map<string, Worksheet>(
    existsSync(generatedPath) ? (JSON.parse(readFileSync(generatedPath, "utf8")) as Worksheet[]).map((w) => [w.id, w]) : [],
  );

  // Replace the drafts: the skill's set is the whole set.
  if (existsSync(root)) {
    for (const part of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      for (const f of readdirSync(join(root, part.name)).filter((f) => /^ws.*\.md$/.test(f))) rmSync(join(root, part.name, f));
    }
  }
  for (const i of incoming) {
    mkdirSync(join(i.path, ".."), { recursive: true });
    writeFileSync(i.path, i.text);
  }

  const skillSha256 = sha(bytes);
  writeFileSync(
    join(root, "SOURCE.json"),
    JSON.stringify(
      {
        skill: "compounding-ai-workbook",
        skillSha256,
        importedAt: (opts.now ?? new Date()).toISOString(),
        files: Object.fromEntries(incoming.map((i) => [i.path.slice(root.length + 1), sha(i.text)]).sort()),
      },
      null,
      2,
    ) + "\n",
  );

  const after = buildAll(root);
  writeFileSync(generatedPath, JSON.stringify(after, null, 2) + "\n");

  const report: ImportReport = { skillSha256, added: [], changed: [], removed: [], unchanged: [] };
  for (const w of after) {
    const old = before.get(w.id);
    if (!old) report.added.push(w.id);
    else if (JSON.stringify(old) === JSON.stringify(w)) report.unchanged.push(w.id);
    else {
      const o = new Set(fieldsOf(old).map((f) => f.key));
      const n = new Set(fieldsOf(w).map((f) => f.key));
      report.changed.push({ id: w.id, keysRemoved: [...o].filter((k) => !n.has(k)), keysAdded: [...n].filter((k) => !o.has(k)) });
    }
  }
  report.removed = [...before.keys()].filter((id) => !after.some((w) => w.id === id));
  return report;
}

if (process.argv[1]?.endsWith("import-workbook.ts")) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run import:workbook -- path/to/compounding-ai-workbook.skill");
    process.exit(2);
  }
  const r = importSkill(new Uint8Array(readFileSync(file)));
  console.log(`Imported compounding-ai-workbook (sha256 ${r.skillSha256.slice(0, 12)})`);
  console.log(`  unchanged: ${r.unchanged.join(", ") || "none"}`);
  console.log(`  added:     ${r.added.join(", ") || "none"}`);
  console.log(`  removed:   ${r.removed.join(", ") || "none"}`);
  for (const c of r.changed) {
    console.log(`  changed:   ${c.id}`);
    if (c.keysRemoved.length) console.log(`    answers that won't carry over (question reworded or removed): ${c.keysRemoved.join(", ")}`);
    if (c.keysAdded.length) console.log(`    new answer fields: ${c.keysAdded.join(", ")}`);
  }
  console.log("Review with `git diff`, run `npm run check`, then commit.");
}
