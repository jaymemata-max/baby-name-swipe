\set ON_ERROR_STOP on
\pset pager off

-- Two users sign up -------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','jayme@example.com','{"display_name":"Jayme"}'),
  ('22222222-2222-2222-2222-222222222222','merel@example.com','{"display_name":"Merel"}'),
  ('33333333-3333-3333-3333-333333333333','stranger@example.com','{}');

\echo '--- profiles auto-created by trigger ---'
select display_name, avatar_emoji from public.profiles order by display_name;

-- Jayme starts a couple ---------------------------------------------------
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select 'invite_code' as label, invite_code from public.create_couple('Baby Mata');
commit;

-- The code is read out loud / texted over, so grab it as the admin would.
select invite_code as code from public.couples limit 1 \gset

-- Merel joins with the code ----------------------------------------------
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select 'joined' as label, title from public.join_couple(:'code');
commit;

\echo '--- both profiles now share one couple ---'
select p.display_name, c.title from public.profiles p join public.couples c on c.id = p.couple_id order by 1;

-- Jayme swipes ------------------------------------------------------------
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';

\echo '--- deck respects the gender filter ---'
select count(*) as boy_cards, count(*) filter (where gender = 'girl') as girl_cards
from public.get_deck('boy', 100);

insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'like'
from public.names where value in ('Noah','Levi') and gender = 'boy';

insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'pass'
from public.names where value = 'Sem' and gender = 'boy';
commit;

\echo '--- no match yet, only one of them has swiped ---'
select count(*) as matches from public.matches;

-- Merel sees what Jayme liked --------------------------------------------
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';

\echo '--- partner-liked names come first in the deck ---'
select value, partner_liked from public.get_deck('boy', 5);

insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'love'
from public.names where value = 'Noah' and gender = 'boy';

insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'pass'
from public.names where value = 'Levi' and gender = 'boy';
commit;

\echo '--- exactly one match: Noah ---'
select n.value, m.is_love from public.matches m join public.names n on n.id = m.name_id;

-- Jayme upgrades his like to love ----------------------------------------
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
update public.swipes set direction = 'love'
where profile_id = auth.uid()
  and name_id = (select id from public.names where value = 'Noah' and gender = 'boy');
commit;

\echo '--- is_love flips true once both love it ---'
select n.value, m.is_love from public.matches m join public.names n on n.id = m.name_id;

\echo '--- swiped names leave the deck ---'
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select count(*) as noah_still_in_deck from public.get_deck('boy', 100) where value = 'Noah';
commit;
