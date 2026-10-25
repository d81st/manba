-- 010: a topic category for the section «История текста Корана» (docs/PLAN.md,
-- 25.10.2026): its topics are listed on their own page and in «Темы».
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_check;
ALTER TABLE topics ADD CONSTRAINT topics_category_check CHECK (category IN ('general', 'hard', 'quran_text'));
