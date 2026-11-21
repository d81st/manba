// Russian strings of the history module; i18n/ru.ts puts them in place.

// Top-level groups of messages.
export const historyRu = {
  history: {
    title: "Историческая линия",
    intro: "Когда что появилось в исламе и кто за этим стоял — от пророка до наших дней. Каждая дата — слова источника с адресом; если источники расходятся, показаны все версии. Годы хиджры переведены в годы н. э. приблизительно (≈): год хиджры короче солнечного и приходится на два года.",
    layers: { rulers: "Правители", texts: "Тексты", doctrine: "Учение и практика", science: "Учёные и науки" },
    allLayers: "Все слои",
    scale: "Масштаб",
    scales: { century: "века", decade: "десятилетия", year: "годы" },
    century: "{n} век",
    decade: "{n}-е",
    beforeHijra: "{n} до хиджры",
    undated: "Без даты в источниках",
    ah: "г. х.",
    variant: "другое сообщение",
    empty: "Событий на линии пока нет: черновики проверяет администратор.",
    drafts: "Черновики — в панели администратора",
    topic: "Подробнее",
    sources: "Источники дат: «Тарих» Халифы ибн Хаййата, «Тарих» ат-Табари и другие книги библиотеки — у каждой даты своя ссылка.",
    ribbon: {
      label: "Лента времени: события на шкале лет, по слоям",
      hint: "Перетаскивайте ленту, приближайте кнопками, колёсиком с Ctrl/⌘ или двумя пальцами. Нажмите на точку, чтобы увидеть, что говорят источники; отрезок — источники называют разные годы.",
      lanes: { sira: "Жизнеописание пророка", rulers: "Правители", texts: "Тексты", doctrine: "Учение и практика", science: "Учёные и науки" },
      ah: "г. х.",
      ce: "н. э.",
      overview: "Вся эпоха: нажмите или потяните, чтобы перейти",
      pick: "Нажмите на событие на ленте — здесь появятся даты из источников.",
      spread: "Источники называют разные даты — показаны все.",
      inList: "Открыть в списке",
      page: "Страница события",
    },
  },
};

// Groups of messages.admin.
export const historyAdminRu = {
  history: {
    title: "Историческая линия",
    intro: "События по слоям. Каждая дата — слова источника с адресом страницы: при сохранении сайт проверяет, что цитата стоит на этой странице. Если источники расходятся, добавьте каждую версию отдельной датой.",
    add: "Добавить событие",
    preview: "Предпросмотр с черновиками",
    empty: "Событий пока нет.",
    back: "Историческая линия",
    layer: "Слой",
    dates: "Дат",
    card: "Тема энциклопедии",
    datesHint: "Ссылка — книга библиотеки по тому и странице: «Халифа 1:121», «Табари 2:407», «Усайбиа 1:437». Цитата — слова источника точно как в тексте. Год хиджры (до хиджры — минус) или, если источник сам считает от Рождества Христова, год н. э.",
    yearAh: "Год х.",
    yearCe: "Год н. э.",
    errors: { oneYear: "Укажите один год: хиджры или н. э." },
  },
};

export const historyEn: typeof historyRu = {
  history: {
    title: "Timeline",
    intro: "When something appeared in Islam and who stood behind it — from the Prophet to our day. Every date is the words of a source, with an address. Where the sources differ, every version is shown. Hijri years are turned into common-era years approximately (≈): a hijri year is shorter than a solar year and falls across two of them.",
    layers: { rulers: "Rulers", texts: "Texts", doctrine: "Teaching and practice", science: "Scholars and the sciences" },
    allLayers: "All layers",
    scale: "Scale",
    scales: { century: "centuries", decade: "decades", year: "years" },
    century: "{n} century",
    decade: "{n}s",
    beforeHijra: "{n} before the Hijra",
    undated: "No date in the sources",
    ah: "AH",
    variant: "another report",
    empty: "There are no events on the timeline yet: an administrator checks the drafts.",
    drafts: "Drafts are in the admin panel",
    topic: "More",
    sources: "Sources of the dates: the History of Khalifa ibn Khayyat, the History of al-Tabari and other books in the library — each date has its own reference.",
    ribbon: {
      label: "Timeline: events on a scale of years, by layer",
      hint: "Drag the ribbon, zoom with the buttons, with the wheel and Ctrl/⌘, or with two fingers. Press a point to see what the sources say; a segment means the sources name different years.",
      lanes: { sira: "The Prophet’s life", rulers: "Rulers", texts: "Texts", doctrine: "Teaching and practice", science: "Scholars and the sciences" },
      ah: "AH",
      ce: "CE",
      overview: "The whole span: press or drag to move",
      pick: "Press an event on the ribbon — the dates from the sources appear here.",
      spread: "The sources name different dates — all of them are shown.",
      inList: "Open in the list",
      page: "Event page",
    },
  },
};

export const historyAdminEn: typeof historyAdminRu = {
  history: {
    title: "Timeline",
    intro: "Events by layer. Every date is the words of a source with a page address: on saving, the site checks that the quotation stands on that page. Where the sources differ, add each version as its own date.",
    add: "Add an event",
    preview: "Preview with drafts",
    empty: "No events yet.",
    back: "Timeline",
    layer: "Layer",
    dates: "Dates",
    card: "Encyclopedia topic",
    datesHint: "A reference is a library book by volume and page: “Khalifa 1:121”, “Tabari 2:407”, “Usaybia 1:437”. The quotation is the source’s words exactly as in the text. A hijri year (negative before the Hijra) or, if the source itself counts from the birth of Christ, a common-era year.",
    yearAh: "Year AH",
    yearCe: "Year CE",
    errors: { oneYear: "Give one year: AH or CE." },
  },
};
