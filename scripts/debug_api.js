const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { RETAILCRM_URL, RETAILCRM_API_KEY } = process.env;

async function debug() {
  const baseUrl = RETAILCRM_URL.trim().replace(/\/$/, '');
  console.log('Using URL:', baseUrl);
  console.log('Using API Key:', RETAILCRM_API_KEY.trim());

  try {
    const response = await axios.get(`${baseUrl}/api/v5/orders`, {
      params: { apiKey: RETAILCRM_API_KEY.trim(), limit: 1 }
    });
    console.log('SUCCESS: API is reachable.');
    console.log('Orders found:', response.data.orders?.length);
  } catch (error) {
    if (error.response) {
      console.log('ERROR STATUS:', error.response.status);
      console.log('ERROR DATA:', JSON.stringify(error.response.data));
    } else {
      console.log('ERROR:', error.message);
    }
  }

  // Check credentials
  try {
    const response = await axios.get(`${baseUrl}/api/v5/credentials`, {
      params: { apiKey: RETAILCRM_API_KEY.trim() }
    });
    console.log('CREDENTIALS SCOPES:', JSON.stringify(response.data.scopes));
  } catch (error) {
    console.log('CREDENTIALS ERROR:', error.response ? error.response.status : error.message);
  }
}

debug();
