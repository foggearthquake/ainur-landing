# CLAUDE.md — проект `my-landing` (gabdra.pw)

Хаб ainur. (gabdra.pw) + site.gabdra.pw + ai.gabdra.pw — одно Next.js-приложение, поддомены
разводит `middleware.ts` по Host. Плюс Telegram-бот @foggearthquake_bot (`lib/bot`, `app/api/telegram`).

## Хостинг (с 23.10.2026): основной в РФ, запасной Vercel

- **Основной — VDSina `195.2.76.122`** (тот же сервер, что workshopfilms.ru): адрес Vercel 76.76.21.21
  из РФ не открывается. DNS gabdra.pw, www, site, ai — A на 195.2.76.122 (Cloudflare, proxied=false, TTL 300).
  - служба `gabdra` (Next standalone, `/opt/gabdra`, порт 3001, MemoryMax 350M), env `/etc/gabdra.env` (600):
    значения из `.env.local` + `PORT/HOSTNAME`, `DATABASE_URL=file:/opt/gabdra-db/leads.db`,
    `TELEGRAM_API_BASE=https://api.telegram.org:8443` (туннель `tg-tunnel` через barboss — см. kukla/CLAUDE.md);
  - nginx `/etc/nginx/sites-available/gabdra`: :80 → https, www → gabdra.pw, TLS Let's Encrypt `gabdra.pw`
    (4 имени, до 21.01.2027), HSTS;
  - база на копии — **своя sqlite**, не Turso: заявки с RU-копии лежат в `/opt/gabdra-db/leads.db` и уходят в
    Telegram. Ключей Turso локально нет (на Vercel они sensitive, не читаются).
- **Запасной и бот — Vercel `ainur-landing`**: push в main собирает как раньше (`ainur-landing.vercel.app`).
  Вебхук бота — `https://ainur-landing.vercel.app/api/telegram/webhook`, секрет = Vercel `TELEGRAM_WEBHOOK_SECRET`
  = `FOGG_BOT_WEBHOOK_SECRET` в KEYS.env. Бот от переезда DNS не зависит.
- **Выкатка:** правка → push (Vercel сам) **и** `bash /d/ClaudeProject/tmp/deploy-gabdra-ru.sh` (RU-копия:
  сборка, архив, бэкап `/opt/gabdra-backup/`, рестарт, проверка 4 адресов).
- **Откат на Vercel:** в Cloudflare вернуть A-записи gabdra.pw, www, site, ai на `76.76.21.21` (TTL 300 —
  расходится за ~5 мин). Клиенты из РФ без VPN тогда снова не откроют сайт.

## Грабли

- **Rewrite поддоменов за nginx:** `new URL(route, request.url)` в standalone даёт https://localhost:3001 —
  Next проксирует сам себя по HTTPS (EPROTO, 500). Сейчас `request.nextUrl.clone()` + nginx отдаёт копии
  `X-Forwarded-Proto: http`.
- **libsql под Linux:** сборка на Windows не кладёт `@libsql/linux-x64-gnu` — скрипт выкатки докладывает его
  (`npm pack` версии из `node_modules/libsql`). Без него заявки на копии не сохраняются.
- **`output: "standalone"` только при `BUILD_STANDALONE=1`** — Vercel собирается как раньше.
- **Turbopack-дев падает на next/font/google** («queries have exactly one entry») — запускать конфигурацию
  `landing-webpack` из `D:\ClaudeProject\.claude\launch.json`.
