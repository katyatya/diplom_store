# Fashion Store

Интернет-магазин одежды с конструктором образов. Монорепозиторий: Next.js (витрина) + NestJS (API).

Node.js **22.x** — см. `.node-version`.

## Запуск

```bash
npm install
cp backend/.env.example backend/.env   # заполнить DATABASE_URL и секреты
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run prisma:seed -w backend
npm run dev
```

- Витрина: http://localhost:3001  
- API: http://localhost:4000  
- Health: http://localhost:4000/health  

После seed:

| Роль  | Email                      | Пароль    |
|-------|----------------------------|-----------|
| Admin | admin@fashionstore.local   | Admin123! |
| User  | user@fashionstore.local    | User123!  |

Админка — `/admin` (нужен вход под admin).

## Структура

```
frontend/   Next.js, страницы в src/app
backend/    NestJS, модули в src/modules
```

Основные модули API: `auth`, `catalog`, `cart`, `checkout`, `outfits`, `stylist-looks`, `admin`.

PNG для конструктора образов кладут в `frontend/public/outfits/`, URL в поле `outfitImageUrl` товара.

## Полезные команды

```bash
npm run dev:backend          # только API
npm run dev:frontend         # только витрина
npm run dev:frontend:clean   # витрина с очисткой .next
npm run build
npm run lint
```

## Если в dev падает `Cannot find module './599.js'`

Сломался кэш Next.js:

```bash
pkill -f "next dev -p 3001" || true
rm -rf frontend/.next
npm run dev:frontend:clean
```

Не держите два `next dev` на одном порту.
