-- The public health route has no user session, while application tables stay
-- unavailable to anon. Expose only the catalogue count needed by that probe.
create or replace function public.catalogue_size()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.names
  where couple_id is null;
$$;

revoke all on function public.catalogue_size() from public;
grant execute on function public.catalogue_size() to anon, authenticated;
