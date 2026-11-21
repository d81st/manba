-- 081: draft of the science claim about Quran 78:6-7 (docs/PLAN.md, 21.11.2026).
-- The Quran and Ibn Kathir are quoted from the library. The research side is
-- the abstract of one open article (CC BY 4.0). The topic stays a draft.
-- On an empty database, before the import, it does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано 21.11.2026. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'mountains-as-pegs')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.78.6')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.78.7')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.78.1')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.78.1'
      AND position($p$جعلها لها أوتادا أرساها بها وثبتها وقررها حتى سكنت$p$ IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.78.6'
      AND position($p$أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَـٰدًا$p$ IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.78.7'
      AND position($p$وَٱلْجِبَالَ أَوْتَادًا$p$ IN t.content) > 0
  ) THEN
    RAISE EXCEPTION '081: the checked phrases are not in the primary text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('mountains-as-pegs', 'science_claims', 'draft', 'migration:081', 'migration:081')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Горы — «колышки» в 78:6–7$p$,
    $p$Что говорит Ибн Касир о «أَوْتَادًا», и что говорит об этом чтении открытая статья?$p$,
    $p$В 78:6: «أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَـٰدًا». В 78:7: «وَٱلْجِبَالَ أَوْتَادًا». Ибн Касир к 78:1: «{والجبال أوتادا} أي: جعلها لها أوتادا أرساها بها وثبتها وقررها حتى سكنت ولم تضطرب بمن عليها.».$p$,
    $p$Собрано 21.11.2026. Книги сторонников «научного чуда» под авторским правом и сюда не переносились. Сторона исследователей — аннотация одной короткой статьи, лицензия CC BY 4.0. Специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.78.6', 0),
    ('main', 'quran.78.7', 1),
    ('circumstances', 'tafsir_ibn_kathir.78.1', 0)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition',
    $p${والجبال أوتادا} أي: جعلها لها أوتادا أرساها بها وثبتها وقررها حتى سكنت ولم تضطرب بمن عليها.$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.78.1', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Мазая Фуада и Файшал Абдулла$p$, 'minority',
    $p$This research examines the concept of mountains as Earth’s Stakes through an interdisciplinary lens, integrating Qur'anic perspectives with modern geological science. The study aims to bridge the gap between classical and modern exegesis (tafsir), specifically focusing on Tafsir Ibn Kathir and Quraish Shihab’s Tafsir Al-Misbah, and contemporary scientific understanding. The study employs an interdisciplinary approach, synthesizing qualitative textual analysis of religious scriptures with established scientific theories. It compares the linguistic and theological descriptions of mountains in the Qur'an (specifically Surah An-Naba: 6-7) with empirical geological data, including plate tectonics and the principle of isostasy. The results indicate that the Qur'anic term "autad" (stakes) aligns with modern geological findings which reveal that mountains have deep "roots" embedded in the Earth's crust. These structures contribute to the Earth's geodynamic stability, mitigate seismic impacts, and provide essential resources for life. Furthermore, the study finds that while classical interpretations focus on physical stability, modern interpretations expand this to include the spiritual significance of divine balance in creation. This research demonstrates a profound harmony between divine revelation and empirical science. By validating the stabilizing function of mountains through both theological and scientific frameworks (including perspectives from scholars like Keith L. Moore), it provides a foundation for developing faith-based scientific knowledge and encourages a holistic view of the relationship between religion and the natural world.$p$,
    $p$Mazaya Fuadah, Faishal Abdullah. Mountains as Earth’s Stakes in the Perspektive of the Qur’an: An Interdisciplinary Study of Qur’anic Exegesis and Geological Science. International Journal of Islamic Studies Issues, vol. 1, no. 2, July 2025, pp. 53–56. DOI 10.59966/9pxmrb13. На файле статьи указана лицензия CC BY 4.0. Приведена аннотация. Буквы a и b при именах на первой странице — пометы мест работы, в цитату имён не вошли. Книга Мура не копировалась. Степень признания предварительная: это одна статья.$p$,
    1
  FROM position_sides s WHERE s.slug = 'research' RETURNING id INTO pid;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'mountains-as-pegs', 'status', 'draft', 'positions', 2),
          'Черновик об аятах 78:6–7: тафсир Ибн Касира и аннотация открытой статьи. Специалистом не проверен.', 'migration:081');
END $$;
