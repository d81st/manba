-- 078: the remaining first-50 glossary cards, quotations only (docs/PLAN.md, 19.11.2026).
-- Hafs and Sablukov are copied as they stand, including the printed spellings.
-- Where his Russian word is not the later technical term, the card says so.
-- Existing slugs are left alone. Recognition is preliminary.

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
  VALUES (slug_in, arabic_in, translit, true, ord, 'published', 'migration:078', 'migration:078')
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
          'migration:078');
END $f$;

DO $$
BEGIN
  IF (SELECT count(*) FROM library.addresses WHERE address IN (
    'quran.2.269', 'quran.97.1', 'quran.72.1', 'quran.5.44', 'quran.5.46',
    'quran.3.67', 'quran.30.30', 'quran.42.38', 'quran.63.1', 'quran.2.177',
    'quran.9.103', 'quran.9.60', 'quran.2.255', 'quran.48.4', 'quran.21.107',
    'quran.2.42', 'quran.2.168'
  )) < 17 THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.269' AND position('يُؤْتِى ٱلْحِكْمَةَ مَن يَشَآءُ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.269'
      AND position('Он дает мудрость, кому хочет' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.97.1' AND position('لَيْلَةِ ٱلْقَدْرِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.97.1'
      AND position('его[[Коран.]]' IN t.content) > 0
      AND position('в ночь определений' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.72.1' AND position('نَفَرٌ مِّنَ ٱلْجِنِّ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.72.1'
      AND position('сонм гениев слушал' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.5.44' AND position('إِنَّآ أَنزَلْنَا ٱلتَّوْرَىٰةَ فِيهَا هُدًى وَنُورٌ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.5.44'
      AND position('Мы ниспослали Закон: в нём правота и свет' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.5.46' AND position('وَءَاتَيْنَـٰهُ ٱلْإِنجِيلَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.5.46'
      AND position('Мы дали ему Евангелие' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.3.67' AND position('حَنِيفًا مُّسْلِمًا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.3.67'
      AND position('он был блгочестивым, покорным {Богу}' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.30.30' AND position('لِلدِّينِ حَنِيفًا' IN t.content) > 0
      AND position('فِطْرَتَ ٱللَّهِ ٱلَّتِى فَطَرَ ٱلنَّاسَ عَلَيْهَا' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.30.30'
      AND position('С искренностью держи постоянно лице твое' IN t.content) > 0
      AND position('устройству Бога, в каком Он устроил человеков' IN t.content) > 0
      AND position('Нет перемены творению Божию' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.42.38' AND position('وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.42.38'
      AND position('о делах своих входят в совещания между собою' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.63.1' AND position('ٱلْمُنَـٰفِقُونَ' IN t.content) > 0
      AND position('ٱلْمُنَـٰفِقِينَ لَكَـٰذِبُونَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.63.1'
      AND position('Лицемеры, когда приходят в тебе' IN t.content) > 0
      AND position('лицемеры лжецы' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.177' AND position('لَّيْسَ ٱلْبِرَّ أَن تُوَلُّوا۟ وُجُوهَكُمْ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.177'
      AND position('Благочестие не в том, чтобы вам обращать лица свои к Востоку или Западу' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.9.103' AND position('خُذْ مِنْ أَمْوَٰلِهِمْ صَدَقَةً' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.9.103'
      AND position('Из имущества их возьми милостыню' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.9.60' AND position('ٱلصَّدَقَـٰتُ لِلْفُقَرَآءِ وَٱلْمَسَـٰكِينِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.9.60'
      AND position('Милостыни только бедным, нищим' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.255' AND position('مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.255'
      AND position('Его может предстательствовать пред Ним без Его изволения?' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.48.4' AND position('أَنزَلَ ٱلسَّكِينَةَ فِى قُلُوبِ ٱلْمُؤْمِنِينَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.48.4'
      AND position('в сердца верующих покой' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.21.107' AND position('رَحْمَةً لِّلْعَـٰلَمِينَ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.21.107'
      AND position('не иначе, как милость мирам' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.42' AND position('وَلَا تَلْبِسُوا۟ ٱلْحَقَّ بِٱلْبَـٰطِلِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.42'
      AND position('Не облекайте истины одеждою лжи' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.168' AND position('خُطُوَٰتِ ٱلشَّيْطَـٰنِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t WHERE t.version_id = 'quran.ru.sablukov1894' AND t.address = 'quran.2.168'
      AND position('Не ходите по стопам сатаны: он вам отъявленный враг' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'glossary phrases are not in the library text';
  END IF;

  PERFORM pg_temp.add_basic('hikmah', 'حكمة', 'хикма', 'мудрость',
    $s$В 2:269: «يُؤْتِى ٱلْحِكْمَةَ مَن يَشَآءُ». У Саблукова: «Он дает мудрость, кому хочет».$s$,
    $s$Саблуков передаёт «ٱلْحِكْمَةَ» словом «мудрость». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.269'], 'Хафс и Саблуков',
    $s$«يُؤْتِى ٱلْحِكْمَةَ مَن يَشَآءُ» (2:269). У Саблукова: «Он дает мудрость, кому хочет».$s$);

  PERFORM pg_temp.add_basic('qadr', 'قدر', 'кадр', 'определения',
    $s$В 97:1: «لَيْلَةِ ٱلْقَدْرِ». У Саблукова: «в ночь определений». Перед этим пометка переводчика: «его[[Коран.]]».$s$,
    $s$Это слова 97:1. «[[Коран.]]» — пометка переводчика. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.97.1'], 'Хафс и Саблуков',
    $s$«لَيْلَةِ ٱلْقَدْرِ» (97:1). У Саблукова: «в ночь определений». Пометка переводчика: «его[[Коран.]]».$s$);

  PERFORM pg_temp.add_basic('jinn', 'جن', 'джинн', 'гении',
    $s$В 72:1: «نَفَرٌ مِّنَ ٱلْجِنِّ». У Саблукова: «сонм гениев слушал».$s$,
    $s$Саблуков передаёт «ٱلْجِنِّ» словом «гениев». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.72.1'], 'Хафс и Саблуков',
    $s$«نَفَرٌ مِّنَ ٱلْجِنِّ» (72:1). У Саблукова: «сонм гениев слушал».$s$);

  PERFORM pg_temp.add_basic('tawrah', 'توراة', 'таурат', 'Закон',
    $s$В 5:44: «إِنَّآ أَنزَلْنَا ٱلتَّوْرَىٰةَ فِيهَا هُدًى وَنُورٌ». У Саблукова: «Мы ниспослали Закон: в нём правота и свет».$s$,
    $s$Саблуков передаёт «ٱلتَّوْرَىٰةَ» словом «Закон». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.5.44', 'quran.5.46'], 'Хафс и Саблуков',
    $s$«إِنَّآ أَنزَلْنَا ٱلتَّوْرَىٰةَ فِيهَا هُدًى وَنُورٌ» (5:44). У Саблукова: «Мы ниспослали Закон: в нём правота и свет».$s$);

  PERFORM pg_temp.add_basic('injil', 'إنجيل', 'инджиль', 'Евангелие',
    $s$В 5:46: «وَءَاتَيْنَـٰهُ ٱلْإِنجِيلَ». У Саблукова: «Мы дали ему Евангелие».$s$,
    $s$В том же аяте «ٱلتَّوْرَىٰةِ», у Саблукова «в Законе». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.5.46'], 'Хафс и Саблуков',
    $s$«وَءَاتَيْنَـٰهُ ٱلْإِنجِيلَ» (5:46). У Саблукова: «Мы дали ему Евангелие».$s$);

  PERFORM pg_temp.add_basic('hanif', 'حنيف', 'ханиф', 'искренность',
    $s$В 30:30: «لِلدِّينِ حَنِيفًا». У Саблукова: «С искренностью держи постоянно лице твое». В 3:67: «حَنِيفًا مُّسْلِمًا», у Саблукова напечатано: «он был блгочестивым, покорным {Богу}».$s$,
    $s$Два слова переводчика для «حَنِيفًا» стоят рядом. Написание «блгочестивым» перенесено как в книге. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.30.30', 'quran.3.67'], 'Хафс и Саблуков',
    $s$«لِلدِّينِ حَنِيفًا» (30:30). У Саблукова: «С искренностью держи постоянно лице твое». «حَنِيفًا مُّسْلِمًا» (3:67). У Саблукова: «он был блгочестивым, покорным {Богу}».$s$);

  PERFORM pg_temp.add_basic('shura', 'شورى', 'шура', 'совещание',
    $s$В 42:38: «وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ». У Саблукова: «о делах своих входят в совещания между собою».$s$,
    $s$В аяте стоит «شُورَىٰ». Саблуков пишет «совещания». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.42.38'], 'Хафс и Саблуков',
    $s$«وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ» (42:38). У Саблукова: «о делах своих входят в совещания между собою».$s$);

  PERFORM pg_temp.add_basic('nifaq', 'نفاق', 'нифак', 'лицемеры',
    $s$В 63:1: «ٱلْمُنَـٰفِقُونَ» и «ٱلْمُنَـٰفِقِينَ لَكَـٰذِبُونَ». У Саблукова: «Лицемеры, когда приходят в тебе» и «лицемеры лжецы».$s$,
    $s$Строка «приходят в тебе» перенесена как в книге. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.63.1'], 'Хафс и Саблуков',
    $s$«ٱلْمُنَـٰفِقُونَ» и «ٱلْمُنَـٰفِقِينَ لَكَـٰذِبُونَ» (63:1). У Саблукова: «Лицемеры, когда приходят в тебе» и «лицемеры лжецы».$s$);

  PERFORM pg_temp.add_basic('fitra', 'فطرة', 'фитра', 'устройство',
    $s$В 30:30: «فِطْرَتَ ٱللَّهِ ٱلَّتِى فَطَرَ ٱلنَّاسَ عَلَيْهَا». У Саблукова: «устройству Бога, в каком Он устроил человеков» и «Нет перемены творению Божию».$s$,
    $s$Саблуков передаёт эти слова как «устройство» и «творению». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.30.30'], 'Хафс и Саблуков',
    $s$«فِطْرَتَ ٱللَّهِ ٱلَّتِى فَطَرَ ٱلنَّاسَ عَلَيْهَا» (30:30). У Саблукова: «устройству Бога, в каком Он устроил человеков» и «Нет перемены творению Божию».$s$);

  PERFORM pg_temp.add_basic('birr', 'بر', 'бирр', 'благочестие',
    $s$В 2:177: «لَّيْسَ ٱلْبِرَّ أَن تُوَلُّوا۟ وُجُوهَكُمْ». У Саблукова: «Благочестие не в том, чтобы вам обращать лица свои к Востоку или Западу».$s$,
    $s$Саблуков передаёт «ٱلْبِرَّ» словом «благочестие». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.177'], 'Хафс и Саблуков',
    $s$«لَّيْسَ ٱلْبِرَّ أَن تُوَلُّوا۟ وُجُوهَكُمْ» (2:177). У Саблукова: «Благочестие не в том, чтобы вам обращать лица свои к Востоку или Западу».$s$);

  PERFORM pg_temp.add_basic('sadaqa', 'صدقة', 'садака', 'милостыня',
    $s$В 9:103: «خُذْ مِنْ أَمْوَٰلِهِمْ صَدَقَةً». У Саблукова: «Из имущества их возьми милостыню». В 9:60: «ٱلصَّدَقَـٰتُ لِلْفُقَرَآءِ وَٱلْمَسَـٰكِينِ», у Саблукова: «Милостыни только бедным, нищим».$s$,
    $s$Это слово «صَدَقَةً». Саблуков пишет «милостыню» и «милостыни». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.9.103', 'quran.9.60'], 'Хафс и Саблуков',
    $s$«خُذْ مِنْ أَمْوَٰلِهِمْ صَدَقَةً» (9:103). У Саблукова: «Из имущества их возьми милостыню». «ٱلصَّدَقَـٰتُ لِلْفُقَرَآءِ وَٱلْمَسَـٰكِينِ» (9:60). У Саблукова: «Милостыни только бедным, нищим».$s$);

  PERFORM pg_temp.add_basic('shafaa', 'شفاعة', 'шафаа', 'предстательство',
    $s$В 2:255: «مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ». У Саблукова: «Его может предстательствовать пред Ним без Его изволения?».$s$,
    $s$Строка «Его может предстательствовать» перенесена как в книге. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.255'], 'Хафс и Саблуков',
    $s$«مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ» (2:255). У Саблукова: «Его может предстательствовать пред Ним без Его изволения?».$s$);

  PERFORM pg_temp.add_basic('sakina', 'سكينة', 'сакина', 'покой',
    $s$В 48:4: «أَنزَلَ ٱلسَّكِينَةَ فِى قُلُوبِ ٱلْمُؤْمِنِينَ». У Саблукова: «в сердца верующих покой».$s$,
    $s$Саблуков передаёт «ٱلسَّكِينَةَ» словом «покой». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.48.4'], 'Хафс и Саблуков',
    $s$«أَنزَلَ ٱلسَّكِينَةَ فِى قُلُوبِ ٱلْمُؤْمِنِينَ» (48:4). У Саблукова: «в сердца верующих покой».$s$);

  PERFORM pg_temp.add_basic('rahma', 'رحمة', 'рахма', 'милость',
    $s$В 21:107: «رَحْمَةً لِّلْعَـٰلَمِينَ». У Саблукова: «не иначе, как милость мирам».$s$,
    $s$Саблуков передаёт «رَحْمَةً» словом «милость». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.21.107'], 'Хафс и Саблуков',
    $s$«رَحْمَةً لِّلْعَـٰلَمِينَ» (21:107). У Саблукова: «не иначе, как милость мирам».$s$);

  PERFORM pg_temp.add_basic('haqq', 'حق', 'хакк', 'истина',
    $s$В 2:42: «وَلَا تَلْبِسُوا۟ ٱلْحَقَّ بِٱلْبَـٰطِلِ». У Саблукова: «Не облекайте истины одеждою лжи».$s$,
    $s$Рядом в том же аяте «ٱلْبَـٰطِلِ», у Саблукова «лжи». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.42'], 'Хафс и Саблуков',
    $s$«وَلَا تَلْبِسُوا۟ ٱلْحَقَّ بِٱلْبَـٰطِلِ» (2:42). У Саблукова: «Не облекайте истины одеждою лжи».$s$);

  PERFORM pg_temp.add_basic('shaytan', 'شيطان', 'шайтан', 'сатана',
    $s$В 2:168: «خُطُوَٰتِ ٱلشَّيْطَـٰنِ». У Саблукова: «Не ходите по стопам сатаны: он вам отъявленный враг».$s$,
    $s$Саблуков передаёт «ٱلشَّيْطَـٰنِ» словом «сатаны». Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.168'], 'Хафс и Саблуков',
    $s$«خُطُوَٰتِ ٱلشَّيْطَـٰنِ» (2:168). У Саблукова: «Не ходите по стопам сатаны: он вам отъявленный враг».$s$);

  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, 'related'
  FROM terms a
  JOIN terms b ON b.slug IN ('injil', 'islam', 'halal', 'zakat')
  WHERE (a.slug, b.slug) IN (
    ('tawrah', 'injil'), ('injil', 'tawrah'),
    ('hanif', 'islam'), ('islam', 'hanif'),
    ('shaytan', 'halal'), ('halal', 'shaytan'),
    ('sadaqa', 'zakat'), ('zakat', 'sadaqa')
  )
  AND NOT EXISTS (
    SELECT 1 FROM term_relations r WHERE r.term_id = a.id AND r.related_id = b.id
  );
END $$;
