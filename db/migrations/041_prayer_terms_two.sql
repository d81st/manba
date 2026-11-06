-- 041: four more glossary cards for the prayer: wudu, tayammum, adhan, qasr.
-- Same rules as 029: every sentence is a quotation of a fragment already in
-- the library (Hafs, Sablukov's translation, al-Bukhari, Muslim, Abu Dawud,
-- al-Kafi) or says where a word stands. Where the collections tell a thing
-- differently (how the feet are treated in wudu, how the adhan began), the
-- reports stand next to each other and are not reconciled.
-- Recognition is "tradition" because each quotation is what that source says;
-- the detail says a specialist still has to check the label.
-- Existing slugs are left alone. On an empty database (CI, a fresh install)
-- the library is imported after the migrations, so the cards are skipped.

CREATE FUNCTION pg_temp.add_definition(
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

CREATE FUNCTION pg_temp.add_term(
  slug_in text, arabic_in text, translit text, translation text, short_in text, detail_in text, refs text[]
) RETURNS bigint LANGUAGE plpgsql AS $f$
DECLARE
  tid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM terms WHERE slug = slug_in) THEN
    RETURN NULL;
  END IF;
  INSERT INTO terms (slug, arabic, transliteration, is_basic, status, created_by, updated_by)
  VALUES (slug_in, arabic_in, translit, false, 'published', 'migration:041', 'migration:041')
  RETURNING id INTO tid;
  INSERT INTO term_texts (term_id, locale, translation, short, detail)
  VALUES (tid, 'ru', translation, short_in, detail_in);
  INSERT INTO term_refs (term_id, address, position)
  SELECT tid, a::extensions.ltree, i FROM unnest(refs) WITH ORDINALITY AS u(a, i);
  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('term', tid::text, 'created', jsonb_build_object('slug', slug_in, 'status', 'published'),
          'Карточка собрана только из цитат загруженных мест. Расходящиеся рассказы стоят рядом. Степень признания предварительная.',
          'migration:041');
  RETURN tid;
END $f$;

DO $$
DECLARE
  tid bigint;
BEGIN
  IF (SELECT count(*) FROM addresses
      WHERE address IN ('quran.5.6', 'bukhari.159', 'kafi.9.17.2', 'abu_dawud.499', 'muslim.686.1')) < 5 THEN
    RETURN;
  END IF;

  tid := pg_temp.add_term('wudu', 'وضوء', 'вуду', 'омовение перед молитвой',
    $s$Слова وضوء в загруженном тексте Корана нет. Омовение перед молитвой описано в 5:6, у Саблукова: «умывайте свои лица и свои руки до локтей, и отирайте ваши головы и ваши ноги до щиколоток». В хадисах слово есть: «لا تقبل صلاة من أحدث حتى يتوضأ» (Бухари 135).$s$,
    $s$О ногах рассказы расходятся: у аль-Бухари Усман «غسل رجليه» (Бухари 159), в «аль-Кафи» Абу Джафар «مسح … رجليه» (аль-Кафи 9.17.2). Оба рассказа приведены ниже рядом, без вывода. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.5.6', 'bukhari.135', 'bukhari.159', 'kafi.9.17.1', 'kafi.9.17.2']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 5:6',
      $s$«فَٱغْسِلُوا۟ وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى ٱلْمَرَافِقِ وَٱمْسَحُوا۟ بِرُءُوسِكُمْ وَأَرْجُلَكُمْ إِلَى ٱلْكَعْبَيْنِ». У Саблукова: «умывайте свои лица и свои руки до локтей, и отирайте ваши головы и ваши ноги до щиколоток».$s$,
      ARRAY['quran.5.6']);
    PERFORM pg_temp.add_definition(tid, 1, 'Усман у аль-Бухари',
      $s$«ثم غسل وجهه ثلاثا، ويديه إلى المرفقين ثلاث مرار، ثم مسح برأسه، ثم غسل رجليه ثلاث مرار إلى الكعبين» (Бухари 159).$s$,
      ARRAY['bukhari.159']);
    PERFORM pg_temp.add_definition(tid, 2, 'Абу Джафар в «аль-Кафи»',
      $s$«فأخذ بكفه اليمنى كفا من ماء فغسل به وجهه ثم أخذ بيده اليسرى كفا من ماء فغسل به يده اليمنى، ثم أخذ بيده اليمنى كفا من ماء فغسل به يده اليسرى، ثم مسح بفضل يديه رأسه ورجليه» (аль-Кафи 9.17.2).$s$,
      ARRAY['kafi.9.17.2']);
  END IF;

  tid := pg_temp.add_term('tayammum', 'تيمم', 'таяммум', 'очищение пылью, когда нет воды',
    $s$В 4:43 и 5:6: «فَتَيَمَّمُوا۟ صَعِيدًا طَيِّبًا». У Саблукова — «очищайте себя доброю пылью» (4:43) и «хорошею пылью» (5:6), если не найдёте воды. Аиша у аль-Бухари называет это место «آية التيمم» (Бухари 334).$s$,
    $s$Как проводят руками, хадисы описывают так: у аль-Бухари Аммар передаёт, что пророк ударил ладонями о землю и «مسح بهما وجهه وكفيه» (Бухари 338); в «аль-Кафи» Абу Джафар «مسح بها جبينيه وكفيه مرة واحدة» (аль-Кафи 9.40.1). Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.4.43', 'quran.5.6', 'bukhari.334', 'bukhari.335', 'bukhari.338', 'kafi.9.40.1']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 4:43 и 5:6',
      $s$«فَلَمْ تَجِدُوا۟ مَآءً فَتَيَمَّمُوا۟ صَعِيدًا طَيِّبًا فَٱمْسَحُوا۟ بِوُجُوهِكُمْ وَأَيْدِيكُمْ» (4:43). У Саблукова: «и не найдете воды, то очищайте себя доброю пылью: ею обтирайте лица свои и руки свои».$s$,
      ARRAY['quran.4.43', 'quran.5.6']);
    PERFORM pg_temp.add_definition(tid, 1, 'Аиша у аль-Бухари',
      $s$«فأنزل الله آية التيمم فتيمموا» (Бухари 334).$s$,
      ARRAY['bukhari.334']);
    PERFORM pg_temp.add_definition(tid, 2, 'Аммар у аль-Бухари',
      $s$«فضرب النبي صلى الله عليه وسلم بكفيه الأرض، ونفخ فيهما، ثم مسح بهما وجهه وكفيه» (Бухари 338).$s$,
      ARRAY['bukhari.338']);
    PERFORM pg_temp.add_definition(tid, 3, 'Абу Джафар в «аль-Кафи»',
      $s$«فضرب بيده الأرض ثم رفعها فنفضها ثم مسح بها جبينيه وكفيه مرة واحدة» (аль-Кафи 9.40.1).$s$,
      ARRAY['kafi.9.40.1']);
  END IF;

  tid := pg_temp.add_term('adhan', 'أذان', 'азан', 'призыв к молитве',
    $s$Призыв к молитве Коран называет глаголом نادى: «وَإِذَا نَادَيْتُمْ إِلَى ٱلصَّلَوٰةِ» (5:58), «إِذَا نُودِىَ لِلصَّلَوٰةِ مِن يَوْمِ ٱلْجُمُعَةِ» (62:9). Слово «وَأَذَٰنٌ» стоит в 9:3 в другом значении, у Саблукова — «возглашение людям в день великого праздника».$s$,
    $s$Как появился азан, источники рассказывают по-разному: у аль-Бухари — разговор в Медине и веление Билялу (Бухари 604), у Абу Дауда — сон Абдуллаха ибн Зейда (Абу Дауд 499), в «аль-Кафи» — Джибриль произносит азан в ночь вознесения (аль-Кафи 12.18.1). Рассказы приведены рядом, без вывода. Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.5.58', 'quran.62.9', 'quran.9.3', 'bukhari.604', 'abu_dawud.499', 'kafi.12.18.1']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Ибн Умар у аль-Бухари',
      $s$«كان المسلمون حين قدموا المدينة يجتمعون فيتحينون الصلاة ليس ينادى لها» … «يا بلال قم فناد بالصلاة» (Бухари 604).$s$,
      ARRAY['bukhari.604']);
    PERFORM pg_temp.add_definition(tid, 1, 'Абдуллах ибн Зейд у Абу Дауда',
      $s$«طاف بي وأنا نائم رجل يحمل ناقوسا في يده» … «فقال تقول الله أكبر الله أكبر» (Абу Дауд 499).$s$,
      ARRAY['abu_dawud.499']);
    PERFORM pg_temp.add_definition(tid, 2, 'Абу Джафар в «аль-Кафи»',
      $s$«لما أسري برسول الله (صلى الله عليه وآله) إلى السماء فبلغ البيت المعمور وحضرت الصلاة فأذن جبرئيل وأقام» (аль-Кафи 12.18.1).$s$,
      ARRAY['kafi.12.18.1']);
  END IF;

  tid := pg_temp.add_term('qasr', 'قصر الصلاة', 'каср', 'сокращение молитвы в пути',
    $s$В 4:101: «فَلَيْسَ عَلَيْكُمْ جُنَاحٌ أَن تَقْصُرُوا۟ مِنَ ٱلصَّلَوٰةِ». У Саблукова: «Когда вы находитесь в походах, тогда на вас не будет вины сокращать молитву, как скоро боитесь нападений на вас от неверных». Аиша у аль-Бухари говорит, что молитва была предписана по две ракаата и «فأقرت صلاة السفر» (Бухари 350).$s$,
    $s$Яля ибн Умайя приводит Умару этот аят со словами «فقد أمن الناس», и Умар передаёт ответ пророка (Муслим 686a). В «аль-Кафи» на вопрос, когда начинают сокращать, ответ: «إذا توارى من البيوت» (аль-Кафи 12.78.1). Степень признания предварительная, её проверяет специалист.$s$,
    ARRAY['quran.4.101', 'muslim.686.1', 'bukhari.350', 'kafi.12.78.1']);
  IF tid IS NOT NULL THEN
    PERFORM pg_temp.add_definition(tid, 0, 'Коран, 4:101',
      $s$«وَإِذَا ضَرَبْتُمْ فِى ٱلْأَرْضِ فَلَيْسَ عَلَيْكُمْ جُنَاحٌ أَن تَقْصُرُوا۟ مِنَ ٱلصَّلَوٰةِ». У Саблукова: «Когда вы находитесь в походах, тогда на вас не будет вины сокращать молитву».$s$,
      ARRAY['quran.4.101']);
    PERFORM pg_temp.add_definition(tid, 1, 'Умар у Муслима',
      $s$«صدقة تصدق الله بها عليكم فاقبلوا صدقته» (Муслим 686a).$s$,
      ARRAY['muslim.686.1']);
    PERFORM pg_temp.add_definition(tid, 2, 'Аиша у аль-Бухари',
      $s$«فرض الله الصلاة حين فرضها، ركعتين ركعتين، في الحضر والسفر، فأقرت صلاة السفر، وزيد في صلاة الحضر» (Бухари 350).$s$,
      ARRAY['bukhari.350']);
    PERFORM pg_temp.add_definition(tid, 3, 'Абу Абдуллах в «аль-Кафи»',
      $s$«الرجل يريد السفر متى يقصر؟ قال: إذا توارى من البيوت» (аль-Кафи 12.78.1).$s$,
      ARRAY['kafi.12.78.1']);
  END IF;

  INSERT INTO term_relations (term_id, related_id, kind)
  SELECT a.id, b.id, v.kind
  FROM (VALUES
    ('wudu', 'tayammum', 'related'),
    ('tayammum', 'wudu', 'related'),
    ('salat', 'wudu', 'related'),
    ('wudu', 'salat', 'related'),
    ('salat', 'adhan', 'related'),
    ('adhan', 'salat', 'related'),
    ('salat', 'qasr', 'related'),
    ('qasr', 'salat', 'related'),
    ('qasr', 'rakat', 'related'),
    ('rakat', 'qasr', 'related')
  ) AS v(a, b, kind)
  JOIN terms a ON a.slug = v.a
  JOIN terms b ON b.slug = v.b
  ON CONFLICT DO NOTHING;

  INSERT INTO topic_terms (topic_id, term_id)
  SELECT t.id, m.id
  FROM topics t
  JOIN terms m ON m.slug IN ('wudu', 'tayammum', 'adhan', 'qasr')
  WHERE t.slug = 'namaz'
  ON CONFLICT DO NOTHING;
END $$;
