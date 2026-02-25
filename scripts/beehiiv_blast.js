const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.BEEHIIV_API_KEY;
const PUB_ID = process.env.BEEHIIV_PUB_ID;
const DOWNLOAD_URL = process.env.SONG_DOWNLOAD_URL;

// Content from your social post, formatted for email
const HTML_CONTENT = `
  <h1>A Few Things (feat. Jai'len Josey) - OUT NOW</h1>
  <p><strong>HAPPY to present the fourth record from HANDSOME.</strong></p>
  <p>The song is called “A Few Things” featuring <strong>Jai'len Josey</strong>, a true powerhouse in every sense.</p>
  <p>If you really listen to that hook, it’s simple. It’s about celebrating your lover. Speaking life into them. Choosing tenderness on purpose. We need to get back to loving each other out loud.</p>
  <p>So it felt right to release this during Black History Month, especially with everything happening around us.</p>
  <p>Yeah, it’s strange dropping music in f*cked up times. But maybe that’s when it matters most. In the middle of noise, we remind ourselves who we are. How brilliant we are. How worthy we are of love and joy and softness.</p>
  
  <br>
  <div style="text-align: center;">
    <a href="${DOWNLOAD_URL}" style="background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">LISTEN / DOWNLOAD NOW</a>
  </div>
  <br>
  
  <p>Produced by @jerome.farah</p>
  <p>Visuals shot by @36neex (Full visualizer drops Friday!)</p>
  <p>Special thanks to @jailenjosey and her team for making this happen.</p>
  <p>- Handsome</p>
`;

async function createPost() {
  console.log('🐝 Creating Beehiiv Post...');
  
  try {
    const response = await axios.post(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/posts`,
      {
        title: "A Few Things - OUT NOW everywhere 🎵",
        subtitle: "The new track featuring Jai'len Josey is here.",
        content: {
            "body": HTML_CONTENT,
            "html": HTML_CONTENT
        },
        status: "draft" // "draft" to test, "confirmed" to schedule/send immediately if triggered
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Post Created! ID:', response.data.data.id);
    console.log('👉 Go to Beehiiv Dashboard to hit SEND immediately, or I can try to schedule it via API if you prefer.');
    
  } catch (e) {
    console.error('❌ Beehiiv Error:', e.response ? e.response.data : e.message);
  }
}

createPost();
