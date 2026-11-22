-- 088: a draft of the hard topic «Такийя и хитрость на войне» (docs/PLAN.md,
-- 22.11.2026), the next theme of the critic's posts in the author's archive.
-- Same method as 054–087: every position a quotation with its address,
-- checked against the library; the permissions and their limits side by
-- side; the critic without his tone. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'taqiyya-and-war-deception')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.3.28')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2605.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.5.97.16')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('taqiyya-and-war-deception', 'hard', 'draft', 'migration:088', 'migration:088')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Такийя и хитрость на войне$p$,
    $p$Что источники говорят о сокрытии веры из страха (такийе) и о хитрости на войне, и где они ставят этому предел?$p$,
    $p$Аяты, к которым обращаются: 3:28 (слова «إلا أن تتقوا منهم تقاة»), 16:106 (об отречении под принуждением) и 8:58 (о договоре). О войне: «سمى النبي صلى الله عليه وسلم الحرب خدعة» (Бухари 3029).$p$,
    $p$Собрано 22.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. Комментариев ан-Навави и ас-Синди, на которые ссылается критик, в библиотеке нет; позиций исследователей и современных богословов — тоже.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.3.28', 0),
    ('main', 'quran.16.106', 1),
    ('main', 'quran.8.58', 2),
    ('circumstances', 'tafsir_ibn_kathir.3.28', 0),
    ('circumstances', 'bukhari.3029', 1),
    ('related', 'bukhari.3028', 0),
    ('related', 'muslim.1739.1', 1),
    ('related', 'bukhari.3186', 2)
  ) AS v(role, address, pos);

  -- The Sunni tradition: the permissions.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир (к 3:28)$p$, 'tradition',
    $p$«إلا من خاف في بعض البلدان أوالأوقات من شرهم، فله أن يتقيهم بظاهره لا بباطنه ونيته»; со слов Ибн Аббаса: «ليس التقية بالعمل إنما التقية باللسان» (Ибн Касир 3:28).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.3.28', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир (к 16:106)$p$, 'tradition',
    $p$Об Аммаре ибн Ясире: «أن هذه الآية نزلت في عمار بن ياسر، حين عذبه المشركون حتى يكفر بمحمد صلى الله عليه وسلم، فوافقهم على ذلك مكرها» (Ибн Касир 16:106).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.16.106', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы о войне и о трёх случаях$p$, 'tradition',
    $p$«الحرب خدعة» (Муслим 1739). Где речь допускает неправду, по словам аз-Зухри в передаче от Умм Кульсум: «ولم أسمع يرخص في شيء مما يقول الناس كذب إلا في ثلاث الحرب والإصلاح بين الناس وحديث الرجل امرأته وحديث المرأة زوجها» (Муслим 2605).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.1739.1', 'muslim.2605.1']) WITH ORDINALITY AS u(a, o);

  -- The Sunni tradition: the limits.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы о запрете вероломства$p$, 'tradition',
    $p$Наставление командиру отряда: «اغزوا ولا تغلوا ولا تغدروا ولا تمثلوا ولا تقتلوا وليدا» (Муслим 1731). «لكل غادر لواء ينصب بغدرته يوم القيامة» (Бухари 3188).$p$, note, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.1731.2', 'bukhari.3188']) WITH ORDINALITY AS u(a, o);

  -- The Shia tradition.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни, глава о такийе$p$, 'tradition',
    $p$«إن تسعة أعشار الدين في التقية ولا دين لمن لا تقية له والتقية في كل شئ إلا في النبيذ والمسح على الخفين» (аль-Кафи 5.97.2). На вопрос о том, вставать ли перед правителями: «التقية من ديني ودين آبائي ولا إيمان لمن لا تقية له» (аль-Кафи 5.97.12). Предел: «إنما جعلت التقية ليحقن بها الدم فإذا بلغ الدم فليس تقية» (аль-Кафи 5.97.16).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Как шиитские правоведы определяют, перед кем и в чём такийя (правители, другие мусульмане, иноверцы), нужно добавить по их книгам; оценки достоверности — тоже.$p$, 4
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['kafi.5.97.2', 'kafi.5.97.12', 'kafi.5.97.16']) WITH ORDINALITY AS u(a, o);

  -- The critics: what they point to, without their tone.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят аят 3:28 с толкованием Ибн Касира (Ибн Касир 3:28) и хадис «الحرب خدعة» (Муслим 1739) с комментариями ан-Навави и ас-Синди о согласии учёных, что врага на войне можно обманывать, и распространяют это на отношения мусульман с немусульманами вообще. В тех же комментариях, по самим записям, стоит оговорка: кроме случаев, когда обман нарушает договор или данную гарантию безопасности.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Комментариев ан-Навави и ас-Синди в библиотеке нет. Степень признания здесь условна: это полемика, а не богословская школа.$p$, 5
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tafsir_ibn_kathir.3.28', 'muslim.1739.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'taqiyya-and-war-deception', 'status', 'draft', 'positions', 6),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:088');
END $$;
