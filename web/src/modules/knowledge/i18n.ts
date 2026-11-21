// Russian strings of the knowledge map; shared/i18n/ru.ts puts them in place.

// Top-level groups of messages.
export const knowledgeRu = {
  knowledge: {
    title: "Карта знаний",
    intro:
      "Разделы, темы, термины и связи с другими учениями на одной схеме. Линии — связи, которые проставили редакторы: тема и её термины, связанные темы, связанные термины; бледные линии ведут к разделу, где лежит материал. Нажмите на узел, чтобы увидеть, что это, и перейти на его страницу.",
    graphLabel: "Карта знаний: разделы, темы, термины и связи с другими учениями",
    searchPlaceholder: "Найти на карте",
    pick: "Нажмите на узел или найдите его по названию.",
    open: "Открыть страницу",
    neighbours: "Связано с",
    asList: "Всё на карте списком",
    empty: "На карте пока ничего нет: опубликованных тем и терминов нет.",
    kinds: { section: "раздел", topic: "тема", term: "термин", parallel: "связь с другими учениями" },
    sections: {
      topics: "Темы",
      topicsHint: "Вопросы, о которых говорят источники, с позициями всех сторон.",
      hard: "Сложные темы",
      hardHint: "Тексты полностью, с окружающими аятами, обстоятельствами и позициями сторон.",
      sira: "Жизнеописание пророка",
      siraHint: "События, места и люди по источникам.",
      quranText: "История текста Корана",
      quranTextHint: "Запись, собирание и чтения текста по источникам.",
      cities: "Священные города",
      citiesHint: "Мекка, Медина и другие места по источникам.",
      origins: "Истоки и связи",
      originsHint: "Тексты ислама рядом с текстами других религий, с обеими трактовками.",
      science: "Ислам и наука",
      scienceHint: "Учёные и утверждения о науке с источниками.",
      glossary: "Словарь терминов",
      glossaryHint: "Понятия, без которых трудно читать источники.",
    },
  },
};

export const knowledgeEn: typeof knowledgeRu = {
  knowledge: {
    title: "Knowledge map",
    intro:
      "Sections, topics, terms and links with other teachings on one diagram. Lines are links the editors set: a topic and its terms, related topics, related terms. Pale lines lead to the section the material belongs to. Press a node to see what it is and open its page.",
    graphLabel: "Knowledge map: sections, topics, terms and links with other teachings",
    searchPlaceholder: "Find on the map",
    pick: "Press a node or find it by name.",
    open: "Open the page",
    neighbours: "Linked with",
    asList: "Everything on the map as a list",
    empty: "Nothing is on the map yet: there are no published topics or terms.",
    kinds: { section: "section", topic: "topic", term: "term", parallel: "link with other teachings" },
    sections: {
      topics: "Topics",
      topicsHint: "Questions the sources speak about, with the positions of every side.",
      hard: "Difficult topics",
      hardHint: "The texts in full, with the surrounding ayahs, the circumstances and the positions of the sides.",
      sira: "The Prophet’s life",
      siraHint: "Events, places and people from the sources.",
      quranText: "History of the Quran’s text",
      quranTextHint: "How the text was written down, collected and recited, from the sources.",
      cities: "Sacred cities",
      citiesHint: "Mecca, Medina and other places from the sources.",
      origins: "Origins and links",
      originsHint: "Texts of Islam beside texts of other religions, with both readings.",
      science: "Islam and science",
      scienceHint: "Scholars and claims about science, with the sources.",
      glossary: "Glossary",
      glossaryHint: "Terms that are hard to read the sources without.",
    },
  },
};
