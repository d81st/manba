// Russian strings of the reports module; shared/i18n/ru.ts puts them in place.

// Top-level groups of messages.
export const reportsRu = {
  reports: {
    button: "Сообщить об ошибке",
    title: "Сообщить об ошибке",
    intro: "Опечатка, неверная дата, не тот текст, сломанная ссылка — напишите, что не так. Сообщение увидит только администратор.",
    where: "Страница",
    quote: "Выделенный текст",
    quoteHint: "Чтобы указать место точнее, закройте окно, выделите текст с ошибкой и нажмите кнопку снова.",
    message: "Что не так",
    placeholder: "Например: в переводе пропущено слово; дата не совпадает с источником",
    send: "Отправить",
    cancel: "Закрыть",
    sent: "Спасибо, сообщение отправлено.",
    problems: {
      tooShort: "Напишите хотя бы несколько слов.",
      tooLong: "Слишком длинно: не больше 2000 знаков.",
      badPage: "Не удалось определить страницу. Обновите её и попробуйте снова.",
      tooMany: "Сегодня от вас уже много сообщений. Попробуйте завтра.",
      unavailable: "Не удалось отправить. Попробуйте ещё раз через минуту.",
    },
  },
};

// Groups of messages.admin.
export const reportsAdminRu = {
  reports: {
    title: "Сообщения об ошибках",
    intro: "Что читатели написали об ошибках на страницах. Откройте страницу, исправьте в нужном разделе админки и отметьте сообщение разобранным.",
    statuses: { new: "Новые", done: "Разобранные" },
    empty: "Сообщений нет.",
    open: "Открыть страницу",
    quote: "Выделено",
    from: "от",
    markDone: "Разобрано",
    markNew: "Вернуть в новые",
    doneBy: "разобрал(а)",
  },
};

export const reportsEn: typeof reportsRu = {
  reports: {
    button: "Report a mistake",
    title: "Report a mistake",
    intro: "A typo, a wrong date, the wrong text, a broken link — write what is wrong. Only an administrator sees the message.",
    where: "Page",
    quote: "Selected text",
    quoteHint: "To point to the place more precisely, close this window, select the text with the mistake, and press the button again.",
    message: "What is wrong",
    placeholder: "For example: a word is missing in the translation; the date does not match the source",
    send: "Send",
    cancel: "Close",
    sent: "Thank you, the message was sent.",
    problems: {
      tooShort: "Write at least a few words.",
      tooLong: "Too long: 2000 characters at most.",
      badPage: "The page could not be determined. Reload it and try again.",
      tooMany: "You have already sent many messages today. Try tomorrow.",
      unavailable: "Could not send. Try again in a minute.",
    },
  },
};

export const reportsAdminEn: typeof reportsAdminRu = {
  reports: {
    title: "Reports of mistakes",
    intro: "What readers wrote about mistakes on pages. Open the page, correct it in the right part of the admin panel, and mark the message done.",
    statuses: { new: "New", done: "Done" },
    empty: "No messages.",
    open: "Open the page",
    quote: "Selected",
    from: "from",
    markDone: "Done",
    markNew: "Move back to new",
    doneBy: "marked done by",
  },
};
