-- 087: the four schools in the draft «Оскорбление пророка» (docs/PLAN.md,
-- 22.11.2026), as Ibn Hubayra («Ихтиляф аль-аимма», a Hanbali author) sets
-- them side by side: the person of the pact and the Muslim. Same method as
-- 054–086: a quotation with its address, checked against the library; the
-- topic stays a draft. Added only if the topic exists and this position is
-- not there yet.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  pos int;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'insulting-the-prophet';
  IF tid IS NULL
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'ikhtilaf_aimma.2.197.2')
     OR EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE 'Ибн Хубайра%')
  THEN
    RETURN;
  END IF;

  -- After the other Sunni positions, before the reports, the Shia and the critics.
  UPDATE topic_positions SET position = position + 1 WHERE topic_id = tid AND position >= 4;
  pos := 4;

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Хубайра (ханбалит) о мнениях школ$p$, 'tradition',
    $p$«واختلفوا فيما إذا سب ذمي النبي - صلى الله عليه وسلم»: «فقال مالك وأحمد: يقتل ويكون ناقضا للعهد»; «وقال أبو حنيفة: لا يقتل ولايكون ناقضا للعهد»; «واختلف أصحاب الشافعي في وجوب قتله أو نقضه العهد على وجهين». О мусульманине: «فأما إن كان سبه له بعد أن اسلم فإنه يقتل ولا يستتاب عند مالك» и Ахмада; «وقال أبو حنيفة: يقتل مرتدا»; «وقال الشافعي يستتاب فإن لم يتب قتل كالمرتد» (Ихтиляф 2:197).$p$,
    $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Это изложение мнений школ у автора книги, а не книги самих школ; формулировку и степень признания проверяет специалист.$p$, pos
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  SELECT tid, 'position', pid, a::extensions.ltree, o
  FROM unnest(ARRAY['ikhtilaf_aimma.2.197.1', 'ikhtilaf_aimma.2.197.2']) WITH ORDINALITY AS u(a, o);

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'insulting-the-prophet', 'added_positions', 1),
          'Добавлены мнения четырёх школ по «Ихтиляф аль-аимма»; специалистом не проверено.', 'migration:087');
END $$;
