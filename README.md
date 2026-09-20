# Baby Name Swipe

Swipe baby names, match on the ones you both love. Built for two people.

Boy names, girl names, unisex. You each swipe on your own. When you both say
yes to the same name it becomes a match, and neither of you sees the other's
answers until then - so nobody is nudged into agreeing.

## Status

**Backend is done and tested. The swipe interface is next.**

- [x] Schema, row level security, match logic
- [x] REST API for onboarding, deck, swipes, matches, custom names
- [x] 290-name catalogue, tagged by which languages it is pronounceable in
- [x] Schema tests covering matching, security and the couple rules
- [ ] Swipe UI
- [ ] Realtime "it's a match" popup
- [ ] Shortlist screen

## Stack

| | |
| --- | --- |
| Framework | Next.js 15 (App Router), TypeScript |
| Database | Supabase Postgres with row level security |
| Auth | Supabase magic links |
| Hosting | Vercel Hobby + Supabase Free, EUR 0/month |

See [`docs/HOSTING.md`](docs/HOSTING.md) for the cost breakdown, the one thing
that actually breaks on the free tier, and the alternatives that were ruled
out.

## How it works

Authorisation lives in Postgres, not in the API layer. Every table has row
level security scoped to your couple, so a route handler cannot leak another
couple's data even if it forgets a `where` clause. The API forwards your
session and Postgres decides what you may see.

Matching is a database trigger, not application code. If you both swipe the
same name in the same second, you still get exactly one match.

Every catalogue name is tagged with the languages a native speaker can say it
in (`en`, `es`, `nl`, `fr`). `Gijs` is Dutch-only; `Mateo` works in all four.
The deck can filter on that, so a mixed-language family never has to argue
about a name half of them cannot pronounce.

```
couples ──┬── profiles (2)
          ├── names (custom) ──┐
          ├── swipes ──────────┤
          └── matches ─────────┘
                               └── names (shared catalogue, couple_id null)
```

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in from Supabase -> Settings -> API
npm run dev
```

To run the whole stack locally you need Docker and the
[Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npx supabase init        # first time only, writes supabase/config.toml
npx supabase start
npx supabase db reset    # applies migrations + the name catalogue
```

You do not need any of that to work on the schema - `./scripts/test-schema.sh`
runs against a plain local Postgres.

## Tests

The schema tests spin up a throwaway Postgres, apply the migrations, and check
the parts that are easy to get wrong. No Supabase account needed.

```bash
./scripts/test-schema.sh
```

They cover: the match trigger, `is_love`, cross-couple isolation, forged
swipes, direct writes to `matches`, undo, ruling a name out, retro-matching
when a partner joins late, and the couple capacity rules. See
[`supabase/tests/README.md`](supabase/tests/README.md).

```bash
npm run typecheck
npm run lint
npm run build
```

## Docs

- [`docs/API.md`](docs/API.md) - every endpoint, with request and response shapes
- [`docs/HOSTING.md`](docs/HOSTING.md) - deployment, free-tier limits, cost
- [`docs/DECISIONS.md`](docs/DECISIONS.md) - why things are the way they are

## Layout

```
src/app/api/        route handlers
src/lib/api.ts      session helpers, error to HTTP mapping
src/lib/schemas.ts  request validation (zod)
src/lib/supabase/   server, browser and middleware clients
supabase/migrations schema, RLS, functions, name catalogue
supabase/tests/     schema tests
scripts/            test runner
```
