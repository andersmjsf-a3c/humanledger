// Your AI (Oct 29 2026): the eight tiles become capabilities once signed in. The page is built
// from metadata only: which files exist and when they changed, counts, and the person's own cards.
import { describe, it, expect, beforeAll } from "vitest";
import { buildDashboard, needsRetest, CAPABILITIES, type DashboardInput } from "@/dashboard/model";
import { DO_PAGES } from "@/service";
import { GET as ledger } from "../app/api/ledger/route";
import { POST as signout } from "../app/api/auth/signout/route";
import { GET as verify } from "../app/api/auth/verify/route";
import { POST as submit } from "../app/api/scorecards/route";
import { createLoginToken, userIdForSession } from "@/lib/auth/session";
import { worksheetCard } from "@/cards/build";
import { freshDb } from "./helpers";

const now = new Date("2026-10-29T18:00:00Z");
const releases = [
  { id: "duet", date: "2026-10-21", title: "Duet", needsRetest: false },
  { id: "haiku", date: "2026-10-07", title: "Haiku 5.5", needsRetest: true },
];
const empty: DashboardInput = { now, files: [], tried: {}, runs: [], cards: [], releases };
const by = (d: ReturnType<typeof buildDashboard>, key: string) => d.cards.find((c) => c.cap.key === key)!;

describe("the grid", () => {
  it("keeps the eight tiles' order and pages, adds the agents tile ninth, and drops the glossary tile", () => {
    const pages = DO_PAGES.filter((p) => p.worksheets.length).map((p) => p.slug);
    expect(CAPABILITIES.slice(0, 7).map((c) => c.slug)).toEqual(pages);
    expect(CAPABILITIES[7]).toMatchObject({ key: "agent", later: true });
    expect(CAPABILITIES.find((c) => c.slug === "understand-a-word")).toBeUndefined();
  });

  it("with nothing kept, it's the plain grid and four zeros: no prompts to complete a profile", () => {
    const d = buildDashboard(empty);
    expect(d.top).toMatchObject({ filesKept: 0, checksThisWeek: 0, threeMinute: { passed: 0, of: 0 }, skillsToRetest: 0 });
    expect(d.cards.every((c) => c.state === "not_started")).toBe(true);
    expect(d.next.title).toBe("Start with whatever you're trying to do today.");
    expect(d.activity).toEqual([]);
  });

  it("only releases that need a re-test count", () => {
    expect(needsRetest("Not needed for existing skills.")).toBe(false);
    expect(needsRetest("Take your most-used skill...")).toBe(true);
    expect(buildDashboard(empty).top.lastRelease?.date).toBe("2026-10-07");
  });
});

describe("states and the coach's rules, in priority order", () => {
  it("Tried, from a Try it now on this device: rule 4, start the file", () => {
    const c = by(buildDashboard({ ...empty, tried: { "teach-it-a-job": "2026-10-25T10:00:00Z" } }), "job");
    expect(c.state).toBe("tried");
    expect(c.rule).toBe(4);
    expect(c.action.href).toBe("/workbook/B1");
  });

  it("Kept but not in Claude: rule 2, export it", () => {
    const d = buildDashboard({ ...empty, files: [{ id: "skill:1-weekly-task", filled: true, updatedAt: "2026-10-27T10:00:00Z", version: 1 }] });
    const c = by(d, "job");
    expect([c.state, c.rule, c.action.label]).toEqual(["kept", 2, "Export to Claude"]);
    expect(c.fileLine).toBe("first skill · v1 · changed Oct 27");
    expect(d.top.filesKept).toBe(1);
    expect(d.next.title).toContain("Claude can't load it yet");
  });

  it("A skill older than the last release with no re-test since: rule 1 wins, and it's counted on top", () => {
    const d = buildDashboard({
      ...empty,
      files: [
        { id: "skill:2-writing-voice", filled: true, updatedAt: "2026-10-01T10:00:00Z", version: 4, exported: true },
        { id: "skill:4-research-and-cite", filled: true, updatedAt: "2026-10-22T10:00:00Z", version: 1 },
      ],
    });
    expect(by(d, "voice").rule).toBe(1);
    expect(by(d, "research").rule).toBe(2);
    expect(d.top.skillsToRetest).toBe(1);
    expect(d.next.action.label).toBe("Start the re-test");
  });

  it("a re-test card after the release clears it", () => {
    const d = buildDashboard({
      ...empty,
      files: [{ id: "skill:2-writing-voice", filled: true, updatedAt: "2026-10-01T10:00:00Z", version: 4, exported: true }],
      cards: [{ kind: "skill_retest", graded_on: "2026-10-09", skill_slot: "voice", drift_result: "minor_drift" }],
    });
    expect(by(d, "voice").rule).toBe(3);
    expect(by(d, "voice").health).toContain("Re-tested Oct 9");
  });

  it("the paragraph about you is Connected only once the person confirms Claude's memory has it", () => {
    const files = [{ id: "A1", filled: true, updatedAt: "2026-10-12T10:00:00Z" }];
    expect(by(buildDashboard({ ...empty, files }), "memory").state).toBe("kept");
    const c = by(buildDashboard({ ...empty, files, memoryConfirmed: "2026-10-12T11:00:00Z" }), "memory");
    expect([c.state, c.rule, c.next]).toEqual(["connected", 5, "Healthy. Nothing to do"]);
  });

  it("three-minute tests and checks come from the person's own cards and local runs", () => {
    const d = buildDashboard({
      ...empty,
      runs: [{ at: "2026-10-28T10:00:00Z", flags: 3 }, { at: "2026-10-01T10:00:00Z", flags: 9 }],
      cards: [
        { kind: "deliverable", graded_on: "2026-10-21", three_minute_test: "passed" },
        { kind: "deliverable", graded_on: "2026-10-20", three_minute_test: "failed" },
        { kind: "deliverable", graded_on: "2026-10-19", three_minute_test: "skipped" },
      ],
    });
    expect(d.top.checksThisWeek).toBe(1);
    expect(d.top.threeMinute).toEqual({ passed: 1, of: 2 });
    expect(d.activity.map((a) => a.value)).toEqual(["3 flags", "passed", "failed", "sent"]);
  });

  it("nothing on the page is longer than a label: names, versions, dates, counts", () => {
    const d = buildDashboard({
      ...empty,
      files: [{ id: "B2", filled: true, updatedAt: "2026-10-24T10:00:00Z" }],
      tried: { "what-just-changed": "2026-10-25T10:00:00Z" },
    });
    const text = JSON.stringify(d);
    expect(text).not.toMatch(/answers|SECRET/);
  });
});

describe("the ledger read and sign-out", () => {
  const APP = "https://app.example.test";
  let cookie = "";
  beforeAll(async () => {
    process.env.APP_URL = APP;
    await freshDb();
    const res = await verify(new Request(`${APP}/api/auth/verify?token=${await createLoginToken("dash@example.test")}`));
    cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  });

  it("returns only the signed-in person's cards, and nothing when signed out", async () => {
    expect((await ledger(new Request(`${APP}/api/ledger`))).status).toBe(401);
    const sent = await submit(
      new Request(`${APP}/api/scorecards`, {
        method: "POST",
        headers: { origin: APP, "sec-fetch-site": "same-origin", "content-type": "application/json", cookie: `${cookie}; __Host-csrf=t`, "x-csrf-token": "t" },
        body: JSON.stringify(worksheetCard({ worksheetId: "A1", revisited: false })),
      }),
    );
    expect(sent.status).toBe(201);
    const j = await (await ledger(new Request(`${APP}/api/ledger`, { headers: { cookie } }))).json();
    expect(j.cards).toHaveLength(1);
    expect(j.cards[0].worksheet_id).toBe("A1");
  });

  it("sign-out ends the session and clears the cookie", async () => {
    const res = await signout(new Request(`${APP}/api/auth/signout`, { method: "POST", headers: { cookie, "sec-fetch-site": "same-origin" } }));
    expect(res.status).toBe(303);
    expect(res.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await userIdForSession(cookie.split("=")[1])).toBeNull();
  });
});

import { safePath } from "@/account/returnTo";

describe("after sign-in, back to the page you were on", () => {
  it("only same-site pages, never sign-in itself, the API, or another site", () => {
    expect(safePath("/do/teach-it-a-job")).toBe("/do/teach-it-a-job");
    expect(safePath("/workbook/B1#version-2")).toBe("/workbook/B1#version-2");
    expect(safePath("/")).toBe("/");
    for (const bad of ["//evil.test/x", "https://evil.test", "/login", "/after-sign-in", "/api/ledger", "/\\evil", 42, null]) expect(safePath(bad)).toBeNull();
  });
});
