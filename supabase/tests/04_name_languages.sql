\set ON_ERROR_STOP on
\pset pager off

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','jayme@example.com','{"display_name":"Jayme"}'),
  ('22222222-2222-2222-2222-222222222222','merel@example.com','{"display_name":"Merel"}');

begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select public.create_couple('Baby Mata');
commit;

select invite_code as code from public.couples limit 1 \gset

begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select public.join_couple(:'code');
commit;

\echo '=== A. every catalogue name is tagged, none left empty ==='
select count(*) as untagged from public.names
where couple_id is null and works_in = '{}'::text[];

\echo '=== B. catalogue size by language coverage ==='
select
  count(*) as total,
  count(*) filter (where works_in @> '{en,es,nl}') as en_es_nl,
  count(*) filter (where works_in @> '{en,es,nl,fr}') as all_four,
  count(*) filter (where works_in = '{nl}') as dutch_only
from public.names where couple_id is null;

\echo '=== C. the en+es+nl deck excludes the unpronounceable Dutch names ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select count(*) as should_be_zero
from public.get_deck('all', 100, '{en,es,nl}')
where value in ('Gijs','Luuk','Guusje','Jasmijn','Stijn','Puck','Roosmarijn','Nienke');
commit;

\echo '=== D. ... and Gijs IS there with no filter (the deck caps at 100 cards, so check one name) ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select
  (select count(*) from public.get_deck('boy', 100, null) where value = 'Gijs') as unfiltered,
  (select count(*) from public.get_deck('boy', 100, '{en,es,nl}') where value = 'Gijs') as filtered;
commit;

\echo '=== E. a filtered deck still returns a usable number of boy names ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select count(*) as boy_cards from public.get_deck('boy', 100, '{en,es,nl}');
select count(*) as girl_cards from public.get_deck('girl', 100, '{en,es,nl}');
commit;

\echo '=== F. a custom name always shows, even though it has no tags ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
insert into public.names (couple_id, value, gender, origin, meaning)
values (public.current_couple_id(), 'Sjoerd', 'boy', 'Dutch', 'Guardian of victory');
select value, works_in, is_custom
from public.get_deck('boy', 100, '{en,es,nl}') where is_custom;
commit;

\echo '=== G. matching still works with the filter in play ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'like'
from public.names where value = 'Mateo' and gender = 'boy';
commit;
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'like'
from public.names where value = 'Mateo' and gender = 'boy';
commit;
select n.value, n.works_in from public.matches m join public.names n on n.id = m.name_id;
