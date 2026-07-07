# Deploy

## Vercel

1. Залейте проект в GitHub.
2. Импортируйте репозиторий в Vercel.
3. В `Project Settings -> Environment Variables` добавьте:
   - `DATABASE_URL`
   - `LEAD_EMAIL_TO`
   - `LEAD_EMAIL_FROM`
   - `RESEND_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `TELEGRAM_WEBHOOK_URL`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Для `TELEGRAM_WEBHOOK_URL` укажите прод-домен сайта, например `https://your-domain.com`.
5. Задеплойте проект.
6. После первого успешного деплоя из корня проекта выполните:

```powershell
npm.cmd run bot:webhook:set
```

7. Для проверки webhook выполните:

```powershell
npm.cmd run bot:webhook:info
```

## Что делает webhook

- Telegram отправляет входящие сообщения на `/api/telegram/webhook`.
- Роут проверяет `TELEGRAM_WEBHOOK_SECRET`, если он задан.
- Ассистент отвечает по базе знаний или собирает первичную заявку вопросами.

## Если деплой не на Vercel

1. Нужен публичный HTTPS-домен.
2. На сервере должны быть установлены Node.js 20+ и переменные окружения из списка выше.
3. Команды запуска:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run start
```

4. После запуска сервиса выполните:

```powershell
npm.cmd run bot:webhook:set
```

## Поддомен site.gabdra.pw (лендинг для малого бизнеса)

Код готов: `middleware.ts` переписывает корень `site.gabdra.pw` на маршрут `/site`.
Остаются ручные шаги, которые нельзя сделать из репозитория:

1. В Vercel: `Project Settings -> Domains` добавьте домен `site.gabdra.pw`
   (и при желании `www.site.gabdra.pw`) к тому же проекту, что и `gabdra.pw`.
2. В DNS добавьте **A-запись** `site` → `76.76.21.21` (proxied OFF).
   ⚠️ НЕ `CNAME` на `cname.vercel-dns.com`: он резолвится в ротирующийся anycast
   Vercel (подсети `66.33.60.x` и др.), часть которого заблокирована в РФ —
   сайт «не открывается без VPN». `76.76.21.21` — стабильный Vercel-IP, доступный
   из РФ (тот же, что у apex `gabdra.pw`).
3. Дождитесь выпуска SSL и проверьте, что `https://site.gabdra.pw` открывает
   лендинг из `/site` (без VPN, `remote_ip=76.76.21.21`), а корневой
   `https://gabdra.pw` работает как прежде.

Почта: на странице указан адрес `ainur@gabdra.pw` — ящик заведён на Beget,
входящие дублируются в Telegram через почтовый мост Hermes (см. `_hermes/README.md`).
