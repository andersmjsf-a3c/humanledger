import { describe, it, expect } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { AnswerStore, type StoredWorksheet } from "@/vault/storage";
import { ANSWERS_PATH, buildBundle, parseBundle } from "@/vault/bundle";
import { zipBundle, answersFromZip } from "@/vault/folder";

const t = (s: string) => new Date(`2026-10-20T${s}:00Z`);

describe("answers saved on the device", () => {
  it("saves, reloads, and tracks what isn't in the folder yet", async () => {
    const s = new AnswerStore(new IDBFactory());
    await s.save("0.1", { plan: "Pro" }, t("10:00"));
    await s.save("0.2", { attached: "a PDF" }, t("10:05"));
    expect((await s.get("0.1"))?.answers.plan).toBe("Pro");
    expect((await s.unsavedToFolder()).sort()).toEqual(["0.1", "0.2"]);

    await s.markSavedToFolder(["0.1", "0.2"], t("10:10"));
    expect(await s.unsavedToFolder()).toEqual([]);

    await s.save("0.1", { plan: "Max" }, t("10:20"));
    expect(await s.unsavedToFolder()).toEqual(["0.1"]);
    expect((await s.get("0.1"))?.savedToFolderAt).toBe(t("10:10").toISOString());
  });
});

describe("the folder bundle", () => {
  const records: StoredWorksheet[] = [
    { id: "0.1", answers: { q1: "Pro", q2: "Projects, Opus, longer tools" }, updatedAt: t("10:00").toISOString() },
    { id: "0.6", answers: { "t1.1": "On", q2: "Web search" }, updatedAt: t("10:05").toISOString() },
  ];

  it("writes one Markdown file per worksheet plus the answers file", () => {
    const files = buildBundle(records, t("11:00"));
    expect(Object.keys(files).sort()).toEqual([ANSWERS_PATH, "worksheets/0.1-your-account-and-the-window.md", "worksheets/0.6-five-settings-worth-knowing.md"]);
  });

  it("round-trips through the answers file and a zip", () => {
    const files = buildBundle(records, t("11:00"));
    const back = parseBundle(answersFromZip(zipBundle(files)));
    expect(back.skipped).toBe(0);
    expect(back.records.map((r) => r.answers)).toEqual(records.map((r) => r.answers));
  });

  it("refuses a file that isn't ours", () => {
    expect(() => parseBundle(JSON.stringify({ hello: "world" }))).toThrow();
  });

  it("drops unknown worksheets, unknown prompts, non-text values, and oversized answers", () => {
    const text = JSON.stringify({
      format: "workbook-answers",
      version: 1,
      worksheets: {
        "0.1": { answers: { q1: "Pro", sneaky: "x", q2: 42, q4: "y".repeat(20_001) }, updatedAt: "2026-10-20T10:00:00Z" },
        "9.9": { answers: { a: "b" } },
      },
    });
    const { records, skipped } = parseBundle(text);
    expect(records).toHaveLength(1);
    expect(records[0].answers).toEqual({ q1: "Pro" });
    expect(skipped).toBe(4);
  });
});
