-- 031: two topics of the Quran's textual history, one after the other.
-- quran-writing: what was written in the Prophet's lifetime.
-- uthman-mushaf: Uthman's codex.
-- Circumstances are quotations checked against the stored texts.
-- A topic that already has circumstances or a position is left untouched.

DO $$
DECLARE
  tid bigint;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'quran-writing';
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
      ('main', 'quran.4.95', 0),      ('main', 'bukhari.4990', 1),      ('main', 'bukhari.3810', 2),      ('main', 'bukhari.5003', 3),      ('main', 'muslim.2465.1', 4),      ('main', 'muslim.2465.2', 5),      ('main', 'tirmidhi.3794.1', 6),      ('main', 'ahmad.13441', 7),      ('main', 'ahmad.13942', 8),      ('main', 'bukhari.3220', 9),      ('main', 'bukhari.4998', 10),      ('main', 'bukhari.6285', 11),      ('main', 'muslim.2450.2', 12),      ('main', 'muslim.2450.3', 13),      ('main', 'ibn_majah.1621', 14),      ('main', 'ahmad.9190', 15),      ('main', 'ahmad.26413', 16),      ('circumstances', 'muslim.3004.1', 17),      ('circumstances', 'ahmad.11085', 18),      ('circumstances', 'ahmad.11087', 19),      ('circumstances', 'ahmad.11158', 20),      ('circumstances', 'ahmad.11344', 21),      ('circumstances', 'ahmad.11536', 22),      ('related', 'masahif_ibn_abi_dawud.1', 23),      ('related', 'masahif_ibn_abi_dawud.2', 24),      ('related', 'masahif_ibn_abi_dawud.3', 25),      ('related', 'masahif_ibn_abi_dawud.4', 26),      ('related', 'masahif_ibn_abi_dawud.5', 27),      ('related', 'masahif_ibn_abi_dawud.6', 28),      ('related', 'masahif_ibn_abi_dawud.7', 29),      ('related', 'masahif_ibn_abi_dawud.8', 30),      ('related', 'masahif_ibn_abi_dawud.9', 31),      ('related', 'masahif_ibn_abi_dawud.10', 32),      ('related', 'masahif_ibn_abi_dawud.11', 33),      ('related', 'masahif_ibn_abi_dawud.13', 34),      ('related', 'fadail_abu_ubayd.654', 35),      ('related', 'fadail_abu_ubayd.655', 36),      ('related', 'fadail_abu_ubayd.656', 37),      ('related', 'fadail_abu_ubayd.657', 38),      ('related', 'fadail_abu_ubayd.658', 39),      ('related', 'fadail_abu_ubayd.659', 40),      ('related', 'fadail_abu_ubayd.660', 41),      ('related', 'fadail_abu_ubayd.661', 42),      ('related', 'fadail_abu_ubayd.662', 43),      ('related', 'fadail_abu_ubayd.663', 44),      ('related', 'fadail_abu_ubayd.664', 45),      ('related', 'fadail_abu_ubayd.665', 46),      ('related', 'fadail_abu_ubayd.666', 47),      ('related', 'fadail_abu_ubayd.667', 48),      ('related', 'fadail_abu_ubayd.668', 49),      ('related', 'fadail_abu_ubayd.669', 50),      ('related', 'fadail_abu_ubayd.670', 51),      ('related', 'fadail_abu_ubayd.671', 52),      ('related', 'fadail_abu_ubayd.672', 53),      ('related', 'fadail_abu_ubayd.673', 54),      ('related', 'fadail_abu_ubayd.674', 55),      ('related', 'fadail_abu_ubayd.675', 56),      ('related', 'fadail_abu_ubayd.676', 57),      ('related', 'fadail_abu_ubayd.677', 58),      ('related', 'kafi.7.14.5', 59),      ('related', 'kafi.7.14.6', 60),      ('related', 'tafsir_ibn_kathir.0.3', 61),      ('related', 'tafsir_ibn_kathir.0.10', 62)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Бухари 4990: «ادع لي زيدا وليجئ باللوح والدواة والكتف - أو الكتف والدواة -» и далее веление записать 4:95. Бухари 3810: «جمع القرآن على عهد النبي صلى الله عليه وسلم أربعة، كلهم من الأنصار: أبي، ومعاذ بن جبل، وأبو زيد، وزيد بن ثابت». Бухари 4998: «القرآن كل عام مرة، فعرض عليه مرتين في العام الذي قبض فيه». Другой рассказ, Муслим 3004a: «لا تكتبوا عني ومن كتب عني غير القرآن فليمحه». Ахмад 11085 оставляет оговорку «إلا القرآن», Ахмад 11087 говорит «لا تكتبوا عني شيئا» без этой оговорки.$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'quran-writing', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Позиции сторон не заполнялись.',
      'migration:031'
    );
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'uthman-mushaf';
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
      ('main', 'bukhari.3506', 0),      ('main', 'bukhari.4984', 1),      ('main', 'bukhari.4987', 2),      ('main', 'tirmidhi.3104.1', 3),      ('circumstances', 'bukhari.4987', 4),      ('circumstances', 'bukhari.3506', 5),      ('circumstances', 'ansab_baladhuri.5.552.1', 6),      ('related', 'masahif_ibn_abi_dawud.38', 7),      ('related', 'masahif_ibn_abi_dawud.39', 8),      ('related', 'masahif_ibn_abi_dawud.40', 9),      ('related', 'masahif_ibn_abi_dawud.41', 10),      ('related', 'masahif_ibn_abi_dawud.42', 11),      ('related', 'masahif_ibn_abi_dawud.43', 12),      ('related', 'masahif_ibn_abi_dawud.44', 13),      ('related', 'masahif_ibn_abi_dawud.45', 14),      ('related', 'masahif_ibn_abi_dawud.46', 15),      ('related', 'masahif_ibn_abi_dawud.47', 16),      ('related', 'masahif_ibn_abi_dawud.48', 17),      ('related', 'masahif_ibn_abi_dawud.49', 18),      ('related', 'masahif_ibn_abi_dawud.50', 19),      ('related', 'masahif_ibn_abi_dawud.51', 20),      ('related', 'masahif_ibn_abi_dawud.52', 21),      ('related', 'masahif_ibn_abi_dawud.53', 22),      ('related', 'masahif_ibn_abi_dawud.54', 23),      ('related', 'masahif_ibn_abi_dawud.55', 24),      ('related', 'masahif_ibn_abi_dawud.56', 25),      ('related', 'masahif_ibn_abi_dawud.57', 26),      ('related', 'masahif_ibn_abi_dawud.58', 27),      ('related', 'masahif_ibn_abi_dawud.59', 28),      ('related', 'masahif_ibn_abi_dawud.60', 29),      ('related', 'masahif_ibn_abi_dawud.61', 30),      ('related', 'masahif_ibn_abi_dawud.62', 31),      ('related', 'masahif_ibn_abi_dawud.63', 32),      ('related', 'masahif_ibn_abi_dawud.64', 33),      ('related', 'masahif_ibn_abi_dawud.65', 34),      ('related', 'masahif_ibn_abi_dawud.66', 35),      ('related', 'masahif_ibn_abi_dawud.67', 36),      ('related', 'masahif_ibn_abi_dawud.68', 37),      ('related', 'masahif_ibn_abi_dawud.69', 38),      ('related', 'masahif_ibn_abi_dawud.70', 39),      ('related', 'masahif_ibn_abi_dawud.71', 40),      ('related', 'masahif_ibn_abi_dawud.72', 41),      ('related', 'masahif_ibn_abi_dawud.73', 42),      ('related', 'masahif_ibn_abi_dawud.74', 43),      ('related', 'masahif_ibn_abi_dawud.75', 44),      ('related', 'masahif_ibn_abi_dawud.77', 45),      ('related', 'masahif_ibn_abi_dawud.78', 46),      ('related', 'masahif_ibn_abi_dawud.79', 47),      ('related', 'masahif_ibn_abi_dawud.80', 48),      ('related', 'masahif_ibn_abi_dawud.81', 49),      ('related', 'masahif_ibn_abi_dawud.82', 50),      ('related', 'masahif_ibn_abi_dawud.83', 51),      ('related', 'masahif_ibn_abi_dawud.84', 52),      ('related', 'masahif_ibn_abi_dawud.85', 53),      ('related', 'masahif_ibn_abi_dawud.86', 54),      ('related', 'masahif_ibn_abi_dawud.87', 55),      ('related', 'masahif_ibn_abi_dawud.88', 56),      ('related', 'masahif_ibn_abi_dawud.89', 57),      ('related', 'masahif_ibn_abi_dawud.90', 58),      ('related', 'masahif_ibn_abi_dawud.91', 59),      ('related', 'masahif_ibn_abi_dawud.97', 60),      ('related', 'masahif_ibn_abi_dawud.98', 61),      ('related', 'masahif_ibn_abi_dawud.99', 62),      ('related', 'masahif_ibn_abi_dawud.100', 63),      ('related', 'masahif_ibn_abi_dawud.101', 64),      ('related', 'masahif_ibn_abi_dawud.102', 65),      ('related', 'masahif_ibn_abi_dawud.103', 66),      ('related', 'masahif_ibn_abi_dawud.106', 67),      ('related', 'masahif_ibn_abi_dawud.107', 68),      ('related', 'masahif_ibn_abi_dawud.108', 69),      ('related', 'masahif_ibn_abi_dawud.109', 70),      ('related', 'masahif_ibn_abi_dawud.110', 71),      ('related', 'masahif_ibn_abi_dawud.111', 72),      ('related', 'masahif_ibn_abi_dawud.112', 73),      ('related', 'masahif_ibn_abi_dawud.113', 74),      ('related', 'masahif_ibn_abi_dawud.114', 75),      ('related', 'masahif_ibn_abi_dawud.115', 76),      ('related', 'masahif_ibn_abi_dawud.116', 77),      ('related', 'masahif_ibn_abi_dawud.117', 78),      ('related', 'masahif_ibn_abi_dawud.118', 79),      ('related', 'masahif_ibn_abi_dawud.119', 80),      ('related', 'masahif_ibn_abi_dawud.120', 81),      ('related', 'masahif_ibn_abi_dawud.121', 82),      ('related', 'masahif_ibn_abi_dawud.122', 83),      ('related', 'masahif_ibn_abi_dawud.123', 84),      ('related', 'masahif_ibn_abi_dawud.124', 85),      ('related', 'masahif_ibn_abi_dawud.125', 86),      ('related', 'masahif_ibn_abi_dawud.126', 87),      ('related', 'masahif_ibn_abi_dawud.127', 88),      ('related', 'masahif_ibn_abi_dawud.128', 89),      ('related', 'masahif_ibn_abi_dawud.129', 90),      ('related', 'masahif_ibn_abi_dawud.130', 91),      ('related', 'masahif_ibn_abi_dawud.131', 92),      ('related', 'masahif_ibn_abi_dawud.132', 93),      ('related', 'masahif_ibn_abi_dawud.133', 94),      ('related', 'masahif_ibn_abi_dawud.134', 95),      ('related', 'masahif_ibn_abi_dawud.135', 96),      ('related', 'masahif_ibn_abi_dawud.136', 97),      ('related', 'masahif_ibn_abi_dawud.138', 98),      ('related', 'masahif_ibn_abi_dawud.139', 99),      ('related', 'masahif_ibn_abi_dawud.140', 100),      ('related', 'fadail_abu_ubayd.593', 101),      ('related', 'fadail_abu_ubayd.594', 102),      ('related', 'ansab_baladhuri.5.552', 103),      ('related', 'ansab_baladhuri.9.400', 104),      ('related', 'ansab_baladhuri.10.176', 105),      ('related', 'ansab_baladhuri.12.348', 106)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Бухари 4987: «فأفزع حذيفة اختلافهم في القراءة» и «أدرك هذه الأمة، قبل أن يختلفوا في الكتاب اختلاف اليهود والنصارى». Бухари 3506: «فاكتبوه بلسان قريش، فإنما نزل بلسانهم». Ансаб 5:552 передаёт упрёк Усману: «أحرقت كتاب الله» и его ответ «اختلف الناس في القراءة».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'uthman-mushaf', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Позиции сторон не заполнялись.',
      'migration:031'
    );
  END IF;
END $$;
