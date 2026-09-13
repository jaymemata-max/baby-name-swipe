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

## Deploying

### Supabase (once)

1. Create a project at supabase.com. Pick the region closest to you
   (`eu-central-1` for the Netherlands, `us-east-1` for Aruba).
2. Save the database password somewhere real.
3. Apply the schema:
   ```bash
   npx supabase link --project-ref YOUR-REF
   npx supabase db push
   ```
4. Auth -> Providers: leave **Email** on, turn **Confirm email** on.
5. Auth -> URL Configuration: add your Vercel URL and
   `https://your-app.vercel.app/auth/callback` to the redirect allow list.
6. **Turn off public sign-ups once you have both signed in.** Auth -> Sign In /
   Up -> disable new user signups. This app is for two people; leaving
   registration open on a public URL is the only real security exposure here.

### Vercel

1. Import the GitHub repository.
2. Environment variables (all environments):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your production URL)
3. Deploy. No build configuration needed.

The anon key is safe in the browser. It is designed to be public, and row
level security is what stops it being useful to anyone else. **The service
role key must never appear in a `NEXT_PUBLIC_` variable** - it bypasses RLS
entirely.

### GitHub Actions keep-alive

Add a repository secret `HEALTHCHECK_URL` set to
`https://your-app.vercel.app/api/health`. The workflow does the rest.

## Limits change

Every number here is from the providers' free tiers as of early 2026. They get
revised. Before assuming a limit still holds, check the pricing page.
