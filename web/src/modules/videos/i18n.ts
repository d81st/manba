// Russian strings of the videos module; i18n/ru.ts puts them in place.

// Top-level groups of messages.
export const videosRu = {
  videos: {
    title: "Видео — дополнительный материал",
    hint: "Видео помогает понять текст, но не является аргументом: опора — первоисточник выше. Ссылка открывается на сайте площадки.",
    summary: "Видео: {count} (дополнительный материал)",
    unavailable: "ссылка недоступна",
    platforms: { youtube: "YouTube", telegram: "Telegram", other: "сайт" },
  },
};

// Groups of messages.admin.
export const videosAdminRu = {
  videos: {
    title: "Видео",
    intro: "Видео — дополнительный материал, а не источник и не аргумент. Само видео не загружается: хранится ссылка на пост, привязанная к местам библиотеки и к темам. На сайте видео стоит рядом с ними с пометкой «дополнительный материал» и открывается на сайте площадки.",
    add: "Добавить видео",
    empty: "Видео пока нет.",
    back: "Видео",
    all: "Все",
    open: "Открыть пост",
    url: "Ссылка на пост",
    urlHint: "https://www.youtube.com/watch?v=…, https://youtu.be/…, https://t.me/канал/номер или другой сайт.",
    videoTitle: "Название",
    videoTitleHint: "Как в самом посте.",
    channel: "Автор или канал",
    language: "Язык",
    languageHint: "ru, ar, en, uz…",
    status: "Статус",
    refs: "Места библиотеки",
    refsHint: "Через запятую: «2:255, Бухари 1, Муслим 8a, Ибн Хишам 1:235».",
    topics: "Темы",
    topicsHint: "Адреса тем через запятую: namaz, hajj, sword-verse.",
    note: "Что в видео об этих местах",
    noteHint: "Коротко и нейтрально, своими словами: о чём видео. Это не утверждение сайта.",
    save: "Сохранить",
    saved: "Сохранено.",
    check: "Проверить ссылки",
    checking: "Проверяем…",
    checked: "Проверено: {checked}, недоступно: {unavailable}.",
    checkedAt: "проверено {date}",
    unavailable: "ссылка недоступна",
    counts: "мест: {places}, тем: {topics}",
    platforms: { youtube: "YouTube", telegram: "Telegram", other: "сайт" },
    errors: {
      url: "Ссылка должна начинаться с https://.",
      title: "Укажите название.",
      telegramPost: "Для Telegram нужна ссылка на пост: https://t.me/канал/номер.",
      refs: "Не удалось прочитать места",
      refsMissing: "Таких мест нет в библиотеке",
      topics: "Адрес темы — латинские буквы, цифры и дефис",
      topicsMissing: "Таких тем нет",
      placeRequired: "Опубликованное видео должно быть привязано к месту или теме.",
      taken: "Это видео уже добавлено.",
      notFound: "Не найдено.",
      invalid: "Проверьте поле",
    },
  },
};
