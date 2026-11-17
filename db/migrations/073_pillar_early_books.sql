-- 073: add to shahada, zakat, sawm and hajj what Ibn Hisham, al-Mughni and
-- al-Musannaf say, the same way 071 added it to namaz (docs/PLAN.md, 17.11.2026).
-- Quotations only. An existing circumstances text is kept and a paragraph is
-- appended. Status is not changed. A database without the topic is left alone.
-- War and ridda reports are not included.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Добавлено 17.11.2026 из «Сиры» Ибн Хишама, «аль-Мугни» и «аль-Мусаннафа». Цитаты сверены со страницами. Степень признания предварительная, её проверяет специалист.$p$;
  shahada_extra text := $p$«Сира» Ибн Хишама. У негуса: «فكان الذي كلمه جعفر بن أبي طالب (رضوان الله عليه)» (1:336); «فدعانا إلى الله لنوحده ونعبده، ونخلع ما كنا نعبد نحن وآباؤنا من دونه من الحجارة والأوثان» (1:336). Человек из бану Са'д ибн Бакр: «وبعث بنو سعد بن بكر إلى رسول الله صلى الله عليه وسلم رجلا منهم، يقال له ضمام بن ثعلبة» (2:573); «آلله أمرك أن تأمرنا أن نعبده وحده لا نشرك به شيئا» (2:574); «فإني أشهد أن لا إله إلا الله، وأشهد أن محمدا رسول الله» (2:574).$p$;
  zakat_extra text := $p$«Сира» Ибн Хишама: «استحكم أمر الإسلام، فقامت الصلاة، وفرضت الزكاة والصيام» (1:508). Тот же ضمام بن ثعلبة перечисляет предписания: «ثم جعل يذكر فرائض الإسلام فريضة فريضة. الزكاة والصيام والحج» (2:574).$p$;
  sawm_extra text := $p$«Сира» Ибн Хишама: «استحكم أمر الإسلام، فقامت الصلاة، وفرضت الزكاة والصيام» (1:508); «ثم جعل يذكر فرائض الإسلام فريضة فريضة. الزكاة والصيام والحج» (2:574). «аль-Мусаннаф» 7832, Абу Катада: «سئل النبي صلى الله عليه وسلم عن صيام يوم عاشوراء؟ فقال: «كفارة السنة»».$p$;
  hajj_extra text := $p$«Сира» Ибн Хишама: «فقضى رسول الله صلى الله عليه وسلم الحج وقد أراهم مناسكهم» (2:606); «فكانت حجة البلاغ، وحجة الوداع» (2:606). «аль-Мугни» 3:221, Ахмад: «حج النبي - صلى الله عليه وسلم - حجة الوداع»; «وروي عن مجاهد، أنه قال: حج قبل ذلك حجة أخرى. وما هو يثبت عندي». «аль-Мусанناф» 8812, от Зейда ибн Аслама: «أن النبي صلى الله عليه وسلم حج بنسائه حجة الوداع، ثم قال: «إنما هي هذه، ثم ظهور الحصر» يقول: «الزمن ظهور الحصر في بيوتكن»».$p$;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM topics WHERE slug IN ('shahada', 'zakat', 'sawm', 'hajj')
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.1.336.1'
      AND position('فكان الذي كلمه جعفر بن أبي طالب (رضوان الله عليه)' IN t.content) > 0
      AND position('فدعانا إلى الله لنوحده ونعبده، ونخلع ما كنا نعبد نحن وآباؤنا من دونه من الحجارة والأوثان' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.2.573.2'
      AND position('وبعث بنو سعد بن بكر إلى رسول الله صلى الله عليه وسلم رجلا منهم، يقال له ضمام بن ثعلبة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.2.574.1'
      AND position('آلله أمرك أن تأمرنا أن نعبده وحده لا نشرك به شيئا' IN t.content) > 0
      AND position('فإني أشهد أن لا إله إلا الله، وأشهد أن محمدا رسول الله' IN t.content) > 0
      AND position('ثم جعل يذكر فرائض الإسلام فريضة فريضة. الزكاة والصيام والحج' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.1.508.2'
      AND position('استحكم أمر الإسلام، فقامت الصلاة، وفرضت الزكاة والصيام' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'musannaf.7832'
      AND position('سئل النبي صلى الله عليه وسلم عن صيام يوم عاشوراء؟ فقال: «كفارة السنة»' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ibn_hisham.2.606.1'
      AND position('فقضى رسول الله صلى الله عليه وسلم الحج وقد أراهم مناسكهم' IN t.content) > 0
      AND position('فكانت حجة البلاغ، وحجة الوداع' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'mughni.3.221.2'
      AND position('قال أحمد: حج النبي - صلى الله عليه وسلم - حجة الوداع' IN t.content) > 0
      AND position('وروي عن مجاهد، أنه قال: حج قبل ذلك حجة أخرى. وما هو يثبت عندي' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'musannaf.8812'
      AND position('أن النبي صلى الله عليه وسلم حج بنسائه حجة الوداع، ثم قال: «إنما هي هذه، ثم ظهور الحصر» يقول: «الزمن ظهور الحصر في بيوتكن»' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'pillar early-book phrases are not in the library text';
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'shahada';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%ضمام بن ثعلبة%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE
          WHEN btrim(circumstances) = '' THEN shahada_extra
          ELSE circumstances || E'\n\n' || shahada_extra
        END,
        circumstances_note = CASE
          WHEN circumstances_note LIKE '%2:573%' THEN circumstances_note
          WHEN btrim(circumstances_note) = '' THEN note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';

    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', a::extensions.ltree, 1000 + o
    FROM unnest(ARRAY['ibn_hisham.1.336.1', 'ibn_hisham.2.573.2', 'ibn_hisham.2.574.1']) WITH ORDINALITY AS u(a, o)
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = a::extensions.ltree
    );

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Джафар ибн Аби Талиб у Ибн Хишама') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Джафар ибн Аби Талиб у Ибн Хишама$p$, 'tradition',
        $p$«فكان الذي كلمه جعفر بن أبي طالب (رضوان الله عليه)» (Ибн Хишам 1:336). «فدعانا إلى الله لنوحده ونعبده، ونخلع ما كنا نعبد نحن وآباؤنا من دونه من الحجارة والأوثان» (Ибн Хишам 1:336).$p$,
        note, 10
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      VALUES (tid, 'position', pid, 'ibn_hisham.1.336.1', 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'ضمام بن ثعلبة у Ибн Хишама') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$ضمام بن ثعلبة у Ибн Хишама$p$, 'tradition',
        $p$«وبعث بنو سعد بن بكر إلى رسول الله صلى الله عليه وسلم رجلا منهم، يقال له ضمام بن ثعلبة» (Ибн Хишам 2:573). «آلله أمرك أن تأمرنا أن نعبده وحده لا نشرك به شيئا» (Ибн Хишам 2:574). «فإني أشهد أن لا إله إلا الله، وأشهد أن محمدا رسول الله» (Ибن Хишам 2:574).$p$,
        note, 11
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      SELECT tid, 'position', pid, a::extensions.ltree, o
      FROM unnest(ARRAY['ibn_hisham.2.573.2', 'ibn_hisham.2.574.1']) WITH ORDINALITY AS u(a, o);
    END IF;

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'shahada', 'added', 'ibn_hisham'),
      'В обстоятельства шахады добавлены рассказы Джафара ибн Аби Талиба и ضمام بن ثعلبة из «Сиры» Ибн Хишама.',
      'migration:073'
    );
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'zakat';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%فرضت الزكاة والصيام%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE
          WHEN btrim(circumstances) = '' THEN zakat_extra
          ELSE circumstances || E'\n\n' || zakat_extra
        END,
        circumstances_note = CASE
          WHEN circumstances_note LIKE '%1:508%' THEN circumstances_note
          WHEN btrim(circumstances_note) = '' THEN note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';

    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', a::extensions.ltree, 1000 + o
    FROM unnest(ARRAY['ibn_hisham.1.508.2', 'ibn_hisham.2.574.1']) WITH ORDINALITY AS u(a, o)
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = a::extensions.ltree
    );

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Ибн Исхак у Ибн Хишама') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Ибн Исхак у Ибн Хишама$p$, 'tradition',
        $p$«استحكم أمر الإسلام، فقامت الصلاة، وفرضت الزكاة والصيام» (Ибн Хишам 1:508). «ثم جعل يذكر فرائض الإسلام فريضة فريضة. الزكاة والصيام والحج» (Ибн Хишам 2:574).$p$,
        note, 10
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      SELECT tid, 'position', pid, a::extensions.ltree, o
      FROM unnest(ARRAY['ibn_hisham.1.508.2', 'ibn_hisham.2.574.1']) WITH ORDINALITY AS u(a, o);
    END IF;

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'zakat', 'added', 'ibn_hisham'),
      'В обстоятельства закята добавлены две фразы «Сиры» Ибн Хишама о предписании закята. Рассказы о войне с отказавшимися платить не добавлялись.',
      'migration:073'
    );
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'sawm';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%كفارة السنة%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE
          WHEN btrim(circumstances) = '' THEN sawm_extra
          ELSE circumstances || E'\n\n' || sawm_extra
        END,
        circumstances_note = CASE
          WHEN circumstances_note LIKE '%7832%' THEN circumstances_note
          WHEN btrim(circumstances_note) = '' THEN note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';

    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', a::extensions.ltree, 1000 + o
    FROM unnest(ARRAY['ibn_hisham.1.508.2', 'ibn_hisham.2.574.1', 'musannaf.7832']) WITH ORDINALITY AS u(a, o)
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = a::extensions.ltree
    );

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Ибн Исхак у Ибн Хишама') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Ибн Исхак у Ибн Хишама$p$, 'tradition',
        $p$«استحكم أمر الإسلام، فقامت الصلاة، وفرضت الزكاة والصيام» (Ибн Хишам 1:508). «ثم جعل يذكر فرائض الإسلام فريضة فريضة. الزكاة والصيام والحج» (Ибн Хишам 2:574).$p$,
        note, 10
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      SELECT tid, 'position', pid, a::extensions.ltree, o
      FROM unnest(ARRAY['ibn_hisham.1.508.2', 'ibn_hisham.2.574.1']) WITH ORDINALITY AS u(a, o);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Абу Катада в «аль-Мусаннафе»') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Абу Катада в «аль-Мусаннафе»$p$, 'tradition',
        $p$«سئل النبي صلى الله عليه وسلم عن صيام يوم عاشوراء؟ فقال: «كفارة السنة»» («аль-Мусаннаф» 7832).$p$,
        note, 11
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      VALUES (tid, 'position', pid, 'musannaf.7832', 0);
    END IF;

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'sawm', 'added', 'ibn_hisham,musannaf'),
      'В обстоятельства поста добавлены фразы «Сиры» Ибн Хишама и ответ об Ашуре в «аль-Мусаннафе» 7832.',
      'migration:073'
    );
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'hajj';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM topic_texts WHERE topic_id = tid AND locale = 'ru')
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND circumstances LIKE '%حجة البلاغ%'
     ) THEN
    UPDATE topic_texts
    SET circumstances = CASE
          WHEN btrim(circumstances) = '' THEN hajj_extra
          ELSE circumstances || E'\n\n' || hajj_extra
        END,
        circumstances_note = CASE
          WHEN circumstances_note LIKE '%2:606%' THEN circumstances_note
          WHEN btrim(circumstances_note) = '' THEN note
          ELSE circumstances_note || ' ' || note
        END
    WHERE topic_id = tid AND locale = 'ru';

    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, 'circumstances', a::extensions.ltree, 1000 + o
    FROM unnest(ARRAY['ibn_hisham.2.606.1', 'mughni.3.221.2', 'musannaf.8812']) WITH ORDINALITY AS u(a, o)
    WHERE NOT EXISTS (
      SELECT 1 FROM topic_refs r WHERE r.topic_id = tid AND r.address = a::extensions.ltree
    );

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Ибн Исхак у Ибн Хишама') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Ибн Исхак у Ибн Хишама$p$, 'tradition',
        $p$«فقضى رسول الله صلى الله عليه وسلم الحج وقد أراهم مناسكهم» (Ибн Хишам 2:606). «فكانت حجة البلاغ، وحجة الوداع» (Ибн Хишам 2:606).$p$,
        note, 10
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      VALUES (tid, 'position', pid, 'ibn_hisham.2.606.1', 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Ахмад в «аль-Мугни»') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Ахмад в «аль-Мугни»$p$, 'tradition',
        $p$«حج النبي - صلى الله عليه وسلم - حجة الوداع» («аль-Мугни» 3:221). «وروي عن مجاهد، أنه قال: حج قبل ذلك حجة أخرى. وما هو يثبت عندي» («аль-Мугни» 3:221).$p$,
        note, 11
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      VALUES (tid, 'position', pid, 'mughni.3.221.2', 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Муджахид в «аль-Мугни»') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Муджахид в «аль-Мугни»$p$, 'minority',
        $p$«حج قبل ذلك حجة أخرى» («аль-Мугни» 3:221). Там же Ахмад: «وما هو يثبت عندي».$p$,
        note, 12
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      VALUES (tid, 'position', pid, 'mughni.3.221.2', 1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder = 'Зейд ибн Аслам в «аль-Мусаннафе»') THEN
      INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
      SELECT tid, s.id, 'ru', $p$Зейд ибн Аслам в «аль-Мусаннафе»$p$, 'tradition',
        $p$«أن النبي صلى الله عليه وسلم حج بنسائه حجة الوداع، ثم قال: «إنما هي هذه، ثم ظهور الحصر» يقول: «الزمن ظهور الحصر في بيوتكن»» («аль-Мусаннаф» 8812).$p$,
        note, 13
      FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
      INSERT INTO topic_refs (topic_id, role, position_id, address, position)
      VALUES (tid, 'position', pid, 'musannaf.8812', 0);
    END IF;

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'hajj', 'added', 'ibn_hisham,mughni,musannaf'),
      'В обстоятельства хаджа добавлены прощальный хадж у Ибн Хишама, слова Ахмада и Муджахида в «аль-Мугни» и рассказ Зейда ибн Аслама в «аль-Мусаннафе».',
      'migration:073'
    );
  END IF;
END $$;
