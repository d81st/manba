-- 077: twelve more glossary cards from quotations only (docs/PLAN.md, 19.11.2026).
-- Hafs and Sablukov are copied as they stand. Where Sablukov's Russian
-- word is not the later technical term, the card says so. Existing slugs
-- are left alone. Recognition is preliminary.

CREATE OR REPLACE FUNCTION pg_temp.add_basic(
  slug_in text, arabic_in text, translit text, translation text,
  short_in text, detail_in text, refs text[], holder text, body text
) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  tid bigint;
  did bigint;
  ord integer;
BEGIN
  IF EXISTS (SELECT 1 FROM terms WHERE slug = slug_in) THEN
    RETURN;
  END IF;
  ord := coalesce((SELECT max(basic_order) FROM terms), 0) + 1;
  INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
  VALUES (slug_in, arabic_in, translit, true, ord, 'published', 'migration:077', 'migration:077')
  RETURNING id INTO tid;
  INSERT INTO term_texts (term_id, locale, translation, short, detail)
  VALUES (tid, 'ru', translation, short_in, detail_in);
  INSERT INTO term_refs (term_id, address, position)
  SELECT tid, a::extensions.ltree, i FROM unnest(refs) WITH ORDINALITY AS u(a, i);
  INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
  VALUES (tid, 'ru', holder, 'tradition', body, 0)
  RETURNING id INTO did;
  INSERT INTO term_refs (term_id, definition_id, address, position)
  SELECT tid, did, a::extensions.ltree, i FROM unnest(refs) WITH ORDINALITY AS u(a, i);
  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('term', tid::text, 'created', jsonb_build_object('slug', slug_in, 'status', 'published'),
          'Карточка собрана только из цитат Хафса и Саблукова. Степень признания предварительная.',
          'migration:077');
END $f$;

DO $$
BEGIN
  IF (SELECT count(*) FROM library.addresses WHERE address IN (
    'quran.2.153', 'quran.2.152', 'quran.14.7', 'quran.33.41', 'quran.66.8',
    'quran.2.222', 'quran.2.186', 'quran.2.3', 'quran.2.25', 'quran.2.285',
    'quran.17.85', 'quran.75.1', 'quran.16.90', 'quran.3.159'
  )) < 14 THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.153' AND position('بِٱلصَّبْرِ وَٱلصَّلَوٰةِ' IN t.content) > 0
      AND position('إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.153'
      AND position('Верующие ищите помощи себе в терпении и молитве' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.152' AND position('فَٱذْكُرُونِىٓ أَذْكُرْكُمْ' IN t.content) > 0
      AND position('وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.152'
      AND position('За то помните Меня, и Я буду помнить вас' IN t.content) > 0
      AND position('будьте благодарны Мне, и не будьте непризнательны' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.14.7' AND position('لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.14.7'
      AND position('если будете благодарны, Я увеличу вас' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.33.41' AND position('ٱذْكُرُوا۟ ٱللَّهَ ذِكْرًا كَثِيرًا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.33.41'
      AND position('вспоминайте Бога частыми вспоминаниями' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.66.8' AND position('تُوبُوٓا۟ إِلَى ٱللَّهِ تَوْبَةً نَّصُوحًا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.66.8'
      AND position('раскаивайтесь пред Богом искренним раскаянием' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.222' AND position('يُحِبُّ ٱلتَّوَّٰبِينَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.222'
      AND position('Бог любит с раскаянием обращающихся' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.186' AND position('أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.186'
      AND position('внемлю молению молящегося, когда он помолится Мне' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.3' AND position('يُؤْمِنُونَ بِٱلْغَيْبِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.3'
      AND position('тем, которые веруют в сокровенное' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.25' AND position('جَنَّـٰتٍ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَـٰرُ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.25'
      AND position('для них будут сады, по которым текут реки' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.285' AND position('وَمَلَـٰٓئِكَتِهِۦ وَكُتُبِهِۦ وَرُسُلِهِۦ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.285'
      AND position('в ангелов Его, в Писание Его, и в посланников Его' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.17.85' AND position('وَيَسْـَٔلُونَكَ عَنِ ٱلرُّوحِ' IN t.content) > 0
      AND position('قُلِ ٱلرُّوحُ مِنْ أَمْرِ رَبِّى' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.17.85'
      AND position('Они спрашивают тебя о духе' IN t.content) > 0
      AND position('дух от по веления Господа моего' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.75.1' AND position('بِيَوْمِ ٱلْقِيَـٰمَةِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.75.1'
      AND position('Клянусь днем воскресения' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.16.90' AND position('بِٱلْعَدْلِ وَٱلْإِحْسَـٰنِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.16.90'
      AND position('Бог заповедует правосудие, благотворительность' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.3.159' AND position('فَتَوَكَّلْ عَلَى ٱللَّهِ' IN t.content) > 0
      AND position('يُحِبُّ ٱلْمُتَوَكِّلِينَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.3.159'
      AND position('возложи надежду на Бога, потому что Бог любит надеющихся на Него' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'glossary phrases are not in the library text';
  END IF;

  PERFORM pg_temp.add_basic('sabr', 'صبر', 'сабр', 'терпение',
    $s$В 2:153: «بِٱلصَّبْرِ وَٱلصَّلَوٰةِ». У Саблукова: «Верующие ищите помощи себе в терпении и молитве».$s$,
    $s$Рядом: «إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ». Это слово аята рядом с молитвой. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.153'], 'Хафс и Саблуков',
    $s$«بِٱلصَّبْرِ وَٱلصَّلَوٰةِ» и «إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ» (2:153). У Саблукова: «Верующие ищите помощи себе в терпении и молитве».$s$);

  PERFORM pg_temp.add_basic('shukr', 'شكر', 'шукр', 'благодарность',
    $s$В 2:152: «وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ». У Саблукова: «будьте благодарны Мне, и не будьте непризнательны». В 14:7: «لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ», у Саблукова: «если будете благодарны, Я увеличу вас».$s$,
    $s$В 14:7 рядом «كَفَرْتُمْ», у Саблукова «будете непризнательны». Это слова аятов. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.152', 'quran.14.7'], 'Хафс и Саблуков',
    $s$«وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ» (2:152). У Саблукова: «будьте благодарны Мне, и не будьте непризнательны». «لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ» (14:7). У Саблукова: «если будете благодарны, Я увеличу вас».$s$);

  PERFORM pg_temp.add_basic('dhikr', 'ذكر', 'зикр', 'вспоминание',
    $s$В 33:41: «ٱذْكُرُوا۟ ٱللَّهَ ذِكْرًا كَثِيرًا». У Саблукова: «вспоминайте Бога частыми вспоминаниями». В 2:152: «فَٱذْكُرُونِىٓ أَذْكُرْكُمْ», у Саблукова: «За то помните Меня, и Я буду помнить вас».$s$,
    $s$Саблуков в этих двух аятах пишет и «вспоминайте», и «помните». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.33.41', 'quran.2.152'], 'Хафс и Саблуков',
    $s$«ٱذْكُرُوا۟ ٱللَّهَ ذِكْرًا كَثِيرًا» (33:41). У Саблукова: «вспоминайте Бога частыми вспоминаниями». «فَٱذْكُرُونِىٓ أَذْكُرْكُمْ» (2:152). У Саблукова: «За то помните Меня, и Я буду помнить вас».$s$);

  PERFORM pg_temp.add_basic('tawba', 'توبة', 'тауба', 'раскаяние',
    $s$В 66:8: «تُوبُوٓا۟ إِلَى ٱللَّهِ تَوْبَةً نَّصُوحًا». У Саблукова: «раскаивайтесь пред Богом искренним раскаянием». В 2:222: «يُحِبُّ ٱلتَّوَّٰبِينَ», у Саблукова: «Бог любит с раскаянием обращающихся».$s$,
    $s$В 66:8 стоит «تَوْبَةً», в 2:222 — «ٱلتَّوَّٰبِينَ». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.66.8', 'quran.2.222'], 'Хафс и Саблуков',
    $s$«تُوبُوٓا۟ إِلَى ٱللَّهِ تَوْبَةً نَّصُوحًا» (66:8). У Саблукова: «раскаивайтесь пред Богом искренним раскаянием». «يُحِبُّ ٱلتَّوَّٰبِينَ» (2:222). У Саблукова: «Бог любит с раскаянием обращающихся».$s$);

  PERFORM pg_temp.add_basic('dua', 'دعاء', 'дуа', 'моление',
    $s$В 2:186: «أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ». У Саблукова: «внемлю молению молящегося, когда он помолится Мне».$s$,
    $s$Саблуков передаёт это словами «молению» и «помолится». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.186'], 'Хафс и Саблуков',
    $s$«أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ» (2:186). У Саблукова: «внемлю молению молящегося, когда он помолится Мне».$s$);

  PERFORM pg_temp.add_basic('ghayb', 'غيب', 'гайб', 'сокровенное',
    $s$В 2:3: «يُؤْمِنُونَ بِٱلْغَيْبِ». У Саблукова: «тем, которые веруют в сокровенное».$s$,
    $s$Саблуков передаёт «ٱلْغَيْبِ» словом «сокровенное». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.3'], 'Хафс и Саблуков',
    $s$«يُؤْمِنُونَ بِٱلْغَيْبِ» (2:3). У Саблукова: «тем, которые веруют в сокровенное».$s$);

  PERFORM pg_temp.add_basic('janna', 'جنة', 'джанна', 'сады',
    $s$В 2:25: «جَنَّـٰتٍ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَـٰرُ». У Саблукова: «для них будут сады, по которым текут реки».$s$,
    $s$Саблуков передаёт «جَنَّـٰتٍ» словом «сады». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.25'], 'Хафс и Саблуков',
    $s$«جَنَّـٰتٍ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَـٰرُ» (2:25). У Саблукова: «для них будут сады, по которым текут реки».$s$);

  PERFORM pg_temp.add_basic('malaika', 'ملائكة', 'малаика', 'ангелы',
    $s$В 2:285: «وَمَلَـٰٓئِكَتِهِۦ وَكُتُبِهِۦ وَرُسُلِهِۦ». У Саблукова: «в ангелов Его, в Писание Его, и в посланников Его».$s$,
    $s$Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.285'], 'Хафс и Саблуков',
    $s$«وَمَلَـٰٓئِكَتِهِۦ وَكُتُبِهِۦ وَرُسُلِهِۦ» (2:285). У Саблукова: «в ангелов Его, в Писание Его, и в посланников Его».$s$);

  PERFORM pg_temp.add_basic('ruh', 'روح', 'рух', 'дух',
    $s$В 17:85: «وَيَسْـَٔلُونَكَ عَنِ ٱلرُّوحِ». У Саблукова: «Они спрашивают тебя о духе».$s$,
    $s$Дальше в аяте: «قُلِ ٱلرُّوحُ مِنْ أَمْرِ رَبِّى». В книге Саблукова эта строка напечатана так: «дух от по веления Господа моего». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.17.85'], 'Хафс и Саблуков',
    $s$«وَيَسْـَٔلُونَكَ عَنِ ٱلرُّوحِ» и «قُلِ ٱلرُّوحُ مِنْ أَمْرِ رَبِّى» (17:85). У Саблукова: «Они спрашивают тебя о духе» и «дух от по веления Господа моего».$s$);

  PERFORM pg_temp.add_basic('qiyamah', 'قيامة', 'кийама', 'воскресение',
    $s$В 75:1: «بِيَوْمِ ٱلْقِيَـٰمَةِ». У Саблукова: «Клянусь днем воскресения».$s$,
    $s$Саблуков передаёт «يَوْمِ ٱلْقِيَـٰمَةِ» словами «днем воскресения». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.75.1'], 'Хафс и Саблуков',
    $s$«بِيَوْمِ ٱلْقِيَـٰمَةِ» (75:1). У Саблукова: «Клянусь днем воскресения».$s$);

  PERFORM pg_temp.add_basic('ihsan', 'إحسان', 'ихсан', 'благотворительность',
    $s$В 16:90: «بِٱلْعَدْلِ وَٱلْإِحْسَـٰنِ». У Саблукова: «Бог заповедует правосудие, благотворительность».$s$,
    $s$Саблуков передаёт «ٱلْإِحْسَـٰنِ» словом «благотворительность», а «ٱلْعَدْلِ» — «правосудие». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.16.90'], 'Хафс и Саблуков',
    $s$«بِٱلْعَدْلِ وَٱلْإِحْسَـٰنِ» (16:90). У Саблукова: «Бог заповедует правосудие, благотворительность».$s$);

  PERFORM pg_temp.add_basic('tawakkul', 'توكل', 'таваккуль', 'надежда на Бога',
    $s$В 3:159: «فَتَوَكَّلْ عَلَى ٱللَّهِ» и «يُحِبُّ ٱلْمُتَوَكِّلِينَ». У Саблукова: «возложи надежду на Бога, потому что Бог любит надеющихся на Него».$s$,
    $s$В аяте стоят глагол и «ٱلْمُتَوَكِّلِينَ». Саблуков пишет «возложи надежду» и «надеющихся на Него». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.3.159'], 'Хафс и Саблуков',
    $s$«فَتَوَكَّلْ عَلَى ٱللَّهِ» и «يُحِبُّ ٱلْمُتَوَكِّلِينَ» (3:159). У Саблукова: «возложи надежду на Бога, потому что Бог любит надеющихся на Него».$s$);

  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, 'related'
  FROM terms a
  JOIN terms b ON b.slug = 'salat'
  WHERE a.slug = 'sabr'
    AND NOT EXISTS (
      SELECT 1 FROM term_relations r WHERE r.term_id = a.id AND r.related_id = b.id
    );
  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, 'related'
  FROM terms a
  JOIN terms b ON b.slug = 'sabr'
  WHERE a.slug = 'salat'
    AND NOT EXISTS (
      SELECT 1 FROM term_relations r WHERE r.term_id = a.id AND r.related_id = b.id
    );
  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, 'related'
  FROM terms a
  JOIN terms b ON b.slug = 'shukr'
  WHERE a.slug = 'dhikr'
    AND NOT EXISTS (
      SELECT 1 FROM term_relations r WHERE r.term_id = a.id AND r.related_id = b.id
    );
  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, 'related'
  FROM terms a
  JOIN terms b ON b.slug = 'dhikr'
  WHERE a.slug = 'shukr'
    AND NOT EXISTS (
      SELECT 1 FROM term_relations r WHERE r.term_id = a.id AND r.related_id = b.id
    );
END $$;
