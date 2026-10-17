# Манба

Энциклопедия ислама по первоисточникам. Замысел и все решения — в [`docs/PLAN.md`](docs/PLAN.md), правила работы — в [`CLAUDE.md`](CLAUDE.md).

## Документы

- [`docs/PLAN.md`](docs/PLAN.md) — план и журнал решений
- [`docs/ADDRESSES.md`](docs/ADDRESSES.md) — черновик схемы адресов (на утверждении)
- [`docs/SOURCES.md`](docs/SOURCES.md) — открытые корпуса-кандидаты и их лицензии

## Сайт (`web/`)

Next.js 16 + Supabase. Весь сайт закрыт входом; регистрация только по приглашению; индексация запрещена.

```bash
cd web
cp .env.example .env.local   # вставить publishable key из Supabase
npm install
npm run dev                  # http://localhost:3000
```

Проверки перед отправкой: `npm run build && npx tsc --noEmit && npm run lint`.

## Инфраструктура

| Что | Где |
| --- | --- |
| Код | GitHub `d81st/manba`, ветка `main` |
| Сайт | Render, бесплатный план, Франкфурт (root: `web`) |
| База и вход | Supabase `manba` (`kjxigiiahuxfwiikwwlx`), Франкфурт |

### Настройки Supabase для входа по приглашению

В панели Supabase (Authentication):

1. **Sign In / Providers → Email:** выключить «Allow new users to sign up».
2. **URL Configuration:** Site URL — адрес сайта на Render; в Redirect URLs добавить его же с `/**`.

Пригласить человека: Authentication → Users → Invite user. Он получит письмо, перейдёт по ссылке и задаст пароль. Сайт понимает стандартные письма Supabase, менять шаблоны не нужно.

### Почта

Без своего SMTP Supabase отправляет письма **только участникам команды проекта** (Organization → Team) и не чаще нескольких раз в час. Чтобы приглашать других людей, нужен свой SMTP (Authentication → Emails → Set up SMTP), например:

- **Gmail:** `smtp.gmail.com`, порт `587`, логин — адрес Gmail, пароль — «пароль приложения» из настроек аккаунта Google (нужна двухэтапная проверка). Подходит для узкого круга, свой домен не нужен.
- **Resend, Brevo и подобные** — когда появится свой домен.

После подключения SMTP можно менять шаблоны писем. Для ссылок без токенов в адресе используйте
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (для сброса пароля — `type=recovery`).
