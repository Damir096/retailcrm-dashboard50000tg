import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Обработчик вебхуков от RetailCRM.
 * 
 * Логика:
 * 1. Получение данных о заказе.
 * 2. Проверка суммы заказа (totalSumm > 50000).
 * 3. Отправка уведомления в Telegram, если условие выполнено.
 * 4. Всегда возвращаем 200 OK.
 */

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = {};
      formData.forEach((value, key) => {
        // RetailCRM часто присылает JSON-строку в одном из полей (например, 'order' или 'payload')
        // Либо просто полями. Попробуем распарсить если это выглядит как JSON.
        try {
          body[key] = typeof value === 'string' && (value.startsWith('{') || value.startsWith('[')) 
            ? JSON.parse(value) 
            : value;
        } catch {
          body[key] = value;
        }
      });
    } else {
      body = await request.json();
    }
    
    console.log('--- Webhook Received ---');
    console.log('Content-Type:', contentType);
    console.log('Body Keys:', Object.keys(body));

    // В вебхуках RetailCRM данные заказа часто в ключе 'order'
    // Если тело пришло как order=JSON_STRING, то берем body.order
    const order = body.order || body;

    if (!order || typeof order !== 'object') {
      console.log('Webhook received but no order object found in body.');
      return NextResponse.json({ success: true, message: 'No order data' });
    }

    const totalSumm = Number(order.totalSumm);
    const orderNumber = order.number || order.id;

    console.log(`Обработка вебхука для заказа #${orderNumber}, сумма: ${totalSumm}`);

    // Условие: сумма заказа > 50 000
    if (totalSumm > 50000) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      const crmUrl = process.env.RETAILCRM_URL?.replace(/\/$/, '');

      if (token && chatId) {
        const customerName = `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Гость';
        
        const message = [
          `🚀 <b>Крупный заказ в RetailCRM!</b>`,
          ``,
          `<b>Номер:</b> #${orderNumber}`,
          `<b>Клиент:</b> ${customerName}`,
          `<b>Сумма:</b> ${totalSumm.toLocaleString('ru-RU')} ₸`,
          `<b>Статус:</b> ${order.status || 'Новый'}`,
          ``,
          crmUrl ? `<a href="${crmUrl}/orders/${order.id}/edit">Открыть в RetailCRM</a>` : ''
        ].filter(line => line !== null).join('\n');

        try {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false
          });
          console.log(`Telegram notification sent for order #${orderNumber}`);
        } catch (tgError: any) {
          console.error('Error sending to Telegram:', tgError.response?.data || tgError.message);
        }
      } else {
        console.warn('Telegram token or chat_id is missing in .env.local');
      }
    }

    // Всегда возвращаем 200 OK для RetailCRM, чтобы избежать повторных запросов
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error.message);
    
    // Возвращаем 200 даже при ошибке парсинга/логики для CRM
    return NextResponse.json({ 
      success: true, 
      warning: 'Error occurred but reported as success to CRM',
      error: error.message 
    });
  }
}
