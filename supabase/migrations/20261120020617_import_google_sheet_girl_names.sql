-- Add the girl names supplied in the "Baby Girl Names Database" Google Sheet.
-- Source: https://docs.google.com/spreadsheets/d/1pWbn8FopIcNfqzRzg9BOfiSCzXVNOgtoGQmQlaapKNY/edit
-- Read on 2026-11-20. Of 136 source rows, 111 already existed in the
-- catalogue; only the 25 new spellings below are inserted. Personal ratings,
-- shortlist statuses and notes from the sheet are deliberately not copied.
-- Existing name IDs, swipes and matches remain untouched.

insert into public.names (value, gender, origin, meaning, works_in) values
  ('Paisley', 'girl', 'Scottish', 'Church; ornate patterned fabric', '{en}'),
  ('Avery', 'girl', 'Old French', 'Ruler of the elves; wise ruler', '{en}'),
  ('Leilani', 'girl', 'Hawaiian', 'Heavenly garland of flowers', '{en,es,nl,pt}'),
  ('Josie', 'girl', 'Hebrew', 'God will increase', '{en,nl}'),
  ('Autumn', 'girl', 'English', 'Autumn; harvest season', '{en}'),
  ('Melody', 'girl', 'Greek', 'Song; music', '{en}'),
  ('Raelynn', 'girl', 'Modern American', 'Modern combination of Rae and Lynn', '{en}'),
  ('Kinsley', 'girl', 'English', 'King''s meadow', '{en}'),
  ('Emery', 'girl', 'Germanic', 'Brave; powerful', '{en,fr}'),
  ('Oakley', 'girl', 'English', 'Oak clearing', '{en}'),
  ('Ember', 'girl', 'English', 'Glowing coal or spark', '{en,nl}'),
  ('Magnolia', 'girl', 'French / Latin', 'Magnolia flower', '{en,es,nl,fr,pt}'),
  ('Serenity', 'girl', 'English', 'Peaceful calm', '{en}'),
  ('Oaklynn', 'girl', 'Modern American', 'Modern combination of oak and Lynn', '{en}'),
  ('Brielle', 'girl', 'French / Hebrew', 'God is my strength', '{en,nl,fr}'),
  ('Everly', 'girl', 'English', 'Wild boar clearing', '{en}'),
  ('Charlie', 'girl', 'Germanic', 'Free person', '{en,es,nl,fr,pt}'),
  ('Madelyn', 'girl', 'Hebrew / French', 'Woman from Magdala', '{en}'),
  ('Juniper', 'girl', 'Latin', 'Juniper tree', '{en}'),
  ('Julie', 'girl', 'Latin / French', 'Youthful', '{en,nl,fr}'),
  ('María', 'girl', 'Hebrew / Spanish', 'Star of the sea; beloved', '{es}'),
  ('Cecília', 'girl', 'Latin / Portuguese', 'Patron saint of music', '{pt}'),
  ('Regina', 'girl', 'Latin', 'Queen', '{en,es,nl,fr,pt}'),
  ('Luciana', 'girl', 'Latin', 'Light', '{en,es,nl,pt}'),
  ('Celeste', 'girl', 'Latin', 'Heavenly', '{en,es,nl,fr,pt}')
on conflict do nothing;
