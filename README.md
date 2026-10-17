# Манба

Энциклопедия ислама по первоисточникам. Замысел и все решения — в [`docs/PLAN.md`](docs/PLAN.md), правила работы — в [`CLAUDE.md`](CLAUDE.md).

## Документы

- [`docs/PLAN.md`](docs/PLAN.md) — план и журнал решений
- [`docs/ADDRESSES.md`](docs/ADDRESSES.md) — черновик схемы адресов (на утверждении)
- [`docs/SOURCES.md`](docs/SOURCES.md) — открытые корпуса-кандидаты и их лицензии
- [`docs/REUSE.md`](docs/REUSE.md) — что взять из проектов avtoexpert и gameclub

## Сайт (`web/`)

Next.js 16 + PostgreSQL (Supabase). Весь сайт закрыт общим логином и паролем; индексация запрещена.

```bash
cd web
cp .env.example .env.local   # задать логин, пароль и SESSION_SECRET
npm install
npm run dev                  # http://localhost:3000
```

Проверки перед отправкой: `npm run lint && npm test && npm run build && npx tsc --noEmit`. То же самое (и миграции на чистой PostgreSQL) автоматически гоняет GitHub Actions (`.github/workflows/ci.yml`) на каждый PR и пуш в `main`.

## Инфраструктура

| Что | Где |
| --- | --- |
| Код | GitHub `d81st/manba`, ветка `main` |
| Сайт | Render, бесплатный план, Франкфурт (root: `web`) |
| База | Supabase `manba` (`kjxigiiahuxfwiikwwlx`), Франкфурт |

### База данных

Миграции — SQL-файлы в `db/migrations/` (`001_…sql`, `002_…sql`). Они накатываются по порядку при каждом запуске сайта (`npm start` вызывает `scripts/migrate.mjs`); уже применённые записаны в таблице `_migrations`. Вручную: `cd web && npm run db:migrate`. Без `DATABASE_URL` миграции пропускаются.

Переменные на Render:

| Переменная | Что это |
| --- | --- |
| `DATABASE_URL` | Supabase → проект `manba` → **Connect** → **Session pooler** (порт 5432), с паролем базы. Прямой адрес `db.<ref>.supabase.co` Render не видит (только IPv6) |
| `DATABASE_SSL` | `true` |

Правила:

- новая миграция — новый файл со следующим номером; применённые файлы не меняются;
- публичные роли Supabase (`anon`, `authenticated`) доступа к таблицам не имеют: данные идут только через наш сервер;
- журнал `change_log` и будущие опубликованные тексты защищены триггером `forbid_change()`: изменить или удалить запись нельзя, исправление — новой записью.

### Вход на время разработки

Весь сайт закрыт одним общим логином и паролем. Почта и учётные записи пользователей появятся позже.

Переменные окружения (на Render: сервис `manba` → Environment):

| Переменная | Что это |
| --- | --- |
| `SITE_LOGIN` | логин |
| `SITE_PASSWORD` | пароль; после смены все выходят из сайта |
| `SESSION_SECRET` | случайная строка от 32 символов (`openssl rand -base64 32`) |

Если какой-то переменной нет, войти нельзя (сайт остаётся закрытым). После 10 неверных попыток с одного адреса вход закрывается на 15 минут.
