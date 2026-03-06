// Quick script to add missing columns to recordings table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.LIFEOS_SUPABASE_URL;
const supabaseKey = process.env.LIFEOS_SUPABASE_SERVICE_KEY; // Need service key for DDL

const lifeos = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Adding file_path column to recordings...');
  
  // Try using RPC to execute DDL
  const { data, error } = await lifeos.rpc('exec_sql', {
    query: 'ALTER TABLE recordings ADD COLUMN IF NOT EXISTS file_path TEXT;'
  });
  
  if (error) {
    console.log('RPC failed:', error.message);
    console.log('Trying alternative via REST API...');
    
    // Alternative: Try INSERT with the column - Supabase will tell us if column doesn't exist
    const { error: insertError } = await lifeos.from('recordings').insert({
      title: '__migration_test__',
      file_path: '/test'
    });
    
    if (insertError && insertError.message.includes('file_path')) {
      console.log('Column missing. Manual migration required.');
      console.log('Run this SQL in Supabase dashboard:');
      console.log('ALTER TABLE recordings ADD COLUMN file_path TEXT;');
    } else {
      console.log('Insert result:', insertError);
    }
  } else {
    console.log('Migration successful!');
  }
  
  process.exit(0);
}

migrate();
