-- 027: the namaz topic keeps the places already chosen in
-- docs/topics/namaz-sources.md, but in the fields they belong to.
-- Main: 2:142-144, the ayahs the qibla reports quote.
-- Circumstances: how the prayer was prescribed (fifty then five, Jibril and
-- the times, the qibla, the first number of rak'at).
-- Related: "pray as you saw me pray" and combining two prayers.
-- The hajj reports stay in that document for the hajj topic.
-- Nothing is written for the author: if circumstances or a position already
-- exist, the topic is left untouched. A topic that does not exist yet is skipped.

DO $$
DECLARE
  tid bigint;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'namaz';
  IF tid IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM topic_texts
    WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) <> ''
  ) THEN
    RETURN;
  END IF;

  DELETE FROM topic_refs
  WHERE topic_id = tid AND role IN ('main', 'circumstances', 'related');

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.2.142', 0),
    ('main', 'quran.2.143', 1),
    ('main', 'quran.2.144', 2),
    ('circumstances', 'bukhari.349', 3),
    ('circumstances', 'bukhari.3342', 4),
    ('circumstances', 'bukhari.3887', 5),
    ('circumstances', 'bukhari.7517', 6),
    ('circumstances', 'muslim.162.1', 7),
    ('circumstances', 'muslim.163.1', 8),
    ('circumstances', 'nasai.449.1', 9),
    ('circumstances', 'nasai.450.1', 10),
    ('circumstances', 'ibn_majah.1399', 11),
    ('circumstances', 'ibn_majah.1400', 12),
    ('circumstances', 'ahmad.2890', 13),
    ('circumstances', 'ahmad.2891', 14),
    ('circumstances', 'ahmad.12505', 15),
    ('circumstances', 'ahmad.17835', 16),
    ('circumstances', 'ahmad.21288', 17),
    ('circumstances', 'abu_dawud.393', 18),
    ('circumstances', 'tirmidhi.149.1', 19),
    ('circumstances', 'tirmidhi.150.1', 20),
    ('circumstances', 'ahmad.3081', 21),
    ('circumstances', 'ahmad.3322', 22),
    ('circumstances', 'ahmad.11249', 23),
    ('circumstances', 'bukhari.40', 24),
    ('circumstances', 'bukhari.399', 25),
    ('circumstances', 'bukhari.4486', 26),
    ('circumstances', 'bukhari.4492', 27),
    ('circumstances', 'bukhari.7252', 28),
    ('circumstances', 'muslim.525.1', 29),
    ('circumstances', 'muslim.525.2', 30),
    ('circumstances', 'abu_dawud.507', 31),
    ('circumstances', 'tirmidhi.340.1', 32),
    ('circumstances', 'tirmidhi.2962.1', 33),
    ('circumstances', 'nasai.488.1', 34),
    ('circumstances', 'nasai.489.1', 35),
    ('circumstances', 'nasai.742.1', 36),
    ('circumstances', 'ibn_majah.1010', 37),
    ('circumstances', 'ahmad.2252', 38),
    ('circumstances', 'ahmad.2991', 39),
    ('circumstances', 'ahmad.3270', 40),
    ('circumstances', 'ahmad.3363', 41),
    ('circumstances', 'ahmad.18496', 42),
    ('circumstances', 'ahmad.18539', 43),
    ('circumstances', 'ahmad.18707', 44),
    ('circumstances', 'ahmad.22124', 45),
    ('circumstances', 'bukhari.3935', 46),
    ('circumstances', 'muslim.685.1', 47),
    ('circumstances', 'abu_dawud.1198', 48),
    ('circumstances', 'nasai.453.1', 49),
    ('circumstances', 'nasai.455.1', 50),
    ('circumstances', 'ahmad.25967', 51),
    ('circumstances', 'ahmad.26042', 52),
    ('circumstances', 'ahmad.26282', 53),
    ('circumstances', 'bukhari.350', 54),
    ('circumstances', 'muslim.685.2', 55),
    ('circumstances', 'muslim.687.1', 56),
    ('circumstances', 'nasai.1532.1', 57),
    ('circumstances', 'ahmad.2293', 58),
    ('circumstances', 'kafi.12.3.3', 59),
    ('related', 'bukhari.631', 60),
    ('related', 'bukhari.6008', 61),
    ('related', 'bukhari.7246', 62),
    ('related', 'bukhari.543', 63),
    ('related', 'bukhari.562', 64),
    ('related', 'bukhari.1174', 65),
    ('related', 'muslim.705', 66),
    ('related', 'abu_dawud.1210', 67),
    ('related', 'abu_dawud.1211', 68),
    ('related', 'abu_dawud.1214', 69),
    ('related', 'tirmidhi.187.1', 70),
    ('related', 'nasai.589.1', 71),
    ('related', 'nasai.601.1', 72),
    ('related', 'nasai.602.1', 73),
    ('related', 'nasai.603.1', 74),
    ('related', 'ahmad.1918', 75),
    ('related', 'ahmad.1929', 76),
    ('related', 'ahmad.1953', 77),
    ('related', 'ahmad.2269', 78),
    ('related', 'ahmad.2465', 79),
    ('related', 'ahmad.2557', 80),
    ('related', 'ahmad.2582', 81),
    ('related', 'ahmad.3265', 82),
    ('related', 'ahmad.3293', 83),
    ('related', 'ahmad.3323', 84),
    ('related', 'ahmad.3397', 85),
    ('related', 'ahmad.3467', 86),
    ('related', 'tirmidhi.188.1', 87),
    ('related', 'kafi.12.9.1', 88),
    ('related', 'kafi.12.9.2', 89),
    ('related', 'kafi.12.9.3', 90),
    ('related', 'kafi.12.9.4', 91),
    ('related', 'kafi.12.9.5', 92),
    ('related', 'kafi.12.9.6', 93),
    ('related', 'kafi.12.76.3', 94),
    ('related', 'kafi.12.76.4', 95),
    ('related', 'kafi.12.63.2', 96),
    ('related', 'kafi.19.33.7', 97),
    ('related', 'bukhari.1092', 98),
    ('related', 'bukhari.1106', 99),
    ('related', 'bukhari.1107', 100),
    ('related', 'muslim.703', 101),
    ('related', 'muslim.704', 102),
    ('related', 'muslim.706', 103),
    ('related', 'abu_dawud.1206', 104),
    ('related', 'abu_dawud.1208', 105),
    ('related', 'abu_dawud.1209', 106),
    ('related', 'abu_dawud.1220', 107),
    ('related', 'ibn_majah.1069', 108),
    ('related', 'ibn_majah.1070', 109),
    ('related', 'nasai.587.1', 110),
    ('related', 'nasai.588.1', 111),
    ('related', 'nasai.593.1', 112),
    ('related', 'nasai.597.1', 113),
    ('related', 'nasai.598.1', 114),
    ('related', 'nasai.599.1', 115),
    ('related', 'nasai.600.1', 116),
    ('related', 'tirmidhi.553.1', 117),
    ('related', 'tirmidhi.554.1', 118),
    ('related', 'ahmad.1874', 119),
    ('related', 'ahmad.2191', 120),
    ('related', 'ahmad.3288', 121),
    ('related', 'ahmad.3480', 122),
    ('related', 'ahmad.4472', 123),
    ('related', 'ahmad.4542', 124),
    ('related', 'ahmad.5163', 125),
    ('related', 'ahmad.5305', 126),
    ('related', 'ahmad.5516', 127),
    ('related', 'ahmad.5791', 128),
    ('related', 'ahmad.5838', 129),
    ('related', 'ahmad.6354', 130),
    ('related', 'ahmad.6375', 131),
    ('related', 'ahmad.6682', 132),
    ('related', 'ahmad.6694', 133),
    ('related', 'ahmad.6906', 134),
    ('related', 'ahmad.12408', 135),
    ('related', 'ahmad.14749', 136),
    ('related', 'ahmad.21997', 137),
    ('related', 'ahmad.22012', 138),
    ('related', 'ahmad.22036', 139),
    ('related', 'ahmad.22062', 140),
    ('related', 'ahmad.22070', 141),
    ('related', 'ahmad.22094', 142)
  ) AS v(role, address, pos);

  INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
  VALUES (
    'topic', tid::text, 'updated',
    NULL,
    jsonb_build_object(
      'slug', 'namaz',
      'main', (SELECT count(*) FROM topic_refs WHERE topic_id = tid AND role = 'main'),
      'circumstances', (SELECT count(*) FROM topic_refs WHERE topic_id = tid AND role = 'circumstances'),
      'related', (SELECT count(*) FROM topic_refs WHERE topic_id = tid AND role = 'related')
    ),
    'Места намаза разложены по полям: аяты киблы, обстоятельства предписания, связанные рассказы. Текст обстоятельств и позиции сторон не заполнялись.',
    'migration:027'
  );
END $$;
