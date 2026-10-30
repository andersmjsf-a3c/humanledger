// The workbook skill is the master; this site reads from it (Mark, Oct 20 2026).
//
//   npm run import:workbook -- path/to/human-led-service.skill         (the service worksheets + content front end)
//   npm run import:workbook -- path/to/compounding-ai-workbook.skill --only=templates   (skill templates)
//   npm run import:workbook -- path/to/partA-drafts.zip                 (just the worksheets inside)
//
// Options:
//   --only=drafts | --only=templates   take just one half of a .skill file
//   --allow-remove                     let a .skill file remove worksheets it no longer has
//
// A .skill file is the complete set: its references/drafts/ and assets/ replace what's here. If that
// would remove a worksheet the site has (usually because the .skill file is older than a drafts zip
// imported since), the import stops and lists them unless --allow-remove is given.
// A zip of drafts only adds or replaces the worksheets inside it.
// Files are copied unchanged into content/workbook/<part>/ and content/workbook/templates/, hashes
// and history go in content/workbook/SOURCE.json, the pages' data is regenerated, and changes are
// reported, including answer keys that moved. Nothing is written unless every file parses.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { parseWorksheet } from "../src/worksheets/parse";
import { fieldsOf, type Worksheet } from "../src/worksheets/types";
import { parseTemplate } from "../src/skills/parse";
import { buildAll, buildTemplates } from "./build-worksheets";

const sha = (b: Uint8Array | string) => createHash("sha256").update(b).digest("hex");
const partDir = (id: string) => `part${/^[ABC]/.test(id) ? id[0] : "0"}`;

// The human-led-service skill also carries the content front end: the eight pages, the glossary,
// the personas, and the two dated reference files. They go to content/service unchanged.
function copyServiceContent(entries: Record<string, Uint8Array>, serviceRoot: string) {
  const take = (re: RegExp, dir: string) => {
    for (const [p, b] of Object.entries(entries)) {
      const m = p.match(re);
      if (!m) continue;
      mkdirSync(join(serviceRoot, dir), { recursive: true });
      writeFileSync(join(serviceRoot, dir, m[1]), b);
    }
  };
  take(/(?:^|\/)references\/content-do-pages\/((?:\d+-[^/]+|README|homepage-copy|dashboard-spec)\.md)$/, "do");
  take(/(?:^|\/)references\/(glossary\.md|personas\.md)$/, ".");
  take(/(?:^|\/)references\/data\/((?:where-things-live|what-changed)\.json)$/, ".");
  // v2 (Oct 30 2026): the six starters, the homepage reference, and the two pictures.
  take(/(?:^|\/)references\/v2\/starters\/([^/]+\.(?:md|json))$/, "v2/starters");
  take(/(?:^|\/)references\/v2\/((?:README\.md|homepage-v2\.html))$/, "v2");
  // Screenshots and their captions stay in the repo; scripts/build-service.ts serves only the placed ones.
  take(/(?:^|\/)references\/v2\/screenshots\/([^/]+\.(?:png|md))$/, "v2/screenshots");
  for (const [p, b] of Object.entries(entries)) {
    const m = p.match(/(?:^|\/)references\/v2\/illustrations\/([^/]+\.svg)$/);
    if (!m) continue;
    mkdirSync("public/illustrations", { recursive: true });
    writeFileSync(join("public/illustrations", m[1]), b);
  }
}

export interface ImportOptions {
  serviceRoot?: string | null; // where the content front end goes; null skips it (tests)
  contentRoot?: string;
  generatedPath?: string;
  templatesPath?: string;
  now?: Date;
  only?: "drafts" | "templates";
  allowRemove?: boolean;
}

export interface ImportReport {
  source: "skill" | "drafts";
  skillSha256: string;
  added: string[];
  changed: { id: string; keysRemoved: string[]; keysAdded: string[] }[];
  removed: string[];
  unchanged: string[];
  templates: { added: string[]; changed: string[]; removed: string[]; unchanged: string[] };
}

function worksheetFilesOnDisk(root: string): { path: string; id: string }[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^part/.test(d.name))
    .flatMap((d) =>
      readdirSync(join(root, d.name))
        .filter((f) => /^ws.*\.md$/.test(f))
        .map((f) => ({ path: join(root, d.name, f), id: parseWorksheet(readFileSync(join(root, d.name, f), "utf8"), f).id })),
    );
}

export function importSkill(bytes: Uint8Array, opts: ImportOptions = {}): ImportReport {
  const root = opts.contentRoot ?? "content/workbook";
  const generatedPath = opts.generatedPath ?? "src/worksheets/generated/worksheets.json";
  const templatesPath = opts.templatesPath ?? "src/skills/generated/templates.json";
  const entries = Object.fromEntries(Object.entries(unzipSync(bytes)).filter(([p]) => !p.startsWith("__MACOSX/")));

  const skillMd = Object.entries(entries).find(([p]) => /(^|\/)SKILL\.md$/.test(p));
  const isSkill = !!skillMd;
  const skillName = skillMd ? strFromU8(skillMd[1]).match(/^name:\s*"?([\w-]+)"?\s*$/m)?.[1] : undefined;
  if (skillMd && skillName !== "compounding-ai-workbook" && skillName !== "human-led-service") {
    throw new Error("This isn't the compounding-ai-workbook or human-led-service skill (SKILL.md name doesn't match).");
  }
  const isService = skillName === "human-led-service";
  if ((!isSkill || isService) && opts.only === "templates") throw new Error("Templates come only from the compounding-ai-workbook .skill file.");

  // Since Oct 26 2026 the site's worksheets are the company-voice versions from the human-led-service
  // skill. The workbook skill's own drafts (first person, the book's examples) feed the book edition,
  // so a workbook .skill file brings only its templates here.
  const sourcePathEarly = join(root, "SOURCE.json");
  const worksheetsFrom = existsSync(sourcePathEarly) ? JSON.parse(readFileSync(sourcePathEarly, "utf8")).worksheetsFrom : undefined;
  if (isSkill && !isService && worksheetsFrom === "human-led-service" && opts.only !== "templates") {
    throw new Error(
      "The site's worksheets now come from the human-led-service skill. Import this workbook .skill with --only=templates, " +
        "or import the human-led-service .skill for worksheets.",
    );
  }
  const takeDrafts = opts.only !== "templates";
  const takeTemplates = isSkill && !isService && opts.only !== "drafts";

  // Worksheets
  const pattern = isService
    ? /(?:^|\/)references\/worksheets\/(ws[^/]+\.md)$/
    : isSkill
      ? /(?:^|\/)references\/drafts\/(ws[^/]+\.md)$/
      : /(?:^|\/)(ws[^/]+\.md)$/;
  const drafts = takeDrafts
    ? Object.entries(entries)
        .map(([p, b]) => ({ m: p.match(pattern), b }))
        .filter((d) => d.m)
        .map((d) => ({ file: d.m![1], text: strFromU8(d.b) }))
    : [];
  if (takeDrafts && !drafts.length) {
    throw new Error(
      isService ? "No worksheets found under references/worksheets/." : isSkill ? "No worksheet drafts found under references/drafts/." : "No worksheet drafts (ws*.md) found in this zip.",
    );
  }

  // Templates (assets/*.md in the .skill file)
  const templates = takeTemplates
    ? Object.entries(entries)
        .map(([p, b]) => ({ m: p.match(/(?:^|\/)assets\/([^/]+\.md)$/), b }))
        .filter((t) => t.m)
        .map((t) => ({ file: t.m![1], text: strFromU8(t.b) }))
    : [];
  if (takeTemplates && !templates.length) throw new Error("No templates found under assets/.");

  // Parse everything first; a broken file stops the import before anything is touched.
  const incoming = drafts.map((d) => {
    const ws = parseWorksheet(d.text, `${root}/x/${d.file}`);
    return { ...d, ws, path: `${root}/${partDir(ws.id)}/${d.file}` };
  });
  for (const t of templates) parseTemplate(t.text, t.file);
  const ids = incoming.map((i) => i.ws.id);
  if (new Set(ids).size !== ids.length) throw new Error(`Two drafts share a worksheet id: ${ids.join(", ")}`);

  const onDisk = worksheetFilesOnDisk(root);
  const replacing = new Set(ids);
  const wholeSet = isSkill && takeDrafts;
  const wouldRemove = wholeSet ? [...new Set(onDisk.map((f) => f.id))].filter((id) => !replacing.has(id)).sort() : [];
  if (wouldRemove.length && !opts.allowRemove) {
    throw new Error(
      `This .skill file doesn't have ${wouldRemove.join(", ")}, which the site does. It may be older than a drafts zip ` +
        `imported since. Save those drafts into the workbook skill and export it again, or re-run with --allow-remove ` +
        `if they really should go.`,
    );
  }

  const before = new Map<string, Worksheet>(
    existsSync(generatedPath) ? (JSON.parse(readFileSync(generatedPath, "utf8")) as Worksheet[]).map((w) => [w.id, w]) : [],
  );
  const templatesDir = join(root, "templates");
  const templatesBefore = new Map<string, string>(
    existsSync(templatesDir) ? readdirSync(templatesDir).filter((f) => f.endsWith(".md")).map((f) => [f, readFileSync(join(templatesDir, f), "utf8")]) : [],
  );

  // Write worksheets
  if (takeDrafts) {
    for (const f of onDisk) if (wholeSet || replacing.has(f.id)) rmSync(f.path);
    for (const i of incoming) {
      mkdirSync(join(i.path, ".."), { recursive: true });
      writeFileSync(i.path, i.text);
    }
  }
  // Write templates (the skill's set is the whole set)
  if (takeTemplates) {
    if (existsSync(templatesDir)) for (const f of templatesBefore.keys()) rmSync(join(templatesDir, f));
    mkdirSync(templatesDir, { recursive: true });
    for (const t of templates) writeFileSync(join(templatesDir, t.file), t.text);
  }

  // Record what's here and where it came from
  const skillSha256 = sha(bytes);
  const sourcePath = join(root, "SOURCE.json");
  const prev = existsSync(sourcePath) ? JSON.parse(readFileSync(sourcePath, "utf8")) : {};
  const files: Record<string, string> = {};
  for (const dir of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    for (const f of readdirSync(join(root, dir)).filter((f) => f.endsWith(".md")).sort()) {
      files[`${dir}/${f}`] = sha(readFileSync(join(root, dir, f), "utf8"));
    }
  }
  writeFileSync(
    sourcePath,
    JSON.stringify(
      {
        skill: "compounding-ai-workbook",
        ...(isService || worksheetsFrom ? { worksheetsFrom: isService ? "human-led-service" : worksheetsFrom } : {}),
        files,
        imports: [
          ...(prev.imports ?? []),
          {
            kind: isService ? "human-led-service" : isSkill ? "skill" : "drafts",
            sha256: skillSha256,
            importedAt: (opts.now ?? new Date()).toISOString(),
            worksheets: [...replacing].sort(),
            ...(takeTemplates ? { templates: templates.map((t) => t.file).sort() } : {}),
          },
        ],
      },
      null,
      2,
    ) + "\n",
  );

  if (isService && opts.serviceRoot !== null) copyServiceContent(entries, opts.serviceRoot ?? "content/service");

  const after = buildAll(root);
  writeFileSync(generatedPath, JSON.stringify(after, null, 2) + "\n");
  mkdirSync(join(templatesPath, ".."), { recursive: true });
  writeFileSync(templatesPath, JSON.stringify(buildTemplates(root), null, 2) + "\n");

  const report: ImportReport = {
    source: isSkill ? "skill" : "drafts",
    skillSha256,
    added: [],
    changed: [],
    removed: [],
    unchanged: [],
    templates: { added: [], changed: [], removed: [], unchanged: [] },
  };
  for (const w of after) {
    if (!wholeSet && !replacing.has(w.id)) continue;
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
  if (takeTemplates) {
    for (const t of templates) {
      const old = templatesBefore.get(t.file);
      (old === undefined ? report.templates.added : old === t.text ? report.templates.unchanged : report.templates.changed).push(t.file);
    }
    report.templates.removed = [...templatesBefore.keys()].filter((f) => !templates.some((t) => t.file === f));
  }
  return report;
}

if (process.argv[1]?.endsWith("import-workbook.ts")) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const only = args.find((a) => a.startsWith("--only="))?.slice(7) as ImportOptions["only"];
  if (!file || (only && only !== "drafts" && only !== "templates")) {
    console.error("Usage: npm run import:workbook -- <compounding-ai-workbook.skill | drafts.zip> [--only=drafts|templates] [--allow-remove]");
    process.exit(2);
  }
  const r = importSkill(new Uint8Array(readFileSync(file)), { only, allowRemove: args.includes("--allow-remove") });
  console.log(`Imported ${r.source === "skill" ? "a skill file" : "a drafts zip (only the worksheets inside it)"}, sha256 ${r.skillSha256.slice(0, 12)}`);
  console.log("If the content front end changed, run `npm run service` too.");
  if (only !== "templates") {
    console.log(`  worksheets unchanged: ${r.unchanged.join(", ") || "none"}`);
    console.log(`  worksheets added:     ${r.added.join(", ") || "none"}`);
    console.log(`  worksheets removed:   ${r.removed.join(", ") || "none"}`);
    for (const c of r.changed) {
      console.log(`  worksheet changed:    ${c.id}`);
      if (c.keysRemoved.length) console.log(`    answers that won't carry over (question reworded or removed): ${c.keysRemoved.join(", ")}`);
      if (c.keysAdded.length) console.log(`    new answer fields: ${c.keysAdded.join(", ")}`);
    }
  }
  if (r.source === "skill" && only !== "drafts") {
    const t = r.templates;
    console.log(`  templates added: ${t.added.join(", ") || "none"}; changed: ${t.changed.join(", ") || "none"}; removed: ${t.removed.join(", ") || "none"}; unchanged: ${t.unchanged.length}`);
  }
  console.log("Review with `git diff`, run `npm run check`, then commit.");
}
