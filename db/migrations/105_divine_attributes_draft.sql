-- 105: a draft topic on the attributes of God (the Throne, the «hand», the
-- descent) (docs/PLAN.md, 28.11.2026), the second theme of the item
-- «вероучение» of the author's list. Ibn Kathir on 7:54, al-Suyuti on the
-- way of the Salaf and of the Khalaf, the hadiths of the descent and of the
-- slave-girl, the chapters of al-Kafi on the descent and the Throne. Every
-- quotation is checked against the library. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'divine-attributes')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.7.54')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'itqan_suyuti.3.15.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.3.19.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('divine-attributes', 'general', 'draft', 'migration:105', 'migration:105')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Атрибуты Аллаха: Трон, «рука», нисхождение$p$,
    $p$Как разные стороны понимают аяты и хадисы об атрибутах Аллаха — об «истиве» на Трон (20:5, 7:54), о «руке» и «лике», о нисхождении: принимать их «как есть», толковать или отвергать то, что похоже на свойства сотворённого?$p$,
    $p$Ас-Суюти относит такие аяты к неясным (муташабих): «من المتشابه آيات الصفات» (Иткан 3:14). Хадис о нисхождении: «ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر» (Бухари 1145). В хадисе о невольнице: «أين الله قالت في السماء» (Муслим 537). Аят, на который ссылаются все стороны, — 42:11.$p$,
    $p$Собрано 28.11.2026 по текстам библиотеки, по указателю тем архива автора («вероучение: атрибуты Аллаха»). Подбор цитат и формулировки специалист не проверял. Книг ашаритов и матуридитов о толковании атрибутов (например, «Иляжм аль-авамм» аль-Газали, «Асас ат-такдис» ар-Рази), трактатов Ибн Таймии об атрибутах («аль-Хамавийя», «ат-Тадмурийя»), книг мутазилитов и исследователей в библиотеке нет — их нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.20.5', 0),
    ('main', 'quran.7.54', 1),
    ('main', 'quran.42.11', 2),
    ('main', 'quran.38.75', 3),
    ('main', 'quran.55.27', 4),
    ('circumstances', 'itqan_suyuti.3.14.1', 0),
    ('circumstances', 'bukhari.1145', 1),
    ('circumstances', 'muslim.537.1', 2),
    ('related', 'bukhari.7494', 0),
    ('related', 'muslim.758.1', 1),
    ('related', 'kafi.3.19.4', 2),
    ('related', 'kafi.3.20.2', 3)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир: путь салафов (к 7:54)$p$, 'tradition',
    $p$«وإنما يسلك في هذا المقام مذهب السلف الصالح»: «وهو إمرارها كما جاءت من غير تكييف ولا تشبيه ولا تعطيل». Он приводит слова Нуайма ибн Хаммада: «من شبه الله بخلقه فقد كفر، ومن جحد ما وصف الله به نفسه فقد كفر» (Ибн Касир 7:54).$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.7.54', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ас-Суюти: два пути внутри суннитов («аль-Иткан»)$p$, 'tradition',
    $p$«وجمهور أهل السنة منهم السلف وأهل الحديث على الإيمان بها وتفويض معناها المراد منها إلى الله تعالى» (Иткан 3:14). Слова Малика: «الكيف غير معقول والاستواء غير مجهول والإيمان به واجب والسؤال عنه بدعة». Второй путь: «وذهبت طائفة من أهل السنة على أننا نؤولها على ما يليق بجلاله تعالى وهذا مذهب الخلف»; об имаме аль-Харамайне, который вернулся к первому пути: «اتباع سلف الأمة فإنهم درجوا على ترك التعرض لمعانيها» (Иткан 3:15).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Как именно толкуют эти аяты сторонники второго пути и кто такие «халаф», нужно добавить по их книгам; различие между «тафвидом» у ас-Суюти и «как есть» у Ибн Касира проверяет специалист.$p$, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['itqan_suyuti.3.14.1', 'itqan_suyuti.3.15.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни, главы о движении и о Троне$p$, 'tradition',
    $p$Имам Муса аль-Казим о тех, кто говорит о нисхождении: «إن الله لا ينزل ولا يحتاج إلى أن ينزل» и «وكل متحرك محتاج إلى من يحركه أو يتحرك به» (аль-Кафи 3.19.1). Имам Джафар ас-Садик о 20:5: «استوى في كل شئ فليس شئ أقرب إليه من شئ» (аль-Кафи 3.19.8). О словах «Трон был на воде, а Господь над ним»: «كذبوا، من زعم هذا فقد صير الله محمولا ووصفه بصفة المخلوق» (аль-Кафи 3.20.7).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Оценку цепочек этих сообщений шиитскими хадисоведами и разборы шиитских богословов нужно добавить.$p$, 2
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['kafi.3.19.1', 'kafi.3.19.8', 'kafi.3.20.7']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'divine-attributes', 'status', 'draft', 'positions', 3),
          'Черновик собран по текстам библиотеки по указателю тем архива автора; специалистом не проверен.', 'migration:105');
END $$;
