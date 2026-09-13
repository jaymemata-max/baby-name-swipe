\set ON_ERROR_STOP on
\pset pager off

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','jayme@example.com','{"display_name":"Jayme"}'),
  ('22222222-2222-2222-2222-222222222222','merel@example.com','{"display_name":"Merel"}'),
  ('33333333-3333-3333-3333-333333333333','stranger@example.com','{"display_name":"Stranger"}');

begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select public.create_couple('Baby Mata');
commit;

select invite_code as code from public.couples limit 1 \gset

-- Merel swipes on her OWN couple first, then joins Jayme's -----------------
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select public.create_couple('Merel solo');
insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'like'
from public.names where value in ('Noah','Luna');
insert into public.names (couple_id, value, gender, origin, meaning)
values (public.current_couple_id(), 'Zuriel', 'boy', 'Hebrew', 'God is my rock');
commit;

begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'like'
from public.names where value in ('Noah','Luna');
commit;

\echo '=== 1. still no match: they are in different couples ==='
select count(*) as matches from public.matches;

begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select 'joined' as label, title from public.join_couple(:'code');
commit;

\echo '=== 2. after joining, her earlier swipes retro-match ==='
select n.value from public.matches m join public.names n on n.id = m.name_id order by 1;

\echo '=== 3. her custom name moved to the shared couple, her empty couple is gone ==='
select (select count(*) from public.couples) as couples,
       (select count(*) from public.names where couple_id is not null) as custom_names;

\echo '=== 4. a stranger sees nothing: no swipes, no matches, no profiles but their own ==='
begin;
set local role authenticated;
set local test.uid = '33333333-3333-3333-3333-333333333333';
select (select count(*) from public.swipes)   as swipes_visible,
       (select count(*) from public.matches)  as matches_visible,
       (select count(*) from public.couples)  as couples_visible,
       (select count(*) from public.profiles) as profiles_visible,
       (select count(*) from public.names)    as names_visible;
commit;

\echo '=== 5. a stranger cannot forge a swipe into someone else name ==='
begin;
set local role authenticated;
set local test.uid = '33333333-3333-3333-3333-333333333333';
savepoint s1;
do $$
begin
  insert into public.swipes (couple_id, profile_id, name_id, direction)
  values (
    (select id from public.couples limit 1),
    '11111111-1111-1111-1111-111111111111',
    (select id from public.names where couple_id is null limit 1),
    'like'
  );
  raise notice 'UNEXPECTED: insert succeeded';
exception when insufficient_privilege or not_null_violation then
  raise notice 'blocked as expected';
end $$;
rollback to savepoint s1;
commit;

\echo '=== 6. nobody can write straight into matches ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
savepoint s2;
do $$
begin
  insert into public.matches (couple_id, name_id)
  values (public.current_couple_id(), (select id from public.names limit 1));
  raise notice 'UNEXPECTED: direct match insert succeeded';
exception when insufficient_privilege then
  raise notice 'blocked as expected';
end $$;
rollback to savepoint s2;
commit;

\echo '=== 7. undo removes the match again ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
delete from public.swipes
where profile_id = auth.uid()
  and name_id = (select id from public.names where value = 'Luna');
commit;
select n.value from public.matches m join public.names n on n.id = m.name_id order by 1;

\echo '=== 8. reject_match rules a name out for both ==='
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select public.reject_match((select id from public.names where value = 'Noah' and gender = 'boy'));
commit;
select count(*) as matches_left from public.matches;
select count(*) as noah_back_in_either_deck from public.swipes s
  join public.names n on n.id = s.name_id
  where n.value = 'Noah' and s.direction <> 'pass';

\echo '=== 9. a third person cannot join a full couple ==='
begin;
set local role authenticated;
set local test.uid = '33333333-3333-3333-3333-333333333333';
savepoint s3;
do $$
begin
  perform public.join_couple((select invite_code from public.couples limit 1));
  raise notice 'UNEXPECTED: third person joined';
exception when others then
  raise notice 'blocked: %', sqlerrm;
end $$;
rollback to savepoint s3;
commit;

\echo '=== 10. couple_stats ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select * from public.couple_stats();
commit;
