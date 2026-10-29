# Humanledger (placeholder name)

A private ledger for people who lead their AI. The record is ours. The work is yours.

This is weeks 1 to 5 of the eight-week MVP in `stack.md`: an empty app with sign-in, the data model,
the scorecard submit route, and the five privacy guards running in CI. Product docs live in the
claude.ai Project "Human Led Web Service".

## Run it

```
npm install
cp .env.example .env.local      # fill in DATABASE_URL
npm run db:migrate
npm run dev
```

With no `RESEND_API_KEY`, sign-in links print to the terminal in development.

`npm run check` runs typecheck, lint, and tests. Tests use an in-process Postgres (PGlite) with the
real migrations, so they need no database.

## The five privacy guards

The build fails if any of these break.

1. **Schemas admit no free text** (`tests/1-schema-guard.test.ts`). Every scorecard and coach field is a
   bounded number, a date, a category, or true/false. 10 sample cards that must be rejected are rejected.
2. **No content columns** (`tests/2-column-guard.test.ts`). Every text column is on an allowlist with a reason;
   `scorecards.card` is the only JSON column, and it only ever holds a validated card.
3. **Human-only submit path** (`tests/3-submit-route.test.ts`). No bearer tokens or API keys; same origin,
   same-site cookie, and CSRF token required; invalid cards rejected without echoing their contents.
4. **The vault can't reach the network** (`tests/4-vault-no-network.test.ts` plus an ESLint rule on `src/vault/**`).
5. **Logs carry no content** (`tests/5-log-redaction.test.ts`). One logger, a field allowlist, and nothing else
   may print.

## Where things are

- `src/config/brand.ts`: the product name, in one place.
- `src/schemas/`: `scorecard.schema.json` and `coach-recommendation.schema.json`, shared with the grading skill.
- `src/lib/db/schema.ts`: six tables. No column holds text a person wrote.
- `src/lib/auth/`: magic-link sign-in. Tokens and session ids are stored only as hashes.
- `src/lib/http/guards.ts`: the human-only guard on the submit route.
- `app/api/scorecards/route.ts`: the only way into the ledger.
- `src/vault/`: browser-only storage for worksheet answers (week 2).

## The workbook (week 2)

- **The workbook skill is the master; this site reads from it.** When a worksheet is revised, the handoff
  is the `compounding-ai-workbook` `.skill` file, and it's expected to change often:

  ```
  npm run import:workbook -- path/to/compounding-ai-workbook.skill   # worksheets + skill templates
  npm run import:workbook -- path/to/partA-drafts.zip                 # only the worksheets inside
  npm run import:workbook -- <file>.skill --only=templates            # just the templates
  npm run check
  git add -A && git commit
  ```

  The importer copies the drafts unchanged into `content/workbook/<part>/`. A `.skill` file is the whole
  set (drafts it no longer has are removed); a zip of `ws*.md` drafts only adds or replaces the worksheets
  inside it. It records every draft's hash and the import history in `content/workbook/SOURCE.json`, regenerates the pages' data, and prints what changed. It refuses a
  file that isn't this skill, and writes nothing unless every draft parses. Never edit `content/` by hand:
  `tests/8-workbook-source.test.ts` fails if a draft differs from what the last import recorded.
- **Answer keys follow the question, not its position** (`which-plan-are-you-on`, `setting.memory`).
  Inserting or reordering questions never attaches a reader's saved answer to the wrong question.
  Rewording a bold question changes its key; the importer lists those, because readers' saved answers to
  the old wording won't carry over (they stay in the reader's own folder files).
- `npm run worksheets` parses the drafts into `src/worksheets/generated/worksheets.json`. Every `_____` line,
  bullet blank, `( )` box, and table cell becomes a field; a numbered question with no blank gets a
  Done checkbox; underscores inside a sentence stay part of the question. The dated "How to" sidebar
  renders as its own box. `[MARK: ...]` brackets show in the flag color.
- `tests/6-worksheets.test.ts` fails if the generated file is stale, if any blank in a draft didn't
  become a field, or if any numbered question is missing or out of order.
- `src/vault/`: answers autosave to this browser (IndexedDB). "Save to my folder" writes one Markdown
  file per worksheet plus `.workbook/answers.json` into a folder the person picks (Chrome, Edge), or
  downloads a zip elsewhere. "Open from my folder" reads it back, strictly: unknown worksheets,
  fields, and non-text values are dropped.
- Guard 4 covers `src/vault`, `src/worksheets`, and `app/workbook`: none of it may reach the network.


## Skills (week 4)

- `content/workbook/templates/`: the starter-skill templates, copied unchanged from the workbook skill's
  `assets/`. Every `[bracket]` is a field; "your name" is one shared field across all of them.
- `/skills` and `/skills/<id>`: the template as written, with boxes where the brackets were, and a live
  preview of the file. Blank fields keep their brackets. Downloads: a zip with `<name>/SKILL.md`, ready to
  upload as a skill (valid `name` and `description` frontmatter), or the bare `SKILL.md`. The agent job
  description downloads as plain Markdown.
- "Save to my folder" also writes `skills/<name>/SKILL.md` for every started skill. The local version
  number goes up each time a changed skill is saved or downloaded.
- Buttons offer to copy a worksheet answer into a skill (A1's paragraph, A3's "never say"). Nothing is
  filled automatically.
- A `.skill` import that would remove worksheets the site has stops and lists them (`--allow-remove` to
  proceed). This catches a `.skill` file older than a drafts zip imported since.

## The two linters (week 5)

`/check`: paste a draft, get two reports. The draft is never saved or sent; each run keeps only counts, on
the device (IndexedDB `runs`).

- **Signs of AI writing** (`src/linters/baseline.ts`): a port of the generic groups of Mark's `ai_tells.py`
  (copied to `reference/`): hard zeros, tells, patterns, and the structural checks. The rule lists are
  generated from the original into `baseline-rules.json`. Mark's house style (hedges, honesty framing,
  intensifiers, dash rules) is left out. `tests/10-linters.test.ts` checks the port line for line against
  the original's output on the fixtures; `python3 scripts/baseline-parity.py --check` (in CI) keeps those
  fixtures current with the original.
- **Your rules** (`src/linters/voice.ts`): built only from the reader's files: the writing-voice skill
  (never-use list, Rules), A3 (never say, punctuation or style, format, length, words), and A4's
  corrections. "Never" lines become phrases or patterns to flag; word limits are checked; anything a
  program can't test becomes a "check these yourself" list. Each flag names the rule and where it was
  written. No rules yet: the page says so and points to A3.
- Flags point at ideas to rewrite, never word swaps. Counts map to the scorecard's `ai_tell_flags_found`
  and `voice_flags_found` categories (`src/linters/scorecard.ts`); text never does.

## Scorecards, review, history (week 6)

Schema 1.2 (`src/schemas/scorecard.schema.json`) adds `unverified_line` (boolean) to deliverable cards and
`site1.0` as the maker for cards the site writes. Older cards stay valid.

- **Making a card** (`src/cards/build.ts`): "Done with this worksheet" on each worksheet page makes a
  worksheet card (`completed`, or `revisited_v2` once one was sent), with an optional "I did the check step"
  box. The draft checker makes a deliverable card from the run's counts plus the A5 checks the reader
  ticks: the three-minute test (out loud, no notes) and whether they wrote the line listing what they
  couldn't verify. Neither page sends anything; both link to `/review#v1.<card>`.
- **`/review`** is the only page that sends. It shows every line in plain words (`src/cards/labels.ts`,
  tested to cover every schema field), the exact JSON, and a box on each optional line to hold it back.
  Send fetches a CSRF token and posts to `/api/scorecards`. Signed out, the card waits in this browser's
  localStorage (an hour at most) while the person signs in; the sign-in link returns to `/after-sign-in`,
  which reopens it.
- **`/history`** lists the signed-in person's own cards: each worksheet's latest status, then draft checks
  and graded work. `/api/me` answers only `{signedIn}`.
- Local e2e against a real Postgres: set `DATABASE_URL`; `DATABASE_POOL_MAX=1` if your local server
  accepts one connection.

## The grading skill (week 7)

`/grader` builds `grade-my-work.zip` in the browser with the site's address written in, so its review links
come back to this deployment. Source: `grader/grade-my-work/` (SKILL.md and `scripts/card.py`);
`npm run grader` packs it, with the site's own `scorecard.schema.json` and `src/cards/labels.json`, into
`src/grader/generated/grader.json`. A test fails if that file is stale.

- The skill grades in the person's Claude, gives the full report there, asks the two A5 questions, and
  writes the card. `python3 scripts/card.py preview|link CARD.json [--hold a,b]` checks it, previews it in
  the site's own words, and prints `/review#v1.<card>`. It never sends.
- `tests/12-grader.test.ts` runs `card.py` against 30 good and bad cards and requires the same verdict and
  the same plain-language rows as the site.
- Receipts ride on the card. The review page and history flag network attempts, content sent, or boundary
  events; they never block Send.
- The drift watcher (unattended re-tests) waits until after the beta.

## Staging

Vercel plus Neon, locked with Vercel's deployment protection. Setup: `docs/staging.md`. The `vercel-build`
script runs `scripts/migrate.ts` (applies `./drizzle` over `DATABASE_URL_UNPOOLED` or `DATABASE_URL`; skipped without either) before `next build`.
The site's address is `APP_URL`, or Vercel's production address when that's unset (`src/config/app-url.ts`).
The database is connected to Production only; preview deploys show pages but have no database.

## Content first: rings 1 and 2 (Oct 26)

The service is useful before anyone fills in a form (Mark, Oct 26 2026). The homepage is the approved Oct 26
mockup, rebuilt with the site's styles: "What are you trying to do?" and eight tiles.

- **Source.** `content/service/` holds the eight pages, the homepage copy, the glossary, and the personas,
  copied unchanged from the human-led-service skill's references. `npm run service` regenerates
  `src/service/generated/service.json`; a test fails if it's stale.
- **`/do/[slug]`**: the rule, Try it now (the prompt's [blanks] are fields; Copy it; what's typed stays in
  the tab's sessionStorage), the labeled illustration, and Keep this.
- **Keep this** opens the matching form (`FORM_ROUTES` in `src/service/index.ts`: A and 0.x worksheets, B
  sections as the skill builder's templates) and carries the filled prompt there, shown above the boxes to
  copy in. C5 isn't built yet and says so. No account needed: forms are local-first.
- **Ring 1:** `/glossary` (book-only rows left out), `/where-things-live` and `/what-changed`, which list
  nothing until `content/service/where-things-live.json` and `what-changed.json` are filled and dated, and
  `/privacy`, written from the code as it stands.
- **Company-voice worksheets (Oct 26):** all eighteen (0.1 to 0.7, A1 to A5, B1 to B6, C5) now come
  from the human-led-service skill: second person, "An example" as a labeled illustration on a standing
  persona. `content/workbook/SOURCE.json` records `worksheetsFrom: human-led-service`, so a
  compounding-ai-workbook `.skill` import brings only its templates (`--only=templates`); the
  human-led-service `.skill` imports the worksheets plus the content front end. The parser skips `##`
  headings inside code fences (example skills carry their own) and shows the "Version 2" box.
- **Dated reference data:** `content/service/where-things-live.json` (13 rows, each with source and last
  change) and `what-changed.json` (4 entries), checked Oct 26 against the help center.
  `tests/14-service.test.ts` scans service copy, worksheets, and data for named entities from the book
  and for em dashes.
- Look: white ground, accent #1F5F4A, Inter (self-hosted, no font requests to third parties). Placeholder
  until the brand work.

## Your AI: the signed-in dashboard (Oct 29)

Signed in, the homepage's tiles become the person's capabilities at `/your-ai` (spec:
`content/service/do/dashboard-spec.md`). Same tiles, same order; the glossary tile moves to the nav and a
dashed ninth tile (agents, C2) is added.

- `src/dashboard/model.ts` builds the page as a pure function from metadata only: which vault files exist
  and when they changed (read in the browser, never the answers), local check runs (counts), the person's
  own scorecards (`GET /api/ledger`), and the release log. Tested in `tests/15-dashboard.test.ts`.
- States: Not started, Tried (Copy on a page's Try it now; kept on this device), Kept (a worksheet or skill
  saved), Connected (exported in Claude's skill format, or memory confirmed for the paragraph about you).
- The coach's five rules pick each card's next step and the "Next for you" block; releases whose re-test
  says "Not needed" don't count.
- Header: Your AI and Vault when signed in, and Sign out (`POST /api/auth/signout`). The homepage sends a
  signed-in visitor to `/your-ai`, and so does the end of sign-in.

## Next: week 8

The beta: onboard readers and measure, with counts only, who finishes Part A and comes back to check real
work unprompted.
