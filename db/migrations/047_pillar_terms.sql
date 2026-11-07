-- 047: glossary cards for the other pillars: zakat, sawm, hajj, umra, tawaf,
-- ihram, ashura, wilaya. Same rules as 029 and 041: quotations only (Hafs,
-- Sablukov, al-Bukhari, Muslim, al-Kafi), differing reports side by side,
-- recognition preliminary. Existing slugs are left alone; on an empty
-- database the cards are skipped.

CREATE OR REPLACE FUNCTION pg_temp.add_definition(
  tid bigint, pos integer, who text, body text, refs text[]
) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  did bigint;
BEGIN
  INSERT INTO term_definitions (term_id, locale, holder, recognition, text, position)
  VALUES (tid, 'ru', who, 'tradition', body, pos)
  RETURNING id INTO did;
  INSERT INTO term_refs (term_id, definition_id, address, position)
  SELECT tid, did, a::extensions.ltree, i FROM unnest(refs) WITH ORDINALITY AS u(a, i);
END $f$;

CREATE OR REPLACE FUNCTION pg_temp.add_term(
  slug_in text, arabic_in text, translit text, translation text, short_in text, detail_in text, refs text[]
) RETURNS bigint LANGUAGE plpgsql AS $f$
DECLARE
  tid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM terms WHERE slug = slug_in) THEN
    RETURN NULL;
  END IF;
  INSERT INTO terms (slug, arabic, transliteration, is_basic, status, created_by, updated_by)
  VALUES (slug_in, arabic_in, translit, false, 'published', 'migration:047', 'migration:047')
  RETURNING id INTO tid;
  INSERT INTO term_texts (term_id, locale, translation, short, detail)
  VALUES (tid, 'ru', translation, short_in, detail_in);
  INSERT INTO term_refs (term_id, address, position)
  SELECT tid, a::extensions.ltree, i FROM unnest(refs) WITH ORDINALITY AS u(a, i);
  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('term', tid::text, 'created', jsonb_build_object('slug', slug_in, 'status', 'published'),
          'Карточка собрана только из цитат загруженных мест. Расходящиеся рассказы стоят рядом. Степень признания предварительная.',
          'migration:047');
  RETURN tid;
END $f$;

DO $$
DECLARE
  tid bigint;
BEGIN
  IF (SELECT count(*) FROM addresses WHERE address IN ('quran.3.97', 'bukhari.1592', 'kafi.5.13.1', 'kafi.15.27.4')) < 4 THEN
    RETURN;
  END IF;

  tid := pg_temp.add_term('zakat', 'زكاة', 'закят', 'обязательная милостыня',
    $s$В Коране слово стоит рядом с молитвой: «وَءَاتُوا۟ ٱلزَّكَوٰةَ» (2:43), у Саблукова — «давайте очистительную милостыню». Кому она идёт, перечислено в 9:60: «إِنَّمَا ٱلصَّدَقَـٰتُ لِلْفُقَرَآءِ وَٱلْمَسَـٰكِينِ».$s$,
    $s$О размерах — письмо Абу Бакра (Бухари 1454). В «аль-Кафи» закят назначен на девять видов имущества (аль-Кафи 13.4.2). Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.43', 'quran.9.60', 'bukhari.1395', 'bukhari.1454', 'kafi.13.4.2']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 9:60',
      $s$«إِنَّمَا ٱلصَّدَقَـٰتُ لِلْفُقَرَآءِ وَٱلْمَسَـٰكِينِ وَٱلْعَـٰمِلِينَ عَلَيْهَا وَٱلْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِى ٱلرِّقَابِ وَٱلْغَـٰرِمِينَ وَفِى سَبِيلِ ٱللَّهِ وَٱبْنِ ٱلسَّبِيلِ». У Саблукова: «Милостыни только бедным, нищим, смотрителям милостынь, сердечно верным союзникам; на откуп рабов, для вошедших в долги, на походы на пути Божию: и на путешественников».$s$,
      ARRAY['quran.9.60']);
    PERFORM pg_temp.add_definition(tid, 1, 'Муаз ибн Джабаль у аль-Бухари',
      $s$«فأعلمهم أن الله افترض عليهم صدقة في أموالهم تؤخذ من أغنيائهم وترد على فقرائهم» (Бухари 1395).$s$,
      ARRAY['bukhari.1395']);
    PERFORM pg_temp.add_definition(tid, 2, '«аль-Кафи»',
      $s$«وضع رسول الله (صلى الله عليه وآله) الزكاة على تسعة أشياء» (аль-Кафи 13.4.2).$s$,
      ARRAY['kafi.13.4.2']);
  END IF;

  tid := pg_temp.add_term('sawm', 'صوم', 'саум', 'пост',
    $s$«كُتِبَ عَلَيْكُمُ ٱلصِّيَامُ كَمَا كُتِبَ عَلَى ٱلَّذِينَ مِن قَبْلِكُمْ» (2:183); у Саблукова — «вам предписан пост, как он предписан был тем».$s$,
    $s$До Рамадана постились в день Ашуры: «كانوا يصومون عاشوراء قبل أن يفرض رمضان» (Бухари 1592). Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.183', 'quran.2.185', 'bukhari.1592']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 2:183',
      $s$«كُتِبَ عَلَيْكُمُ ٱلصِّيَامُ كَمَا كُتِبَ عَلَى ٱلَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ». У Саблукова: «вам предписан пост, как он предписан был тем».$s$,
      ARRAY['quran.2.183']);
    PERFORM pg_temp.add_definition(tid, 1, 'Аиша у аль-Бухари',
      $s$«كانوا يصومون عاشوراء قبل أن يفرض رمضان» (Бухари 1592).$s$,
      ARRAY['bukhari.1592']);
  END IF;

  tid := pg_temp.add_term('hajj', 'حج', 'хадж', 'паломничество к Каабе',
    $s$«وَلِلَّهِ عَلَى ٱلنَّاسِ حِجُّ ٱلْبَيْتِ مَنِ ٱسْتَطَاعَ إِلَيْهِ سَبِيلًا» (3:97); у Саблукова — «Совершить при этом доме праздник для Бога обязанность на людях, — на том, кто в состоянии совершить путешествие к нему». Хадж Саблуков передаёт словами «торжественный праздник».$s$,
    $s$До ислама курайшиты стояли в Муздалифе, остальные арабы — на Арафе (Бухари 4520). В «аль-Кафи»: «إن رسول الله (صلى الله عليه وآله) أقام بالمدينة عشر سنين لم يحج» (аль-Кафи 15.27.4). Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.3.97', 'quran.2.196', 'bukhari.4520', 'kafi.15.27.4']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 3:97',
      $s$«وَلِلَّهِ عَلَى ٱلنَّاسِ حِجُّ ٱلْبَيْتِ مَنِ ٱسْتَطَاعَ إِلَيْهِ سَبِيلًا». У Саблукова: «Совершить при этом доме праздник для Бога обязанность на людях, — на том, кто в состоянии совершить путешествие к нему».$s$,
      ARRAY['quran.3.97']);
    PERFORM pg_temp.add_definition(tid, 1, 'аль-Бухари',
      $s$«قريش ومن دان دينها يقفون بالمزدلفة، وكانوا يسمون الحمس، وكان سائر العرب يقفون بعرفات» (Бухари 4520).$s$,
      ARRAY['bukhari.4520']);
    PERFORM pg_temp.add_definition(tid, 2, '«аль-Кафи»',
      $s$«إن رسول الله (صلى الله عليه وآله) أقام بالمدينة عشر سنين لم يحج» (аль-Кафи 15.27.4).$s$,
      ARRAY['kafi.15.27.4']);
  END IF;

  tid := pg_temp.add_term('umra', 'عمرة', 'умра', 'малое паломничество',
    $s$«وَأَتِمُّوا۟ ٱلْحَجَّ وَٱلْعُمْرَةَ لِلَّهِ» (2:196); у Саблукова — «Совершайте торжественный праздник и праздничное молебствие во славу Бога».$s$,
    $s$О хадже вместе с умрой спорили: Усман «ينهى عن المتعة، وأن يجمع بينهما» (Бухари 1563); Имран ибн Хусайн: «أنزلت آية المتعة في كتاب الله» (Бухари 4518). Рассказы стоят рядом, без вывода. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.2.196', 'quran.2.158', 'bukhari.1563', 'bukhari.4518']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 2:196',
      $s$«وَأَتِمُّوا۟ ٱلْحَجَّ وَٱلْعُمْرَةَ لِلَّهِ». У Саблукова: «Совершайте торжественный праздник и праздничное молебствие во славу Бога».$s$,
      ARRAY['quran.2.196']);
    PERFORM pg_temp.add_definition(tid, 1, 'Усман у аль-Бухари',
      $s$«ينهى عن المتعة، وأن يجمع بينهما» (Бухари 1563).$s$,
      ARRAY['bukhari.1563']);
    PERFORM pg_temp.add_definition(tid, 2, 'Имран ибн Хусайн у аль-Бухари',
      $s$«أنزلت آية المتعة في كتاب الله، ففعلناها مع رسول الله صلى الله عليه» (Бухари 4518).$s$,
      ARRAY['bukhari.4518']);
  END IF;

  tid := pg_temp.add_term('tawaf', 'طواف', 'таваф', 'обход вокруг Каабы',
    $s$«وَلْيَطَّوَّفُوا۟ بِٱلْبَيْتِ ٱلْعَتِيقِ» (22:29); у Саблукова — «совершили обходы вокруг сего древнего дома». В 2:158 — обход ас-Сафы и аль-Марвы: «أَن يَطَّوَّفَ بِهِمَا».$s$,
    $s$До ислама: «كان الناس يطوفون في الجاهلية عراة إلا الحمس» (Бухари 1665); объявление в Мине: «لا يحج بعد العام مشرك، ولا يطوف بالبيت عريان» (Бухари 1622). Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.22.29', 'quran.2.158', 'bukhari.1665', 'bukhari.1622']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 22:29',
      $s$«وَلْيَطَّوَّفُوا۟ بِٱلْبَيْتِ ٱلْعَتِيقِ». У Саблукова: «совершили обходы вокруг сего древнего дома».$s$,
      ARRAY['quran.22.29']);
    PERFORM pg_temp.add_definition(tid, 1, 'Урва у аль-Бухари',
      $s$«كان الناس يطوفون في الجاهلية عراة إلا الحمس» (Бухари 1665).$s$,
      ARRAY['bukhari.1665']);
    PERFORM pg_temp.add_definition(tid, 2, 'аль-Бухари',
      $s$«لا يحج بعد العام مشرك، ولا يطوف بالبيت عريان» (Бухари 1622).$s$,
      ARRAY['bukhari.1622']);
  END IF;

  tid := pg_temp.add_term('ihram', 'إحرام', 'ихрам', 'запретное состояние паломника',
    $s$Слова إحرام в загруженном тексте Корана нет. Состояние паломника названо «وَأَنتُمْ حُرُمٌ» (5:1, 5:95); у Саблукова — «в запретной одежде».$s$,
    $s$Что именно запрещено в этом состоянии, здесь не расписано: в карточке только места, где оно названо. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.5.1', 'quran.5.95']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 5:95',
      $s$«لَا تَقْتُلُوا۟ ٱلصَّيْدَ وَأَنتُمْ حُرُمٌ». У Саблукова: «не убивайте изловленного на охоте, когда вы в запретной одежде».$s$,
      ARRAY['quran.5.95']);
  END IF;

  tid := pg_temp.add_term('ashura', 'عاشوراء', 'ашура', 'десятый день месяца мухаррам',
    $s$Слова عاشوراء в Коране нет. В хадисах это день поста до Рамадана: «كانوا يصومون عاشوراء قبل أن يفرض رمضان» (Бухари 1592).$s$,
    $s$Рассказ об иудеях: «هذا يوم عظيم، وهو يوم نجى الله فيه موسى» (Бухари 3397). В «аль-Кафи»: «لا تصم في يوم عاشورا ولا عرفة» (аль-Кафи 14.61.3). Рассказы стоят рядом, без вывода. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['bukhari.1592', 'bukhari.1892', 'bukhari.2004', 'bukhari.3397', 'kafi.14.61.3']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Аиша и Ибн Умар у аль-Бухари',
      $s$«كانوا يصومون عاشوراء قبل أن يفرض رمضان» (Бухари 1592); «فلما فرض رمضان ترك» (Бухари 1892).$s$,
      ARRAY['bukhari.1592', 'bukhari.1892']);
    PERFORM pg_temp.add_definition(tid, 1, 'аль-Бухари',
      $s$«فرأى اليهود تصوم يوم عاشوراء» (Бухари 2004).$s$,
      ARRAY['bukhari.2004']);
    PERFORM pg_temp.add_definition(tid, 2, '«аль-Кафи»',
      $s$«لا تصم في يوم عاشورا ولا عرفة بمكة ولا في المدينة ولا في وطنك ولا في مصر من الأمصار» (аль-Кафи 14.61.3).$s$,
      ARRAY['kafi.14.61.3']);
  END IF;

  tid := pg_temp.add_term('wilaya', 'ولاية', 'вилая', 'власть, покровительство',
    $s$В Коране: «ٱلْوَلَـٰيَةُ لِلَّهِ ٱلْحَقِّ» (18:44); у Саблукова — «спасение в Боге истинном». В «аль-Кафи» вилая названа пятой из основ ислама: «بني الاسلام على خمس: على الصلاة والزكاة والصوم والحج والولاية» (аль-Кафи 5.13.1).$s$,
    $s$В списках «пяти» у аль-Бухари и Муслима на этом месте свидетельство и единобожие (Бухари 8, Муслим 16a). Списки стоят рядом, без вывода. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.18.44', 'kafi.5.13.1', 'bukhari.8', 'muslim.16.1']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 18:44',
      $s$«هُنَالِكَ ٱلْوَلَـٰيَةُ لِلَّهِ ٱلْحَقِّ». У Саблукова: «Так видишь: спасение в Боге истинном».$s$,
      ARRAY['quran.18.44']);
    PERFORM pg_temp.add_definition(tid, 1, '«аль-Кафи»',
      $s$«بني الاسلام على خمس: على الصلاة والزكاة والصوم والحج والولاية ولم يناد بشئ كما نودي بالولاية» (аль-Кафи 5.13.1).$s$,
      ARRAY['kafi.5.13.1']);
    PERFORM pg_temp.add_definition(tid, 2, 'аль-Бухари',
      $s$«بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدا رسول الله» (Бухари 8).$s$,
      ARRAY['bukhari.8']);
  END IF;

  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, v.kind
  FROM (VALUES
    ('hajj', 'umra', 'related'), ('umra', 'hajj', 'related'),
    ('hajj', 'tawaf', 'narrower'), ('tawaf', 'hajj', 'broader'),
    ('hajj', 'ihram', 'narrower'), ('ihram', 'hajj', 'broader'),
    ('sawm', 'ashura', 'related'), ('ashura', 'sawm', 'related'),
    ('zakat', 'salat', 'related'), ('salat', 'zakat', 'related')
  ) AS v(a, b, kind)
  JOIN terms a ON a.slug = v.a
  JOIN terms b ON b.slug = v.b
  ON CONFLICT DO NOTHING;

  INSERT INTO topic_terms (topic_id, term_id)
  SELECT t.id, m.id
  FROM (VALUES ('zakat', 'zakat'), ('sawm', 'sawm'), ('sawm', 'ashura'), ('hajj', 'hajj'), ('hajj', 'umra'),
               ('hajj', 'tawaf'), ('hajj', 'ihram'), ('shahada', 'wilaya')) AS v(topic, term)
  JOIN topics t ON t.slug = v.topic
  JOIN terms m ON m.slug = v.term
  ON CONFLICT DO NOTHING;
END $$;
