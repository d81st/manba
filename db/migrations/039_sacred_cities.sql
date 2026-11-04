-- 039: the seven sacred cities (docs/topics/cities-sources.md).
-- Circumstances quote only phrases checked against the stored texts.
-- Differing boundaries and burial places are not merged.
-- A city that already has circumstances or a position is left untouched.

DO $$
DECLARE
  tid bigint;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'makka';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs
    WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.2.125', 0),
      ('main', 'quran.2.126', 1),
      ('main', 'quran.2.127', 2),
      ('main', 'quran.2.144', 3),
      ('main', 'quran.3.96', 4),
      ('main', 'quran.3.97', 5),
      ('main', 'quran.5.97', 6),
      ('main', 'quran.14.35', 7),
      ('main', 'quran.48.24', 8),
      ('main', 'quran.90.1', 9),
      ('main', 'quran.90.2', 10),
      ('main', 'quran.95.3', 11),
      ('main', 'quran.106.3', 12),
      ('main', 'bukhari.1587', 13),
      ('main', 'kafi.15.201.7', 14),
      ('circumstances', 'quran.3.96', 15),
      ('circumstances', 'quran.5.97', 16),
      ('circumstances', 'bukhari.1587', 17),
      ('circumstances', 'kafi.15.201.7', 18),
      ('related', 'bukhari.104', 19),
      ('related', 'bukhari.1832', 20),
      ('related', 'muslim.1353.1', 21),
      ('related', 'muslim.1353.2', 22),
      ('related', 'muslim.1353.3', 23),
      ('related', 'muslim.1353.4', 24),
      ('related', 'muslim.1354.1', 25),
      ('related', 'bukhari.1189', 26),
      ('related', 'muslim.1397.1', 27),
      ('related', 'muslim.1397.2', 28),
      ('related', 'muslim.1397.3', 29),
      ('related', 'kafi.15.201.1', 30),
      ('related', 'kafi.15.201.2', 31),
      ('related', 'kafi.15.201.3', 32),
      ('related', 'kafi.15.201.4', 33),
      ('related', 'kafi.15.201.5', 34),
      ('related', 'kafi.15.201.6', 35),
      ('related', 'kafi.15.201.8', 36),
      ('related', 'kafi.15.201.9', 37),
      ('related', 'kafi.15.201.10', 38),
      ('related', 'kafi.15.201.11', 39),
      ('related', 'kafi.15.201.12', 40),
      ('related', 'ibn_hisham.1.192.1', 41),
      ('related', 'ibn_hisham.1.192.2', 42),
      ('related', 'maghazi_waqidi.2.780.1', 43),
      ('related', 'maghazi_waqidi.2.780.2', 44)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$В 3:96 у Хафса: «بِبَكَّةَ». В 5:97: «ٱلْكَعْبَةَ ٱلْبَيْتَ ٱلْحَرَامَ». Бухари 1587, в день взятия Мекки: «إن هذا البلد حرمه الله». «аль-Кафи» 15.201.7: «إنما سميت بكة لأنها تبك فيها الرجال والنساء».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'makka', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Расходящиеся формулировки не сведены. Позиции сторон не заполнялись.',
      'migration:039'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'madina';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs
    WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.9.101', 0),
      ('main', 'quran.9.120', 1),
      ('main', 'quran.33.13', 2),
      ('main', 'quran.33.60', 3),
      ('main', 'quran.63.8', 4),
      ('main', 'bukhari.1870', 5),
      ('main', 'muslim.1360.1', 6),
      ('main', 'muslim.1370.1', 7),
      ('main', 'kafi.15.223.2', 8),
      ('main', 'kafi.15.223.4', 9),
      ('circumstances', 'quran.33.13', 10),
      ('circumstances', 'muslim.1360.1', 11),
      ('circumstances', 'muslim.1370.1', 12),
      ('circumstances', 'bukhari.1870', 13),
      ('circumstances', 'kafi.15.223.2', 14),
      ('circumstances', 'kafi.15.223.4', 15),
      ('related', 'bukhari.1867', 16),
      ('related', 'muslim.1360.2', 17),
      ('related', 'muslim.1370.2', 18),
      ('related', 'muslim.1370.3', 19),
      ('related', 'muslim.1370.4', 20),
      ('related', 'kafi.15.215.1', 21),
      ('related', 'kafi.15.215.2', 22),
      ('related', 'kafi.15.219.1', 23),
      ('related', 'kafi.15.219.2', 24),
      ('related', 'kafi.15.219.3', 25),
      ('related', 'kafi.15.219.4', 26),
      ('related', 'kafi.15.219.5', 27),
      ('related', 'kafi.15.223.1', 28),
      ('related', 'kafi.15.223.3', 29),
      ('related', 'kafi.15.223.5', 30),
      ('related', 'kafi.15.223.6', 31),
      ('related', 'ibn_hisham.1.590.1', 32),
      ('related', 'ibn_hisham.1.590.2', 33),
      ('related', 'ibn_hisham.1.590.3', 34)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$В 33:13: «يَثْرِبَ». Муслим 1360: «حرمت المدينة كما حرم إبراهيم مكة». Границы заповедности названы по-разному. Муслим 1370: «ما بين عير إلى ثور». Бухари 1870: «ما بين عائر إلى كذا». «аль-Кафи» 15.223.2: «بريدا في بريد». «аль-Кафи» 15.223.4: «من ذباب إلى وأقم».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'madina', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Расходящиеся формулировки не сведены. Позиции сторон не заполнялись.',
      'migration:039'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'jerusalem';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs
    WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.17.1', 0),
      ('main', 'quran.5.21', 1),
      ('main', 'quran.2.142', 2),
      ('main', 'quran.2.143', 3),
      ('main', 'quran.2.144', 4),
      ('main', 'bukhari.40', 5),
      ('main', 'bukhari.3886', 6),
      ('main', 'ibn_hisham.1.550.2', 7),
      ('circumstances', 'quran.17.1', 8),
      ('circumstances', 'bukhari.40', 9),
      ('circumstances', 'ibn_hisham.1.550.2', 10),
      ('circumstances', 'bukhari.3886', 11),
      ('related', 'bukhari.1189', 12),
      ('related', 'muslim.1397.1', 13),
      ('related', 'muslim.1397.2', 14),
      ('related', 'muslim.1397.3', 15),
      ('related', 'muslim.525.1', 16),
      ('related', 'muslim.525.2', 17),
      ('related', 'ibn_hisham.1.396.1', 18),
      ('related', 'ibn_hisham.1.396.2', 19),
      ('related', 'ibn_hisham.1.550.1', 20),
      ('related', 'ibn_hisham.1.550.3', 21),
      ('related', 'tarikh_tabari.3.607.1', 22),
      ('related', 'tarikh_tabari.3.607.2', 23),
      ('related', 'tarikh_tabari.3.608.1', 24),
      ('related', 'tarikh_tabari.3.609.1', 25),
      ('related', 'tarikh_tabari.3.610.1', 26),
      ('related', 'tarikh_tabari.3.611.1', 27)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$В 17:1: «ٱلْمَسْجِدِ ٱلْأَقْصَا». Бухари 40: «صلى قبل بيت المقدس ستة عشر شهرا، أو سبعة عشر شهرا». Ибн Хишам 1:550: «على رأس سبعة عشر شهرا من مقدم رسول الله صلى الله عليه وسلم المدينة». Бухари 3886: «فجلا الله لي بيت المقدس».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'jerusalem', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Расходящиеся формулировки не сведены. Позиции сторон не заполнялись.',
      'migration:039'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'najaf';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs
    WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'kafi.4.113.5', 0),
      ('main', 'tarikh_tabari.5.143.1', 1),
      ('main', 'tarikh_tabari.5.143.2', 2),
      ('main', 'tarikh_tabari.5.143.3', 3),
      ('main', 'tarikh_tabari.5.152.1', 4),
      ('main', 'tarikh_tabari.5.152.2', 5),
      ('main', 'ansab_baladhuri.2.497.1', 6),
      ('circumstances', 'tarikh_tabari.5.152.1', 7),
      ('circumstances', 'ansab_baladhuri.2.497.1', 8),
      ('circumstances', 'kafi.4.113.5', 9),
      ('related', 'kafi.15.227.1', 10),
      ('related', 'kafi.15.228.1', 11),
      ('related', 'kafi.15.228.2', 12),
      ('related', 'kafi.11.90.2', 13)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Ат-Табари 5:152: «ودفن عند مسجد الجماعة في قصر الإمارة». «Ансаб» 2:497: «ودفن علي بالكوفة عند مسجد الجماعة في الرحبة مما يلي أبواب كندة», затем «دفن في الغري», «في الكناسة», «بالسدة». «аль-Кафи» 4.113.5: «ظهر الكوفة قريبا من النجف يسرة عن الغري».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'najaf', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Расходящиеся формулировки не сведены. Позиции сторон не заполнялись.',
      'migration:039'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'karbala';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs
    WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'ahmad.13539', 0),
      ('main', 'ahmad.13794', 1),
      ('main', 'tarikh_tabari.5.382.1', 2),
      ('main', 'tarikh_tabari.5.382.2', 3),
      ('main', 'tarikh_tabari.5.467.1', 4),
      ('main', 'tarikh_tabari.5.467.2', 5),
      ('main', 'tarikh_tabari.9.185.1', 6),
      ('main', 'tarikh_tabari.9.185.2', 7),
      ('main', 'tarikh_tabari.9.185.3', 8),
      ('main', 'ansab_baladhuri.3.193.1', 9),
      ('main', 'ansab_baladhuri.3.225.1', 10),
      ('circumstances', 'ahmad.13539', 11),
      ('circumstances', 'ahmad.13794', 12),
      ('circumstances', 'tarikh_tabari.9.185.2', 13),
      ('related', 'kafi.15.229.1', 14),
      ('related', 'kafi.15.229.2', 15),
      ('related', 'kafi.15.229.3', 16),
      ('related', 'kafi.15.229.4', 17),
      ('related', 'kafi.15.232.1', 18),
      ('related', 'kafi.15.232.2', 19),
      ('related', 'kafi.15.232.3', 20),
      ('related', 'kafi.15.232.4', 21),
      ('related', 'kafi.15.232.5', 22),
      ('related', 'kafi.15.232.6', 23),
      ('related', 'kafi.15.232.7', 24),
      ('related', 'kafi.15.232.8', 25),
      ('related', 'kafi.15.232.9', 26),
      ('related', 'kafi.15.232.10', 27),
      ('related', 'kafi.15.232.11', 28)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Ахмад 13539: «بلغنا أنها كربلاء». Ахмад 13794: «يقتل بكربلاء». Ат-Табари 9:185: «أمر المتوكل بهدم قبر الحسين بن علي».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'karbala', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Расходящиеся формулировки не сведены. Позиции сторон не заполнялись.',
      'migration:039'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'mashhad';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs
    WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'kafi.15.234.3', 0),
      ('main', 'tarikh_tabari.8.568.1', 1),
      ('main', 'tarikh_tabari.8.568.2', 2),
      ('main', 'tarikh_tabari.8.568.3', 3),
      ('circumstances', 'kafi.15.234.3', 4),
      ('related', 'kafi.15.234.1', 5),
      ('related', 'kafi.15.234.2', 6),
      ('related', 'kafi.15.234.4', 7),
      ('related', 'kafi.15.234.5', 8)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$«аль-Кафи» 15.234.3: «من زار قبر أبي بطوس».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'mashhad', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Расходящиеся формулировки не сведены. Позиции сторон не заполнялись.',
      'migration:039'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'qum';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs
    WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'tarikh_tabari.8.614.1', 0),
      ('main', 'tarikh_tabari.8.614.2', 1),
      ('main', 'tarikh_tabari.8.614.3', 2),
      ('main', 'tarikh_tabari.8.614.4', 3),
      ('circumstances', 'tarikh_tabari.8.614.1', 4)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Ат-Табари 8:614: «خلع أهل قم السلطان ومنعوا الخراج».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'qum', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Расходящиеся формулировки не сведены. Позиции сторон не заполнялись.',
      'migration:039'
    );
  END IF;
END $$;
