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

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 290 then
    raise exception 'Test must start with the original catalogue';
  end if;
end;
$$;

\ir ../migrations/20260921202500_expand_name_catalogue.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 408 then
    raise exception 'Catalogue count incorrect after migration';
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

\ir ../migrations/20260921202500_expand_name_catalogue.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 408 then
    raise exception 'Reapplying migration changed catalogue size';
  end if;
end;
$$;

\ir ../migrations/20260923095707_add_brazilian_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 422 then
    raise exception 'Brazilian catalogue count incorrect after migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 37 then
    raise exception 'Portuguese coverage count incorrect after migration';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost while adding Brazilian names';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost while adding Brazilian names';
  end if;
  if not exists (
    select 1 from before_catalogue_update b
    join public.names n on n.id = b.name_id
    join public.matches m on m.id = b.match_id and m.name_id = n.id
  ) then
    raise exception 'Existing name or match ID changed while adding Brazilian names';
  end if;
end;
$$;

\ir ../migrations/20260926182304_expand_multilingual_catalogue.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 622 then
    raise exception 'Multilingual catalogue count incorrect after migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 207 then
    raise exception 'Dutch/English/Spanish coverage count incorrect after migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 101 then
    raise exception 'Portuguese coverage count incorrect after multilingual migration';
  end if;
  if exists (
    select 1 from public.names
    where couple_id is null and (origin is null or meaning is null)
  ) then
    raise exception 'A global catalogue name is missing origin or meaning';
  end if;
  if exists (
    select 1 from public.names where couple_id is null
    group by lower(value), gender having count(*) > 1
  ) then
    raise exception 'Multilingual migration introduced a duplicate global name';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost while expanding the multilingual catalogue';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost while expanding the multilingual catalogue';
  end if;
  if not exists (
    select 1 from before_catalogue_update b
    join public.names n on n.id = b.name_id
    join public.matches m on m.id = b.match_id and m.name_id = n.id
  ) then
    raise exception 'Existing name or match ID changed during multilingual expansion';
  end if;
end;
$$;

\ir ../migrations/20261119230034_expand_popular_name_catalogue.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 822 then
    raise exception 'Popular-name catalogue count incorrect after migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 230 then
    raise exception 'Dutch/English/Spanish coverage incorrect after popular-name migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 139 then
    raise exception 'Portuguese coverage incorrect after popular-name migration';
  end if;
  if exists (
    select 1 from public.names
    where couple_id is null and (origin is null or meaning is null)
  ) then
    raise exception 'A global catalogue name is missing origin or meaning';
  end if;
  if exists (
    select 1 from public.names where couple_id is null
    group by lower(value), gender having count(*) > 1
  ) then
    raise exception 'Popular-name migration introduced a duplicate global name';
  end if;
  if not exists (
    select 1 from public.names
    where couple_id is null and value = 'Maria Cecília' and gender = 'girl'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Rían' and gender = 'boy'
  ) then
    raise exception 'Expected Brazilian and Irish names are missing';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost while adding popular names';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost while adding popular names';
  end if;
  if not exists (
    select 1 from before_catalogue_update b
    join public.names n on n.id = b.name_id
    join public.matches m on m.id = b.match_id and m.name_id = n.id
  ) then
    raise exception 'Existing name or match ID changed during popular-name expansion';
  end if;
end;
$$;

\ir ../migrations/20261119230034_expand_popular_name_catalogue.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 822 then
    raise exception 'Reapplying popular-name migration changed catalogue size';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 139 then
    raise exception 'Reapplying popular-name migration changed Portuguese coverage';
  end if;
end;
$$;

\ir ../migrations/20260926182304_expand_multilingual_catalogue.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 822 then
    raise exception 'Reapplying multilingual migration after expansion changed catalogue size';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 139 then
    raise exception 'Reapplying multilingual migration after expansion changed Portuguese coverage';
  end if;
end;
$$;

\ir ../migrations/20260923095707_add_brazilian_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 822 then
    raise exception 'Reapplying Brazilian migration after expansion changed catalogue size';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 139 then
    raise exception 'Reapplying Brazilian migration after expansion changed Portuguese coverage';
  end if;
end;
$$;

create temporary table before_girl_sheet_import as
select id, value, gender
from public.names
where couple_id is null;

\ir ../migrations/20261120020617_import_google_sheet_girl_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 847 then
    raise exception 'Girl-sheet catalogue count incorrect after migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 236 then
    raise exception 'Dutch/English/Spanish coverage incorrect after girl-sheet migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 146 then
    raise exception 'Portuguese coverage incorrect after girl-sheet migration';
  end if;
  if exists (
    select 1 from public.names
    where couple_id is null and (origin is null or meaning is null)
  ) then
    raise exception 'A global catalogue name is missing origin or meaning';
  end if;
  if exists (
    select 1 from public.names where couple_id is null
    group by lower(value), gender having count(*) > 1
  ) then
    raise exception 'Girl-sheet migration introduced a duplicate global name';
  end if;
  if not exists (
    select 1 from public.names
    where couple_id is null and value = 'María' and gender = 'girl'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Cecília' and gender = 'girl'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Charlie' and gender = 'girl'
  ) then
    raise exception 'Expected sheet names or spelling variants are missing';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost while importing girl names';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost while importing girl names';
  end if;
  if exists (
    select 1
    from before_girl_sheet_import b
    left join public.names n
      on n.id = b.id and n.value = b.value and n.gender = b.gender
    where n.id is null
  ) then
    raise exception 'An existing name ID changed during girl-sheet import';
  end if;
end;
$$;

\ir ../migrations/20261120020617_import_google_sheet_girl_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 847 then
    raise exception 'Reapplying girl-sheet migration changed catalogue size';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 146 then
    raise exception 'Reapplying girl-sheet migration changed Portuguese coverage';
  end if;
end;
$$;
