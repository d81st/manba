-- 038: early Quran manuscripts (docs/topics/quran-text-sources.md).
-- Facts checked on 4 Nov 2026 against Manuscripta Coranica cards and the
-- University of Birmingham notice of 22 July 2015. The interval dates the
-- parchment, not the writing. Descriptions and images are not copied.
-- A topic that already has circumstances keeps them. A topic that already
-- has a position is left untouched.

DO $$
DECLARE
  tid bigint;
  filled boolean;
  noted boolean;
  facts text := $c$Анализ в этих карточках датирует пергамент, не время написания. Снимки не копируются: права у держателей. Ниже только шифр, объём и интервал. Сверено с карточками Manuscripta Coranica 04.11.2026 и с сообщением Бирмингемского университета от 22.07.2015. Где вероятность названа, она 95,4%.

Бирмингем, Islamic Arabic 1572a, 2 листа: https://corpuscoranicum.de/en/manuscripts/2278 . Карточка (IntCal 2020) даёт 578–646. Сообщение университета даёт для двух листов Минганы 568–645, лаборатория Оксфорда: https://www.birmingham.ac.uk/news-archive/2015/birmingham-quran-manuscript-dated-among-the-oldest-in-the-world . Islamic Arabic 1572b, 9 листов: https://corpuscoranicum.de/en/manuscripts/281 . Радиоуглеродного интервала в карточке нет, оценка изготовления там 660–750.

Берлин, Ms. or. fol. 4313, 7 листов: https://corpuscoranicum.de/en/manuscripts/15 . Сводное значение 1423.14 BP, интервал 605–651. Каир, qāf 47: https://corpuscoranicum.de/en/manuscripts/73 . В карточке то же сводное значение 1423.14 BP.

Тюбинген, Ma VI 165, 77 листов: https://corpuscoranicum.de/en/manuscripts/107 . Сводный результат 1355.14 BP, интервал 648–674.

Лейден, Cod.or. 14.545a, 4 листа: https://corpuscoranicum.de/en/manuscripts/367 . Карточка датирует кодекс 652–763 и приводит две пробы: лист 2/3 — 653–706 и 737–775, лист 4 — 650–703 и 741–774. Cod.or. 14.545b: https://corpuscoranicum.de/en/manuscripts/368 . 1327.24 BP, интервалы 652–705 и 739–774. Cod.or. 14.545c: https://corpuscoranicum.de/en/manuscripts/369 . 1331.24 BP, интервалы 651–704 и 740–774.

Берлин, Wetzstein II 1913: https://corpuscoranicum.de/en/manuscripts/163 . 1307.13 BP, интервалы 663–703 и 740–774. Лейден, Or. 8264: https://corpuscoranicum.de/en/manuscripts/366 . Интервалы 653–705 и 737–775. Санкт-Петербург, E-20, 81 лист: https://corpuscoranicum.de/en/manuscripts/165 . 1150.50 BP, интервал 775–995, калибровка OxCal 2013.

Париж, Arabe 328 (a): https://corpuscoranicum.de/en/manuscripts/13 . Сана, DAM 01-27.1: https://corpuscoranicum.de/en/manuscripts/117 . Радиоуглеродного интервала в этих двух карточках нет.$c$;
  note text := $c$Проверено 04.11.2026. Islamic Arabic 1572a, карточка https://corpuscoranicum.de/en/manuscripts/2278 : IntCal 2020 даёт 578–646 (95,4%). Сообщение университета 22.07.2015 даёт 568–645 (95,4%). Остальные интервалы карточек совпали с уже записанными.$c$;
BEGIN
  SELECT id INTO tid FROM topics WHERE slug = 'early-manuscripts';
  IF tid IS NULL OR EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    RETURN;
  END IF;
  SELECT btrim(circumstances) <> '', btrim(circumstances_note) <> ''
    INTO filled, noted
  FROM topic_texts WHERE topic_id = tid AND locale = 'ru';
  IF NOT filled THEN
    UPDATE topic_texts
    SET circumstances = facts, circumstances_note = note
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'early-manuscripts', 'circumstances', 'catalog-facts'),
      'В обстоятельства записаны только шифр, объём и радиоуглеродный интервал. Описания карточек и снимки не копировались. Позиции сторон не заполнялись.',
      'migration:038'
    );
  ELSIF NOT noted THEN
    UPDATE topic_texts SET circumstances_note = note
    WHERE topic_id = tid AND locale = 'ru';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES (
      'topic', tid::text, 'updated',
      jsonb_build_object('slug', 'early-manuscripts', 'circumstances_note', '1572a-calibration'),
      'Уже записанные обстоятельства не менялись. В примечание добавлена калибровка IntCal 2020 для Islamic Arabic 1572a: 578–646 рядом с 568–645 из сообщения университета.',
      'migration:038'
    );
  END IF;
END $$;
