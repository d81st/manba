-- 006: a collection may open with the author's preface before book 1
-- (Sahih Muslim's muqaddima). It is kept as book 0 of the edition.
ALTER TABLE work_sections DROP CONSTRAINT IF EXISTS work_sections_book_check;
ALTER TABLE work_sections ADD CONSTRAINT work_sections_book_check CHECK (book >= 0);
