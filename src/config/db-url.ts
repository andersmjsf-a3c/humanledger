// Where the database is. Vercel's Neon integration can add its settings with a prefix
// (STORAGE_DATABASE_URL), so both spellings work. `direct` asks for the unpooled connection,
// which migrations use; it falls back to the pooled one.
type Env = Record<string, string | undefined>;

export function databaseUrl(env: Env = process.env, direct = false): string | undefined {
  const pick = (k: string) => env[k] || env[`STORAGE_${k}`];
  return (direct && pick("DATABASE_URL_UNPOOLED")) || pick("DATABASE_URL") || undefined;
}
