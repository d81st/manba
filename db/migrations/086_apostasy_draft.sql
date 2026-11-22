-- 086: a draft of the hard topic «Вероотступничество (ридда)» (docs/PLAN.md,
-- 22.11.2026), the next theme of the critic's posts in the author's archive.
-- Same method as 054–085: every position a quotation with its address,
-- checked against the library; the critic without his tone; the early views
-- that differ from the schools are shown beside them. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'apostasy')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.6922')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bidayat_mujtahid.4.242.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'hidaya.2.407.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'musannaf.18696')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.30.61.3')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('apostasy', 'hard', 'draft', 'migration:086', 'migration:086')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Вероотступничество (ридда)$p$,
    $p$Что источники говорят о человеке, который оставил ислам, и в чём расходятся школы и ранние учёные?$p$,
    $p$Аяты, к которым обращаются, — 2:217, 4:137 и 16:106. Хадис, на который опираются школы: «من بدل دينه فاقتلوه» (Бухари 6922); у Муслима: «لا يحل دم امرئ مسلم يشهد أن لا إله إلا الله وأني رسول الله إلا بإحدى ثلاث الثيب الزاني والنفس بالنفس والتارك لدينه المفارق للجماعة» (Муслим 1676). Ибн Рушд о согласии и расхождении школ: «فاتفقوا على أنه يقتل الرجل»; «واختلفوا في قتل المرأة، وهل تستتاب قبل أن تقتل؟» (Бидая 4:242).$p$,
    $p$Собрано 22.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. Позиций исследователей и современных богословов в библиотеке нет — их нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.2.217', 0),
    ('main', 'quran.4.137', 1),
    ('main', 'quran.16.106', 2),
    ('circumstances', 'bukhari.6922', 0),
    ('circumstances', 'muslim.1676.1', 1),
    ('circumstances', 'bidayat_mujtahid.4.242.1', 2),
    ('related', 'bukhari.3017', 0),
    ('related', 'bukhari.6878', 1),
    ('related', 'bukhari.1883', 2)
  ) AS v(role, address, pos);

  -- The Sunni schools.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Рушд (маликит) о мнениях школ$p$, 'tradition',
    $p$О женщине: «فقال الجمهور: تقتل المرأة، وقال أبو حنيفة: لا تقتل، وشبهها بالكافرة الأصلية». О призыве к покаянию: «وأما الاستتابة فإن مالكا شرط في قتله ذلك على ما رواه عن عمر، وقال قوم: لا تقبل توبته» (Бидая 4:242).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Это изложение мнений школ у автора книги, а не книги самих школ.$p$, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bidayat_mujtahid.4.242.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аш-Шафии$p$, 'tradition',
    $p$О хадисах: «حديث يحيى بن سعيد ثابت، ولم أر أهل الحديث يثبتون الحديثين بعد حديث زيد لأنه منقطع» (Умм 1:294). Из мнений о призыве к покаянию он выбирает такое: «وقال بعضهم سواء من ولد على الفطرة، ومن لم يولد عليها إذا فأيهما ارتد استتيب، فإن تاب قبل منه، وإن لم يتب قتل (قال الشافعي) : وبهذا أقول» (Умм 1:295).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['umm_shafii.1.294.2', 'umm_shafii.1.295.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Маргинани (ханафиты)$p$, 'tradition',
    $p$«وإذا ارتد المسلم عن الإسلام والعياذ بالله عرض عليه الإسلام فإن كانت له شبهة كشفت عنه»; «ويحبس ثلاثة أيام فإن أسلم وإلا قتل». О женщине: «وأما المرتدة فلا تقتل» — довод: «ولنا أن النبي عليه الصلاة والسلام نهى عن قتل النساء»; «ولكن تحبس حتى تسلم» (Хидая 2:407).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'hidaya.2.407.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ранние мнения в «Мусаннафе» Абд ар-Раззака$p$, 'minority',
    $p$Умар о шести вероотступниках, ушедших к многобожникам, — что он сделал бы, если бы их взяли: «كنت عارضا عليهم الباب الذي خرجوا منه , أن يدخلوا فيه , فإن فعلوا ذلك , قبلت منهم , وإلا استودعتهم السجن» (Мусаннаф 18696). Ибрахим ан-Нахаи: «يستتاب أبدا»; «قال سفيان هذا الذي نأخذ به» (Мусаннаф 18697).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Степень признания предварительная: это ранние мнения, отличные от позиций четырёх школ; оценку цепочек передатчиков нужно добавить.$p$, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['musannaf.18696', 'musannaf.18697']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис о бедуине, просившем расторгнуть присягу$p$, 'tradition',
    $p$«أن أعرابيا بايع رسول الله صلى الله عليه وسلم على الإسلام، فأصابه وعك، فقال: أقلني بيعتي، فأبى، ثم جاءه فقال: أقلني بيعتي، فأبى، فخرج» — и слова пророка: «المدينة كالكير، تنفي خبثها، وينصع طيبها» (Бухари 7209).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Толкования этого хадиса в библиотеке пока не подобраны.$p$, 4
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.7209', 0);

  -- The Shia tradition.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$Имам аль-Бакир: «من رغب عن الاسلام وكفر بما أنزل الله على محمد صلى الله عليه وآله بعد إسلامه فلا توبة له» (аль-Кафи 30.61.1). От Али: «المرتد تعزل عنه امرأته ولا تؤكل ذبيحته ويستتاب ثلاثة أيام فإن تاب وإلا قتل يوم الرابع» (аль-Кафи 30.61.17). О женщине: «والمرأة إذا ارتدت عن الاسلام استتيبت فإن تابت ورجعت وإلا خلدت في السجن وضيق عليها في حبسها» (аль-Кафи 30.61.3).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Как шиитские правоведы согласуют первое и второе сообщения (о том, кто родился мусульманином, и о принявшем ислам), нужно добавить по их книгам.$p$, 5
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['kafi.30.61.1', 'kafi.30.61.17', 'kafi.30.61.3']) WITH ORDINALITY AS u(a, o);

  -- The critics: what they point to, without their tone.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят хадис «من بدل دينه فاقتلوه» (Бухари 6922) с толкованием аль-Кирмани и слова Ибн Таймии о том, что отступника казнят, даже если он не способен сражаться, как свидетельство того, что за выход из ислама классическое право назначает смерть.$p$,
    $p$Изложено по записям из архива автора без их тона; цитата из «Сахиха» аль-Бухари сверена. Комментария аль-Кирмани и «Фатава» Ибн Таймии в библиотеке нет. Степень признания здесь условна: это полемика, а не богословская школа.$p$, 6
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.6922', 0);

  -- Beside the topic about «no compulsion».
  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug = 'no-compulsion'
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug = 'no-compulsion';

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'apostasy', 'status', 'draft', 'positions', 7),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:086');
END $$;
