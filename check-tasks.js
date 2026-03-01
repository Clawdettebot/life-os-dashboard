const { lifeos } = require('./lifeos-supabase.js');

async function checkTasks() {
    const { data, error } = await lifeos.from('lifeos_tasks').select('*').limit(5);
    console.log('Sample tasks:', JSON.stringify(data, null, 2));
}

checkTasks();
