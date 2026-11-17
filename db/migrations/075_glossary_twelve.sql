-- 075: twelve glossary cards from quotations only (docs/PLAN.md, 17.11.2026).
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
  VALUES (slug_in, arabic_in, translit, true, ord, 'published', 'migration:075', 'migration:075')
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
          'migration:075');
END $f$;

DO $$
BEGIN
  IF (SELECT count(*) FROM library.addresses WHERE address IN (
    'quran.3.19', 'quran.49.14', 'quran.109.1', 'quran.33.40', 'quran.4.100',
    'quran.59.8', 'quran.2.185', 'quran.9.18', 'quran.2.168', 'quran.5.3',
    'quran.49.13', 'quran.2.143', 'quran.2.275', 'quran.5.90'
  )) < 14 THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.3.19' AND position('إِنَّ ٱلدِّينَ عِندَ ٱللَّهِ ٱلْإِسْلَـٰمُ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.3.19'
      AND position('благочестие пред Богом есть покорность' IN t.content) > 0
      AND position('[[Ислам.]]' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.49.14' AND position('وَلَـٰكِن قُولُوٓا۟ أَسْلَمْنَا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.109.1' AND position('قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.109.1'
      AND position('Скажи: неверные!' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.33.40' AND position('وَلَـٰكِن رَّسُولَ ٱللَّهِ وَخَاتَمَ ٱلنَّبِيِّـۧنَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.33.40'
      AND position('он только посланник Бога и печать пророков' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.4.100' AND position('وَمَن يُهَاجِرْ فِى سَبِيلِ ٱللَّهِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.4.100'
      AND position('Кто оставит свою родину для пути Божия' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.59.8' AND position('ٱلْمُهَـٰجِرِينَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.59.8'
      AND position('бедным из могаджиров' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.185' AND position('أُنزِلَ فِيهِ ٱلْقُرْءَانُ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.185'
      AND position('в который ниспослан вам Коран' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.9.18' AND position('مَسَـٰجِدَ ٱللَّهِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.9.18'
      AND position('мечети Божии' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.168' AND position('حَلَـٰلًا طَيِّبًا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.168'
      AND position('ешьте только разрешенные в пищу' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.5.3' AND position('حُرِّمَتْ عَلَيْكُمُ ٱلْمَيْتَةُ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.5.3'
      AND position('запрещается в пищу мертвечина, кровь, мясо свиньи' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.49.13' AND position('إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.49.13'
      AND position('кто из вас богобоязливее' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.143' AND position('أُمَّةً وَسَطًا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.143'
      AND position('Мы поставили вас народом посредствующим' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.275' AND position('وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.275'
      AND position('„лихва тоже, что прибыль в торговле“. Но Бог позволил прибыль в торговле, а лихву запретил' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.5.90' AND position('إِنَّمَا ٱلْخَمْرُ وَٱلْمَيْسِرُ وَٱلْأَنصَابُ وَٱلْأَزْلَـٰمُ رِجْسٌ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.5.90'
      AND position('вино, игра в жеребьи, кумиры, стрелованье гнусны' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'glossary phrases are not in the library text';
  END IF;

  PERFORM pg_temp.add_basic('islam', 'إسلام', 'ислам', 'покорность',
    $s$В 3:19: «إِنَّ ٱلدِّينَ عِندَ ٱللَّهِ ٱلْإِسْلَـٰمُ». У Саблукова: «благочестие пред Богом есть покорность», в скобках переводчика: «[[Ислам.]]».$s$,
    $s$В 49:14 рядом стоят «أَسْلَمْنَا» и слово «иман». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.3.19', 'quran.49.14'], 'Хафс и Саблуков',
    $s$«إِنَّ ٱلدِّينَ عِندَ ٱللَّهِ ٱلْإِسْلَـٰمُ» (3:19). У Саблукова: «благочестие пред Богом есть покорность». Пометка переводчика: «[[Ислам.]]».$s$);

  PERFORM pg_temp.add_basic('kufr', 'كفر', 'куфр', 'неверные',
    $s$В 109:1: «قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ». У Саблукова: «Скажи: неверные!».$s$,
    $s$Карточка приводит слово аята и перевод Саблукова. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.109.1'], 'Хафс и Саблуков',
    $s$«قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ» (109:1). У Саблукова: «Скажи: неверные!».$s$);

  PERFORM pg_temp.add_basic('rasul', 'رسول', 'расуль', 'посланник',
    $s$В 33:40: «وَلَـٰكِن رَّسُولَ ٱللَّهِ وَخَاتَمَ ٱلنَّبِيِّـۧنَ». У Саблукова: «он только посланник Бога и печать пророков».$s$,
    $s$В том же аяте стоит «ٱلنَّبِيِّـۧنَ». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.33.40'], 'Хафс и Саблуков',
    $s$«وَلَـٰكِن رَّسُولَ ٱللَّهِ وَخَاتَمَ ٱلنَّبِيِّـۧنَ» (33:40). У Саблукова: «он только посланник Бога и печать пророков».$s$);

  PERFORM pg_temp.add_basic('nabi', 'نبي', 'наби', 'пророк',
    $s$В 33:40: «وَخَاتَمَ ٱلنَّبِيِّـۧنَ». У Саблукова: «печать пророков».$s$,
    $s$Рядом в том же аяте: «رَّسُولَ ٱللَّهِ», у Саблукова «посланник Бога». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.33.40'], 'Хафс и Саблуков',
    $s$«وَخَاتَمَ ٱلنَّبِيِّـۧنَ» (33:40). У Саблукова: «печать пророков».$s$);

  PERFORM pg_temp.add_basic('hijra', 'هجرة', 'хиджра', 'оставление родины',
    $s$В 4:100: «وَمَن يُهَاجِرْ فِى سَبِيلِ ٱللَّهِ». У Саблукова: «Кто оставит свою родину для пути Божия». В 59:8: «ٱلْمُهَـٰجِرِينَ», у Саблукова: «бедным из могаджиров».$s$,
    $s$Это слова аятов. Позднего правового определения хиджры здесь нет. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.4.100', 'quran.59.8'], 'Хафс и Саблуков',
    $s$«وَمَن يُهَاجِرْ فِى سَبِيلِ ٱللَّهِ» (4:100). У Саблукова: «Кто оставит свою родину для пути Божия». «ٱلْمُهَـٰجِرِينَ» (59:8). У Саблукова: «бедным из могаджиров».$s$);

  PERFORM pg_temp.add_basic('quran', 'قرآن', 'коран', 'Коран',
    $s$В 2:185: «أُنزِلَ فِيهِ ٱلْقُرْءَانُ». У Саблукова: «в который ниспослан вам Коран».$s$,
    $s$Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.185'], 'Хафс и Саблуков',
    $s$«شَهْرُ رَمَضَانَ ٱلَّذِىٓ أُنزِلَ فِيهِ ٱلْقُرْءَانُ» (2:185). У Саблукова: «Месяц Рамазан есть тот месяц, в который ниспослан вам Коран».$s$);

  PERFORM pg_temp.add_basic('masjid', 'مسجد', 'масджид', 'мечеть',
    $s$В 9:18: «مَسَـٰجِدَ ٱللَّهِ». У Саблукова: «мечети Божии».$s$,
    $s$Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.9.18'], 'Хафс и Саблуков',
    $s$«مَسَـٰجِدَ ٱللَّهِ» (9:18). У Саблукова: «мечети Божии».$s$);

  PERFORM pg_temp.add_basic('halal', 'حلال', 'халяль', 'разрешённое',
    $s$В 2:168: «حَلَـٰلًا طَيِّبًا». У Саблукова: «ешьте только разрешенные в пищу».$s$,
    $s$Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.168'], 'Хафс и Саблуков',
    $s$«حَلَـٰلًا طَيِّبًا» (2:168). У Саблукова: «ешьте только разрешенные в пищу».$s$);

  PERFORM pg_temp.add_basic('haram', 'حرام', 'харам', 'запрещённое',
    $s$В 5:3 глагол: «حُرِّمَتْ عَلَيْكُمُ ٱلْمَيْتَةُ». У Саблукова: «запрещается в пищу мертвечина, кровь, мясо свиньи».$s$,
    $s$В аяте стоит глагол «حُرِّمَتْ», не существительное «харам». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.5.3'], 'Хафс и Саблуков',
    $s$«حُرِّمَتْ عَلَيْكُمُ ٱلْمَيْتَةُ» (5:3). У Саблукова: «запрещается в пищу мертвечина, кровь, мясо свиньи».$s$);

  PERFORM pg_temp.add_basic('taqwa', 'تقوى', 'таква', 'богобоязненность',
    $s$В 49:13: «إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ». У Саблукова: «кто из вас богобоязливее».$s$,
    $s$В аяте стоит «أَتْقَىٰكُمْ». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.49.13'], 'Хафс и Саблуков',
    $s$«إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ» (49:13). У Саблукова: «кто из вас богобоязливее».$s$);

  PERFORM pg_temp.add_basic('ummah', 'أمة', 'умма', 'народ',
    $s$В 2:143: «أُمَّةً وَسَطًا». У Саблукова: «Мы поставили вас народом посредствующим».$s$,
    $s$Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.143'], 'Хафс и Саблуков',
    $s$«أُمَّةً وَسَطًا» (2:143). У Саблукова: «Мы поставили вас народом посредствующим».$s$);

  PERFORM pg_temp.add_basic('riba', 'ربا', 'риба', 'лихва',
    $s$В 2:275: «وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟». У Саблукова: «„лихва тоже, что прибыль в торговле“. Но Бог позволил прибыль в торговле, а лихву запретил».$s$,
    $s$Саблуков передаёт «ٱلرِّبَوٰا۟» словом «лихва». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.275'], 'Хафс и Саблуков',
    $s$«وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟» (2:275). У Саблукова: «„лихва тоже, что прибыль в торговле“. Но Бог позволил прибыль в торговле, а лихву запретил».$s$);

  PERFORM pg_temp.add_basic('khamr', 'خمر', 'хамр', 'вино',
    $s$В 5:90: «إِنَّمَا ٱلْخَمْرُ وَٱلْمَيْسِرُ وَٱلْأَنصَابُ وَٱلْأَزْلَـٰمُ رِجْسٌ». У Саблукова: «вино, игра в жеребьи, кумиры, стрелованье гнусны».$s$,
    $s$Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.5.90'], 'Хафс и Саблуков',
    $s$«إِنَّمَا ٱلْخَمْرُ وَٱلْمَيْسِرُ وَٱلْأَنصَابُ وَٱلْأَزْلَـٰمُ رِجْسٌ» (5:90). У Саблукова: «вино, игра в жеребьи, кумиры, стрелованье гнусны».$s$);

  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, 'related'
  FROM terms a
  JOIN terms b ON b.slug = 'iman'
  WHERE a.slug = 'islam'
    AND NOT EXISTS (
      SELECT 1 FROM term_relations r WHERE r.term_id = a.id AND r.related_id = b.id
    );
  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, 'related'
  FROM terms a
  JOIN terms b ON b.slug = 'islam'
  WHERE a.slug = 'iman'
    AND NOT EXISTS (
      SELECT 1 FROM term_relations r WHERE r.term_id = a.id AND r.related_id = b.id
    );
END $$;
