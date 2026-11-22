-- 083: more sides for two drafts of «научные чудеса» (docs/PLAN.md,
-- 22.11.2026): 51:47 («небо расширяется») and 78:6–7 («горы — колышки»).
-- Until now each had Ibn Kathir's comment on the verse and one open article.
-- Added: how the early books themselves explain the words (al-Bukhari's book
-- of commentary, Ibn Kathir on other verses, the hadith of Anas at al-Tirmidhi
-- and Ahmad, «аль-Кафи») and what the critic of the author's archive points
-- to, without his tone. Same method as 054–062: every quotation is checked
-- against the library; the topics stay drafts.
DO $$
DECLARE
  tid bigint;
  pid bigint;
  pos int;
  note text := $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Формулировку и степень признания проверяет специалист.$p$;
  critic_note text := $p$Изложено по записям из архива автора без их тона; цитаты из книг библиотеки сверены. Степень признания условна: это полемика, а не богословская школа.$p$;
BEGIN
  -- 51:47.
  SELECT id INTO tid FROM topics WHERE slug = 'heaven-expanding';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM library.addresses WHERE address = 'bukhari.4852')
     AND EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tafsir_ibn_kathir.21.30')
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE 'Аль-Бухари%')
  THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Аль-Бухари, «Книга толкования»$p$, 'tradition',
      $p$О слове из 51:47: «أي لذو سعة، وكذلك {على الموسع قدره} [البقرة: 236]: يعني القوي» (Бухари 4852).$p$, note, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.4852', 0);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Касир (к другим аятам)$p$, 'tradition',
      $p$К 21:32 о небе как своде: «أي: على الأرض وهي كالقبة عليها، كما قال: {والسماء بنيناها بأيد وإنا لموسعون}» (Ибн Касир 21:30). К 41:15, о словах адитов «{وقالوا من أشد منا قوة}»: «فإنه العظيم الذي خلق الأشياء وركب فيها قواها الحاملة لها، وإن بطشه شديد، كما قال تعالى: {والسماء بنيناها بأيد وإنا لموسعون}» (Ибн Касир 41:13).$p$, note, pos + 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['tafsir_ibn_kathir.21.30', 'tafsir_ibn_kathir.41.13']) WITH ORDINALITY AS u(a, o);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
      $p$Считают перевод «Мы расширяем» неточным: слово в 51:47 они понимают как «обладающий возможностью, силой» и ссылаются на «Книгу толкования» аль-Бухари — «أي لذو سعة، وكذلك {على الموسع قدره} [البقرة: 236]: يعني القوي» (Бухари 4852) — и на тафсир «аль-Джалалайн». Добавляют, что в космологии расширение — это рост расстояний между галактиками, а не увеличение предмета с известными границами.$p$,
      $p$Изложено по записям из архива автора без их тона; цитата из «Сахиха» аль-Бухари сверена. Тафсира «аль-Джалалайн» в библиотеке нет. Степень признания условна: это полемика, а не богословская школа.$p$, pos + 2
    FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'bukhari.4852', 0);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'heaven-expanding', 'added_positions', 3),
            'Добавлены объяснение слова у аль-Бухари, Ибн Касир к другим аятам и позиция критиков; специалистом не проверено.', 'migration:083');
  END IF;

  -- 78:6–7.
  SELECT id INTO tid FROM topics WHERE slug = 'mountains-as-pegs';
  IF tid IS NOT NULL
     AND EXISTS (SELECT 1 FROM library.addresses WHERE address = 'tirmidhi.3369.1')
     AND EXISTS (SELECT 1 FROM library.addresses WHERE address = 'kafi.35.33.129')
     AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid AND holder LIKE 'Хадис%')
  THEN
    SELECT coalesce(max(position), -1) + 1 INTO pos FROM topic_positions WHERE topic_id = tid;

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Хадис Анаса у ат-Тирмизи и Ахмада$p$, 'tradition',
      $p$«لما خلق الله الأرض جعلت تميد فخلق الجبال فعاد بها عليها فاستقرت» — и оценка самого ат-Тирмизи: «قال أبو عيسى هذا حديث غريب لا نعرفه مرفوعا إلا من هذا الوجه» (Тирмизи 3369). У Ахмада: «فخلق الجبال، فألقاها عليها فاستقرت» (Ахмад 12253).$p$,
      $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Ат-Тирмизи называет хадис «гариб»; оценки других хадисоведов нужно добавить.$p$, pos
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position)
    SELECT tid, 'position', pid, a::extensions.ltree, o
    FROM unnest(ARRAY['tirmidhi.3369.1', 'ahmad.12253']) WITH ORDINALITY AS u(a, o);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Ибн Касир (к 31:10)$p$, 'tradition',
      $p$К словам 31:10 «{وألقى في الأرض رواسي}»: «يعني: الجبال أرست الأرض وثقلتها لئلا تضطرب بأهلها على وجه الماء» (Ибн Касир 31:10).$p$, note, pos + 1
    FROM position_sides s WHERE s.slug = 'sunni' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.31.10', 0);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$«аль-Кафи» аль-Кулайни$p$, 'tradition',
      $p$В сообщении о том, что у каждого творения есть то, что его одолевает: «فخلق الجبال فأثبتها على ظهرها أوتادا من أن تميد بما عليها فذلت الأرض واستقرت» (аль-Кафи 35.33.129).$p$,
      $p$Подобрано по текстам библиотеки 22.11.2026; специалистом не проверено. Оценку достоверности по шиитской науке о хадисе нужно добавить.$p$, pos + 2
    FROM position_sides s WHERE s.slug = 'shia' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'kafi.35.33.129', 0);

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', $p$Критики ислама (записи телеграм-канала из архива автора)$p$, 'minority',
      $p$Приводят толкование Ибн Касира, по которому горы удерживают землю, чтобы она «не сотрясалась»: «جعلها لها أوتادا أرساها بها وثبتها وقررها حتى سكنت ولم تضطرب بمن عليها» (Ибн Касир 78:1). Считают, что оно расходится с геологией: горные пояса возникают там, где сталкиваются литосферные плиты, и землетрясения там чаще.$p$,
      critic_note, pos + 3
    FROM position_sides s WHERE s.slug = 'critics' RETURNING id INTO pid;
    INSERT INTO topic_refs (topic_id, role, position_id, address, position) VALUES (tid, 'position', pid, 'tafsir_ibn_kathir.78.1', 0);

    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'mountains-as-pegs', 'added_positions', 4),
            'Добавлены хадис Анаса, Ибн Касир к 31:10, «аль-Кафи» и позиция критиков; специалистом не проверено.', 'migration:083');
  END IF;
END $$;
