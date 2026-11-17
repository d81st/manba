-- 066: draft «Когда наступит Час» (docs/PLAN.md, 17.11.2026).
-- Muslim 2952 and 2953, the wording in Bukhari 6511, and Ibn Kathir 7:187.
-- The compiler's commentary in the archive is not copied. The topic stays a draft.
-- On an empty database, before the import, the addresses are missing and this does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 17.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'when-is-the-hour')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2952.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2953.3')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.6511')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.7.187')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2538.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.7.187')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2952.1'
      AND position('إن يعش هذا لم يدركه الهرم قامت عليكم ساعتكم' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2953.1'
      AND position('إن يعش هذا الغلام فعسى أن لا يدركه الهرم حتى تقوم الساعة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2953.2'
      AND position('ان عمر هذا لم يدركه الهرم حتى تقوم الساعة' IN t.content) > 0
      AND position('ذاك الغلام من أترابي يومئذ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2953.3'
      AND position('إن يؤخر هذا فلن يدركه الهرم حتى تقوم الساعة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'bukhari.6511'
      AND position('إن يعش هذا لا يدركه الهرم حتى تقوم عليكم ساعتكم' IN t.content) > 0
      AND position('قال هشام: يعني موتهم' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.7.187'
      AND position('يعني بذلك موتهم الذي يفضي بهم إلى الحصول في برزخ الدار الآخرة' IN t.content) > 0
      AND position($p$وهذا الإطلاق في هذه الروايات محمول على التقييد ب"ساعتكم" في حديث عائشة$p$ IN t.content) > 0
      AND position('انخرام ذلك القرن' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2538.1'
      AND position('ما على الأرض من نفس منفوسة تأتي عليها مائة سنة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2539.1'
      AND position('لا تأتي مائة سنة وعلى الأرض نفس منفوسة اليوم' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'hour phrases are not in the library text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('when-is-the-hour', 'general', 'draft', 'migration:066', 'migration:066')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Когда наступит Час: Муслим 2952 и 2953$p$,
    $p$Что говорят загруженные тексты о словах, что Час наступит, пока названный человек не состарится?$p$,
    $p$В 7:187: «قُلْ إِنَّمَا عِلْمُهَا عِندَ رَبِّى». В 31:34: «إِنَّ ٱللَّهَ عِندَهُۥ عِلْمُ ٱلسَّاعَةِ». В 33:63: «قُلْ إِنَّمَا عِلْمُهَا عِندَ ٱللَّهِ». Муслим 2952, Аиша: «إن يعش هذا لم يدركه الهرم قامت عليكم ساعتكم». Муслим 2953, Анас, три передачи: «إن يعش هذا الغلام فعسى أن لا يدركه الهرم حتى تقوم الساعة»; «ان عمر هذا لم يدركه الهرم حتى تقوم الساعة», и Анас говорит «ذاك الغلام من أترابي يومئذ»; «إن يؤخر هذا فلن يدركه الهرم حتى تقوم الساعة». Бухари 6511 передаёт слова Аиши с «حتى تقوم عليكم ساعتكم» и добавляет: «قال هشام: يعني موتهم». Ибн Касир к 7:187: «يعني بذلك موتهم الذي يفضي بهم إلى الحصول في برزخ الدار الآخرة» и «وهذا الإطلاق في هذه الروايات محمول على التقييد ب"ساعتكم" في حديث عائشة». Рядом он приводит слова о ста годах. Муслим 2538: «ما على الأرض من نفس منفوسة تأتي عليها مائة سنة». Муслим 2539: «لا تأتي مائة سنة وعلى الأرض نفس منفوسة اليوم». У Ибн Касира же: «قال ابن عمر: وإنما أراد رسول الله صلى الله عليه وسلم انخرام ذلك القرن».$p$,
    $p$Собрано 17.11.2026. Номера взяты как наводка из подборки архива о сроке Часа. Комментарий составителя той подборки не перенесён. Шиитского текста об этих хадисах в библиотеке нет. Подбор специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.7.187', 0),
    ('main', 'quran.31.34', 1),
    ('main', 'quran.33.63', 2),
    ('circumstances', 'muslim.2952.1', 0),
    ('circumstances', 'muslim.2953.1', 1),
    ('circumstances', 'muslim.2953.2', 2),
    ('circumstances', 'muslim.2953.3', 3),
    ('circumstances', 'bukhari.6511', 4),
    ('circumstances', 'tafsir_ibn_kathir.7.187', 5),
    ('circumstances', 'muslim.2538.1', 6),
    ('circumstances', 'muslim.2539.1', 7),
    ('related', 'ahmad.13386', 0)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аиша у Муслима$p$, 'tradition',
    $p$«إن يعش هذا لم يدركه الهرم قامت عليكم ساعتكم» (Муслим 2952).$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'muslim.2952.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Анас у Муслима$p$, 'tradition',
    $p$Три передачи. «إن يعش هذا الغلام فعسى أن لا يدركه الهرم حتى تقوم الساعة» (Муслим 2953, первая). «ان عمر هذا لم يدركه الهرم حتى تقوم الساعة», и Анас говорит: «ذاك الغلام من أترابي يومئذ» (вторая). «إن يؤخر هذا فلن يدركه الهرم حتى تقوم الساعة» (третья). То же предложение, что в первой, есть у Ахмада 13386.$p$,
    note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.2953.1', 'muslim.2953.2', 'muslim.2953.3', 'ahmad.13386']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хишам у аль-Бухари и Ибн Касир$p$, 'tradition',
    $p$Бухари 6511 передаёт: «إن يعش هذا لا يدركه الهرم حتى تقوم عليكم ساعتكم», и далее: «قال هشام: يعني موتهم». Ибн Касир к 7:187 пишет: «يعني بذلك موتهم الذي يفضي بهم إلى الحصول في برزخ الدار الآخرة» и «وهذا الإطلاق في هذه الروايات محمول على التقييد ب"ساعتكم" في حديث عائشة».$p$,
    note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.6511', 'tafsir_ibn_kathir.7.187']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Слова о ста годах$p$, 'tradition',
    $p$Муслим 2538: «ما على الأرض من نفس منفوسة تأتي عليها مائة سنة». Муслиم 2539: «لا تأتي مائة سنة وعلى الأرض نفس منفوسة اليوم». Ибн Касир к 7:187 передаёт: «قال ابن عمر: وإنما أراد رسول الله صلى الله عليه وسلم انخرام ذلك القرن». Эти слова Ибн Умара в библиотеке есть в тафсире, отдельным хадисом аль-Бухари или Муслима они здесь не стоят.$p$,
    note, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.2538.1', 'muslim.2539.1', 'tafsir_ibn_kathir.7.187']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Подборка архива о сроке Часа$p$, 'minority',
    $p$Подборка называет Муслим 2952 и 2953. В передачах Анаса стоит «حتى تقوم الساعة», пока названный не состарится. Комментарий составителя подборки на сайт не перенесён: здесь только слова из библиотеки.$p$,
    $p$Изложено по указателю архива, без текста составителя. Степень признания условна: это полемическая подборка, а не богословская школа.$p$,
    4
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.2952.1', 'muslim.2953.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'when-is-the-hour', 'status', 'draft', 'positions', 5),
          'Черновик о сроке Часа: Муслим 2952 и 2953, Бухари 6511, Ибн Касир 7:187. Комментарий составителя архива не перенесён. Специалистом не проверен.', 'migration:066');
END $$;
