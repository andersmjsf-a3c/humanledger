import type { Worksheet } from "./types";

// Part 0: set up. Prompts follow the workbook outline. The "why" and "example" text is a
// placeholder until the compounding-ai-workbook skill drafts it from Mark's journey bank.
// Product facts (plans, menus, settings names) get verified and dated before launch.

const MARK = (what: string) => `[MARK: ${what}]`;

export const PART_0: Worksheet[] = [
  {
    id: "0.1", part: "0", slug: "your-account", draft: true, minutes: 15,
    title: "Your account and the window",
    promise: "You'll know what plan you're on and why, what's on the screen, and where your conversations go. About 15 minutes.",
    why: MARK("why the account basics matter, one short story"),
    example: MARK("your plan and why you chose it"),
    prompts: [
      { id: "plan", kind: "short", label: "Which plan are you on?", expected: "a few words" },
      { id: "plan_why", kind: "long", label: "Why that plan, for the work you do?", expected: "two sentences" },
      { id: "panels", kind: "long", label: "Name what you see on the screen and what each part is for.", expected: "one line per part" },
      { id: "history", kind: "short", label: "Where do your past conversations go, and how do you find one again?", expected: "one sentence" },
    ],
    compounds: "Knowing your own setup means every later worksheet starts from what you actually have, not what you guess you have.",
  },
  {
    id: "0.2", part: "0", slug: "files-in-files-out", draft: true, minutes: 20,
    title: "Files in, files out",
    promise: "You'll have attached a document, pasted text, and downloaded a result, and you'll know what it can read. About 20 minutes.",
    why: MARK("why files matter more than typing"),
    example: MARK("a file you attached and what came back"),
    prompts: [
      { id: "attached", kind: "short", label: "What did you attach, and what did you ask it to do?", expected: "one sentence" },
      { id: "pasted", kind: "short", label: "What did you paste in instead of attaching, and why?", expected: "one sentence" },
      { id: "downloaded", kind: "short", label: "What did you download, and in what format?", expected: "one sentence" },
      {
        id: "can_read", kind: "table", label: "What it could read when you tried",
        rows: ["PDF", "Word document", "Spreadsheet", "Image"], columns: ["Tried it? (yes/no)", "What happened"],
      },
    ],
    compounds: "Once you know what goes in and comes out, you stop retyping things it could have read for you.",
  },
  {
    id: "0.3", part: "0", slug: "what-an-md-file-is", draft: true, minutes: 15,
    title: "What an .md file is",
    promise: "You'll read and write a Markdown file: plain text with a few symbols. About 15 minutes.",
    why: MARK("why every chapter of these books is an .md file"),
    example: MARK("a short .md file of yours, with the symbols showing"),
    prompts: [
      { id: "first_file", kind: "long", label: "Write a short .md file: a heading, two bullets, and one bold word.", expected: "five lines" },
      { id: "symbols", kind: "long", label: "In your own words, what do #, -, and ** do?", expected: "one line each" },
      { id: "why_md", kind: "short", label: "Why do skills and notes live in plain-text files?", expected: "one sentence" },
    ],
    compounds: "Every skill you build from here on is an .md file. Being able to read one means you can fix one.",
  },
  {
    id: "0.4", part: "0", slug: "conversations-projects-memory", draft: true, minutes: 20,
    title: "Organizing: conversations, projects, memory",
    promise: "You'll start a conversation on purpose, make one project, and know what follows you between rooms. About 20 minutes.",
    why: MARK("rooms: why separate conversations and projects keep work clean"),
    example: MARK("the Book and Vorixs projects as rooms"),
    prompts: [
      { id: "new_convo", kind: "short", label: "What did you start a new conversation for, and why not continue an old one?", expected: "one sentence" },
      { id: "project", kind: "long", label: "Name your first project and what belongs in it.", expected: "two sentences" },
      { id: "memory", kind: "long", label: "What does it remember about you between conversations, and what did you tell it on purpose?", expected: "three lines" },
    ],
    compounds: "Rooms keep one job from bleeding into another, and memory you chose on purpose saves you repeating yourself.",
  },
  {
    id: "0.5", part: "0", slug: "artifacts-and-outputs", draft: true, minutes: 20,
    title: "Artifacts and outputs",
    promise: "You'll edit, save, and share one thing it built, and know where skills live. About 20 minutes.",
    why: MARK("why keeping outputs matters"),
    example: MARK("one thing you built, edited, and shared"),
    prompts: [
      { id: "built", kind: "short", label: "What did it build for you?", expected: "one sentence" },
      { id: "edited", kind: "short", label: "What did you change in it yourself?", expected: "one sentence" },
      { id: "shared", kind: "short", label: "Who did you share it with, and how?", expected: "one sentence" },
      { id: "skills_where", kind: "short", label: "Where do your skills live, and what's the fallback if you can't save one?", expected: "one sentence" },
    ],
    compounds: "What you keep, you can improve. What stays in a chat window, you rebuild.",
  },
  {
    id: "0.6", part: "0", slug: "five-settings", draft: true, minutes: 15,
    title: "Five settings worth knowing",
    promise: "You'll have a dated table of five settings and how yours are set. About 15 minutes.",
    why: MARK("why these five, and why the table is dated"),
    example: MARK("your own settings table"),
    prompts: [
      { id: "checked_on", kind: "date", label: "Date you checked these" },
      {
        id: "settings", kind: "table", label: "Your settings",
        rows: ["Web search", "Memory", "Past-chat search", "Model choice", "Where preferences live"],
        columns: ["How yours is set", "Why"],
      },
    ],
    compounds: "Settings change with releases. A dated table tells you what to re-check, instead of wondering why it behaves differently.",
  },
  {
    id: "0.7", part: "0", slug: "models-and-platform-changes", draft: true, minutes: 30,
    title: "Models and platform changes",
    promise: "You'll have a dated model table, a one-page change log, and the hour-long re-test routine. About 30 minutes.",
    why: MARK("the Chapter 11 argument in two sentences: habits over buttons"),
    example: MARK("your change log entry from a real release"),
    prompts: [
      { id: "checked_on", kind: "date", label: "Date you checked these" },
      {
        id: "models", kind: "table", label: "The models you use",
        rows: ["Model 1", "Model 2", "Model 3"], columns: ["Name", "What you use it for"],
      },
      { id: "changelog", kind: "long", label: "Your first change log entry: what changed, what you noticed, what you re-tested.", expected: "three lines" },
      { id: "retest", kind: "long", label: "Your re-test routine: which skills you'll re-run after a release, and on what.", expected: "a short list" },
    ],
    compounds: "A release is the moment skills drift. A routine you wrote down is one you'll actually run.",
  },
];
