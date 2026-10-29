// Where to land after signing in: the page the person was on (Oct 29 2026). Kept in this browser
// for an hour, because the sign-in link usually opens in a new tab. Same-site paths only.
const KEY = "returnTo";
const TTL_MS = 60 * 60 * 1000;

export function safePath(p: unknown): string | null {
  if (typeof p !== "string" || !p.startsWith("/") || p.startsWith("//") || p.includes("\\")) return null;
  if (/^\/(login|after-sign-in|api\/)/.test(p)) return null;
  return p;
}

export function rememberReturn(path: string) {
  const p = safePath(path);
  if (!p) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path: p, at: Date.now() }));
  } catch {
    // storage blocked: sign-in lands on Your AI
  }
}

export function takeReturn(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw);
    return Date.now() - at < TTL_MS ? safePath(path) : null;
  } catch {
    return null;
  }
}
