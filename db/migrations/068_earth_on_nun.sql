-- 068: draft of the science claim «земля на нуне» (docs/PLAN.md, 17.11.2026).
-- Both readings are in the library: Ibn Kathir 68:1 and al-Tabari's history 1:51.
-- No outside article is quoted. The topic stays a draft.
-- On an empty database, before the import, the addresses are missing and this does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано 17.11.2026. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'earth-on-the-nun')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.68.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.68.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tarikh_tabari.1.51.1')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.68.1'
      AND position('نٓ ۚ وَٱلْقَلَمِ وَمَا يَسْطُرُونَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.68.1'
      AND position('حوت عظيم على تيار الماء العظيم المحيط، وهو حامل (1) للأرضين السبع' IN t.content) > 0
      AND position('وبسطت الأرض على ظهر النون، فاضطرب النون فمادت الأرض، فأثبتت بالجبال' IN t.content) > 0
      AND position('عن الحسن وقتادة في قوله: {ن} قالا هي الدواة' IN t.content) > 0
      AND position('ثم خلق "النون" وهي: الدواة' IN t.content) > 0
      AND position('وعلى ظهرها ثور له أربعون ألف قرن، وعلى متنه الأرضون السبع' IN t.content) > 0
      AND position('ومن العجيب (7) أن بعضهم حمل على هذا المعنى الحديث' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tarikh_tabari.1.51.1'
      AND position('فبسطت الأرض على ظهر النون، فتحرك النون، فمادت الارض فاثبت بالجبال' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'nun phrases are not in the library text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('earth-on-the-nun', 'science_claims', 'draft', 'migration:068', 'migration:068')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Земля на нуне в толковании 68:1$p$,
    $p$Что говорят загруженные тексты о слове «нун» в 68:1?$p$,
    $p$В 68:1: «نٓ ۚ وَٱلْقَلَمِ وَمَا يَسْطُرُونَ». Ибн Касир к 68:1: «وقيل: المراد بقوله: {ن} حوت عظيم على تيار الماء العظيم المحيط، وهو حامل (1) للأرضين السبع». Дальше он приводит слова Ибн Аббаса: «وبسطت الأرض على ظهر النون، فاضطرب النون فمادت الأرض، فأثبتت بالجبال». «История» ат-Табари 1:51: «فبسطت الأرض على ظهر النون، فتحرك النون، فمادت الارض فاثبت بالجبال». Другое чтение у того же Ибн Касира: «ثم خلق "النون" وهي: الدواة» и «عن الحسن وقتادة في قوله: {ن} قالا هي الدواة». О скале и быке: «وذكر البغوي وجماعة من المفسرين: إن على ظهر هذا الحوت صخرة سمكها كغلظ السموات والأرض، وعلى ظهرها ثور له أربعون ألف قرن، وعلى متنه الأرضون السبع وما فيهن وما بينهن (6) فالله أعلم». Следующей фразой: «ومن العجيب (7) أن بعضهم حمل على هذا المعنى الحديث».$p$,
    $p$Собрано 17.11.2026 по Ибн Касиру 68:1 и «Истории» ат-Табари 1:51. Открытая статья к этой карточке не привлекалась: оба чтения стоят в загруженных книгах. Шиитского толкования 68:1 в библиотеке нет. Специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.68.1', 0),
    ('circumstances', 'tafsir_ibn_kathir.68.1', 0),
    ('circumstances', 'tarikh_tabari.1.51.1', 1)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Аббас у ат-Табари и Ибн Касира$p$, 'tradition',
    $p$«История» ат-Табари 1:51: «فبسطت الأرض على ظهر النون، فتحرك النون، فمادت الارض فاثبت بالجبال». Ибн Касир к 68:1 начинает чтение словами «حوت عظيم على تيار الماء العظيم المحيط، وهو حامل (1) للأرضين السبع» и приводит: «وبسطت الأرض على ظهر النون، فاضطرب النون فمادت الأرض، فأثبتت بالجبال».$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tarikh_tabari.1.51.1', 'tafsir_ibn_kathir.68.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$аль-Хасан и Катада$p$, 'tradition',
    $p$Ибн Касир к 68:1 передаёт: «عن الحسن وقتادة في قوله: {ن} قالا هي الدواة». Там же другое сообщение: «ثم خلق "النون" وهي: الدواة».$p$,
    note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.68.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$аль-Багави и группа толкователей$p$, 'minority',
    $p$«وذكر البغوي وجماعة من المفسرين: إن على ظهر هذا الحوت صخرة سمكها كغلظ السموات والأرض، وعلى ظهرها ثور له أربعون ألف قرن، وعلى متنه الأرضون السبع وما فيهن وما بينهن (6) فالله أعلم» (Ибн Касир 68:1).$p$,
    $p$Ибн Касир передаёт это как слова группы толкователей и ставит «فالله أعلم». Степень признания предварительная.$p$,
    2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.68.1', 0);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'earth-on-the-nun', 'status', 'draft', 'positions', 3),
          'Черновик о нуне в 68:1: рыба у ат-Табари и Ибн Касира, чернильница у аль-Хасана и Катады, скала и бык у аль-Багави. Специалистом не проверен.', 'migration:068');
END $$;
