# Внешние источники: тексты других религий

Тексты для раздела «Истоки и связи с другими учениями» (`docs/PLAN.md`). Это не первоисточники ислама: в библиотеке они стоят отдельной категорией «внешние источники» (канон `external`). Загружаются при запуске сайта (`web/scripts/import-sources.ts`), один раз на версию.

Файлы `*.tsv` — «адрес<TAB>текст», по одной строке на стих или мишну. Их собирает `prepare.py` из скачанных файлов (как скачать — ниже); список книг, их номера и названия — `web/src/lib/external-books.json`. Адреса — `docs/ADDRESSES.md`: номер книги постоянный, порядок книг еврейской Библии — как в еврейской традиции (Тора, Пророки, Писания), Нового Завета — обычный (от Матфея … Откровение), Мишны — по шести разделам.

| Файл | Что | Откуда | Лицензия |
| --- | --- | --- | --- |
| `tanakh-he.tsv` | Еврейская Библия (Танах), 39 книг, 23 206 стихов, с огласовками | Sefaria Export, версия «Tanach with Nikkud» (источник — tanach.us, Вестминстерский Ленинградский кодекс); индекс Sefaria-Export `de1d27b` (2026-10-02), файлы из `storage.googleapis.com/sefaria-export` | Public Domain (указано в файле Sefaria) |
| `tanakh-ru.tsv` | Синодальный перевод (1876) тех же книг, 23 142 стиха | `scrollmapper/bible_databases`, `formats/json/RusSynodal.json`, коммит `59b18c5` (2026-10-24) | Public Domain (`sources/ru/RusSynodal/README.md`) |
| `nt-grc.tsv` | Новый Завет по-гречески, SBL Greek New Testament, 7939 стихов | `LogosBible/SBLGNT`, `data/sblgnt/text/*.txt` (версия 1.2, 2023) | CC BY 4.0. Copyright 2010 by the Society of Biblical Literature and Logos Bible Software |
| `nt-ru.tsv` | Синодальный перевод Нового Завета, 7937 стихов | как `tanakh-ru.tsv` | Public Domain |
| `pre-he.tsv` | Пиркей де-рабби Элиэзер, 54 главы, 656 абзацев, с огласовками | Sefaria Export, версия «Pirke DeRabbi Eliezer, Sefaria Vocalized Edition» | Public Domain (указано в файле Sefaria) |
| `mishnah-he.tsv` | Мишна, 63 трактата, 4187 мишн | Sefaria Export, версия «Mishnah, ed. Romm, Vilna 1913» | Public Domain (указано в файле Sefaria) |

**Сопоставление Синодального перевода.** Синодальный перевод местами нумерует главы и стихи иначе, чем еврейский текст: псалмы — по греческой Библии (еврейский Пс 37 — Синодальный 36), стих бывает в начале следующей главы (Иона 2:1 = Синодальный 1:17), в Иоиле и Малахии иное деление на главы. `prepare.py` идёт по главам обеих книг и, где число стихов не совпадает, сопоставляет стих за стихом кратчайший отрезок глав с равным числом стихов. Главы, где так не выходит (стихи разделены иначе внутри главы, греческие добавления), сопоставляются по стандартной таблице нумераций Copenhagen Alliance (`versification-mappings/standard-mappings/rso.json` и `org.json`, коммит `519af77` от 12.10.2026, данные — CC BY-SA 4.0, https://github.com/Copenhagen-Alliance/versification-specification): она говорит, какому стиху оригинала соответствует каждый стих Синодального перевода. Так сопоставлены 13 глав (Лев 14, Нав 24, 3 Цар 22, Ис 3 и 64, Пс 142, Притч 4, 13, 18, Песн 1, Дан 3, Неем 7, 1 Пар 12). Греческие добавления в Даниила 3 (Синодальные 3:24–90) еврейского соответствия не имеют и не загружены. **Без перевода остаются две главы** — Исход 20 и Второзаконие 5 (Десять заповедей): в нашем еврейском издании стихи там разделены иначе (23 и 30 стихов), чем в «оригинале» таблицы (26 и 33). Проверки на известных местах — в конце `prepare.py`. Русский текст всегда стоит под еврейским адресом. Добавленные стихи загружаются отдельной загрузкой `external:tanakh-ru:v2` — только недостающие адреса, опубликованное не меняется. В Новом Завете номера совпадают; 18 стихов Синодального перевода, которых нет в греческом издании под тем же номером (например, Мф 17:21, Рим 16:25–27 у Синодального стоит в 14:24–26), не загружены.

**Знаки издания SBLGNT** (⸀⸁⸂⸃⸄⸅) отмечают чтения его аппарата; аппарат не загружен, знаки убраны.

## Как собрать заново

```bash
D=/путь/к/папке
# индекс Sefaria (books.json из https://github.com/Sefaria/Sefaria-Export) → $D/sefaria-books.json
# по индексу: «Tanach with Nikkud» каждой книги → $D/tanakh/<название Sefaria>.json,
#             «Mishnah, ed. Romm, Vilna 1913» → $D/mishnah/<название Sefaria>.json
# https://raw.githubusercontent.com/LogosBible/SBLGNT/master/data/sblgnt/text/<код>.txt → $D/sblgnt/
# scrollmapper/bible_databases formats/json/RusSynodal.json → $D/RusSynodal.json
# Copenhagen-Alliance/versification-specification versification-mappings/standard-mappings/{rso,org}.json → $D/versification/
python3 -I prepare.py "$D"
```
