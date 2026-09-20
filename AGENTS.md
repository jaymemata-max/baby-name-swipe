# Working on this repo

Orientation for any coding agent picking this up (Codex reads this file;
Claude Code reads it too). Humans: `README.md` is the friendlier entry point.

## What this is

A baby name swiping app for exactly two people: Merel and Jayme, expecting
their first child. They swipe names separately; when both say yes to the same
name it becomes a match in a shared list. Private, personal, not a product.

Next.js 15 App Router + Supabase Postgres, deployed on Vercel Hobby and the
Supabase free tier. Zero budget is a hard constraint, not a preference.

## Invariants - do not break these

**1. Authorisation lives in Postgres, not in route handlers.**
Every table has row level security scoped to `current_couple_id()`. Route
handlers forward the user's session and let Postgres decide. Never use the
service role key in application code. Never add a route that reads data with
elevated privileges "just for this one case".

**2. Matching is a database trigger.**
`sync_match()` fires after every swipe insert, update and delete. Do not
reimplement match detection in TypeScript: two people swiping the same name
in the same second is a real scenario here, and the trigger is what makes it
correct.

**3. `matched_now`, not `matched`.**
The celebration fires on `matched_now`. `matched` stays true when a name that
already matched is re-swiped.

**4. No authentication bypasses.**
The generated UI shipped three ("Preview Mode", "Proceed to App", an identity
switcher in Settings) and all three were removed. Do not add a demo login, a
"continue as" button, or anything that sets a session without the emailed
link. See `docs/DECISIONS.md`.

**5. Failures must be visible.**
No `catch` that swallows an error and continues as if it worked. The sign-in
screen had exactly that bug: a link that was never sent looked like one that
was.

**6. Custom names are not auto-liked.**
Adding a name puts it in both decks. Whoever added it still has to swipe it,
or "we both chose this" means nothing.

## Layout

```
src/app/api/          route handlers, one file per resource
src/app/page.tsx      renders <AppShell/>, everything below is client-side
src/components/       15 screen and widget components
src/hooks/            useMe, useDeck, useMatches, usePWAInstall
src/lib/api.ts        session helpers, ApiError -> HTTP mapping
src/lib/schemas.ts    zod request validation
src/lib/types.ts      API envelope types
src/lib/supabase/     server, browser and middleware clients + row types
supabase/migrations/  schema, RLS, functions, name catalogue (5 files)
supabase/tests/       schema tests, run against a throwaway Postgres
```

## Checks - all four must pass before you push

```bash
npm run typecheck
npm run lint            # 0 errors; a handful of unused-var warnings are known
npm run build           # needs NEXT_PUBLIC_SUPABASE_* set to anything
./scripts/test-schema.sh   # 4 suites, needs postgres server binaries, not Docker
```

`test-schema.sh` builds a disposable cluster, applies all five migrations
against a stubbed `auth` schema, and impersonates users with
`set local test.uid = '<uuid>'`. It needs to run as a non-root user.

For the build, placeholders are fine:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build
```

## The API

`docs/API.md` is the contract and it is accurate. If you change a route,
change that file in the same commit. The generated UI was built against it,
so drift between the two is how the frontend silently breaks.

## Migrations

Additive only, new file with a later timestamp. The catalogue is a migration
(`20260913120300_seed_names.sql` plus the language tagging in
`20260920100000_name_languages.sql`), not a seed script, so it deploys
everywhere. Editing an applied migration in place will not reapply.

## Name catalogue

290 names, each tagged `works_in text[]` with the languages a native speaker
can pronounce it in naturally: `en`, `es`, `nl`, `fr`. It means sayable, not
identical - `Julia` is all four, `Gijs` is Dutch only. The couple speaks
Dutch, English and Spanish, so the deck defaults to `en,es,nl`, which leaves
173 names. Retagging one name is a single `UPDATE`.

## Known open risk

Only the sign-in screen has been exercised against a running server. The
deck, matches, add-name and settings screens typecheck and build but have
never been driven with real data. Expect the first real swipe to surface
something. `docs/CODEX_PROMPT.md` is a task for closing exactly that gap.

## Two agents, one repo

If more than one agent is working here, stay in your lane and push to your
own branch. Do not force-push a branch you did not create. The default branch
is `main`; open a PR rather than pushing to it directly.
