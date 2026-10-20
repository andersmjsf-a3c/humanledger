// Privacy guard 4: the vault code (worksheet answers, skill files, linters) can't reach the network.
// Belt and braces with the ESLint rule: this scans the source text directly.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ESLint } from "eslint";

const VAULT = "src/vault";
const BANNED = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /EventSource/, /sendBeacon/, /from\s+["'](node:)?https?["']/, /from\s+["'](axios|ky|undici|resend|postgres)["']/, /@\/lib\/db/];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

describe("guard 4: vault has no network path", () => {
  it("source scan is clean", () => {
    const hits = files(VAULT).flatMap((f) => {
      const src = readFileSync(f, "utf8");
      return BANNED.filter((re) => re.test(src)).map((re) => `${f}: ${re}`);
    });
    expect(hits).toEqual([]);
  });

  it("the lint rule actually fires on a network call", async () => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText("export const x = () => fetch('https://example.com');\n", {
      filePath: "src/vault/probe.ts",
    });
    expect(result.messages.some((m) => m.ruleId === "no-restricted-globals")).toBe(true);
  });
});
