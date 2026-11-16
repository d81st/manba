-- 064: quote the Musannaf and al-Mughni in the slavery draft once those books
-- are loaded. Migrations run before the import, so on the deploy that first
-- loads the books this returns. The importer runs this file again afterwards.
-- Quotes are substrings of the loaded text. The topic stays a draft.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано по текстам библиотеки 16.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM topics WHERE slug = 'slavery-and-concubines')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'musannaf.12818')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'mughni.10.465.1')
     OR EXISTS (
       SELECT 1 FROM topic_refs r
       JOIN topics t ON t.id = r.topic_id
       WHERE t.slug = 'slavery-and-concubines' AND r.address = 'mughni.10.465.1'
     )
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'musannaf.12818'
      AND position('كنت أرى أنه يحل لي ما يحل للرجال من ملك اليمين' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'musannaf.12818 does not contain the milk al-yamin phrase';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'mughni.10.465.1'
      AND position('ولا خلاف في إباحة التسري ووطء الإماء' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'mughni.10.465.1 does not contain the tasarri phrase';
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'slavery-and-concubines';

  UPDATE topic_texts
  SET circumstances = circumstances || $q$ Мусаннаф 12818: «كنت أرى أنه يحل لي ما يحل للرجال من ملك اليمين». Мугни 10:465: «أم الولد: هي التي ولدت من سيدها في ملكه. ولا خلاف في إباحة التسري ووطء الإماء».$q$,
      circumstances_note = $q$Собрано 16.11.2026 по текстам библиотеки, по наводкам из архива автора. «Мусаннаф» — номера издания аль-Азами; часть номеров в выгрузке отсутствует и здесь не восстановлена. «Мугни» — изд. «Мактабат аль-Кахира», 1968. Подбор цитат специалист не проверял.$q$
  WHERE topic_id = tid AND locale = 'ru';

  INSERT INTO topic_refs (topic_id, role, address, position) VALUES
    (tid, 'circumstances', 'musannaf.12818', 8),
    (tid, 'circumstances', 'mughni.10.465.1', 9);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$«аль-Мусаннаф» Абд ар-Раззака$p$, 'tradition',
    $p$«تسرت امرأة غلاما لها، فذكرت لعمر فسألها: «ما حملك على هذا؟» فقالت: كنت أرى أنه يحل لي ما يحل للرجال من ملك اليمين، فاستشار عمر فيها أصحاب النبي صلى الله عليه وسلم فقالوا: تأولت كتاب الله تعالى على غير تأويله» (Мусаннаф 12818).$p$,
    note, 4
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'musannaf.12818', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Кудама, «аль-Мугни»$p$, 'tradition',
    $p$«أم الولد: هي التي ولدت من سيدها في ملكه. ولا خلاف في إباحة التسري ووطء الإماء» (Мугни 10:465). Дальше там же приведены 23:5–6 и имена Марии, Хаджар и сподвижников.$p$,
    note, 5
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'mughni.10.465.1', 0);

  UPDATE topic_positions
  SET text = $p$Записи архива относят к этой теме аяты о «том, чем овладела десница» (4:3, 4:24, 23:6, 33:50) и 24:33 и называют «Мусаннаф» и «Мугни». Из этих книг здесь приведены Мусаннаф 12818 и Мугни 10:465. С номерами страниц в самих записях канала это не сверялось.$p$
  WHERE topic_id = tid AND position = 3;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'slavery-and-concubines', 'added', ARRAY['musannaf.12818', 'mughni.10.465.1']),
          'В черновик добавлены места из загруженных «Мусаннафа» и «Мугни». Специалистом не проверено.', 'migration:064');
END $$;
