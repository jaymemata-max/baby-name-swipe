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
\echo 'invite code is' :code

begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select title from public.join_couple(:'code');
commit;

\echo '=== A. a third person with a VALID code is refused: couple is full ==='
begin;
set local role authenticated;
set local test.uid = '33333333-3333-3333-3333-333333333333';
savepoint sa;
\set ON_ERROR_STOP off
select public.join_couple(:'code');
\set ON_ERROR_STOP on
rollback to savepoint sa;
commit;

\echo '=== B. invite code is case-insensitive and trims whitespace ==='
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select title as rejoin_is_idempotent from public.join_couple(lower('  ' || :'code' || '  '));
commit;

\echo '=== C. you cannot start a second couple while in one ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
savepoint sc;
do $$ begin
  perform public.create_couple('Another one');
  raise notice 'UNEXPECTED: second couple created';
exception when others then raise notice 'blocked: %', sqlerrm; end $$;
rollback to savepoint sc;
commit;

\echo '=== D. leaving then rejoining works ==='
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select public.leave_couple();
commit;
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select title as rejoined from public.join_couple(:'code');
commit;

\echo '=== E. duplicate custom name is rejected ==='
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
insert into public.names (couple_id, value, gender) values (public.current_couple_id(), 'Zuriel', 'boy');
savepoint se;
do $$ begin
  insert into public.names (couple_id, value, gender) values (public.current_couple_id(), 'zuriel', 'boy');
  raise notice 'UNEXPECTED: duplicate accepted';
exception when unique_violation then raise notice 'blocked as expected'; end $$;
rollback to savepoint se;
commit;

\echo '=== F. a custom name appears in the deck for BOTH partners ==='
begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
select value, is_custom from public.get_deck('boy', 100) where is_custom;
commit;
