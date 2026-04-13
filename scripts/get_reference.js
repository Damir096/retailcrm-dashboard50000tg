const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { RETAILCRM_URL, RETAILCRM_API_KEY } = process.env;

async function getOrderTypes() {
  const url = `${RETAILCRM_URL.replace(/\/$/, '')}/api/v5/reference/order-types`;
  try {
    const response = await axios.get(url, { params: { apiKey: RETAILCRM_API_KEY } });
    console.log('Available Order Types:');
    console.log(JSON.stringify(response.data.orderTypes, null, 2));
  } catch (error) {
    console.error('Error fetching order types:', error.message);
  }
}

getOrderTypes();
