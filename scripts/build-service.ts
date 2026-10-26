// Regenerates src/service/generated/service.json from content/service/ (the eight pages and the
// glossary, copied unchanged from the human-led-service skill). A test fails if it's stale.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseDoPage, parseGlossary, parseTiles } from "../src/service/parse";

export function buildService(root = "content/service") {
  const dir = join(root, "do");
  const pages = readdirSync(dir)
    .filter((f) => /^\d+-.*\.md$/.test(f))
    .sort()
    .map((f) => parseDoPage(readFileSync(join(dir, f), "utf8"), `${dir}/${f}`));
  const glossary = parseGlossary(readFileSync(join(root, "glossary.md"), "utf8"));
  const tiles = parseTiles(readFileSync(join(dir, "homepage-copy.md"), "utf8"));
  return { pages, glossary, tiles };
}

if (process.argv[1]?.endsWith("build-service.ts")) {
  writeFileSync("src/service/generated/service.json", JSON.stringify(buildService(), null, 2) + "\n");
  console.log("wrote src/service/generated/service.json");
}
