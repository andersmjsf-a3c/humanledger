// Regenerates src/service/generated/service.json from content/service/ (the eight pages and the
// glossary, copied unchanged from the human-led-service skill). A test fails if it's stale.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  const sdir = join(root, "v2", "starters");
  const meta = JSON.parse(readFileSync(join(sdir, "starters.json"), "utf8"));
  const starters = meta.starters.map((s: { file: string }) => ({ ...s, template: readFileSync(join(sdir, s.file), "utf8") }));
  const shotsDir = join(root, "v2", "screenshots");
  const placements = existsSync(join(shotsDir, "placements.json")) ? JSON.parse(readFileSync(join(shotsDir, "placements.json"), "utf8")) : { taken: null, screenshots: [] };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const screenshots = placements.screenshots.filter((s: { held?: string }) => !s.held).map(({ held, ...s }: { held?: string; [k: string]: unknown }) => s);
  return { pages, glossary, tiles, starters, screenshots, screenshotsTaken: placements.taken };
}

if (process.argv[1]?.endsWith("build-service.ts")) {
  const data = buildService();
  writeFileSync("src/service/generated/service.json", JSON.stringify(data, null, 2) + "\n");
  // Serve only the placed, not-held screenshots.
  rmSync("public/screenshots", { recursive: true, force: true });
  mkdirSync("public/screenshots", { recursive: true });
  for (const s of data.screenshots as { file: string }[]) copyFileSync(join("content/service/v2/screenshots", s.file), join("public/screenshots", s.file));
  console.log("wrote src/service/generated/service.json");
}
