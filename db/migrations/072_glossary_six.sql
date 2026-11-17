-- 072: six glossary cards (iman, tawhid, shirk, hadith, sunna, qiraat).
-- Quotations only. Sablukov's wording is kept where it differs from a later
-- technical sense of the word. Existing slugs are left alone.

DO $$
DECLARE
  tid bigint;
  did bigint;
BEGIN
  IF (SELECT count(*) FROM library.addresses WHERE address IN (
    'quran.49.14', 'quran.112.1', 'quran.31.13', 'quran.39.23', 'quran.48.23',
    'muslim.35.1', 'bukhari.4992', 'abu_dawud.4607', 'sabaa_ibn_mujahid.1.87.1'
  )) < 9 THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.49.14' AND position('قَالَتِ ٱلْأَعْرَابُ ءَامَنَّا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.id = 'quran.ru.sablukov1894'
    WHERE t.address = 'quran.49.14' AND position('Арабы говорят: „мы веруем!“' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.35.1'
      AND position('الإيمان بضع وسبعون شعبة والحياء شعبة من الإيمان' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.112.1' AND position('قُلْ هُوَ ٱللَّهُ أَحَدٌ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.id = 'quran.ru.sablukov1894'
    WHERE t.address = 'quran.112.1' AND position('Скажи: Он — Бог — един' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.31.13' AND position('إِنَّ ٱلشِّرْكَ لَظُلْمٌ عَظِيمٌ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.id = 'quran.ru.sablukov1894'
    WHERE t.address = 'quran.31.13' AND position('многобожие — великое нечестие' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.39.23' AND position('ٱللَّهُ نَزَّلَ أَحْسَنَ ٱلْحَدِيثِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.id = 'quran.ru.sablukov1894'
    WHERE t.address = 'quran.39.23' AND position('Бог ниспослал самое лучшее учение' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.48.23' AND position('سُنَّةَ ٱللَّهِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.id = 'quran.ru.sablukov1894'
    WHERE t.address = 'quran.48.23' AND position('ты не найдешь перемены в распоряжении Божием' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'abu_dawud.4607'
      AND position('فعليكم بسنتي وسنة الخلفاء المهديين الراشدين' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'bukhari.4992'
      AND position('إن هذا القرآن أنزل على سبعة أحرف، فاقرءوا ما تيسر منه' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'sabaa_ibn_mujahid.1.87.1'
      AND position('فهؤلاء سبعة نفر من أهل الحجاز والعراق والشام خلفوا في القراءة التابعين' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'glossary phrases are not in the library text';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'iman') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('iman', 'إيمان', 'иман', true, 4, 'published', 'migration:072', 'migration:072')
    RETURNING id INTO tid;
    INSERT INTO term_texts (term_id, locale, translation, short, detail)
    VALUES (tid, 'ru', 'вера',
      $s$В 49:14 арабам сказано: «قَالَتِ ٱلْأَعْرَابُ ءَامَنَّا ۖ قُل لَّمْ تُؤْمِنُوا۟ وَلَـٰكِن قُولُوٓا۟ أَسْلَمْنَا». У Саблукова: «Арабы говорят: „мы веруем!“ Скажи: вы не уверовали; а говорите: „мы приняли ислам“».$s$,
      $s$Муслим 35: «الإيمان بضع وسبعون شعبة والحياء شعبة من الإيمان». Степень признания предварительная, её проверяет специалист.$s$);
    INSERT INTO term_refs (term_id, address, position)
    SELECT tid, a::extensions.ltree, o FROM unnest(ARRAY['quran.49.14', 'muslim.35.1']) WITH ORDINALITY AS u(a, o);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Коран, 49:14', 'tradition',
      $s$«قَالَتِ ٱلْأَعْرَابُ ءَامَنَّا ۖ قُل لَّمْ تُؤْمِنُوا۟ وَلَـٰكِن قُولُوٓا۟ أَسْلَمْنَا وَلَمَّا يَدْخُلِ ٱلْإِيمَـٰنُ فِى قُلُوبِكُمْ». У Саблукова: «Арабы говорят: „мы веруем!“ Скажи: вы не уверовали; а говорите: „мы приняли ислам“: вера еще не вошла в сердца ваши».$s$, 0)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'quran.49.14', 0);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Абу Хурайра у Муслима', 'tradition',
      $s$«الإيمان بضع وسبعون شعبة والحياء شعبة من الإيمان» (Муслим 35).$s$, 1)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'muslim.35.1', 0);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', tid::text, 'created', jsonb_build_object('slug', 'iman', 'status', 'published'),
            'Карточка собрана только из цитат. Степень признания предварительная.', 'migration:072');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'tawhid') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('tawhid', 'توحيد', 'таухид', true, 5, 'published', 'migration:072', 'migration:072')
    RETURNING id INTO tid;
    INSERT INTO term_texts (term_id, locale, translation, short, detail)
    VALUES (tid, 'ru', 'единство Бога',
      $s$В 112:1: «قُلْ هُوَ ٱللَّهُ أَحَدٌ». У Саблукова: «Скажи: Он — Бог — един».$s$,
      $s$Слова «таухид» в этом аяте нет. Аят приведён потому, что в нём сказано «ахад». Степень признания предварительная, её проверяет специалист.$s$);
    INSERT INTO term_refs (term_id, address, position) VALUES (tid, 'quran.112.1', 0);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Коран, 112:1', 'tradition',
      $s$«قُلْ هُوَ ٱللَّهُ أَحَدٌ». У Саблукова: «Скажи: Он — Бог — един».$s$, 0)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'quran.112.1', 0);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', tid::text, 'created', jsonb_build_object('slug', 'tawhid', 'status', 'published'),
            'Карточка собрана только из цитат. Степень признания предварительная.', 'migration:072');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'shirk') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('shirk', 'شرك', 'ширк', true, 6, 'published', 'migration:072', 'migration:072')
    RETURNING id INTO tid;
    INSERT INTO term_texts (term_id, locale, translation, short, detail)
    VALUES (tid, 'ru', 'придание Богу соучастника',
      $s$В 31:13: «لَا تُشْرِكْ بِٱللَّهِ ۖ إِنَّ ٱلشِّرْكَ لَظُلْمٌ عَظِيمٌ». У Саблукова: «многобожие — великое нечестие».$s$,
      $s$Слова Лукмана сыну. Степень признания предварительная, её проверяет специалист.$s$);
    INSERT INTO term_refs (term_id, address, position) VALUES (tid, 'quran.31.13', 0);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Коран, 31:13', 'tradition',
      $s$«وَإِذْ قَالَ لُقْمَـٰنُ لِٱبْنِهِۦ وَهُوَ يَعِظُهُۥ يَـٰبُنَىَّ لَا تُشْرِكْ بِٱللَّهِ ۖ إِنَّ ٱلشِّرْكَ لَظُلْمٌ عَظِيمٌ». У Саблукова: «не веруй, что у Бога есть соучастники: многобожие — великое нечестие».$s$, 0)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'quran.31.13', 0);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', tid::text, 'created', jsonb_build_object('slug', 'shirk', 'status', 'published'),
            'Карточка собрана только из цитат. Степень признания предварительная.', 'migration:072');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'hadith') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('hadith', 'حديث', 'хадис', true, 7, 'published', 'migration:072', 'migration:072')
    RETURNING id INTO tid;
    INSERT INTO term_texts (term_id, locale, translation, short, detail)
    VALUES (tid, 'ru', 'рассказ, речь',
      $s$В 39:23: «ٱللَّهُ نَزَّلَ أَحْسَنَ ٱلْحَدِيثِ». У Саблукова это передано так: «Бог ниспослал самое лучшее учение».$s$,
      $s$В аяте слово стоит о ниспосланном писании. Саблуков переводит его «учение», не «хадис». Степень признания предварительная, её проверяет специалист.$s$);
    INSERT INTO term_refs (term_id, address, position) VALUES (tid, 'quran.39.23', 0);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Коран, 39:23, и перевод Саблукова', 'tradition',
      $s$«ٱللَّهُ نَزَّلَ أَحْسَنَ ٱلْحَدِيثِ كِتَـٰبًا مُّتَشَـٰبِهًا». У Саблукова: «Бог ниспослал самое лучшее учение — писание».$s$, 0)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'quran.39.23', 0);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', tid::text, 'created', jsonb_build_object('slug', 'hadith', 'status', 'published'),
            'Карточка собрана только из цитат. Степень признания предварительная.', 'migration:072');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'sunna') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('sunna', 'سنة', 'сунна', true, 8, 'published', 'migration:072', 'migration:072')
    RETURNING id INTO tid;
    INSERT INTO term_texts (term_id, locale, translation, short, detail)
    VALUES (tid, 'ru', 'путь, обычай',
      $s$В 48:23: «سُنَّةَ ٱللَّهِ ٱلَّتِى قَدْ خَلَتْ مِن قَبْلُ». У Саблукова: «ты не найдешь перемены в распоряжении Божием». В Абу Дауде 4607: «فعليكم بسنتي وسنة الخلفاء المهديين الراشدين».$s$,
      $s$В аяте слово стоит о порядке Аллаха. В хадисе — о пути пророка и праведных халифов. Степень признания предварительная, её проверяет специалист.$s$);
    INSERT INTO term_refs (term_id, address, position)
    SELECT tid, a::extensions.ltree, o FROM unnest(ARRAY['quran.48.23', 'abu_dawud.4607']) WITH ORDINALITY AS u(a, o);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Коран, 48:23', 'tradition',
      $s$«سُنَّةَ ٱللَّهِ ٱلَّتِى قَدْ خَلَتْ مِن قَبْلُ ۖ وَلَن تَجِدَ لِسُنَّةِ ٱللَّهِ تَبْدِيلًا». У Саблукова: «ты не найдешь перемены в распоряжении Божием».$s$, 0)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'quran.48.23', 0);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Абу Дауд 4607', 'tradition',
      $s$«فعليكم بسنتي وسنة الخلفاء المهديين الراشدين تمسكوا بها».$s$, 1)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'abu_dawud.4607', 0);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', tid::text, 'created', jsonb_build_object('slug', 'sunna', 'status', 'published'),
            'Карточка собрана только из цитат. Степень признания предварительная.', 'migration:072');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM terms WHERE slug = 'qiraat') THEN
    INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
    VALUES ('qiraat', 'قراءات', 'кираат', true, 9, 'published', 'migration:072', 'migration:072')
    RETURNING id INTO tid;
    INSERT INTO term_texts (term_id, locale, translation, short, detail)
    VALUES (tid, 'ru', 'чтения Корана',
      $s$Бухари 4992: «إن هذا القرآن أنزل على سبعة أحرف، فاقرءوا ما تيسر منه». Ибн Муджахид: «فهؤلاء سبعة نفر من أهل الحجاز والعراق والشام خلفوا في القراءة التابعين».$s$,
      $s$В хадисе речь о семи ахруфах. У Ибн Муджахида — о семи чтецах. Это два разных сообщения, они не сведены. Степень признания предварительная, её проверяет специалист.$s$);
    INSERT INTO term_refs (term_id, address, position)
    SELECT tid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.4992', 'sabaa_ibn_mujahid.1.87.1']) WITH ORDINALITY AS u(a, o);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'аль-Бухари 4992', 'tradition',
      $s$«إن هذا القرآن أنزل على سبعة أحرف، فاقرءوا ما تيسر منه».$s$, 0)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'bukhari.4992', 0);
    INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
    VALUES (tid, 'ru', 'Ибн Муджахид', 'tradition',
      $s$«فهؤلاء سبعة نفر من أهل الحجاز والعراق والشام خلفوا في القراءة التابعين» («ас-Саба» 1:87).$s$, 1)
    RETURNING id INTO did;
    INSERT INTO term_refs (term_id, definition_id, address, position) VALUES (tid, did, 'sabaa_ibn_mujahid.1.87.1', 0);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('term', tid::text, 'created', jsonb_build_object('slug', 'qiraat', 'status', 'published'),
            'Карточка собрана только из цитат. Степень признания предварительная.', 'migration:072');
  END IF;
END $$;
