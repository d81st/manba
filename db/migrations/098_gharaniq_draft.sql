-- 098: a draft of the hard topic «Рассказ о „гараник“ („сатанинские аяты“)»
-- (docs/PLAN.md, 23.11.2026), the next sira theme of the critic's posts in the
-- author's archive. The reports in al-Tabari's History, Ibn Kathir's judgement
-- of their chains and the answer he cites, the commentators on 22:52; the
-- context (the prostration at the end of an-Najm, the pre-Islamic chant, the
-- return of the emigrants from Abyssinia); the critic without his tone. Every
-- quotation is checked against the library. The topic stays a draft.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'gharaniq')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tarikh_tabari.2.338.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.22.52')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'asnam.1.19.1')
  THEN
    RETURN;
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('gharaniq', 'hard', 'draft', 'migration:098', 'migration:098')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Рассказ о «гараник» («сатанинские аяты»)$p$,
    $p$Что ранние историки и толкователи рассказывают о словах «تلك الغرانيق العلا» при чтении суры ан-Наджм и как они оценивают достоверность этого рассказа?$p$,
    $p$Аяты — 53:19–21 (об аль-Лат, аль-Уззе и Манат) и 22:52. Сура ан-Наджм кончается земным поклоном (53:62); аль-Бухари: «سجد النبي صلى الله عليه وسلم بالنجم وسجد معه المسلمون والمشركون والجن والإنس» (Бухари 4862). Ибн аль-Кальби о доисламском обычае: курайшиты обходили Каабу со словами «فإنهن الغرانيق العلى وإن شفاعتهن لترتجى» (Аснам 1:19). Ибн Исхак у Ибн Хишама рассказывает о возвращении переселенцев: «وبلغ أصحاب رسول الله صلى الله عليه وسلم، الذين خرجوا إلى أرض الحبشة، إسلام أهل مكة» (Ибн Хишам 1:364).$p$,
    $p$Собрано 23.11.2026 по текстам библиотеки, по наводкам из архива автора (записи критика ислама). Подбор цитат и формулировки специалист не проверял. У Ибн Хишама в этом месте — только возвращение переселенцев, без рассказа о словах. В «аль-Кафи» и «аль-Иршаде» рассказа не найдено; позиций шиитских авторов, книги «аш-Шифа» кади Ийяда, на которую ссылается Ибн Касир, и исследователей (критик ссылается на Ф. Э. Питерса) в библиотеке нет — их нужно добавить с источниками.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.53.19', 0),
    ('main', 'quran.53.20', 1),
    ('main', 'quran.53.21', 2),
    ('main', 'quran.22.52', 3),
    ('circumstances', 'bukhari.4862', 0),
    ('circumstances', 'asnam.1.19.1', 1),
    ('circumstances', 'ibn_hisham.1.364.2', 2),
    ('related', 'quran.53.62', 0),
    ('related', 'bukhari.1071', 1),
    ('related', 'tarikh_tabari.2.340.1', 2)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Рассказ в «Истории» ат-Табари$p$, 'minority',
    $p$Со слов Мухаммада ибн Каба аль-Курази через Ибн Исхака: «ألقى الشيطان على لسانه، لما كان يحدث به نفسه، ويتمنى أن يأتي به قومه: تلك الغرانيق العلا، وان شفاعتهن لترتجى» (Табари 2:338). Слова Джибриля: «لقد تلوت على الناس ما لم آتك به عن الله عز وجل، وقلت ما لم يقل لك»; затем: «فنسخ الله ما ألقى الشيطان وأحكم آياته» (Табари 2:339). Та же история со слов Мухаммада ибн Каба и Мухаммада ибн Кайса: «ألقى الشيطان عليه كلمتين: تلك الغرانيق العلا وإن شفاعتهن لترجى» (Табари 2:340).$p$,
    $p$Подобрано по текстам библиотеки 23.11.2026; специалистом не проверено. Это рассказы, цепочки которых Ибн Касир называет прерванными (Ибн Касир 22:52); оценки хадисоведов и историков нужно добавить.$p$, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tarikh_tabari.2.338.1', 'tarikh_tabari.2.339.1', 'tarikh_tabari.2.340.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир о цепочках рассказа (к 22:52)$p$, 'tradition',
    $p$«ولكنها من طرق كلها مرسلة، ولم أرها مسندة من وجه صحيح»; о передаче Саида ибн Джубайра — «وهو مرسل», а о связной передаче у аль-Баззара он приводит его слова: «يروى متصلا إلا بهذا الإسناد، تفرد بوصله أمية بن خالد، وهو ثقة مشهور» (слова «لا» в издании отделены номером сноски); итог: «وكلها مرسلات ومنقطعات». Из ответов на вопрос о непогрешимости он называет самым тонким: «أن الشيطان أوقع في مسامع المشركين ذلك، فتوهموا أنه صدر عن رسول الله صلى الله عليه وسلم» (Ибн Касир 22:52).$p$, note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.22.52', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Толкователи о словах 22:52 (у Ибн Касира)$p$, 'tradition',
    $p$Со слов Ибн Аббаса у аль-Бухари: «إذا حدث ألقى الشيطان في حديثه، فيبطل الله ما يلقي الشيطان ويحكم الله آياته». Аль-Багави: «وأكثر المفسرين قالوا: معنى قوله: {تمنى} أي: تلا وقرأ كتاب الله»; «قال ابن جرير: هذا القول أشبه بتأويل الكلام» (Ибн Касир 22:52).$p$, note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.22.52', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
    $p$Считают рассказ подлинным: приводят историю ат-Табари (Табари 2:338) и толкование 22:52 (Ибн Касир 22:52), ссылаются на исследователя Ф. Э. Питерса и утверждают, что по словам Ибн Таймии рассказ принимали ранние мусульмане.$p$,
    $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Работы Ф. Э. Питерса в библиотеке нет, слова Ибн Таймии по библиотеке не сверены. Степень признания здесь условна: это полемика, а не исследование.$p$, 3
  FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tarikh_tabari.2.338.1', 'tafsir_ibn_kathir.22.52']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_relations (topic_id, related_id)
  SELECT tid, t.id FROM topics t WHERE t.slug = 'allat-uzza-manat'
  UNION ALL
  SELECT t.id, tid FROM topics t WHERE t.slug = 'allat-uzza-manat';

  -- On the map: Mecca (the al-Ṯurayyā point, as in migration 097).
  INSERT INTO places (slug, name_ar, lat, lon, coord_source, created_by, updated_by)
  VALUES ('makka', 'مكة', 21.39132, 39.83612, 'al-thurayya:MAKKA_398E213N_S', 'migration:098', 'migration:098')
  ON CONFLICT (slug) DO NOTHING;
  INSERT INTO place_texts (place_id, locale, name)
  SELECT id, 'ru', 'Мекка' FROM places WHERE slug = 'makka'
  ON CONFLICT DO NOTHING;
  INSERT INTO topic_places (topic_id, place_id) SELECT tid, id FROM places WHERE slug = 'makka' ON CONFLICT DO NOTHING;
  -- On the timeline: the first emigration to Abyssinia, where the event exists.
  INSERT INTO topic_sira_events (topic_id, event_id) SELECT tid, id FROM sira_events WHERE slug = 'hijra-abyssinia' ON CONFLICT DO NOTHING;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'gharaniq', 'status', 'draft', 'positions', 4),
          'Черновик собран по текстам библиотеки по наводкам из архива автора; специалистом не проверен.', 'migration:098');
END $$;
