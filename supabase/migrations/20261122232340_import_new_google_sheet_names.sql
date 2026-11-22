-- Add the names newly appended to the "Baby Girl Names Database" Google Sheet.
-- Source: https://docs.google.com/spreadsheets/d/1pWbn8FopIcNfqzRzg9BOfiSCzXVNOgtoGQmQlaapKNY/edit
-- Read on 2026-11-23. The sheet now contains 576 unique names; 554 already
-- exist in the catalogue. This migration adds the remaining 22 names:
-- 16 girl names and 6 clearly gender-neutral names. Origin and meaning come
-- from the sheet. Personal ratings, shortlist statuses and notes are not copied.
-- Existing name IDs, swipes and matches remain untouched.

insert into public.names (value, gender, origin, meaning, works_in) values
  ('Alora', 'girl', 'Latin / African', 'The Lord is my light, radiant dream', '{en,es,nl,pt}'),
  ('Navy', 'unisex', 'English', 'Fleet of ships, deep oceanic blue', '{en}'),
  ('Marlowe', 'unisex', 'Old English', 'Driftwood meadow, remnant of the lake', '{en}'),
  ('Zella', 'girl', 'Germanic / African', 'Zealous, one who lacks nothing, little shadow', '{en,nl}'),
  ('Solene', 'girl', 'French / Latin', 'Solemn, dignified, sunlight radiance', '{en,nl,fr}'),
  ('Calla', 'girl', 'Greek', 'Most beautiful, calla lily blossom', '{en,nl}'),
  ('Eira', 'girl', 'Welsh / Old Norse', 'Snow, mercy, peaceful dawn', '{en,nl}'),
  ('Arden', 'unisex', 'Celtic / English', 'Valley of the eagle, high forest sanctuary', '{en}'),
  ('Indie', 'unisex', 'American / English', 'Independent, free spirit of the land', '{en}'),
  ('Brynn', 'girl', 'Welsh', 'Hill, mound, defender of the heights', '{en}'),
  ('Azalea', 'girl', 'Greek', 'Dry earth flower, blooming springtime beauty', '{en,es,nl,pt}'),
  ('Liyana', 'girl', 'Arabic / Zulu', 'Softness, gentle rain, tender grace', '{en,es,nl,pt}'),
  ('Klarity', 'girl', 'Latin / English', 'Clear, luminous, pure insight & light', '{en}'),
  ('Rynlee', 'girl', 'American / English', 'Meadow ruler, little wise queen', '{en}'),
  ('Briar', 'unisex', 'Old English', 'Thorny wild rose bush, natural resilience', '{en}'),
  ('Zaria', 'girl', 'Arabic / Slavic', 'Blooming flower, goddess of the dawn', '{en,es,nl,pt}'),
  ('Veda', 'girl', 'Sanskrit', 'Knowledge, sacred wisdom, eternal truth', '{en,es,nl,pt}'),
  ('Bea', 'girl', 'Latin / English', 'She who brings joy and blessed happiness', '{en,es,nl,pt}'),
  ('Nia', 'girl', 'Welsh / Swahili', 'Bright, radiant purpose, brilliant aim', '{en,es,nl,pt}'),
  ('Gia', 'girl', 'Italian', 'God is gracious, joyful life', '{en,es,nl,pt}'),
  ('Nur', 'unisex', 'Arabic', 'Divine illumination, brilliant celestial light', '{en,es,nl,pt}'),
  ('Zainab', 'girl', 'Arabic', 'Fragrant blossoming tree, ornament of beauty', '{en,es,nl,pt}')
on conflict do nothing;
