const { lifeos } = require('./lifeos-supabase.js');
async function test() {
  const { data, error } = await lifeos.from('lifeos_habits').select('*');
  console.log('Habits:', JSON.stringify({ data, error }, null, 2));
}
test();
