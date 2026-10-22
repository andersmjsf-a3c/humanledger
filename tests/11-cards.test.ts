// Week 6: cards the site makes, the review page's labels, and the history read path.
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { checkCard as validate } from "@/lib/scorecard/validate";
import { checkCard, holdBack, lengthBand, requiredKeys, worksheetCard, SITE_MAKER } from "@/cards/build";
import { FIELD_LABELS, cardTitle, rows } from "@/cards/labels";
import { decodeCard, encodeCard } from "@/lib/scorecard/encode";
import { WORKSHEETS } from "@/worksheets";
import { GET as me } from "../app/api/me/route";
import { GET as verify } from "../app/api/auth/verify/route";
import { POST as submit } from "../app/api/scorecards/route";
import { createLoginToken } from "@/lib/auth/session";
import { historyFor, worksheetStatus } from "@/lib/history";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { freshDb } from "./helpers";

const schema = JSON.parse(readFileSync("src/schemas/scorecard.schema.json", "utf8"));
const now = new Date();

describe("cards the site makes are valid, typed, and carry no text", () => {
  it("a worksheet card for every worksheet passes the schema and server checks", () => {
    for (const w of WORKSHEETS) {
      for (const revisited of [false, true]) {
        const card = worksheetCard({ worksheetId: w.id, revisited, checkStepDone: true, now });
        expect(validate(card, now), w.id).toEqual({ ok: true, card });
        expect(card.status).toBe(revisited ? "revisited_v2" : "completed");
        expect(card.grading_skill_version).toBe(SITE_MAKER);
      }
    }
  });

  it("a draft-check card with the A5 boxes is valid, and the boxes are booleans and categories", () => {
    const card = checkCard({ words: 412, aiTellFlags: { inflated_word: 3 }, voiceFlags: {}, deliverableType: "email", threeMinute: "passed", unverifiedLine: true, now });
    expect(validate(card, now)).toEqual({ ok: true, card });
    expect(card).toMatchObject({ kind: "deliverable", length_band: "300_to_1000", three_minute_test: "passed", unverified_line: true, deliverable_type: "email" });
    expect(card).not.toHaveProperty("voice_flags_found");
  });

  it("an unticked A5 box is recorded as false, never guessed", () => {
    const card = checkCard({ words: 50, aiTellFlags: {}, voiceFlags: {}, unverifiedLine: false, now });
    expect(card.unverified_line).toBe(false);
    expect(card).not.toHaveProperty("three_minute_test");
    expect(validate(card, now).ok).toBe(true);
  });

  it("unverified_line must be a boolean", () => {
    const card = { ...checkCard({ words: 50, aiTellFlags: {}, voiceFlags: {}, now }), unverified_line: "I couldn't check the revenue figure" };
    expect(validate(card, now).ok).toBe(false);
  });

  it("length bands", () => {
    expect([0, 299, 300, 1000, 1001, 3000, 3001].map(lengthBand)).toEqual(["under_300_words", "under_300_words", "300_to_1000", "300_to_1000", "1000_to_3000", "1000_to_3000", "over_3000"]);
  });

  it("older cards still validate under 1.2", () => {
    const old = { kind: "worksheet", schema_version: "1.0", grading_skill_version: "g1.0", graded_on: now.toISOString().slice(0, 10), worksheet_id: "A1", status: "started" };
    expect(validate(old, now).ok).toBe(true);
  });

  it("cards survive the link round trip", () => {
    const card = checkCard({ words: 2000, aiTellFlags: { stock_phrase: 2 }, voiceFlags: { banned_word: 1 }, threeMinute: "failed", unverifiedLine: true, now });
    expect(decodeCard(encodeCard(card))).toEqual(card);
  });
});

describe("the review page", () => {
  it("every field in the schema has a plain-language label", () => {
    const fields = new Set<string>();
    for (const branch of schema.oneOf ?? schema.anyOf ?? []) {
      const b = branch.$ref ? schema.$defs[branch.$ref.split("/").pop()] : branch;
      Object.keys(b.properties ?? {}).forEach((k) => fields.add(k));
    }
    expect(fields.size).toBeGreaterThan(20);
    expect([...fields].filter((k) => !FIELD_LABELS[k])).toEqual([]);
  });

  it("holding back a line drops it, but required lines always stay", () => {
    const card = checkCard({ words: 50, aiTellFlags: { hedge: 1 }, voiceFlags: {}, deliverableType: "post", threeMinute: "skipped", unverifiedLine: false, now });
    const kept = holdBack(card, ["deliverable_type", "ai_tell_flags_found", "kind", "graded_on"]);
    expect(kept).not.toHaveProperty("deliverable_type");
    expect(kept).not.toHaveProperty("ai_tell_flags_found");
    for (const k of requiredKeys(card)) expect(kept).toHaveProperty(k);
    expect(validate(kept, now).ok).toBe(true);
  });

  it("rows come out in the schema's order however the stored JSON is ordered, and titles read plainly", () => {
    const card = checkCard({ words: 50, aiTellFlags: { inflated_word: 6 }, voiceFlags: {}, deliverableType: "email", threeMinute: "passed", unverifiedLine: true, now });
    const shuffled = Object.fromEntries(Object.entries(card).reverse());
    expect(rows(shuffled).map((r) => r.key)).toEqual(rows(card).map((r) => r.key));
    expect(rows(shuffled)[0].key).toBe("kind");
    expect(cardTitle(card)).toBe("Email, Under 300 words, 6 signs of AI writing");
    expect(cardTitle(worksheetCard({ worksheetId: "A3", revisited: false }))).toBe("Worksheet A3");
  });

  it("rows read in plain words", () => {
    const r = rows(checkCard({ words: 50, aiTellFlags: { inflated_word: 2 }, voiceFlags: {}, threeMinute: "not_applicable", unverifiedLine: true, now }));
    const by = Object.fromEntries(r.map((x) => [x.key, x.value]));
    expect(by.grading_skill_version).toBe("This site");
    expect(by.three_minute_test).toBe("Doesn't apply");
    expect(by.unverified_line).toBe("Yes");
    expect(by.ai_tell_flags_found).toBe("2 inflated words");
  });
});

describe("signed-in check, sign-in return, and history", () => {
  const APP = "https://app.example.test";
  process.env.APP_URL = APP;
  let cookie = "";
  let userId = "";

  beforeAll(async () => {
    await freshDb();
    const res = await verify(new Request(`${APP}/api/auth/verify?token=${await createLoginToken("history@example.test")}`));
    expect(res.headers.get("location")).toBe("/after-sign-in");
    cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
    userId = (await getDb().select().from(users))[0].id;
  });

  it("/api/me says only whether you're signed in", async () => {
    expect(await (await me(new Request(`${APP}/api/me`))).json()).toEqual({ signedIn: false });
    expect(await (await me(new Request(`${APP}/api/me`, { headers: { cookie } }))).json()).toEqual({ signedIn: true });
  });

  it("history lists only your own cards, newest first, with each worksheet's latest status", async () => {
    const send = (card: object) =>
      submit(
        new Request(`${APP}/api/scorecards`, {
          method: "POST",
          headers: { origin: APP, "sec-fetch-site": "same-origin", "content-type": "application/json", cookie: `${cookie}; __Host-csrf=t`, "x-csrf-token": "t" },
          body: JSON.stringify(card),
        }),
      );
    expect((await send(worksheetCard({ worksheetId: "A1", revisited: false }))).status).toBe(201);
    await new Promise((r) => setTimeout(r, 5));
    expect((await send(worksheetCard({ worksheetId: "A1", revisited: true }))).status).toBe(201);
    expect((await send(checkCard({ words: 10, aiTellFlags: {}, voiceFlags: {}, unverifiedLine: true }))).status).toBe(201);

    const other = (await getDb().insert(users).values({ email: "someone-else@example.test" }).returning())[0];
    const h = await historyFor(userId);
    expect(h).toHaveLength(3);
    expect(await historyFor(other.id)).toEqual([]);
    expect(worksheetStatus(h)).toEqual({ A1: { status: "revisited_v2", gradedOn: expect.any(String) } });
  });
});
