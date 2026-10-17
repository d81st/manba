// Interface strings only. Source texts are stored in the database, never here.
export const ru = {
  appName: "Манба",
  appTagline: "Энциклопедия ислама по первоисточникам",
  nav: {
    signOut: "Выйти",
    changePassword: "Сменить пароль",
  },
  login: {
    title: "Вход",
    email: "Электронная почта",
    password: "Пароль",
    submit: "Войти",
    pending: "Входим…",
    invalid: "Неверная почта или пароль.",
    failed: "Не удалось войти. Попробуйте позже.",
    inviteOnly: "Регистрация только по приглашению.",
  },
  password: {
    title: "Установка пароля",
    hint: "Придумайте пароль не короче 8 символов.",
    newPassword: "Новый пароль",
    repeat: "Повторите пароль",
    submit: "Сохранить",
    pending: "Сохраняем…",
    tooShort: "Пароль должен быть не короче 8 символов.",
    mismatch: "Пароли не совпадают.",
    failed: "Не удалось сохранить пароль. Попробуйте ещё раз.",
  },
  authError: {
    title: "Ссылка недействительна",
    text: "Ссылка устарела или уже использована. Попросите новое приглашение.",
    back: "На страницу входа",
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
