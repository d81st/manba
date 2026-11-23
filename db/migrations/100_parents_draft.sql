-- 100: a draft of the hard topic «Родители пророка» (docs/PLAN.md,
-- 23.11.2026), the last sira theme of the critic's posts in the author's
-- archive. The hadiths of Muslim, the Shia report in al-Kafi, Ibn Kathir on
-- the people of the interval (fatra), Ibn Taymiyya's use of the hadith of the
-- grave; the critic without his tone. Every quotation is checked against the
-- library. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'parents-of-the-prophet')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.203.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.4.111.21')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.17.15')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'iqtida_sirat.2.180.2')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('parents-of-the-prophet', 'hard', 'draft', 'migration:100', 'migration:100')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Родители пророка$p$,
    $p$Что говорят хадисы и книги разных сторон об участи отца и матери пророка — Абдаллаха и Амины?$p$,
    $p$Аяты, к которым обращаются, — 9:113 (о прощении для многобожников) и 17:15 (о том, что наказания нет, пока не послан посланник). Ибн Хишам о матери: «وأمه: آمنة بنت وهب بن عبد مناف بن زهرة بن كلاب» (Ибн Хишам 1:110). Аз-Зухри у ат-Табари об отце: «وعلقت برسول الله ص، وبعثه أبوه إلى المدينة في ميرة يحمل لهم تمرا، فمات بالمدينة» (Табари 2:246).$p$,
    $p$Собрано 23.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. Отдельных сочинений о родителях пророка (например, трактатов ас-Суюти) в библиотеке нет; позиции суннитских учёных, считающих родителей спасёнными, и исследователей нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'muslim.203.1', 0),
    ('main', 'muslim.976.1', 1),
    ('main', 'quran.9.113', 2),
    ('main', 'quran.17.15', 3),
    ('circumstances', 'ibn_hisham.1.110.2', 0),
    ('circumstances', 'tarikh_tabari.2.246.1', 1),
    ('related', 'muslim.976.2', 0),
    ('related', 'abu_dawud.4718', 1),
    ('related', 'ibn_majah.1572', 2)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы у Муслима$p$, 'tradition',
    $p$Со слов Анаса: «أين أبي قال في النار فلما قفي دعاه فقال إن أبي وأباك في النار» (Муслим 203). Со слов Абу Хурайры: «استأذنت ربي أن أستغفر لأمي فلم يأذن لي واستأذنته أن أزور قبرها فأذن لي» (Муслим 976); в другой передаче: «زار النبي صلى الله عليه وسلم قبر أمه فبكى وأبكى من حوله» (Муслим 976b).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.203.1', 'muslim.976.1', 'muslim.976.2']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир о людях «фатры» (к 17:15)$p$, 'tradition',
    $p$О споре учёных: «بقي هاهنا مسألة قد اختلف الأئمة»; среди тех, о ком спор, — «ومن مات في الفترة ولم تبلغه». Одно из мнений: «ومنهم من ذهب إلى أنهم يمتحنون يوم القيامة في العرصات، فمن أطاع دخل الجنة» (Ибн Касир 17:15).$p$,
    $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Это общий вопрос о тех, кто умер в «фатру» — время без посланника; относит ли автор его к родителям пророка, в этом месте не сказано. Учёных, которые прямо применяют его к родителям, нужно добавить по их книгам.$p$, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.17.15', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Таймия о посещении могил («Иктида»)$p$, 'tradition',
    $p$«وزيارة القبور جائزة في الجملة، حتى قبور الكفار، فإن في صحيح مسلم عن أبي هريرة» — и приводит хадис о могиле матери пророка (Иктида 2:180).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'iqtida_sirat.2.180.2', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$Со слов имама Джафара ас-Садика: «إني قد حرمت النار على صلب أنزلك وبطن حملك وحجر كفلك، فالصلب صلب أبيك عبد الله بن عبد المطلب والبطن الذي حملك فآمنة بنت وهب» (аль-Кафи 4.111.21).$p$,
    $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Оценку этого сообщения шиитскими хадисоведами и другие шиитские книги о вере предков пророка нужно добавить.$p$, 3
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'kafi.4.111.21', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят хадисы Муслима об отце (Муслим 203) и о матери пророка (Муслим 976b) и делают вывод, что оба родителя — в огне.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Степень признания здесь условна: это полемика, а не исследование.$p$, 4
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.203.1', 'muslim.976.2']) WITH ORDINALITY AS u(a, o);

  -- On the map: Medina, where the father died, and al-Abwa, where the mother
  -- died (the al-Ṯurayyā points, as in migration 097).
  INSERT INTO places (slug, name_ar, lat, lon, coord_source, created_by, updated_by)
  VALUES ('madina', 'المدينة', 24.47782, 39.60908, 'al-thurayya:MADINA_396E244N_S', 'migration:100', 'migration:100'),
         ('abwa', 'الأبواء', 23.22814, 39.09484, 'al-thurayya:ABWA_390E232N_S', 'migration:100', 'migration:100')
  ON CONFLICT (slug) DO NOTHING;
  INSERT INTO place_texts (place_id, locale, name)
  SELECT id, 'ru', CASE slug WHEN 'madina' THEN 'Медина' ELSE 'аль-Абва' END FROM places WHERE slug IN ('madina', 'abwa')
  ON CONFLICT DO NOTHING;
  INSERT INTO topic_places (topic_id, place_id) SELECT tid, id FROM places WHERE slug IN ('madina', 'abwa') ON CONFLICT DO NOTHING;
  -- On the timeline: the death of the mother, where the event exists.
  INSERT INTO topic_sira_events (topic_id, event_id) SELECT tid, id FROM sira_events WHERE slug = 'death-amina' ON CONFLICT DO NOTHING;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'parents-of-the-prophet', 'status', 'draft', 'positions', 5),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:100');
END $$;
