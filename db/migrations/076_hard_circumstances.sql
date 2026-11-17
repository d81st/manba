-- 076: append circumstance quotations to the six hard topics
-- (docs/topics/hard-topics-sources.md, 17.11.2026).
-- The sentences are copied from pages already cited for those topics.
-- The two readings of 2:106 are left side by side. Nothing here decides
-- which reading or which report is right. Status is not changed.
-- A topic that is missing, or that already has the marker, is left alone.

DO $$
DECLARE
  tid bigint;
  note text := $p$Добавлено 17.11.2026 из мест, уже указанных для темы. Цитаты сверены со страницами. Вывода нет. Степень признания предварительная, её проверяет специалист.$p$;
  sword_extra text := $p$Ибн Касир 9:5 передаёт слова ад-Даххака целиком: «إنها نسخت كل عهد بين النبي (6) صلى الله عليه وسلم وبين أحد من المشركين، وكل عهد، وكل مدة». Ибн Хишам 2:545: «أنه لا يدخل الجنة كافر، ولا يحج بعد العام مشرك، ولا يطوف بالبيت عريان، ومن كان له عند رسول الله صلى الله عليه وسلم عهد فهو له إلى مدته».$p$;
  jizya_extra text := $p$Ибн Касир 9:28: «فلما استقامت (5) جزيرة العرب أمر الله ورسوله بقتال أهل الكتابين اليهود والنصارى، وكان ذلك في سنة تسع».$p$;
  fight_extra text := $p$Ибн Хишам 1:467: «فكانت أول آية أنزلت في إذنه له في الحرب، وإحلاله له الدماء والقتال، لمن بغى عليهم، فيما بلغني عن عروة بن الزبير».$p$;
  compulsion_extra text := $p$Абу Дауд 2682: «فلما أجليت بنو النضير كان فيهم من أبناء الأنصار فقالوا لا ندع أبناءنا فأنزل الله عز وجل لا إكراه في الدين».$p$;
  noncombat_extra text := $p$Бухари 2620, Асма: «قدمت علي أمي وهي مشركة في عهد رسول الله صلى الله عليه وسلم».$p$;
  naskh_extra text := $p$Ибн Касир 2:106: «قال ابن أبي طلحة، عن ابن عباس: {ما ننسخ من آية} ما نبدل من آية». «وقال ابن جريج، عن مجاهد: {ما ننسخ من آية} أي: ما نمح من». Ибн Касир 8:61 после слов «منسوخة بآية السيف» продолжает: «فيه نظر أيضا؛ لأن آية براءة فيها الأمر بقتالهم إذا أمكن ذلك».$p$;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM topics WHERE slug IN (
      'sword-verse', 'jizya-verse', 'fighting-those-who-fight',
      'no-compulsion', 'non-combatants', 'naskh-war-verses'
    )
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.9.5'
      AND position('إنها نسخت كل عهد بين النبي (6) صلى الله عليه وسلم وبين أحد من المشركين، وكل عهد، وكل مدة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.2.545.2'
      AND position('أنه لا يدخل الجنة كافر، ولا يحج بعد العام مشرك، ولا يطوف بالبيت عريان، ومن كان له عند رسول الله صلى الله عليه وسلم عهد فهو له إلى مدته' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.9.28'
      AND position('فلما استقامت (5) جزيرة العرب أمر الله ورسوله بقتال أهل الكتابين اليهود والنصارى، وكان ذلك في سنة تسع' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.1.467.3'
      AND position('فكانت أول آية أنزلت في إذنه له في الحرب، وإحلاله له الدماء والقتال، لمن بغى عليهم، فيما بلغني عن عروة بن الزبير' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'abu_dawud.2682'
      AND position('فلما أجليت بنو النضير كان فيهم من أبناء الأنصار فقالوا لا ندع أبناءنا فأنزل الله عز وجل لا إكراه في الدين' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'bukhari.2620'
      AND position('قدمت علي أمي وهي مشركة في عهد رسول الله صلى الله عليه وسلم' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.2.106'
      AND position('قال ابن أبي طلحة، عن ابن عباس: {ما ننسخ من آية} ما نبدل من آية' IN t.content) > 0
      AND position('وقال ابن جريج، عن مجاهد: {ما ننسخ من آية} أي: ما نمح من' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.8.61'
      AND position('فيه نظر أيضا؛ لأن آية براءة فيها الأمر بقتالهم إذا أمكن ذلك' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'hard-topic phrases are not in the library text';
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'sword-verse';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%وبين أحد من المشركين، وكل عهد، وكل مدة%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE WHEN btrim(circumstances) = '' THEN sword_extra ELSE circumstances || E'\n\n' || sword_extra END,
        circumstances_note = CASE
          WHEN btrim(circumstances_note) = '' THEN note
          WHEN circumstances_note LIKE '%2:545%' THEN circumstances_note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', a::extensions.ltree, 1100 + o
    FROM unnest(ARRAY['tafsir_ibn_kathir.9.5', 'ibn_hisham.2.545.2']) WITH ORDINALITY AS u(a, o)
    WHERE NOT EXISTS (SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = a::extensions.ltree);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'sword-verse', 'added', 'circumstances'),
            'В обстоятельства добавлены полные слова ад-Даххака у Ибн Касира и объявление у Ибн Хишама. Вывода нет.',
            'migration:076');
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'jizya-verse';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%قتال أهل الكتابين%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE WHEN btrim(circumstances) = '' THEN jizya_extra ELSE circumstances || E'\n\n' || jizya_extra END,
        circumstances_note = CASE
          WHEN btrim(circumstances_note) = '' THEN note
          WHEN circumstances_note LIKE '%9:28%' THEN circumstances_note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', 'tafsir_ibn_kathir.9.28'::extensions.ltree, 1100
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = 'tafsir_ibn_kathir.9.28'::extensions.ltree
    );
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'jizya-verse', 'added', 'circumstances'),
            'В обстоятельства добавлены слова Ибн Касира к 9:28 о девятом годе. Вывода нет.',
            'migration:076');
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'fighting-those-who-fight';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%فكانت أول آية أنزلت في إذنه له في الحرب%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE WHEN btrim(circumstances) = '' THEN fight_extra ELSE circumstances || E'\n\n' || fight_extra END,
        circumstances_note = CASE
          WHEN btrim(circumstances_note) = '' THEN note
          WHEN circumstances_note LIKE '%1:467%' THEN circumstances_note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', 'ibn_hisham.1.467.3'::extensions.ltree, 1100
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = 'ibn_hisham.1.467.3'::extensions.ltree
    );
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'fighting-those-who-fight', 'added', 'circumstances'),
            'В обстоятельства добавлены слова Ибн Хишама 1:467 об аяте разрешения воевать. Вывода нет.',
            'migration:076');
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'no-compulsion';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%لا ندع أبناءنا%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE WHEN btrim(circumstances) = '' THEN compulsion_extra ELSE circumstances || E'\n\n' || compulsion_extra END,
        circumstances_note = CASE
          WHEN btrim(circumstances_note) = '' THEN note
          WHEN circumstances_note LIKE '%2682%' THEN circumstances_note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', 'abu_dawud.2682'::extensions.ltree, 1100
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = 'abu_dawud.2682'::extensions.ltree
    );
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'no-compulsion', 'added', 'circumstances'),
            'В обстоятельства добавлен рассказ Абу Дауда 2682 о детях ансаров. Вывода нет.',
            'migration:076');
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'non-combatants';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%وهي مشركة في عهد رسول الله%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE WHEN btrim(circumstances) = '' THEN noncombat_extra ELSE circumstances || E'\n\n' || noncombat_extra END,
        circumstances_note = CASE
          WHEN btrim(circumstances_note) = '' THEN note
          WHEN circumstances_note LIKE '%2620%' THEN circumstances_note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', 'bukhari.2620'::extensions.ltree, 1100
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = 'bukhari.2620'::extensions.ltree
    );
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'non-combatants', 'added', 'circumstances'),
            'В обстоятельства добавлены слова Асмы у аль-Бухари 2620. Вывода нет.',
            'migration:076');
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'naskh-war-verses';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%إذا أمكن ذلك%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE WHEN btrim(circumstances) = '' THEN naskh_extra ELSE circumstances || E'\n\n' || naskh_extra END,
        circumstances_note = CASE
          WHEN btrim(circumstances_note) = '' THEN note
          WHEN circumstances_note LIKE '%2:106%' THEN circumstances_note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', a::extensions.ltree, 1100 + o
    FROM unnest(ARRAY['tafsir_ibn_kathir.2.106', 'tafsir_ibn_kathir.8.61']) WITH ORDINALITY AS u(a, o)
    WHERE NOT EXISTS (SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = a::extensions.ltree);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'naskh-war-verses', 'added', 'circumstances'),
            'В обстоятельства добавлены два чтения 2:106 у Ибн Касира и продолжение его оговорки к 8:61. Вывода нет.',
            'migration:076');
  END IF;
END $$;
