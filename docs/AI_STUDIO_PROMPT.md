# Prompt for Google AI Studio (UI build)

Paste everything between the markers into AI Studio. It is in English on
purpose: Gemini follows English specs more literally, and the codebase is
English.

The prompt describes the API that actually exists in this repo. If you change
the backend, update the prompt.

---
--- START OF PROMPT ---

You are building the frontend for a baby name app. The backend already exists
and must not be changed. Build only the UI and the client-side data layer.

## The product in one line

Tinder for baby names, for exactly two people: a couple expecting their first
child. They swipe names separately. When they both say yes to the same name,
it becomes a match in a shared list.

The users are Merel and Jayme. They speak Dutch, English and Spanish. The app
is used on phones, almost always, often side by side on the sofa.

## Stack (fixed, do not substitute)

- Next.js 15, App Router, TypeScript, React 19
- Tailwind CSS v4
- Supabase JS client (`@supabase/ssr`, `@supabase/supabase-js`) for auth and
  realtime only
- No other UI or state libraries unless you genuinely need one. If you use a
  gesture library, use `@use-gesture/react` with `@react-spring/web`.
- Deployed on Vercel, so everything must work in a serverless environment

## What already exists (do not rebuild)

- The full Postgres schema, row level security and match logic
- All REST endpoints under `/api/*`, documented below
- `src/lib/supabase/client.ts` exports `createSupabaseBrowserClient()`
- `src/lib/supabase/database.types.ts` has every row type already
- `src/lib/supabase/server.ts` exports `createSupabaseServerClient()`
- `src/middleware.ts` refreshes the auth cookie on every request
- `src/app/auth/callback/route.ts` handles the magic-link redirect
- `src/app/layout.tsx` and `src/app/globals.css` exist and are minimal

You are replacing `src/app/page.tsx` (a placeholder) and adding new routes,
components and hooks.

## The API you must build against

All routes need a signed-in Supabase session, which the cookie provides
automatically. Errors come back as `{ "error": string, "code"?: string }`.

Status codes that need UI handling:
- `401` - not signed in, send to the sign-in screen
- `409` with `code: "no_couple"` - signed in but no couple yet, send to
  onboarding
- `422` - validation failed, show the message

### `GET /api/me`
The boot call. Returns:
```json
{
  "profile": { "id": "uuid", "display_name": "Merel", "avatar_emoji": "🤰", "couple_id": "uuid|null" },
  "couple": { "id": "uuid", "title": "Baby Mata", "invite_code": "Q95N8X", "due_date": "2027-02-14|null" },
  "partner": { "id": "uuid", "display_name": "Jayme", "avatar_emoji": "👨" },
  "stats": { "total_names": 290, "my_swipes": 84, "partner_swipes": 51, "my_likes": 22, "matches": 7, "shortlisted": 2 }
}
```
`couple`, `partner` and `stats` are `null` before onboarding is complete.
`partner` stays `null` until the second person joins.

### `PATCH /api/me`
Body: `{ "display_name"?: string, "avatar_emoji"?: string }`

### `POST /api/couple`
Body: `{ "title"?: string }`. Returns `{ "couple": { "invite_code": "Q95N8X", ... } }`.

### `POST /api/couple/join`
Body: `{ "invite_code": "Q95N8X" }`. Case-insensitive, whitespace trimmed.
Errors: `404 invalid_invite_code`, `409 couple_full`.

### `PATCH /api/couple`
Body: `{ "title"?: string, "due_date"?: "YYYY-MM-DD"|null }`

### `GET /api/deck?gender=boy&limit=25&languages=en,es,nl`
- `gender`: `all` | `boy` | `girl` | `unisex`. `boy` and `girl` both include
  unisex names.
- `limit`: 1-100, default 25
- `languages`: comma-separated subset of `en,es,nl,fr`. Only deals names a
  native speaker of **every** listed language can pronounce naturally. Omit
  for the whole catalogue.

Returns:
```json
{
  "cards": [{
    "id": "uuid",
    "value": "Mateo",
    "gender": "boy",
    "origin": "Spanish",
    "meaning": "Gift of God",
    "popularity": 63,
    "works_in": ["en", "es", "nl", "fr"],
    "is_custom": false,
    "partner_liked": true
  }],
  "count": 25,
  "gender": "boy",
  "languages": ["en", "es", "nl"]
}
```

Names already swiped never come back. Ordering is handled server-side.

### `POST /api/swipes`
Body: `{ "name_id": "uuid", "direction": "pass" | "like" | "love" }`.
Re-swiping the same name overwrites the previous answer.

Returns:
```json
{
  "swipe": { "...": "..." },
  "matched": true,
  "matched_now": true,
  "match": { "id": "uuid", "is_love": false, "shortlisted": false },
  "name": { "value": "Mateo", "meaning": "Gift of God", "origin": "Spanish" }
}
```

### `DELETE /api/swipes`
Undo the most recent swipe. Optional `?name_id=uuid` for a specific one.
Returns `{ "undone": true, "name_id": "uuid", "name": { ... } }` so the card
can be put back. `404 nothing_to_undo` if there is nothing.

### `GET /api/matches?gender=girl&shortlisted=true`
Returns `{ "matches": [{ "id", "is_love", "shortlisted", "note", "created_at", "name": { ... } }], "count": n }`,
newest first.

### `PATCH /api/matches/[id]`
Body: `{ "shortlisted"?: boolean, "note"?: string|null }`

### `DELETE /api/matches/[id]`
Rules the name out for both people. Not an undo.

### `GET /api/names?scope=custom&gender=boy`
### `POST /api/names`
Body: `{ "value": string, "gender": "boy"|"girl"|"unisex", "origin"?: string, "meaning"?: string }`.
`409 duplicate_name` if it is already on their list. The person who added it
still has to swipe it.

### `DELETE /api/names/[id]`
Only names they added themselves.

### `POST /api/auth/signout`

## Screens to build

### 1. Sign in (`/`, when signed out)

Email field, one button, magic link. Use the Supabase browser client directly:

```ts
supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
});
```

After sending, show "Check your email" with the address and a way to go back
and correct a typo. Handle `?error=auth_failed` and `?error=missing_code` in
the query string with a readable message.

### 2. Onboarding (`/start`, when signed in but `couple` is null)

Two paths on one screen:
- **Start a list** - optional title field, creates the couple, then shows the
  6-character invite code large and tappable-to-copy, with a share button
  using the Web Share API where available (`navigator.share`), falling back to
  clipboard copy.
- **Join your partner** - 6-character code input. Auto-uppercase, accept
  lowercase and spaces, one character per box or one clean field. Whichever
  you pick, make paste work.

If a user creates a list and their partner has not joined yet, they can still
start swiping. Say so: "Start swiping now, [name] can join any time and
everything you pick still counts."

### 3. The deck (`/`, the main screen)

This is where they will spend 95% of their time. Make it excellent.

**Card stack**
- One large card at a time, with the next two visible behind it, slightly
  scaled down and offset. Do not render more than 3 in the DOM.
- Card shows: the name, large; the meaning; the origin; small flag-ish or
  letter chips for `works_in` (EN / ES / NL / FR); a subtle marker when
  `is_custom` is true.
- Swipe right = like, left = pass, up = love. Dragging shows a colour tint and
  a label ("YES" / "NO" / "LOVE") that fades in with drag distance, with a
  slight rotation on the card.
- Below the card: three big tap targets (pass, love, like) and an undo button.
  Many people prefer tapping to swiping. Both must work.
- Minimum 44x44px tap targets. Thumb-reachable: controls in the bottom third.

**Data handling**
- Fetch 25 cards, prefetch the next 25 when 8 remain. Never let the user hit
  an empty stack mid-session.
- `POST /api/swipes` optimistically: animate the card away immediately, fire
  the request, and only roll back visually if it fails.
- If the deck genuinely runs out, show an end state: how many they swiped,
  how many matches, a button to add their own name, and a suggestion to widen
  the language filter or gender.

**Do not show `partner_liked` on the card.** The API returns it, but showing
it turns the game into rubber-stamping. Use it only if you want a very subtle
"one to watch" cue, and keep it ambiguous.

**Filters** (in a sheet, not cluttering the deck)
- Gender: Boys / Girls / Both
- Languages: toggle chips for NL, EN, ES, FR. Default: NL + EN + ES on.
  Explain it once in one line: "Only names we can all pronounce."
- Persist the choice in `localStorage` and restore it on load.

### 4. Match celebration

When `matched_now` is true, take over the screen:
- The name, large
- "You both said yes" with both display names or emoji
- If `match.is_love` is true, say so differently - they both used love, that is
  the strong signal
- Buttons: "Keep swiping" (dismiss) and "See our list"
- Some animation: confetti, a scale-in, a heart. Keep it under 2 seconds and
  make it dismissible instantly by tapping anywhere.

Fire this on `matched_now`, **not** `matched`. `matched` stays true when a
name that already matched is re-swiped.

### 5. Live match notification (the other person's screen)

When Merel matches a name, Jayme must find out without refreshing.

Subscribe to Supabase Realtime on the `matches` table:

```ts
const channel = supabase
  .channel("matches")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "matches", filter: `couple_id=eq.${coupleId}` },
    (payload) => { /* fetch the name, show a toast */ },
  )
  .subscribe();
```

The payload carries `name_id`, not the name itself, so fetch it or refetch
`/api/matches`. Show a toast, not a full-screen takeover: the other person
might be mid-swipe and hijacking their screen is rude. The toast taps through
to the match list.

Unsubscribe on unmount. Handle the connection dropping and reconnecting.

Also add a **web push notification** for when the app is closed:
- Request permission only after their first match, never on load
- Use the Notifications API with a service worker
- If push is too much complexity, do this instead and say so in a comment: the
  toast plus a badge count on the matches tab, and `document.title` updating
  when the tab is in the background

### 6. Our list (`/matches`)

The shared shortlist. Both people see the same thing.

- Segmented control: All / Boys / Girls
- A filter for shortlisted only
- Each row: the name, meaning, origin, the date matched, a star to toggle
  `shortlisted`, and a note field
- Names where `is_love` is true get a visible marker - they both loved those
- Tapping a row opens a detail sheet: full meaning, origin, language chips,
  the note as an editable field, and "rule this one out" which calls
  `DELETE /api/matches/[id]` with a confirmation
- Empty state that is encouraging, not blank

### 7. Add your own name (`/names` or a sheet)

- Form: name, gender, optional origin and meaning
- List of names they have added, each deletable
- After adding, tell them it is in both decks and that they still have to
  swipe it themselves
- Handle `409 duplicate_name` with a clear message

### 8. Settings (`/settings`)

- Display name and emoji picker
- Couple title and due date
- The invite code with a copy button, plus how many people have joined
- Sign out
- If the partner has not joined yet, make the invite code prominent here

## Navigation

Bottom tab bar, three tabs: Swipe, Our list (with a badge for new matches
since last viewed), Settings. Fixed to the bottom, respecting
`env(safe-area-inset-bottom)`.

## Design direction

- Warm and soft, not clinical. This is a happy thing.
- Suggested palette: warm off-white background (`#fff7f4`), deep plum text
  (`#2b1b24`), a soft coral or rose accent. Boys and girls should be
  distinguishable by a subtle accent, not a blue/pink cliche - use two colours
  from the same warm family.
- One expressive display font for the names themselves (they are the hero),
  one clean sans for everything else. Load from Google Fonts with a real
  fallback stack.
- Respect `prefers-color-scheme: dark`. Define the light palette on `:root`
  and redefine only the tokens in the dark media query.
- Respect `prefers-reduced-motion`: swaps card animations for fades and kills
  the confetti.

## Mobile requirements (not optional)

- Works at 375px wide. Test at that width.
- `100dvh`, not `100vh` - the iOS address bar will break `100vh`.
- No horizontal scroll, ever.
- Prevent pull-to-refresh interfering with vertical card drags
  (`overscroll-behavior-y: contain` on the deck container).
- `touch-action` set correctly on the card so the browser does not fight the
  gesture handler.
- Add a web app manifest and apple-touch-icon so it installs to the home
  screen and opens without browser chrome. They will use it that way.
- Font size at least 16px on inputs, or iOS zooms on focus.

## Code quality

- TypeScript strict. No `any`. The row types already exist in
  `src/lib/supabase/database.types.ts` (`Profile`, `Couple`, `BabyName`,
  `Match`, `DeckCard`, `CoupleStats`, `NameGender`, `NameLanguage`,
  `SwipeDirection`) - import those, do not redeclare them. Put the API
  envelope types (the response shapes above) in `src/lib/types.ts`.
- One data-fetching hook per resource (`useMe`, `useDeck`, `useMatches`) with
  loading and error states handled, not ignored.
- Every fetch has an error path that shows the user something. No silent
  failures and no unhandled promise rejections.
- Loading states are skeletons, not spinners, wherever the layout is known.
- Accessible: buttons are `<button>`, the card stack is operable by keyboard
  (arrow keys for pass/like, up for love), and every interactive element has a
  label.
- Components in `src/components/`, hooks in `src/hooks/`, types in `src/lib/`.

## Deliverables

Produce complete, working files. For each file, give the full path and the
full contents. No snippets, no "// rest of the component here", no
placeholders.

Start with a short plan: the file tree you are going to create and one line
per file. Then write the files.

--- END OF PROMPT ---
