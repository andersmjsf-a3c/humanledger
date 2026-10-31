# Your AI dashboard (signed in): spec

Oct 29 2026. Mockup: `dashboard-mockup.html` (and the second artboard on the Humanledger Homepage canvas).

## Principle
Before sign-in, the eight tiles are a menu of questions. After sign-in, the same eight tiles, in the same positions, become the user's capabilities. Nothing moves; the tiles change what they say. A user with nothing kept sees exactly the pre-sign-in grid plus four zeros. No profile-completion prompts, ever.

## Top row: four numbers (the scorecard)
`filesKept`, `checksRunThisWeek`, `threeMinuteTestsPassed` (as "n of m"), `skillsToRetest` (count of kept skills whose last re-test predates the most recent release entry in what-changed.json; highlighted when > 0). These are the only aggregate figures on the page and they come from the ledger, never from file contents.

## Card anatomy (one per capability)
| Field | Source | Shown as |
|---|---|---|
| `state` | vault + connector | dot: Not started (grey) · Tried (amber) · Kept (light green) · Connected (green) |
| `file` | vault metadata | filename · version · date changed |
| `connection` | connector or export log | "Loaded in Claude", "In your vault, not yet in Claude", "In Claude's memory" |
| `health` | ledger | one line per capability (table below) |
| `nextStep` | coach rules | one line, amber when it's a re-test or a drift fix, green when healthy |
| `action` | derived from nextStep | one button; primary style when amber |

State transitions: Not started → Tried when the user completes a Try it now on the page (no account needed; stored locally until sign-in, then merged). Tried → Kept when a worksheet is saved to the vault. Kept → Connected when the file is exported in Claude's skill format or written through the connector, or (for about-me) when the user confirms memory saved it.

## Health line per capability
| Capability | File | Health line |
|---|---|---|
| Write something that sounds like me | my-voice.md | linter flags per draft, this month vs last |
| Check whether it's true | fact-check.md | runs this week; catches by status |
| Teach it a job | first skill file | times run; last test date |
| Find out something I can rely on | research.md | "couldn't verify" line present: yes/no |
| Make a deck someone will judge | pass log (C5) | passes on last deliverable; catches me/tool/standard |
| Figure out what just changed | platform-changes.md | entries; releases since last entry |
| Keep it from forgetting who I am | about-me.md | memory confirmed date; projects set up |
| Give it a job to do on its own (new 9th tile) | agent job card (C2) | boundary present: yes/no; staged vs released counts |
Understand a word moves to the top nav as Glossary; it isn't a capability.

## Next-step rules (coach, v1, in priority order)
1. A release entry is newer than the file's last re-test → "Re-test after the [date] release" → Run the re-test.
2. Kept but not connected → "Export it so Claude loads it by name" → Export to Claude.
3. Kept, connected, Version 2 box never answered, file older than 7 days → "Version 2 questions are waiting" → Answer Version 2.
4. Tried, nothing kept → the page's Keep this line → Start the [worksheet].
5. Otherwise → "Healthy. Nothing to do" → Open in vault.

## Below the grid
"Next for you": the single highest-priority next step across all cards, with a one-paragraph why and one button. Beside it, the activity list: the last four ledger events (file created, version approved from a Claude proposal, check run with catch count, three-minute test result). Each is a date, a filename, an event, a number. Never a sentence from a file.

## Privacy, on this page
- Header line under the title: "We keep the scores. Your files stay in your vault." with a link to What we can see.
- Footer: "Privacy: what leaves your vault (scores only)."
- Cards never render file content. "Open in vault" shows the file from the user's own storage, client-side.
- Every version bump that came from a Claude proposal through the connector is shown in the activity list as "Claude proposed a rule, you approved it."

## Oct 30 2026: three tiers on Your AI (Mark)

Your AI is organized in three sections, top to bottom, under the four-number scorecard.

1. **Starter Skills** (live). The eight starters as capability cards, exactly as specified above (state dot, file and version, health line, next step, one button). Subhead: "Eight skills we wrote, made yours with three answers each. Live now." Card titles match the starter names: Write like me · Check the facts before I send · My weekly report · Research I can trust · Who my company is · My posts · My work register · About me.
2. **Build Skills** (Coming soon badge). Subhead: "Bigger jobs, built on your starters. Each one reads your voice, your company, and your fact pass before it starts." Four dashed placeholder cards, title and one line each, no button: Brand · Go-to-market · Presentations · Proposals, plans, and reports. Copy in `dashboard-mockup.html`. These are examples; the list will grow.
3. **Advanced Skills** (Coming soon badge). Subhead: "For when your files are doing real work and you want them watched, tested, and shared." Four dashed placeholder cards: Agents with a boundary · Re-tests after every release · Claude updates your files · Your team's scorecard. These are hints at the roadmap (the connector, the drift watcher, the team dashboard), not commitments with dates.

Placeholder cards are not clickable and show no state. "Coming soon" is the only promise made. When a Build or Advanced skill ships, it moves from a dashed card to a live card with the same anatomy as a starter.

**Brand line.** Under the Humanledger wordmark on every page, a small uppercase "Beta" in the accent color. Change it to "MVP" if Mark prefers that word; the mockups use Beta.
