-- 046: topics about something outside the library (decision of the author
-- 07.11.2026). Such a topic may be published without library passages if the
-- note to its circumstances links the catalog or scan it stands on
-- (web/src/lib/topics-input.ts, hasOutsideSource).
--
-- «Древние рукописи»: the position already stands on the Manuscripta Coranica
-- catalog and the Birmingham report linked in the note — published.
--
-- John of Damascus: circumstances and two positions with short quotations
-- read from the scan of Patrologia Graeca 94 (archive.org,
-- patrologicursus53migngoog, page n398 = columns 763–764; public domain).
-- It is a Christian polemical chapter and the library has no Muslim answer
-- to it, so the topic goes to review, not to publication: the author decides.

DO $$
DECLARE
  tid bigint;
  pid bigint;
BEGIN
  UPDATE topics t SET status = 'published', updated_by = 'migration:046', updated_at = now()
  FROM topic_texts x
  WHERE t.slug = 'early-manuscripts' AND x.topic_id = t.id AND x.locale = 'ru'
    AND t.status IN ('draft', 'review')
    AND btrim(x.circumstances) <> '' AND x.circumstances_note ~ 'https://\S+'
    AND EXISTS (SELECT 1 FROM topic_positions p WHERE p.topic_id = t.id)
  RETURNING t.id INTO tid;
  IF tid IS NOT NULL THEN
    INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('status', 'review'),
            jsonb_build_object('status', 'published', 'slug', 'early-manuscripts'),
            'Опубликовано по внешним источникам (каталог Manuscripta Coranica, сообщение Бирмингемского университета), решение автора 07.11.2026.',
            'migration:046');
  END IF;

  SELECT id INTO tid FROM topics WHERE slug = 'john-of-damascus-heresies';
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM topic_positions WHERE topic_id = tid) THEN
    UPDATE topic_texts SET circumstances = $c$Глава 101 книги Иоанна Дамаскина «О ересях» в издании Patrologia Graeca, т. 94 (Ж.-П. Минь), столбцы 763–774: греческий текст, латинский перевод и примечания издателя М. Лекьена. Начало главы в латинском переводе: «Sed et hactenus viget populorum seductrix, Ismaelitarum superstitio quæ Antichristi adventum antevertit» (стб. 763). Места Корана, о которых говорит глава, подобраны по смыслу и стоят ниже, в связанных местах.$c$
    WHERE topic_id = tid AND locale = 'ru' AND btrim(circumstances) = '';

    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', 'Иоанн Дамаскин, «О ересях», гл. 101', 'tradition',
           $p$Называет веру исмаильтян «πρόδρομος οὖσα τοῦ Ἀντιχρίστου» и выводит их от Исмаила: «Κατάγεται δὲ ἀπὸ Ἰσμαήλ, τοῦ ἐκ τῆς Ἀγὰρ τεχθέντος τῷ Ἀβραάμ· διόπερ Ἀγαρηνοὶ καὶ Ἰσμαηλῖται προσαγορεύονται» (PG 94, стб. 764).$p$,
           $p$Скан PG 94, стб. 763–764: https://archive.org/details/patrologicursus53migngoog/page/n398/mode/2up . Степень признания (здесь — «так в христианской полемической традиции») проверяет специалист.$p$, 0
    FROM position_sides s WHERE s.slug = 'critics';
    INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
    SELECT tid, s.id, 'ru', 'М. Лекьен, издатель, примечание 70', 'tradition',
           $p$«De Mohammedanis accuratius Noster scripsit, quam alii Græci» (PG 94, стб. 763–764, прим. 70).$p$,
           $p$Скан PG 94, стб. 763–764: https://archive.org/details/patrologicursus53migngoog/page/n398/mode/2up . Степень признания проверяет специалист.$p$, 1
    FROM position_sides s WHERE s.slug = 'other';

    UPDATE topics SET status = 'review', updated_by = 'migration:046', updated_at = now()
    WHERE id = tid AND status = 'draft';
    INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
    VALUES ('topic', tid::text, 'updated', jsonb_build_object('slug', 'john-of-damascus-heresies', 'positions', 2, 'status', 'review'),
            'Обстоятельства и две позиции по скану PG 94. На проверке: в библиотеке нет мусульманского ответа на эту полемику, публикует автор.',
            'migration:046');
  END IF;
END $$;
