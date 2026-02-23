#!/usr/bin/env node
/**
 * Process merch inventory CSV from manifest
 * Separates items into SHOP vs GIVEAWAY inventory
 * 
 * Usage: node scripts/process_merch_csv.js path/to/inventory.csv
 */

require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://yyoxpcsspmjvolteknsn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function processCSV(filePath) {
  console.log('📊 Processing merch inventory CSV...\n');
  
  const csv = fs.readFileSync(filePath, 'utf8');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  
  const shopItems = [];
  const giveawayItems = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV line (handle quoted values)
    const values = line.match(/("[^"]*"|[^,]*)/g).map(v => v.replace(/^"|"$/g, '').trim());
    const row = {};
    headers.forEach((h, idx) => row[h] = values[idx]);
    
    const item = {
      name: row.name,
      description: row.description,
      category: row.category,
      size: row.size,
      quantity: parseInt(row.quantity) || 0,
      condition: row.condition,
      notes: row.notes
    };
    
    if (row.sell_or_giveaway?.toUpperCase() === 'SELL') {
      shopItems.push(item);
    } else {
      giveawayItems.push(item);
    }
  }
  
  console.log(`Found ${shopItems.length} items for SHOP`);
  console.log(`Found ${giveawayItems.length} items for GIVEAWAY\n`);
  
  // Update shop items
  for (const item of shopItems) {
    console.log(`🛒 SHOP: ${item.name} (${item.size}) - Qty: ${item.quantity}`);
    
    const { data: existing } = await supabase
      .from('shop_item')
      .select('id')
      .eq('name', item.name)
      .single();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('shop_item')
        .update({ 
          inventory_count: item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) console.error(`  ❌ Error updating: ${error.message}`);
      else console.log(`  ✅ Updated inventory: ${item.quantity}`);
    } else {
      console.log(`  ⚠️ Item not in shop yet: ${item.name}`);
    }
  }
  
  console.log('');
  
  // Add to giveaway inventory
  for (const item of giveawayItems) {
    console.log(`🎁 GIVEAWAY: ${item.name} (${item.size}) - Qty: ${item.quantity}`);
    
    const { error } = await supabase
      .from('giveaway_inventory')
      .insert({
        name: item.name,
        description: item.description,
        category: 'stream_reward', // Default category
        size: item.size === 'N/A' ? null : item.size,
        quantity: item.quantity,
        condition: item.condition,
        notes: item.notes,
        status: 'available'
      });
    
    if (error) console.error(`  ❌ Error adding: ${error.message}`);
    else console.log(`  ✅ Added to giveaway inventory`);
  }
  
  console.log('\n✅ CSV processing complete!');
  console.log(`\nSummary:`);
  console.log(`- ${shopItems.length} items ready for Stripe shop`);
  console.log(`- ${giveawayItems.length} items available for giveaways`);
}

// Run if called directly
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/process_merch_csv.js <path/to/inventory.csv>');
    process.exit(1);
  }
  
  processCSV(filePath).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { processCSV };
