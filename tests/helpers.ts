import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";
import { setDbForTests, type Db } from "@/lib/db/client";

// A real Postgres, in process, with the real migrations applied.
export async function freshDb(): Promise<Db> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  setDbForTests(db as unknown as Db);
  return db as unknown as Db;
}

export const base = { schema_version: "1.0", grading_skill_version: "g1.0", graded_on: "2026-10-18" };
