/**
 * Knowledge Knaight - Content Enhancer
 * Fetches original URLs, AI summarizes, updates Cortex entries
 * NOW USING SUPABASE
 */

const axios = require('axios');
const cortexOps = require('./cortex-supabase-ops.js');

const SYSTEM_PROMPT = `You are a content analyzer. Analyze the following content and extract structured information for the Cortex Second Brain.

For Howl's Kitchen (recipes):
- Extract full ingredient list with amounts
- Extract step-by-step instructions
- Note prep time, cook time, difficulty
- Note cuisine type

For Hitchhiker's Guide (how-tos):
- Extract materials needed
- Extract step-by-step process
- Note difficulty level and time required

For All Spark (ideas):
- Extract the core concept
- Note related ideas or connections
- Suggest potential applications

Return JSON with: title, summary, content (formatted), category, tags[], metadata{}`;


async function enhanceContent(content, url) {
  const model = process.env.AI_MODEL || 'zai/glm-5';
  
  try {
    const response = await axios.post('https://api.zukijourney.com/v1/chat/completions', {
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this content from ${url}:\n\n${content}` }
      ],
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ZUKI_API_KEY || process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (e) {
    console.error('Enhancement error:', e.message);
    return null;
  }
}

async function runEnhancer() {
  console.log('🔍 Scanning for entries needing enhancement...');
  
  const entries = await cortexOps.getNeedingEnhancement();
  console.log(`Found ${entries.length} entries to enhance`);
  
  for (const entry of entries) {
    if (!entry.source_url) continue;
    
    console.log(`Enhancing: ${entry.title || entry.id}`);
    
    // Fetch content from URL
    try {
      const response = await axios.get(entry.source_url, { timeout: 10000 });
      const content = response.data;
      
      // Enhance with AI
      const enhanced = await enhanceContent(content, entry.source_url);
      
      if (enhanced) {
        await cortexOps.updateContent(entry.id, enhanced);
        console.log(`✅ Enhanced: ${entry.title}`);
      }
    } catch (e) {
      console.log(`⚠️ Failed to enhance ${entry.title}: ${e.message}`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('✨ Enhancement run complete');
}

// Run if called directly
if (require.main === module) {
  runEnhancer().catch(console.error);
}

module.exports = { runEnhancer, enhanceContent };
