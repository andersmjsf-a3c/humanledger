# Humanledger (placeholder name)

A private ledger for people who lead their AI. The record is ours. The work is yours.

This is weeks 1 and 2 of the eight-week MVP in `stack.md`: an empty app with sign-in, the data model,
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

- `content/workbook/part0/`: the drafted worksheets, copied unchanged from the compounding-ai-workbook
  skill's `references/drafts/`. **They are the source.** Pages never carry their own copy of the text.
- `npm run worksheets` parses them into `src/worksheets/generated/worksheets.json`. Every `_____` line,
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

To update a worksheet: copy the new draft into `content/workbook/<part>/`, run `npm run worksheets`, commit both.

## Next: week 3

Part A (A1 to A5), drafted with the workbook skill.
