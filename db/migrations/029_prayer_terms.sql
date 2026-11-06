-- 029: draft glossary cards for salat, qibla and rak'a.
-- Every sentence points at a fragment already in the library (Hafs, Sablukov's
-- translation, a hadith, or Ibn Kathir). Internet dictionaries were used only
-- to find which places to open; their wording is not stored.
-- The word ركعة is not in the loaded Quran, so the card says so and quotes
-- the hadiths that count the prayer in rak'as.
-- Recognition is marked tradition because the quotation is what that source
-- says, and the detail says a specialist still has to check the label.
-- Existing slugs are left alone.
-- On an empty database (CI, a fresh install) the library is imported only
-- after the migrations, so the cited fragments do not exist yet and the cards
-- are skipped rather than failing on the address foreign key.

DO $$
DECLARE
  n integer;
  salat_id bigint;
  qibla_id bigint;
  rakat_id bigint;
BEGIN
  IF (SELECT count(*) FROM addresses
      WHERE address IN ('bukhari.350', 'muslim.687.1', 'tafsir_ibn_kathir.2.144', 'quran.2.144')) < 4 THEN
    RETURN;
  END IF;
  n := coalesce((SELECT max(basic_order) FROM terms), 0);

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'salat') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('salat', 'صلاة', 'салят', true, n + 1, 'published', 'migration:029', 'migration:029')
    RETURNING id INTO salat_id;
    INSERT INTO term_texts (term_id, locale, translation, short, detail) VALUES (
      salat_id, 'ru', 'молитва',
      $s$В Коране это слово الصلاة. У Саблукова: «совершают молитвы» (2:3), «совершайте молитву» (2:43). В 11:114 и 17:78 у неё названы части дня и ночи. Сколько в ней ракаатов, эти аяты не говорят: счёт стоит в хадисах (Бухари 350, Муслим 687a).$s$,
      $s$Рядом с молитвой в 2:43 Саблуков ставит очистительную милостыню и «покланяйтесь с покланяющимися». 2:238 у него — о молитвах и о средней молитве. 4:103 говорит о молитве после того, как её завершили, и о том, чтобы выстаивать её, когда наступит покой; русский текст здесь не приводится, адрес — сам аят. Степень признания у значений ниже поставлена предварительно: она отмечает, что так сказано в названном месте, и её проверяет специалист.$s$
    );
    INSERT INTO term_refs (term_id, address, position)
    SELECT salat_id, a::extensions.ltree, i
    FROM unnest(ARRAY['quran.2.3','quran.2.43','quran.2.238','quran.4.103','quran.11.114','quran.17.78','bukhari.350','muslim.687.1'])
      WITH ORDINALITY AS u(a, i);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (
      salat_id, 'ru', 'Коран в переводе Саблукова', 'tradition',
      $s$«тем, которые веруют в сокровенное, совершают молитвы» (2:3). «Совершайте молитву, давайте очистительную милостыню, покланяйтесь с покланяющимися» (2:43). «Совершай молитву при двух пределах дня и при наступлении часов ночи» (11:114). «Совершай молитву при склонении солнца к сумраку ночи» (17:78).$s$,
      0
    );
    INSERT INTO term_refs (term_id, definition_id, address, position)
    SELECT salat_id, d.id, a::extensions.ltree, i
    FROM term_definitions d
    CROSS JOIN unnest(ARRAY['quran.2.3','quran.2.43','quran.11.114','quran.17.78']) WITH ORDINALITY AS u(a, i)
    WHERE d.term_id = salat_id AND d.position = 0;
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (
      salat_id, 'ru', 'Аиша и Ибн Аббас в хадисах', 'tradition',
      $s$Аиша: «فرض الله الصلاة حين فرضها، ركعتين ركعتين، في الحضر والسفر، فأقرت صلاة السفر، وزيد في صلاة الحضر» (Бухари 350). Ибн Аббас: «فرض الله الصلاة على لسان نبيكم صلى الله عليه وسلم في الحضر أربعا وفي السفر ركعتين وفي الخوف ركعة» (Муслим 687a).$s$,
      1
    );
    INSERT INTO term_refs (term_id, definition_id, address, position)
    SELECT salat_id, d.id, a::extensions.ltree, i
    FROM term_definitions d
    CROSS JOIN unnest(ARRAY['bukhari.350','muslim.687.1']) WITH ORDINALITY AS u(a, i)
    WHERE d.term_id = salat_id AND d.position = 1;
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', salat_id::text, 'created', jsonb_build_object('slug', 'salat', 'status', 'published'),
            'Термин собран из Корана, перевода Саблукова и двух хадисов. Степень признания предварительная.', 'migration:029');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'qibla') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('qibla', 'قبلة', 'кибла', true, n + 2, 'published', 'migration:029', 'migration:029')
    RETURNING id INTO qibla_id;
    INSERT INTO term_texts (term_id, locale, translation, short, detail) VALUES (
      qibla_id, 'ru', 'направление лица в молитве',
      $s$В загруженном Хафсе слово قبلة стоит в 2:142, 2:143, 2:144, 2:145 и 10:87. В 2:144 велят обратить лицо «к запретной мечети» (так и у Саблукова). В 10:87 то же слово сказано о домах: Ибн Касир приводит слова Ибн Аббаса «приказано сделать их мечетями» (Ибн Касир 10:87).$s$,
      $s$Ибн Касир к 2:144 передаёт, что кибла была первым, что отменили в Коране, и что сначала было велено обратиться к Иерусалиму (Ибн Касир 2:144). Хадис Анаса называет «нашу киблу» рядом с «нашей молитвой»: «واستقبل قبلتنا، وصلى صلاتنا» (Бухари 393). Степень признания предварительная, её проверяет специалист.$s$
    );
    INSERT INTO term_refs (term_id, address, position)
    SELECT qibla_id, a::extensions.ltree, i
    FROM unnest(ARRAY[
      'quran.2.142','quran.2.143','quran.2.144','quran.2.145','quran.10.87',
      'bukhari.393','tafsir_ibn_kathir.2.144','tafsir_ibn_kathir.10.87'
    ]) WITH ORDINALITY AS u(a, i);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (
      qibla_id, 'ru', 'Коран, 2:144', 'tradition',
      $s$«فَوَلِّ وَجْهَكَ شَطْرَ ٱلْمَسْجِدِ ٱلْحَرَامِ». У Саблукова: «Так обращай лице твое к запретной мечети; и вы, где бы ни были, обращайте ваши лица к ней».$s$,
      0
    );
    INSERT INTO term_refs (term_id, definition_id, address, position)
    SELECT qibla_id, d.id, 'quran.2.144'::extensions.ltree, 0
    FROM term_definitions d WHERE d.term_id = qibla_id AND d.position = 0;
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (
      qibla_id, 'ru', 'Ибн Касир к 2:144', 'tradition',
      $s$«كان أول ما نسخ من القرآن القبلة، وذلك أن رسول الله صلى الله عليه وسلم لما هاجر إلى المدينة، وكان أكثر أهلها اليهود، فأمره الله أن يستقبل بيت المقدس».$s$,
      1
    );
    INSERT INTO term_refs (term_id, definition_id, address, position)
    SELECT qibla_id, d.id, 'tafsir_ibn_kathir.2.144'::extensions.ltree, 0
    FROM term_definitions d WHERE d.term_id = qibla_id AND d.position = 1;
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (
      qibla_id, 'ru', 'Ибн Аббас у Ибн Касира к 10:87', 'tradition',
      $s$О словах «وَٱجْعَلُوا۟ بُيُوتَكُمْ قِبْلَةً»: «عن ابن عباس: {واجعلوا بيوتكم قبلة} قال: أمروا أن يتخذوها مساجد».$s$,
      2
    );
    INSERT INTO term_refs (term_id, definition_id, address, position)
    SELECT qibla_id, d.id, a::extensions.ltree, i
    FROM term_definitions d
    CROSS JOIN unnest(ARRAY['tafsir_ibn_kathir.10.87','quran.10.87']) WITH ORDINALITY AS u(a, i)
    WHERE d.term_id = qibla_id AND d.position = 2;
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', qibla_id::text, 'created', jsonb_build_object('slug', 'qibla', 'status', 'published'),
            'Термин собран из аятов о кибле, Бухари 393 и Ибн Касира. Степень признания предварительная.', 'migration:029');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'rakat') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('rakat', 'ركعة', 'ракаат', true, n + 3, 'published', 'migration:029', 'migration:029')
    RETURNING id INTO rakat_id;
    INSERT INTO term_texts (term_id, locale, translation, short, detail) VALUES (
      rakat_id, 'ru', 'счётная часть молитвы в хадисах',
      $s$Слова ركعة в загруженном тексте Корана нет. Хадисы считают молитву так: «ركعتين ركعتين، في الحضر والسفر» (Бухари 350); «في الحضر أربعا وفي السفر ركعتين وفي الخوف ركعة» (Муслим 687a). В Коране тот же корень — о поклоне: 2:43 и 22:77.$s$,
      $s$Что именно входит в одну ракаат (стояние, поясной поклон, земные поклоны), эти два хадиса не расписывают, поэтому сюда это не дописано. У Саблукова 2:43 — «покланяйтесь с покланяющимися», 22:77 — «совершайте молитвенные наклонения и преклонения». Степень признания предварительная, её проверяет специалист.$s$
    );
    INSERT INTO term_refs (term_id, address, position)
    SELECT rakat_id, a::extensions.ltree, i
    FROM unnest(ARRAY['bukhari.350','muslim.687.1','quran.2.43','quran.22.77']) WITH ORDINALITY AS u(a, i);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (
      rakat_id, 'ru', 'Аиша и Ибн Аббас в хадисах', 'tradition',
      $s$«فرض الله الصلاة حين فرضها، ركعتين ركعتين، في الحضر والسفر، فأقرت صلاة السفر، وزيد في صلاة الحضر» (Бухари 350). «في الحضر أربعا وفي السفر ركعتين وفي الخوف ركعة» (Муслим 687a).$s$,
      0
    );
    INSERT INTO term_refs (term_id, definition_id, address, position)
    SELECT rakat_id, d.id, a::extensions.ltree, i
    FROM term_definitions d
    CROSS JOIN unnest(ARRAY['bukhari.350','muslim.687.1']) WITH ORDINALITY AS u(a, i)
    WHERE d.term_id = rakat_id AND d.position = 0;
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (
      rakat_id, 'ru', 'Коран, корень ركع', 'tradition',
      $s$«وَٱرْكَعُوا۟ مَعَ ٱلرَّٰكِعِينَ» (2:43). «ٱرْكَعُوا۟ وَٱسْجُدُوا۟» (22:77). У Саблукова это «покланяйтесь с покланяющимися» и «совершайте молитвенные наклонения и преклонения». Это не слово ركعة.$s$,
      1
    );
    INSERT INTO term_refs (term_id, definition_id, address, position)
    SELECT rakat_id, d.id, a::extensions.ltree, i
    FROM term_definitions d
    CROSS JOIN unnest(ARRAY['quran.2.43','quran.22.77']) WITH ORDINALITY AS u(a, i)
    WHERE d.term_id = rakat_id AND d.position = 1;
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', rakat_id::text, 'created', jsonb_build_object('slug', 'rakat', 'status', 'published'),
            'Термин собран из Бухари 350, Муслим 687a и двух аятов корня ركع. Степень признания предварительная.', 'migration:029');
  END IF;

  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, v.kind
  FROM (VALUES
    ('salat', 'qibla', 'related'),
    ('qibla', 'salat', 'related'),
    ('salat', 'rakat', 'broader'),
    ('rakat', 'salat', 'narrower')
  ) AS v(a, b, kind)
  JOIN terms a ON a.slug = v.a
  JOIN terms b ON b.slug = v.b
  ON CONFLICT DO NOTHING;

  INSERT INTO topic_terms (topic_id, term_id)
  SELECT t.id, m.id
  FROM topics t
  JOIN terms m ON m.slug IN ('salat', 'qibla', 'rakat')
  WHERE t.slug = 'namaz'
  ON CONFLICT DO NOTHING;
END $$;
