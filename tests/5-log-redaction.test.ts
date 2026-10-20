// Privacy guard 5: request bodies, headers, and cards can't reach the logs.
import { describe, it, expect, vi } from "vitest";
import { log, redact } from "@/lib/log";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

describe("guard 5: logs carry no content", () => {
  it("drops anything not on the allowlist", () => {
    expect(
      redact({ event: "x", status: 201, body: "secret", card: { a: 1 }, headers: { cookie: "s" }, email: "a@b.c" }),
    ).toEqual({ event: "x", status: 201 });
  });

  it("drops long strings even in allowed fields", () => {
    expect(redact({ event: "y".repeat(200) })).toEqual({});
  });

  it("what reaches the console is redacted", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log({ event: "scorecard_received", body: "Q3 pitch to Acme" });
    expect(spy.mock.calls[0][0]).not.toContain("Acme");
    spy.mockRestore();
  });

  it("no route or library prints except through the logger", () => {
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((f) => {
        const p = join(d, f);
        return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
      });
    const allowed = new Set(["src/lib/log.ts", "src/lib/auth/email.ts"]);
    const offenders = [...walk("app"), ...walk("src")].filter(
      (f) => !allowed.has(f) && /console\.(log|info|warn|error|debug)/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
