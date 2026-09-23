-- Popular single given names registered in Brazil in 2025. The source is the
-- official Registro Civil transparency portal:
-- https://transparencia.registrocivil.org.br/inicio
--
-- Existing catalogue rows keep their IDs so every swipe and match remains
-- attached. Names already present only gain Portuguese pronounceability.
update public.names
set works_in = array_append(works_in, 'pt')
where couple_id is null
  and lower(value) in (
    'helena', 'miguel', 'cecilia', 'arthur', 'theo', 'aurora', 'gael',
    'alice', 'laura', 'noah', 'samuel', 'gabriel', 'isaac', 'olivia',
    'matteo', 'livia', 'sofia', 'valentina', 'jade', 'maya', 'sophia',
    'elisa', 'rafael'
  )
  and not works_in @> '{pt}'::text[];

insert into public.names (value, gender, origin, popularity, works_in) values
  ('Ravi', 'boy', 'Brazilian Portuguese', 2, '{pt}'),
  ('Maitê', 'girl', 'Brazilian Portuguese', 4, '{pt}'),
  ('Heitor', 'boy', 'Brazilian Portuguese', 6, '{pt}'),
  ('Bernardo', 'boy', 'Brazilian Portuguese', 11, '{pt}'),
  ('Davi', 'boy', 'Brazilian Portuguese', 14, '{pt}'),
  ('Benício', 'boy', 'Brazilian Portuguese', 15, '{pt}'),
  ('Pedro', 'boy', 'Brazilian Portuguese', 18, '{pt}'),
  ('Antonella', 'girl', 'Brazilian Portuguese', 20, '{pt}'),
  ('Ísis', 'girl', 'Brazilian Portuguese', 21, '{pt}'),
  ('Heloísa', 'girl', 'Brazilian Portuguese', 23, '{pt}'),
  ('Joaquim', 'boy', 'Brazilian Portuguese', 25, '{pt}'),
  ('Henrique', 'boy', 'Brazilian Portuguese', 28, '{pt}'),
  ('Mavie', 'girl', 'Brazilian Portuguese', 29, '{pt}'),
  ('Melissa', 'girl', 'Brazilian Portuguese', 32, '{pt}')
on conflict do nothing;

comment on column public.names.works_in is
  'Languages a native speaker can pronounce this name naturally in: en, es, nl, fr, pt. Empty = untagged (custom names added by the couple).';
