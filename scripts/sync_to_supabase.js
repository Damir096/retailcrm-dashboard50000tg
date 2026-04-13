const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

/**
 * ETL Скрипт: Синхронизация заказов из RetailCRM в Supabase.
 * 
 * Шаги:
 * 1. Получение заказов из RetailCRM (Extract)
 * 2. Трансформация данных (Transform)
 * 3. Апсерт в Supabase (Load)
 */

// Загрузка конфигурации
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const {
  RETAILCRM_URL,
  RETAILCRM_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

// Проверка окружения
if (!RETAILCRM_URL || !RETAILCRM_API_KEY || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Ошибка: Не все переменные окружения заданы в .env.local');
  process.exit(1);
}

// Инициализация клиента Supabase с сервисным ключом (полный доступ)
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncOrders() {
  const crmApiUrl = `${RETAILCRM_URL.replace(/\/$/, '')}/api/v5/orders`;

  try {
    console.log('Запрос заказов из RetailCRM...');
    
    // 1. Extract: Получаем заказы из CRM
    const response = await axios.get(crmApiUrl, {
      params: {
        apiKey: RETAILCRM_API_KEY,
        limit: 100 // Можно настроить пагинацию, если заказов много
      }
    });

    if (!response.data.success) {
      throw new Error(`Ошибка CRM: ${response.data.errorMsg || 'Неизвестная ошибка'}`);
    }

    const crmOrders = response.data.orders || [];
    console.log(`Получено ${crmOrders.length} заказов из CRM.`);

    if (crmOrders.length === 0) {
      console.log('Нет заказов для синхронизации.');
      return;
    }

    // 2. Transform: Маппинг данных под схему Supabase
    const ordersToSync = crmOrders.map(order => {
      // Собираем полное имя
      const customerName = [order.firstName, order.lastName]
        .filter(Boolean)
        .join(' ') || 'Не указано';

      return {
        retailcrm_id: order.id,
        order_number: order.number,
        customer_name: customerName,
        total_sum: parseFloat(order.totalSumm) || 0,
        status: order.status,
        created_at: order.createdAt
      };
    });

    // 3. Load: Выполняем Upsert в Supabase
    console.log('Синхронизация с Supabase (upsert)...');
    
    const { data, error } = await supabase
      .from('orders')
      .upsert(ordersToSync, { 
        onConflict: 'retailcrm_id',
        ignoreDuplicates: false // Обновляем существующие записи
      })
      .select();

    if (error) {
      throw error;
    }

    console.log(`Успешно синхронизировано записей: ${data?.length || 0}`);
    console.log('ETL процесс завершен успешно.');

  } catch (error) {
    console.error('Критическая ошибка при синхронизации:');
    if (error.response) {
      console.error('API Error Content:', JSON.stringify(error.response.data));
    } else {
      console.error(error.message);
    }
  }
}

// Запуск процесса
syncOrders();
