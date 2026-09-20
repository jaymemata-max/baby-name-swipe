-- ---------------------------------------------------------------------------
-- Pronounceability tags.
--
-- The couple speaks Dutch, English and Spanish. A name like "Gijs" is
-- unsayable outside Dutch; a name like "Julia" is native in all three even
-- though the J differs. So works_in means: a native speaker of that language
-- can say it without effort and it sounds like a real name to them - NOT that
-- it sounds identical everywhere.
--
-- Tags are a judgement call. Correcting one is a single UPDATE.
-- ---------------------------------------------------------------------------

alter table public.names
  add column if not exists works_in text[] not null default '{}'::text[];

comment on column public.names.works_in is
  'Languages a native speaker can pronounce this name naturally in: en, es, nl, fr. Empty = untagged (custom names added by the couple).';

create index if not exists names_works_in_idx on public.names using gin (works_in);

-- Tag the existing catalogue -------------------------------------------------

update public.names set works_in = '{en,es,nl,fr}' where couple_id is null and lower(value) in (
  'noah','liam','lucas','milan','adam','benjamin','thomas','max','hugo','nathan','elias',
  'kai','tobias','david','aaron','luca','milo','felix','victor','samuel','simon','daniel',
  'enzo','leo','mateo','rafael','amir','julian','ivan','robin','alex','nico','ariel',
  'emma','julia','nora','olivia','anna','sara','eva','isabel','luna','iris','elisa','mia','lara','nina'
);

update public.names set works_in = '{en,es,nl}' where couple_id is null and lower(value) in (
  'sem','levi','bram','sam','boaz','ruben','floris','cas','lars','mats','oliver','ezra',
  'casper','bas','otis','diego','andres','marco','emilio','santiago','nino','lev',
  'mila','yara','isa','nova','elena','vera','merel','lena','isabella','mara','livia','noa',
  'aya','kiki','valentina','camila','carmen','paloma','aurora','juna','naomi','rosa','ada',
  'nola','alicia','sofia','toni','kim','amari','sol'
);

update public.names set works_in = '{en,nl,fr}' where couple_id is null and lower(value) in (
  'olivier','arthur','sophie','lotte','hannah','charlotte','jade','ella','sofie','zoe',
  'charlie','eden','sasha','lou','remy','jules','ray'
);

update public.names set works_in = '{en,nl}' where couple_id is null and lower(value) in (
  'finn','jesse','willem','sven','jens','vince','job','dean','mick','roan','julius','lenn',
  'seth','joah','tess','evi','liv','elin','noor','lynn','amber','fay','freya','cato','indy',
  'pippa','lois','sky','bo'
);

update public.names set works_in = '{en,fr}' where couple_id is null and lower(value) in (
  'james','lily','lauren'
);

update public.names set works_in = '{nl,fr}' where couple_id is null and lower(value) in (
  'fleur','maud'
);

update public.names set works_in = '{en}' where couple_id is null and lower(value) in (
  'mason','jack','jaxx','riley','maeve','emily','isla','hazel','ivy','hailey','amy',
  'quinn','jamie','river','rowan','micah','sage','wren','shay'
);

update public.names set works_in = '{es}' where couple_id is null and lower(value) = 'xavi';

update public.names set works_in = '{fr}' where couple_id is null and lower(value) = 'loulou';

-- Everything left is Dutch-only: Gijs, Luuk, Guusje, Jasmijn and friends.
update public.names set works_in = '{nl}'
  where couple_id is null and works_in = '{}'::text[];

-- More names that carry across Dutch, English and Spanish -------------------

insert into public.names (value, gender, origin, meaning, popularity, works_in) values
('Gabriel','boy','Hebrew','God is my strength',91,'{en,es,nl,fr}'),
('Adrian','boy','Latin','From the Adriatic',92,'{en,es,nl}'),
('Sebastian','boy','Greek','Venerable, revered',93,'{en,es,nl}'),
('Martin','boy','Latin','Of Mars, warlike',94,'{en,es,nl,fr}'),
('Bruno','boy','Germanic','Brown, bear-like',95,'{en,es,nl,fr}'),
('Pablo','boy','Spanish','Small, humble',96,'{en,es,nl}'),
('Mario','boy','Latin','Of Mars',97,'{en,es,nl}'),
('Dario','boy','Persian','Wealthy, upholder of good',98,'{en,es,nl}'),
('Fabio','boy','Latin','Bean grower',99,'{en,es,nl}'),
('Lorenzo','boy','Latin','Crowned with laurel',100,'{en,es,nl}'),
('Camilo','boy','Latin','Attendant at a ceremony',101,'{en,es,nl}'),
('Isaac','boy','Hebrew','He will laugh',102,'{en,es,nl,fr}'),
('Theo','boy','Greek','Gift of God',103,'{en,es,nl,fr}'),
('Matias','boy','Hebrew','Gift of God',104,'{en,es,nl}'),
('Noel','boy','Latin','Born at Christmas',105,'{en,es,nl,fr}'),
('Emil','boy','Latin','Eager, striving',106,'{en,es,nl,fr}'),
('Ian','boy','Scottish','God is gracious',107,'{en,es,nl}'),
('Omar','boy','Arabic','Flourishing, long-lived',108,'{en,es,nl}'),
('Alan','boy','Celtic','Handsome, harmony',109,'{en,es,nl}'),
('Anton','boy','Latin','Priceless one',110,'{en,es,nl}'),
('Abel','boy','Hebrew','Breath, son',111,'{en,es,nl,fr}'),
('Ivo','boy','Germanic','Yew, archer',112,'{en,es,nl}'),
('Otto','boy','Germanic','Wealth, fortune',113,'{en,es,nl,fr}'),
('Tomas','boy','Aramaic','Twin',114,'{en,es,nl}'),
('Elio','boy','Greek','Of the sun',115,'{en,es,nl,fr}'),
('Alonso','boy','Spanish','Noble and ready',116,'{en,es}'),
('Andre','boy','Greek','Manly, brave',117,'{en,es,nl,fr}'),
('Marcel','boy','Latin','Young warrior',118,'{en,es,nl,fr}'),
('Elian','boy','Hebrew','My God has answered',119,'{en,es,nl}'),
('Renzo','boy','Italian','Crowned with laurel',120,'{en,es,nl}'),
('Nolan','boy','Irish','Champion',121,'{en,nl,fr}'),
('Luc','boy','Latin','Light',122,'{en,nl,fr}'),
('Cyril','boy','Greek','Lordly, masterful',123,'{en,nl,fr}'),
('Jonas','boy','Hebrew','Dove',124,'{en,nl,fr}'),
('Mael','boy','Breton','Chief, prince',125,'{nl,fr}'),
('Clara','girl','Latin','Bright, clear',91,'{en,es,nl,fr}'),
('Laura','girl','Latin','Crowned with laurel',92,'{en,es,nl,fr}'),
('Lucia','girl','Latin','Light',93,'{en,es,nl}'),
('Alma','girl','Latin','Soul, nourishing',94,'{en,es,nl,fr}'),
('Marina','girl','Latin','Of the sea',95,'{en,es,nl,fr}'),
('Adriana','girl','Latin','From the Adriatic',96,'{en,es,nl}'),
('Gabriela','girl','Hebrew','God is my strength',97,'{en,es,nl}'),
('Daniela','girl','Hebrew','God is my judge',98,'{en,es,nl}'),
('Mariana','girl','Latin','Of the sea, graceful',99,'{en,es,nl}'),
('Natalia','girl','Latin','Born at Christmas',100,'{en,es,nl}'),
('Paula','girl','Latin','Small, humble',101,'{en,es,nl,fr}'),
('Bianca','girl','Italian','White, bright',102,'{en,es,nl}'),
('Lia','girl','Hebrew','Weary, delicate',103,'{en,es,nl,fr}'),
('Nadia','girl','Slavic','Hope',104,'{en,es,nl,fr}'),
('Talia','girl','Hebrew','Dew from heaven',105,'{en,es,nl}'),
('Amara','girl','African','Grace, eternal',106,'{en,es,nl}'),
('Emilia','girl','Latin','Eager, striving',107,'{en,es,nl}'),
('Selena','girl','Greek','Moon',108,'{en,es,nl}'),
('Serena','girl','Latin','Calm, serene',109,'{en,es,nl}'),
('Zara','girl','Arabic','Blooming flower',110,'{en,es,nl}'),
('Maya','girl','Sanskrit','Illusion, water',111,'{en,es,nl}'),
('Milena','girl','Slavic','Gracious, dear',112,'{en,es,nl}'),
('Alina','girl','Slavic','Bright, beautiful',113,'{en,es,nl}'),
('Melina','girl','Greek','Honey',114,'{en,es,nl}'),
('Carolina','girl','Germanic','Free woman',115,'{en,es,nl}'),
('Antonia','girl','Latin','Priceless one',116,'{en,es,nl}'),
('Celia','girl','Latin','Heavenly',117,'{en,es,nl,fr}'),
('Noemi','girl','Hebrew','Pleasantness',118,'{en,es,nl,fr}'),
('Irene','girl','Greek','Peace',119,'{en,es,nl}'),
('Ines','girl','Greek','Pure, holy',120,'{en,es,nl,fr}'),
('Lola','girl','Spanish','Sorrows, strong woman',121,'{en,es,nl,fr}'),
('Renata','girl','Latin','Reborn',122,'{en,es,nl}'),
('Sabina','girl','Latin','Of the Sabines',123,'{en,es,nl}'),
('Silvia','girl','Latin','Of the forest',124,'{en,es,nl}'),
('Tamara','girl','Hebrew','Date palm',125,'{en,es,nl}'),
('Valeria','girl','Latin','Strong, healthy',126,'{en,es,nl}'),
('Viola','girl','Latin','Violet flower',127,'{en,es,nl,fr}'),
('Amelia','girl','Germanic','Industrious, striving',128,'{en,es,nl}'),
('Cecilia','girl','Latin','Blind, musician saint',129,'{en,es,nl}'),
('Diana','girl','Latin','Divine, goddess of the hunt',130,'{en,es,nl,fr}'),
('Helena','girl','Greek','Shining light',131,'{en,es,nl}'),
('Chiara','girl','Italian','Bright, clear',132,'{en,es,nl}'),
('Elina','girl','Greek','Bright one',133,'{en,es,nl}'),
('Ariana','girl','Greek','Most holy',134,'{en,es,nl}'),
('Elise','girl','Hebrew','God is my oath',135,'{en,es,nl,fr}'),
('Manon','girl','French','Bitter, beloved',136,'{nl,fr}'),
('Camille','girl','French','Attendant at a ceremony',137,'{en,nl,fr}'),
('Colette','girl','French','Victory of the people',138,'{en,nl,fr}'),
('Margot','girl','French','Pearl',139,'{en,nl,fr}'),
('Amandine','girl','French','Much loved',140,'{fr}')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Deck filtering by language
-- ---------------------------------------------------------------------------

drop function if exists public.get_deck(text, int);

create or replace function public.get_deck(
  p_gender text default 'all',
  p_limit int default 25,
  p_languages text[] default null
)
returns table (
  id            uuid,
  value         text,
  gender        public.name_gender,
  origin        text,
  meaning       text,
  popularity    int,
  works_in      text[],
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
      n.works_in,
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
      -- Names the couple added themselves always show: they chose them on
      -- purpose and nobody tagged them.
      and (
        p_languages is null
        or cardinality(p_languages) = 0
        or n.couple_id is not null
        or n.works_in @> p_languages
      )
      and not exists (
        select 1 from public.swipes s
        where s.name_id = n.id and s.profile_id = me.profile_id
      )
  )
  select id, value, gender, origin, meaning, popularity, works_in, is_custom, partner_liked
  from candidates
  order by partner_liked desc, is_custom desc, popularity nulls last, random()
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

revoke all on function public.get_deck(text, int, text[]) from public;
grant execute on function public.get_deck(text, int, text[]) to authenticated;
