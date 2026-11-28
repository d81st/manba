-- 102: a draft topic on al-Hakim's gradings in «al-Mustadrak» (docs/PLAN.md,
-- 28.11.2026), from the leads in docs/topics/hakim-mustadrak-leads.md: the
-- pages named there, opened in the books themselves (al-Dhahabi's «Mizan»,
-- Ibn Taymiyya's «Majmu' al-fatawa», vol. 22, Ibn al-Qayyim's «al-Furusiyya»),
-- and al-Hakim's own words with al-Dhahabi's remarks in «al-Mustadrak». A
-- question inside the Sunni science of hadith, not outside criticism. Every
-- quotation is checked against the library. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'hakim-mustadrak-gradings')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'mustadrak.4231')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'mizan_itidal.3.608.2')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'majmu_fatawa.22.426.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'furusiyya.1.276.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('hakim-mustadrak-gradings', 'general', 'draft', 'migration:102', 'migration:102')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Оценки аль-Хакима в «аль-Мустадраке»$p$,
    $p$Насколько учёные хадиса доверяют оценке «достоверно», которую аль-Хаким ан-Найсабури (ум. 405/1014) даёт хадисам в «аль-Мустадраке», и что пишут об этом ад-Захаби, Ибн Таймия и Ибн аль-Каййим?$p$,
    $p$«аль-Мустадрак ала ас-Сахихайн» собирает хадисы, которых нет у аль-Бухари и Муслима. После хадиса аль-Хаким пишет свою оценку: «هذا حديث صحيح على شرط الشيخين، ولم يخرجاه» (Мустадрак 4650) или «هذا حديث صحيح الإسناد ولم يخرجاه» (Мустадрак 4231). В издании после хадисов напечатаны пометы ад-Захаби из его «Тальхиса»; иногда он согласен — «لم يتكلم عليه المؤلف وهو صحيح» (Мустадрак 1), иногда поправляет довод аль-Хакима — «ما احتج مسلم بمحمد بن عمرو منفردا بل بانضمامه إلى غيره» (Мустадрак 10).$p$,
    $p$Собрано 28.11.2026 по наводкам из подборки высказываний учёных, присланной автором (`docs/topics/hakim-mustadrak-leads.md`); страницы открыты в самих книгах. Подбор цитат и формулировки специалист не проверял. Предисловие аль-Хакима к «аль-Мустадраку» (где он описывает свои условия) в библиотеку не вошло: загружены только хадисы. Объяснений тех, кто оправдывает оценки аль-Хакима (например, что книга осталась черновиком), шиитских авторов, которые опираются на «аль-Мустадрак», «Табакат уляма аль-хадис» Ибн Абд аль-Хади и современных разборов из подборки (Мукбиль ибн Хади, Ибрахим аль-Ляхим, Абдуллах аль-Хулейфи) в библиотеке нет — их нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'mustadrak.4231', 0),
    ('main', 'mustadrak.4650', 1),
    ('main', 'mizan_itidal.3.608.2', 2),
    ('circumstances', 'mustadrak.1', 0),
    ('circumstances', 'mustadrak.10', 1),
    ('circumstances', 'mustadrak.4231', 2),
    ('circumstances', 'mustadrak.4650', 3),
    ('related', 'mizan_itidal.4.441.2', 0),
    ('related', 'mustadrak.2335', 1),
    ('related', 'mustadrak.4651', 2)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Хаким о своих оценках$p$, 'minority',
    $p$О хадисе о птице, который он признаёт достоверным по условиям аль-Бухари и Муслима: «وقد رواه عن أنس جماعة من أصحابه زيادة على ثلاثين نفسا، ثم صحت الرواية عن علي وأبي سعيد الخدري وسفينة» (Мустадрак 4650). О хадисе об Ильясе: «هذا حديث صحيح الإسناد ولم يخرجاه» (Мустадрак 4231).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Степень «меньшинство» относится к тому, что оценки аль-Хакима принимаются сами по себе; позиции учёных, защищающих его оценки, нужно добавить по их книгам.$p$, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['mustadrak.4650', 'mustadrak.4231']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ад-Захаби («Мизан аль-итидаль» и пометы из «Тальхиса»)$p$, 'tradition',
    $p$Об аль-Хакиме: «إمام صدوق، لكنه يصحح في مستدركه أحاديث ساقطة، ويكثر من ذلك» и «فأما صدقه في نفسه ومعرفته بهذا الشأن فأمر مجمع عليه». На слова Абу Исмаила аль-Ансари «إمام في الحديث رافضي خبيث» отвечает: «الله يحب الانصاف، ما الرجل برافضى، بل شيعي فقط» (Мизан 3:608). О хадисе об Ильясе: «فما استحيى الحاكم من الله يصحح مثل» (Мизан 4:441); в помете к нему же в «аль-Мустадраке» — «بل موضوع قبح الله من وضعه» (Мустадрак 4231). К другому хадису — «موضوع وابن حسان كذاب» (Мустадрак 2335).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. В «Мизане» строка оборвана на «مثل» номером сноски редактора; дальше в издании — «هذا». Пометы ад-Захаби к разным хадисам различаются: где-то он соглашается, где-то молчит, где-то называет хадис выдуманным — как часто, нужно посчитать по всей книге.$p$, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['mizan_itidal.3.608.2', 'mizan_itidal.4.441.2', 'mustadrak.4231', 'mustadrak.2335']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Таймия («Маджму аль-фатава»)$p$, 'tradition',
    $p$«أن تصحيح الحاكم وحده وتوثيقه وحده لا يوثق به فيما دون هذا»; учёные согласны, что аль-Хаким снисходителен в признании достоверности, «تصحيحه دون تصحيح الترمذي والدارقطني وأمثالهما بلا نزاع»; «وكثيرا ما يصحح الحاكم أحاديث يجزم بأنها موضوعة لا أصل لها» (Маджму 22:426).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Сказано в разборе передачи аль-Му‘тамира ибн Сулаймана о чтении «бисмиллях» вслух в намазе: аль-Хаким признал передатчика надёжным, а Ибн Таймия противопоставляет этому то, что передано в «Сахихах».$p$, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'majmu_fatawa.22.426.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Каййим («аль-Фурусийя»)$p$, 'tradition',
    $p$Хадис о третьем коне в состязании аль-Хаким назвал: «هو صحيح الإسناد» (Фурусийя 1:214). Ответ: «والحاكم نفسه يصحح أحاديث جماعة وقد أخبر في كتاب المدخل له أن لا يحتج بهم»; «وقد علم أن صحة الإسناد شرط من شروط صحة الحديث وليست موجبة لصحته» (Фурусийя 1:245). Об ад-Даракутни и хадисе о птице: «يستدرك عليهما حديث الطير فبلغ ذلك الحاكم فضرب عليه من كتابه»; итог: «وبالجملة فتصحيح الحاكم لا يستفاد منه حسن الحديث ألبتة فضلا عن صحته» (Фурусийя 1:276).$p$,
    $p$Подобрано по текстам библиотеки 28.11.2026; специалистом не проверено. Слова на с. 245 стоят в доводах, которые автор излагает от лица сторонников одного из мнений о посреднике в состязании («قالوا»); чьё это мнение у самого автора, проверяет специалист. В подборке, присланной автором, названы с. 185–186 и 213–214: на с. 185–186 этого издания речь о другом, а слова об оценках аль-Хакима — на с. 214, 245 и 276.$p$, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['furusiyya.1.214.1', 'furusiyya.1.245.1', 'furusiyya.1.276.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'hakim-mustadrak-gradings', 'status', 'draft', 'positions', 4),
          'Черновик собран по текстам библиотеки по наводкам из подборки, присланной автором; специалистом не проверен.', 'migration:102');
END $$;
