// Week 7: the grading skill the site hands out. It must check cards exactly as the site does,
// make links the review page accepts, and carry no free text.
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { buildGrader } from "../scripts/build-grader";
import { GRADER_FILES, GRADER_VERSION, graderFiles, packageGrader } from "@/grader/package";
import { checkCard as validate } from "@/lib/scorecard/validate";
import { decodeCard } from "@/lib/scorecard/encode";
import { checkCard, worksheetCard } from "@/cards/build";
import { receiptWarnings, rows } from "@/cards/labels";
import schema from "@/schemas/scorecard.schema.json";

const SITE = "https://app.example.test";
const TODAY = new Date("2026-10-22T12:00:00Z");
const day = "2026-10-22";
let dir = "";

const grader = {
  kind: "deliverable", schema_version: "1.2", grading_skill_version: "g1.2", graded_on: day,
  model_vendor: "anthropic", model_release: "anthropic.claude-opus-5-5", deliverable_type: "post", audience: "public",
  length_band: "300_to_1000", brief_used: true, skills_used: ["voice", "brand", "custom_03"], pass_count: 4,
  catches_me: 3, catches_tool: 9, catches_standard: 1, standard_kind: "published_guide",
  voice_flags_found: { banned_word: 2, hedge: 1 }, voice_flags_remaining: { banned_word: 0 },
  ai_tell_flags_found: { stock_phrase: 3, rule_of_three: 1 }, ai_tell_flags_remaining: { stock_phrase: 1 },
  fact_pass: "pass", facts_checked: 12, facts_corrected: 2, sources_opened: 10, three_minute_test: "passed",
  brand_check: { claims: "pass", names: "pass", voice: "fail", visuals: "not_applicable" },
  released_after_check: true, unverified_line: true,
  receipt: { agent: "grader", files_read: 6, files_written: 2, network_attempts: 0, content_transmitted: false, boundary_events: 0 },
};
const retest = {
  kind: "skill_retest", schema_version: "1.2", grading_skill_version: "g1.2", graded_on: day, skill_slot: "voice", skill_version: 7,
  last_edited_on: "2026-09-30", trigger: "output_felt_off", test_cases_run: 5, test_cases_passed: 4, drift_result: "minor_drift",
  edited_after_retest: false, run_by: "person",
  receipt: { agent: "grader", files_read: 8, files_written: 1, network_attempts: 0, content_transmitted: false, boundary_events: 1 },
};
const good: object[] = [
  grader, retest,
  { kind: "deliverable", schema_version: "1.2", grading_skill_version: "g1.2", graded_on: day },
  worksheetCard({ worksheetId: "A5", revisited: true, checkStepDone: false, now: TODAY }),
  checkCard({ words: 1500, aiTellFlags: { inflated_word: 4 }, voiceFlags: { em_dash: 2 }, threeMinute: "failed", unverifiedLine: false, now: TODAY }),
  { kind: "worksheet", schema_version: "1.0", grading_skill_version: "g1.0", graded_on: "2026-03-01", worksheet_id: "0.1", status: "started" },
];
const bad: unknown[] = [
  { ...grader, deliverable_type: "pitch to Acme" },
  { ...grader, unverified_line: "the Q3 figure" },
  { ...grader, notes: "anything" },
  { ...grader, skills_used: ["pitch-to-acme"] },
  { ...grader, skills_used: ["voice", "voice"] },
  { ...grader, facts_corrected: 13 },
  { ...grader, ai_tell_flags_remaining: { stock_phrase: 4 } },
  { ...grader, pass_count: 501 },
  { ...grader, pass_count: 2.5 },
  { ...grader, catches_me: true },
  { ...grader, brief_used: 1 },
  { ...grader, graded_on: "2026-02-30" },
  { ...grader, graded_on: "2026-10-25" },
  { ...grader, graded_on: "2025-12-31" },
  { ...grader, grading_skill_version: "g9.9" },
  { ...grader, receipt: { ...grader.receipt, agent: "coach" } },
  { ...grader, receipt: { ...grader.receipt, file_names: 1 } },
  { ...retest, test_cases_passed: 6 },
  { ...retest, skill_slot: "acme-pitch" },
  { kind: "deliverable", schema_version: "1.2", grading_skill_version: "g1.2" },
  { kind: "memo", schema_version: "1.2", grading_skill_version: "g1.2", graded_on: day },
  [],
  "a card",
  { ...grader, ai_tell_flags_found: { stock_phrase: 3, rule_of_three: 1, ["x".repeat(4100)]: 1 } },
];

function py(args: string[], input?: string) {
  return spawnSync("python3", ["-I", join(dir, "grade-my-work/scripts/card.py"), ...args], { encoding: "utf8", input });
}
function cardFile(name: string, card: unknown) {
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(card));
  return p;
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "grader-"));
  for (const [p, text] of Object.entries(graderFiles(SITE))) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), text);
  }
});

describe("the packaged skill", () => {
  it("is current with its sources (run `npm run grader` after editing grader/ or the schema)", () => {
    expect(buildGrader().files).toEqual(GRADER_FILES);
  });

  it("carries the site's own schema and labels, so it can't check differently", () => {
    expect(JSON.parse(GRADER_FILES["grade-my-work/references/scorecard.schema.json"])).toEqual(schema);
    expect((schema as any).$defs.grading_skill_version.enum).toContain(GRADER_VERSION);
    expect(GRADER_FILES["grade-my-work/scripts/card.py"]).toContain(`GRADER_VERSION = "${GRADER_VERSION}"`);
    expect(GRADER_FILES["grade-my-work/SKILL.md"]).toContain(`"grading_skill_version": "${GRADER_VERSION}"`);
  });

  it("the zip has this site's address in it and no placeholder left", () => {
    const files = unzipSync(packageGrader(SITE + "/"));
    expect(Object.keys(files).sort()).toEqual(Object.keys(GRADER_FILES).sort());
    const py = strFromU8(files["grade-my-work/scripts/card.py"]);
    expect(py).toContain(`SITE_URL = "${SITE}"`);
    for (const f of Object.values(files)) expect(strFromU8(f)).not.toContain("{{SITE_URL}}");
    expect(() => packageGrader('javascript:alert("x")')).toThrow();
  });

  it("the skill text is ready for readers: no placeholders, no em dashes, the grader never sends", () => {
    const md = GRADER_FILES["grade-my-work/SKILL.md"];
    expect(md).toMatch(/^---\nname: grade-my-work\ndescription: .+\n---\n/);
    expect(md).not.toMatch(/\[MARK|—|–/);
    expect(md).toMatch(/You never send/);
    expect(md).toMatch(/three-minute test/);
    expect(md).toMatch(/what they couldn't verify/);
  });
});

describe("card.py checks exactly what the site checks", () => {
  it("agrees with the site on every good and bad card, and shows the same plain words", () => {
    const all = [...good, ...bad];
    const out = execFileSync("python3", ["-I", join(dir, "grade-my-work/scripts/card.py"), "batch-check", cardFile("batch.json", all), day], { encoding: "utf8" });
    const verdicts: { ok: boolean; rows: unknown[] }[] = JSON.parse(out);
    all.forEach((c, i) => {
      const site = validate(c, TODAY).ok;
      expect(verdicts[i].ok, `card ${i}: ${JSON.stringify(c).slice(0, 80)}`).toBe(site);
      if (site) expect(verdicts[i].rows).toEqual(rows(c as Record<string, unknown>));
    });
    expect(verdicts.slice(0, good.length).every((v) => v.ok)).toBe(true);
    expect(verdicts.slice(good.length).every((v) => !v.ok)).toBe(true);
  });

  it("makes a review link the site decodes to the same card", () => {
    const r = py(["link", cardFile("g.json", grader)]);
    expect(r.status).toBe(0);
    const link = r.stdout.trim();
    expect(link.startsWith(`${SITE}/review#v1.`)).toBe(true);
    const back = decodeCard(link.split("#")[1]);
    expect(back).toEqual(grader);
    expect(validate(back, TODAY).ok).toBe(true);
  });

  it("holds lines back, but never the required ones", () => {
    const r = py(["link", cardFile("h.json", grader), "--hold", "audience,receipt,kind,graded_on"]);
    const back = decodeCard(r.stdout.trim().split("#")[1]) as Record<string, unknown>;
    expect(back).not.toHaveProperty("audience");
    expect(back).not.toHaveProperty("receipt");
    expect(back.kind).toBe("deliverable");
    expect(back.graded_on).toBe(day);
  });

  it("previews in plain words, and refuses a card with words from the work in it", () => {
    const p = py(["preview", cardFile("p.json", retest)]);
    expect(p.status).toBe(0);
    expect(p.stdout).toContain("**Your scorecard (not sent)**");
    expect(p.stdout).toContain("| Skill | Voice |");
    expect(p.stdout).toContain("Not in here: any words from your work");
    expect(p.stdout).toContain("Check before sending: 1 request(s) outside the grader's job were refused.");

    const b = py(["link", cardFile("b.json", { ...grader, deliverable_type: "pitch to Acme" })]);
    expect(b.status).toBe(1);
    expect(b.stdout).toContain("Not a valid scorecard yet");
    expect(b.stdout).not.toContain("http");
  });

  it("a copy without the site's address won't make a link", () => {
    const raw = mkdtempSync(join(tmpdir(), "raw-"));
    for (const [p, text] of Object.entries(GRADER_FILES)) {
      mkdirSync(dirname(join(raw, p)), { recursive: true });
      writeFileSync(join(raw, p), text);
    }
    const r = spawnSync("python3", ["-I", join(raw, "grade-my-work/scripts/card.py"), "link", cardFile("r.json", grader)], { encoding: "utf8" });
    expect(r.status).not.toBe(0);
    expect(r.stderr + r.stdout).toContain("Download it again");
  });
});

describe("the review page reads the grader's receipt", () => {
  it("flags network attempts, content leaving, and boundary events, and nothing on a clean receipt", () => {
    expect(receiptWarnings(grader)).toEqual([]);
    const w = receiptWarnings({ ...grader, receipt: { ...grader.receipt, network_attempts: 2, content_transmitted: true, boundary_events: 1 } });
    expect(w).toHaveLength(3);
    expect(w[0]).toContain("2 network attempts");
  });

  it("shows the receipt and brand check in words", () => {
    const by = Object.fromEntries(rows(grader).map((r) => [r.key, r.value]));
    expect(by.receipt).toBe("Agent: Grader, Files read: 6, Files written: 2, Network attempts: 0, Content sent: No, Boundary events: 0");
    expect(by.brand_check).toBe("Claims: Passed, Names: Passed, Voice: Failed, Visuals: Doesn't apply");
    expect(by.grading_skill_version).toBe("Grading skill 1.2");
    expect(by.audience).toBe("The public");
  });
});
