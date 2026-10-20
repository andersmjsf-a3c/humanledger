// Privacy guard 2: no database column can hold text a person wrote.
// A new text column fails this test until it's added to the allowlist with a reason.
import { describe, it, expect } from "vitest";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { is } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

const TEXT_ALLOWLIST: Record<string, string> = {
  "users.email": "the one thing we keep about a person",
  "sessions.id_hash": "hash of a random value we generated",
  "login_tokens.token_hash": "hash of a random value we generated",
  "login_tokens.email": "where the sign-in link went",
  "scorecards.schema_version": "copied from a validated enum",
  "release_registry.value": "service-maintained model list",
  "release_registry.vendor": "service-maintained model list",
  "agent_receipts.credential_id": "issued by the credential provider",
};

describe("guard 2: no content columns", () => {
  const tables = (Object.values(schema) as unknown[]).filter((v): v is PgTable => is(v, PgTable));

  it("finds the tables", () => expect(tables.length).toBe(6));

  it("every text column is allowlisted, and only scorecards.card is JSON", () => {
    const offenders: string[] = [];
    for (const t of tables) {
      const cfg = getTableConfig(t);
      for (const c of cfg.columns) {
        const key = `${cfg.name}.${c.name}`;
        const type = c.getSQLType();
        if (type === "text" || type.startsWith("varchar") || type.startsWith("char")) {
          if (!TEXT_ALLOWLIST[key]) offenders.push(`${key} (${type})`);
        }
        if ((type === "jsonb" || type === "json") && key !== "scorecards.card") offenders.push(`${key} (${type})`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
