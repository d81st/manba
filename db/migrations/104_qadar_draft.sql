-- 104: a draft topic «Предопределение (кадар) и свобода воли» (docs/PLAN.md,
-- 28.11.2026), the first theme of the item «вероучение» of the author's list
-- (compilations on qadar in the author's archive). The hadiths of al-Bukhari,
-- Muslim and Abu Dawud, Ibn Kathir on 54:47–49 and on the boy in the story
-- of al-Khidr, the chapter on compulsion and free will in al-Kafi, the
-- Qadariyya in their opponents' words; the critic without his tone. Every
-- quotation is checked against the library. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'qadar-and-free-will')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2650.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.3.30.13')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.54.47')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.18.80')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('qadar-and-free-will', 'general', 'draft', 'migration:104', 'migration:104')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Предопределение (кадар) и свобода воли$p$,
    $p$Что говорят Коран, хадисы и книги разных сторон о предопределении (кадар): всё ли записано заранее, есть ли у человека выбор и справедливо ли воздаяние?$p$,
    $p$Аяты, к которым обращаются, — 54:49, 18:29, 76:30 и 91:7–8. Спор о кадаре в Басре начинается, по передаче Муслима, так: «كان أول من قال في القدر بالبصرة معبد الجهني»; о его сторонниках: «وأنهم يزعمون أن لا قدر وأن الأمر أنف» (Муслим 8). Ибн Касир о поводе ниспослания 54:49 приводит хадис: «جاء مشركو قريش إلى النبي صلى الله عليه وسلم يخاصمونه في القدر» (Ибн Касир 54:47). Рассказ о Мусе и Хидре — 18:65–82; об убитом юноше — 18:74 и 18:80.$p$,
    $p$Собрано 28.11.2026 по текстам библиотеки, по наводкам из подборок о предопределении в архиве автора. Подбор цитат и формулировки специалист не проверял. Книг самих мутазилитов и кадаритов, ашаритских и матуридитских трактатов о «приобретении» (касб), трактата Ибн Таймии «аль-Ихтиджадж би-ль-кадар» (есть в OpenITI, не загружен) и исследователей в библиотеке нет — их нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.54.49', 0),
    ('main', 'quran.18.29', 1),
    ('main', 'quran.76.30', 2),
    ('main', 'quran.91.7', 3),
    ('main', 'quran.91.8', 4),
    ('circumstances', 'muslim.8.1', 0),
    ('circumstances', 'tafsir_ibn_kathir.54.47', 1),
    ('circumstances', 'quran.18.74', 2),
    ('circumstances', 'quran.18.80', 3),
    ('related', 'bukhari.6614', 0),
    ('related', 'abu_dawud.4705', 1),
    ('related', 'kafi.3.30.10', 2),
    ('related', 'kafi.3.30.14', 3)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы у аль-Бухари и Муслима$p$, 'tradition',
    $p$Вера в кадар — часть веры: «وتؤمن بالقدر خيره وشره» (Муслим 8). «كتب الله مقادير الخلائق قبل أن يخلق السماوات والأرض بخمسين ألف سنة» (Муслим 2653). Об ангеле при зародыше: «اكتب عمله، ورزقه، وأجله، وشقي أو سعيد» (Бухари 3208). На вопрос сподвижников «أفلا نتكل على كتابنا، وندع العمل؟» ответ: «اعملوا فكل ميسر لما خلق له» (Бухари 4949). Вопрос о справедливости задан в хадисе Имрана ибн Хусайна: «أفلا يكون ظلما»; ответ Абу-ль-Асвада: «كل شيء خلق الله وملك يده فلا يسأل عما يفعل وهم يسألون» (Муслим 2650).$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.8.1', 'muslim.2653.1', 'bukhari.3208', 'bukhari.4949', 'muslim.2650.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир и «люди сунны» о кадаритах$p$, 'tradition',
    $p$К 54:49: «يستدل بهذه الآية الكريمة أئمة السنة على إثبات قدر الله السابق لخلقه، وهو علمه الأشياء قبل كونها وكتابته لها قبل برئها»; этим они возражают «على الفرقة القدرية الذين نبغوا» в конце эпохи сподвижников (Ибн Касир 54:47). У Абу Дауда: «القدرية مجوس هذه الأمة» (Абу Дауд 4691).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Как понимается «приобретение» (касб) у ашаритов и матуридитов — по их книгам, которых в библиотеке нет; оценку хадиса Абу Дауда 4691 хадисоведами нужно добавить.$p$, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tafsir_ibn_kathir.54.47', 'abu_dawud.4691']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни, глава о принуждении и предопределении$p$, 'tradition',
    $p$Со слов имама Джафара ас-Садика: «لا جبر ولا تفويض ولكن أمر بين أمرين» (аль-Кафи 3.30.13). Али отвечает старику после Сиффина: «وتظن أنه كان قضاء حتما وقدرا لازما؟ إنه لو كان كذلك لبطل الثواب والعقاب والأمر والنهي» и «إن الله تبارك وتعالى كلف تخييرا ونهى تحذيرا» (аль-Кафи 3.30.1). Имам ар-Рида на вопрос, принуждает ли Бог к грехам: «الله أعدل وأحكم من ذلك» (аль-Кафи 3.30.3). «إن الله أرحم بخلقه من أن يجبر خلقه على الذنوب ثم يعذبهم عليها» (аль-Кафи 3.30.9).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Оценку цепочек этих сообщений шиитскими хадисоведами и разборы богословов (например, аш-Шейха аль-Муфида) нужно добавить.$p$, 2
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['kafi.3.30.13', 'kafi.3.30.1', 'kafi.3.30.3', 'kafi.3.30.9']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Кадариты (в передаче их противников)$p$, 'minority',
    $p$О первых из них в Басре: «وأنهم يزعمون أن لا قدر وأن الأمر أنف» (Муслим 8). Ибн Касир называет их «الفرقة القدرية الذين نبغوا» и пишет, что они появились в конце эпохи сподвижников (Ибн Касир 54:47).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Это взгляд, переданный противниками; книги самих кадаритов и мутазилитов (о свободе воли и справедливости Бога) нужно добавить по их сочинениям.$p$, 3
  FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.8.1', 'tafsir_ibn_kathir.54.47']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$О юноше из рассказа о Хидре (хадис у Муслима и Ибн Касир)$p$, 'tradition',
    $p$«إن الغلام الذي قتله الخضر طبع كافرا ولو عاش لأرهق أبويه طغيانا وكفرا» (Муслим 2661). Ибн Касир к 18:80 приводит слова Катады: «قد فرح به أبواه حين ولد، وحزنا عليه حين قتل، ولو بقي كان فيه هلاكهما» (Ибн Касир 18:80).$p$,
    note, 4
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.2661.1', 'tafsir_ibn_kathir.18.80']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (подборки из архива автора)$p$, 'minority',
    $p$Считают, что если дела и участь человека записаны до его рождения (Бухари 3208, Муслим 2653), то у человека нет настоящего выбора и наказание несправедливо. Приводят вопрос из хадиса Имрана ибн Хусайна (Муслим 2650) и рассказ о юноше, которого убил Хидр (Муслим 2661). Составитель одной из подборок пишет, что этот вопрос стал причиной его выхода из ислама.$p$,
    $p$Изложено по подборкам из архива автора без их тона; цитаты из книг библиотеки сверены. Степень признания здесь условна: это полемика, а не исследование.$p$, 5
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.3208', 'muslim.2653.1', 'muslim.2650.1', 'muslim.2661.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'qadar-and-free-will', 'status', 'draft', 'positions', 6),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:104');
END $$;
