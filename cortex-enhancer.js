/**
 * Knowledge Knaight - Content Enhancer
 * Fetches original URLs, AI summarizes, updates Cortex entries
 */

const axios = require('axios');
const sqlite3 = require('sqlite3');

const CORTEX_DB = '/root/.openclaw/workspace/dashboard/data/cortex.db';

const SYSTEM_PROMPT = `You are a content analyzer. Analyze the following content and extract structured information for the Cortex Second Brain.

For Howl's Kitchen (recipes):
- Extract full ingredient list with amounts
- Extract step-by-step instructions
- Note prep time, cook time, difficulty
- Note cuisine type

For Hitchhiker's Guide (how-tos):
- Extract materials needed
- Extract tools required  
- Extract step-by-step instructions
- Note difficulty, time estimate
- Note any warnings

For Emerald Tablets (history):
- Extract event date/era
- Extract location
- Extract key figures/people
- Extract significance
- Write a brief summary

For The All Spark (ideas):
- Extract the core idea
- Note inspiration source
- Note mood/aesthetic keywords
- Note category

Respond in JSON format with the appropriate fields for the section.`;

async function fetchContent(url) {
  try {
    // Use web_fetch to get content
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(`curl -s "${url}" | head -c 50000`, { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  } catch (e) {
    console.error('Fetch error:', e.message);
    return null;
  }
}

async function summarizeWithAI(content, section, title) {
  const prompt = `${SYSTEM_PROMPT}

Section: ${section}
Title: ${title}

Content:
${content.substring(0, 8000)}

Respond with JSON only.`;

  try {
    // Try OpenClaw's LLM or fallback
    const response = await axios.post('http://localhost:3000/api/agent', {
      message: prompt,
      system: 'You are a helpful assistant that outputs JSON only.'
    }, { timeout: 30000 });
    
    return response.data?.text || response.data?.content || null;
  } catch (e) {
    console.error('AI summarization failed:', e.message);
    return null;
  }
}

async function processEntry(entry) {
  console.log(`\n📥 Processing: ${entry.title}`);
  console.log(`   Section: ${entry.section}`);
  console.log(`   URL: ${entry.source_url}`);
  
  if (!entry.source_url) {
    console.log('   ⚠️ No source URL, skipping');
    return;
  }

  try {
    // Fetch original content
    const content = await fetchContent(entry.source_url);
    if (!content || content.length < 100) {
      console.log('   ⚠️ Could not fetch content');
      return;
    }

    console.log(`   📄 Fetched ${content.length} chars`);

    // AI summarize
    const summary = await summarizeWithAI(content, entry.section, entry.title);
    if (!summary) {
      console.log('   ⚠️ AI summarization failed');
      return;
    }

    // Parse JSON from response
    let parsed;
    try {
      // Try to extract JSON
      const jsonMatch = summary.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('   ⚠️ Could not parse AI response');
      return;
    }

    // Merge with existing data
    const db = new sqlite3.Database(CORTEX_DB);
    
    // Get existing content
    let existing = {};
    try { existing = JSON.parse(entry.content); } catch(e) {}
    
    // Merge AI summary with existing
    const updated = { ...existing, ...parsed };
    
    db.run(
      'UPDATE cortex_entries SET content = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(updated), Date.now(), entry.id],
      (err) => {
        if (err) console.error('   ❌ Update failed:', err.message);
        else console.log('   ✅ Updated!');
        db.close();
      }
    );

  } catch (e) {
    console.error('   ❌ Error:', e.message);
  }
}

async function main() {
  console.log('🧠 Knowledge Knaight - Content Enhancer');
  console.log('=====================================\n');

  const db = new sqlite3.Database(CORTEX_DB);
  
  // Get entries with URLs that need processing
  // Prioritize entries with less content or older entries
  db.all(`
    SELECT * FROM cortex_entries 
    WHERE source_url IS NOT NULL 
    AND source_url != ''
    ORDER BY 
      CASE 
        WHEN content LIKE '%See source%' THEN 0  -- Needs processing
        WHEN updated_at < ? THEN 1  -- Older entries
        ELSE 2
      END
    LIMIT 10
  `, [Date.now() - 86400000], async (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      process.exit(1);
    }

    console.log(`Found ${rows.length} entries to process\n`);

    for (const entry of rows) {
      await processEntry(entry);
      // Small delay between entries
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n✅ Done!');
    db.close();
    process.exit(0);
  });
}

main();
