-- 032: Abu Bakr's collection of the Quran (docs/topics/quran-text-sources.md).
-- Circumstances are quotations checked against the stored texts, including
-- the two different names attached to the verses found with one person.
-- A topic that already has circumstances or a position is left untouched.

DO $$
DECLARE
  tid bigint;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'abu-bakr-collection';
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
      ('main', 'quran.9.128', 0),
      ('main', 'quran.33.23', 1),
      ('main', 'bukhari.4679', 2),
      ('main', 'bukhari.4986', 3),
      ('main', 'bukhari.7191', 4),
      ('main', 'tirmidhi.3103.1', 5),
      ('main', 'ahmad.57', 6),
      ('main', 'ahmad.76', 7),
      ('main', 'ahmad.21644', 8),
      ('circumstances', 'bukhari.4986', 9),
      ('circumstances', 'ahmad.21644', 10),
      ('circumstances', 'bukhari.4989', 11),
      ('circumstances', 'bukhari.2807', 12),
      ('related', 'bukhari.2807', 13),
      ('related', 'bukhari.4049', 14),
      ('related', 'bukhari.4784', 15),
      ('related', 'bukhari.4988', 16),
      ('related', 'bukhari.4989', 17),
      ('related', 'bukhari.7425', 18),
      ('related', 'tirmidhi.3104.1', 19),
      ('related', 'ahmad.21640', 20),
      ('related', 'ahmad.21643', 21),
      ('related', 'ahmad.21652', 22),
      ('related', 'masahif_ibn_abi_dawud.14', 23),
      ('related', 'masahif_ibn_abi_dawud.15', 24),
      ('related', 'masahif_ibn_abi_dawud.16', 25),
      ('related', 'masahif_ibn_abi_dawud.17', 26),
      ('related', 'masahif_ibn_abi_dawud.18', 27),
      ('related', 'masahif_ibn_abi_dawud.19', 28),
      ('related', 'masahif_ibn_abi_dawud.20', 29),
      ('related', 'masahif_ibn_abi_dawud.21', 30),
      ('related', 'masahif_ibn_abi_dawud.22', 31),
      ('related', 'masahif_ibn_abi_dawud.23', 32),
      ('related', 'masahif_ibn_abi_dawud.24', 33),
      ('related', 'masahif_ibn_abi_dawud.25', 34),
      ('related', 'masahif_ibn_abi_dawud.26', 35),
      ('related', 'masahif_ibn_abi_dawud.27', 36),
      ('related', 'masahif_ibn_abi_dawud.28', 37),
      ('related', 'masahif_ibn_abi_dawud.29', 38),
      ('related', 'masahif_ibn_abi_dawud.30', 39),
      ('related', 'masahif_ibn_abi_dawud.31', 40),
      ('related', 'masahif_ibn_abi_dawud.32', 41),
      ('related', 'masahif_ibn_abi_dawud.33', 42),
      ('related', 'masahif_ibn_abi_dawud.34', 43),
      ('related', 'masahif_ibn_abi_dawud.35', 44),
      ('related', 'masahif_ibn_abi_dawud.36', 45),
      ('related', 'masahif_ibn_abi_dawud.37', 46),
      ('related', 'masahif_ibn_abi_dawud.92', 47),
      ('related', 'masahif_ibn_abi_dawud.93', 48),
      ('related', 'masahif_ibn_abi_dawud.94', 49),
      ('related', 'masahif_ibn_abi_dawud.95', 50),
      ('related', 'masahif_ibn_abi_dawud.96', 51),
      ('related', 'fadail_abu_ubayd.453', 52),
      ('related', 'fadail_abu_ubayd.454', 53),
      ('related', 'fadail_abu_ubayd.455', 54),
      ('related', 'fadail_abu_ubayd.456', 55),
      ('related', 'fadail_abu_ubayd.457', 56),
      ('related', 'fadail_abu_ubayd.458', 57),
      ('related', 'fadail_abu_ubayd.459', 58),
      ('related', 'fadail_abu_ubayd.460', 59),
      ('related', 'fadail_abu_ubayd.461', 60),
      ('related', 'fadail_abu_ubayd.462', 61),
      ('related', 'fadail_abu_ubayd.463', 62),
      ('related', 'fadail_abu_ubayd.464', 63),
      ('related', 'fadail_abu_ubayd.465', 64),
      ('related', 'fadail_abu_ubayd.466', 65),
      ('related', 'fadail_abu_ubayd.467', 66),
      ('related', 'fadail_abu_ubayd.468', 67),
      ('related', 'fadail_abu_ubayd.469', 68),
      ('related', 'fadail_abu_ubayd.470', 69),
      ('related', 'tafsir_ibn_kathir.0.4', 70)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Бухари 4986: «إن القتل قد استحر يوم اليمامة بقراء القرآن». Ахмад 21644 передаёт слова Зейда: «أتفعلان شيئا لم يفعله رسول الله صلى الله عليه وسلم». О конце суры «Покаяние» Бухари 4989: «وجدت آخر سورة التوبة آيتين مع أبي خزيمة الأنصاري، لم أجدهما مع أحد غيره», и там назван 9:128. О стихе «Сонмов» Бухари 2807 говорит уже о переписке свитков в мусхафы: «نسخت الصحف في المصاحف، ففقدت آية من سورة الأحزاب» и «فلم أجدها إلا مع خزيمة بن ثابت الأنصاري».$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'abu-bakr-collection', 'circumstances', 'quotes'),
      'В обстоятельства записаны только фразы, сверенные с текстами библиотеки. Позиции сторон не заполнялись.',
      'migration:032'
    );
  END IF;
END $$;
