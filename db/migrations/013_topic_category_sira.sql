-- 013: a topic category for the cards of «Жизнеописание пророка» (people and
-- events, decision of the author 25.10.2026): listed on /sira and in «Темы».
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_check;
ALTER TABLE topics ADD CONSTRAINT topics_category_check CHECK (category IN ('general', 'hard', 'quran_text', 'sira'));
