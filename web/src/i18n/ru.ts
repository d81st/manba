// Interface strings only. Source texts are stored in the database, never here.
export const ru = {
  appName: "Манба",
  appTagline: "Энциклопедия ислама по первоисточникам",
  nav: {
    signOut: "Выйти",
  },
  login: {
    title: "Вход",
    login: "Логин",
    password: "Пароль",
    submit: "Войти",
    pending: "Входим…",
    invalid: "Неверный логин или пароль.",
    locked: "Слишком много попыток. Попробуйте через 15 минут.",
    notConfigured: "Вход не настроен на сервере.",
    closed: "Сайт в разработке, доступ только для участников проекта.",
  },
  home: {
    signedInAs: "Вы вошли как",
    loading: "Загрузка…",
    sectionsTitle: "Разделы",
    soon: "в разработке",
    sections: {
      library: "Библиотека первоисточников",
      encyclopedia: "Энциклопедия",
      quranMap: "Карта Корана",
      glossary: "Словарь терминов",
      sira: "Жизнеописание пророка",
      cities: "Священные города",
      hardTopics: "Сложные темы",
      origins: "Истоки и связи",
      science: "Ислам и наука",
      timeline: "Историческая линия",
      tests: "Тесты",
      assistant: "Ассистент по источникам",
    },
  },
};

export type Messages = typeof ru;
