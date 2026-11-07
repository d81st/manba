-- 045: the five pillars. Circumstances written as quotations only, from the
-- places already chosen for each topic (027, 028), and positions by the same
-- rule as 044 (decision of the author 07.11.2026: fill the fields as examples
-- to be checked later). Circumstances that are already written stay as they are. Holder = the book or person the quotation stands in; side by
-- the canon of that book; recognition preliminary, said in source_note.
-- Every quotation was checked against the text of its address when this file
-- was generated. A topic that already has a position is left alone. Hard
-- topics stay on review; other topics that now have passages, circumstances
-- and a position are published.

DO $$
DECLARE
  tid bigint;
  pid bigint;
BEGIN
  IF (SELECT count(*) FROM addresses WHERE address IN ('bukhari.349', 'kafi.5.13.1', 'kafi.15.27.4', 'muslim.1185.1')) < 4 THEN
    RETURN;
  END IF;

  -- namaz
  SELECT id INTO tid FROM topics WHERE slug = 'namaz';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    UPDATE topic_texts SET circumstances = $p$Предписание в ночь вознесения: «ففرض الله عز وجل على أمتي خمسين صلاة» (Бухари 349); «أمر نبيكم صلى الله عليه وسلم بخمسين صلاة، فسأل ربه فجعلها خمس صلوات» (Ахмад 2890). Джибриль показывает времена молитв: «أمني جبريل عليه السلام عند البيت مرتين» (Абу Дауд 393). Молитва в сторону Иерусалима — срок назван по-разному: «ستة عشر شهرا، أو سبعة عشر شهرا» (Бухари 40), «ثلاثة عشر شهرا» (Абу Дауд 507), «ثمانية عشر شهرا» (Ибн Маджа 1010). Число ракаатов вначале: «فرضت الصلاة ركعتين، ثم هاجر النبي صلى الله عليه وسلم ففرضت أربعا» (Бухари 3935). В «аль-Кафи»: «فرض الله الصلاة وسن رسول الله (صلى الله عليه وآله) عشرة أوجه» (аль-Кафи 12.3.3).$p$ WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) = '';
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари и Ахмад$p$, 'tradition', $p$Пять молитв предписаны в ночь вознесения после пятидесяти: «ففرض الله عز وجل على أمتي خمسين صلاة» (Бухари 349); «فسأل ربه فجعلها خمس صلوات» (Ахмад 2890).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.349', 'ahmad.2890']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аиша у аль-Бухари$p$, 'tradition', $p$Сначала по два ракаата, после хиджры — четыре: «فرضت الصلاة ركعتين، ثم هاجر النبي صلى الله عليه وسلم ففرضت أربعا» (Бухари 3935).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.3935']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«فرض الله الصلاة وسن رسول الله (صلى الله عليه وآله) عشرة أوجه» (аль-Кафи 12.3.3).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.12.3.3']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'namaz', 'positions', 3),
            'Обстоятельства и позиции собраны по цитатам из мест темы; степень признания предварительная.', 'migration:045');
  END IF;

  -- shahada
  SELECT id INTO tid FROM topics WHERE slug = 'shahada';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    UPDATE topic_texts SET circumstances = $p$Делегации Абд аль-Кайс вера в Аллаха названа так: «شهادة أن لا إله إلا الله وأن محمدا رسول الله، وإقام الصلاة، وإيتاء الزكاة» (Бухари 53). Муазу ибн Джабалю в Йемене: «فأعلمهم أن الله افترض عليهم صدقة في أموالهم تؤخذ من أغنيائهم وترد على فقرائهم» (Бухари 1395). Список «пяти» в сборниках звучит по-разному: «بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدا رسول الله» (Бухари 8), «بني الإسلام على خمسة على أن يوحد الله» (Муслим 16a), «بني الاسلام على خمس: على الصلاة والزكاة والصوم والحج والولاية» (аль-Кафи 5.13.1).$p$ WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) = '';
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$«بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدا رسول الله» (Бухари 8).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.8']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Муслим$p$, 'tradition', $p$У Муслима: «بني الإسلام على خمسة على أن يوحد الله» (Муслим 16a).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['muslim.16.1']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$Пятое в списке — вилая: «بني الاسلام على خمس: على الصلاة والزكاة والصوم والحج والولاية» (аль-Кафи 5.13.1).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.5.13.1']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'shahada', 'positions', 3),
            'Обстоятельства и позиции собраны по цитатам из мест темы; степень признания предварительная.', 'migration:045');
  END IF;

  -- zakat
  SELECT id INTO tid FROM topics WHERE slug = 'zakat';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    UPDATE topic_texts SET circumstances = $p$Муазу ибн Джабалю в Йемене: «فأعلمهم أن الله افترض عليهم صدقة في أموالهم تؤخذ من أغنيائهم وترد على فقرائهم» (Бухари 1395). Что было раньше: «بصدقة الفطر قبل أن تنزل الزكاة فلما نزلت الزكاة لم يأمرنا ولم ينهنا ونحن نفعله» (Ибн Маджа 1828). Письмо Абу Бакра с размерами: «هذه فريضة الصدقة التي فرض رسول الله صلى الله عليه وسلم على المسلمين» (Бухари 1454). В «аль-Кафи»: «وضع رسول الله (صلى الله عليه وآله) الزكاة على تسعة أشياء» (аль-Кафи 13.4.2).$p$ WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) = '';
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$Письмо Абу Бакра: «هذه فريضة الصدقة التي فرض رسول الله صلى الله عليه وسلم على المسلمين» (Бухари 1454). После смерти пророка Абу Бакр: «والله لأقاتلن من فرق بين الصلاة والزكاة» (Бухари 1400).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.1454', 'bukhari.1400']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Маджа$p$, 'tradition', $p$Милостыня разговения была раньше закята: «بصدقة الفطر قبل أن تنزل الزكاة فلما نزلت الزكاة لم يأمرنا ولم ينهنا ونحن نفعله» (Ибн Маджа 1828).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['ibn_majah.1828']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«وضع رسول الله (صلى الله عليه وآله) الزكاة على تسعة أشياء»; Юнус поясняет: «إنما كان ذلك في أول النبوة كما كانت الصلاة ركعتين» (аль-Кафи 13.4.2).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.13.4.2']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'zakat', 'positions', 3),
            'Обстоятельства и позиции собраны по цитатам из мест темы; степень признания предварительная.', 'migration:045');
  END IF;

  -- sawm
  SELECT id INTO tid FROM topics WHERE slug = 'sawm';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    UPDATE topic_texts SET circumstances = $p$До Рамадана постились в день Ашуры: «كانوا يصومون عاشوراء قبل أن يفرض رمضان» (Бухари 1592); «فلما فرض رمضان ترك» (Бухари 1892). О иудеях и Ашуре: «فرأى اليهود تصوم يوم عاشوراء» (Бухари 2004); «هذا يوم عظيم، وهو يوم نجى الله فيه موسى» (Бухари 3397). Правила поста менялись: «أحل لكم ليلة الصيام الرفث إلى نسائكم» и «ففرحوا بها فرحا شديدا» (Бухари 1915).$p$ WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) = '';
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аиша и Ибн Умар у аль-Бухари$p$, 'tradition', $p$«كانوا يصومون عاشوراء قبل أن يفرض رمضان» (Бухари 1592); «فلما فرض رمضان ترك» (Бухари 1892).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.1592', 'bukhari.1892']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$аль-Бухари$p$, 'tradition', $p$«فرأى اليهود تصوم يوم عاشوراء» (Бухари 2004); «هذا يوم عظيم، وهو يوم نجى الله فيه موسى» (Бухари 3397).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.2004', 'bukhari.3397']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«لا تصم في يوم عاشورا ولا عرفة بمكة ولا في المدينة ولا في وطنك ولا في مصر من الأمصار» (аль-Кафи 14.61.3).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.14.61.3']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'sawm', 'positions', 3),
            'Обстоятельства и позиции собраны по цитатам из мест темы; степень признания предварительная.', 'migration:045');
  END IF;

  -- hajj
  SELECT id INTO tid FROM topics WHERE slug = 'hajj';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    UPDATE topic_texts SET circumstances = $p$До ислама: «قريش ومن دان دينها يقفون بالمزدلفة، وكانوا يسمون الحمس، وكان سائر العرب يقفون بعرفات» (Бухари 4520); «كان الناس يطوفون في الجاهلية عراة إلا الحمس» (Бухари 1665). Тальбия многобожников: «لبيك لا شريك لك» и «إلا شريكا هو لك تملكه وما ملك» (Муслим 1185a). Объявление в Мине: «لا يحج بعد العام مشرك، ولا يطوف بالبيت عريان» (Бухари 1622). Ас-Сафа и аль-Марва: «لأنها كانت من شعائر الجاهلية حتى أنزل الله» (Бухари 1648). В «аль-Кафи»: «إن رسول الله (صلى الله عليه وآله) أقام بالمدينة عشر سنين لم يحج» (аль-Кафи 15.27.4).$p$ WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) = '';
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аиша у аль-Бухари$p$, 'tradition', $p$Курайшиты, перестраивая Каабу, отступили от основания Ибрахима: «أن قومك لما بنوا الكعبة اقتصروا عن قواعد إبراهيم» (Бухари 1583).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.1583']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Умар у аль-Бухари$p$, 'tradition', $p$О Чёрном камне: «إني أعلم أنك حجر، لا تضر ولا تنفع» (Бухари 1597).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.1597']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Усман, Али и Имран ибн Хусайн у аль-Бухари$p$, 'tradition', $p$Спор о хадже с умрой: Усман «ينهى عن المتعة، وأن يجمع بينهما» (Бухари 1563); Имран: «أنزلت آية المتعة في كتاب الله، ففعلناها مع رسول الله صلى الله عليه» (Бухари 4518).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 2
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['bukhari.1563', 'bukhari.4518']) WITH ORDINALITY AS u(a, o);
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition', $p$«إن رسول الله (صلى الله عليه وآله) أقام بالمدينة عشر سنين لم يحج» (аль-Кафи 15.27.4).$p$, $p$Собрано по цитатам библиотеки. Формулировку и степень признания проверяет специалист.$p$, 3
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o FROM unnest(ARRAY['kafi.15.27.4']) WITH ORDINALITY AS u(a, o);
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'hajj', 'positions', 4),
            'Обстоятельства и позиции собраны по цитатам из мест темы; степень признания предварительная.', 'migration:045');
  END IF;

  -- Publish what now meets the rule (passages, circumstances, a position).
  WITH ready AS (
    SELECT t.id, t.slug FROM topics t
    JOIN topic_texts x ON x.topic_id = t.id AND x.locale = 'ru'
    WHERE t.slug IN ('namaz', 'shahada', 'zakat', 'sawm', 'hajj')
      AND t.status IN ('draft', 'review')
      AND btrim(x.circumstances) <> ''
      AND EXISTS (SELECT 1 FROM topic_refs r WHERE r.topic_id = t.id AND r.role = 'main')
      AND EXISTS (SELECT 1 FROM topic_positions p WHERE p.topic_id = t.id)
  ), done AS (
    UPDATE topics t SET status = 'published', updated_by = 'migration:045', updated_at = now()
    FROM ready WHERE t.id = ready.id RETURNING t.id, t.slug
  )
  INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
  SELECT 'topic', id::text, 'updated', jsonb_build_object('status', 'review'), jsonb_build_object('status', 'published', 'slug', slug),
         'Опубликовано на этапе разработки: тексты, обстоятельства и позиции из цитат библиотеки (решение автора 07.11.2026).', 'migration:045'
  FROM done;
END $$;
