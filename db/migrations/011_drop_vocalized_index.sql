-- 011: the trigram index on texts.search_vocalized is dropped to save space
-- on the free database plan (25.10.2026: 67 MB of 500). A search with vowel
-- marks first finds candidates by letters through the index on search_plain,
-- then checks search_vocalized on them (web/src/lib/search-sql.ts).
DROP INDEX IF EXISTS texts_search_vocalized_idx;
