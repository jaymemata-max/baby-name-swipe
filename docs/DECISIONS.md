# Decisions

Short notes on choices that are not obvious from the code, and the ones worth
revisiting.

## Authorisation lives in Postgres, not in route handlers

Every table has row level security scoped to `current_couple_id()`. The API
never uses the service role key, so a forgotten `where couple_id = ...` in a
handler leaks nothing.

This was checked, not assumed: `supabase/tests/02_security_and_undo.sql` has a
third user try to read the other couple's swipes, matches, couples and
profiles, and try to write a swipe under someone else's id. All blocked.

## Matches are a trigger, not application code

`sync_match()` runs after every swipe insert, update and delete. Doing it in
the API would mean read-then-write, which races if both partners swipe the
same name at the same moment - plausible when two people sit on the sofa
swiping together.

The trigger also means matches stay correct when a swipe is undone, which an
API-side implementation would have had to remember separately.

## `matches` is a real table, not a view

A view over `swipes` would always be correct and would need no trigger. A
table was chosen because matches carry their own state: `shortlisted`, `note`,
and eventually a ranking. It is also what Supabase Realtime can publish, which
is how the "it's a match" popup will work without polling.

## Three swipe directions, not two

`pass`, `like`, `love`. `love` costs nothing to store and gives a shortlist
signal for free: `is_love` is true only when *both* of you used it. Those are
the names to start arguing about.

## Joining late does not lose your swipes

Both people will open the app before either sends an invite code. So
`join_couple()` moves your existing swipes and custom names into your
partner's couple and recalculates matches, rather than starting you over.

Known limit: if you both added the same custom name separately, the loser of
the collision is dropped along with the swipes on it. Rare, and the name is
still typeable.

## The deck ordering is deliberate

`partner_liked desc, is_custom desc, popularity nulls last, random()`

1. Names your partner already liked, so a match lands in the first few cards
   instead of forty minutes in.
2. Names you added yourselves. They have no popularity rank, so without this
   they sank below 200 catalogue names and effectively never appeared. This
   was a real bug caught by a test, not a hypothetical.
3. The catalogue by popularity, randomised within ties.

## Custom names still have to be swiped by whoever added them

Auto-liking your own addition would make matches meaningless - you would match
on everything you typed in. Adding a name puts it in the deck. You still say
yes to it.

## `works_in` means sayable, not identical

Every catalogue name carries a `works_in text[]` of language codes. The test
is: **can a native speaker of that language say it without effort, and does it
sound like a real name to them?** Not: does it sound the same everywhere.

So `Julia` is tagged `{en,es,nl,fr}` even though the J differs in each - it is
a normal name in all four. `Gijs` is `{nl}`, because the G and the IJ do not
exist outside Dutch. `Ella` is `{en,nl,fr}` and not Spanish, because in
Spanish it is the word for "she".

The tags are judgement, not data. Correcting one is a single `UPDATE`:

```sql
update public.names set works_in = '{en,es,nl}'
where couple_id is null and lower(value) = 'floris';
```

Custom names get no tags and always bypass the filter. If you typed it in
yourself, you can presumably say it.

## The generated UI needed its backend torn out

The screens came out of Google AI Studio against `docs/AI_STUDIO_PROMPT.md`.
The React was good. Everything underneath it was not, and it is worth writing
down why, because the next generated batch will do the same thing.

It shipped **a 755-line Express server with an in-memory store** instead of
calling this repo's API. Nothing persisted, there were no accounts, and two
people on two phones would have seen two unrelated apps. The sandbox it runs
in cannot reach a real Supabase, so it built something that made the preview
work. Deleted in full.

It also shipped three ways to get past authentication:

- a **"Continue as Merel & Jayme (Preview Mode)"** button on the sign-in screen
- a **"Proceed to App"** button that skipped the emailed link
- a **"Side-by-side Sofa Testing"** panel in Settings that switched identity
  between the two of them with no password

All removed. The last one is the instructive case: with row level security,
becoming another user by pressing a button is not possible, so the button
could only ever have been a lie about who you were.

And it **swallowed sign-in failures**: the `catch` around `signInWithOtp` set
the "check your email" state anyway, so a link that was never sent looked
exactly like one that was.

Two genuine bugs in the React itself, both now fixed:

- `MatchDetailSheet` called `useState` five times *after* an early return,
  which crashes React with "rendered fewer hooks than expected" the moment the
  sheet closes.
- `useDeck` wrote a captured array back into state on every swipe, so pressing
  an arrow key after a prefetch silently discarded the 25 prefetched cards.

What was kept: all 15 components, the four hooks, the design tokens, the
gesture handling and the card animation. That part was worth the exercise.

## Magic links may be the wrong choice

Sign-in uses Supabase magic links. On the first real attempt this produced
`email rate limit exceeded` before either person got in once.

The cause is not the code: Supabase's built-in mail service is shared across
free projects and rate limited per project, so two people share one small
hourly budget and every failed tap spends from it. Mitigated in
`SignInScreen.tsx` with a 60 second cooldown, so the button cannot drain the
budget faster than it refills.

But the mitigation does not fix the shape of the problem. For **two known
people on a private app**, every sign-in requiring a mail round trip through a
rate-limited shared service is a dependency with no upside. Email plus
password costs one setup each and then never touches email again.

Arguments for keeping magic links: nothing to remember, no password to store,
and sessions persist so sign-in is rare in practice. Arguments against: the
one time you need it is the one time the limit bites, and that is usually on a
phone somewhere inconvenient.

Not changed yet. Custom SMTP also solves it and keeps the nicer flow.

### Mobile magic links use the implicit browser flow

`@supabase/ssr` starts magic links with PKCE by default. That failed on iOS
when the link was requested from the installed home-screen app but Mail opened
it in Safari: Safari did not have the PKCE verifier created by the installed
app. Supabase confirmed the email address, then the callback could not create
a session.

The hosted free tier does not allow this project's email template to use the
recommended `TokenHash` server callback without first adding custom SMTP. The
sign-in screen therefore uses a one-purpose implicit client to request the
link. `/auth/callback` receives the tokens in the URL fragment, removes the
fragment before creating any Supabase client, and imports the session into the
normal cookie-backed client. Existing PKCE links remain supported. The rest of
the app still uses the SSR client and Postgres RLS exactly as before.

## Open questions

- **Should `partner_liked` be shown in the UI?** The API returns it. Showing it
  outright turns the game into rubber-stamping. Probably keep it subtle or
  drop it from the card.
- **Ranking matched names.** A shortlist of 40 matches is not a decision. Some
  head-to-head or drag-to-order step is likely needed.
- **Surname fit.** "Sounds good with our surname" is the real test and nothing
  models it.
- **Is 173 names enough?** That is what `en,es,nl` leaves. Plenty to find a
  shortlist, but if the deck runs dry the answer is more catalogue, not a
  looser filter.
