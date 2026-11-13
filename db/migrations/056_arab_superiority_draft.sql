-- 056: a draft of the hard topic «Превосходство арабов над неарабами»
-- (docs/PLAN.md, 12–13.11.2026), the second example of a topic built from the
-- leads of the author's archive, by the same method as 054: what the critics
-- point to, and what the sources themselves say, every position a quotation
-- with its address, checked against the library. Nothing here is written in
-- the name of a side. The topic stays a draft until a specialist has read it.
--
-- Runs only where the books it quotes are loaded and the topic does not exist
-- yet; on an empty database (CI, a restore before the import) it does nothing.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'arab-superiority')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'iqtida_sirat.1.419.2')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ahmad.23489')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2276.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.18.21.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('arab-superiority', 'hard', 'draft', 'migration:056', 'migration:056')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Превосходство арабов над неарабами$p$,
    $p$Что источники говорят о превосходстве арабов над неарабами и как это соотносится с аятом 49:13 и словами «нет превосходства у араба над неарабом, кроме как в богобоязненности»?$p$,
    $p$Ибн Таймия в «Иктида ас-сират аль-мустаким» пишет: «فإن الذي عليه أهل السنة والجماعة: اعتقاد أن جنس العرب أفضل من جنس العجم» (Иктида 1:419) — и приводит слова Харба аль-Кирмани, ученика Ахмада, из описания сунны: «ونعرف للعرب حقها وفضلها وسابقتها ونحبهم» (Иктида 1:420). Противоположное мнение он приписывает шуубии (Иктида 1:421). Тот же автор несколькими страницами раньше приводит аят 49:13 и хадис «ألا لا فضل لعربي على عجمي، ألا لا فضل لأسود على أحمر إلا بالتقوى» (Иктида 1:411–412). Практическое следствие, о котором он пишет, — равенство в браке (кафаа): «وهذا مما احتج به أكثر الفقهاء الذين جعلوا العربية من الكفاءة بالنسبة إلى العجمي» (Иктида 1:445).$p$,
    $p$Собрано 13.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.49.13', 0),
    ('main', 'iqtida_sirat.1.419.2', 1),
    ('main', 'ahmad.23489', 2),
    ('circumstances', 'iqtida_sirat.1.419.2', 0),
    ('circumstances', 'iqtida_sirat.1.420.1', 1),
    ('circumstances', 'iqtida_sirat.1.421.1', 2),
    ('circumstances', 'iqtida_sirat.1.411.1', 3),
    ('circumstances', 'iqtida_sirat.1.412.1', 4),
    ('circumstances', 'iqtida_sirat.1.445.1', 5),
    ('related', 'muslim.2276.1', 0),
    ('related', 'tirmidhi.3605.1', 1),
    ('related', 'tirmidhi.3606.1', 2),
    ('related', 'kafi.18.21.1', 3),
    ('related', 'kafi.18.19.2', 4)
  ) AS v(role, address, pos);

  -- The Sunni tradition: the book the critics quote, read in full.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Таймия$p$, 'tradition',
    $p$О превосходстве рода: «اعتقاد أن جنس العرب أفضل من جنس العجم» и «وليس فضل العرب، ثم قريش، ثم بني هاشم، لمجرد كون النبي صلى الله عليه وسلم منهم، وإن كان هذا من الفضل، بل هم في أنفسهم أفضل» (Иктида 1:419–420). О тех, кто это отрицает: «والغالب أن مثل هذا الكلام لا يصدر إلا عن نوع نفاق» (Иктида 1:421).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['iqtida_sirat.1.419.2', 'iqtida_sirat.1.420.1', 'iqtida_sirat.1.421.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Таймия$p$, 'tradition',
    $p$О роде и отдельном человеке: «لأن فضل الجنس لا يستلزم فضل الشخص كما قدمناه، فرب حبشي أفضل عند الله من جمهور قريش». О неарабе, который следует пророку: «يوجب له أن يكون أفضل من جمهور الطائفة المفضلة، وهذا هو الفضل الحقيقي» (Иктида 1:453).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'iqtida_sirat.1.453.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Таймия о равенстве в браке$p$, 'tradition',
    $p$О сообщении Салмана аль-Фариси, что неарабы не становятся имамами арабов в молитве и не женятся на их женщинах: «وهذا مما احتج به أكثر الفقهاء الذين جعلوا العربية من الكفاءة بالنسبة إلى العجمي» (Иктида 1:445).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'iqtida_sirat.1.445.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис у Ахмада$p$, 'tradition',
    $p$Из проповеди в дни ташрика: «ألا لا فضل لعربي على عجمي ، ولا لعجمي على عربي، ولا أحمر على أسود، ولا أسود على أحمر، إلا بالتقوى» (Ахмад 23489). Ибн Таймия приводит этот хадис и называет его иснад достоверным: «وفي حديث آخر رويناه بإسناد صحيح» (Иктида 1:412).$p$,
    $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. Оценки достоверности этого хадиса у других хадисоведов нужно добавить.$p$, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['ahmad.23489', 'iqtida_sirat.1.412.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис у Муслима$p$, 'tradition',
    $p$«إن الله اصطفى كنانة من ولد إسماعيل واصطفى قريشا من كنانة واصطفى من قريش بني هاشم واصطفاني من بني هاشم» (Муслим 2276). Близкие по тексту передачи — у ат-Тирмизи 3605 и 3606.$p$, note, 4
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.2276.1', 'tirmidhi.3605.1', 'tirmidhi.3606.1']) WITH ORDINALITY AS u(a, o);

  -- The Shia tradition.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$Имам аль-Бакир рассказывает о Джувайбире, которого пророк велел выдать за дочь знатного человека. Слова пророка: «فالناس اليوم كلهم أبيضهم وأسودهم وقرشيهم وعربيهم وعجميهم من آدم» и «وما أعلم يا جويبر لأحد من المسلمين عليك اليوم فضلا إلا لمن كان أتقى لله منك وأطوع» (аль-Кафи 18.21.1). О равенстве в браке: «المؤمنون بعضهم أكفاء بعض» (аль-Кафи 18.19.2).$p$,
    $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. У второго сообщения в самом тексте сказано, что иснад утерян («سقط عني إسناده»); оценку достоверности по шиитской науке о хадисе нужно добавить.$p$, 5
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['kafi.18.21.1', 'kafi.18.19.2']) WITH ORDINALITY AS u(a, o);

  -- The opposite view inside Muslim history, as its opponent reports it.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Шуубия (в изложении Ибн Таймии)$p$, 'minority',
    $p$«أن لا فضل لجنس العرب على جنس العجم. وهؤلاء يسمون الشعوبية» (Иктида 1:421).$p$,
    $p$Известно только в изложении противника; собственных текстов шуубии в библиотеке нет. Степень признания условна.$p$, 6
  FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'iqtida_sirat.1.421.1', 0);

  -- The critics: what they point to, without their tone.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят слова Ибн Таймии о превосходстве рода арабов (Иктида 1:419–421) и сообщение Салмана о браке и имамстве в молитве, на которое, по его словам, опиралось большинство факихов в вопросе равенства в браке (Иктида 1:445), как свидетельство того, что традиция признаёт неравенство людей по происхождению вопреки аяту 49:13. Ссылаются также на ответы современных учёных, которые повторяют это положение с оговоркой о роде и отдельном человеке.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты сверены с текстом книги. Ответов современных учёных, на которые ссылаются записи, в библиотеке нет (это современные тексты под авторским правом). Степень признания здесь условна: это полемика, а не богословская школа.$p$, 7
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['iqtida_sirat.1.419.2', 'iqtida_sirat.1.421.1', 'iqtida_sirat.1.445.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'arab-superiority', 'status', 'draft', 'positions', 8),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:056');
END $$;
