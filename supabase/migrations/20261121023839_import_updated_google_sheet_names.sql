-- Add the new names from the updated "Baby Girl Names Database" Google Sheet.
-- Source: https://docs.google.com/spreadsheets/d/1pWbn8FopIcNfqzRzg9BOfiSCzXVNOgtoGQmQlaapKNY/edit
-- Read on 2026-11-21. The sheet contains 226 rows. Two hundred already exist
-- as girl names, while Sage and River already exist as unisex names and Parker
-- already exists as a boy name. Those three are not duplicated. This migration
-- therefore adds 21 girl names and 2 unisex names. Personal ratings, shortlist
-- statuses and notes from the sheet are deliberately not copied.
-- Existing name IDs, swipes and matches remain untouched.

insert into public.names (value, gender, origin, meaning, works_in) values
  ('Adelaide', 'girl', 'Germanic', 'Noble natured', '{en,nl,fr,pt}'),
  ('Lila', 'girl', 'Arabic / Sanskrit', 'Night; divine play', '{en,es,nl,fr,pt}'),
  ('Blair', 'unisex', 'Scottish Gaelic', 'Plain or field', '{en}'),
  ('Goldie', 'girl', 'English / Yiddish', 'Gold; precious', '{en}'),
  ('Birdie', 'girl', 'English', 'Little bird', '{en}'),
  ('Edith', 'girl', 'Old English', 'Prosperous in war', '{en,es,nl,fr,pt}'),
  ('Daphne', 'girl', 'Greek', 'Laurel', '{en,nl,fr}'),
  ('Fiona', 'girl', 'Scottish Gaelic', 'Fair or white', '{en,es,nl,fr,pt}'),
  ('Greta', 'girl', 'Germanic', 'Pearl', '{en,es,nl,fr,pt}'),
  ('Hope', 'girl', 'English', 'Hope; positive expectation', '{en}'),
  ('Jane', 'girl', 'Hebrew / English', 'God is gracious', '{en,nl,pt}'),
  ('Savannah', 'girl', 'Taino / Spanish', 'Open plain', '{en}'),
  ('Winter', 'unisex', 'English', 'Winter season', '{en}'),
  ('Zelda', 'girl', 'Germanic / Yiddish', 'Gray battle; blessed', '{en,es,nl,fr,pt}'),
  ('Sterre', 'girl', 'Dutch', 'Star', '{nl}'),
  ('Benthe', 'girl', 'Dutch / Germanic', 'Blessed', '{nl}'),
  ('Mireia', 'girl', 'Catalan / Occitan', 'Admirable', '{es}'),
  ('Giovanna', 'girl', 'Italian', 'God is gracious', '{en,es,nl,pt}'),
  ('Lorena', 'girl', 'Spanish / French', 'From Lorraine', '{en,es,nl,pt}'),
  ('Emanuelle', 'girl', 'Hebrew / French', 'God is with us', '{en,es,nl,fr,pt}'),
  ('Rebeca', 'girl', 'Hebrew', 'To bind; captivating', '{es,pt}'),
  ('Catarina', 'girl', 'Greek / Portuguese', 'Pure', '{en,es,nl,pt}'),
  ('Rafaela', 'girl', 'Hebrew / Portuguese', 'God has healed', '{en,es,nl,pt}')
on conflict do nothing;
