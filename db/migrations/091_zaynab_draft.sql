-- 091: a draft of the hard topic «Зайнаб бинт Джахш и Зайд ибн Хариса»
-- (docs/PLAN.md, 22.11.2026), the first sira theme of the critic's posts in
-- the author's archive. Same method as 054–090: every position a quotation
-- with its address, checked against the library; the reports the commentator
-- rejects are shown as such, beside his rejection; the critic without his
-- tone. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'zaynab-and-zayd')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.33.37')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ahmad.13025')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tarikh_tabari.2.563.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('zaynab-and-zayd', 'hard', 'draft', 'migration:091', 'migration:091')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Зайнаб бинт Джахш и Зайд ибн Хариса$p$,
    $p$Что источники рассказывают о браке Зайда с Зайнаб, о разводе и о браке пророка с Зайнаб, и какие рассказы сами толкователи считают недостоверными?$p$,
    $p$Аяты — 33:37, 33:40 и 33:5. Ат-Табари о Зайде: «وكان زيد إنما يقال له زيد بن محمد» (Табари 2:562). Ибн Касир: пророк «قد زوجه بابنة عمته زينب بنت جحش الأسدية»; «ثم وقع بينهما، فجاء زيد يشكوها إلى رسول الله صلى الله عليه وسلم» (Ибн Касир 33:37).$p$,
    $p$Собрано 22.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. В «аль-Кафи» об этом эпизоде сообщений не найдено; позиций шиитских толкователей, исследователей и оценку хадиса Ахмада 13025 хадисоведами нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.33.37', 0),
    ('main', 'quran.33.40', 1),
    ('main', 'quran.33.5', 2),
    ('circumstances', 'tarikh_tabari.2.562.1', 0),
    ('circumstances', 'tafsir_ibn_kathir.33.37', 1),
    ('related', 'bukhari.4787', 0),
    ('related', 'bukhari.7420', 1)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадисы у аль-Бухари$p$, 'tradition',
    $p$О поводе аята: «نزلت في شأن زينب بنت جحش وزيد بن حارثة» (Бухари 4787). Слова Анаса: «لو كان رسول الله صلى الله عليه وسلم كاتما شيئا لكتم هذه»; слова самой Зайнаб: «زوجكن أهاليكن، وزوجني الله تعالى من فوق سبع سموات» (Бухари 7420).$p$, note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.4787', 'bukhari.7420']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис у Ахмада (13025)$p$, 'tradition',
    $p$«لما انقضت عدة زينب، قال رسول الله صلى الله عليه وسلم لزيد» — «اذهب فاذكرها علي» (Ахмад 13025).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Оценку иснада хадисоведами нужно добавить; критик ссылается на оценку аль-Арнаута «сахих» (в библиотеке её нет).$p$, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'ahmad.13025', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир о недостоверных рассказах$p$, 'tradition',
    $p$«ذكر ابن جرير، وابن أبي حاتم هاهنا آثارا عن بعض السلف، رضي الله عنهم، أحببنا أن نضرب عنها صفحا لعدم صحتها فلا نوردها»; «وقد روى الإمام أحمد هاهنا أيضا حديثا، من رواية حماد بن زيد، عن ثابت، عن أنس فيه غرابة تركنا سياقه أيضا» (Ибн Касир 33:37).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.33.37', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Рассказы в «Истории» ат-Табари$p$, 'minority',
    $p$В передаче через Мухаммада ибн Умара: «فأعجبت رسول الله ص، فولى وهو يهمهم بشيء لا يكاد يفهم، إلا أنه أعلن: سبحان الله العظيم! سبحان الله مصرف القلوب!» (Табари 2:562). Со слов Ибн Зайда: «فرفعت الريح الستر فانكشف وهي في حجرتها حاسره، فوقع إعجابها في قلب النبي ص» (Табари 2:563).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Это те рассказы, которые Ибн Касир не приводит, считая их недостоверными (Ибн Касир 33:37); оценку их цепочек хадисоведами и историками нужно добавить.$p$, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tarikh_tabari.2.562.1', 'tarikh_tabari.2.563.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Считают, что пророк взял жену своего приёмного сына, приводят рассказ ат-Табари (Табари 2:563), который Ибн Касир не стал приводить, и хадис Ахмада 13025 с иснадом, который аль-Арнаут называет достоверным.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Степень признания здесь условна: это полемика, а не богословская школа.$p$, 4
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tarikh_tabari.2.563.1', 'ahmad.13025']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'zaynab-and-zayd', 'status', 'draft', 'positions', 5),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:091');
END $$;
