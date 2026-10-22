// Regenerates src/grader/generated/grader.json: the grading skill the site hands out.
// Source: grader/grade-my-work plus the site's own schema and labels, so the skill can never
// check a card differently from the site. Run `npm run grader`; a test fails if this is stale.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "grader/grade-my-work";

function walk(dir: string): string[] {
  return readdirSync(dir).sort().flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function buildGrader() {
  const files: Record<string, string> = {};
  for (const p of walk(ROOT).filter((p) => !p.includes("__pycache__"))) files[`grade-my-work/${relative(ROOT, p)}`] = readFileSync(p, "utf8");
  files["grade-my-work/references/scorecard.schema.json"] = readFileSync("src/schemas/scorecard.schema.json", "utf8");
  files["grade-my-work/references/labels.json"] = readFileSync("src/cards/labels.json", "utf8");
  return { version: "g1.2", files };
}

if (process.argv[1]?.endsWith("build-grader.ts")) {
  writeFileSync("src/grader/generated/grader.json", JSON.stringify(buildGrader(), null, 2) + "\n");
  console.log("wrote src/grader/generated/grader.json");
}
