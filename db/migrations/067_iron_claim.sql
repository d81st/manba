-- 067: draft of the science claim «железо ниспослано» (docs/PLAN.md, 17.11.2026).
-- The Quran and Ibn Kathir are quoted from the library. The research side is
-- the abstract of one open article (CC BY 4.0), not a text in the library.
-- The topic stays a draft. On an empty database, before the import, it does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано 17.11.2026. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'iron-sent-down')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.57.25')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.57.25')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.39.6')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.57.25'
      AND position('وجعلنا الحديد رادعا لمن أبى الحق وعانده بعد قيام الحجة عليه' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.57.25'
      AND position('وَأَنزَلْنَا ٱلْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.39.6'
      AND position('أَنزَلَ لَكُم مِّنَ ٱلْأَنْعَـٰمِ ثَمَـٰنِيَةَ أَزْوَٰجٍ' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'iron phrases are not in the library text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('iron-sent-down', 'science_claims', 'draft', 'migration:067', 'migration:067')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Железо «ниспослано» в 57:25$p$,
    $p$Что говорит Ибн Касир о словах «وَأَنزَلْنَا ٱلْحَدِيدَ», и что говорит об этом чтении открытая статья?$p$,
    $p$В 57:25: «وَأَنزَلْنَا ٱلْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ وَمَنَـٰفِعُ لِلنَّاسِ». Ибн Касир к 57:25: «وجعلنا الحديد رادعا لمن أبى الحق وعانده بعد قيام الحجة عليه». В 39:6 тот же глагол стоит о скоте: «أَنزَلَ لَكُم مِّنَ ٱلْأَنْعَـٰمِ ثَمَـٰنِيَةَ أَزْوَٰجٍ».$p$,
    $p$Собрано 17.11.2026. Книги сторонников «научного чуда» под авторским правом и сюда не переносились. Сторона исследователей — аннотация одной статьи, лицензия CC BY 4.0. Шиитского толкования этого аята в библиотеке нет. Специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.57.25', 0),
    ('circumstances', 'tafsir_ibn_kathir.57.25', 0),
    ('related', 'quran.39.6', 0)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition',
    $p$«وجعلنا الحديد رادعا لمن أبى الحق وعانده بعد قيام الحجة عليه» (Ибн Касир 57:25).$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.57.25', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Зохра Ахаванмогхадам и Марзийе Бахрами Чиме$p$, 'minority',
    $p$The Holy Qur’an, in addition to its primary purpose of guiding humanity, contains numerous scientific references that were not fully understood at the time of its revelation. Verse 25 of Surah al-Ḥadīd refers to the sending down of iron. The use of the verb anzala (to send down) instead of more commonly used verbs such as khalaqa (to create) and jaʿala (to make) has led to various interpretations of this verse throughout history. This research employs a descriptive-analytical method to examine the concept of the sending down of iron (inzāl al-ḥadīd) and its strong nature (ba's shadīd), as well as its relation to new scientific findings regarding the origin of iron on Earth. Additionally, it investigates whether people at the time of the Qur’an’s revelation had any knowledge of the extraterrestrial origin of iron. Contrary to some extreme approaches to the scientific interpretation and miracles of the Qur’an in recent centuries, this research advocates a balanced perspective that utilizes scientific findings, without any imposition, to better understand the verses of the Qur’an. Recent scientific discoveries indicate that iron is primarily produced in the cores of massive stars, and it cannot be produced in the solar system. Therefore, the use of the verb anzala may allude to the extraterrestrial origin of iron. The results of this research reveal that, from a scientific standpoint, various phenomena are involved in the process of iron's incorporation into Earth that could embody the concept of "sending down," including the production of iron in massive stars and its transfer to Earth through certain cosmic processes, the collision of iron-rich meteorites and asteroids with Earth, and the sinking of iron towards the Earth's core. Regarding the knowledge of people about the extraterrestrial origin of iron at the time of revelation, although it has been claimed that the term used for iron in ancient Egypt means "metal from heaven," the findings of this research indicate that this claim is merely a possibility and, despite extensive research, has not been definitively verified.$p$,
    $p$Zohreh Akhavanmoghadam, Marziyeh Bahrami Chimeh. A Critical Analysis of the “Miracle” of Iron’s Descent (Q. 57:25). Journal of Interdisciplinary Qur’anic Studies, vol. 2, no. 2, December 2023. DOI 10.37264/jiqs.v2i2december2023.8. На первой странице файла указана лицензия CC BY 4.0. Приведён весь текст аннотации, как он дан на странице журнала. Степень признания предварительная: это одна статья, не опрос исследователей.$p$,
    1
  FROM position_sides s WHERE s.slug = 'research' RETURNING id INTO pid;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'iron-sent-down', 'status', 'draft', 'positions', 2),
          'Черновик утверждения о ниспослании железа: аят 57:25, Ибн Касир и аннотация открытой статьи. Специалистом не проверен.', 'migration:067');
END $$;
