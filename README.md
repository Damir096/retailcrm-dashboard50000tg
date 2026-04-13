# Мой проект: Дашборд аналитики для RetailCRM с Telegram-уведомлениями

Этот проект я создал, используя ИИ-ассистента **Antigravity** на базе модели **Gemini 3 Flash**. ИПроект работает в продакшне на Vercel.

---

## Что умеет эта система

- **Дашборд:** Визуализация выручки и количества заказов по дням через графики (Recharts).
- **Синхронизация данных:** Автоматический перенос заказов из RetailCRM в базу данных Supabase.
- **Telegram-уведомления:** Бот мгновенно пишет мне, когда поступает заказ на сумму > 50 000 ₸.
- **Каталог товаров:** Генерация CSV-файла для корректного импорта товаров в CRM.

---

## Мои промпты - как я строил проект

Вот реальные запросы, которые я давал **Antigravity (Gemini 3 Flash)** в процессе работы:

Промпт 1: Инициализация проекта и создание БД в Supabase
«Ты выступаешь в роли Senior Full-Stack разработчика. Инициализируй проект Next.js командой npx create-next-app@latest dashboard-app --typescript --tailwind --eslint --app --use-npm. Перейди в папку проекта и установи зависимости: @supabase/supabase-js, axios, recharts.
Создай файл .env.local и добавь туда переменные (оставь их пустыми комментариями): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RETAILCRM_URL, RETAILCRM_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
Создай файл supabase/schema.sql с DDL скриптом для таблицы orders (id uuid PK, retailcrm_id integer UNIQUE, order_number text, customer_name text, total_sum numeric, status text, created_at timestamp tz).
В конце скрипта обязательно добавь команду ALTER TABLE orders DISABLE ROW LEVEL SECURITY;. Напиши в README.md инструкцию, как мне выполнить этот скрипт в SQL Editor Supabase.»

Действие после промпта: Заполните файл .env.local своими ключами из Шага 1. Скопируйте SQL-код из сгенерированного файла и выполните его в SQL Editor панели Supabase.

Промпт 2: Загрузка заказов в RetailCRM (Шаг 2 из задания)
«Создай скрипт scripts/import_to_retailcrm.js. Он должен читать mock_orders.json (в котором есть firstName, lastName, phone, totalSumm, createdAt) и загружать их в RetailCRM по эндпоинту POST /api/v5/orders/create.
КРИТИЧЕСКИ ВАЖНО: API RetailCRM принимает данные только с заголовком Content-Type: application/x-www-form-urlencoded. Вложенные данные заказа нужно сериализовать в JSON-строку и передать в ключе order (используй URLSearchParams). Также передай apiKey и site (укажи код магазина). Добавь небольшую задержку между запросами (sleep 200ms), чтобы не получить Rate Limit. Используй dotenv для ключей.» 

Действие после промпта: Положите файл mock_orders.json в корень и запустите скрипт node scripts/import_to_retailcrm.js.

Промпт 3: Синхронизация RetailCRM → Supabase (Шаг 3 из задания)
«Напиши скрипт ETL scripts/sync_to_supabase.js. Он должен забирать заказы из RetailCRM (GET /api/v5/orders с параметром apiKey) и сохранять их в таблицу orders Supabase.
Для Supabase используй SUPABASE_SERVICE_ROLE_KEY, так как скрипту нужны полные права на запись. Трансформируй ответ CRM: склей firstName и lastName в customer_name, приведи типы.
КРИТИЧЕСКИ ВАЖНО: Для вставки используй операцию upsert с параметром { onConflict: 'retailcrm_id' }, чтобы скрипт был идемпотентным и не создавал дубликаты при повторном запуске.»

Действие после промпта: Запустите скрипт node scripts/sync_to_supabase.js и убедитесь, что данные появились в Supabase.

Промпт 4: Создание Дашборда (Шаг 4 из задания)
«Разработай веб-страницу дашборда на Next.js (App Router).
Перепиши app/page.tsx (это должен быть Server Component). Инициализируй Supabase клиент через анонимный ключ. Сделай выборку всех заказов из таблицы orders и сагрегируй выручку (total_sum) и количество заказов по датам.
Создай components/OrdersChart.tsx (Client Component, используй "use client"). Он должен принимать сагрегированные данные и рисовать линейный график через recharts (по оси X — дата, по оси Y — сумма).
Выведи график на главной странице app/page.tsx, а под ним сделай HTML-таблицу с последними 10 заказами. Используй Tailwind CSS для красивого минималистичного дизайна.»

Промпт 5: Telegram-бот и Webhook (Шаг 5 из задания)
«Создай бессерверную функцию app/api/webhook/retailcrm/route.ts для обработки POST-вебхуков от RetailCRM.
Логика:

Распарси входящие данные.

Проверь сумму созданного заказа (totalSumm > 50000).

Если условие выполняется, отправь HTTP POST запрос к Telegram API (https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage) с параметрами chat_id и text (красиво отформатированное сообщение о крупном заказе).

Функция ОБЯЗАТЕЛЬНА всегда возвращать 200 OK в ответ RetailCRM, даже если заказ меньше 50000, чтобы CRM не слала повторные запросы.
Обнови README.md: напиши инструкцию, как настроить этот вебхук в панели RetailCRM.»

### Этап 1 — Разворачивание проекта
> **«https://retailcrm-dashboard50000tg.vercel.app/ — версель уже есть»**

Я подключил уже готовый Vercel-проект и попросил ИИ настроить под него всю архитектуру.

### Этап 2 — Первая проблема с вебхуком
> **«добавлено всё, но нет уведомления»**

Уведомления в Telegram не приходили. Вместе с ИИ мы начали искать причину.

### Этап 3 — Работа с Git
> **«как в git через терминал запушить»**

ИИ объяснил мне команды `git add`, `git commit`, `git push` и помог отправить изменения в репозиторий, чтобы Vercel пересобрал проект.

### Этап 4 — Ошибка 405 (неверный метод запроса)
> **«Apr 13 12:52:28.00 POST 405 — INVALID_REQUEST_METHOD»**

RetailCRM слал POST на главную страницу `/`, а не на API-роут. Мы поменяли URL вебхука.

### Этап 5 — Правильный URL вебхука
> **«https://retailcrm-dashboard50000tg.vercel.app/api/webhook/retailcrm — теперь так»**

После правки URL запросы стали доходить до нужного обработчика.

### Этап 6 — Проблема с ценами товаров
> **«товары там по 0 по цене»**

Товары в CRM отображались с нулевой ценой. ИИ помог разобраться: API для загрузки каталога был недоступен на моём тарифе (404). Мы перешли на ручной CSV-импорт.

### Этап 7 — Уведомления всё ещё не приходили
> **«уведомления нет»**
> **«в чём может быть проблема»**
> **«Последний был в Apr 13 13:37:20.81 — GET 200 — без уведомления в тг»**

Добавили расширенное логирование в вебхук. Выяснилось: RetailCRM через «Триггеры» отправляла пустое тело запроса — данные заказа вообще не передавались. Решение: вручную настроить тело запроса в триггере, указав JSON со всеми нужными полями заказа.

---

## Где застрял и как решил

| Проблема | Причина | Решение |
|---|---|---|
| 405 ошибка | Неверный URL вебхука | Сменил URL на `/api/webhook/retailcrm` |
| Товары по 0 | API `/store/products` недоступен на тарифе | Перешёл на CSV-импорт |
| Пустое тело запроса | Триггер не передавал данные | Настроил JSON вручную в теле триггера |
| Нет уведомлений | RetailCRM слала urlencoded вместо JSON | Написали универсальный парсер в вебхуке |

---

## Технологический стек

- **Frontend:** Next.js 14, Tailwind CSS, Recharts
- **Backend:** Next.js API Routes (Serverless Functions)
- **База данных:** Supabase (PostgreSQL)
- **Хостинг:** Vercel
- **Интеграции:** RetailCRM API v5, Telegram Bot API
- **ИИ-ассистент:** Antigravity (Gemini 3 Flash) — использовался на всех этапах

---

## Запуск локально

1. Создайте файл `.env.local` и заполните переменные:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
RETAILCRM_URL=...
RETAILCRM_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите проект:
```bash
npm run dev
```

---

## Настройка уведомлений в Telegram

1. В RetailCRM перейдите в **Коммуникации → Триггеры**.
2. Добавьте новый триггер на событие **«Создание заказа»**.
3. Действие: **«Выполнить HTTP-запрос»**, метод `POST`.
4. URL: `https://retailcrm-dashboard50000tg.vercel.app/api/webhook/retailcrm`
5. В поле тела запроса вставьте JSON с полями заказа (id, number, totalSumm и др.).
6. После сохранения заказа на сумму > 50 000 ₸ в Telegram придёт уведомление.

---

*Создано в паре с Antigravity (Gemini 3 Flash). Никакого кода я не писал вручную.*
