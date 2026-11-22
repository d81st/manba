-- 093: a draft of the hard topic «Хайбар: Сафийя и Кинана» (docs/PLAN.md,
-- 22.11.2026), the third sira theme of the critic's posts in the author's
-- archive. The hadiths and the early histories side by side: Safiyya's
-- captivity, freeing and marriage, the reports of her choosing Islam, and the
-- treaty condition and the death of Kinana ibn al-Rabi'. Every position a
-- quotation with its address, checked against the library; the critic
-- without his tone. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
  history_note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Это рассказы ранних историков; их надёжность оценивают хадисоведы и историки — их позиции нужно добавить.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'khaybar-safiyya-kinana')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.4211')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ibn_hisham.2.337.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'maghazi_waqidi.2.707.2')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'abu_dawud.3006')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('khaybar-safiyya-kinana', 'hard', 'draft', 'migration:093', 'migration:093')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Хайбар: Сафийя и Кинана$p$,
    $p$Что хадисы и ранние историки рассказывают о Сафийе бинт Хуйай — её плене, освобождении и браке с пророком — и о казни её мужа Кинаны ибн ар-Раби после взятия Хайбара?$p$,
    $p$Ат-Табари датирует поход: «ثم دخلت سنة سبع، فخرج رسول الله ص في بقية المحرم إلى خيبر» (Табари 3:9). Ибн Исхак: в крепости аль-Камус взяты пленницы, «منهن صفية بنت حيي بن أخطب، وكانت عند كنانة بن الربيع بن أبي الحقيق» (Ибн Хишам 2:331). После осады остальных крепостей: «فصالحهم رسول الله صلى الله عليه وسلم على النصف، على أنا إذا شئنا أن نخرجكم أخرجناكم» (Ибн Хишам 2:337).$p$,
    $p$Собрано 22.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. В «аль-Кафи» сообщений о Сафийе и Кинане не найдено; позиций шиитских авторов, исследователей и оценок хадисоведов для рассказов историков нужно добавить с источниками. Рассказ об отравленной овце в Хайбаре — в связанных фрагментах.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'bukhari.4200', 0),
    ('main', 'bukhari.4211', 1),
    ('main', 'ibn_hisham.2.337.1', 2),
    ('circumstances', 'tarikh_tabari.3.9.2', 0),
    ('circumstances', 'ibn_hisham.2.331.1', 1),
    ('circumstances', 'ibn_hisham.2.337.2', 2),
    ('related', 'bukhari.371', 0),
    ('related', 'muslim.1365.3', 1),
    ('related', 'tarikh_tabari.3.14.1', 2),
    ('related', 'bukhari.3169', 3),
    ('related', 'bukhari.4428', 4)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы Анаса у аль-Бухари и Муслима$p$, 'tradition',
    $p$«فقتل النبي صلى الله عليه وسلم المقاتلة، وسبى الذرية، وكان في السبي صفية، فصارت إلى دحية الكلبي، ثم صارت إلى النبي صلى الله عليه وسلم، فجعل عتقها صداقها» (Бухари 4200). «ذكر له جمال صفية بنت حيي بن أخطب، وقد قتل زوجها وكانت عروسا، فاصطفاها النبي صلى الله عليه وسلم لنفسه»; «حتى بلغنا سد الصهباء حلت، فبنى بها رسول الله صلى الله عليه وسلم» (Бухари 4211). Вопрос сподвижников: «إحدى أمهات المؤمنين، أو ما ملكت يمينه؟ قالوا: إن حجبها فهي إحدى أمهات المؤمنين، وإن لم يحجبها فهي مما ملكت يمينه»; «ومد الحجاب» (Бухари 4213). Во многих передачах: «أنه أعتق صفية وجعل عتقها صداقها» (Муслим 1365).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.4200', 'bukhari.4211', 'bukhari.4213', 'muslim.1365.4']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Исхак у Ибн Хишама (так же у ат-Табари)$p$, 'tradition',
    $p$О Сафийе: «وأمر بصفية فحيزت خلفه، وألقى عليها رداءه، فعرف المسلمون أن رسول الله صلى الله عليه وسلم قد اصطفاها لنفسه»; слова пророка Билялу, проведшему пленниц мимо убитых: «أنزعت منك الرحمة يا بلال، حين تمر بامرأتين على قتلى رجالهما؟»; её сон и Кинана: «فلطم وجهها لطمة خضر عينها منها» (Ибн Хишам 2:336). О Кинане: «وكان عنده كنز بني النضير، فسأله عنه، فجحد أن يكون يعرف مكانه» (Ибн Хишам 2:336); «فأخرج منها بعض كنزهم، ثم سأله عما بقي، فأبى أن يؤديه»; «عذبه حتى تستأصل ما عنده»; «ثم دفعه رسول الله صلى الله عليه وسلم إلى محمد بن مسلمة، فضرب عنقه بأخيه محمود بن مسلمة» (Ибн Хишам 2:337; тот же рассказ — Табари 3:14).$p$, history_note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['ibn_hisham.2.336.2', 'ibn_hisham.2.336.3', 'ibn_hisham.2.337.1', 'tarikh_tabari.3.14.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Вакиди, «аль-Магази»$p$, 'tradition',
    $p$Условие договора с Ибн Абу аль-Хукайком: «وبرئت منكم ذمة الله وذمة رسوله إن كتمتموني شيئا» (Вакиди 2:671). Когда клад нашли: «أمر رسول الله صلى الله عليه وسلم الزبير أن يعذب كنانة بن أبي الحقيق حتى يستخرج كل ما عنده» (Вакиди 2:672); «فقتله محمد بن مسلمة»; «واستحل رسول الله صلى الله عليه وسلم بذلك أموالهما وسبى ذراريهما» (Вакиди 2:673). О Сафийе со слов Анаса: «إن تكوني على دينك لم نكرهك، فإن اخترت الله ورسوله اتخذتك لنفسي. قالت: بل أختار الله ورسوله. قال: فأعتقها فتزوجها وجعل عتقها مهرها» (Вакиди 2:707).$p$, history_note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['maghazi_waqidi.2.671.1', 'maghazi_waqidi.2.672.1', 'maghazi_waqidi.2.673.1', 'maghazi_waqidi.2.707.2']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис Ибн Умара у Абу Дауда (3006)$p$, 'tradition',
    $p$Условие мира: «فصالحوه على أن لرسول الله صلى الله عليه وسلم الصفراء والبيضاء والحلقة ولهم ما حملت ركابهم على أن لا يكتموا ولا يغيبوا شيئا فإن فعلوا فلا ذمة لهم ولا عهد»; «فغيبوا مسكا لحيي بن أخطب»; «فوجدوا المسك فقتل بن الحقيق وسبي نساءهم وذراريهم» (Абу Дауд 3006).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. В самой передаче стоит «قال أحسبه عن نافع» — передатчик не уверен в звене; оценку иснада хадисоведами нужно добавить.$p$, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'abu_dawud.3006', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ат-Табари, раздел о жёнах пророка$p$, 'tradition',
    $p$О Кинане: «فقتله محمد بن مسلمه بأمر النبي ص، ضرب عنقه صبرا». О Сафийе: «فلما تصفح النبي ص السبي يوم خيبر، ألقى رداءه على صفية، فكانت صفية يوم خيبر، ثم عرض عليها الإسلام فأسلمت، فأعتقها» (Табари 3:166).$p$, history_note, 4
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tarikh_tabari.3.166.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят хадисы о том, что Сафийю выбрали после рассказа о её красоте, когда её муж был убит (Бухари 4211), и что она попала в плен вместе с другими после гибели воинов её народа (Бухари 4200); считают, что пророк взял её себе, сделав пленницей, и что достоверных сведений о принятии ею ислама нет.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Рассказы о том, что она выбрала ислам, — у аль-Вакиди и ат-Табари (выше). Степень признания здесь условна: это полемика, а не исследование.$p$, 5
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.4211', 'bukhari.4200']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug IN ('rayhana', 'slavery-and-concubines')
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug IN ('rayhana', 'slavery-and-concubines');

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'khaybar-safiyya-kinana', 'status', 'draft', 'positions', 6),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:093');
END $$;
