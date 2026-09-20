-- New Supabase projects no longer expose public tables to the Data API by
-- default. Keep access explicit and limited to signed-in users; RLS still
-- decides which rows each user may read or change.
grant usage on schema public to authenticated;

revoke all on table public.couples, public.profiles, public.names,
  public.swipes, public.matches from anon, authenticated;

grant select, update on table public.couples to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.names to authenticated;
grant select, insert, update, delete on table public.swipes to authenticated;
grant select, update, delete on table public.matches to authenticated;
