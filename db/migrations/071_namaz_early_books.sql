-- 071: add to the namaz topic what Ibn Hisham, al-Mughni and al-Musannaf say
-- about the number of prayers, the qibla and the adhan (docs/PLAN.md, 17.11.2026).
-- Quotations only. An existing circumstances text is kept and this paragraph
-- is appended. A database without the topic is left alone.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  extra text := $p$«Сира» Ибн Хишама: «ففرض عليه خمسين صلاة في كل يوم» (1:407); «حتى انتهيت إلى أن وضع ذلك عني، إلا خمس صلوات في كل يوم وليلة» (1:408). Кибла: «ولما صرفت القبلة عن الشام إلى الكعبة، وصرفت في رجب على رأس سبعة عشر شهرا من مقدم رسول الله صلى الله عليه وسلم المدينة» (1:550). Призыв: «إذ رأى عبد الله بن زيد بن ثعلبة بن عبد ربه، أخو بلحارث بن الخزرج، النداء» (1:508). «аль-Мугни» 1:293 передаёт тот же рассказ: «لما أمر رسول الله - صلى الله عليه وسلم - بالناقوس يعمل ليضرب به لجمع الناس للصلاة». «аль-Мусаннаф» 1797: Ибн Умар «يقول: حي على الصلاة حي على الصلاة، حي على خير العمل».$p$;
  note text := $p$Добавлено 17.11.2026 из «Сиры» Ибн Хишама, «аль-Мугни» и «аль-Мусаннафа». Цитаты сверены со страницами. Степень признания предварительная, её проверяет специалист.$p$;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'namaz';
  IF tid IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM topic_texts
    WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%ففرض عليه خمسين صلاة في كل يوم%'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.1.407.1'
      AND position('ففرض عليه خمسين صلاة في كل يوم' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.1.408.1'
      AND position('حتى انتهيت إلى أن وضع ذلك عني، إلا خمس صلوات في كل يوم وليلة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.1.550.2'
      AND position('ولما صرفت القبلة عن الشام إلى الكعبة، وصرفت في رجب على رأس سبعة عشر شهرا من مقدم رسول الله صلى الله عليه وسلم المدينة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.1.508.3'
      AND position('إذ رأى عبد الله بن زيد بن ثعلبة بن عبد ربه، أخو بلحارث بن الخزرج، النداء' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'mughni.1.293.1'
      AND position('لما أمر رسول الله - صلى الله عليه وسلم - بالناقوس يعمل ليضرب به لجمع الناس للصلاة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'musannaf.1797'
      AND position('حي على الصلاة حي على الصلاة، حي على خير العمل' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'namaz early-book phrases are not in the library text';
  END IF;

  UPDATE topic_texts
  SET circumstances = CASE
        WHEN btrim(circumstances) = '' THEN extra
        ELSE circumstances || E'\n\n' || extra
      END,
      circumstances_note = CASE
        WHEN circumstances_note LIKE '%1:407%' THEN circumstances_note
        WHEN btrim(circumstances_note) = '' THEN note
        ELSE circumstances_note || ' ' || note
      END
  WHERE topic_id = tid AND locale = 'ru';

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, 'circumstances', a::extensions.ltree, 1000 + o
  FROM unnest(ARRAY[
    'ibn_hisham.1.407.1', 'ibn_hisham.1.408.1', 'ibn_hisham.1.550.2',
    'ibn_hisham.1.508.3', 'mughni.1.293.1', 'musannaf.1797'
  ]) WITH ORDINALITY AS u(a, o)
  WHERE NOT EXISTS (
    SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = a::extensions.ltree
  );

  IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Ибн Исхак у Ибн Хишама') THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Исхак у Ибн Хишама$p$, 'tradition',
      $p$«ففرض عليه خمسين صلاة في كل يوم» (Ибн Хишам 1:407). «حتى انتهيت إلى أن وضع ذلك عني، إلا خمس صلوات في كل يوم وليلة» (Ибн Хишам 1:408). «ولما صرفت القبلة عن الشام إلى الكعبة، وصرفت في رجب على رأس سبعة عشر شهرا من مقدم رسول الله صلى الله عليه وسلم المدينة» (Ибн Хишаم 1:550). «إذ رأى عبد الله بن زيد بن ثعلبة بن عبد ربه، أخو بلحارث بن الخزرج، النداء» (Ибн Хишаم 1:508).$p$,
      note, 10
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['ibn_hisham.1.407.1', 'ibn_hisham.1.408.1', 'ibn_hisham.1.550.2', 'ibn_hisham.1.508.3']) WITH ORDINALITY AS u(a, o);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Ибн Исхак в «аль-Мугни»') THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Исхак в «аль-Мугни»$p$, 'tradition',
      $p$«لما أمر رسول الله - صلى الله عليه وسلم - بالناقوس يعمل ليضرب به لجمع الناس للصلاة» («аль-Мугни» 1:293).$p$,
      note, 11
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    VALUES (tid, 'position', pid, 'mughni.1.293.1', 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Ибн Умар в «аль-Мусаннафе»') THEN
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Умар в «аль-Мусаннафе»$p$, 'tradition',
      $p$«حي على الصلاة حي على الصلاة، حي على خير العمل» («аль-Мусаннаф» 1797).$p$,
      note, 12
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    VALUES (tid, 'position', pid, 'musannaf.1797', 0);
  END IF;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES (
    'topic', tid::text, 'updated',
    jsonb_build_object('slug', 'namaz', 'added', 'ibn_hisham,mughni,musannaf'),
    'В обстоятельства намаза добавлены цитаты Ибн Хишама, «аль-Мугни» и «аль-Мусаннафа» о числе молитв, кибле и призыве.',
    'migration:071'
  );
END $$;
