-- 069: draft «Даджаль и нисхождение Исы» (docs/PLAN.md, 17.11.2026).
-- Muslim 2937, the shorter wording in Abu Dawud 4321, and Ibn Kathir 4:155.
-- The compiler's commentary in the archive is not copied. The topic stays a draft.
-- On an empty database, before the import, the addresses are missing and this does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 17.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'dajjal-and-isa')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2937.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2937.2')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'abu_dawud.4321')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.4.155')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.4.159')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.43.61')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2937.1'
      AND position('غير الدجال أخوفني عليكم' IN t.content) > 0
      AND position('أربعون يوما يوم كسنة ويوم كشهر ويوم كجمعة وسائر أيامه كأيامكم' IN t.content) > 0
      AND position('فينزل عند المنارة البيضاء شرقي دمشق' IN t.content) > 0
      AND position('فيطلبه حتى يدركه بباب لد فيقتله' IN t.content) > 0
      AND position('فعليهم تقوم الساعة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2937.2'
      AND position('حتى ينتهوا إلى جبل الخمر وهو جبل بيت المقدس' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'abu_dawud.4321'
      AND position('ثم ينزل عيسى بن مريم عند المنارة البيضاء شرقي دمشق فيدركه عند باب لد فيقتله' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.4.155'
      AND position('وذلك لأنه ينزل بعد خروج المسيح الدجال، فيقتله الله على يديه' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.4.159'
      AND position('وَإِن مِّنْ أَهْلِ ٱلْكِتَـٰبِ إِلَّا لَيُؤْمِنَنَّ بِهِۦ قَبْلَ مَوْتِهِۦ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.43.61'
      AND position('وَإِنَّهُۥ لَعِلْمٌ لِّلسَّاعَةِ' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'dajjal phrases are not in the library text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('dajjal-and-isa', 'general', 'draft', 'migration:069', 'migration:069')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Даджаль и нисхождение Исы: Муслим 2937$p$,
    $p$Что говорят загруженные тексты о Даджале и о нисхождении Исы?$p$,
    $p$В 4:159: «وَإِن مِّنْ أَهْلِ ٱلْكِتَـٰبِ إِلَّا لَيُؤْمِنَنَّ بِهِۦ قَبْلَ مَوْتِهِۦ». В 43:61: «وَإِنَّهُۥ لَعِلْمٌ لِّلسَّاعَةِ». Муслим 2937, ан-Наввас ибн Саман: «غير الدجال أخوفني عليكم»; о сроке: «أربعون يوما يوم كسنة ويوم كشهر ويوم كجمعة وسائر أيامه كأيامكم»; «فينزل عند المنارة البيضاء شرقي دمشق»; «فيطلبه حتى يدركه بباب لد فيقتله»; «فعليهم تقوم الساعة». Вторая передача добавляет: «حتى ينتهوا إلى جبل الخمر وهو جبل بيت المقدس». Абу Дауд 4321: «ثم ينزل عيسى بن مريم عند المنارة البيضاء شرقي دمشق فيدركه عند باب لد فيقتله». Ибн Касир к 4:155 ставит 4:159 рядом с 43:61 и пишет: «وذلك لأنه ينزل بعد خروج المسيح الدجال، فيقتله الله على يديه».$p$,
    $p$Собрано 17.11.2026. Номер взят как наводка из подборок архива о Даджале и нисхождении Исы. Комментарий составителя не перенесён. В «аль-Кафи» нет рассказа о нисхождении Исы; 17.124.3 говорит о посеве после выхода Даджала и в эту тему не включён. Подбор специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.4.159', 0),
    ('main', 'quran.43.61', 1),
    ('circumstances', 'muslim.2937.1', 0),
    ('circumstances', 'muslim.2937.2', 1),
    ('circumstances', 'abu_dawud.4321', 2),
    ('circumstances', 'tafsir_ibn_kathir.4.155', 3),
    ('related', 'quran.21.96', 0)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$ан-Наввас ибн Саман у Муслима$p$, 'tradition',
    $p$«غير الدجال أخوفني عليكم». «أربعون يوما يوم كسنة ويوم كشهر ويوم كجمعة وسائر أيامه كأيامكم». «فينزل عند المنارة البيضاء شرقي دمشق». «فيطلبه حتى يدركه بباب لد فيقتله». «فعليهم تقوم الساعة» (Муслим 2937). Вторая передача: «حتى ينتهوا إلى جبل الخمر وهو جبل بيت المقدس».$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.2937.1', 'muslim.2937.2']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Абу Дауд 4321$p$, 'tradition',
    $p$«ثم ينزل عيسى بن مريم عند المنارة البيضاء شرقي دمشق فيدركه عند باب لد فيقتله» (Абу Дауд 4321).$p$,
    note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'abu_dawud.4321', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition',
    $p$«وهذه الآية كقوله [تعالى] (3) {وإنه لعلم للساعة}». «وذلك لأنه ينزل بعد خروج المسيح الدجال، فيقتله الله على يديه» (Ибн Касир 4:155).$p$,
    note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.4.155', 0);

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.4.155'
      AND position('وهذه الآية كقوله [تعالى] (3) {وإنه لعلم للساعة}' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'Ibn Kathir does not join 4:159 to 43:61 in these words';
  END IF;

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Подборки архива о Даджале$p$, 'minority',
    $p$Подборки называют Муслим 2937. Слова хадиса приведены выше по тексту библиотеки. Комментарий составителя на сайт не перенесён.$p$,
    $p$Изложено по указателю архива, без текста составителя. Степень признания условна: это полемическая подборка, а не богословская школа.$p$,
    3
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'muslim.2937.1', 0);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'dajjal-and-isa', 'status', 'draft', 'positions', 4),
          'Черновик о Даджале и нисхождении Исы: Муслим 2937, Абу Дауд 4321, Ибн Касир 4:155. Комментарий составителя архива не перенесён.', 'migration:069');
END $$;
