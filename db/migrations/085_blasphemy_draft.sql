-- 085: a draft of the hard topic «Оскорбление пророка» (docs/PLAN.md,
-- 22.11.2026), the next theme of the critic's posts in the author's archive
-- (Ibn Taymiyya's «ас-Сарим аль-маслюль», migration 084). Same method as
-- 054–083: every position a quotation with its address, checked against the
-- library; the critic without his tone. Classical rulings are shown only
-- here, with the other schools and the reports of pardon beside them
-- (CLAUDE.md, «Сложные темы»). The topic stays a draft.
--
-- Migrations run before the import, so on the start that first loads the
-- book this returns; the importer runs this file again afterwards
-- (DRAFTS_AFTER_IMPORT in web/scripts/import-sources.ts).
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'insulting-the-prophet')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'sarim_maslul.1.4.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'hidaya.2.405.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'umm_shafii.4.209.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.30.63.33')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('insulting-the-prophet', 'hard', 'draft', 'migration:085', 'migration:085')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Оскорбление пророка$p$,
    $p$Что источники говорят о наказании за оскорбление пророка — для мусульманина и для человека договора — и в чём расходятся школы?$p$,
    $p$Ибн Таймия строит «ас-Сарим аль-маслюль» на четырёх вопросах; первый: «المسألة الأولى: في أن الساب يقتل سواء كان مسلما أو كافرا» (Сарим 1:3). Он приводит слова Ибн аль-Мунзира «أجمع عوام أهل العلم على أن حد من سب النبي صلى الله عليه وسلم القتل» и тут же расхождение: «وحكي عن النعمان لا يقتل» (Сарим 1:4). Различие между мусульманином и человеком договора: «أن الساب إن كان مسلما فإنه يكفر ويقتل بغير خلاف وهو مذهب الأئمة الأربعة وغيرهم»; о человеке договора — «وان كان ذميا فإنه يقتل أيضا في مذهب مالك وأهل المدينة» (Сарим 1:4). Аяты, к которым обращаются, — 33:57 и 9:12.$p$,
    $p$Собрано 22.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. Позиций исследователей и современных богословов в библиотеке нет — их нужно добавить с источниками. Оценки достоверности хадисов — тоже.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.33.57', 0),
    ('main', 'quran.9.12', 1),
    ('circumstances', 'sarim_maslul.1.3.1', 0),
    ('circumstances', 'sarim_maslul.1.4.1', 1),
    ('related', 'bukhari.3031', 0),
    ('related', 'bukhari.6024', 1),
    ('related', 'abu_dawud.4361', 2),
    ('related', 'abu_dawud.4362', 3)
  ) AS v(role, address, pos);

  -- The Sunni schools.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Таймия (ханбалит)$p$, 'tradition',
    $p$Слова Ахмада, которые он приводит: «كل من شتم النبي صلى الله عليه وسلم أو تنقصه مسلما كان أو كافرا فعليه القتل وأرى أن يقتل ولا يستتاب»; о человеке договора: «وهو مذهب أحمد وفقهاء الحديث» (Сарим 1:4). О договоре с Умаром: «إنا لم نعطك العهد على أن تدخل علينا في ديننا»; «وإن من أعظم الاعتراضات سب نبينا صلى الله عليه وسلم» (Сарим 1:202). Вывод: «فإذا أظهروا كلمة الكفر وأعلنوها خرجوا عن العهد الذي عاهدونا عليه» (Сарим 1:253).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['sarim_maslul.1.4.1', 'sarim_maslul.1.202.1', 'sarim_maslul.1.253.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аш-Шафии$p$, 'tradition',
    $p$Условие, которое он предлагает вписывать в договор о джизье: «وعلى أن أحدا منكم إن ذكر محمدا - صلى الله عليه وسلم - أو كتاب الله عز وجل أو دينه بما لا ينبغي أن يذكره به، فقد برئت منه ذمة الله ثم ذمة أمير المؤمنين وجميع المسلمين ونقض ما أعطي عليه الأمان» (Умм 4:209).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'umm_shafii.4.209.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Маргинани (ханафиты)$p$, 'tradition',
    $p$О человеке договора: «ومن امتنع من الجزية أو قتل مسلما أو سب النبي عليه الصلاة والسلام أو زنى» … «بمسلمة لم ينتقض عهده». О мнении аш-Шафии: «وقال الشافعي رحمه الله سب النبي عليه الصلاة والسلام يكون نقضا». Довод ханафитов: «ولنا أن سب النبي عليه الصلاة والسلام كفر منه والكفر المقارن لا يمنعه فالطارئ لا يرفعه» (Хидая 2:405).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'hidaya.2.405.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Каййим$p$, 'tradition',
    $p$«ولهذا قتل النبي صلى الله عليه وسلم جماعة من النسوة اللاتي كن يشتمنه ويهجينه مع عفوه عمن كانت تعين عليه وتحض على قتاله» (Ахкам 3:1436).$p$, note, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ahkam_dhimma.3.1436.1', 0);

  -- Reports both ways.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы, на которые опираются$p$, 'tradition',
    $p$О наложнице слепого: «ألا اشهدوا أن دمها هدر» (Абу Дауд 4361). Об иудейке: «أن يهودية كانت تشتم النبي صلى الله عليه وسلم وتقع فيه فخنقها رجل حتى ماتت فأبطل رسول الله صلى الله عليه وسلم دمها» (Абу Дауд 4362). О Кабе ибн аль-Ашрафе: «من لكعب بن الأشرف، فإنه قد آذى الله ورسوله» (Бухари 3031).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Оценки достоверности двух хадисов Абу Дауда у хадисоведов нужно добавить.$p$, 4
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['abu_dawud.4361', 'abu_dawud.4362', 'bukhari.3031']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы о кротости и прощении$p$, 'tradition',
    $p$Когда иудеи сказали пророку «السام عليكم»: «مهلا يا عائشة، إن الله يحب الرفق في الأمر كله» (Бухари 6024). Как Ибн Таймия объясняет такие случаи: «وكان له أن يعفو عنه وكان يعفو عنهم تأليفا للقلوب لئلا يتحدث الناس أن محمدا يقتل أصحابه» (Сарим 1:229).$p$, note, 5
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.6024', 'sarim_maslul.1.229.1']) WITH ORDINALITY AS u(a, o);

  -- The Shia tradition.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$Имам аль-Бакир рассказывает о человеке из хузайлитов, который поносил пророка, и отвечает на вопрос о его времени: «أرأيت لو أن رجلا الآن سب النبي صلى الله عليه وآله أيقتل؟ قال: إن لم تخف على نفسك فاقتله» (аль-Кафи 30.63.33).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Оценку достоверности по шиитской науке о хадисе и позицию современных шиитских богословов нужно добавить.$p$, 6
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'kafi.30.63.33', 0);

  -- The critics: what they point to, without their tone.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят «ас-Сарим аль-маслюль» Ибн Таймии (Сарим 1:3–4, 1:202, 1:253), «Ахкам ахль аз-зимма» и хадис о наложнице слепого (Абу Дауд 4361) как свидетельство того, что классическое право требует смерти за оскорбление пророка, в том числе от людей договора.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Степень признания здесь условна: это полемика, а не богословская школа.$p$, 7
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['sarim_maslul.1.3.1', 'sarim_maslul.1.4.1', 'sarim_maslul.1.202.1', 'sarim_maslul.1.253.1', 'abu_dawud.4361']) WITH ORDINALITY AS u(a, o);

  -- Beside the topic about the people of the pact.
  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug = 'dhimma-conditions'
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug = 'dhimma-conditions';

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'insulting-the-prophet', 'status', 'draft', 'positions', 8),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:085');
END $$;
