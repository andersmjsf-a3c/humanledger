// The only logger the server uses. It accepts a fixed set of fields and drops everything
// else, so a request body, a header, or a card can never land in a log by accident.

const ALLOWED = new Set(["event", "route", "status", "kind", "durationMs", "errorCode"]);

export type LogFields = Record<string, unknown>;

export function redact(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!ALLOWED.has(k)) continue;
    if (typeof v === "string" && v.length > 80) continue;
    if (v !== null && typeof v === "object") continue;
    out[k] = v;
  }
  return out;
}

export function log(fields: LogFields) {
  console.log(JSON.stringify({ t: new Date().toISOString(), ...redact(fields) }));
}
