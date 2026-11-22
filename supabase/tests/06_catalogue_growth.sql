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

create temporary table before_updated_sheet_import as
select id, value, gender
from public.names
where couple_id is null;

\ir ../migrations/20261121023839_import_updated_google_sheet_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 870 then
    raise exception 'Updated-sheet catalogue count incorrect after migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 246 then
    raise exception 'Dutch/English/Spanish coverage incorrect after updated-sheet migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 159 then
    raise exception 'Portuguese coverage incorrect after updated-sheet migration';
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
    raise exception 'Updated-sheet migration introduced a duplicate global name';
  end if;
  if not exists (
    select 1 from public.names
    where couple_id is null and value = 'Sterre' and gender = 'girl'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Mireia' and gender = 'girl'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Blair' and gender = 'unisex'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Winter' and gender = 'unisex'
  ) then
    raise exception 'Expected updated-sheet names or genders are missing';
  end if;
  if exists (
    select 1 from public.names
    where couple_id is null and gender = 'girl' and lower(value) in ('sage', 'river', 'parker')
  ) then
    raise exception 'Existing names were duplicated as girl cards';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost while importing the updated sheet';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost while importing the updated sheet';
  end if;
  if exists (
    select 1
    from before_updated_sheet_import b
    left join public.names n
      on n.id = b.id and n.value = b.value and n.gender = b.gender
    where n.id is null
  ) then
    raise exception 'An existing name ID changed during updated-sheet import';
  end if;
end;
$$;

\ir ../migrations/20261121023839_import_updated_google_sheet_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 870 then
    raise exception 'Reapplying updated-sheet migration changed catalogue size';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 159 then
    raise exception 'Reapplying updated-sheet migration changed Portuguese coverage';
  end if;
end;
$$;

create temporary table before_latest_sheet_import as
select id, value, gender
from public.names
where couple_id is null;

\ir ../migrations/20261121135029_import_latest_google_sheet_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 1103 then
    raise exception 'Latest-sheet catalogue count incorrect after migration';
  end if;
  if (
    select count(*)
    from public.names n
    left join before_latest_sheet_import b on b.id = n.id
    where n.couple_id is null and b.id is null
  ) <> 233 then
    raise exception 'Latest-sheet migration did not add exactly 233 names';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 361 then
    raise exception 'Dutch/English/Spanish coverage incorrect after latest-sheet migration';
  end if;
  if (
    select count(*) from public.names
    where couple_id is null
      and works_in @> '{en,es,nl}'
      and gender in ('boy', 'unisex')
  ) <> 114 then
    raise exception 'Filtered boy/unisex count incorrect after latest-sheet migration';
  end if;
  if (
    select count(*) from public.names
    where couple_id is null
      and works_in @> '{en,es,nl}'
      and gender in ('girl', 'unisex')
  ) <> 261 then
    raise exception 'Filtered girl/unisex count incorrect after latest-sheet migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 283 then
    raise exception 'Portuguese coverage incorrect after latest-sheet migration';
  end if;
  if exists (
    select 1 from public.names
    where couple_id is null
      and (origin is null or meaning is null or cardinality(works_in) = 0)
  ) then
    raise exception 'A global catalogue name is missing origin, meaning or language coverage';
  end if;
  if exists (
    select 1 from public.names where couple_id is null
    group by lower(value), gender having count(*) > 1
  ) then
    raise exception 'Latest-sheet migration introduced a duplicate global name';
  end if;
  if not exists (
    select 1 from public.names
    where couple_id is null
      and value = 'Kiara'
      and gender = 'girl'
      and origin = 'Italian / Irish'
      and meaning = 'Bright light, clear horizon'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Maria Vitória' and gender = 'girl'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Alexis' and gender = 'unisex'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Cielo' and gender = 'unisex'
  ) then
    raise exception 'Expected latest-sheet names, meanings or genders are missing';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost while importing the latest sheet';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost while importing the latest sheet';
  end if;
  if exists (
    select 1
    from before_latest_sheet_import b
    left join public.names n
      on n.id = b.id and n.value = b.value and n.gender = b.gender
    where n.id is null
  ) then
    raise exception 'An existing name ID changed during latest-sheet import';
  end if;
end;
$$;

\ir ../migrations/20261121135029_import_latest_google_sheet_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 1103 then
    raise exception 'Reapplying latest-sheet migration changed catalogue size';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 361 then
    raise exception 'Reapplying latest-sheet migration changed filtered coverage';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 283 then
    raise exception 'Reapplying latest-sheet migration changed Portuguese coverage';
  end if;
end;
$$;

create temporary table before_new_sheet_import as
select id, value, gender
from public.names
where couple_id is null;

\ir ../migrations/20261122232340_import_new_google_sheet_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 1125 then
    raise exception 'New-sheet catalogue count incorrect after migration';
  end if;
  if (
    select count(*)
    from public.names n
    left join before_new_sheet_import b on b.id = n.id
    where n.couple_id is null and b.id is null
  ) <> 22 then
    raise exception 'New-sheet migration did not add exactly 22 names';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 371 then
    raise exception 'Dutch/English/Spanish coverage incorrect after new-sheet migration';
  end if;
  if (
    select count(*) from public.names
    where couple_id is null
      and works_in @> '{en,es,nl}'
      and gender in ('boy', 'unisex')
  ) <> 115 then
    raise exception 'Filtered boy/unisex count incorrect after new-sheet migration';
  end if;
  if (
    select count(*) from public.names
    where couple_id is null
      and works_in @> '{en,es,nl}'
      and gender in ('girl', 'unisex')
  ) <> 271 then
    raise exception 'Filtered girl/unisex count incorrect after new-sheet migration';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 293 then
    raise exception 'Portuguese coverage incorrect after new-sheet migration';
  end if;
  if exists (
    select 1 from public.names
    where couple_id is null
      and (origin is null or meaning is null or cardinality(works_in) = 0)
  ) then
    raise exception 'A global catalogue name is missing origin, meaning or language coverage';
  end if;
  if exists (
    select 1 from public.names where couple_id is null
    group by lower(value), gender having count(*) > 1
  ) then
    raise exception 'New-sheet migration introduced a duplicate global name';
  end if;
  if not exists (
    select 1 from public.names
    where couple_id is null
      and value = 'Alora'
      and gender = 'girl'
      and origin = 'Latin / African'
      and meaning = 'The Lord is my light, radiant dream'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Navy' and gender = 'unisex'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Nur' and gender = 'unisex'
  ) or not exists (
    select 1 from public.names
    where couple_id is null and value = 'Zainab' and gender = 'girl'
  ) then
    raise exception 'Expected new-sheet names, meanings or genders are missing';
  end if;
  if (select count(*) from public.swipes) <> 2 then
    raise exception 'A swipe was lost while importing the new sheet rows';
  end if;
  if (select count(*) from public.matches) <> 1 then
    raise exception 'A match was lost while importing the new sheet rows';
  end if;
  if exists (
    select 1
    from before_new_sheet_import b
    left join public.names n
      on n.id = b.id and n.value = b.value and n.gender = b.gender
    where n.id is null
  ) then
    raise exception 'An existing name ID changed during new-sheet import';
  end if;
end;
$$;

\ir ../migrations/20261122232340_import_new_google_sheet_names.sql

do $$
begin
  if (select count(*) from public.names where couple_id is null) <> 1125 then
    raise exception 'Reapplying new-sheet migration changed catalogue size';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{en,es,nl}') <> 371 then
    raise exception 'Reapplying new-sheet migration changed filtered coverage';
  end if;
  if (select count(*) from public.names where couple_id is null and works_in @> '{pt}') <> 293 then
    raise exception 'Reapplying new-sheet migration changed Portuguese coverage';
  end if;
end;
$$;
