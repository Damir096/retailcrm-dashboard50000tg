const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

/**
 * Скрипт для импорта заказов из JSON-файла в RetailCRM.
 * 
 * Требования:
 * - Чтение mock_orders.json
 * - POST /api/v5/orders/create
 * - Content-Type: application/x-www-form-urlencoded
 * - Сериализация заказа в JSON и передача в ключе 'order'
 * - apiKey и site передаются в теле запроса
 * - Задержка 200мс между запросами
 */

// Загрузка переменных окружения из .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const {
  RETAILCRM_URL,
  RETAILCRM_API_KEY,
  RETAILCRM_SITE
} = process.env;

// Проверка необходимых переменных
if (!RETAILCRM_URL || !RETAILCRM_API_KEY) {
  console.error('Ошибка: RETAILCRM_URL и RETAILCRM_API_KEY должны быть определены в .env.local');
  process.exit(1);
}

const API_V5_URL = `${RETAILCRM_URL.replace(/\/$/, '')}/api/v5/orders/create`;
const SITE_CODE = RETAILCRM_SITE || 'v5-test'; // По умолчанию v5-test, если не задано

// Функция задержки
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function importOrders() {
  const mockOrdersPath = path.join(__dirname, '../mock_orders.json');

  if (!fs.existsSync(mockOrdersPath)) {
    console.error(`Ошибка: Файл ${mockOrdersPath} не найден.`);
    return;
  }

  const rawData = fs.readFileSync(mockOrdersPath, 'utf8');
  let orders;

  try {
    orders = JSON.parse(rawData);
  } catch (e) {
    console.error('Ошибка парсинга JSON:', e.message);
    return;
  }

  console.log(`Начинаем импорт ${orders.length} заказов в RetailCRM...`);
  console.log(`URL API: ${API_V5_URL}`);
  console.log(`Магазин (site): ${SITE_CODE}`);

  for (let i = 0; i < orders.length; i++) {
    const rawOrder = orders[i];

    // Подготовка объекта заказа для RetailCRM
    // Мы пробуем маппить данные из mock_orders.json
    // Если каких-то полей нет в описании пользователя, но они есть в JSON - используем их.
    const order = {
      firstName: rawOrder.firstName,
      lastName: rawOrder.lastName,
      phone: rawOrder.phone,
      email: rawOrder.email,
      orderType: 'main',
      orderMethod: rawOrder.orderMethod || 'shopping-cart',
      status: rawOrder.status || 'new',
      items: rawOrder.items || [],
      delivery: rawOrder.delivery || {},
      customFields: rawOrder.customFields || {},
      createdAt: rawOrder.createdAt || new Date().toISOString().replace('T', ' ').split('.')[0]
    };

    // Если в JSON нет totalSumm (как в нашем случае), но пользователь его упомянул,
    // рассчитаем его как сумму товаров, если он не передан явно.
    if (!order.totalSumm && order.items.length > 0) {
      order.totalSumm = order.items.reduce((sum, item) => sum + (item.initialPrice * item.quantity), 0);
    } else if (rawOrder.totalSumm) {
      order.totalSumm = rawOrder.totalSumm;
    }

    try {
      // API RetailCRM принимает данные только в x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('apiKey', RETAILCRM_API_KEY);
      params.append('site', SITE_CODE);
      params.append('order', JSON.stringify(order));

      const response = await axios.post(API_V5_URL, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.success) {
        console.log(`[${i + 1}/${orders.length}] Заказ создан. ID: ${response.data.id}`);
      } else {
        console.error(`[${i + 1}/${orders.length}] Ошибка: ${response.data.errorMsg || 'Неизвестная ошибка'}`);
        if (response.data.errors) {
          console.error('Детали ошибок:', JSON.stringify(response.data.errors));
        }
      }
    } catch (error) {
      console.error(`[${i + 1}/${orders.length}] Критическая ошибка:`, error.response ? error.response.data : error.message);
    }

    // Задержка 200мс между запросами для обхода Rate Limit
    await sleep(200);
  }

  console.log('Импорт завершен.');
}

importOrders();
