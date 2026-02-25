const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.BEEHIIV_API_KEY;
const PUB_ID = process.env.BEEHIIV_PUB_ID;

async function checkBeehiiv() {
  console.log('🐝 Checking Beehiiv Connection...');
  try {
    const response = await axios.get(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/posts`,
      { headers: { 'Authorization': `Bearer ${API_KEY}` } }
    );
    console.log('✅ Connection Success! Found', response.data.data.length, 'posts.');
  } catch (e) {
    console.error('❌ Beehiiv Check Failed:', e.response ? e.response.data : e.message);
  }
}

checkBeehiiv();
