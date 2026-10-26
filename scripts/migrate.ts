// Applies the database migrations in ./drizzle. Vercel runs this before every build
// (the vercel-build script), so new tables and columns arrive with the code that uses them.
// Uses the direct connection when Neon provides one (DATABASE_URL_UNPOOLED); migrations shouldn't
// go through the connection pooler. Without a database URL (CI, local builds) it does nothing.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { databaseUrl } from "../src/config/db-url";

const url = databaseUrl(process.env, true);
if (!url) {
  console.log("migrate: no database address, skipped");
} else {
  const sql = postgres(url, { max: 1, prepare: false });
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  await sql.end();
  console.log("migrate: database is current");
}
