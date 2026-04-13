This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Настройка базы данных Supabase

Для создания необходимых таблиц в базе данных Supabase:

1. Откройте ваш проект в [Supabase Dashboard](https://supabase.com/dashboard).
2. Перейдите в раздел **SQL Editor** в левом боковом меню.
3. Нажмите **New query**, чтобы создать новый запрос.
4. Скопируйте содержимое файла `supabase/schema.sql` из этого репозитория и вставьте его в редактор.
5. Нажмите кнопку **Run**, чтобы выполнить скрипт.

Этот скрипт создаст таблицу `orders` и отключит Row Level Security (RLS) для упрощения разработки.

## Настройка уведомлений в Telegram (Webhooks)

Проект поддерживает автоматические уведомления в Telegram о заказах на сумму более 50 000 ₸. Для этого:

1. В **RetailCRM** перейдите в **Настройки** -> **Коммуникации** -> **Вебхуки**.
2. Нажмите кнопку **Добавить**.
3. Введите следующие данные:
   - **URL адреса**: `https://<ВАШ_ДОМЕН>/api/webhook/retailcrm`
   - **Событие**: `Новый заказ` (order.create)
   - **Активность**: Да (галочка)
4. Сохраните изменения.

Теперь при создании каждого нового заказа CRM будет отправлять запрос в ваше приложение, которое проверит сумму и перешлет уведомление в Telegram.
