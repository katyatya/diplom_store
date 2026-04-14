# Fashion Store

Монолитный проект интернет-магазина одежды с конструктором образов:
- `frontend`: витрина и интерфейсы на Next.js
- `backend`: API и доменная логика на NestJS
- `shared`: общие типы между frontend/backend

## Архитектура домена

Модули `backend/src/modules`:
- `auth` — авторизация и роли (`guest/user/admin`)
- `catalog` — товары, категории, карточки
- `cart` — корзина
- `checkout` — оформление заказа, оплата, доставка
- `outfits` — пользовательские образы (CRUD + добавление в корзину)
- `stylist-looks` — готовые образы от стилистов (readonly для пользователя)
- `wishlist` — избранное
- `admin` — админ-функции для контента и модерации

## Frontend роуты

Базовые страницы находятся в `frontend/src/app`:
- `/catalog`
- `/constructor`
- `/outfits`
- `/wishlist`
- `/admin`

## Быстрый старт

```bash
cd fashion-store
npm install
cp backend/.env.example backend/.env
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run prisma:seed -w backend
npm run dev
```

Приложения стартуют на:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:4000`

Проверка backend:
- `GET http://localhost:4000/health`

## Первые endpoint'ы

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)

Catalog:
- `GET /catalog/products`
- `GET /catalog/products/:id`
- `POST /catalog/products`

Cart (Bearer token):
- `GET /cart`
- `POST /cart/items`

Outfits (Bearer token):
- `GET /outfits`
- `POST /outfits`
- `PATCH /outfits/:id`
- `DELETE /outfits/:id`

Stylist looks:
- `GET /stylist-looks`

## Что добавить следующим шагом

1. Prisma schema и миграции (`Product`, `Cart`, `Order`, `Outfit`, `Wishlist`).
2. JWT auth + refresh tokens и guards для ролей.
3. Интеграция платежей и доставки (webhook-обработчики в `checkout`).
4. Админ-панель (например, отдельный route group в Next.js).
