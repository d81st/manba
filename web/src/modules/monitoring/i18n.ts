// Russian strings of the monitoring module; shared/i18n/ru.ts puts them in place.

// Groups of messages.admin.
export const monitoringAdminRu = {
  siteErrors: {
    title: "Ошибки сайта",
    intro: "Ошибки сервера и браузеров читателей за последние {days} дней. Хранится только адрес страницы — без поисковых запросов, логинов и адресов посетителей. Одинаковые ошибки собраны вместе.",
    empty: "Ошибок нет.",
    kinds: { server: "сервер", client: "браузер" },
    times: { one: "раз", few: "раза", many: "раз" },
    first: "впервые",
    last: "последний раз",
    page: "страница",
    code: "код",
    stack: "Подробности",
    clear: "Очистить журнал",
  },
};
