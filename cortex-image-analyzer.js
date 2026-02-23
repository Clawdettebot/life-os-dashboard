/**
 * Knowledge Knaight - Image OCR & Analyzer
 * Uses Tesseract to extract text from images
 * For screenshots and text-heavy images - extracts data to cortex cards
 */

const sqlite3 = require('sqlite3');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CORTEX_DB = '/root/.openclaw/workspace/dashboard/data/cortex.db';
const TEMP_DIR = '/tmp/cortex-ocr';

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const ext = url.includes('.png') ? 'png' : 'jpg';
    const filename = Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;
    const filepath = path.join(TEMP_DIR, filename);
    
    const file = fs.createWriteStream(filepath);
    const req = client.request(parsedUrl, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function runOCR(imagePath) {
  return new Promise((resolve, reject) => {
    const cmd = `tesseract "${imagePath}" - --preserve-interword-spaces`;
    exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) { reject(err); return; }
      resolve(stdout.trim());
    });
  });
}

function getTextDensity(text) {
  // Calculate text density - how much text is in the image
  const chars = text.length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const lines = text.split('\n').filter(l => l.trim().length > 0).length;
  
  return { chars, words, lines };
}

function shouldSavePermanently(textData) {
  // If it's a lot of text, it's valuable - save permanently
  // If it's just a quick note/screenshot, maybe just store briefly
  return textData.words > 50 || textData.lines > 10;
}

async function extractText(imagePath) {
  try {
    const text = await runOCR(imagePath);
    return text;
  } catch (e) {
    console.log('   Tesseract failed:', e.message);
    return null;
  }
}

function cleanup(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch(e) {}
}

async function processImageEntry(entry) {
  console.log(`\n📸 Processing: ${entry.title}`);
  
  try {
    let parsed = {};
    try { parsed = JSON.parse(entry.content); } catch(e) {}
    
    const imageUrl = parsed.imageUrl || entry.source_url;
    if (!imageUrl) {
      console.log('   ⚠️ No image URL found');
      return;
    }
    
    console.log(`   🔗 Downloading...`);
    const imagePath = await downloadImage(imageUrl);
    console.log(`   📥 Saved: ${path.basename(imagePath)}`);
    
    console.log(`   🔍 Running OCR...`);
    const ocrText = await extractText(imagePath);
    cleanup(imagePath);
    
    if (!ocrText || ocrText.length < 10) {
      console.log('   ⚠️ No text extracted');
      
      const db = new sqlite3.Database(CORTEX_DB);
      const updated = {
        ...parsed,
        status: 'ocr_attempted',
        ocr_text: null,
        ocr_note: 'No readable text found',
        save_permanently: false
      };
      
      db.run(
        'UPDATE cortex_entries SET content = ?, metadata = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(updated), JSON.stringify({ ...JSON.parse(entry.metadata || '{}'), ocr_attempted: true, ocr_successful: false }), Date.now(), entry.id],
        (err) => {
          if (err) console.error('   ❌', err.message);
          else console.log('   ✅ Marked as attempted');
          db.close();
        }
      );
      return;
    }
    
    const textData = getTextDensity(ocrText);
    console.log(`   📝 Extracted: ${textData.chars} chars, ${textData.words} words, ${textData.lines} lines`);
    
    const preview = ocrText.substring(0, 300).replace(/\n/g, ' ');
    console.log(`   Preview: "${preview}..."`);
    
    // Determine if we should save permanently
    const savePermanently = shouldSavePermanently(textData);
    console.log(`   💾 Save permanently: ${savePermanently ? 'YES (high value)' : 'NO (quick note)'}`);
    
    const db = new sqlite3.Database(CORTEX_DB);
    const updated = {
      ...parsed,
      status: 'ocr_complete',
      ocr_text: ocrText,
      text_density: textData,
      save_permanently: savePermanently,
      // For AllSpark - mark if this is a quick note vs valuable content
      content_type: savePermanently ? 'ocr_document' : 'ocr_note',
      section: parsed.section || entry.section || 'all_spark'
    };
    
    db.run(
      'UPDATE cortex_entries SET content = ?, metadata = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(updated), JSON.stringify({ ...JSON.parse(entry.metadata || '{}'), ocr_attempted: true, ocr_successful: true, text_length: ocrText.length, save_permanently }), Date.now(), entry.id],
      (err) => {
        if (err) console.error('   ❌', err.message);
        else console.log(savePermanently ? '   ✅ Saved to Cortex permanently!' : '   ✅ Saved as temporary note');
        db.close();
      }
    );
    
  } catch (e) {
    console.log(`   ⚠️ Error: ${e.message}`);
  }
}

async function main() {
  console.log('🧠 Cortex Image OCR & Analyzer');
  console.log('============================\n');

  const db = new sqlite3.Database(CORTEX_DB);
  
  db.all(`
    SELECT * FROM cortex_entries 
    WHERE content_type = 'image'
    AND (
      metadata NOT LIKE '%ocr_attempted%' 
      OR metadata NOT LIKE '%ocr_successful%'
    )
    ORDER BY created_at DESC
    LIMIT 20
  `, async (err, rows) => {
    if (err) { console.error(err); process.exit(1); }

    console.log(`Found ${rows.length} images needing OCR\n`);

    if (rows.length === 0) {
      console.log('✅ No images need OCR!');
      db.close();
      process.exit(0);
    }

    for (const entry of rows) {
      await processImageEntry(entry);
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n✅ All done!');
    db.close();
  });
}

main();
