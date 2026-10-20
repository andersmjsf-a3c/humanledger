# Humanledger (placeholder name)

A private ledger for people who lead their AI. The record is ours. The work is yours.

This is week 1 of the eight-week MVP in `stack.md`: an empty app with sign-in, the data model,
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

## Next: week 2

The worksheet engine and Part 0: worksheets defined as data, local save, "Save to my folder", "Open from my folder".
