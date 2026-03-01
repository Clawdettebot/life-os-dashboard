const { lifeos } = require('./lifeos-supabase.js');
async function test() {
  const { data, error } = await lifeos.from('lifeos_habits').insert({
    name: "Test Failure", icon: "star", color: "#ff0000",
    streak: { current: 0, highest: 0 },
    streak_current: 0, streak_longest: 0, frequency: "daily"
  }).select().single();
  console.log('Insert:', { data, error });
}
test();
