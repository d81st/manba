-- 054: a draft of the hard topic «Условия Умара: люди Писания под властью
-- мусульман» (docs/PLAN.md, 12.11.2026) — the first example of a topic built
-- from the leads of the author's archive (posts of a critic of Islam): what
-- the critics point to, and what the sources of the tradition themselves say,
-- every position a quotation with its address. Nothing here is written in
-- the name of a side: the texts are quotations checked against the library.
-- The topic stays a draft until a specialist has read it.
--
-- Runs only where the two books are already loaded (migration 053 and the
-- import after it) and the topic does not exist yet; on an empty database
-- (CI, a restore before the import) it does nothing.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 12.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'dhimma-conditions')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ahkam_dhimma.3.1159.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.3052')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.13.46.2')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('dhimma-conditions', 'hard', 'draft', 'migration:054', 'migration:054')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Условия Умара: люди Писания под властью мусульман$p$,
    $p$Какие условия ставил договор зиммы людям Писания и что источники говорят об их защите?$p$,
    $p$Текст условий приводит Ибн аль-Каййим: жители аль-Джазиры пишут Абд ар-Рахману ибн Ганму: «ألا نحدث في مدينتنا كنيسة، ولا فيما حولها ديرا ولا قلاية ولا صومعة راهب، ولا نجدد ما خرب من كنائسنا» (Ахкам 3:1159). О цепочке передатчиков он пишет: «وشهرة هذه الشروط تغني عن إسنادها، فإن الأئمة تلقوها بالقبول وذكروها في كتبهم واحتجوا بها» (Ахкам 3:1164). Об отличительной одежде: «وأما الغيار فلم يلزموا به في عهد النبي - صلى الله عليه وسلم - وإنما اتبع فيه أمر عمر رضي الله عنه» (Ахкам 1:491). Аят о джизье — 9:29.$p$,
    $p$Собрано 12.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.9.29', 0),
    ('main', 'ahkam_dhimma.3.1159.1', 1),
    ('circumstances', 'ahkam_dhimma.3.1159.1', 0),
    ('circumstances', 'ahkam_dhimma.3.1164.1', 1),
    ('circumstances', 'ahkam_dhimma.1.491.2', 2),
    ('circumstances', 'quran.9.29', 3),
    ('related', 'bukhari.3052', 0),
    ('related', 'bukhari.3162', 1),
    ('related', 'bukhari.3166', 2),
    ('related', 'abu_dawud.3052', 3),
    ('related', 'kafi.13.46.2', 4)
  ) AS v(role, address, pos);

  -- The tradition: what the book the critics quote says itself.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Каййим$p$, 'tradition',
    $p$О взимании джизьи: «وهذا يدل على أن الذمي إذا بذل ما عليه والتزم الصغار لم يحتج إلى أن يجر بيده ويضرب» (Ахкам 1:121).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ahkam_dhimma.1.121.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кади» (так в тексте) у Ибн аль-Каййима$p$, 'tradition',
    $p$О словах «пусть их утомляют при джизье»: «ولم يرد تعذيبهم ولا تكليفهم فوق طاقتهم وإنما أراد الاستخفاف بهم وإذلالهم» (Ахкам 1:121).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ahkam_dhimma.1.121.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Аббас у Ибн аль-Каййима$p$, 'tradition',
    $p$О городах, основанных мусульманами: «أيما مصر مصرته العرب - يعني المسلمين - فليس للعجم - يعني أهل الذمة - أن يبنوا فيه كنيسة، ولا يضربوا فيه ناقوسا، ولا يشربوا فيه خمرا». О городах, перешедших по договору, там же: «وعلى العرب أن يوفوا بعهدهم ولا يكلفوهم فوق طاقتهم» (Ахкам 3:1195).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ahkam_dhimma.3.1195.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Каййим$p$, 'tradition',
    $p$О церквях в городах, основанных мусульманами на земле, взятой силой: «وملخص الجواب: أن كل كنيسة في مصر والقاهرة والكوفة والبصرة وواسط وبغداد ونحوها من الأمصار التي مصرها المسلمون بأرض العنوة فإنه يجب إزالتها» (Ахкам 3:1195).$p$, note, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ahkam_dhimma.3.1195.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Каййим$p$, 'tradition',
    $p$О том, что нарушает договор: «أن الذمي إذا سب الله والرسول أو عاب الإسلام علانية فقد نكث يمينه وطعن في ديننا» (Ахкам 3:1383).$p$, note, 4
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ahkam_dhimma.3.1383.1', 0);

  -- The tradition: reports on the protection of people under the pact.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Умар ибн аль-Хаттаб у аль-Бухари$p$, 'tradition',
    $p$Завещание преемнику: «وأوصيه بذمة الله، وذمة رسوله صلى الله عليه وسلم، أن يوفى لهم بعهدهم، وأن يقاتل من ورائهم، ولا يكلفوا إلا طاقتهم» (Бухари 3052).$p$, note, 5
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.3052', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис у аль-Бухари$p$, 'tradition',
    $p$«من قتل معاهدا لم يرح رائحة الجنة» (Бухари 3166).$p$, note, 6
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.3166', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис у Абу Дауда$p$, 'tradition',
    $p$«ألا من ظلم معاهدا أو انتقصه أو كلفه فوق طاقته أو أخذ منه شيئا بغير طيب نفس فأنا حجيجه يوم القيامة» (Абу Дауд 3052).$p$,
    $p$Подобрано по текстам библиотеки 12.11.2026; специалистом не проверено. Оценку достоверности этого хадиса у хадисоведов нужно добавить.$p$, 7
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'abu_dawud.3052', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$«سألته عن أهل الذمة ماذا عليهم مما يحقنون به دمائهم وأموالهم؟ قال: الخراج» (аль-Кафи 13.46.2).$p$, note, 8
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'kafi.13.46.2', 0);

  -- The critics: what they point to, without their tone.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят страницы «Ахкам ахль аз-зимма» об условиях для церквей (Ахкам 3:1159, 3:1195), об отличительной одежде (Ахкам 1:491) и о расторжении договора за оскорбление (Ахкам 3:1383) как свидетельство приниженного положения немусульман под властью шариата.$p$,
    $p$Изложено по записям из архива автора без их тона; сами цитаты сверены с текстом книги. Степень признания здесь условна: это полемика, а не богословская школа.$p$, 9
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['ahkam_dhimma.3.1159.1', 'ahkam_dhimma.3.1195.1', 'ahkam_dhimma.1.491.2', 'ahkam_dhimma.3.1383.1']) WITH ORDINALITY AS u(a, o);

  -- Beside the topic about the verse of the jizya, where it exists.
  -- (relations are kept in both directions, as the admin form saves them)
  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug = 'jizya-verse'
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug = 'jizya-verse';

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'dhimma-conditions', 'status', 'draft', 'positions', 10),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:054');
END $$;
