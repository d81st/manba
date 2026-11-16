-- 063: a draft of the hard topic «Рабство и наложницы» (docs/PLAN.md, 16.11.2026).
-- The next lead in the author's archive after the three drafts of 12–13.11.
-- Only quotations checked against the library. The books the leads name next
-- (Musannaf of Abd al-Razzaq, Mughni of Ibn Qudama) are not loaded, so their
-- pages are not quoted. The topic stays a draft.
-- On an empty database, before the import, the addresses are missing and
-- this does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 16.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'slavery-and-concubines')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.24.33')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.2517')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.1509.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.18.38.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('slavery-and-concubines', 'hard', 'draft', 'migration:063', 'migration:063')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Рабство и наложницы$p$,
    $p$Что говорят загруженные источники о рабстве, освобождении и «том, чем овладела десница»?$p$,
    $p$В 4:3: «أَوْ مَا مَلَكَتْ أَيْمَـٰنُكُمْ». В 24:33: «وَلَا تُكْرِهُوا۟ فَتَيَـٰتِكُمْ عَلَى ٱلْبِغَآءِ» и «فَكَاتِبُوهُمْ إِنْ عَلِمْتُمْ فِيهِمْ خَيْرًا». В 90:13: «فَكُّ رَقَبَةٍ». В 5:89 освобождение раба — один из выкупов клятвы: «أَوْ تَحْرِيرُ رَقَبَةٍ». В 9:60 среди статей закята: «وَفِى ٱلرِّقَابِ». Бухари 2517: «أعتق امرأ مسلما، استنقذ الله بكل عضو منه عضوا منه من النار». Бухари 2534: «أعتق رجل منا عبدا له عن دبر، فدعا النبي صلى الله عليه وسلم به، فباعه». «аль-Кафи» 18.38.1: «يحل الفرج بثلاث: نكاح بميراث ونكاح بلا ميراث ونكاح ملك اليمين».$p$,
    $p$Собрано 16.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). «Мусаннаф» Абд ар-Раззака и «Мугни» Ибн Кудамы, на которые указывают эти записи, в библиотеке ещё нет. Подбор цитат специалист не проверял.$p$
  );

  -- The second phrase of 24:33 is checked on its own, because the first
  -- quotation above stops at the word «на блуд».
  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.24.33' AND position('فَكَاتِبُوهُمْ إِنْ عَلِمْتُمْ فِيهِمْ خَيْرًا' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'quran.24.33 does not contain the mukataba phrase';
  END IF;

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.4.3', 0),
    ('main', 'quran.4.24', 1),
    ('main', 'quran.23.6', 2),
    ('main', 'quran.24.33', 3),
    ('main', 'quran.33.50', 4),
    ('circumstances', 'quran.4.3', 0),
    ('circumstances', 'quran.24.33', 1),
    ('circumstances', 'quran.90.13', 2),
    ('circumstances', 'quran.5.89', 3),
    ('circumstances', 'quran.9.60', 4),
    ('circumstances', 'bukhari.2517', 5),
    ('circumstances', 'bukhari.2534', 6),
    ('circumstances', 'kafi.18.38.1', 7),
    ('related', 'muslim.1509.1', 0)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис у аль-Бухари$p$, 'tradition',
    $p$«أعتق امرأ مسلما، استنقذ الله بكل عضو منه عضوا منه من النار» (Бухари 2517). Муслим 1509 передаёт: «أعتق رقبة مؤمنة أعتق الله بكل إرب منها إربا منه من النار».$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.2517', 'muslim.1509.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Джабир у аль-Бухари$p$, 'tradition',
    $p$«أعتق رجل منا عبدا له عن دبر، فدعا النبي صلى الله عليه وسلم به، فباعه» (Бухари 2534).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.2534', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$«يحل الفرج بثلاث: نكاح بميراث ونكاح بلا ميراث ونكاح ملك اليمين» (аль-Кафи 18.38.1).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'kafi.18.38.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Записи архива относят к этой теме аяты о «том, чем овладела десница» (4:3, 4:24, 23:6, 33:50) и 24:33. Дальше они указывают на «Мусаннаф» Абд ар-Раззака и «Мугни» Ибн Кудамы: этих книг в библиотеке нет, их страницы здесь не приведены.$p$,
    $p$Изложено по указателю архива автора без тона записей. Степень признания условна: это полемика, а не богословская школа.$p$, 3
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['quran.4.3', 'quran.4.24', 'quran.23.6', 'quran.33.50', 'quran.24.33']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'slavery-and-concubines', 'status', 'draft', 'positions', 4),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:063');
END $$;
