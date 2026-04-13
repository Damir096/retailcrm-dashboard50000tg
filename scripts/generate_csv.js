const fs = require('fs');
const path = require('path');

const mockOrdersPath = path.join(__dirname, '../mock_orders.json');
const csvPath = path.join(__dirname, '../catalog_to_import.csv');

if (!fs.existsSync(mockOrdersPath)) {
  console.error('Ошибка: mock_orders.json не найден');
  process.exit(1);
}

const orders = JSON.parse(fs.readFileSync(mockOrdersPath, 'utf8'));
const productMap = new Map();

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

// Используем запятую как разделитель и кавычки для надежности
let csvContent = '"Name","ExternalID","Price","Article"\n';
Array.from(productMap.values()).forEach((p, index) => {
  const id = index + 1;
  csvContent += `"${p.name}","xml-prod-${id}","${p.price}","ART-${id}"\n`;
});

fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log(`✅ Файл обновлен: ${csvPath}`);
