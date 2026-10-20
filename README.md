# Humanledger (placeholder name)

A private ledger for people who lead their AI. The record is ours. The work is yours.

This is weeks 1 to 4 of the eight-week MVP in `stack.md`: an empty app with sign-in, the data model,
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

## Next: week 5

The voice linter and the AI-tell linter, running in the browser on pasted text.
