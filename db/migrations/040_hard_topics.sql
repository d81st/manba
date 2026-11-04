-- 040: the six hard topics (docs/topics/hard-topics-sources.md).
-- The verse stays with the neighbouring verses and with stored reports.
-- Reports that disagree about abrogation are not merged.
-- A topic that already has circumstances or a position is left untouched.

DO $$
DECLARE
  tid bigint;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'sword-verse';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.9.5', 0),
      ('circumstances', 'tafsir_ibn_kathir.9.1', 1),
      ('circumstances', 'tafsir_ibn_kathir.9.5', 2),
      ('circumstances', 'ibn_hisham.2.543.1', 3),
      ('circumstances', 'ibn_hisham.2.543.2', 4),
      ('circumstances', 'ibn_hisham.2.543.3', 5),
      ('circumstances', 'ibn_hisham.2.544.1', 6),
      ('circumstances', 'ibn_hisham.2.545.1', 7),
      ('circumstances', 'ibn_hisham.2.545.2', 8),
      ('circumstances', 'ibn_hisham.2.546.1', 9),
      ('circumstances', 'ibn_hisham.2.546.2', 10),
      ('circumstances', 'bukhari.369', 11),
      ('circumstances', 'bukhari.4655', 12),
      ('circumstances', 'muslim.1347.1', 13),
      ('circumstances', 'quran.9.1', 14),
      ('circumstances', 'quran.9.4', 15),
      ('circumstances', 'quran.9.6', 16),
      ('related', 'quran.9.2', 17),
      ('related', 'quran.9.3', 18),
      ('related', 'quran.9.7', 19),
      ('related', 'quran.9.13', 20),
      ('related', 'tafsir_ibn_kathir.9.6', 21),
      ('related', 'bukhari.25', 22),
      ('related', 'bukhari.392', 23),
      ('related', 'bukhari.1399', 24),
      ('related', 'bukhari.2946', 25),
      ('related', 'muslim.20.1', 26),
      ('related', 'muslim.21.1', 27),
      ('related', 'muslim.22.1', 28),
      ('related', 'abu_dawud.2640', 29),
      ('related', 'nasai.3979.1', 30),
      ('related', 'kafi.16.3.2', 31)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Рядом с 9:5 стоят 9:4: «إِلَّا ٱلَّذِينَ عَـٰهَدتُّم» и 9:6: «فَأَجِرْهُ حَتَّىٰ يَسْمَعَ كَلَـٰمَ ٱللَّهِ». Бухари 369: «لا يحج بعد العام». Ибн Касир 9:5 называет аят «هي آية السيف» и передаёт слова ад-Даххака: «قال فيها الضحاك بن مزاحم: إنها نسخت كل عهد بين النبي».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'sword-verse', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами. Мнения об отмене не сведены. Позиции сторон не заполнялись.',
      'migration:040'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'jizya-verse';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.9.29', 0),
      ('circumstances', 'tafsir_ibn_kathir.9.28', 1),
      ('circumstances', 'ibn_hisham.2.515.1', 2),
      ('circumstances', 'ibn_hisham.2.515.2', 3),
      ('circumstances', 'ibn_hisham.2.525.1', 4),
      ('circumstances', 'ibn_hisham.2.525.2', 5),
      ('circumstances', 'ibn_hisham.2.525.3', 6),
      ('circumstances', 'ibn_hisham.2.526.1', 7),
      ('circumstances', 'ibn_hisham.2.526.2', 8),
      ('circumstances', 'ibn_hisham.2.548.1', 9),
      ('circumstances', 'ibn_hisham.2.548.2', 10),
      ('circumstances', 'ibn_hisham.2.548.3', 11),
      ('circumstances', 'ibn_hisham.2.548.4', 12),
      ('circumstances', 'quran.9.29', 13),
      ('circumstances', 'kafi.16.8.6', 14),
      ('related', 'bukhari.3156', 15),
      ('related', 'bukhari.3157', 16),
      ('related', 'abu_dawud.3043', 17),
      ('related', 'muslim.1731.2', 18),
      ('related', 'abu_dawud.2613', 19),
      ('related', 'kafi.16.8.8', 20),
      ('related', 'kafi.17.130.1', 21),
      ('related', 'kafi.17.130.2', 22),
      ('related', 'kafi.17.130.3', 23),
      ('related', 'kafi.17.130.4', 24),
      ('related', 'kafi.17.130.5', 25),
      ('related', 'kafi.13.46.1', 26),
      ('related', 'kafi.13.46.2', 27),
      ('related', 'kafi.13.46.3', 28),
      ('related', 'kafi.13.46.4', 29),
      ('related', 'kafi.13.46.5', 30),
      ('related', 'kafi.13.46.6', 31),
      ('related', 'kafi.13.46.7', 32)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$В 9:29: «ٱلْجِزْيَةَ». Бухари 3157: «أخذها من مجوس هجر». «аль-Кафи» 16.8.6: «نهى عن قتال النساء».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'jizya-verse', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами. Мнения об отмене не сведены. Позиции сторон не заполнялись.',
      'migration:040'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'fighting-those-who-fight';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.2.190', 0),
      ('main', 'quran.2.191', 1),
      ('main', 'quran.2.192', 2),
      ('main', 'quran.2.193', 3),
      ('circumstances', 'tafsir_ibn_kathir.2.190', 4),
      ('circumstances', 'tafsir_ibn_kathir.22.39', 5),
      ('circumstances', 'ibn_hisham.1.467.1', 6),
      ('circumstances', 'ibn_hisham.1.467.2', 7),
      ('circumstances', 'ibn_hisham.1.467.3', 8),
      ('circumstances', 'ibn_hisham.1.468.1', 9),
      ('circumstances', 'ibn_hisham.1.468.2', 10),
      ('circumstances', 'ibn_hisham.1.468.3', 11),
      ('circumstances', 'quran.2.190', 12),
      ('circumstances', 'kafi.16.8.1', 13),
      ('related', 'quran.22.39', 14),
      ('related', 'quran.22.40', 15),
      ('related', 'quran.4.75', 16),
      ('related', 'quran.4.90', 17),
      ('related', 'quran.8.61', 18),
      ('related', 'muslim.1731.2', 19),
      ('related', 'abu_dawud.2613', 20),
      ('related', 'bukhari.3014', 21),
      ('related', 'bukhari.3015', 22),
      ('related', 'muslim.1744.1', 23),
      ('related', 'muslim.1744.2', 24),
      ('related', 'kafi.16.8.2', 25),
      ('related', 'kafi.16.8.3', 26),
      ('related', 'kafi.16.8.4', 27),
      ('related', 'kafi.16.8.5', 28),
      ('related', 'kafi.16.8.6', 29),
      ('related', 'kafi.16.8.7', 30),
      ('related', 'kafi.16.8.8', 31),
      ('related', 'kafi.16.8.9', 32),
      ('related', 'bukhari.2966', 33),
      ('related', 'muslim.1742.1', 34),
      ('related', 'kafi.16.14.1', 35),
      ('related', 'kafi.16.14.2', 36),
      ('related', 'kafi.16.3.1', 37),
      ('related', 'kafi.16.3.2', 38),
      ('related', 'kafi.16.3.3', 39),
      ('related', 'kafi.16.6.1', 40),
      ('related', 'kafi.16.6.2', 41),
      ('related', 'kafi.16.6.3', 42)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$В 2:190: «ٱلَّذِينَ يُقَـٰتِلُونَكُمْ». Ибн Касир 2:190 передаёт: «هذه أول آية نزلت في القتال». Ибн Касир 22:39 передаёт: «هذه أول آية نزلت في الجهاد». Ибн Хишам 1:467: «أول آية أنزلت في إذنه له في الحرب». «аль-Кафи» 16.8.1: «لا تقتلوا شيخا فانيا ولا صبيا ولا امرأة».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'fighting-those-who-fight', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами. Мнения об отмене не сведены. Позиции сторон не заполнялись.',
      'migration:040'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'no-compulsion';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.2.256', 0),
      ('circumstances', 'tafsir_ibn_kathir.2.256', 1),
      ('circumstances', 'abu_dawud.2682', 2),
      ('circumstances', 'quran.2.256', 3),
      ('related', 'quran.10.99', 4),
      ('related', 'quran.18.29', 5),
      ('related', 'quran.88.21', 6),
      ('related', 'quran.88.22', 7),
      ('related', 'quran.109.6', 8),
      ('related', 'tafsir_ibn_kathir.10.99', 9),
      ('related', 'bukhari.3017', 10),
      ('related', 'bukhari.6922', 11),
      ('related', 'abu_dawud.4351', 12),
      ('related', 'kafi.30.61.1', 13),
      ('related', 'kafi.30.61.3', 14),
      ('related', 'kafi.30.61.5', 15),
      ('related', 'kafi.30.61.8', 16)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$В 2:256: «لَآ إِكْرَاهَ فِى ٱلدِّينِ». Абу Дауд 2682: «أجليت بنو النضير». Ибн Касир 2:256 приводит и другое мнение: «وقال آخرون: بل هي منسوخة بآية القتال».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'no-compulsion', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами. Мнения об отмене не сведены. Позиции сторон не заполнялись.',
      'migration:040'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'non-combatants';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.60.8', 0),
      ('main', 'quran.60.9', 1),
      ('circumstances', 'tafsir_ibn_kathir.60.7', 2),
      ('circumstances', 'bukhari.2620', 3),
      ('circumstances', 'bukhari.3183', 4),
      ('circumstances', 'muslim.1003.1', 5),
      ('circumstances', 'muslim.1003.2', 6),
      ('circumstances', 'quran.60.8', 7),
      ('circumstances', 'bukhari.3053', 8),
      ('related', 'quran.5.5', 9),
      ('related', 'quran.5.51', 10),
      ('related', 'quran.3.28', 11),
      ('related', 'quran.4.90', 12),
      ('related', 'quran.9.6', 13),
      ('related', 'tafsir_ibn_kathir.5.51', 14),
      ('related', 'bukhari.3166', 15),
      ('related', 'abu_dawud.2760', 16),
      ('related', 'kafi.16.9.1', 17),
      ('related', 'kafi.16.9.2', 18),
      ('related', 'kafi.16.9.3', 19),
      ('related', 'kafi.16.9.4', 20),
      ('related', 'kafi.16.9.5', 21),
      ('related', 'bukhari.3168', 22),
      ('related', 'muslim.1637.1', 23),
      ('related', 'muslim.1767.1', 24)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$В 60:8: «لَمْ يُقَـٰتِلُوكُمْ فِى ٱلدِّينِ». Муслиم 1003: «أفأصلها قال نعم». Бухари 3053: «أخرجوا المشركين من جزيرة العرب».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'non-combatants', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами. Мнения об отмене не сведены. Позиции сторон не заполнялись.',
      'migration:040'
    );
  END IF;
  SELECT id INTO tid FROM topics WHERE slug = 'naskh-war-verses';
  IF tid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid)
     AND NOT EXISTS (
       SELECT 1 FROM topic_texts
       WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
     )
  THEN
    DELETE FROM topic_refs WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');
    INSERT INTO topic_refs (topic_id, role, address, position)
    SELECT tid, v.role, v.address::extensions.ltree, v.pos
    FROM (VALUES
      ('main', 'quran.9.5', 0),
      ('main', 'quran.9.29', 1),
      ('circumstances', 'tafsir_ibn_kathir.9.5', 2),
      ('circumstances', 'tafsir_ibn_kathir.2.190', 3),
      ('circumstances', 'tafsir_ibn_kathir.2.256', 4),
      ('circumstances', 'tafsir_ibn_kathir.8.61', 5),
      ('circumstances', 'tafsir_ibn_kathir.47.4', 6),
      ('circumstances', 'kafi.16.3.2', 7),
      ('related', 'quran.2.190', 8),
      ('related', 'quran.2.256', 9),
      ('related', 'quran.8.61', 10),
      ('related', 'quran.47.4', 11),
      ('related', 'quran.2.106', 12),
      ('related', 'quran.16.101', 13),
      ('related', 'tafsir_ibn_kathir.2.106', 14)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Ибн Касир 9:5 передаёт слова ад-Даххака: «إنها نسخت كل عهد بين النبي». Ибн Касир 8:61 передаёт, что аят «منسوخة بآية السيف», и тут же: «فيه نظر أيضا». Ибн Касир 2:256: «وقال آخرون: بل هي منسوخة بآية القتال». «аль-Кафи» 16.3.2: «ثم نسخها».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'naskh-war-verses', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами. Мнения об отмене не сведены. Позиции сторон не заполнялись.',
      'migration:040'
    );
  END IF;
END $$;
