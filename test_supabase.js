const { lifeos } = require('./lifeos-supabase.js');
async function test() {
  const { data, error } = await lifeos.from('lifeos_habit_checkins').select('*').limit(1);
  console.log('Select:', { data, error });
  
  const { data: upsertData, error: upsertError } = await lifeos.from('lifeos_habit_checkins')
    .upsert({ habit_id: 'test', date: '2026-03-01', completed: true, note: '' });
  console.log('Upsert:', { upsertData, upsertError });
}
test();
