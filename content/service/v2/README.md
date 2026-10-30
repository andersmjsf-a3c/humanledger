# Humanledger v2: simpler, starters first (Oct 30 2026)

Mark's direction after testing: too confusing; a user shouldn't need the book to understand the service; lead with prebuilt skills the user customizes; add visuals.

## What's here
- `homepage-v2.html`: the new one-screen homepage. Headline, four-panel how-it-works picture, six starter cards with one button each ("Make it mine"), a "What a skill is" section with the annotated file picture, and a quiet "When something's confusing" row at the bottom (glossary, Where things live, What changed, the content pages). Replaces homepage-mockup.html. The dashboard (`/your-ai`) is unchanged.
- `illustrations/how-it-works.png` and `.svg`: pick a starter → answer three questions → load it into Claude → it gets better as you fix it.
- `illustrations/a-skill-file.png` and `.svg`: a skill file with five callouts (the job; your three answers; the steps; what it must never do; where corrections go).
- `starters/starters.json`: the seven starters (the seventh, My work register, is the productivity tool and a preview of the agents layer; it runs as a scheduled task and only reads and reports), each with exactly three questions (key, label, hint, type: text or list3) and the worksheet that becomes its Version 2.
- `starters/*.md`: the six skill files, complete, with `{{placeholders}}` for the three answers. Everything else ships as written. Each ends with a `## Corrections` section the connector appends to.

## The flow, per starter
1. User clicks "Make it mine." No account needed.
2. A three-field form (from `starters.json`), hints shown as placeholders. Three is the ceiling.
3. On submit: fill the placeholders, show the finished file (rendered like the annotated picture), with two buttons: "Download for Claude" (ZIP with SKILL.md, folder named for the skill) and "Keep it in my vault" (this is the sign-in moment).
4. After a week of use, the dashboard offers Version 2: the full worksheet named in `worksheetV2`, pre-filled with the three answers.

## Rules
- Never more than three questions before the file exists.
- The file the user gets on day one must be good enough to use as-is. If a starter needs more than three answers to be useful, fix the starter.
- Placeholders are the only part the user wrote; show them in green in the rendered view, as in the picture.
- `list3` answers render as three bullet lines.
- Privacy line stays on the page ("We keep the scores. Your files stay in your vault; we never read them.") and the form says "this stays in your vault" above the fields.
- Old homepage v1 and the eight content pages stay as the "Why any of this works" layer behind the bottom row; they aren't the front door anymore.

## Screenshots
In `screenshots/`, eight anonymized real screens with `captions.md` saying what each shows and where it goes. Use them on the content pages, the Where things live page, and the worksheets wherever a reader would otherwise have to imagine a screen. Dated Oct 30 2026; retake when the screen changes.

### Previously
Real screenshots of Mark's own Claude window, captioned and dated like the Where things live rows: the window's four parts; Settings > Your Claude (memory); Customize > Skills with a skill uploaded; the model name next to the send button; a conversation with a skill loaded, before and after. Drawn imitations of the product's interface are off the table.
