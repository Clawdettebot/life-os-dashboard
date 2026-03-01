const { lifeos } = require('./lifeos-supabase.js');
async function test() {
  const checkins = await lifeos.from('lifeos_habit_checkins').select('*').limit(1);
  console.log('Checkins sample:', checkins.data);
  const { data, error } = await lifeos.rpc('get_schema_info', { table_name: 'lifeos_habit_checkins' }); // might not work
  // Try inserting a valid checkin to see if it succeeds.
  const validHabitId = "fac3f09d-0183-4f58-bcc4-24b00924466a"; // from previous query
  const res = await lifeos.from('lifeos_habit_checkins')
        .upsert({ habit_id: validHabitId, date: '2026-03-01', completed: true, note: 'Testing upsert' });
  console.log('Valid upsert:', res);
}
test();
