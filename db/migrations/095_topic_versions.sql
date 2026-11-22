-- 095: «Версии рядом» (docs/PLAN.md, 22.11.2026), step 2 of the livelier
-- pages: where the early reports of a story disagree, a table of the points
-- of divergence. A row is a neutral question; a column is a position of the
-- topic; a cell is a word-for-word Arabic quotation from that position's text
-- with the address it comes from. The site shows a cell only while the
-- quotation stands in the position's text and in the fragment; an empty cell
-- means the source says nothing on that point.
--
-- A cell names its column by the position's holder: the admin form saves a
-- topic's positions anew (new ids), and the holder stays.
CREATE TABLE IF NOT EXISTS topic_version_points (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id  BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  locale    TEXT NOT NULL,
  label     TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS topic_version_points_topic_idx ON topic_version_points (topic_id, locale, position);
SELECT close_to_public('topic_version_points');

CREATE TABLE IF NOT EXISTS topic_version_cells (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  point_id  BIGINT NOT NULL REFERENCES topic_version_points (id) ON DELETE CASCADE,
  holder    TEXT NOT NULL,
  quote     TEXT NOT NULL CHECK (quote <> ''),
  address   extensions.ltree NOT NULL REFERENCES addresses (address),
  UNIQUE (point_id, holder)
);
SELECT close_to_public('topic_version_cells');

-- Draft rows for «Райхана» (migration 092) and «Хайбар: Сафийя и Кинана»
-- (093): quotations already in the positions, checked against the library.
CREATE OR REPLACE FUNCTION pg_temp.add_version_point(slug text, pos int, label text, cells jsonb) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  tid bigint;
  pid bigint;
  cell jsonb;
BEGIN
  SELECT id INTO tid FROM topics t WHERE t.slug = add_version_point.slug;
  IF tid IS NULL OR EXISTS (SELECT 1 FROM topic_version_points p WHERE p.topic_id = tid AND p.label = add_version_point.label) THEN
    RETURN;
  END IF;
  INSERT INTO topic_version_points (topic_id, locale, label, position) VALUES (tid, 'ru', label, pos) RETURNING id INTO pid;
  FOR cell IN SELECT * FROM jsonb_array_elements(cells) LOOP
    IF EXISTS (SELECT 1 FROM library.addresses a WHERE a.address = (cell->>'address')::extensions.ltree) THEN
      INSERT INTO topic_version_cells (point_id, holder, quote, address)
      VALUES (pid, cell->>'holder', cell->>'quote', (cell->>'address')::extensions.ltree);
    END IF;
  END LOOP;
END $$;

SELECT pg_temp.add_version_point('rayhana', 0, $p$Имя и род$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Ибн Исхак у Ибн Хишама (так же у ат-Табари)', 'address', 'ibn_hisham.2.245.2', 'quote', 'ريحانة بنت عمرو بن خنافة'),
  jsonb_build_object('holder', 'Аль-Вакиди, «аль-Магази»', 'address', 'maghazi_waqidi.2.520.1', 'quote', 'وكانت ريحانة بنت زيد من بني النضير متزوجة في بني قريظة'),
  jsonb_build_object('holder', 'Передачи о том, что она осталась невольницей', 'address', 'musannaf.14005', 'quote', 'وريحانة ابنة شمعون')));
SELECT pg_temp.add_version_point('rayhana', 1, $p$Предложение брака$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Ибн Исхак у Ибн Хишама (так же у ат-Табари)', 'address', 'ibn_hisham.2.245.2', 'quote', 'يا رسول الله، بل تتركني في ملكك، فهو أخف علي وعليك'),
  jsonb_build_object('holder', 'Передачи о браке (у аль-Балазури)', 'address', 'ansab_baladhuri.1.454.1', 'quote', 'تزوجني رسول الله صلى الله عليه وسلم، ومهرني مثل نسائه، وكان يقسم لي، وضرب علي الحجاب'),
  jsonb_build_object('holder', 'Передачи о том, что она осталась невольницей', 'address', 'ansab_baladhuri.1.453.1', 'quote', 'فعرض عليها التزويج وضرب الحجاب، فقالت: بل تتركني في ملكك')));
SELECT pg_temp.add_version_point('rayhana', 2, $p$Положение при пророке$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Ибн Исхак у Ибн Хишама (так же у ат-Табари)', 'address', 'ibn_hisham.2.245.2', 'quote', 'فكانت عند رسول الله صلى الله عليه وسلم حتى توفي عنها وهي في ملكه'),
  jsonb_build_object('holder', 'Передачи о браке (у аль-Балазури)', 'address', 'ansab_baladhuri.1.454.1', 'quote', 'فأعتقها وتزوجها وجعل صداقها عتقها، ثم إنه طلقها'),
  jsonb_build_object('holder', 'Передачи о том, что она осталась невольницей', 'address', 'musannaf.14005', 'quote', 'كان للنبي صلى الله عليه وسلم سريتين: القبطية، وريحانة ابنة شمعون')));
SELECT pg_temp.add_version_point('rayhana', 3, $p$Вера$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Ибн Исхак у Ибн Хишама (так же у ат-Табари)', 'address', 'ibn_hisham.2.245.2', 'quote', 'وقد كانت حين سباها قد تعصت بالإسلام، وأبت إلا اليهودية'),
  jsonb_build_object('holder', 'Аль-Вакиди, «аль-Магази»', 'address', 'maghazi_waqidi.2.520.1', 'quote', 'فأسلمي يصطفيك رسول الله صلى الله عليه وسلم لنفسه')));

SELECT pg_temp.add_version_point('khaybar-safiyya-kinana', 0, $p$Как Сафийя оказалась у пророка$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Хадисы Анаса у аль-Бухари и Муслима', 'address', 'bukhari.4200', 'quote', 'فصارت إلى دحية الكلبي، ثم صارت إلى النبي صلى الله عليه وسلم'),
  jsonb_build_object('holder', 'Ибн Исхак у Ибн Хишама (так же у ат-Табари)', 'address', 'ibn_hisham.2.336.2', 'quote', 'وأمر بصفية فحيزت خلفه، وألقى عليها رداءه'),
  jsonb_build_object('holder', 'Ат-Табари, раздел о жёнах пророка', 'address', 'tarikh_tabari.3.166.1', 'quote', 'فلما تصفح النبي ص السبي يوم خيبر، ألقى رداءه على صفية')));
SELECT pg_temp.add_version_point('khaybar-safiyya-kinana', 1, $p$Освобождение и брачный дар$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Хадисы Анаса у аль-Бухари и Муслима', 'address', 'bukhari.4200', 'quote', 'فجعل عتقها صداقها'),
  jsonb_build_object('holder', 'Аль-Вакиди, «аль-Магази»', 'address', 'maghazi_waqidi.2.707.2', 'quote', 'فأعتقها فتزوجها وجعل عتقها مهرها')));
SELECT pg_temp.add_version_point('khaybar-safiyya-kinana', 2, $p$Жена или невольница$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Хадисы Анаса у аль-Бухари и Муслима', 'address', 'bukhari.4213', 'quote', 'إن حجبها فهي إحدى أمهات المؤمنين، وإن لم يحجبها فهي مما ملكت يمينه')));
SELECT pg_temp.add_version_point('khaybar-safiyya-kinana', 3, $p$Принятие ислама$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Аль-Вакиди, «аль-Магази»', 'address', 'maghazi_waqidi.2.707.2', 'quote', 'قالت: بل أختار الله ورسوله'),
  jsonb_build_object('holder', 'Ат-Табари, раздел о жёнах пророка', 'address', 'tarikh_tabari.3.166.1', 'quote', 'ثم عرض عليها الإسلام فأسلمت، فأعتقها')));
SELECT pg_temp.add_version_point('khaybar-safiyya-kinana', 4, $p$Условие договора о кладе$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Аль-Вакиди, «аль-Магази»', 'address', 'maghazi_waqidi.2.671.1', 'quote', 'وبرئت منكم ذمة الله وذمة رسوله إن كتمتموني شيئا'),
  jsonb_build_object('holder', 'Хадис Ибн Умара у Абу Дауда (3006)', 'address', 'abu_dawud.3006', 'quote', 'على أن لا يكتموا ولا يغيبوا شيئا فإن فعلوا فلا ذمة لهم ولا عهد')));
SELECT pg_temp.add_version_point('khaybar-safiyya-kinana', 5, $p$Казнь Кинаны$p$, jsonb_build_array(
  jsonb_build_object('holder', 'Ибн Исхак у Ибн Хишама (так же у ат-Табари)', 'address', 'ibn_hisham.2.337.1', 'quote', 'فضرب عنقه بأخيه محمود بن مسلمة'),
  jsonb_build_object('holder', 'Аль-Вакиди, «аль-Магази»', 'address', 'maghazi_waqidi.2.673.1', 'quote', 'فقتله محمد بن مسلمة'),
  jsonb_build_object('holder', 'Хадис Ибн Умара у Абу Дауда (3006)', 'address', 'abu_dawud.3006', 'quote', 'فوجدوا المسك فقتل بن الحقيق'),
  jsonb_build_object('holder', 'Ат-Табари, раздел о жёнах пророка', 'address', 'tarikh_tabari.3.166.1', 'quote', 'فقتله محمد بن مسلمه بأمر النبي ص، ضرب عنقه صبرا')));

INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
SELECT 'topic', t.id::text, 'updated', jsonb_build_object('slug', t.slug, 'version_points', count(p.id)),
       'Черновая таблица «Версии рядом»: строки и цитаты из позиций темы; специалистом не проверено.', 'migration:095'
FROM topics t JOIN topic_version_points p ON p.topic_id = t.id
WHERE t.slug IN ('rayhana', 'khaybar-safiyya-kinana')
  AND NOT EXISTS (SELECT 1 FROM change_log c WHERE c.actor = 'migration:095' AND c.entity_id = t.id::text)
GROUP BY t.id, t.slug;
