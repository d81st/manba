-- 090: a draft of the hard topic «Завоевание Армении, Аррана и Дербента»
-- (docs/PLAN.md, 22.11.2026), the next theme of the critic's posts in the
-- author's archive. The chronicles themselves on both sides: the treaties of
-- protection and the campaigns with their tributes and captives, quoted with
-- addresses and checked against the library; the critic without his tone.
-- The topic stays a draft.
--
-- Migrations run before the import, so on the start that first loads
-- «Футух аль-Булдан» (migration 089) this returns; the importer runs this
-- file again afterwards (DRAFTS_AFTER_IMPORT in web/scripts/import-sources.ts).
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Это рассказы летописцев; их надёжность и датировку оценивают историки — их позиции нужно добавить.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'caucasus-conquest')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'futuh_buldan.1.206.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tarikh_tabari.4.156.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('caucasus-conquest', 'hard', 'draft', 'migration:090', 'migration:090')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Завоевание Армении, Аррана и Дербента$p$,
    $p$Что рассказывают ранние летописи о приходе мусульман в Армению, Арран и к Дербенту: о договорах, данях и походах?$p$,
    $p$Аль-Балазури собирает рассказы об Армении со слов местных знатоков: «حدثني محمد بن إسماعيل من ساكني برذعة وغيره» (Футух 1:193). Договоры заключает Хабиб ибн Маслама (Футух 1:199–201); позже, после правления Масламы ибн Абд аль-Малика, «ثم ولى هشام بعد مسلمة سعيد الحرشي فأقام بالثغر سنتين ثم ولى الثغر مروان بن محمد» (Футух 1:205).$p$,
    $p$Собрано 22.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. «Книги завоеваний» Ибн А‘сама аль-Куфи, на которую ссылается критик, в библиотеке нет; исследования историков (в том числе «История Дагестана» и перевод Х. Кеннеди) под авторским правом и сюда не переносились.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'futuh_buldan.1.199.1', 0),
    ('main', 'futuh_buldan.1.206.1', 1),
    ('circumstances', 'futuh_buldan.1.193.2', 0),
    ('circumstances', 'futuh_buldan.1.205.1', 1),
    ('related', 'futuh_buldan.1.200.1', 0),
    ('related', 'futuh_buldan.1.201.1', 1),
    ('related', 'tarikh_tabari.4.158.1', 2)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Балазури: договоры Хабиба ибн Масламы$p$, 'tradition',
    $p$С Дабилем: «إني أمنتكم على أنفسكم وأموالكم وكنائسكم وبيعكم وسور مدينتكم فأنتم آمنون وعلينا الوفاء لكم بالعهد ما وفيتم وأديتم الجزية والخراج» (Футух 1:199). С Тифлисом: «بالأمان على أنفسهم وبيعهم وصوامعهم وصلواتهم ودينهم على إقرار بالصغار والجزية على كل أهل بيت دينار» (Футух 1:200). С другими местами: «صلحا على حقن دماء أهلها وإقرار مصلياتهم وحيطانهم وعلى أن يؤدوا إتاوة عن أرضهم ورؤسهم» (Футух 1:201).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['futuh_buldan.1.199.1', 'futuh_buldan.1.200.1', 'futuh_buldan.1.201.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ат-Табари: договор у Дербента$p$, 'tradition',
    $p$Правитель Дербента Шахрбараз просит: «فلا تذلونا بالجزية فتوهنونا لعدوكم»; Сурака отвечает: «قد قبلت ذلك فيمن كان معك على هذا ما دام عليه، ولا بد من الجزاء ممن يقيم ولا ينهض» (Табари 4:156). О походе на Баланджар при Умаре: «فغزا بلنجر غزاة في زمن عمر لم تئم فيها امرأة، ولم ييتم فيها صبي» (Табари 4:158).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Цепочку передатчиков этого рассказа у ат-Табари и его оценку историками нужно добавить.$p$, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tarikh_tabari.4.156.1', 'tarikh_tabari.4.158.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Балазури: походы Марвана ибн Мухаммада$p$, 'tradition',
    $p$О хазарских землях: «فأغار مروان على صقالبة كانوا بأرض الخزر فسبى منهم عشرين ألف أهل بيت فأسكنهم خاخيط» (Футух 1:205). О Сарире: «فصالحه على ألف رأس خمسمائة غلام وخمسمائة جارية سود الشعور والحواجب وهدب الأشفار في كل سنة وعلى مائة ألف مدى تصب في أهراء الباب». О крепости Хамзин: «فافتتح حصنهم بعد أن حاصرهم فيه شهرا فأحرق وأخرب» (Футух 1:206).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['futuh_buldan.1.205.1', 'futuh_buldan.1.206.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят страницы аль-Балазури о дани людьми с Сарира и о пленении славян (Футух 1:205–206) и рассказ Ибн А‘сама аль-Куфи о крепости Хамзин, где дань — светловолосые девушки, а у аль-Балазури — черноволосые, и делают вывод, что Кавказ принял ислам не добровольно.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты аль-Балазури сверены. Книги Ибн А‘сама в библиотеке нет. Степень признания здесь условна: это полемика, а не исследование.$p$, 3
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['futuh_buldan.1.205.1', 'futuh_buldan.1.206.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug = 'dhimma-conditions'
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug = 'dhimma-conditions';

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'caucasus-conquest', 'status', 'draft', 'positions', 4),
          'Черновик собран по летописям библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:090');
END $$;
