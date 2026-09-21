\set ON_ERROR_STOP on
\pset pager off

do $$
begin
  if not has_table_privilege('authenticated', 'public.couples', 'SELECT, UPDATE') then
    raise exception 'authenticated is missing couples access';
  end if;

  if not has_table_privilege('authenticated', 'public.profiles', 'SELECT, INSERT, UPDATE') then
    raise exception 'authenticated is missing profiles access';
  end if;

  if not has_table_privilege('authenticated', 'public.names', 'SELECT, INSERT, UPDATE, DELETE') then
    raise exception 'authenticated is missing names access';
  end if;

  if not has_table_privilege('authenticated', 'public.swipes', 'SELECT, INSERT, UPDATE, DELETE') then
    raise exception 'authenticated is missing swipes access';
  end if;

  if not has_table_privilege('authenticated', 'public.matches', 'SELECT, UPDATE, DELETE') then
    raise exception 'authenticated is missing matches access';
  end if;

  if has_table_privilege('authenticated', 'public.matches', 'INSERT') then
    raise exception 'authenticated must not insert matches directly';
  end if;

  if has_table_privilege('anon', 'public.couples', 'SELECT')
    or has_table_privilege('anon', 'public.profiles', 'SELECT')
    or has_table_privilege('anon', 'public.names', 'SELECT')
    or has_table_privilege('anon', 'public.swipes', 'SELECT')
    or has_table_privilege('anon', 'public.matches', 'SELECT') then
    raise exception 'anon must not read application tables';
  end if;

  if not has_function_privilege('anon', 'public.catalogue_size()', 'EXECUTE') then
    raise exception 'anon cannot execute the catalogue health check';
  end if;
end
$$;

set role anon;

do $$
declare
  catalogue_count integer;
begin
  select public.catalogue_size() into catalogue_count;
  if catalogue_count <> 290 then
    raise exception 'health check returned %, expected 290', catalogue_count;
  end if;
end
$$;

reset role;

\echo 'PASS Data API grants are explicit, health is narrow, and matches stay trigger-owned'
