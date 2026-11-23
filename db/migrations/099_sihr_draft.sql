-- 099: a draft of the hard topic «Колдовство, наведённое на пророка»
-- (docs/PLAN.md, 23.11.2026), the next sira theme of the critic's posts in the
-- author's archive. The hadiths of Aisha and their variants, al-Tha'labi's
-- longer report with Ibn Kathir's judgement, the ruling of Ibn Qudama with
-- the Hanafi view, the denial of magic that Ibn Kathir reports from the
-- Mu'tazila; the critic without his tone. Every quotation is checked against
-- the library. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'sihr-on-the-prophet')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.5763')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.113.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'mughni.9.33.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'itqan_suyuti.1.55.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('sihr-on-the-prophet', 'hard', 'draft', 'migration:099', 'migration:099')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Колдовство, наведённое на пророка$p$,
    $p$Что сообщают хадисы о колдовстве Лабида ибн аль-Асама, наведённом на пророка, как это связывают с последними сурами Корана и что об этом говорят правоведы и толкователи?$p$,
    $p$Аяты, к которым обращаются в этом споре, — 113:4 и слова многобожников в 17:47 и 25:8. Ас-Суюти о времени ниспослания двух последних сур: «المختار أنهما مدنيتان لأنهما نزلتا في قصة سحر لبيد بن الأعصم كما أخرجه البيهقي في الدلائل» (Иткан 1:55).$p$,
    $p$Собрано 23.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. В «аль-Кафи» и «аль-Иршаде» рассказа о Лабиде не найдено; позиций шиитских авторов, самих мутазилитов (здесь их взгляд — в передаче ар-Рази у Ибн Касира) и исследователей в библиотеке нет — их нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'bukhari.5763', 0),
    ('main', 'muslim.2189.1', 1),
    ('main', 'quran.113.4', 2),
    ('circumstances', 'itqan_suyuti.1.55.1', 0),
    ('circumstances', 'quran.17.47', 1),
    ('circumstances', 'quran.25.8', 2),
    ('related', 'bukhari.5766', 0),
    ('related', 'bukhari.3268', 1),
    ('related', 'bukhari.4428', 2)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы Аиши у аль-Бухари и Муслима$p$, 'tradition',
    $p$«سحر رسول الله صلى الله عليه وسلم رجل من بني زريق، يقال له لبيد بن الأعصم، حتى كان رسول الله صلى الله عليه وسلم يخيل إليه أنه كان يفعل الشيء وما فعله»; о колодце: «قد عافاني الله، فكرهت أن أثور على الناس فيه شرا» (Бухари 5763). В передаче Суфьяна ибн Уяйны: «حتى كان يرى أنه يأتي النساء ولا يأتيهن، قال سفيان: وهذا أشد ما يكون من السحر» и о Лабиде: «رجل من بني زريق حليف ليهود كان منافقا» (Бухари 5765). У Муслима: «سحر رسول الله صلى الله عليه وسلم يهودي من يهود بني زريق يقال له لبيد بن الأعصم» (Муслим 2189).$p$,
    $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Кто был Лабид — иудей или лицемер-союзник иудеев, — передачи называют по-разному; как это согласуют хадисоведы, нужно добавить.$p$, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.5763', 'bukhari.5765', 'muslim.2189.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Рассказ ас-Саалиби и оценка Ибн Касира (к суре 113)$p$, 'minority',
    $p$Ас-Саалиби со слов Ибн Аббаса и Аиши: «فمرض رسول الله صلى الله عليه وسلم وانتثر شعر رأسه، ولبث ستة أشهر يرى أنه يأتي النساء ولا يأتيهن». Ибн Касир о нём: «هكذا أورده بلا إسناد، وفيه غرابة، وفي بعضه نكارة شديدة، ولبعضه شواهد مما تقدم» (Ибн Касир 113:1).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.113.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Кудама (ханбалит) о колдуне из людей Писания$p$, 'tradition',
    $p$«فأما ساحر أهل الكتاب، فلا يقتل لسحره، إلا أن يقتل به»; довод: «أن لبيد بن الأعصم سحر النبي - صلى الله عليه وسلم - فلم يقتله». Иное мнение: «وقال أبو حنيفة: يقتل؛ لعموم ما تقدم من الأخبار» (Мугни 9:33).$p$,
    $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Это изложение мнений у автора книги; мнения других школ по их книгам нужно добавить.$p$, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'mughni.9.33.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Мутазилиты о колдовстве (в передаче ар-Рази у Ибн Касира)$p$, 'minority',
    $p$«حكى أبو عبد الله الرازي في تفسيره عن المعتزلة أنهم أنكروا وجود السحر، قال: وربما كفروا من اعتقد وجوده» (Ибн Касир 2:99).$p$,
    $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Это взгляд, переданный противниками, а не книги самих мутазилитов; как они понимали хадис о Лабиде, нужно добавить по их сочинениям.$p$, 3
  FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.2.99', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят хадис Аиши о том, что пророку казалось, будто он делает то, чего не делал (Бухари 5765), и ставят его в ряд с рассказом об отравлении в Хайбаре (Бухари 4428).$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Степень признания здесь условна: это полемика, а не исследование.$p$, 4
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.5765', 'bukhari.4428']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug = 'khaybar-safiyya-kinana'
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug = 'khaybar-safiyya-kinana';

  -- On the map: Medina (the al-Ṯurayyā point, as in migration 097).
  INSERT INTO places (slug, name_ar, lat, lon, coord_source, created_by, updated_by)
  VALUES ('madina', 'المدينة', 24.47782, 39.60908, 'al-thurayya:MADINA_396E244N_S', 'migration:099', 'migration:099')
  ON CONFLICT (slug) DO NOTHING;
  INSERT INTO place_texts (place_id, locale, name)
  SELECT id, 'ru', 'Медина' FROM places WHERE slug = 'madina'
  ON CONFLICT DO NOTHING;
  INSERT INTO topic_places (topic_id, place_id) SELECT tid, id FROM places WHERE slug = 'madina' ON CONFLICT DO NOTHING;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'sihr-on-the-prophet', 'status', 'draft', 'positions', 5),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:099');
END $$;
