-- ---------------------------------------------------------------------------
-- Row level security. Everything is scoped to the caller's couple, so the API
-- layer can stay thin: it forwards the user's session and Postgres decides.
-- ---------------------------------------------------------------------------

alter table public.couples  enable row level security;
alter table public.profiles enable row level security;
alter table public.names    enable row level security;
alter table public.swipes   enable row level security;
alter table public.matches  enable row level security;

-- couples ------------------------------------------------------------------
-- Rows are created through create_couple() / join_couple() only.
create policy couples_select on public.couples
  for select to authenticated
  using (id = public.current_couple_id());

create policy couples_update on public.couples
  for update to authenticated
  using (id = public.current_couple_id())
  with check (id = public.current_couple_id());

-- profiles -----------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (couple_id is not null and couple_id = public.current_couple_id())
  );

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- names --------------------------------------------------------------------
-- Everyone reads the global catalogue; couples also read and manage their own.
create policy names_select on public.names
  for select to authenticated
  using (couple_id is null or couple_id = public.current_couple_id());

create policy names_insert on public.names
  for insert to authenticated
  with check (couple_id is not null and couple_id = public.current_couple_id());

create policy names_update on public.names
  for update to authenticated
  using (couple_id is not null and couple_id = public.current_couple_id())
  with check (couple_id is not null and couple_id = public.current_couple_id());

create policy names_delete on public.names
  for delete to authenticated
  using (couple_id is not null and couple_id = public.current_couple_id());

-- swipes -------------------------------------------------------------------
-- You see both your own and your partner's swipes; you only write your own.
create policy swipes_select on public.swipes
  for select to authenticated
  using (couple_id = public.current_couple_id());

create policy swipes_insert on public.swipes
  for insert to authenticated
  with check (profile_id = auth.uid() and couple_id = public.current_couple_id());

create policy swipes_update on public.swipes
  for update to authenticated
  using (profile_id = auth.uid() and couple_id = public.current_couple_id())
  with check (profile_id = auth.uid() and couple_id = public.current_couple_id());

create policy swipes_delete on public.swipes
  for delete to authenticated
  using (profile_id = auth.uid() and couple_id = public.current_couple_id());

-- matches ------------------------------------------------------------------
-- No insert policy on purpose: only sync_match() (security definer) writes here.
create policy matches_select on public.matches
  for select to authenticated
  using (couple_id = public.current_couple_id());

create policy matches_update on public.matches
  for update to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

create policy matches_delete on public.matches
  for delete to authenticated
  using (couple_id = public.current_couple_id());

-- Execute grants ------------------------------------------------------------
revoke all on function public.create_couple(text) from public;
revoke all on function public.join_couple(text) from public;
revoke all on function public.leave_couple() from public;
revoke all on function public.recompute_matches(uuid) from public;
revoke all on function public.sync_match(uuid, uuid) from public;
revoke all on function public.reject_match(uuid) from public;
revoke all on function public.get_deck(text, int) from public;
revoke all on function public.couple_stats() from public;

grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.leave_couple() to authenticated;
grant execute on function public.reject_match(uuid) to authenticated;
grant execute on function public.get_deck(text, int) to authenticated;
grant execute on function public.couple_stats() to authenticated;

-- Live "it's a match" popups without polling.
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.swipes;
