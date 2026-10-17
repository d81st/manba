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
3. **Emails → Invite user:** в шаблоне заменить ссылку на
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`.
4. **Emails → Reset password:** ссылка
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`.

Пригласить человека: Authentication → Users → Invite user. Он получит письмо, перейдёт по ссылке и задаст пароль.
