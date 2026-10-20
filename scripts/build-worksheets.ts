// Regenerates src/worksheets/generated/worksheets.json from the workbook drafts in content/.
// Run after copying new drafts in: npm run worksheets. A test fails if this file is stale.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseWorksheet } from "../src/worksheets/parse";

export function buildAll(root = "content/workbook") {
  const out = [];
  for (const part of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    for (const f of readdirSync(join(root, part)).filter((f) => f.endsWith(".md")).sort()) {
      const source = `${root}/${part}/${f}`;
      out.push(parseWorksheet(readFileSync(source, "utf8"), source));
    }
  }
  return out;
}

if (process.argv[1]?.endsWith("build-worksheets.ts")) {
  const all = buildAll();
  writeFileSync("src/worksheets/generated/worksheets.json", JSON.stringify(all, null, 2) + "\n");
  console.log(`wrote ${all.length} worksheets`);
}
