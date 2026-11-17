-- 070: draft «Аллат, аль-Узза и Манат» (docs/PLAN.md, 17.11.2026).
-- Quotes are copied from the loaded books. Faris's English translation is not used.
-- The topic stays a draft. On an empty database the addresses are missing and this does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 17.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'allat-uzza-manat')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.53.19')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'asnam.1.16.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.53.19')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.22.52')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tarikh_tabari.2.338.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.4861')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.1277.5')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.15.120.3')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.53.19'
      AND position('أَفَرَءَيْتُمُ ٱللَّـٰتَ وَٱلْعُزَّىٰ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.53.20'
      AND position('وَمَنَوٰةَ ٱلثَّالِثَةَ ٱلْأُخْرَىٰٓ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.53.23'
      AND position('إِنْ هِىَ إِلَّآ أَسْمَآءٌ سَمَّيْتُمُوهَآ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'asnam.1.13.1'
      AND position('فكان أقدمها كلها مناة' IN t.content) > 0
      AND position('وكان منصوبا على ساحل البحر من ناحية المشلل بقديد بين المدينة ومكة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'asnam.1.16.1'
      AND position('ثم اتخذوا اللات' IN t.content) > 0
      AND position('واللات بالطائف وهي أحدث من مناة' IN t.content) > 0
      AND position('وكانت صخرة مربعة' IN t.content) > 0
      AND position('وكان يهودي يلت عندها السويق' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'asnam.1.17.1'
      AND position('فبعث رسول الله صلى الله عليه وسلم المغيرة بن شعبة فهدمها وحرقها بالنار' IN t.content) > 0
      AND position('وهي أحدث من اللات ومناة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'asnam.1.18.1'
      AND position('وكان الذي اتخذ العزى ظالم بن أسعد' IN t.content) > 0
      AND position('وكانت أعظم الأصنام عند قريش' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'asnam.1.19.1'
      AND position('لقد أهديت للعزى شاة عفراء وأنا على دين قومي' IN t.content) > 0
      AND position('فإنهن الغرانيق العلى وإن شفاعتهن لترتجى' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.53.19'
      AND position('وكانت "اللات" (4) صخرة بيضاء منقوشة، وعليها بيت بالطائف له أستار وسدنة' IN t.content) > 0
      AND position('{اللات والعزى} قال: كان اللات رجلا يلت السويق، سويق الحاج (7)' IN t.content) > 0
      AND position('وكانت شجرة عليها بناء وأستار بنخلة، وهي بين مكة والطائف، كانت قريش يعظمونها' IN t.content) > 0
      AND position('وأما "مناة" فكانت بالمشلل (5) -عند قديد، بين مكة والمدينة-وكانت خزاعة والأوس والخزرج في جاهليتها يعظمونها' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.22.52'
      AND position('قد ذكر كثير من المفسرين هاهنا قصة الغرانيق' IN t.content) > 0
      AND position('ولكنها من طرق كلها مرسلة، ولم أرها مسندة من وجه صحيح' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tarikh_tabari.2.338.1'
      AND position('تلك الغرانيق العلا، وان شفاعتهن لترتجى' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'bukhari.4861'
      AND position('إنما كان من أهل بمناة الطاغية التي بالمشلل، لا يطوفون بين الصفا والمروة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.1277.5'
      AND position('أن الأنصار كانوا قبل أن يسلموا هم وغسان يهلون لمناة فتحرجوا أن يطوفوا بين الصفا والمروة' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'kafi.15.120.3'
      AND position('آمنت بالله و كفرت بالطاغوت وباللات والعزى' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'allat phrases are not in the library text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('allat-uzza-manat', 'general', 'draft', 'migration:070', 'migration:070')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Аллат, аль-Узза и Манат$p$,
    $p$Что говорят загруженные тексты об Аллат, аль-Уззе и Манат?$p$,
    $p$В 53:19: «أَفَرَءَيْتُمُ ٱللَّـٰتَ وَٱلْعُزَّىٰ». В 53:20: «وَمَنَوٰةَ ٱلثَّالِثَةَ ٱلْأُخْرَىٰٓ». В 53:23: «إِنْ هِىَ إِلَّآ أَسْمَآءٌ سَمَّيْتُمُوهَآ». «Китаб аль-Аснам» 1:13: «فكان أقدمها كلها مناة»; «وكان منصوبا على ساحل البحر من ناحية المشلل بقديد بين المدينة ومكة». 1:16: «ثم اتخذوا اللات»; «واللات بالطائف وهي أحدث من مناة»; «وكانت صخرة مربعة»; «وكان يهودي يلت عندها السويق». 1:17: «وهي أحدث من اللات ومناة»; «فبعث رسول الله صلى الله عليه وسلم المغيرة بن شعبة فهدمها وحرقها بالنار». 1:18: «وكان الذي اتخذ العزى ظالم بن أسعد»; «وكانت أعظم الأصنام عند قريش». Ибн Касир к 53:19: «وكانت "اللات" (4) صخرة بيضاء منقوشة، وعليها بيت بالطائف له أستار وسدنة». От Ибн Аббаса там же: «{اللات والعزى} قال: كان اللات رجلا يلت السويق، سويق الحاج (7)». Об аль-Уззе: «وكانت شجرة عليها بناء وأستار بنخلة، وهي بين مكة والطائف، كانت قريش يعظمونها». О Манат: «وأما "مناة" فكانت بالمشلل (5) -عند قديد، بين مكة والمدينة-وكانت خزاعة والأوس والخزرج في جاهليتها يعظمونها». Бухари 4861: «إنما كان من أهل بمناة الطاغية التي بالمشلل، لا يطوفون بين الصفا والمروة». Муслим 1277: «أن الأنصار كانوا قبل أن يسلموا هم وغسان يهلون لمناة فتحرجوا أن يطوفوا بين الصفا والمروة». В «Китаб аль-Аснам» 1:19 слова «الغرانيق» стоят как речь курайшитов при обходе: «فإنهن الغرانيق العلى وإن شفاعتهن لترتجى». «История» ат-Табари 2:338 передаёт их иначе: «تلك الغرانيق العلا، وان شفاعتهن لترتجى». Ибн Касир к 22:52: «قد ذكر كثير من المفسرين هاهنا قصة الغرانيق»; «ولكنها من طرق كلها مرسلة، ولم أرها مسندة من وجه صحيح».$p$,
    $p$Собрано 17.11.2026 по «Китаб аль-Аснам», Ибн Касиру, «Истории» ат-Табари, аль-Бухари, Муслиму и «аль-Кафи» 15.120.3. Английский перевод Фариса не перенесён. Исаф и Наиля в карточку не включены. В «аль-Кафи» эти имена стоят в формуле отказа и в клятвах, без описания трёх идолов. Специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.53.19', 0),
    ('main', 'quran.53.20', 1),
    ('main', 'quran.53.23', 2),
    ('circumstances', 'asnam.1.13.1', 0),
    ('circumstances', 'asnam.1.14.1', 1),
    ('circumstances', 'asnam.1.16.1', 2),
    ('circumstances', 'asnam.1.17.1', 3),
    ('circumstances', 'asnam.1.18.1', 4),
    ('circumstances', 'asnam.1.19.1', 5),
    ('circumstances', 'tafsir_ibn_kathir.53.19', 6),
    ('circumstances', 'tafsir_ibn_kathir.22.52', 7),
    ('circumstances', 'tarikh_tabari.2.338.1', 8),
    ('circumstances', 'bukhari.4861', 9),
    ('circumstances', 'muslim.1277.5', 10),
    ('related', 'kafi.15.120.3', 0)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Кальби$p$, 'tradition',
    $p$«فكان أقدمها كلها مناة». «وكان منصوبا على ساحل البحر من ناحية المشلل بقديد بين المدينة ومكة» (Аснам 1:13). «ثم اتخذوا اللات». «واللات بالطائف وهي أحدث من مناة». «وكانت صخرة مربعة». «وكان يهودي يلت عندها السويق» (Аснам 1:16). «وهي أحدث من اللات ومناة» (Аснам 1:17). «وكان الذي اتخذ العزى ظالم بن أسعد». «وكانت أعظم الأصنام عند قريش» (Аснам 1:18).$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['asnam.1.13.1', 'asnam.1.16.1', 'asnam.1.17.1', 'asnam.1.18.1']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир к 53:19$p$, 'tradition',
    $p$«وكانت "اللات" (4) صخرة بيضاء منقوشة، وعليها بيت بالطائف له أستار وسدنة». «وكانت شجرة عليها بناء وأستار بنخلة، وهي بين مكة والطائف، كانت قريش يعظمونها». «وأما "مناة" فكانت بالمشلل (5) -عند قديد، بين مكة والمدينة-وكانت خزاعة والأوس والخزرج في جاهليتها يعظمونها».$p$,
    note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.53.19', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Аббас у Ибн Касира$p$, 'tradition',
    $p${اللات والعزى} قال: كان اللات رجلا يلت السويق، سويق الحاج (7) (Ибн Касир 53:19).$p$,
    note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.53.19', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аиша у аль-Бухари и Муслима$p$, 'tradition',
    $p$«إنما كان من أهل بمناة الطاغية التي بالمشلل، لا يطوفون بين الصفا والمروة» (Бухари 4861). «أن الأنصار كانوا قبل أن يسلموا هم وغسان يهلون لمناة فتحرجوا أن يطوفوا بين الصفا والمروة» (Муслим 1277).$p$,
    note, 3
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['bukhari.4861', 'muslim.1277.5']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Кальби о словах при обходе$p$, 'tradition',
    $p$«لقد أهديت للعزى شاة عفراء وأنا على دين قومي». «فإنهن الغرانيق العلى وإن شفاعتهن لترتجى» (Аснам 1:19). В этой книге слова стоят как речь курайшитов при обходе Каабы.$p$,
    note, 4
  FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'asnam.1.19.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«История» ат-Табари и Ибн Касир к 22:52$p$, 'minority',
    $p$Ат-Табари 2:338: «تلك الغرانيق العلا، وان شفاعتهن لترتجى». Ибн Касир к 22:52: «قد ذكر كثير من المفسرين هاهنا قصة الغرانيق»; «ولكنها من طرق كلها مرسلة، ولم أرها مسندة من وجه صحيح».$p$,
    note, 5
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['tarikh_tabari.2.338.1', 'tafsir_ibn_kathir.22.52']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$формула у камня в «аль-Кафи»$p$, 'tradition',
    $p$«آمنت بالله و كفرت بالطاغوت وباللات والعزى» («аль-Кафи» 15.120.3).$p$,
    note, 6
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'kafi.15.120.3', 0);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES (
    'topic', tid::text, 'created',
    json_build_object('slug', 'allat-uzza-manat', 'status', 'draft')::jsonb,
    'Черновик об Аллат, аль-Уззе и Манат по загруженным книгам',
    'migration:070'
  );
END $$;
