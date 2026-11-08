import { topicsAdminRu, topicsRu } from "@/modules/topics/i18n";
import { glossaryAdminRu, glossaryRu } from "@/modules/glossary/i18n";
import { videosAdminRu, videosRu } from "@/modules/videos/i18n";
import { findingsAdminRu, findingsRu } from "@/modules/findings/i18n";
import { quizAdminRu, quizRu } from "@/modules/quiz/i18n";
import { historyAdminRu, historyRu } from "@/modules/history/i18n";
import { originsAdminRu, originsRu } from "@/modules/origins/i18n";
import { siraAdminRu, siraRu } from "@/modules/sira/i18n";
import { assistantAdminRu, assistantRu } from "@/modules/assistant/i18n";
import { quranRu } from "@/modules/quran/i18n";
import { hadithAdminRu, hadithRu } from "@/modules/hadith/i18n";
import { libraryRu } from "@/modules/library/i18n";
import { accountsAdminRu, accountsRu } from "@/modules/accounts/i18n";

// Interface strings only. Source texts are stored in the database, never here.
export const ru = {
  ...accountsRu,
  ...libraryRu,
  ...hadithRu,
  ...quranRu,
  ...assistantRu,
  ...siraRu,
  ...originsRu,
  ...historyRu,
  ...quizRu,
  ...findingsRu,
  ...videosRu,
  ...topicsRu,
  ...glossaryRu,
  appName: "Манба",
  appTagline: "Энциклопедия ислама по первоисточникам",
  nav: {
    signOut: "Выйти",
    home: "Разделы",
  },
  admin: {
    ...accountsAdminRu,
    ...hadithAdminRu,
    ...assistantAdminRu,
    ...siraAdminRu,
    ...originsAdminRu,
    ...historyAdminRu,
    ...quizAdminRu,
    ...findingsAdminRu,
    ...videosAdminRu,
    ...glossaryAdminRu,
    ...topicsAdminRu,
    title: "Панель администратора",
    link: "Админка",
    intro: "Здесь администратор-модератор добавляет и проверяет материалы. Опубликованное видят все вошедшие; черновики — только здесь.",
    sections: {
      terms: "Словарь терминов",
      termsHint: "Термины, определения разных школ, ссылки на аяты и хадисы, связи между терминами.",
      topics: "Темы",
      topicsHint: "Вопрос, тексты, обстоятельства и позиции разных сторон. Сложные темы — с пометкой.",
      sides: "Стороны позиций",
      sidesHint: "Список сторон: традиция, исследователи, критики и другие. Можно добавить новую.",
      sira: "Жизнеописание пророка",
      siraHint: "События и их даты по источникам, места на карте, люди и связи между ними.",
      origins: "Истоки и связи",
      originsHint: "Связи аятов и хадисов с текстами других религий: тип, степень уверенности, основание и обе трактовки.",
      links: "Похожие хадисы",
      linksHint: "Пары похожих текстов из разных сборников, найденные автоматически: отметить, один ли это хадис.",
      history: "Историческая линия",
      historyHint: "События от пророка до наших дней по слоям: правители, тексты, учение, учёные. Каждая дата — слова источника.",
      findings: "Новые находки",
      findingsHint: "Наводки извне (пост, видео) с текстом, который приписывают источнику: проверить по первоисточнику — подтверждено или не найдено.",
      assistant: "Ассистент: синонимы",
      assistantHint: "Слова, которыми ассистент дополняет вопрос (русское ↔ арабское), и вопросы, на которые он ничего не нашёл.",
      videos: "Видео",
      videosHint: "Ссылки на посты YouTube и Telegram рядом с аятами, хадисами и темами — как дополнительный материал, не аргумент. Проверка, не удалены ли посты.",
      users: "Пользователи",
      usersHint: "Учётные записи читателей и администраторов: завести с временным паролем, сбросить пароль, отключить, сменить роль.",
      tests: "Тесты",
      testsHint: "Вопросы с вариантами ответа. Каждый вопрос построен на фрагментах источников, которые показываются после ответа.",
    },
    categories: {
      general: "тема",
      hard: "сложная тема",
      quran_text: "история текста Корана",
      sira: "жизнеописание",
      cities: "священный город",
      testimony: "раннее свидетельство",
      science: "учёный и наука",
      science_claims: "утверждение о научном открытии",
    },
    statuses: { draft: "черновик", review: "на проверке", published: "опубликовано", retired: "снято" },
    recognitions: {
      tradition: "принято традицией",
      research_majority: "принято большинством исследователей",
      minority: "гипотеза меньшинства",
    },
    relationKinds: { related: "связанный", broader: "более общий", narrower: "более частный", opposite: "противоположный" },
  },
  cities: {
    title: "Священные города",
    intro: "Города, священные в исламе: Мекка, Медина, Иерусалим и святыни шиитской традиции. У каждого города — место на карте, события жизнеописания пророка, аяты, хадисы и исторические сообщения, позиции разных сторон со степенью признания. Спорные версии (например, о Бекке или Петре) показываются с пометкой, кто их держится.",
    cards: "Города",
    empty: "Карточки городов ещё не опубликованы: черновики проверяет администратор.",
    drafts: "Черновики — в панели администратора",
    map: "На карте",
    noPlace: "место не указано",
    events: { one: "событие жизнеописания", few: "события жизнеописания", many: "событий жизнеописания" },
    credit: "Места: al-Ṯurayyā Gazetteer (CC BY 4.0). Суша: Natural Earth (общественное достояние).",
  },
  science: {
    title: "Ислам и наука",
    intro: "Две разные вещи, которые здесь не смешиваются. Исторический вклад — учёные исламской цивилизации и их сочинения, как о них пишут их биографы. Утверждения, что в Коране или хадисах заранее описаны научные открытия, — спорные: у каждого показаны тексты, толкования сторонников и возражения критиков.",
    history: "Учёные и их сочинения",
    historyHint: "Кто это был, что написал — по словарям учёных (Ибн Аби Усайбиа, аль-Кифти) — и как о нём писали богословы разных взглядов.",
    claims: "Утверждения о научных открытиях в текстах",
    claimsHint: "Спорные: аят, толкования и доводы сторон. Сначала — классический спор о том, содержит ли Коран все науки.",
    empty: "Карточки ещё не опубликованы: черновики проверяет администратор.",
    drafts: "Черновики — в панели администратора",
    books: "Книги раздела в библиотеке",
  },
  notFound: {
    title: "Страница не найдена",
    text: "Такого адреса нет.",
    back: "На главную",
  },
  home: {
    signedInAs: "Вы вошли как",
    loading: "Загрузка…",
    sectionsTitle: "Разделы",
    soon: "в разработке",
    open: "открыть",
    sections: {
      library: "Библиотека",
      encyclopedia: "Энциклопедия",
      quranMap: "Карта Корана",
      glossary: "Словарь терминов",
      sira: "Жизнеописание пророка",
      cities: "Священные города",
      hardTopics: "Сложные темы",
      quranText: "История текста Корана",
      origins: "Истоки и связи",
      science: "Ислам и наука",
      timeline: "Историческая линия",
      tests: "Тесты",
      assistant: "Ассистент по источникам",
      notFound: "Не найдено в источниках",
    },
  },
};

export type Messages = typeof ru;
