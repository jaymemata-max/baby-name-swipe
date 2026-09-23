# API

Every route needs a signed-in Supabase session (cookie set by the magic-link
flow). Routes reply with JSON. Errors look like:

```json
{ "error": "Create or join a couple first", "code": "no_couple" }
```

| Status | Meaning |
| --- | --- |
| 401 | Not signed in |
| 409 `no_couple` | Signed in, but not in a couple yet - send them to onboarding |
| 422 | Body or query failed validation |

---

## Session

### `GET /api/me`

Everything the app needs on boot.

```json
{
  "profile": { "id": "...", "display_name": "Merel", "avatar_emoji": "🤰", "couple_id": "..." },
  "couple": { "id": "...", "title": "Baby Mata", "invite_code": "Q95N8X", "due_date": "2027-02-14" },
  "partner": { "id": "...", "display_name": "Jayme", "avatar_emoji": "👨" },
  "stats": { "total_names": 422, "my_swipes": 84, "partner_swipes": 51, "my_likes": 22, "matches": 7, "shortlisted": 2 }
}
```

`couple`, `partner` and `stats` are `null` before onboarding is done.
Database read failures return an error instead of appearing as missing settings.

### `PATCH /api/me`

```json
{ "display_name": "Merel", "avatar_emoji": "🤰" }
```

### `POST /api/auth/signout`

Returns `{ "signed_out": true }`, or an error if the session could not be closed.

---

## Couple

### `POST /api/couple`

Start a couple. Returns a 6-character invite code to send to your partner.

```json
{ "title": "Baby Mata" }
```

Fails with 409 `already_coupled` if you are already in one.

### `POST /api/couple/join`

```json
{ "invite_code": "Q95N8X" }
```

Case-insensitive, whitespace trimmed. Fails with 404 `invalid_invite_code` or
409 `couple_full`.

If you had already started swiping in a couple of your own, **your swipes and
custom names move across** and any matches are recalculated. Nothing is lost
if you both open the app before either of you sends the code.

### `GET /api/couple`

The couple plus both members.

### `PATCH /api/couple`

```json
{ "title": "Baby Mata", "due_date": "2027-02-14" }
```

### `DELETE /api/couple`

Leave. Your swipes and your shared matches stay for the other person.

---

## Swiping

### `GET /api/deck?gender=boy&limit=25&languages=en,es,nl`

`gender` is `all` (default), `boy`, `girl` or `unisex`. `boy` and `girl` both
include unisex names. `limit` is 1-100, default 25.

`languages` is a comma-separated subset of `en`, `es`, `nl`, `fr`, `pt`. A name is
only dealt if a native speaker of **every** listed language can pronounce it
naturally. Leave it off for the whole catalogue. Names you added yourselves
always come through, filter or not - you chose them on purpose.

With `languages=en,es,nl` the catalogue is 173 names (88 boys, 93 girls,
including unisex in both). Without a filter it is 422. The app defaults to
the unfiltered catalogue.

```json
{
  "cards": [
    {
      "id": "...",
      "value": "Noah",
      "gender": "boy",
      "origin": "Hebrew",
      "meaning": "Rest, comfort",
      "popularity": 1,
      "works_in": ["en", "es", "nl", "fr", "pt"],
      "is_custom": false,
      "partner_liked": true
    }
  ],
  "count": 25,
  "gender": "boy"
}
```

Ordering is deliberate: names your partner already liked come first (so a
match lands within a few cards), then names you added yourselves, then the
catalogue by popularity. Names you have already swiped never come back.

`partner_liked` is there if you want to hint at it in the UI. Showing it
outright turns the game into rubber-stamping, so consider keeping it subtle.

### `POST /api/swipes`

```json
{ "name_id": "uuid", "direction": "like" }
```

`direction` is `pass`, `like` or `love`. Swiping the same name again
overwrites your previous answer, so changing your mind is a normal write.

```json
{
  "swipe": { "...": "..." },
  "matched": true,
  "matched_now": true,
  "match": { "id": "...", "is_love": false, "shortlisted": false },
  "name": { "value": "Noah", "meaning": "Rest, comfort" }
}
```

Show the confetti on `matched_now`, not `matched` - `matched` stays true if
you re-swipe a name that already matched.

Matching happens in a Postgres trigger, so it is correct even if you both
swipe the same name in the same second.

### `DELETE /api/swipes` / `DELETE /api/swipes?name_id=uuid`

Undo. Without `name_id` it removes your most recent swipe and returns the name
so the card can be put back on the deck. Any match the swipe created is
removed with it.

---

## Matches

### `GET /api/matches?gender=girl&shortlisted=true`

Names you both said yes to, newest first, each with the full name record.

### `PATCH /api/matches/[id]`

```json
{ "shortlisted": true, "note": "Sounds good with our surname" }
```

### `DELETE /api/matches/[id]`

Rule a name out together. Both of your likes flip to a pass, so the match
disappears and the name does not come back in either deck. This is not "undo"
- use `DELETE /api/swipes` for that.

---

## Your own names

### `GET /api/names?scope=custom&gender=boy`

`scope=custom` (default) lists only names you added. `scope=all` includes the
shared catalogue.

### `POST /api/names`

```json
{ "value": "Zuriel", "gender": "boy", "origin": "Hebrew", "meaning": "God is my rock" }
```

Appears in both decks immediately. The person who added it still has to swipe
it - otherwise "we both chose this" would not mean anything. 409
`duplicate_name` if it is already on your list.

### `DELETE /api/names/[id]`

Only names you added. The shared catalogue is read-only for everyone.

---

## `GET /api/health`

No auth. Returns catalogue size and a timestamp. Used by the keep-alive
workflow to stop the free Supabase project pausing.
