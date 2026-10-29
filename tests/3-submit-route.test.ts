// Privacy guard 3: only a signed-in person, in a browser on our origin, can submit a scorecard.
// Also covers the sign-in flow end to end against a real (in-process) Postgres.
import { describe, it, expect, beforeAll } from "vitest";
import { POST as submit } from "../app/api/scorecards/route";
import { GET as verify } from "../app/api/auth/verify/route";
import { createLoginToken } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { scorecards } from "@/lib/db/schema";
import { freshDb, base } from "./helpers";

const APP = "https://app.example.test";
process.env.APP_URL = APP;

let sessionCookie = "";
const csrf = "csrf-token-value-123";
const card = { ...base, graded_on: new Date().toISOString().slice(0, 10), kind: "worksheet", worksheet_id: "A1", status: "completed" };

function request(opts: { headers?: Record<string, string>; body?: string } = {}) {
  return new Request(`${APP}/api/scorecards`, {
    method: "POST",
    headers: {
      origin: APP,
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
      cookie: `${sessionCookie}; __Host-csrf=${csrf}`,
      "x-csrf-token": csrf,
      ...opts.headers,
    },
    body: opts.body ?? JSON.stringify(card),
  });
}

beforeAll(async () => {
  await freshDb();
  const token = await createLoginToken("reader@example.test");
  const res = await verify(new Request(`${APP}/api/auth/verify?token=${token}`));
  expect(res.status).toBe(303);
  sessionCookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  expect(sessionCookie.startsWith("__Host-session=")).toBe(true);
});

describe("guard 3: the human-only submit path", () => {
  it("accepts a valid card from a signed-in browser", async () => {
    const res = await submit(request());
    expect(res.status).toBe(201);
    expect((await getDb().select().from(scorecards)).length).toBe(1);
  });

  it("rejects a bearer token", async () => {
    expect((await submit(request({ headers: { authorization: "Bearer abc" } }))).status).toBe(401);
  });

  it("rejects an API key", async () => {
    expect((await submit(request({ headers: { "x-api-key": "abc" } }))).status).toBe(401);
  });

  it("rejects another origin", async () => {
    expect((await submit(request({ headers: { origin: "https://evil.test" } }))).status).toBe(403);
  });

  it("rejects a cross-site fetch", async () => {
    expect((await submit(request({ headers: { "sec-fetch-site": "cross-site" } }))).status).toBe(403);
  });

  it("rejects a missing or mismatched CSRF token", async () => {
    expect((await submit(request({ headers: { "x-csrf-token": "nope" } }))).status).toBe(403);
  });

  it("rejects no session", async () => {
    expect((await submit(request({ headers: { cookie: `__Host-csrf=${csrf}` } }))).status).toBe(401);
  });

  it("rejects free text and does not echo it back", async () => {
    const res = await submit(request({ body: JSON.stringify({ ...card, note: "secret pitch to Acme" }) }));
    expect(res.status).toBe(422);
    expect(await res.text()).not.toContain("Acme");
  });

  it("rejects an oversized body", async () => {
    expect((await submit(request({ body: "x".repeat(5000) }))).status).toBe(413);
  });

  it("a sign-in link works only once", async () => {
    const token = await createLoginToken("again@example.test");
    expect((await verify(new Request(`${APP}/api/auth/verify?token=${token}`))).status).toBe(303);
    const again = await verify(new Request(`${APP}/api/auth/verify?token=${token}`));
    expect(again.status).toBe(303);
    expect(again.headers.get("location")).toBe("/login?error=expired");
    expect(again.headers.get("set-cookie")).toBeNull();
  });
});
