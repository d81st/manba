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

export const monitoringAdminEn: typeof monitoringAdminRu = {
  siteErrors: {
    title: "Site errors",
    intro: "Errors of the server and of readers’ browsers over the last {days} days. Only the page address is stored — no search queries, logins or visitor addresses. Identical errors are grouped.",
    empty: "No errors.",
    kinds: { server: "server", client: "browser" },
    times: { one: "time", few: "times", many: "times" },
    first: "first",
    last: "last",
    page: "page",
    code: "code",
    stack: "Details",
    clear: "Clear the log",
  },
};
