const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
  'https://yyoxpcsspmjvolteknsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM'
);

// Parse the CSV data
const csvData = `,Item,SKU,Qty
33,GUAP ARCH HOLO STICKERS,DRM-GUAP-ACHL-STK,552
32,FLOSSIN KEY CHAIN,DRM-GUAP-FLSN-KYC,126
29,Chicken Adobo Apron Red,GUAP-ADOBO-APR-RED,92
35,GUAP SQUISH ATMS,DRM-GUAP-SQSH-MIS,70
78,RIOT LOOT FACE MASK,DRM-GUAP-RTLT-WHT-FM,38
56,Identity Tee L,GUAP4019S,25
62,Lil Guap Plushy,GUAP-PLUSH-MISC,25
9,(FOR WHITE PEOPLE TO WEAR) TEE XL,GUAP4062S,20
53,Handsome Hoodie XL,GUAP-HANDSOME-HD-XL,15
90,Scam Boy Mesh Shorts L,GUAP4041S,14
37,GUAP TEE Large,DRM-GUAP-NAVY-SH-L,12
99,Scam Girl Crop Top Jacket L,GUAP-SGRL-CRP-SH-L,11
115,The Falcon & The Dogg: FLOSS PACK,GUAP4205S,11
31,ETHIKA FALCON BOXERS X-Large,DRM-GUAP-ETHK-FLC-BXR-BT-XL,11
27,Chicken Adobo Apron Black,GUAP-ADOBO-APR-BLK,10
40,GUAP TEE X-Large,DRM-GUAP-NAVY-SH-XL,10
58,Keychain,GUAP-KEY-CHN-MIS,10`;

// Full CSV would be processed here - this is truncated for the script
// In reality we'd read the full file

async function processInventory() {
  console.log('🔄 Processing merch manifest...\n');
  
  // Parse CSV
  const lines = csvData.trim().split('\n');
  const items = [];
  
  for (const line of lines.slice(1)) {
    const parts = line.split(',');
    if (parts.length >= 4) {
      items.push({
        id: parts[0],
        name: parts[1],
        sku: parts[2],
        qty: parseInt(parts[3]) || 0
      });
    }
  }
  
  // Sort by quantity
  items.sort((a, b) => b.qty - a.qty);
  
  // Split into shop vs giveaway
  const shopItems = items.filter(i => i.qty > 10);
  const giveawayItems = items.filter(i => i.qty <= 10);
  
  console.log('📦 SHOP ITEMS (Qty > 10):');
  console.log('=========================');
  let shopTotal = 0;
  for (const item of shopItems) {
    console.log(\`  \${item.qty}x \${item.name} (\${item.sku})\`);
    shopTotal += item.qty;
  }
  console.log(\`\n  TOTAL: \${shopItems.length} SKUs, \${shopTotal} units\n\`);
  
  console.log('🎁 GIVEAWAY ITEMS (Qty <= 10):');
  console.log('===============================');
  let giveawayTotal = 0;
  for (const item of giveawayItems.slice(0, 20)) { // Show first 20
    console.log(\`  \${item.qty}x \${item.name}\`);
    giveawayTotal += item.qty;
  }
  if (giveawayItems.length > 20) {
    console.log(\`  ... and \${giveawayItems.length - 20} more items\`);
  }
  console.log(\`\n  TOTAL: \${giveawayItems.length} SKUs, \${giveawayTotal} units\n\`);
  
  // Suggest pricing for shop items
  console.log('💰 SUGGESTED SHOP PRICING:');
  console.log('==========================');
  const pricing = {
    'STICKERS': 5.00,
    'KEY CHAIN': 12.00,
    'APRON': 45.00,
    'SQUISH': 15.00,
    'FACE MASK': 15.00,
    'TEE': 35.00,
    'HOODIE': 65.00,
    'PLUSHY': 40.00,
    'SHORTS': 40.00,
    'JACKET': 75.00,
    'FLOSS PACK': 10.00,
    'BOXERS': 25.00
  };
  
  for (const item of shopItems) {
    let price = 25.00; // default
    for (const [keyword, suggestedPrice] of Object.entries(pricing)) {
      if (item.name.toUpperCase().includes(keyword)) {
        price = suggestedPrice;
        break;
      }
    }
    console.log(\`  \${item.name}: \$\${price.toFixed(2)} (\${item.qty} in stock)\`);
  }
}

processInventory();
