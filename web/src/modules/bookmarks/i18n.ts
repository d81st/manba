// Russian strings of the bookmarks module; shared/i18n/ru.ts puts them in place.

// Top-level groups of messages.
export const bookmarksRu = {
  bookmarks: {
    title: "Закладки",
    intro: "Места сайта, которые вы сохранили. Их видите только вы, с любого устройства, где вошли.",
    button: "Добавить закладку",
    dialogTitle: "Добавить закладку",
    where: "Место",
    name: "Название",
    note: "Заметка для себя (необязательно)",
    save: "Сохранить",
    close: "Закрыть",
    saved: "Закладка сохранена.",
    all: "Мои закладки",
    empty: "Закладок пока нет. Откройте нужное место и нажмите кнопку с закладкой в правом нижнем углу.",
    remove: "Удалить",
    problems: {
      noTitle: "Дайте закладке название.",
      badPage: "Не удалось определить страницу. Обновите её и попробуйте снова.",
      tooMany: "Закладок уже 500 — удалите ненужные.",
      unavailable: "Не удалось сохранить. Попробуйте ещё раз через минуту.",
    },
    continue: {
      title: "Продолжить чтение",
      hint: "Где вы остановились — запоминает только этот браузер, на сервер это не уходит.",
      sections: { quran: "Коран", hadith: "Хадисы", library: "Книги", external: "Тексты других религий" },
      forget: "Забыть",
    },
  },
};

export const bookmarksEn: typeof bookmarksRu = {
  bookmarks: {
    title: "Bookmarks",
    intro: "Places on the site you saved. Only you see them, on any device where you are signed in.",
    button: "Add bookmark",
    dialogTitle: "Add bookmark",
    where: "Place",
    name: "Title",
    note: "A note for yourself (optional)",
    save: "Save",
    close: "Close",
    saved: "Bookmark saved.",
    all: "My bookmarks",
    empty: "No bookmarks yet. Open a place and press the bookmark button in the lower right corner.",
    remove: "Remove",
    problems: {
      noTitle: "Give the bookmark a title.",
      badPage: "The page could not be determined. Reload it and try again.",
      tooMany: "You already have 500 bookmarks — remove some.",
      unavailable: "Could not save. Try again in a minute.",
    },
    continue: {
      title: "Continue reading",
      hint: "Where you stopped is remembered only in this browser. It is not sent to the server.",
      sections: { quran: "Quran", hadith: "Hadith", library: "Books", external: "Texts of other religions" },
      forget: "Forget",
    },
  },
};
