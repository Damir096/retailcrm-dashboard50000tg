import { createClient } from '@supabase/supabase-js';
import OrdersChart from '@/components/OrdersChart';

// Рендеринг страницы происходит на сервере
// Инициализируем клиент Supabase через переменные окружения
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function DashboardPage() {
  // 1. Получаем все заказы из базы данных Supabase
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  // Обработка ошибки подключения
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Ошибка подключения</h1>
          <p className="text-slate-600 mb-4">{error.message}</p>
          <p className="text-sm text-slate-400">
            Убедитесь, что в файле <code>.env.local</code> указаны корректные 
            <code>NEXT_PUBLIC_SUPABASE_URL</code> и <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  // 2. Агрегация данных для графика (суммируем доход по датам)
  const aggregation: Record<string, number> = {};
  orders?.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('ru-RU');
    aggregation[date] = (aggregation[date] || 0) + Number(order.total_sum);
  });

  // Преобразуем объект аггрегации в массив и сортируем по дате
  const chartData = Object.entries(aggregation)
    .map(([date, sum]) => ({ date, sum }))
    .sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('.').map(Number);
      const [dayB, monthB, yearB] = b.date.split('.').map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });

  // 3. Выбираем последние 10 заказов для таблицы
  const lastOrders = orders?.slice(0, 10) || [];

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Дашборд заказов</h1>
          <p className="text-lg text-slate-500 font-medium">Аналитика продаж из RetailCRM</p>
        </header>

        {/* Карточки со статистикой */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Всего заказов</p>
            <h3 className="text-4xl font-bold mt-2 text-slate-900">{orders?.length || 0}</h3>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Общая выручка</p>
            <h3 className="text-4xl font-bold mt-2 text-indigo-600">
              {orders?.reduce((sum, o) => sum + Number(o.total_sum), 0).toLocaleString()} <span className="text-2xl font-semibold">₸</span>
            </h3>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Средний чек</p>
            <h3 className="text-4xl font-bold mt-2 text-slate-900">
              {orders && orders.length > 0 
                ? Math.round(orders.reduce((sum, o) => sum + Number(o.total_sum), 0) / orders.length).toLocaleString() 
                : 0} <span className="text-2xl font-semibold text-slate-400">₸</span>
            </h3>
          </div>
        </div>

        {/* График выручки (Клиентский компонент) */}
        <div className="grid grid-cols-1 gap-8">
          <OrdersChart data={chartData} />
        </div>

        {/* Таблица последних заказов */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Последние 10 заказов</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <th className="px-8 py-5">Заказ</th>
                  <th className="px-8 py-5">Покупатель</th>
                  <th className="px-8 py-5">Статус</th>
                  <th className="px-8 py-5">Дата</th>
                  <th className="px-8 py-5 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastOrders.map((order) => (
                  <tr key={order.retailcrm_id} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-8 py-6">
                      <span className="font-bold text-slate-900">#{order.order_number}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-slate-700">{order.customer_name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold tracking-tight">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString('ru-RU')}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-base font-bold text-slate-900">{Number(order.total_sum).toLocaleString()} ₸</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
