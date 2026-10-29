# Service content: "What are you trying to do?" pages

Eight pages, one per homepage tile, drafted Oct 26 2026 for the beta. Drop into the Vercel app as the front end to the workbook sections. Company voice, second person, no first person, no founder stories, illustrations labeled and built on the six standing personas (human-led-service skill, references/personas.md).

Each page has the same shape, in this order:
1. **The rule**: the habit and the reasoning behind it, three or four paragraphs.
2. **Try it now**: something to paste into the user's own AI, with blanks. No account needed.
3. **What it looks like**: one labeled illustration ("An illustration, not a real person."), one persona, consistent across pages.
4. **Keep this**: the handoff. "Turn it into a file" opens the matching workbook section, pre-filled from what the user typed in Try it now.

Frontmatter: `slug`, `title`, `summary` (for the tile and meta description), `worksheets` (the sections the Keep this button opens, first one primary), `glossary` (terms to link), `persona`.

| # | Tile | File | Opens workbook | Persona |
|---|---|---|---|---|
| 1 | Write something that sounds like me | 01-write-something-that-sounds-like-me.md | B2, A3 | solo consultant |
| 2 | Check whether something it told me is true | 02-check-whether-something-it-told-me-is-true.md | B5, A5 | practice owner |
| 3 | Teach it a job I do every week | 03-teach-it-a-job-i-do-every-week.md | B1 | sales manager |
| 4 | Find out something I can rely on | 04-find-out-something-i-can-rely-on.md | B4 | nonprofit director |
| 5 | Make a deck or a one-pager someone will judge | 05-make-a-deck-or-one-pager-someone-will-judge.md | C5, B3 | first-year founder |
| 6 | Figure out what just changed | 06-figure-out-what-just-changed.md | 0.7, A4 | teacher |
| 7 | Keep it from forgetting who I am | 07-keep-it-from-forgetting-who-i-am.md | A1, 0.4 | solo consultant |
| 8 | Understand a word everyone keeps using | 08-understand-a-word-everyone-keeps-using.md | glossary (no form) | none |

Also in this folder: `homepage-mockup.html`, the approved Oct 26 homepage as a standalone page (open it in a browser; it's a reference for order, copy, and the eight tiles, not production CSS), and `homepage-copy.md`, the same text as plain copy.

Pages 6 and 8 depend on two reference pages that need real, dated content before beta: **Where things live** and **the glossary**. The glossary text exists (book back matter, 25 terms, already anonymous). Where things live needs the Part 0 product check re-run against today's screens and dated.

Not yet written (next): the Where things live page as product copy with a "last checked" date; the release log's first two entries; a tile for "Give it a job to do on its own" (agents, C2) once Part C ships.
