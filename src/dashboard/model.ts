// The signed-in "Your AI" page (dashboard spec, Oct 29 2026), as a pure function.
// Inputs are metadata only: which files exist in the person's own vault and when they changed,
// local check runs (numbers), the scorecards they chose to send, and the release log.
// Nothing here reads what a file says beyond whether it has been filled in.

export type CapState = "not_started" | "tried" | "kept" | "connected";

export interface VaultFile {
  id: string; // worksheet id ("B2") or "skill:<template id>"
  filled: boolean; // at least one answer written
  updatedAt: string;
  version?: number;
  exported?: boolean; // downloaded or saved in Claude's skill format
}

export interface Card {
  [k: string]: unknown;
  kind: string;
  graded_on: string;
}

export interface Release { id: string; date: string; title: string; needsRetest: boolean }

export interface DashboardInput {
  now: Date;
  files: VaultFile[];
  tried: Record<string, string>; // page slug -> date the Try it now was done
  memoryConfirmed?: string; // date the person confirmed Claude's memory holds their paragraph
  runs: { at: string; flags: number }[]; // draft checks: when, and how many flags
  cards: Card[]; // scorecards they sent (empty when signed out)
  releases: Release[];
}

export interface Capability {
  key: string;
  title: string;
  slug: string; // the content page
  worksheet: string; // where Keep this goes
  skill?: string; // skill builder template, if this capability is a skill
  starter?: string; // the starter that makes this file in three questions (Oct 30 2026)
  slot?: string; // scorecard skill slot for re-tests
  fileName: string;
  later?: boolean; // the dashed ninth tile
}

export const CAPABILITIES: Capability[] = [
  { key: "voice", title: "Write something that sounds like me", slug: "write-something-that-sounds-like-me", worksheet: "B2", skill: "2-writing-voice", slot: "voice", starter: "write-like-me", fileName: "my-voice.md" },
  { key: "fact", title: "Check whether something it told me is true", slug: "check-whether-its-true", worksheet: "B5", skill: "5-fact-check-pass", slot: "fact_check", starter: "check-the-facts", fileName: "fact-check.md" },
  { key: "job", title: "Teach it a job I do every week", slug: "teach-it-a-job", worksheet: "B1", skill: "1-weekly-task", slot: "first_skill", starter: "my-weekly-report", fileName: "first skill" },
  { key: "research", title: "Find out something I can rely on", slug: "find-out-something-i-can-rely-on", worksheet: "B4", skill: "4-research-and-cite", slot: "research", starter: "research-i-can-trust", fileName: "research.md" },
  { key: "deck", title: "Make a deck or a one-pager someone will judge", slug: "make-something-someone-will-judge", worksheet: "C5", fileName: "pass log" },
  { key: "changed", title: "Figure out what just changed", slug: "what-just-changed", worksheet: "0.7", fileName: "platform-changes.md" },
  { key: "memory", title: "Keep it from forgetting who I am", slug: "keep-it-from-forgetting", worksheet: "A1", fileName: "about-me.md" },
  { key: "agent", title: "Give it a job to do on its own", slug: "", worksheet: "C2", skill: "7-agent-job-description", fileName: "agent job card", later: true },
];

export type Tone = "amber" | "green" | "plain";
export interface Action { label: string; href: string; primary: boolean }
export interface CapCard {
  cap: Capability;
  state: CapState;
  fileLine?: string;
  connection?: string;
  health: string[];
  next: string;
  tone: Tone;
  action: Action;
  rule: number; // which coach rule chose the next step (1 highest), 6 = not started
}

export interface Dashboard {
  top: { filesKept: number; checksThisWeek: number; threeMinute: { passed: number; of: number }; skillsToRetest: number; lastRelease?: Release };
  cards: CapCard[];
  next: { title: string; why: string; action: Action };
  activity: { date: string; what: string; value: string; good?: boolean }[];
}

const day = (iso: string) => iso.slice(0, 10);
const short = (iso: string) => new Date(`${day(iso)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const DAY_MS = 86_400_000;
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function fileFor(cap: Capability, files: VaultFile[]): VaultFile | undefined {
  const ids = [cap.starter ? `starter:${cap.starter}` : "", cap.skill ? `skill:${cap.skill}` : "", cap.worksheet].filter(Boolean);
  const found = files.filter((f) => ids.includes(f.id) && f.filled).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const skill = found.find((f) => f.id.startsWith("skill:") || f.id.startsWith("starter:"));
  return skill ?? found[0];
}

function lastRetest(cap: Capability, cards: Card[]): string | undefined {
  return cards.filter((c) => c.kind === "skill_retest" && c.skill_slot === cap.slot).map((c) => c.graded_on).sort().at(-1);
}

export function buildDashboard(input: DashboardInput): Dashboard {
  const { now, files, tried, cards, releases, runs } = input;
  const lastRelease = releases.filter((r) => r.needsRetest).sort((a, b) => b.date.localeCompare(a.date))[0];
  const deliverables = cards.filter((c) => c.kind === "deliverable").sort((a, b) => b.graded_on.localeCompare(a.graded_on));

  const capCards: CapCard[] = CAPABILITIES.map((cap) => {
    const file = fileFor(cap, files);
    const connected = cap.key === "memory" ? !!(file && input.memoryConfirmed) : !!file?.exported;
    const state: CapState = connected ? "connected" : file ? "kept" : tried[cap.slug] ? "tried" : "not_started";

    const fileLine = file
      ? [cap.fileName, file.version ? `v${file.version}` : "", `changed ${short(file.updatedAt)}`].filter(Boolean).join(" · ")
      : undefined;
    const connection = !file
      ? undefined
      : cap.key === "memory"
        ? connected
          ? `In Claude's memory · confirmed ${short(input.memoryConfirmed!)}`
          : "In your vault, not yet confirmed in Claude's memory"
        : connected
          ? "Exported for Claude"
          : "In your vault, not yet in Claude";

    const health: string[] = [];
    if (file) {
      if (cap.key === "voice") {
        const month = (offset: number) => {
          const d = new Date(now.getTime());
          d.setUTCMonth(d.getUTCMonth() - offset);
          const m = d.toISOString().slice(0, 7);
          const rs = runs.filter((r) => r.at.startsWith(m));
          return rs.length ? Math.round(rs.reduce((n, r) => n + r.flags, 0) / rs.length) : undefined;
        };
        const [last, cur] = [month(1), month(0)];
        if (cur !== undefined) health.push(`Flags per draft: ${last !== undefined ? `${last} → ` : ""}${cur} this month`);
      }
      if (cap.key === "fact") {
        const week = runs.filter((r) => now.getTime() - Date.parse(r.at) < 7 * DAY_MS).length;
        health.push(`${week} check${week === 1 ? "" : "s"} this week`);
        const fc = deliverables.find((c) => typeof c.facts_checked === "number");
        if (fc) health.push(`Last fact pass: ${fc.facts_checked} checked, ${fc.facts_corrected ?? 0} corrected`);
      }
      if (cap.slot) {
        const rt = lastRetest(cap, cards);
        health.push(rt ? `Re-tested ${short(rt)}` : "Not re-tested yet");
      }
      if (cap.key === "research") {
        const d = deliverables.find((c) => typeof c.unverified_line === "boolean");
        if (d) health.push(`"Couldn't verify" line on the last piece: ${d.unverified_line ? "yes" : "no"}`);
      }
      if (cap.key === "deck") {
        const d = deliverables.find((c) => typeof c.pass_count === "number");
        if (d) health.push(`Passes on the last piece: ${d.pass_count}`);
      }
      if (cap.key === "changed") {
        const since = releases.filter((r) => r.date > day(file.updatedAt)).length;
        health.push(`${since} release${since === 1 ? "" : "s"} since you last updated it`);
      }
    } else if (state === "tried") {
      health.push(`Tried the exercise ${short(tried[cap.slug])}`, "Nothing kept yet");
    }

    const page = cap.slug ? `/do/${cap.slug}` : `/workbook/${cap.worksheet}`;
    const fromStarter = file?.id.startsWith("starter:");
    const keepHref = cap.skill && cap.key === "agent" ? `/skills/${cap.skill}` : fromStarter ? `/start/${cap.starter}` : `/workbook/${cap.worksheet}`;
    const exportHref = fromStarter ? `/start/${cap.starter}` : cap.skill ? `/skills/${cap.skill}` : keepHref;
    const retestDue = !!(file && cap.slot && lastRelease && (lastRetest(cap, cards) ?? day(file.updatedAt)) < lastRelease.date);
    const oldEnough = file && now.getTime() - Date.parse(file.updatedAt) > 7 * DAY_MS;

    let rule: number, next: string, tone: Tone, action: Action;
    if (retestDue) {
      [rule, next, tone, action] = [1, `Re-test after the ${short(lastRelease!.date)} release`, "amber", { label: "Run the re-test", href: "/grader", primary: true }];
    } else if (file && !connected) {
      const memory = cap.key === "memory";
      [rule, next, tone, action] = [2, memory ? "Add it to Claude's memory, then confirm here" : "Export it so Claude loads it by name", "amber", { label: memory ? "Open the paragraph" : "Export to Claude", href: memory ? keepHref : exportHref, primary: true }];
    } else if (file && connected && cap.skill && oldEnough && cap.key !== "agent") {
      [rule, next, tone, action] = [3, "Healthy. Version 2 questions are waiting", "green", { label: "Answer Version 2", href: fromStarter ? `/workbook/${cap.worksheet}` : `/workbook/${cap.worksheet}#version-2`, primary: false }];
    } else if (state === "tried") {
      [rule, next, tone, action] = [4, "Turn what you tried into a file", "green", { label: "Start the file", href: keepHref, primary: false }];
    } else if (file) {
      [rule, next, tone, action] = [5, "Healthy. Nothing to do", "green", { label: "Open in vault", href: keepHref, primary: false }];
    } else {
      [rule, next, tone, action] = [6, cap.later ? "An agent with a name, a job, and a boundary it can't cross. Start with one that only reads and reports." : "", "plain", { label: cap.later ? "Read the page" : "Open the page", href: cap.later ? keepHref : page, primary: false }];
    }
    return { cap, state, fileLine, connection, health, next, tone, action, rule };
  });

  // Top row
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const threeMinute = cards.filter((c) => c.three_minute_test === "passed" || c.three_minute_test === "failed");
  const top = {
    filesKept:
      capCards.filter((c) => c.state === "kept" || c.state === "connected").length +
      // starters with no card of their own (who my company is, my posts) still count as files kept
      files.filter((f) => f.filled && f.id.startsWith("starter:") && !CAPABILITIES.some((c) => `starter:${c.starter}` === f.id)).length,
    checksThisWeek: runs.filter((r) => Date.parse(r.at) >= weekAgo).length,
    threeMinute: { passed: threeMinute.filter((c) => c.three_minute_test === "passed").length, of: threeMinute.length },
    skillsToRetest: capCards.filter((c) => c.rule === 1).length,
    lastRelease,
  };

  // Next for you: the highest-priority step across all cards
  const ranked = capCards.filter((c) => c.rule <= 5).sort((a, b) => a.rule - b.rule);
  const best = ranked[0];
  let next: Dashboard["next"];
  if (!best) {
    next = {
      title: "Start with whatever you're trying to do today.",
      why: "Pick a card. Each one starts with something to paste into your AI right now. There's nothing to fill in first.",
      action: { label: "Pick one", href: "#capabilities", primary: true },
    };
  } else if (best.rule === 1) {
    const due = capCards.filter((c) => c.rule === 1);
    const names = due.map((c) => c.cap.fileName).join(" and ");
    next = {
      title: `${due.length === 1 ? "One skill hasn't" : `${due.length} skills haven't`} been re-tested since the ${short(lastRelease!.date)} release.`,
      why: `Run ${names} on a task you've run before and compare. Five minutes each. Anything that drifted is a line to add to the file.`,
      action: { label: "Start the re-test", href: "/grader", primary: true },
    };
  } else if (best.rule === 2) {
    next = {
      title: `${upper(best.cap.fileName)} is in your vault, but Claude can't load it yet.`,
      why: best.cap.key === "memory" ? "Paste your paragraph into Claude's memory once, then confirm here. After that it knows who you are in every conversation." : "Download it as a skill and add it to Claude once. After that you just name the job.",
      action: { ...best.action, primary: true },
    };
  } else if (best.rule === 3) {
    next = { title: `${upper(best.cap.fileName)} has had a week of use.`, why: "Answer the Version 2 questions while the corrections are fresh. Each one is a line you won't have to type again.", action: { ...best.action, primary: true } };
  } else if (best.rule === 4) {
    next = { title: `You tried "${best.cap.title}" but haven't kept it.`, why: "Turn it into a file so next time starts from what you learned, not from scratch.", action: { ...best.action, primary: true } };
  } else {
    next = { title: "Everything is current.", why: "Nothing needs you right now. When a new model lands, the cards that need a re-test will say so.", action: { label: "What changed", href: "/what-changed", primary: false } };
  }

  // Activity: the last four events, as a date, a name, an event, and a number. Never a line from a file.
  const events: { at: string; what: string; value: string; good?: boolean }[] = [];
  for (const c of cards) {
    if (c.kind === "deliverable" && (c.three_minute_test === "passed" || c.three_minute_test === "failed"))
      events.push({ at: c.graded_on, what: "Three-minute test", value: String(c.three_minute_test), good: c.three_minute_test === "passed" });
    else if (c.kind === "deliverable") events.push({ at: c.graded_on, what: "Scorecard sent for a piece of work", value: typeof c.pass_count === "number" ? `${c.pass_count} passes` : "sent" });
    else if (c.kind === "skill_retest") events.push({ at: c.graded_on, what: `Re-test: ${String(c.skill_slot).replace(/_/g, " ")} skill`, value: String(c.drift_result ?? "done").replace(/_/g, " ") });
    else if (c.kind === "worksheet") events.push({ at: c.graded_on, what: `Worksheet ${c.worksheet_id} ${c.status === "revisited_v2" ? "revisited" : "completed"}`, value: "sent" });
  }
  for (const r of runs) events.push({ at: r.at, what: "Draft checked", value: `${r.flags} flag${r.flags === 1 ? "" : "s"}` });
  for (const c of capCards) if (c.fileLine) {
    const f = fileFor(c.cap, files)!;
    events.push({ at: f.updatedAt, what: `${c.cap.fileName} changed`, value: f.version ? `v${f.version}` : "saved" });
  }
  const activity = events
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4)
    .map((e) => ({ date: short(e.at), what: e.what, value: e.value, good: e.good }));

  return { top, cards: capCards, next, activity };
}

// Which release-log entries ask for a re-test (a new surface with nothing to re-test doesn't).
export const needsRetest = (reTest?: string) => !!reTest && !/^not needed/i.test(reTest.trim());
