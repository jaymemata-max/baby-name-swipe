\set ON_ERROR_STOP on
\pset pager off

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'jayme@example.com', '{}'),
  ('22222222-2222-2222-2222-222222222222', 'merel@example.com', '{}');

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

begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'like'
from public.names where value = 'Noah' and gender = 'boy';
commit;

begin;
set local role authenticated;
set local test.uid = '22222222-2222-2222-2222-222222222222';
insert into public.swipes (couple_id, profile_id, name_id, direction)
select public.current_couple_id(), auth.uid(), id, 'love'
from public.names where value = 'Noah' and gender = 'boy';
commit;

create temporary table before_catalogue_update as
select n.id as name_id, m.id as match_id
from public.names n
join public.matches m on m.name_id = n.id
where n.value = 'Noah' and n.gender = 'boy';

\ir ../migrations/20260921202500_expand_name_catalogue.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 408 then
    raise exception 'Catalogue count changed after reapplying migration';
  end if;
  if exists (
    select 1 from public.names where couple_id is null
    group by lower(value), gender having count(*) > 1
  ) then
    raise exception 'Duplicate global name';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost';
  end if;
  if not exists (
    select 1 from before_catalogue_update b
    join public.names n on n.id = b.name_id
    join public.matches m on m.id = b.match_id and m.name_id = n.id
  ) then
    raise exception 'Existing name or match ID changed';
  end if;
end;
$$;
