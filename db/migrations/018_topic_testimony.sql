-- 018: «Ранние немусульманские свидетельства об исламе» (decision of the
-- author 20.10.2026, a block of «Истоки и связи»): a testimony — what a
-- neighbour of the early Muslims wrote about them, with the assessments of
-- the sides — is a topic of the category testimony, listed on /origins.
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_check;
ALTER TABLE topics ADD CONSTRAINT topics_category_check
  CHECK (category IN ('general', 'hard', 'quran_text', 'sira', 'cities', 'testimony'));
