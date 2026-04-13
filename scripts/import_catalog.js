const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

/**
 * Скрипт для импорта уникальных товаров из mock_orders.json в каталог RetailCRM.
 * Это позволит товарам отображаться в поиске при создании заказов.
 */

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { RETAILCRM_URL, RETAILCRM_API_KEY } = process.env;

if (!RETAILCRM_URL || !RETAILCRM_API_KEY) {
  console.error('Ошибка: RETAILCRM_URL и RETAILCRM_API_KEY должны быть определены в .env.local');
  process.exit(1);
}

const API_BATCH_LOAD_URL = `${RETAILCRM_URL.replace(/\/$/, '')}/api/v4/store/products/batch-load`;
const RETAILCRM_SITE = process.env.RETAILCRM_SITE || 'rvernon019';

async function importCatalog() {
  const mockOrdersPath = path.join(__dirname, '../mock_orders.json');
  
  if (!fs.existsSync(mockOrdersPath)) {
    console.error('Ошибка: mock_orders.json не найден');
    return;
  }

  let orders;
  try {
    orders = JSON.parse(fs.readFileSync(mockOrdersPath, 'utf8'));
  } catch (e) {
    console.error('Ошибка парсинга JSON:', e.message);
    return;
  }

  const productMap = new Map();

  // 1. Собираем уникальные товары из всех заказов
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (!productMap.has(item.productName)) {
        productMap.set(item.productName, {
          name: item.productName,
          price: item.initialPrice
        });
      }
    });
  });

  // 2. Формируем массив товаров для API (batch-load)
  const products = Array.from(productMap.values()).map((p, index) => {
    const id = index + 1;
    return {
      name: p.name,
      xmlId: `xml-prod-${id}`, // Уникальный идентификатор
      active: true,
      offers: [
        {
          name: p.name,
          xmlId: `xml-offer-${id}`,
          article: `ART-${id}`,
          initialPrice: p.price,
          active: true
        }
      ]
    };
  });

  console.log(`Найдено уникальных товаров: ${products.length}`);
  console.log('Начинаем загрузку в каталог RetailCRM...');

  console.log(`URL: ${API_BATCH_LOAD_URL}`);
  
  try {
    const params = new URLSearchParams();
    params.append('apiKey', RETAILCRM_API_KEY.trim());
    params.append('products', JSON.stringify(products));

    const response = await axios.post(API_BATCH_LOAD_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'axios/1.7.2'
      }
    });

    if (response.data.success) {
      console.log('✅ Товары успешно загружены в каталог!');
      console.log(`Загружено: ${products.length} шт.`);
    } else {
      console.error('❌ Ошибка загрузки:', response.data.errorMsg || 'Неизвестная ошибка');
      if (response.data.errors) {
        console.error('Детали:', JSON.stringify(response.data.errors, null, 2));
      }
    }
  } catch (error) {
    console.error('Критическая ошибка:', error.response ? error.response.data : error.message);
  }
}

importCatalog();
