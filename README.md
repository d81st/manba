# Манба

Энциклопедия ислама по первоисточникам. Замысел и все решения — в [`docs/PLAN.md`](docs/PLAN.md), правила работы — в [`CLAUDE.md`](CLAUDE.md).

## Документы

- [`docs/PLAN.md`](docs/PLAN.md) — план и журнал решений
- [`docs/ADDRESSES.md`](docs/ADDRESSES.md) — черновик схемы адресов (на утверждении)
- [`docs/SOURCES.md`](docs/SOURCES.md) — открытые корпуса-кандидаты и их лицензии
- [`docs/REUSE.md`](docs/REUSE.md) — что взять из проектов avtoexpert и gameclub

## Сайт (`web/`)

Next.js 16. Весь сайт закрыт общим логином и паролем; индексация запрещена. Supabase подключится вместе с базой.

```bash
cd web
cp .env.example .env.local   # задать логин, пароль и SESSION_SECRET
npm install
npm run dev                  # http://localhost:3000
```

Проверки перед отправкой: `npm run build && npx tsc --noEmit && npm run lint`.

## Инфраструктура

| Что | Где |
| --- | --- |
| Код | GitHub `d81st/manba`, ветка `main` |
| Сайт | Render, бесплатный план, Франкфурт (root: `web`) |
| База (пока пустая) | Supabase `manba` (`kjxigiiahuxfwiikwwlx`), Франкфурт |

### Вход на время разработки

Весь сайт закрыт одним общим логином и паролем. Почта и учётные записи пользователей появятся позже.

Переменные окружения (на Render: сервис `manba` → Environment):

| Переменная | Что это |
| --- | --- |
| `SITE_LOGIN` | логин |
| `SITE_PASSWORD` | пароль; после смены все выходят из сайта |
| `SESSION_SECRET` | случайная строка от 32 символов (`openssl rand -base64 32`) |

Если какой-то переменной нет, войти нельзя (сайт остаётся закрытым). После 10 неверных попыток с одного адреса вход закрывается на 15 минут.
