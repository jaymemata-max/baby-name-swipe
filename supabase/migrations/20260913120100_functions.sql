-- ---------------------------------------------------------------------------
-- Helper functions, match logic, and the RPCs the API layer calls.
-- ---------------------------------------------------------------------------

-- Couple of the current user. security definer so RLS policies on other
-- tables can call it without recursing into the profiles policy.
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

-- Invite codes: 6 chars, no 0/O/1/I/L so they are safe to read out loud.
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (floor(random() * 31) + 1)::int, 1), ''
  )
  from generate_series(1, 6);
$$;

-- New auth user -> profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      initcap(split_part(new.email, '@', 1))
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Match logic
-- ---------------------------------------------------------------------------

-- A match exists when two different profiles in the couple both liked a name.
-- is_love is true only when both of them used 'love'.
create or replace function public.sync_match(p_couple_id uuid, p_name_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  likers int;
  lovers int;
  created boolean := false;
begin
  select count(distinct profile_id) filter (where direction in ('like', 'love')),
         count(distinct profile_id) filter (where direction = 'love')
    into likers, lovers
  from public.swipes
  where couple_id = p_couple_id and name_id = p_name_id;

  if likers >= 2 then
    insert into public.matches (couple_id, name_id, is_love)
    values (p_couple_id, p_name_id, lovers >= 2)
    on conflict (couple_id, name_id)
      do update set is_love = excluded.is_love
    returning (xmax = 0) into created;
  else
    delete from public.matches where couple_id = p_couple_id and name_id = p_name_id;
  end if;

  return coalesce(created, false);
end;
$$;

create or replace function public.handle_swipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_match(new.couple_id, new.name_id);
  return new;
end;
$$;

drop trigger if exists swipes_sync_match on public.swipes;
create trigger swipes_sync_match
  after insert or update of direction on public.swipes
  for each row execute function public.handle_swipe();

-- Undoing a swipe must also drop the match it created.
create or replace function public.handle_swipe_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_match(old.couple_id, old.name_id);
  return old;
end;
$$;

drop trigger if exists swipes_sync_match_delete on public.swipes;
create trigger swipes_sync_match_delete
  after delete on public.swipes
  for each row execute function public.handle_swipe_delete();

-- Rebuild every match for a couple. Used after a partner joins, because their
-- earlier solo swipes only become matches once there are two people.
create or replace function public.recompute_matches(p_couple_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  touched int := 0;
  r record;
begin
  for r in
    select distinct name_id from public.swipes where couple_id = p_couple_id
  loop
    perform public.sync_match(p_couple_id, r.name_id);
    touched := touched + 1;
  end loop;
  return touched;
end;
$$;

-- "We have ruled this one out." Sets both partners' swipes to pass, which the
-- trigger turns into a removed match. RLS alone cannot do this: a user may
-- only delete their own swipe, so the partner's like would linger.
create or replace function public.reject_match(p_name_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_couple uuid;
begin
  my_couple := public.current_couple_id();
  if my_couple is null then
    raise exception 'not in a couple' using errcode = '22023';
  end if;

  update public.swipes
    set direction = 'pass'
  where couple_id = my_couple
    and name_id = p_name_id
    and direction in ('like', 'love');
end;
$$;

-- ---------------------------------------------------------------------------
-- Onboarding RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_couple(p_title text default null)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.couples;
  tries int := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if public.current_couple_id() is not null then
    raise exception 'you are already in a couple' using errcode = '22023';
  end if;

  loop
    tries := tries + 1;
    begin
      insert into public.couples (title, invite_code)
      values (coalesce(nullif(trim(p_title), ''), 'Our baby names'), public.generate_invite_code())
      returning * into c;
      exit;
    exception when unique_violation then
      if tries >= 10 then raise; end if;
    end;
  end loop;

  update public.profiles set couple_id = c.id where id = auth.uid();
  return c;
end;
$$;

-- Join a partner's couple. If you had already started swiping in a couple of
-- your own, your swipes and custom names move across so nothing is lost.
create or replace function public.join_couple(p_invite_code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.couples;
  old_couple uuid;
  others int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into c from public.couples
  where invite_code = upper(trim(p_invite_code));

  if c.id is null then
    raise exception 'invalid invite code' using errcode = '22023';
  end if;

  select couple_id into old_couple from public.profiles where id = auth.uid();

  if old_couple is not null and old_couple = c.id then
    return c;
  end if;

  select count(*) into others
  from public.profiles where couple_id = c.id and id <> auth.uid();

  if others >= 2 then
    raise exception 'this couple already has two people' using errcode = '22023';
  end if;

  if old_couple is not null then
    -- Move custom names that do not clash with one already in the target couple.
    update public.names n
      set couple_id = c.id
    where n.couple_id = old_couple
      and not exists (
        select 1 from public.names t
        where t.couple_id = c.id
          and lower(t.value) = lower(n.value)
          and t.gender = n.gender
      );

    update public.swipes
      set couple_id = c.id
    where profile_id = auth.uid() and couple_id = old_couple;

    select count(*) into others
    from public.profiles where couple_id = old_couple and id <> auth.uid();

    if others = 0 then
      delete from public.couples where id = old_couple;
    end if;
  end if;

  update public.profiles set couple_id = c.id where id = auth.uid();
  perform public.recompute_matches(c.id);

  return c;
end;
$$;

-- Leave a couple without deleting anything the two of you built.
create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  update public.profiles set couple_id = null where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- The deck
-- ---------------------------------------------------------------------------

-- Names the current user has not swiped yet, newest-relevant first.
create or replace function public.get_deck(
  p_gender text default 'all',
  p_limit int default 25
)
returns table (
  id            uuid,
  value         text,
  gender        public.name_gender,
  origin        text,
  meaning       text,
  popularity    int,
  is_custom     boolean,
  partner_liked boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (
    select p.id as profile_id, p.couple_id
    from public.profiles p
    where p.id = auth.uid()
  ),
  candidates as (
    select
      n.id,
      n.value,
      n.gender,
      n.origin,
      n.meaning,
      n.popularity,
      (n.couple_id is not null) as is_custom,
      exists (
        select 1 from public.swipes s
        where s.name_id = n.id
          and s.couple_id = me.couple_id
          and s.profile_id <> me.profile_id
          and s.direction in ('like', 'love')
      ) as partner_liked
    from public.names n
    cross join me
    where (n.couple_id is null or n.couple_id = me.couple_id)
      and (
        p_gender = 'all'
        or n.gender = 'unisex'
        or n.gender::text = p_gender
      )
      and not exists (
        select 1 from public.swipes s
        where s.name_id = n.id and s.profile_id = me.profile_id
      )
  )
  select id, value, gender, origin, meaning, popularity, is_custom, partner_liked
  from candidates
  -- Partner's likes first so matches land fast, then the names you added
  -- yourselves (they have no popularity rank and would otherwise sink to the
  -- bottom of a 200-name catalogue), then the common names.
  order by partner_liked desc, is_custom desc, popularity nulls last, random()
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

-- Counters for the header: how far through the deck each of you is.
create or replace function public.couple_stats()
returns table (
  total_names   int,
  my_swipes     int,
  partner_swipes int,
  my_likes      int,
  matches       int,
  shortlisted   int
)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (
    select p.id as profile_id, p.couple_id
    from public.profiles p where p.id = auth.uid()
  )
  select
    (select count(*)::int from public.names n, me
       where n.couple_id is null or n.couple_id = me.couple_id),
    (select count(*)::int from public.swipes s, me where s.profile_id = me.profile_id),
    (select count(*)::int from public.swipes s, me
       where s.couple_id = me.couple_id and s.profile_id <> me.profile_id),
    (select count(*)::int from public.swipes s, me
       where s.profile_id = me.profile_id and s.direction in ('like', 'love')),
    (select count(*)::int from public.matches m, me where m.couple_id = me.couple_id),
    (select count(*)::int from public.matches m, me
       where m.couple_id = me.couple_id and m.shortlisted);
$$;
