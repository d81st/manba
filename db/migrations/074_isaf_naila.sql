-- 074: draft «Исаф и Наиля» (docs/PLAN.md, 17.11.2026).
-- Left out of the Allat card. Quotes are copied from the loaded books.
-- The topic stays a draft. On an empty database the addresses are missing and this does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 17.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист. Место идолов в книгах названо по-разному и здесь не сведено.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'isaf-naila')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.2.158')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'asnam.1.29.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.1277.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'muslim.2473.1')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ahmad.21525')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.15.212.29')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.2.158'
      AND position('إِنَّ ٱلصَّفَا وَٱلْمَرْوَةَ مِن شَعَآئِرِ ٱللَّهِ' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'asnam.1.29.1'
      AND position('وكان لهم إساف ونائلة لما مسخا حجرين وضعا عند الكعبة ليتعظ الناس بهما' IN t.content) > 0
      AND position('فلما طال مكثهما وعبدت الأصنام عبدا معها' IN t.content) > 0
      AND position('وكان أحدهما بلصق الكعبة والآخر في موضع زمزم' IN t.content) > 0
      AND position('فنقلت قريش الذي كان بلصق الكعبة إلى الآخر' IN t.content) > 0
      AND position('فكانوا ينحرون ويذبحون عندهما' IN t.content) > 0
      AND position('بمفضى السيول من إساف ونائل' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.1277.1'
      AND position('إنما كان ذاك أن الأنصار كانوا يهلون في الجاهلية لصنمين على شط البحر يقال لهما إساف ونائلة ثم يجيئون فيطوفون بين الصفا والمروة ثم يحلقون' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'muslim.2473.1'
      AND position('فما يطوف بالبيت أحد وامرأتين منهم تدعوان إسافا ونائلة' IN t.content) > 0
      AND position('فقلت انكحا أحدهما الأخرى' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'ahmad.21525'
      AND position('فما يطوف بالبيت غير امرأتين، فأتتا علي وهما تدعوان إساف ونائل' IN t.content) > 0
      AND position('فقلت: أنكحوا أحدهما الآخر' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'kafi.15.212.29'
      AND position('سئل أمير المؤمنين صلوات الله عليه عن إساف ونائلة وعبادة قريش لهما' IN t.content) > 0
      AND position('فأراد أحدهما صاحبه ففعل فمسخهما الله' IN t.content) > 0
      AND position('لولا أن الله رضي أن يعبد هذان معه ما حولهما عن حالهما' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'isaf and naila phrases are not in the library text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('isaf-naila', 'general', 'draft', 'migration:074', 'migration:074')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Исаф и Наиля$p$,
    $p$Что говорят загруженные тексты об Исафе и Наиле?$p$,
    $p$В 2:158 имён Исафа и Наили нет: «إِنَّ ٱلصَّفَا وَٱلْمَرْوَةَ مِن شَعَآئِرِ ٱللَّهِ». «Китаб аль-Аснам» 1:29: «وكان لهم إساف ونائلة لما مسخا حجرين وضعا عند الكعبة ليتعظ الناس بهما»; «فلما طال مكثهما وعبدت الأصنام عبدا معها»; «وكان أحدهما بلصق الكعبة والآخر في موضع زمزم»; «فنقلت قريش الذي كان بلصق الكعبة إلى الآخر»; «فكانوا ينحرون ويذبحون عندهما». Клятва Абу Талиба там же: «بمفضى السيول من إساف ونائل». Аиша у Муслима 1277: «إنما كان ذاك أن الأنصار كانوا يهلون في الجاهلية لصنمين على شط البحر يقال لهما إساف ونائلة ثم يجيئون فيطوفون بين الصفا والمروة ثم يحلقون». Абу Зарр у Муслима 2473: «فما يطوف بالبيت أحد وامرأتين منهم تدعوان إسافا ونائلة»; «فقلت انكحا أحدهما الأخرى». У Ахмада 21525: «فما يطوف بالبيت غير امرأتين، فأتتا علي وهما تدعوان إساف ونائل»; «فقلت: أنكحوا أحدهما الآخر». «аль-Кафи» 15.212.29: «سئل أمير المؤمنين صلوات الله عليه عن إساف ونائلة وعبادة قريش لهما»; «فأراد أحدهما صاحبه ففعل فمسخهما الله»; «لولا أن الله رضي أن يعبد هذان معه ما حولهما عن حالهما».$p$,
    note
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.2.158', 0),
    ('circumstances', 'asnam.1.29.1', 0),
    ('circumstances', 'muslim.1277.1', 1),
    ('circumstances', 'muslim.2473.1', 2),
    ('circumstances', 'ahmad.21525', 3),
    ('circumstances', 'kafi.15.212.29', 4)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн аль-Кальби$p$, 'tradition',
    $p$«وكان لهم إساف ونائلة لما مسخا حجرين وضعا عند الكعبة ليتعظ الناس بهما». «فلما طال مكثهما وعبدت الأصنام عبدا معها». «وكان أحدهما بلصق الكعبة والآخر في موضع زمزم». «فنقلت قريش الذي كان بلصق الكعبة إلى الآخر». «فكانوا ينحرون ويذبحون عندهما». «بمفضى السيول من إساف ونائل» (Аснам 1:29).$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'other' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'asnam.1.29.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Аиша у Муслима$p$, 'tradition',
    $p$«إنما كان ذاك أن الأنصار كانوا يهلون في الجاهلية لصنمين على شط البحر يقال لهما إساف ونائلة ثم يجيئون فيطوفون بين الصفا والمروة ثم يحلقون» (Муслим 1277).$p$,
    note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'muslim.1277.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Абу Зарр у Муслима и Ахмада$p$, 'tradition',
    $p$«فما يطوف بالبيت أحد وامرأتين منهم تدعوان إسافا ونائلة» (Муслим 2473). «فما يطوف بالبيت غير امرأتين، فأتتا علي وهما تدعوان إساف ونائل» (Ахмад 21525).$p$,
    note, 2
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['muslim.2473.1', 'ahmad.21525']) WITH ORDINALITY AS u(a, o);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
    $p$«سئل أمير المؤمنين صلوات الله عليه عن إساف ونائلة وعبادة قريش لهما». «فأراد أحدهما صاحبه ففعل فمسخهما الله». «لولا أن الله رضي أن يعبد هذان معه ما حولهما عن حالهما» («аль-Кафи» 15.212.29).$p$,
    note, 3
  FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'kafi.15.212.29', 0);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES (
    'topic', tid::text, 'created',
    json_build_object('slug', 'isaf-naila', 'status', 'draft')::jsonb,
    'Черновик об Исафе и Наиле по «Китаб аль-Аснам», Муслиму, Ахмаду и «аль-Кафи». В карточку Аллат не включён.',
    'migration:074'
  );
END $$;
