-- 060: the Hanafi school in the three drafts built from the leads of the
-- author's archive (docs/PLAN.md, 13.11.2026): quotations from al-Marghinani's
-- «аль-Хидая» and Abu Yusuf's «Китаб аль-Харадж» (migration 058) added as
-- positions of the Sunni tradition. Same method as 054–057: every position a
-- quotation with its address, checked against the library; nothing written in
-- the name of a side; the topics stay drafts.
--
-- Each topic gets its positions only if it exists, the books are loaded and
-- the Hanafi positions are not there yet.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  pos int;
  note text := $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'hidaya.1.193.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kharaj_abu_yusuf.1.136.1')
  THEN
    RETURN;
  END IF;

  -- «Условия Умара»: Abu Yusuf on collecting the jizya and on churches, al-Marghinani on churches.
  SELECT id INTO tid FROM topics WHERE slug = 'dhimma-conditions';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE '%(ханафиты)%') THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Абу Юсуф (ханафиты)$p$, 'tradition',
      $p$О взимании джизьи: «ولا يضرب أحد من أهل الذمة في استيدائهم الجزية؛ ولا يقاموا في الشمس ولا غيرها، ولا يجعل عليهم في أبدانهم شيء من المكاره؛ ولكن يرفق بهم، ويحبسون حتى يؤدوا ما عليهم» (Харадж 1:136). Совет халифу: «أن تتقدم في الرفق بأهل ذمة نبيك وابن عمك محمد صلى الله عليه وسلم والتفقد لهم حتى لا يظلموا ولا يؤذوا ولا يكلفوا فوق طاقتهم ولا يؤخذ شيء من أموالهم إلا بحق يجب عليهم» (Харадж 1:138).$p$, note, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['kharaj_abu_yusuf.1.136.1', 'kharaj_abu_yusuf.1.138.1']) WITH ORDINALITY AS u(a, o);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Абу Юсуф (ханафиты)$p$, 'tradition',
      $p$Об отличиях людей договора и о церквях: «وينبغي مع هذا أن تختم رقابهم في وقت جباية جزية رءوسهم حتى يفرغ من عرضهم ثم تكسر الخواتيم»; «وأن يتقدم في أن لا يترك أحد منهم يتشبه بالمسلمين في لباسه ولا في مركبه ولا في هيئته»; «ويمنعوا من أن يحدثوا بناء بيعة أو كنيسة في المدينة إلا ما كانوا صولحوا عليه وصاروا ذمة وهي بيعة لهم أو كنيسة؛ فما كان كذلك تركت لهم ولم تهدم» (Харадж 1:140). О договорах при завоевании городов: «وفتحت المدن على أن لا تهدم بيعهم ولا كنائسهم داخل المدينة ولا خارجها، وعلى أن يحقنوا لهم دماءهم، وعلى أن يقاتلوا من ناوأهم من عدوهم ويذبوا عنهم» (Харадж 1:152).$p$, note, pos + 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['kharaj_abu_yusuf.1.140.1', 'kharaj_abu_yusuf.1.152.1']) WITH ORDINALITY AS u(a, o);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аль-Маргинани (ханафиты)$p$, 'tradition',
      $p$О церквях: «ولا يجوز إحداث بيعة ولا كنيسة في دار الإسلام» и «وإن انهدمت البيع والكنائس القديمة أعادوها»; там же: «وهذا في الأمصار دون القرى» (Хидая 2:405).$p$, note, pos + 2
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'hidaya.2.405.1', 0);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'dhimma-conditions', 'added_positions', 3),
            'Добавлена ханафитская позиция («Китаб аль-Харадж», «аль-Хидая»); специалистом не проверена.', 'migration:060');
  END IF;

  -- «Превосходство арабов над неарабами»: equality in marriage by lineage.
  SELECT id INTO tid FROM topics WHERE slug = 'arab-superiority';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE '%(ханафиты)%') THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аль-Маргинани (ханафиты)$p$, 'tradition',
      $p$О равенстве в браке: «الكفاءة تعتبر في النسب»; «فقريش بعضهم أكفاء لبعض والعرب بعضهم أكفاء لبعض» — с опорой на хадис «والموالي بعضهم أكفاء لبعض رجل برجل». Довод: «لأن الشريفة تأبى أن تكون مستفرشة للخسيس». Следствие: «وإذا زوجت المرأة نفسها من غير كفء فللأولياء أن يفرقوا بينهما» (Хидая 1:196).$p$,
      $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. Оценку достоверности хадиса, на который опирается автор, нужно добавить.$p$, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'hidaya.1.196.1', 0);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'arab-superiority', 'added_positions', 1),
            'Добавлена ханафитская позиция («аль-Хидая»); специалистом не проверена.', 'migration:060');
  END IF;

  -- «Брак с несовершеннолетними»: who may marry off a minor, the option at puberty, waiting period and maintenance.
  SELECT id INTO tid FROM topics WHERE slug = 'minor-marriage';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE '%(ханафиты)%') THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аль-Маргинани (ханафиты)$p$, 'tradition',
      $p$О том, кто может выдать замуж малолетних: «ويجوز نكاح الصغير والصغيرة إذا زوجهما الولي بكرا كانت الصغيرة أو ثيبا والولي هو العصبة». О расхождении с другими школами: «ومالك رحمه الله يخالفنا في غير الأب والشافعي رحمه الله في غير الأب والجد وفي الثيب الصغيرة أيضا». О праве выбора после совершеннолетия: «وإن زوجهما غير الأب والجد فلكل واحد منهما الخيار إذا بلغ إن شاء اقام على النكاح وإن شاء فسخ» (Хидая 1:193).$p$, note, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'hidaya.1.193.1', 0);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аль-Маргинани (ханафиты)$p$, 'tradition',
      $p$О сроке ожидания: «وإن كانت ممن لا تحيض من صغر أو كبر فعدتها ثلاثة أشهر» — со ссылкой на аят 65:4 (Хидая 2:275). О содержании жены: «وإن كانت صغيرة لا يستمتع بها فلا نفقة لها» (Хидая 2:286).$p$, note, pos + 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['hidaya.2.275.1', 'hidaya.2.286.1']) WITH ORDINALITY AS u(a, o);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'minor-marriage', 'added_positions', 2),
            'Добавлена ханафитская позиция («аль-Хидая»); специалистом не проверена.', 'migration:060');
  END IF;
END $$;
