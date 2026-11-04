-- 030: the two sira cards. Places from docs/topics/sira-cards-sources.md
-- go into the fields they belong to. Circumstances are quotations already
-- checked against the stored pages. No position of any side is written.
-- A card that already has circumstances or a position is left untouched.

DO $$
DECLARE
  tid bigint;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'khadija';
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
('main', 'ibn_hisham.1.187.2', 0),
      ('main', 'ibn_hisham.1.187.3', 1),
      ('main', 'ibn_hisham.1.188.1', 2),
      ('main', 'ibn_hisham.1.188.2', 3),
      ('main', 'ibn_hisham.1.189.1', 4),
      ('main', 'ibn_hisham.1.189.2', 5),
      ('main', 'ibn_hisham.1.189.3', 6),
      ('main', 'ibn_hisham.1.190.1', 7),
      ('main', 'ibn_hisham.1.190.2', 8),
      ('main', 'ibn_hisham.1.191.1', 9),
      ('main', 'ibn_hisham.1.191.2', 10),
      ('main', 'ibn_hisham.1.191.3', 11),
      ('main', 'ibn_hisham.1.192.1', 12),
      ('main', 'ibn_hisham.1.240.2', 13),
      ('main', 'ibn_hisham.1.241.1', 14),
      ('main', 'ibn_hisham.1.241.2', 15),
      ('main', 'ibn_hisham.1.241.3', 16),
      ('main', 'ibn_hisham.1.242.1', 17),
      ('main', 'ibn_hisham.1.243.1', 18),
      ('main', 'ibn_hisham.1.415.4', 19),
      ('main', 'ibn_hisham.1.416.1', 20),
      ('main', 'ibn_hisham.1.416.2', 21),
      ('main', 'ibn_hisham.1.417.1', 22),
      ('main', 'ibn_hisham.1.418.1', 23),
      ('main', 'ibn_hisham.1.418.2', 24),
      ('main', 'ibn_hisham.1.419.1', 25),
      ('circumstances', 'ibn_hisham.1.187.2', 26),
      ('circumstances', 'tarikh_tabari.2.280.1', 27),
      ('circumstances', 'ibn_hisham.1.416.2', 28),
      ('circumstances', 'tarikh_tabari.2.343.1', 29),
      ('circumstances', 'bukhari.3896', 30),
      ('related', 'bukhari.3', 31),
      ('related', 'bukhari.1792', 32),
      ('related', 'bukhari.3392', 33),
      ('related', 'bukhari.3432', 34),
      ('related', 'bukhari.3815', 35),
      ('related', 'bukhari.3816', 36),
      ('related', 'bukhari.3817', 37),
      ('related', 'bukhari.3818', 38),
      ('related', 'bukhari.3819', 39),
      ('related', 'bukhari.3820', 40),
      ('related', 'bukhari.3821', 41),
      ('related', 'bukhari.3896', 42),
      ('related', 'bukhari.4665', 43),
      ('related', 'bukhari.4666', 44),
      ('related', 'bukhari.4922', 45),
      ('related', 'bukhari.4924', 46),
      ('related', 'bukhari.4953', 47),
      ('related', 'bukhari.4957', 48),
      ('related', 'bukhari.5229', 49),
      ('related', 'bukhari.6004', 50),
      ('related', 'bukhari.6982', 51),
      ('related', 'bukhari.7484', 52),
      ('related', 'bukhari.7497', 53),
      ('related', 'muslim.160.1', 54),
      ('related', 'muslim.160.2', 55),
      ('related', 'muslim.160.3', 56),
      ('related', 'muslim.161.4', 57),
      ('related', 'muslim.2430.1', 58),
      ('related', 'muslim.2432.1', 59),
      ('related', 'muslim.2433.1', 60),
      ('related', 'muslim.2434.1', 61),
      ('related', 'muslim.2435.1', 62),
      ('related', 'muslim.2435.2', 63),
      ('related', 'muslim.2435.4', 64),
      ('related', 'muslim.2436.1', 65),
      ('related', 'muslim.2437.1', 66),
      ('related', 'abu_dawud.2692', 67),
      ('related', 'ibn_majah.1512', 68),
      ('related', 'ibn_majah.1997', 69),
      ('related', 'tirmidhi.2017.1', 70),
      ('related', 'tirmidhi.2288.1', 71),
      ('related', 'tirmidhi.3734.1', 72),
      ('related', 'tirmidhi.3875.1', 73),
      ('related', 'tirmidhi.3876.1', 74),
      ('related', 'tirmidhi.3877.1', 75),
      ('related', 'tirmidhi.3878.1', 76),
      ('related', 'ahmad.640', 77),
      ('related', 'ahmad.938', 78),
      ('related', 'ahmad.1109', 79),
      ('related', 'ahmad.1131', 80),
      ('related', 'ahmad.1212', 81),
      ('related', 'ahmad.1758', 82),
      ('related', 'ahmad.1787', 83),
      ('related', 'ahmad.2668', 84),
      ('related', 'ahmad.2845', 85),
      ('related', 'ahmad.2849', 86),
      ('related', 'ahmad.2850', 87),
      ('related', 'ahmad.2901', 88),
      ('related', 'ahmad.2957', 89),
      ('related', 'ahmad.3061', 90),
      ('related', 'ahmad.3542', 91),
      ('related', 'ahmad.7156', 92),
      ('related', 'ahmad.12391', 93),
      ('related', 'ahmad.14287', 94),
      ('related', 'ahmad.14288', 95),
      ('related', 'ahmad.15214', 96),
      ('related', 'ahmad.17947', 97),
      ('related', 'ahmad.19128', 98),
      ('related', 'ahmad.19143', 99),
      ('related', 'ahmad.19145', 100),
      ('related', 'ahmad.19406', 101),
      ('related', 'ahmad.23067', 102),
      ('related', 'ahmad.24310', 103),
      ('related', 'ahmad.24367', 104),
      ('related', 'ahmad.24864', 105),
      ('related', 'ahmad.24867', 106),
      ('related', 'ahmad.25171', 107),
      ('related', 'ahmad.25210', 108),
      ('related', 'ahmad.25658', 109),
      ('related', 'ahmad.25769', 110),
      ('related', 'ahmad.25865', 111),
      ('related', 'ahmad.25959', 112),
      ('related', 'ahmad.26362', 113),
      ('related', 'ahmad.26379', 114),
      ('related', 'ahmad.26381', 115),
      ('related', 'ahmad.26387', 116),
      ('related', 'ahmad.26397', 117),
      ('related', 'kafi.18.44.9', 118),
      ('related', 'kafi.18.55.5', 119),
      ('related', 'kafi.18.55.6', 120),
      ('related', 'kafi.4.41.6', 121),
      ('related', 'kafi.11.80.2', 122),
      ('related', 'kafi.11.80.7', 123),
      ('related', 'kafi.35.47.536', 124),
      ('related', 'kafi.15.229.2', 125)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Ибн Хишам 1:187b называет возраст пророка и не называет возраст Хадиджи: «خمسا وعشرين سنة ، تزوج خديجة بنت خويلد». Ат-Табари 2:280a называет оба возраста: «خمس وعشرين سنة، وخديجة يومئذ ابنة أربعين سنة». О смерти Ибн Хишам 1:416b: «هلكا في عام واحد» и «قبل مهاجره إلى المدينة بثلاث سنين». Ат-Табари 2:343a: «قبل هجرته إلى المدينة بثلاث سنين». Бухари 3896: «توفيت خديجة قبل مخرج النبي صلى الله عليه وسلم إلى المدينة بثلاث سنين». Других возрастов в этих местах нет.$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'khadija', 'circumstances', 'quotes'),
      'В обстоятельства записаны только цитаты о датах и расхождениях, уже сверенные со страницами. Позиции сторон не заполнялись.',
      'migration:030'
    );
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'waraqa-ibn-nawfal';
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
('main', 'bukhari.3', 0),
      ('main', 'bukhari.3392', 1),
      ('main', 'bukhari.4953', 2),
      ('main', 'bukhari.6982', 3),
      ('main', 'muslim.160.1', 4),
      ('main', 'tirmidhi.2288.1', 5),
      ('main', 'ahmad.2845', 6),
      ('main', 'ahmad.24367', 7),
      ('main', 'ahmad.25865', 8),
      ('main', 'ahmad.25959', 9),
      ('main', 'kafi.18.44.9', 10),
      ('circumstances', 'bukhari.3', 11),
      ('circumstances', 'bukhari.3392', 12),
      ('circumstances', 'ibn_hisham.1.223.2', 13),
      ('related', 'ibn_hisham.1.222.2', 14),
      ('related', 'ibn_hisham.1.223.1', 15),
      ('related', 'ibn_hisham.1.223.2', 16),
      ('related', 'ibn_hisham.1.223.3', 17),
      ('related', 'ibn_hisham.1.224.1', 18),
      ('related', 'ibn_hisham.1.224.2', 19),
      ('related', 'ibn_hisham.1.224.3', 20),
      ('related', 'ibn_hisham.1.224.4', 21),
      ('related', 'ibn_hisham.1.225.1', 22),
      ('related', 'ibn_hisham.1.226.1', 23),
      ('related', 'ibn_hisham.1.226.2', 24),
      ('related', 'ibn_hisham.1.227.1', 25),
      ('related', 'ibn_hisham.1.228.1', 26),
      ('related', 'ibn_hisham.1.229.1', 27),
      ('related', 'ibn_hisham.1.229.2', 28),
      ('related', 'ibn_hisham.1.229.3', 29),
      ('related', 'ibn_hisham.1.230.1', 30),
      ('related', 'ibn_hisham.1.230.2', 31),
      ('related', 'ibn_hisham.1.231.1', 32),
      ('related', 'ibn_hisham.1.231.2', 33),
      ('related', 'ibn_hisham.1.232.1', 34),
      ('related', 'ibn_hisham.1.232.2', 35),
      ('related', 'ibn_hisham.1.156.1', 36),
      ('related', 'ibn_hisham.1.157.1', 37),
      ('related', 'ibn_hisham.1.167.4', 38),
      ('related', 'ibn_hisham.1.191.3', 39),
      ('related', 'ibn_hisham.1.238.2', 40),
      ('related', 'ibn_hisham.1.318.1', 41),
      ('related', 'ansab_baladhuri.1.81.1', 42),
      ('related', 'ansab_baladhuri.1.95.1', 43),
      ('related', 'ansab_baladhuri.1.106.1', 44),
      ('related', 'ansab_baladhuri.1.186.1', 45),
      ('related', 'ansab_baladhuri.1.407.1', 46),
      ('related', 'ansab_baladhuri.9.457.2', 47),
      ('related', 'ansab_baladhuri.10.53.1', 48),
      ('related', 'ansab_baladhuri.10.469.1', 49),
      ('related', 'tafsir_ibn_kathir.1.7', 50),
      ('related', 'tafsir_ibn_kathir.6.112', 51),
      ('related', 'tafsir_ibn_kathir.28.48', 52),
      ('related', 'tafsir_ibn_kathir.46.29', 53),
      ('related', 'tafsir_ibn_kathir.96.1', 54)
    ) AS v(role, address, pos);
    UPDATE topic_texts SET circumstances = $c$Бухари 3: «وكان امرأ تنصر في الجاهلية، وكان يكتب الكتاب العبراني، فيكتب من الإنجيل بالعبرانية». Бухари 3392 о том же человеке: «وكان رجلا تنصر، يقرأ الإنجيل بالعربية». Ибн Хишам 1:223b: «فأما ورقة بن نوفل فاستحكم في النصرانية، واتبع الكتب من أهلها». К какому христианскому течению его относят исследователи, в загруженных книгах не сказано.$c$
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'waraqa-ibn-nawfal', 'circumstances', 'quotes'),
      'В обстоятельства записаны только цитаты о датах и расхождениях, уже сверенные со страницами. Позиции сторон не заполнялись.',
      'migration:030'
    );
  END IF;
END $$;
