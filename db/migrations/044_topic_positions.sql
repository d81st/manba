-- 044: positions of the sides in topics, assembled only from quotations
-- already verified in each topic's circumstances (decision of the author
-- 07.11.2026: the specialist does not answer, fill the fields as examples to be
-- checked later). Holder = the book or person the quotation stands in; side by
-- the canon of that book; recognition preliminary, said in source_note.
-- Every quotation was checked against the text of its address when this file
-- was generated. A topic that already has a position is left alone. Hard
-- topics stay on review; other topics that now have passages, circumstances
-- and a position are published.

DO $$
DECLARE
  tid bigint;
  pid bigint;
BEGIN
  IF (SELECT count(*) FROM addresses WHERE address IN ('bukhari.40', 'kafi.15.201.7', 'tafsir_ibn_kathir.9.5', 'uyun_anba.1.437')) < 4 THEN
    RETURN;
  END IF;

  -- jerusalem
  SELECT id INTO tid FROM topics WHERE slug = 'jerusalem';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$В Медине пророк молился в сторону Иерусалима: «صلى قبل بيت المقدس ستة عشر شهرا، أو سبعة عشر شهرا» (Бухари 40). В рассказе о ночном путешествии: «فجلا الله لي بيت المقدس» (Бухари 3886).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.40', 'bukhari.3886']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Хишам$p$, 'tradition', $p$О смене киблы: «على رأس سبعة عشر شهرا من مقدم رسول الله صلى الله عليه وسلم المدينة» (Ибн Хишам 1:550).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ibn_hisham.1.550']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'jerusalem', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- karbala
  SELECT id INTO tid FROM topics WHERE slug = 'karbala';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«Муснад» Ахмада$p$, 'tradition', $p$О гибели аль-Хусейна: «يقتل بكربلاء» (Ахмад 13794); «بلغنا أنها كربلاء» (Ахмад 13539).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ahmad.13794', 'ahmad.13539']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$ат-Табари$p$, 'tradition', $p$Сообщает: «أمر المتوكل بهدم قبر الحسين بن علي» (Ат-Табари 9:185).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tarikh_tabari.9.185']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'karbala', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- madina
  SELECT id INTO tid FROM topics WHERE slug = 'madina';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Муслим и аль-Бухари$p$, 'tradition', $p$«حرمت المدينة كما حرم إبراهيم مكة» (Муслим 1360). Границы заповедности: «ما بين عير إلى ثور» (Муслим 1370), «ما بين عائر إلى كذا» (Бухари 1870).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['muslim.1360', 'muslim.1370', 'bukhari.1870']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$Границы заповедности названы иначе: «بريدا في بريد» (аль-Кафи 15.223.2), «من ذباب إلى وأقم» (аль-Кафи 15.223.4).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.15.223.2', 'kafi.15.223.4']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'madina', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- makka
  SELECT id INTO tid FROM topics WHERE slug = 'makka';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$В день взятия Мекки: «إن هذا البلد حرمه الله» (Бухари 1587).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.1587']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$Об имени «Бакка» (3:96): «إنما سميت بكة لأنها تبك فيها الرجال والنساء» (аль-Кафи 15.201.7).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.15.201.7', 'quran.3.96']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'makka', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- mashhad
  SELECT id INTO tid FROM topics WHERE slug = 'mashhad';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$О посещении могилы Али ар-Риды: «من زار قبر أبي بطوس» (аль-Кафи 15.234.3).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.15.234.3']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'mashhad', 'positions', 1),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- najaf
  SELECT id INTO tid FROM topics WHERE slug = 'najaf';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$ат-Табари$p$, 'tradition', $p$«ودفن عند مسجد الجماعة في قصر الإمارة» (Ат-Табари 5:152).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tarikh_tabari.5.152']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Балазури$p$, 'tradition', $p$Приводит несколько сообщений подряд: «ودفن علي بالكوفة عند مسجد الجماعة في الرحبة مما يلي أبواب كندة», затем «دفن في الغري», «في الكناسة», «بالسدة» (Ансаб 2:497).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ansab_baladhuri.2.497']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«ظهر الكوفة قريبا من النجف يسرة عن الغري» (аль-Кафи 4.113.5).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.4.113.5']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'najaf', 'positions', 3),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- abu-bakr-collection
  SELECT id INTO tid FROM topics WHERE slug = 'abu-bakr-collection';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$Повод — гибель чтецов: «إن القتل قد استحر يوم اليمامة بقراء القرآن» (Бухари 4986). Конец суры «Покаяние»: «وجدت آخر سورة التوبة آيتين مع أبي خزيمة الأنصاري، لم أجدهما مع أحد غيره» (Бухари 4989). Стих «Сонмов» — уже при переписке свитков в мусхафы: «نسخت الصحف في المصاحف، ففقدت آية من سورة الأحزاب» (Бухари 2807).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.4986', 'bukhari.4989', 'bukhari.2807']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«Муснад» Ахмада$p$, 'tradition', $p$Слова Зейда ибн Сабита: «أتفعلان شيئا لم يفعله رسول الله صلى الله عليه وسلم» (Ахмад 21644).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ahmad.21644']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'abu-bakr-collection', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- companion-codices
  SELECT id INTO tid FROM topics WHERE slug = 'companion-codices';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«Муснад» Ахмада$p$, 'tradition', $p$Об Ибн Масуде: «يحك المعوذتين من مصاحفه، ويقول: إنهما ليستا من كتاب الله» (Ахмад 21188). Убайй: «إن ابن مسعود كان لا يكتب المعوذتين في مصحفه» и слова Джибриля «قل أعوذ برب الفلق» (Ахмад 21186).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ahmad.21188', 'ahmad.21186']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$Алкама читает «والذكر والأنثى» (у Хафса 92:3 — «وَمَا خَلَقَ ٱلذَّكَرَ وَٱلْأُنثَىٰٓ») (Бухари 4944). О числе сур у Ибн Масуда: «بضعا وسبعين سورة» (Бухари 5000), у Ахмада — «سبعين سورة» (Ахмад 3697).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.4944', 'quran.92.3', 'bukhari.5000', 'ahmad.3697']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Балазури$p$, 'tradition', $p$Слова аль-Хаджжаджа о чтении Ибн Масуда: «والله لا أحدث رجلا يقرؤها إلا ضربت عنقه» (Ансаб 13:386).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ansab_baladhuri.13.386']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'companion-codices', 'positions', 3),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- dots-and-vowels
  SELECT id INTO tid FROM topics WHERE slug = 'dots-and-vowels';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition', $p$Приводит два рассказа: «إن أول من أمر به عبد الملك بن مروان، فتصدى لذلك الحجاج وهو بواسط، فأمر الحسن البصري ويحيى بن يعمر ففعلا ذلك» и «إن أول من نقط المصحف أبو الأسود الدؤلي» (Ибн Касир 0:9).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.0.9']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Абу Дауд, «аль-Масахиф»$p$, 'tradition', $p$«أول من نقط المصاحف يحيى بن يعمر» (Масахиф 444). О Хасане — два сообщения: «كره أن تنقط المصاحف بالنحو» (Масахиф 445) и «لا يرى بأسا أن ينقط المصحف بالنحو» (Масахиф 460).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['masahif_ibn_abi_dawud.444', 'masahif_ibn_abi_dawud.445', 'masahif_ibn_abi_dawud.460']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«لا يعجبني أن يكتب القرآن إلا بالسواد كما كتب أول مرة» (аль-Кафи 7.14.8).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.7.14.8']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'dots-and-vowels', 'positions', 3),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- early-manuscripts
  SELECT id INTO tid FROM topics WHERE slug = 'early-manuscripts';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Каталог Manuscripta Coranica (Corpus Coranicum) и Бирмингемский университет$p$, 'research_majority', $p$Радиоуглеродные даты пергамента ранних рукописей: Бирмингем, Islamic Arabic 1572a — 568–645 гг.; Берлин, Ms. or. fol. 4313 — 605–651 гг.; Тюбинген, Ma VI 165 — 648–674 гг. Анализ датирует выделку пергамента, а не время записи текста.$p$, $p$По каталогу Manuscripta Coranica и сообщению Бирмингемского университета (ссылки — в обстоятельствах темы). Степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'research' RETURNING id INTO pid;
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'early-manuscripts', 'positions', 1),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- missing-verses
  SELECT id INTO tid FROM topics WHERE slug = 'missing-verses';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Умар у аль-Бухари$p$, 'tradition', $p$«فكان مما أنزل الله آية الرجم، فقرأناها وعقلناها ووعيناها، رجم رسول الله صلى الله عليه وسلم ورجمنا بعده» (Бухари 6830).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.6830']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аиша у Муслима$p$, 'tradition', $p$«عشر رضعات معلومات يحرمن ثم نسخن بخمس معلومات», «وهن فيما يقرأ من القرآن» (Муслим 1452).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['muslim.1452']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«إذا زنى الشيخ والشيخة فارجموهما البتة فإنهما قضيا الشهوة» (аль-Кафи 30.2.3).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.30.2.3']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'missing-verses', 'positions', 3),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- quran-writing
  SELECT id INTO tid FROM topics WHERE slug = 'quran-writing';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$Записывали при пророке: «ادع لي زيدا وليجئ باللوح والدواة والكتف - أو الكتف والدواة -» (Бухари 4990). «جمع القرآن على عهد النبي صلى الله عليه وسلم أربعة، كلهم من الأنصار: أبي، ومعاذ بن جبل، وأبو زيد، وزيد بن ثابت» (Бухари 3810).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.4990', 'bukhari.3810']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Муслим и Ахмад$p$, 'tradition', $p$Запрет записывать: «لا تكتبوا عني ومن كتب عني غير القرآن فليمحه» (Муслим 3004a); у Ахмада — с оговоркой «إلا القرآن» (Ахмад 11085) и без неё: «لا تكتبوا عني شيئا» (Ахмад 11087).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['muslim.3004.1', 'ahmad.11085', 'ahmad.11087']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'quran-writing', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- seven-ahruf
  SELECT id INTO tid FROM topics WHERE slug = 'seven-ahruf';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари и Муслим$p$, 'tradition', $p$«إن هذا القرآن أنزل على سبعة أحرف، فاقرءوا ما تيسر منه» (Бухари 4992); «فأيما حرف قرأوا عليه فقد أصابوا» (Муслим 821).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.4992', 'muslim.821']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Шихаб у Муслима$p$, 'tradition', $p$«بلغني أن تلك السبعة الأحرف إنما هي في الأمر الذي يكون واحدا لا يختلف في حلال ولا حرام» (Муслим 819).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['muslim.819']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«كذبوا أعداء الله ولكنه نزل على حرف واحد من عند الواحد» (аль-Кафи 7.14.13).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.7.14.13']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'seven-ahruf', 'positions', 3),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- tahrif-debate
  SELECT id INTO tid FROM topics WHERE slug = 'tahrif-debate';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни: весь Коран у Али и имамов$p$, 'tradition', $p$«وما جمعه وحفظه كما نزله الله تعالى إلا علي بن أبي طالب» (аль-Кафи 4.35.1); «عنده جميع القرآن كله ظاهره وباطنه غير الأوصياء» (аль-Кафи 4.35.2).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.4.35.1', 'kafi.4.35.2']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни: читать, как читают люди$p$, 'tradition', $p$«اقرأ كما يقرأ الناس حتى يقوم القائم» (аль-Кафи 7.14.23); «اقرؤوا كما تعلمتم فسيجيئكم من يعلمكم» (аль-Кафи 7.12.2).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.7.14.23', 'kafi.7.12.2']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Абу Убайд и Ибн Абу Дауд$p$, 'tradition', $p$Аиша: «هذا عمل الكتاب أخطئوا في الكتاب» (Абу Убайд 469). «أن الحجاج بن يوسف غير في مصحف عثمان أحد عشر حرفا» (Масахиф 348).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['fadail_abu_ubayd.469', 'masahif_ibn_abi_dawud.348']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'tahrif-debate', 'positions', 3),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- uthman-mushaf
  SELECT id INTO tid FROM topics WHERE slug = 'uthman-mushaf';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$«فأفزع حذيفة اختلافهم في القراءة» и «أدرك هذه الأمة، قبل أن يختلفوا في الكتاب اختلاف اليهود والنصارى» (Бухари 4987); «فاكتبوه بلسان قريش، فإنما نزل بلسانهم» (Бухари 3506).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.4987', 'bukhari.3506']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Балазури$p$, 'tradition', $p$Упрёк Усману: «أحرقت كتاب الله» и его ответ «اختلف الناس في القراءة» (Ансаб 5:552).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ansab_baladhuri.5.552']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'uthman-mushaf', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- abu-bakr-al-razi
  SELECT id INTO tid FROM topics WHERE slug = 'abu-bakr-al-razi';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Аби Усайбиа, биограф врачей$p$, 'tradition', $p$«أبو بكر محمد بن زكريا الرازي مولده ومنشؤه بالري», «وأما صناعة الطب فإنما تعلمها وقد كبر» (Усайбиа 1:414). Из его изречений: «الحقيقة في الطب غاية لا تدرك» (Усайбиа 1:420).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['uyun_anba.1.414', 'uyun_anba.1.420']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'abu-bakr-al-razi', 'positions', 1),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- al-biruni
  SELECT id INTO tid FROM topics WHERE slug = 'al-biruni';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Аби Усайбиа, биограф врачей$p$, 'tradition', $p$«كان مشتغلا بالعلوم الحكمية فاضلا في علم الهيئة والنجوم وله نظر جيد في صناعة الطب وكان معاصر الشيخ الرئيس وبينهما محادثات ومراسلات» (Усайбиа 1:459).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['uyun_anba.1.459']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'al-biruni', 'positions', 1),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- al-khwarizmi
  SELECT id INTO tid FROM topics WHERE slug = 'al-khwarizmi';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Кифти, биограф учёных$p$, 'tradition', $p$«محمد بن موسى الخوارزمي أصله من خوارزم وكان منقطعا إلى خزانة كتب الحكمة للمأمون وهو من أصحاب علم الهيئة»; среди его книг — «كتاب الجبر والمقابلة» (Кифти 1:216).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ikhbar_ulama.1.216']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'al-khwarizmi', 'positions', 1),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- ibn-al-haytham
  SELECT id INTO tid FROM topics WHERE slug = 'ibn-al-haytham';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Аби Усайбиа, биограф врачей$p$, 'tradition', $p$«لم يماثله أحد من أهل زمانه في العلم الرياضي» (Усайбиа 1:550).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['uyun_anba.1.550']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Юсуф ас-Сабти у аль-Кифти$p$, 'tradition', $p$О сожжении книг в Багдаде, среди которых был «كتاب الهيئة لابن الهيثم»: «إذ لم يكن في الهيئة كفر وإنما هي طريق إلى الإيمان» (Кифти 1:176).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ikhbar_ulama.1.176']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'ibn-al-haytham', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- ibn-sina
  SELECT id INTO tid FROM topics WHERE slug = 'ibn-sina';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Газали$p$, 'tradition', $p$«فوجب تكفيرهم وتكفير شيعتهم من المتفلسفة الإسلاميين. كابن سينا والفارابي وأمثالهما» (Мункыз 1:137). Обвинение в неверии «لا بد منه في ثلث مسائل» (Тахафут 1:307b).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['munqidh_ghazali.1.137', 'tahafut_ghazali.1.307.2']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн аль-Каййим$p$, 'tradition', $p$Называет Ибн Сину «إمام الملحدين» (Игаса 2:267).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ighathat_lahfan.2.267']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Насир ад-Дин ат-Туси$p$, 'tradition', $p$Написал комментарий к «аль-Ишарат ва-т-танбихат» Ибн Сины; комментарий открывается словами «أفاد الفاضل الشارح» (Туси 1:113).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['sharh_isharat_tusi.1.113']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Аби Усайбиа и аль-Кифти, биографы$p$, 'tradition', $p$«وهو أن كان أشهر من أن يذكر وفضائله أظهر من أن تسطر» (Усайбиа 1:437); о «Каноне»: «إلى أن ظهر كتاب القانون لابن سينا فمالوا إليه» (Кифти 1:178).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 3
    FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['uyun_anba.1.437', 'ikhbar_ulama.1.178']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'ibn-sina', 'positions', 4),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- quran-and-all-sciences
  SELECT id INTO tid FROM topics WHERE slug = 'quran-and-all-sciences';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition', $p$«فإن القرآن اشتمل على كل علم نافع من خبر ما سبق، وعلم ما سيأتي، وحكم كل حلال وحرام» (Ибн Касир 16:89).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.16.89']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Газали$p$, 'tradition', $p$О медицине и астрономии: «لا يتوقف على معرفتها صلاح المعاش والمعاد» (Джавахир 1:44); о словах 26:80: «لا يعرفه إلا من عرف الطب بكماله» (Джавахир 1:45).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['jawahir_quran_ghazali.1.44', 'jawahir_quran_ghazali.1.45', 'quran.26.80']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$ас-Суюти, со слов аль-Мурси$p$, 'tradition', $p$Коран «احتوى على علوم أخرى من علوم الأوائل مثل الطب والجدل والهيئة والهندسة والجبر والمقابلة» (Иткан 4:33).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['itqan_suyuti.4.33']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аш-Шатиби$p$, 'tradition', $p$Шариат «أمية لم تخرج عما ألفته العرب» (Мувафакат 2:126); многие «تجاوزوا في الدعوى على القرآن الحد» (Мувафакат 2:127).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 3
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['muwafaqat_shatibi.2.126', 'muwafaqat_shatibi.2.127']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'quran-and-all-sciences', 'positions', 4),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- khadija
  SELECT id INTO tid FROM topics WHERE slug = 'khadija';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Хишам$p$, 'tradition', $p$Называет возраст пророка при браке: «خمسا وعشرين سنة ، تزوج خديجة بنت خويلد» (Ибн Хишам 1:187b); о смерти: «قبل مهاجره إلى المدينة بثلاث سنين» (Ибн Хишам 1:416b).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ibn_hisham.1.187.2', 'ibn_hisham.1.416.2']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$ат-Табари$p$, 'tradition', $p$Называет оба возраста: «خمس وعشرين سنة، وخديجة يومئذ ابنة أربعين سنة» (Ат-Табари 2:280a).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tarikh_tabari.2.280.1']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'khadija', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- waraqa-ibn-nawfal
  SELECT id INTO tid FROM topics WHERE slug = 'waraqa-ibn-nawfal';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$Два описания: «وكان يكتب الكتاب العبراني، فيكتب من الإنجيل بالعبرانية» (Бухари 3) и «يقرأ الإنجيل بالعربية» (Бухари 3392).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.3', 'bukhari.3392']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Хишам$p$, 'tradition', $p$«فأما ورقة بن نوفل فاستحكم في النصرانية، واتبع الكتب من أهلها» (Ибн Хишам 1:223b).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ibn_hisham.1.223.2']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'waraqa-ibn-nawfal', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- sword-verse
  SELECT id INTO tid FROM topics WHERE slug = 'sword-verse';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$ад-Даххак у Ибн Касира$p$, 'tradition', $p$Ибн Касир называет 9:5 «هي آية السيف» и передаёт: «قال فيها الضحاك بن مزاحم: إنها نسخت كل عهد بين النبي» (Ибн Касир 9:5).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.9.5']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition', $p$О мнении, что аят о мире 8:61 «منسوخة بآية السيف», он пишет: «فيه نظر أيضا» (Ибн Касир 8:61).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.8.61']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'sword-verse', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- naskh-war-verses
  SELECT id INTO tid FROM topics WHERE slug = 'naskh-war-verses';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$ад-Даххак у Ибн Касира$p$, 'tradition', $p$«إنها نسخت كل عهد بين النبي» (Ибн Касир 9:5).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.9.5']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition', $p$О мнении, что 8:61 «منسوخة بآية السيف»: «فيه نظر أيضا» (Ибн Касир 8:61).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.8.61']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«Другие» у Ибн Касира$p$, 'minority', $p$О 2:256: «وقال آخرون: بل هي منسوخة بآية القتال» (Ибн Касир 2:256).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.2.256']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$О 2:83: «نزلت هذه الآية في أهل الذمة ثم نسخها» (аль-Кафи 16.3.2).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 3
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.16.3.2', 'quran.2.83']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'naskh-war-verses', 'positions', 4),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- no-compulsion
  SELECT id INTO tid FROM topics WHERE slug = 'no-compulsion';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Абу Дауд$p$, 'tradition', $p$Повод ниспослания связан с изгнанием Бану ан-Надир: «أجليت بنو النضير» (Абу Дауд 2682).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['abu_dawud.2682']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«Другие» у Ибн Касира$p$, 'minority', $p$«وقال آخرون: بل هي منسوخة بآية القتال» (Ибн Касир 2:256).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.2.256']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'no-compulsion', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- non-combatants
  SELECT id INTO tid FROM topics WHERE slug = 'non-combatants';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Асма у Муслима$p$, 'tradition', $p$Спрашивает о матери, которая пришла к ней: «إن أمي قدمت علي وهى راغبة أو راهبة أفأصلها قال نعم» (Муслим 1003).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['muslim.1003']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'non-combatants', 'positions', 1),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- fighting-those-who-fight
  SELECT id INTO tid FROM topics WHERE slug = 'fighting-those-who-fight';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition', $p$Приводит оба сообщения: о 2:190 — «هذه أول آية نزلت في القتال» (Ибн Касир 2:190), о 22:39 — «هذه أول آية نزلت في الجهاد» (Ибн Касир 22:39).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['tafsir_ibn_kathir.2.190', 'tafsir_ibn_kathir.22.39']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«لا تقتلوا شيخا فانيا ولا صبيا ولا امرأة» (аль-Кафи 16.8.1).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.16.8.1']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'fighting-those-who-fight', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- jizya-verse
  SELECT id INTO tid FROM topics WHERE slug = 'jizya-verse';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$О джизье с маджусов: «أخذها من مجوس هجر» (Бухари 3157).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.3157']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«نهى عن قتال النساء» (аль-Кафи 16.8.6).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.16.8.6']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'jizya-verse', 'positions', 2),
            'Позиции собраны по цитатам из обстоятельств темы; степень признания предварительная.', 'migration:044');
  END IF;

  -- Publish what now meets the rule (passages, circumstances, a position).
  WITH ready AS (
    SELECT t.id, t.slug FROM topics t
    JOIN topic_texts x ON x.topic_id = t.id AND x.locale = 'ru'
    WHERE t.slug IN ('jerusalem', 'karbala', 'madina', 'makka', 'mashhad', 'najaf', 'abu-bakr-collection', 'companion-codices', 'dots-and-vowels', 'early-manuscripts', 'missing-verses', 'quran-writing', 'seven-ahruf', 'tahrif-debate', 'uthman-mushaf', 'abu-bakr-al-razi', 'al-biruni', 'al-khwarizmi', 'ibn-al-haytham', 'ibn-sina', 'quran-and-all-sciences', 'khadija', 'waraqa-ibn-nawfal')
      AND t.status IN ('draft', 'review')
      AND btrim(x.circumstances) <> ''
      AND EXISTS (SELECT 1 FROM topic_refs r WHERE r.topic_id = t.id AND r.role = 'main')
      AND EXISTS (SELECT 1 FROM topic_positions p WHERE p.topic_id = t.id)
  ), done AS (
    UPDATE topics t SET status = 'published', updated_by = 'migration:044', updated_at = now()
    FROM ready WHERE t.id = ready.id RETURNING t.id, t.slug
  )
  INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
  SELECT 'topic', id::text, 'updated', jsonb_build_object('status', 'review'), jsonb_build_object('status', 'published', 'slug', slug),
         'Опубликовано на этапе разработки: тексты, обстоятельства и позиции из цитат библиотеки (решение автора 07.11.2026).', 'migration:044'
  FROM done;
END $$;
