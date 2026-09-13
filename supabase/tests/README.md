# Schema tests

These run the migrations against a throwaway local Postgres and exercise the
parts that are easy to get wrong: the match trigger, row level security, and
the couple join rules. No Supabase account needed - `00_supabase_stub.sql`
fakes the bits of `auth` that the migrations touch.

```bash
./scripts/test-schema.sh
```

`auth.uid()` in the stub reads a session setting, so a test can impersonate a
user with:

```sql
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
-- ... queries run exactly as that user would see them
commit;
```

What each file covers:

| File | Covers |
| --- | --- |
| `01_match_flow.sql` | profile trigger, create/join, deck filtering and ordering, match creation, `is_love`, swiped names leaving the deck |
| `02_security_and_undo.sql` | cross-couple isolation, forged swipes, direct writes to `matches`, undo, `reject_match`, retro-matching after a late join |
| `03_couple_rules.sql` | full couple rejected, idempotent rejoin, no second couple, leave/rejoin, duplicate custom names, custom names reaching both decks |
