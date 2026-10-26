import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { databaseUrl } from "@/config/db-url";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let db: Db | undefined;

// Lazy, so builds and tests never need a live database. Tests inject an in-process one.
export function getDb(): Db {
  if (!db) {
    const url = databaseUrl();
    if (!url) throw new Error("DATABASE_URL is not set");
    db = drizzlePg(postgres(url, { prepare: false, max: Number(process.env.DATABASE_POOL_MAX) || 10 }), { schema }) as unknown as Db;
  }
  return db;
}

export function setDbForTests(instance: Db) {
  db = instance;
}
