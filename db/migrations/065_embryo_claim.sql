-- 065: draft of the science claim «стадии зародыша» (docs/PLAN.md, 16.11.2026).
-- The Quran and Ibn Kathir are quoted from the library. The researchers' side
-- is one paragraph of an open article (CC BY-SA 4.0), not a text in the library.
-- The topic stays a draft. On an empty database, before the import, it does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано 16.11.2026. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'embryo-stages')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.23.14')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.23.12')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.3208')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.23.12'
      AND position('فصارت علقة حمراء على شكل العلقة مستطيلة' IN t.content) > 0
      AND position('وهي قطعة كالبضعة من اللحم، لا شكل فيها ولا تخطيط' IN t.content) > 0
      AND position('ثم نفخنا فيه الروح' IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'bukhari.3208'
      AND position('إن أحدكم يجمع خلقه في بطن أمه أربعين يوما، ثم يكون علقة مثل ذلك، ثم يكون مضغة مثل ذلك' IN t.content) > 0
  ) THEN
    RAISE EXCEPTION 'embryo phrases are not in the library text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('embryo-stages', 'science_claims', 'draft', 'migration:065', 'migration:065')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Стадии зародыша в 23:12–14$p$,
    $p$Что говорят загруженные тексты о словах «нутафа», «алака» и «мудга», и что говорит об их научном прочтении открытая статья?$p$,
    $p$Ибн Касир к 23:12–14: «فصارت علقة حمراء على شكل العلقة مستطيلة. قال عكرمة: وهي دم». О мудге: «وهي قطعة كالبضعة من اللحم، لا شكل فيها ولا تخطيط». О костях: «شكلناها ذات رأس ويدين ورجلين بعظامها وعصبها وعروقها». О плоти: «وجعلنا على ذلك ما يستره ويشده ويقويه». О «другом творении»: «ثم نفخنا فيه الروح». Бухари 3208: «إن أحدكم يجمع خلقه في بطن أمه أربعين يوما، ثم يكون علقة مثل ذلك، ثم يكون مضغة مثل ذلك».$p$,
    $p$Собрано 16.11.2026. Аяты 23:12–14, 22:5 и 96:2 — тексты темы. Книги сторонников «научного чуда» (Мур, Бюкай, ан-Наджжар) под авторским правом и сюда не переносились. Сторона исследователей — абзац открытой статьи, лицензия CC BY-SA 4.0. Специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.23.12', 0),
    ('main', 'quran.23.13', 1),
    ('main', 'quran.23.14', 2),
    ('circumstances', 'tafsir_ibn_kathir.23.12', 0),
    ('circumstances', 'bukhari.3208', 1),
    ('related', 'quran.22.5', 0),
    ('related', 'quran.96.2', 1)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition',
    $p$«فصارت علقة حمراء على شكل العلقة مستطيلة. قال عكرمة: وهي دم». «وهي قطعة كالبضعة من اللحم، لا شكل فيها ولا تخطيط». «شكلناها ذات رأس ويدين ورجلين بعظامها وعصبها وعروقها». «وجعلنا على ذلك ما يستره ويشده ويقويه». «ثم نفخنا فيه الروح» (Ибн Касир 23:12).$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.23.12', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Хадис у аль-Бухари$p$, 'tradition',
    $p$«إن أحدكم يجمع خلقه في بطن أمه أربعين يوما، ثم يكون علقة مثل ذلك، ثم يكون مضغة مثل ذلك، ثم يبعث الله ملكا فيؤمر بأربع كلمات، ويقال له: اكتب عمله، ورزقه، وأجله، وشقي أو سعيد، ثم ينفخ فيه الروح» (Бухари 3208).$p$,
    note, 1
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'bukhari.3208', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Умайятус Шарифа и соавторы$p$, 'minority',
    $p$The analysis demonstrates that classical exegesis maintains a stable lexical orientation, interpreting these terms within the semantic framework of early Arabic usage as descriptive, non-technical expressions. In contrast, modern scientific exegesis adopts a correlational approach, aligning Qur’anic terminology with stages of embryological development such as fertilization, implantation, and organogenesis. This shift entails processes of semantic extension and conceptual reconstruction, often merging distinct biological stages into single Qur’anic terms. From a semantic and hermeneutical perspective, this transformation reflects a shift from descriptive-lexical meaning to reinterpretative-scientific meaning, shaped by the interaction between the historical horizon of the text and the epistemic horizon of modern science. However, such reinterpretation raises critical methodological issues, including anachronistic projection and semantic overextension.$p$,
    $p$Umaiyatus Syarifah, Idri, Abdul Kadir Riyadi, Mohammad Arif, Wati Susilawati, Kiptiyah. From Lexical Meaning to Scientific Interpretation. Ijaz Arabi: Journal of Arabic Learning, vol. 9, no. 4, 2026. DOI 10.18860/ijazarabi.v9i4.42246. Лицензия CC BY-SA 4.0, указана на первой странице файла. Абзац взят из аннотации без сокращения середины. Степень признания предварительная: это одна статья, не опрос исследователей.$p$,
    2
  FROM position_sides s WHERE s.slug = 'research' RETURNING id INTO pid;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'embryo-stages', 'status', 'draft', 'positions', 3),
          'Черновик утверждения о стадиях зародыша: аяты, Ибн Касир, Бухари 3208 и абзац открытой статьи. Специалистом не проверен.', 'migration:065');
END $$;
