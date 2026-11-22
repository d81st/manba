-- 092: a draft of the hard topic «Райхана» (docs/PLAN.md, 22.11.2026), the
-- second sira theme of the critic's posts in the author's archive. The early
-- reports disagree (a captive who stayed in the Prophet's possession, or a
-- freed woman he married); every version is a quotation with its address,
-- checked against the library; the critic without his tone. The topic stays
-- a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Это рассказы ранних историков; какая версия надёжнее, оценивают хадисоведы и историки — их позиции нужно добавить.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'rayhana')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ibn_hisham.2.245.2')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ansab_baladhuri.1.454.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'maghazi_waqidi.2.520.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'musannaf.14005')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('rayhana', 'hard', 'draft', 'migration:092', 'migration:092')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Райхана$p$,
    $p$Что ранние историки рассказывают о Райхане из пленниц Бану Курайзы: осталась ли она невольницей пророка или он освободил её и женился на ней?$p$,
    $p$Аль-Балазури перечисляет, что пророк брал себе из добычи до раздела: «وفي يوم بني قريظة ريحانة بنت (شمعون بن) زيد» (Ансаб 1:515). Имя и род в рассказах различаются: у Ибн Хишама «ريحانة بنت عمرو بن خنافة» (Ибн Хишам 2:245), у ат-Табари «ريحانة بنت زيد القرظية» и «هي من بني النضير» как другое мнение (Табари 3:169).$p$,
    $p$Собрано 22.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. В «аль-Кафи» сообщений о Райхане не найдено; «Табакат» Ибн Сада, где собраны эти рассказы, в библиотеке нет (здесь они — в передаче аль-Балазури).$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'ibn_hisham.2.245.2', 0),
    ('main', 'ansab_baladhuri.1.454.1', 1),
    ('circumstances', 'ansab_baladhuri.1.515.1', 0),
    ('circumstances', 'ibn_hisham.2.245.2', 1),
    ('circumstances', 'tarikh_tabari.3.169.2', 2),
    ('related', 'tarikh_tabari.2.592.1', 0),
    ('related', 'ansab_baladhuri.1.453.1', 1)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Исхак у Ибн Хишама (так же у ат-Табари)$p$, 'tradition',
    $p$«وكان رسول الله صلى الله عليه وسلم قد اصطفى لنفسه من نسائهم ريحانة بنت عمرو بن خنافة»; «فكانت عند رسول الله صلى الله عليه وسلم حتى توفي عنها وهي في ملكه». Предложение брака и её ответ: «وقد كان رسول الله صلى الله عليه وسلم عرض عليها أن يتزوجها، ويضرب عليها الحجاب» — «يا رسول الله، بل تتركني في ملكك، فهو أخف علي وعليك». О вере: «وقد كانت حين سباها قد تعصت بالإسلام، وأبت إلا اليهودية» (Ибн Хишам 2:245; тот же рассказ — Табари 2:592).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['ibn_hisham.2.245.2', 'tarikh_tabari.2.592.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Вакиди, «аль-Магази»$p$, 'tradition',
    $p$«وكانت ريحانة بنت زيد من بني النضير متزوجة في بني قريظة»; слова Ибн Сайи, уговаривавшего её: «لا تتبعي قومك، فقد رأيت ما أدخل عليهم حيي بن أخطب، فأسلمي يصطفيك رسول الله صلى الله عليه وسلم لنفسه» (Вакиди 2:520).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'maghazi_waqidi.2.520.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Передачи о браке (у аль-Балазури)$p$, 'tradition',
    $p$Со слов аз-Зухри через аль-Вакиди: «فأعتقها وتزوجها وجعل صداقها عتقها، ثم إنه طلقها». Со слов Мухаммада ибн Каба: «فأعتقها رسول الله صلى الله عليه وسلم وتزوجها» и слова самой Райханы: «تزوجني رسول الله صلى الله عليه وسلم، ومهرني مثل نسائه، وكان يقسم لي، وضرب علي الحجاب» (Ансаб 1:454).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ansab_baladhuri.1.454.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Передачи о том, что она осталась невольницей$p$, 'tradition',
    $p$Аз-Зухри в передаче Мамара: «كان للنبي صلى الله عليه وسلم سريتين: القبطية، وريحانة ابنة شمعون» (Мусаннаф 14005). У аль-Балазури: «فعرض عليها التزويج وضرب الحجاب، فقالت: بل تتركني في ملكك» (Ансаб 1:453).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. От аз-Зухри дошли обе версии — о браке (через аль-Вакиди) и о невольнице (через Мамара); какая передача надёжнее, нужно добавить по оценкам хадисоведов.$p$, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['musannaf.14005', 'ansab_baladhuri.1.453.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят сообщения о том, что Райхана, взятая из пленниц Бану Курайзы, была наложницей пророка (Мусаннаф 14005; Ибн Хишам 2:245), и ставят это в ряд с рассказами о рабстве и пленницах.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Степень признания здесь условна: это полемика, а не исследование.$p$, 4
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['musannaf.14005', 'ibn_hisham.2.245.2']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug = 'slavery-and-concubines'
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug = 'slavery-and-concubines';

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'rayhana', 'status', 'draft', 'positions', 5),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:092');
END $$;
