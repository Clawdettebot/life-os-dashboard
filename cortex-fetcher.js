/**
 * Knowledge Knaight - Content Enhancer
 * Scans Cortex entries needing enhancement, logs them for AI processing
 * Tracks what's been processed to avoid re-fetching
 */

const sqlite3 = require('sqlite3');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const { execSync } = require('child_process');

const CORTEX_DB = '/root/.openclaw/workspace/dashboard/data/cortex.db';
const STATE_FILE = '/root/.openclaw/workspace/dashboard/.cortex-fetcher-state.json';

// Check if URL is Twitter/X
function isTwitterUrl(url) {
  return url.includes('twitter.com') || url.includes('x.com');
}

function getState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE));
    }
  } catch(e) {}
  return { lastFetched: {}, lastRun: null };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

// For Twitter/X URLs, use browser to screenshot
async function fetchTwitterContent(url) {
  console.log(`[Twitter] Taking screenshot of: ${url}`);
  
  // Use OpenClaw's browser tool to take screenshot
  const screenshotPath = `/tmp/twitter_${Date.now()}.png`;
  
  try {
    // Start browser with the Twitter URL
    execSync(`openclaw browser start --headless 2>/dev/null || true`);
    
    // Navigate to URL and take screenshot
    const { execSync } = require('child_process');
    execSync(`openclaw browser open "${url}"`, { stdio: 'pipe' });
    
    // Wait for page load
    await new Promise(r => setTimeout(r, 3000));
    
    execSync(`openclaw browser screenshot ${screenshotPath}`, { stdio: 'pipe' });
    
    // Return the screenshot path for analysis
    return { type: 'screenshot', path: screenshotPath, url };
  } catch (e) {
    console.log(`[Twitter] Screenshot failed: ${e.message}`);
    return { type: 'error', message: e.message, url };
  }
}

// Fetch content from URL
function fetchContent(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data.substring(0, 50000)));
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

async function processEntry(entry, db, state) {
  console.log(`\n📥 ${entry.title.substring(0, 50)}`);
  console.log(`   Section: ${entry.section}`);
  console.log(`   URL: ${entry.source_url}`);
  
  if (!entry.source_url) {
    console.log('   ⚠️ No URL');
    return;
  }

  // Check if already fetched successfully
  if (state.lastFetched && state.lastFetched[entry.id]) {
    const lastFetch = state.lastFetched[entry.id];
    if (lastFetch.success && entry.updated_at <= lastFetch.timestamp) {
      console.log('   ⏭️ Already processed, skipping');
      return;
    }
  }

  try {
    let content;
    
    // Special handling for Twitter/X URLs
    if (isTwitterUrl(entry.source_url)) {
      console.log(`   🐦 Detected Twitter URL, using screenshot method`);
      const twitterResult = await fetchTwitterContent(entry.source_url);
      if (twitterResult.type === 'screenshot') {
        content = `[Twitter Screenshot Saved]: ${twitterResult.path}`;
        console.log(`   ✅ Twitter screenshot saved: ${twitterResult.path}`);
      } else {
        content = `[Twitter Fetch Failed]: ${twitterResult.message}`;
      }
    } else {
      content = await fetchContent(entry.source_url);
    }
    
    if (!content || content.length < 50) {
      console.log('   ⚠️ Could not fetch');
      state.lastFetched[entry.id] = { success: false, timestamp: Date.now(), error: 'fetch_failed' };
      return;
    }
    
    console.log(`   📄 Got ${content.length} chars`);
    
    // Store raw content for AI to process later
    const metadata = { 
      ...JSON.parse(entry.metadata || '{}'), 
      rawContent: content.substring(0, 10000), 
      needsAISummary: true,
      contentFetchedAt: Date.now()
    };
    
    db.run(
      'UPDATE cortex_entries SET metadata = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(metadata), Date.now(), entry.id],
      (err) => {
        if (err) console.error('   ❌', err.message);
        else {
          console.log('   ✅ Stored for AI processing');
          state.lastFetched[entry.id] = { success: true, timestamp: Date.now() };
        }
      }
    );
  } catch (e) {
    console.log(`   ⚠️ ${e.message}`);
    state.lastFetched[entry.id] = { success: false, timestamp: Date.now(), error: e.message };
  }
}

async function main() {
  console.log('🧠 Cortex Content Fetcher');
  console.log('========================\n');

  const state = getState();
  state.lastRun = Date.now();
  
  const db = new sqlite3.Database(CORTEX_DB);
  
  // Get entries that need content fetching (never fetched or failed before)
  db.all(`
    SELECT * FROM cortex_entries 
    WHERE source_url IS NOT NULL 
    AND source_url != ''
    AND (
      metadata NOT LIKE '%contentFetchedAt%'
    )
    ORDER BY updated_at ASC
    LIMIT 5
  `, async (err, rows) => {
    if (err) { console.error(err); process.exit(1); }

    console.log(`Found ${rows.length} entries to fetch\n`);

    if (rows.length === 0) {
      console.log('⏭️ No entries need fetching!');
      saveState(state);
      db.close();
      process.exit(0);
    }

    for (const entry of rows) {
      await processEntry(entry, db, state);
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log('\n✅ Done!');
    saveState(state);
    db.close();
  });
}

main();
