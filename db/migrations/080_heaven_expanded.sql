-- 080: draft of the science claim about Quran 51:47 (docs/PLAN.md, 21.11.2026).
-- The Quran and Ibn Kathir are quoted from the library. The research side is
-- a continuous passage of one open article (CC BY-SA). The topic stays a draft.
-- On an empty database, before the import, it does nothing.

DO $$
DECLARE
  tid bigint;
  pid bigint;
  note text := $p$Подобрано 21.11.2026. Формулировку и степень признания проверяет специалист.$p$;
BEGIN
  IF EXISTS (SELECT 1 FROM topics WHERE slug = 'heaven-expanding')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'quran.51.47')
     OR NOT EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.51.47')
  THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'tafsir_ibn_kathir.51.47'
      AND position($p$أي: بقوة$p$ IN t.content) > 0
      AND position($p$قد وسعنا أرجاءها ورفعناها بغير عمد$p$ IN t.content) > 0
  ) OR NOT EXISTS (
    SELECT 1 FROM library.texts t
    JOIN library.text_versions v ON v.id = t.version_id AND v.is_primary
    WHERE t.address = 'quran.51.47'
      AND position($p$وَٱلسَّمَآءَ بَنَيْنَـٰهَا بِأَيْي۟دٍ وَإِنَّا لَمُوسِعُونَ$p$ IN t.content) > 0
  ) THEN
    RAISE EXCEPTION '080: the checked phrases are not in the primary text';
  END IF;

  INSERT INTO topics (slug, category, status, created_by, updated_by)
  VALUES ('heaven-expanding', 'science_claims', 'draft', 'migration:080', 'migration:080')
  RETURNING id INTO tid;

  INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
  VALUES (
    tid, 'ru',
    $p$Небо «расширяется» в 51:47$p$,
    $p$Что говорит Ибн Касир о «وَإِنَّا لَمُوسِعُونَ», и что говорит об этом чтении открытая статья?$p$,
    $p$В 51:47: «وَٱلسَّمَآءَ بَنَيْنَـٰهَا بِأَيْي۟دٍ وَإِنَّا لَمُوسِعُونَ». Ибн Касир к 51:47: «{بأيد} أي: بقوة. قاله ابن عباس، ومجاهد، وقتادة، والثوري، وغير واحد، {وإنا لموسعون} ، أي: قد وسعنا أرجاءها ورفعناها بغير عمد، حتى استقلت كما هي.».$p$,
    $p$Собрано 21.11.2026. Книги сторонников «научного чуда» под авторским правом и сюда не переносились. Сторона исследователей — раздел одной статьи, лицензия CC BY-SA. Специалист не проверял.$p$
  );

  INSERT INTO topic_refs (topic_id, role, address, position)
  SELECT tid, v.role, v.address::extensions.ltree, v.pos
  FROM (VALUES
    ('main', 'quran.51.47', 0),
    ('circumstances', 'tafsir_ibn_kathir.51.47', 0)
  ) AS v(role, address, pos);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Ибн Касир$p$, 'tradition',
    $p${بأيد} أي: بقوة. قاله ابن عباس، ومجاهد، وقتادة، والثوري، وغير واحد، {وإنا لموسعون} ، أي: قد وسعنا أرجاءها ورفعناها بغير عمد، حتى استقلت كما هي.$p$,
    note, 0
  FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
  INSERT INTO topic_refs (topic_id, role, position_id, address, position)
  VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.51.47', 0);

  INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
  SELECT tid, s.id, 'ru', $p$Амирудин, Шарипа Аини и Мовафг Масууд$p$, 'minority',
    $p$Al-Ṭabarī connects the phrase with capacity to create and invokes Q. 2:236, where al-mūsiʿ concerns a person of means. He also transmits a reading involving making the heaven spacious (al-Ṭabarī, 1991, on Q. 51:47). Ibn Kathīr explains the widening of its regions (Ibn Kathīr, 1999, on Q. 51:47). Al-Rāzī presents spaciousness, power, and provision as alternatives (al-Rāzī, 2000, on Q. 51:47). These accounts establish a historically available semantic field, but do not identify the modern physical proposition of metric expansion. Bucaille’s argument deserves direct consideration rather than dismissal under a general label of concordism. He favors an expansion rendering, appeals to the active participle, questions translations focused on generosity, and reports an explicit expansion interpretation in al-Muntakhab (Bucaille, 1978, section “The Expansion of the Universe”). His comparison is stronger than an arbitrary verbal resemblance because the object is heaven and the relevant expression can concern making spacious. He also introduces the comparison with some caution. The issue is therefore not whether his reading is conceivable, but how much its linguistic evidence establishes. An active participle does not independently encode a measured, continuously increasing cosmological scale factor. Its temporal and aspectual force depends on context; an English present progressive can make the claim more specific than the Arabic construction alone requires. The capacity reading is supported by Qur’anic usage, while the spaciousness reading does not necessarily entail ongoing physical expansion. Scientific knowledge may make the dynamic reading attractive, but attractiveness after a discovery cannot establish that the discovery was uniquely specified beforehand.

Nor should the scientific objection be overstated. A sentence need not contain an equation to refer to a real physical phenomenon. The absence of the Hubble relation is therefore not, by itself, decisive against every expansion reading. The stronger objection is underdetermination: more than one plausible meaning remains, and the verse alone does not discriminate the modern dynamical account from those alternatives. Hubble’s (1929) distance–velocity study and later cosmological work establish scientific warrant through observations and models, not through grammatical form. Aghanim (2020) further illustrates how parameter claims depend on explicitly stated assumptions. The assessment is a contested contemporary reading with a more specific possible connection than the dukhān analogy. Its status remains conditional on a defensible expansive reading; neither the morphology nor the historical corpus compels it. A modern interpreter may describe expansion as an illuminating application while declining the stronger claims of exclusive reference and prediction. Munir and Surahmat’s (2025) distinction between core explanation and scientific supplement is useful here, although the boundary must still be justified in this particular instance. The main risks are importing present progressive force through translation and transferring scientific confidence to an exegetical preference. Theological reflection on divine power is textually grounded, but it does not make that preference binding. A traditional capacity reading remains available without denying scientific expansion. Conversely, accepting expansion as well-supported science does not commit a reader to Bucaille’s interpretation of this verse.$p$,
    $p$Amiruddin, Syaripah Aini, Mowafg Masuwd. Qur’anic cosmology and modern science: Reading selected creation passages beyond scientific concordism through a layered epistemic model. REFERENSI ISLAMIKA: Jurnal Studi Islam, vol. 4, no. 5, October 2026, pp. 31–47. DOI 10.66053/ri.v4i5.1356. На файле статьи указана лицензия CC BY-SA. Приведён раздел об аяте 51:47; переносы строк файла сведены, в именах al-Ṭabarī и al-Muntakhab восстановлен дефис, который файл разорвал переносом. Книга Бюкайля не копировалась. Степень признания предварительная: это одна статья.$p$,
    1
  FROM position_sides s WHERE s.slug = 'research' RETURNING id INTO pid;

  INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
  VALUES ('topic', tid::text, 'created', jsonb_build_object('slug', 'heaven-expanding', 'status', 'draft', 'positions', 2),
          'Черновик об аяте 51:47: тафсир Ибн Касира и раздел открытой статьи. Специалистом не проверен.', 'migration:080');
END $$;
