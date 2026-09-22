# Hosting: what it costs and what actually breaks

Target: two people, one baby, an app that stays online for about a year.
Budget: nothing.

## Recommendation

**Vercel Hobby + Supabase Free. EUR 0/month.**

| Piece | Provider | Free allowance | What we will actually use |
| --- | --- | --- | --- |
| Web app + API | Vercel Hobby | 100 GB bandwidth/month | A few MB |
| Postgres + Auth + Realtime | Supabase Free | 500 MB database, 50k monthly users | Under 1 MB, 2 users |
| Scheduled ping | GitHub Actions | 2,000 min/month on private repos | ~1 min/month |

### Why this is not close

Two people swiping a 400-name catalogue produce roughly:

- 2 profile rows
- 1 couple row
- ~800 swipe rows
- ~100 match rows

That is a few hundred kilobytes including indexes, against a 500 MB limit.
There is no realistic growth path where this app costs money. Do not spend
time optimising storage.

## The one real problem: Supabase pauses free projects

**A free Supabase project pauses after 7 days with no activity.** It does not
delete anything, and you restore it with one click in the dashboard, but the
app is down until someone notices. For an app you open in bursts (a few
evenings, then nothing for two weeks) this will bite.

Two fixes, use both:

1. `.github/workflows/keepalive.yml` pings `/api/health` every three days.
   That endpoint runs a real query, so it counts as activity.
2. Know where the "Restore project" button is, so a pause costs 30 seconds
   rather than an evening.

**Caveat on the keep-alive:** GitHub disables scheduled workflows in a
repository that has had no commits for 60 days. It emails you first. If you
stop committing, the ping stops too. Push anything to re-enable it.

## Alternatives, and why not

| Option | Free tier | Why not chosen |
| --- | --- | --- |
| **Neon + Vercel** | 0.5 GB, scales to zero, resumes in ~500 ms, no 7-day pause | No built-in auth or realtime. You would hand-roll magic links and poll for matches. More code for one solved problem. |
| **Cloudflare Pages + D1** | 5 GB, no pause at all | SQLite, so no row level security. Every authorisation rule moves into application code, where it is easier to get wrong. Also no realtime. |
| **Turso** | Generous | Same RLS and auth gap as D1. |
| **Fly.io / Railway** | Trial credit, then paid | Costs money eventually. Ruled out. |

The honest summary: **Neon and D1 both remove the pause problem but cost you
auth, realtime, and row level security.** The keep-alive workflow solves the
pause in twelve lines of YAML. That trade is worth it.

## Do you even need the API layer?

Fair question. Row level security is strict enough that the browser could talk
to Supabase directly and the API routes could go away entirely.

The routes earn their place for three things:

1. **`POST /api/swipes` answers "did that match?" in one round trip.** Direct
   from the browser this is three queries and a race condition.
2. **Input validation in one place** (`src/lib/schemas.ts`), so a typo in the
   client cannot write junk.
3. **A stable contract** if the frontend is ever rebuilt or a second client
   (a phone shortcut, a widget) is added.

If you want it leaner later, the realtime subscription for match popups should
go straight to Supabase from the browser. That is what realtime is for.

## Going live, in order

Roughly 30 minutes. Steps 1-3 are Supabase, 4-5 are Vercel, 6-7 are the two
things people forget.

### 1. Create the Supabase project

At supabase.com. Pick the region closest to where you actually are:
`eu-central-1` (Frankfurt) for the Netherlands, `us-east-1` for Aruba.

Save the database password in a password manager. You cannot read it back
later, only reset it.

### 2. Apply the schema

Apply every migration in filename order. Two ways:

**CLI** (repeatable, use this if you plan more schema changes):

```bash
npx supabase init          # writes supabase/config.toml, first time only
npx supabase link --project-ref YOUR-REF
npx supabase db push
```

No Docker needed: `db push` talks to the hosted project directly.

**SQL Editor** (fewer moving parts, fine for a one-off): open each file in
`supabase/migrations/` in filename order and run it. Order matters, the later
ones depend on the earlier ones.

Check it worked:

```sql
select count(*) from names;                      -- 408 after all migrations
select count(*) from names where works_in @> '{en,es,nl}';  -- 173
```

### 3. Configure auth

Authentication → Providers: leave **Email** on. Turn **Confirm email** on.

Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: add `https://your-app.vercel.app/auth/callback`
  and `http://localhost:3000/auth/callback` for local work

The callback URL has to match exactly or the magic link lands on an error.

### 4. Deploy to Vercel

Import the GitHub repository. Framework detection picks up Next.js on its own.

Environment variables, all three environments (Production, Preview,
Development), from Supabase → Project Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

That is the whole list. The anon key is meant to be public; row level security
is what protects the data. **Never put the service role key in a
`NEXT_PUBLIC_` variable** - it bypasses RLS entirely and nothing in this app
needs it.

### 5. Both of you sign in, once

1. One of you opens the app, signs in, and taps **Start a list**.
2. Send the 6-character invite code to the other.
3. They sign in and tap **Join your partner**, enter the code.

Do this before step 6, or you will lock yourselves out.

### 6. Close the door

Authentication → Sign In / Providers → **disable new user signups**.

This is the one real security exposure: a public URL with open registration
lets anyone create an account. Two people are signed in, nobody else needs to
be. Takes one click and is reversible.

### 7. Turn on the keep-alive

GitHub repo → Settings → Secrets and variables → Actions → New repository
secret:

- Name: `HEALTHCHECK_URL`
- Value: `https://your-app.vercel.app/api/health`

Then Actions → "Keep Supabase awake" → Run workflow, to check it works rather
than finding out in seven days.

### 8. Put it on your home screens

Open the app in Safari (iOS) or Chrome (Android) → Share → Add to Home Screen.

Do this on both phones. It is not cosmetic: **web push on iOS only works for
apps installed to the home screen.** Without it you get the in-app toast and
the tab badge, but nothing when the app is closed.

## Things that will go wrong

**The magic link does not arrive.** Supabase's built-in email service is rate
limited to a handful of messages per hour and is explicitly not meant for
production. For two people signing in a few times that is fine. Check spam
first. If you hit the limit, wait an hour or connect your own SMTP under
Authentication → Emails.

**The link opens on an error page.** The redirect URL in step 3 does not match
the deployed URL exactly. Vercel preview deployments get their own URLs, so
either add them or test on the production URL.

**Matches appear for one of you but not live for the other.** Realtime is
published for `matches` by the migrations. Check Database → Replication that
`supabase_realtime` includes it.

**The app is down after a quiet fortnight.** The project paused. One click in
the dashboard restores it, and step 7 is what stops it recurring.

## Limits change

Every number here is from the providers' free tiers as of early 2026. They get
revised. Before assuming a limit still holds, check the pricing page.
