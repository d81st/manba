-- 035: dots, vowels and other marks (docs/topics/quran-text-sources.md).
-- Circumstances quote only phrases checked against the stored texts.
-- Reports that name different people, and Hasan's two wordings, stay apart.
-- A topic that already has circumstances or a position is left untouched.

DO $$
DECLARE
  tid bigint;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'dots-and-vowels';
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
      ('main', 'tafsir_ibn_kathir.0.9', 0),
      ('main', 'masahif_ibn_abi_dawud.444', 1),
      ('main', 'masahif_ibn_abi_dawud.445', 2),
      ('main', 'masahif_ibn_abi_dawud.446', 3),
      ('main', 'masahif_ibn_abi_dawud.447', 4),
      ('main', 'masahif_ibn_abi_dawud.448', 5),
      ('main', 'masahif_ibn_abi_dawud.449', 6),
      ('main', 'masahif_ibn_abi_dawud.450', 7),
      ('main', 'masahif_ibn_abi_dawud.451', 8),
      ('main', 'masahif_ibn_abi_dawud.452', 9),
      ('main', 'masahif_ibn_abi_dawud.453', 10),
      ('main', 'masahif_ibn_abi_dawud.454', 11),
      ('main', 'masahif_ibn_abi_dawud.455', 12),
      ('main', 'masahif_ibn_abi_dawud.456', 13),
      ('main', 'masahif_ibn_abi_dawud.457', 14),
      ('main', 'masahif_ibn_abi_dawud.458', 15),
      ('main', 'masahif_ibn_abi_dawud.459', 16),
      ('main', 'masahif_ibn_abi_dawud.460', 17),
      ('main', 'masahif_ibn_abi_dawud.461', 18),
      ('main', 'masahif_ibn_abi_dawud.462', 19),
      ('main', 'masahif_ibn_abi_dawud.463', 20),
      ('main', 'masahif_ibn_abi_dawud.464', 21),
      ('main', 'masahif_ibn_abi_dawud.465', 22),
      ('main', 'masahif_ibn_abi_dawud.466', 23),
      ('main', 'masahif_ibn_abi_dawud.467', 24),
      ('main', 'masahif_ibn_abi_dawud.468', 25),
      ('main', 'masahif_ibn_abi_dawud.469', 26),
      ('main', 'masahif_ibn_abi_dawud.470', 27),
      ('main', 'masahif_ibn_abi_dawud.471', 28),
      ('main', 'fadail_abu_ubayd.731', 29),
      ('main', 'fadail_abu_ubayd.732', 30),
      ('main', 'fadail_abu_ubayd.733', 31),
      ('main', 'fadail_abu_ubayd.734', 32),
      ('main', 'fadail_abu_ubayd.735', 33),
      ('main', 'fadail_abu_ubayd.736', 34),
      ('main', 'masahif_ibn_abi_dawud.348', 35),
      ('main', 'ansab_baladhuri.13.387.1', 36),
      ('main', 'kafi.7.14.8', 37),
      ('circumstances', 'tafsir_ibn_kathir.0.9', 38),
      ('circumstances', 'masahif_ibn_abi_dawud.444', 39),
      ('circumstances', 'masahif_ibn_abi_dawud.445', 40),
      ('circumstances', 'masahif_ibn_abi_dawud.446', 41),
      ('circumstances', 'masahif_ibn_abi_dawud.460', 42),
      ('circumstances', 'fadail_abu_ubayd.731', 43),
      ('circumstances', 'fadail_abu_ubayd.734', 44),
      ('circumstances', 'masahif_ibn_abi_dawud.348', 45),
      ('circumstances', 'ansab_baladhuri.13.387.1', 46),
      ('circumstances', 'kafi.7.14.8', 47),
      ('related', 'masahif_ibn_abi_dawud.412', 48),
      ('related', 'masahif_ibn_abi_dawud.413', 49),
      ('related', 'masahif_ibn_abi_dawud.414', 50),
      ('related', 'masahif_ibn_abi_dawud.415', 51),
      ('related', 'masahif_ibn_abi_dawud.416', 52),
      ('related', 'masahif_ibn_abi_dawud.417', 53),
      ('related', 'masahif_ibn_abi_dawud.418', 54),
      ('related', 'masahif_ibn_abi_dawud.419', 55),
      ('related', 'masahif_ibn_abi_dawud.420', 56),
      ('related', 'masahif_ibn_abi_dawud.421', 57),
      ('related', 'masahif_ibn_abi_dawud.422', 58),
      ('related', 'masahif_ibn_abi_dawud.423', 59),
      ('related', 'masahif_ibn_abi_dawud.424', 60),
      ('related', 'masahif_ibn_abi_dawud.425', 61),
      ('related', 'masahif_ibn_abi_dawud.426', 62),
      ('related', 'masahif_ibn_abi_dawud.427', 63),
      ('related', 'masahif_ibn_abi_dawud.428', 64),
      ('related', 'masahif_ibn_abi_dawud.429', 65),
      ('related', 'masahif_ibn_abi_dawud.430', 66),
      ('related', 'masahif_ibn_abi_dawud.431', 67),
      ('related', 'masahif_ibn_abi_dawud.432', 68),
      ('related', 'masahif_ibn_abi_dawud.433', 69),
      ('related', 'masahif_ibn_abi_dawud.434', 70),
      ('related', 'masahif_ibn_abi_dawud.435', 71),
      ('related', 'masahif_ibn_abi_dawud.436', 72),
      ('related', 'masahif_ibn_abi_dawud.437', 73),
      ('related', 'masahif_ibn_abi_dawud.438', 74),
      ('related', 'masahif_ibn_abi_dawud.439', 75),
      ('related', 'masahif_ibn_abi_dawud.440', 76),
      ('related', 'masahif_ibn_abi_dawud.441', 77),
      ('related', 'masahif_ibn_abi_dawud.442', 78),
      ('related', 'masahif_ibn_abi_dawud.443', 79),
      ('related', 'fadail_abu_ubayd.737', 80),
      ('related', 'fadail_abu_ubayd.738', 81),
      ('related', 'fadail_abu_ubayd.739', 82),
      ('related', 'fadail_abu_ubayd.740', 83),
      ('related', 'fadail_abu_ubayd.741', 84),
      ('related', 'fadail_abu_ubayd.742', 85),
      ('related', 'masahif_ibn_abi_dawud.332', 86),
      ('related', 'masahif_ibn_abi_dawud.333', 87),
      ('related', 'masahif_ibn_abi_dawud.334', 88),
      ('related', 'masahif_ibn_abi_dawud.335', 89),
      ('related', 'masahif_ibn_abi_dawud.336', 90),
      ('related', 'masahif_ibn_abi_dawud.337', 91),
      ('related', 'masahif_ibn_abi_dawud.338', 92),
      ('related', 'masahif_ibn_abi_dawud.339', 93),
      ('related', 'masahif_ibn_abi_dawud.340', 94),
      ('related', 'masahif_ibn_abi_dawud.341', 95),
      ('related', 'masahif_ibn_abi_dawud.342', 96),
      ('related', 'masahif_ibn_abi_dawud.343', 97),
      ('related', 'masahif_ibn_abi_dawud.344', 98),
      ('related', 'masahif_ibn_abi_dawud.345', 99),
      ('related', 'masahif_ibn_abi_dawud.346', 100),
      ('related', 'masahif_ibn_abi_dawud.347', 101)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Ибн Касир 0:9 приводит два рассказа: «إن أول من أمر به عبد الملك بن مروان، فتصدى لذلك الحجاج وهو بواسط، فأمر الحسن البصري ويحيى بن يعمر ففعلا ذلك» и «إن أول من نقط المصحف أبو الأسود الدؤلي». Там же: «أول ما أحدثوا النقط على الباء والتاء والثاء، وقالوا: لا بأس به، هو نور له», «بدؤوا فنقطوا، ثم خمسوا، ثم عشروا», а десятки на полях «فينسب إلى الحجاج أيضا، وقيل: بل أول من فعله المأمون». Масахиф 444: «أول من نقط المصاحف يحيى بن يعمر». Масахиف 445: Хасан «كره أن تنقط المصاحف بالنحو»; Масахиف 446: Ибн Сирин «كره نقط المصحف بالنحو»; Масахиف 460: Хасан «لا يرى بأسا أن ينقط المصحف بالنحو». Абу Убайд 731 передаёт слова Ибрахима: «جردوا القرآن ، لا تخلطوا به ما ليس منه»; Абу Убайد 734: «لا بأس بنقط المصاحف» и «كرهه ابن سيرين». Масахиф 348: «أن الحجاج بن يوسف غير في مصحف عثمان أحد عشر حرفا»; первое названное место — «لم يتسن وانظر ) فغيرها ( لم يتسنه». Ансаб 13:387: «عددنا حروف القرآن بالشعير للحجاج». «аль-Каفي» 7.14.8: «لا يعجبني أن يكتب القرآن إلا بالسواد كما كتب أول مرة».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'dots-and-vowels', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Разные имена и две формулировки о Хасане не сведены. Позиции сторон не заполнялись.',
      'migration:035'
    );
  END IF;
END $$;
