-- 057: a draft of the hard topic «Брак с несовершеннолетними»
-- (docs/PLAN.md, 12–13.11.2026), the third example of a topic built from the
-- leads of the author's archive, by the same method as 054: what the critics
-- point to, and what the sources themselves say, every position a quotation
-- with its address, checked against the library. Nothing here is written in
-- the name of a side. The topic stays a draft until a specialist has read it.
--
-- Runs only where the books it quotes are loaded (al-Shafi'i's «аль-Умм»
-- comes with migration 055 and the import after it) and the topic does not
-- exist yet; on an empty database it does nothing. Migrations run before the
-- import, so on the server this one takes effect only on the start after the
-- book is in the database.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'minor-marriage')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'umm_shafii.5.102.2')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.5133')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.65.4')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.20.24.4')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('minor-marriage', 'hard', 'draft', 'migration:057', 'migration:057')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Брак с несовершеннолетними$p$,
    $p$Что источники говорят о браке с девочкой до зрелости: о возрасте Аиши, об аяте 65:4 и об условиях начала супружеской жизни?$p$,
    $p$О браке пророка с Аишей у аль-Бухари: «تزوجها وهي بنت ست سنين، وأدخلت عليه وهي بنت تسع، ومكثت عنده تسعا» (Бухари 5133). В другой передаче у Муслима при заключении брака ей семь лет: «تزوجها وهى بنت سبع سنين وزفت إليه وهى بنت تسع سنين» (Муслим 1422.3). Аль-Бухари помещает свой хадис в главу «باب إنكاح الرجل ولده الصغار» и пишет в ней об аяте 65:4: «فجعل عدتها ثلاثة أشهر قبل البلوغ» (глава к хадису Бухари 5133). Аят 65:4 говорит о сроке ожидания после развода, в том числе для «اللائي لم يحضن»; Ибн Касир: «وكذا الصغار اللائي لم يبلغن سن الحيض أن عدتهن كعدة الآيسة ثلاثة أشهر» (Ибн Касир 65:4).$p$,
    $p$Собрано 13.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. Позиций исследователей и современных авторов, которые спорят о возрасте Аиши, в библиотеке нет — их нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.65.4', 0),
    ('main', 'bukhari.5133', 1),
    ('circumstances', 'bukhari.5133', 0),
    ('circumstances', 'muslim.1422.3', 1),
    ('circumstances', 'quran.65.4', 2),
    ('circumstances', 'tafsir_ibn_kathir.65.4', 3),
    ('related', 'muslim.1422.2', 0),
    ('related', 'muslim.1422.3', 1),
    ('related', 'bukhari.3894', 2),
    ('related', 'bukhari.3896', 3),
    ('related', 'bukhari.5134', 4),
    ('related', 'bukhari.5158', 5),
    ('related', 'kafi.18.62.4', 6)
  ) AS v(role, address, pos);

  -- The Sunni tradition.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аль-Бухари (заголовок главы)$p$, 'tradition',
    $p$Глава «باب إنكاح الرجل ولده الصغار» с доводом из аята 65:4: «فجعل عدتها ثلاثة أشهر قبل البلوغ»; в главе — хадис о браке с Аишей (Бухари 5133).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.5133', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аш-Шафии$p$, 'tradition',
    $p$О праве отца выдать замуж дочь до зрелости: «دل إنكاح أبي بكر عائشة النبي - صلى الله عليه وسلم - ابنة ست وبناؤه بها ابنة تسع على أن الأب أحق بالبكر من نفسها» (Умм 5:18). И в другом месте: «لأن ابنة سبع سنين وتسع لا أمر لها في نفسها وليس لأحد غير الآباء أن يزوجوا بكرا حتى تبلغ ويكون لها أمر في نفسها» (Умм 5:179).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['umm_shafii.5.18.2', 'umm_shafii.5.179.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аш-Шафии$p$, 'tradition',
    $p$Об условии начала супружеской жизни: «وهذا كله إذا كانت الزوجة بالغا أو مقاربة البلوغ أو جسيمة يحتمل مثلها أن يجامع فإذا كانت لا تحتمل أن تجامع فلأهلها منعها الدخول حتى تحتمل الجماع» (Умм 5:102).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'umm_shafii.5.102.2', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition',
    $p$Об аяте 65:4: «وكذا الصغار اللائي لم يبلغن سن الحيض أن عدتهن كعدة الآيسة ثلاثة أشهر» (Ибн Касир 65:4).$p$, note, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.65.4', 0);

  -- The Shia tradition.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$О возрасте начала супружеской жизни: «إذا تزوج الرجل الجارية وهي صغيرة فلا يدخل بها حتى يأتي لها تسع سنين» (аль-Кафи 18.62.2); в другой передаче — «حتى يأتي لها تسع سنين أو عشر سنين» (аль-Кафи 18.62.1). О нарушении: «إذا خطب الرجل المرأة فدخل بها قبل أن تبلغ تسع سنين فرق بينهما ولم تحل له أبدا» (аль-Кафи 18.82.12).$p$,
    $p$Подобрано по текстам библиотеки 13.11.2026; специалистом не проверено. В иснаде третьего сообщения стоит «عن بعض أصحابنا» (передатчик не назван); оценку достоверности по шиитской науке о хадисе нужно добавить.$p$, 4
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['kafi.18.62.2', 'kafi.18.62.1', 'kafi.18.82.12']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$О сроке ожидания: «ثلاث يتزوجن على كل حال، التي لم تحض ومثلها لا تحيض، قال: قلت: وما حدها؟ قال: إذا أتى لها أقل من تسع سنين» (аль-Кафи 20.24.4).$p$, note, 5
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'kafi.20.24.4', 0);

  -- The critics: what they point to, without their tone.
  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Приводят хадисы о возрасте Аиши (Бухари 5133, Муслим 1422), аят 65:4 и его толкования о сроке ожидания для тех, у кого ещё не было месячных (у Ибн Касира, а также у ат-Табари со слов Катады), как свидетельство того, что классическое право допускает брак и супружескую близость с девочкой до зрелости и не называет нижней границы возраста. Довод, что условием служит начало месячных, считают опровергнутым аятом 65:4.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Тафсира ат-Табари в библиотеке пока нет. Степень признания здесь условна: это полемика, а не богословская школа.$p$, 6
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.5133', 'muslim.1422.3', 'quran.65.4', 'tafsir_ibn_kathir.65.4']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'minor-marriage', 'status', 'draft', 'positions', 7),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:057');
END $$;
