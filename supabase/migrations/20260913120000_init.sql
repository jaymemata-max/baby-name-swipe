-- ---------------------------------------------------------------------------
-- Baby Name Swipe - core schema
-- Two people, one shared couple, a deck of names, swipes, and matches.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

create type public.name_gender as enum ('boy', 'girl', 'unisex');
create type public.swipe_direction as enum ('pass', 'like', 'love');

-- A couple is the shared workspace. Exactly two profiles may belong to one.
create table public.couples (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'Our baby names',
  invite_code text not null unique,
  due_date    date,
  created_at  timestamptz not null default now()
);

-- One row per signed-in person, mirroring auth.users.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  couple_id    uuid references public.couples (id) on delete set null,
  display_name text not null,
  avatar_emoji text not null default '👶',
  created_at   timestamptz not null default now()
);

create index profiles_couple_id_idx on public.profiles (couple_id);

-- Name catalogue. couple_id null = shared global catalogue,
-- couple_id set = a custom name this couple added themselves.
create table public.names (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid references public.couples (id) on delete cascade,
  value      text not null check (char_length(trim(value)) between 1 and 40),
  gender     public.name_gender not null,
  origin     text,
  meaning    text,
  popularity int,
  created_at timestamptz not null default now()
);

create unique index names_global_unique_idx
  on public.names (lower(value), gender) where couple_id is null;
create unique index names_couple_unique_idx
  on public.names (couple_id, lower(value), gender) where couple_id is not null;
create index names_gender_idx on public.names (gender, popularity);
create index names_couple_idx on public.names (couple_id);

-- One swipe per person per name. Re-swiping updates the existing row.
create table public.swipes (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name_id    uuid not null references public.names (id) on delete cascade,
  direction  public.swipe_direction not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, name_id)
);

create index swipes_couple_name_idx on public.swipes (couple_id, name_id);
create index swipes_profile_idx on public.swipes (profile_id, created_at desc);

-- Materialised matches: both partners liked the same name.
-- Written only by the trigger below, never directly by the client.
create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples (id) on delete cascade,
  name_id     uuid not null references public.names (id) on delete cascade,
  is_love     boolean not null default false,
  shortlisted boolean not null default false,
  note        text,
  created_at  timestamptz not null default now(),
  unique (couple_id, name_id)
);

create index matches_couple_idx on public.matches (couple_id, created_at desc);

-- Keep swipes.updated_at honest so "recently changed my mind" is queryable.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger swipes_touch_updated_at
  before update on public.swipes
  for each row execute function public.touch_updated_at();
