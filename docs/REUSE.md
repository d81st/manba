# Что взять из других проектов автора

17.10.2026 · Готовые решения из [`d81st/avtoexpert`](https://github.com/d81st/avtoexpert) и [`d81st/gameclub`](https://github.com/d81st/gameclub), которые пригодятся «Манбе». Перед переносом читать оригинал: код там на Express, у нас Next.js, поэтому переносится логика и устройство, а не файлы целиком.

## Когда что понадобится

| Наша задача | Откуда взять | Что именно |
| --- | --- | --- |
| Учётные записи пользователей (вместо временного общего входа) | avtoexpert: `docs/AUTH.md`, `backend/src/modules/auth/` (контракт переноса в `README.md`), `frontend/src/features/auth/` | Пароли в bcrypt; сеансы в таблице с поколениями и защитой от копирования токена; страница «Устройства»; CSRF; временный пароль вида `k7mx-4pra-n2wd` с обязательной сменой; роль и отключение проверяются по базе на каждом запросе; опасные действия только из сеанса старше 48 ч |
| Защита от перебора паролей на базе | avtoexpert: `backend/src/modules/auth/lockout.service.ts` | Три порога (адрес + логин, логин, адрес) в таблице `auth_failures`. Заменит нынешний ограничитель в памяти |
| Неизменность опубликованного и журнал исправлений (кто, когда, почему) | gameclub: `backend/src/db/migrations/007_debt_ledger.sql` | Журнал, который сама база не даёт изменить или удалить (триггеры `BEFORE UPDATE OR DELETE` и `TRUNCATE`); исправление — новой записью с причиной; кто и почему передаются в базу через `current_setting('app.user_id')` и `app.reason` |
| Журнал действий модератора | avtoexpert: `backend/src/modules/reports/reportEvents.ts`; gameclub: `backend/src/lib/audit.ts` | Таблица событий без внешнего ключа (записи переживают удаление), слияние частых правок в одну запись; запись «старое → новое значение» |
| Проверки при загрузке и поиск дубликатов | avtoexpert: `reports/contentHash.ts`, `reports/photoFingerprint.ts` | Отпечаток содержимого: одинаковое не загружается дважды, видно «изменено после публикации» |
| Миграции базы | gameclub: `backend/src/db/migrate.ts`; avtoexpert: Drizzle (`backend/drizzle/`) | Простые SQL-файлы по порядку, каждый в своей транзакции, блокировка от двойного запуска, накат при старте сервера (работает на бесплатном Render) |
| Закрыть прямой доступ к таблицам в Supabase | gameclub: `backend/src/db/migrations/018_db_hardening.sql` | Отозвать права у ролей `anon` и `authenticated`: данные доступны только через наш сервер |
| Подключение к Supabase с Render | avtoexpert: `docs/DEPLOY.md`; gameclub: `README.md` | Строка **Session pooler** (порт 5432) и `DATABASE_SSL=true`: прямой адрес `db.<ref>.supabase.co` работает только по IPv6, Render его не видит |
| Хранение сканов и PDF | avtoexpert: `backend/src/shared/services/fileStore.ts` | Хранилище с двумя драйверами: локальный диск и приватный бакет Supabase Storage |
| Роли модератора и редактора, помощники администратора | gameclub: `backend/src/lib/permissions.ts`; avtoexpert: роли в `docs/AUTH.md` | Роли + точечные права поверх роли; последнего администратора нельзя снять |
| Проверка «черновик → на проверке → опубликовано» | gameclub: утверждение погашений («четыре глаза») | Своё изменение утверждает другой человек; утверждённое окончательно |
| Офлайн-режим и установка на телефон | gameclub: `frontend/public/sw.js`, `manifest.webmanifest` | Оболочка в кэше, данные — сначала сеть, при обрыве последняя копия |
| Компоненты интерфейса | avtoexpert: `frontend/src/components/ui` (shadcn/ui), тема в `frontend/src/index.css` | **Перенесены 17.10.2026:** button, input, label, card, badge, radio-group, select, separator, alert. Остальные (dialog, tabs, tooltip, table, sonner, command, date-picker) — брать оттуда же по мере надобности |
| Узбекский язык интерфейса | avtoexpert: `frontend/src/shared/context/LocaleContext.tsx`, `backend/data/norms-uz.json` | Переключение ru/uz |
| Уведомления администратору (новые находки, недоступные видео) | gameclub: `backend/src/modules/telegram/` | Telegram-бот |
| Тесты и CI | avtoexpert: `.github/workflows/platform-mvp.yml`, `backend/tests/` | Vitest, property-тесты, «золотые» примеры, общие для сервера и браузера (`tests/fixtures/*.json`); в CI ещё `npm audit` |

## Подводные камни, уже найденные в тех проектах

- **npm 10** падает с `Cannot read properties of null (reading 'edgesOut')` на `npm install`. Обход: `npx npm@11 install` (avtoexpert, `CLAUDE.md`).
- Пароль в bcrypt учитывается только до 72 байт: ограничивать длину нового пароля.
- Весь офис или семья выходит в интернет с одного адреса: блокировка «5 ошибок с адреса» закрывает вход всем. Нужны раздельные пороги (см. `lockout.service.ts`).
- Бесплатный Render засыпает: первое открытие 30–60 секунд; `preDeployCommand` недоступен, поэтому миграции накатываются при старте сервера.
