-- 062: the Maliki and Hanbali views in the three drafts built from the leads
-- of the author's archive (docs/PLAN.md, 13.11.2026), as two authors of
-- comparative law report them: Ibn Rushd («Бидаят аль-муджтахид», a Maliki)
-- and Ibn Hubayra («Ихтиляф аль-аимма», a Hanbali) — books of migration 061.
-- Same method as 054–060: every position a quotation with its address,
-- checked against the library; the topics stay drafts.
--
-- Each topic gets its positions only if it exists, the books are loaded and
-- these positions are not there yet. Migrations run before the import, so on
-- the server this one takes effect only on the start after the books are in.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  pos int;
  note text := $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. Это изложение мнений школ у автора книги, а не книги самих школ; формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ikhtilaf_aimma.2.123.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bidayat_mujtahid.3.34.1')
  THEN
    RETURN;
  END IF;

  -- «Условия Умара»: churches in the four schools.
  SELECT id INTO tid FROM topics WHERE slug = 'dhimma-conditions';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE '%о мнениях школ%') THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Хубайра (ханбалит) о мнениях школ$p$, 'tradition',
      $p$О новых церквях: «واتفقوا على أنه لا يجوز لهم إحداث كنيسة ولا بيعة في المدن والأمصار في بلاد الإسلام». О восстановлении обветшавших и разрушенных: «فقال أبو حنيفة والشافعي: يجوز واشترط أبو حنيفة في الجواز أن يكون ذلك في أرض فتحت صلحا، فأما إن كانت أرض عنوة فلا يجوز»; «وقال أحمد في اظهر رواياته: لا يجوز لهم ذلك بمرمة ولا تجديد بناء على الإطلاق» (Ихтиляф 2:337). От Ахмада передают ещё два мнения: «يجوز عمارة ما تشعث منها بالمرمة، فإما إن استولى عليها الخراب فلا يجوز بناؤها» и «والثالثة عنه: جواز ذلك على الإطلاق» (Ихтиляф 2:338).$p$, note, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['ikhtilaf_aimma.2.337.1', 'ikhtilaf_aimma.2.338.1']) WITH ORDINALITY AS u(a, o);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'dhimma-conditions', 'added_positions', 1),
            'Добавлены мнения четырёх школ о церквях по «Ихтиляф аль-аимма»; специалистом не проверено.', 'migration:062');
  END IF;

  -- «Превосходство арабов над неарабами»: lineage in equality of marriage.
  SELECT id INTO tid FROM topics WHERE slug = 'arab-superiority';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE '%о мнениях школ%') THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Рушд (маликит) о мнениях школ$p$, 'tradition',
      $p$О происхождении в равенстве в браке: «فالمشهور عن مالك أنه يجوز نكاح الموالي من العرب، وأنه احتج لذلك بقوله تعالى: {إن أكرمكم عند الله أتقاكم}»; «وقال سفيان الثوري، وأحمد: لا تزوج العربية من مولى. وقال أبو حنيفة، وأصحابه: لا تزوج قرشية إلا من قرشي، ولا عربية إلا من عربي» (Бидая 3:42). Аят, на который опирается Малик, — 49:13.$p$, note, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['bidayat_mujtahid.3.42.2', 'quran.49.13']) WITH ORDINALITY AS u(a, o);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Хубайра (ханбалит) о мнениях школ$p$, 'tradition',
      $p$Об условиях равенства в браке: у Малика — «أنها الدين والحرية والسلامة من العيوب الموجبة للرد», в другой передаче — «الكفاءة في الدين فحسب»; у аш-Шафии — «هي خمسة: النسب والدين والحرية والصناعة والمال، في أحد الوجهين» (Ихтиляф 2:134). О браке без равенства: «فقال أبو حنيفة: فقد الكفاءة يوجب للأولياء حق الاعتراض»; «وقال مالك: لا يبطل النكاح فقدها» (Ихтиляф 2:135).$p$, note, pos + 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['ikhtilaf_aimma.2.134.1', 'ikhtilaf_aimma.2.135.1']) WITH ORDINALITY AS u(a, o);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'arab-superiority', 'added_positions', 2),
            'Добавлены мнения школ о происхождении в равенстве в браке по «Бидаят аль-муджтахид» и «Ихтиляф аль-аимма»; специалистом не проверено.', 'migration:062');
  END IF;

  -- «Брак с несовершеннолетними»: the agreement and the differences of the schools.
  SELECT id INTO tid FROM topics WHERE slug = 'minor-marriage';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE '%о мнениях школ%') THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Рушд (маликит) о мнениях школ$p$, 'tradition',
      $p$О согласии школ: «واتفقوا على أن الأب يجبر ابنه الصغير على النكاح، وكذلك ابنته الصغيرة البكر ولا يستأمرها» — с оговоркой: «إلا ما روي من الخلاف عن ابن شبرمة». О том, может ли выдать малолетнюю не отец: «فقال الشافعي: يزوجها الجد أبو الأب والأب فقط. وقال مالك: لا يزوجها إلا الأب فقط»; «وقال أبو حنيفة: يزوج الصغيرة كل من له عليها ولاية من أب وقريب وغير ذلك، ولها الخيار إذا بلغت» (Бидая 3:34).$p$, note, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bidayat_mujtahid.3.34.1', 0);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Хубайра (ханбалит) о мнениях школ$p$, 'tradition',
      $p$Мнение, которое передают от Ахмада: «وقال أحمد: إذا بلغت تسع سنين لم تزوج إلا بإذنها في حق كل ولي، الأب وغيره». И о согласии школ: «واتفقوا على أن الأب يجبر ابنته الصغيرة من بناته ما عدا هذه الرواية عن أحمد التي ذكرت آنفا» (Ихтиляф 2:123).$p$, note, pos + 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ikhtilaf_aimma.2.123.1', 0);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'minor-marriage', 'added_positions', 2),
            'Добавлены мнения школ по «Бидаят аль-муджтахид» и «Ихтиляф аль-аимма»; специалистом не проверено.', 'migration:062');
  END IF;
END $$;
