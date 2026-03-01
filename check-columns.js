const { lifeos } = require('./lifeos-supabase.js');

async function checkColumns() {
    const { data, error } = await lifeos.from('lifeos_tasks').select('*').limit(1);
    console.log('Task object keys:', data ? Object.keys(data[0] || {}) : error);
}

checkColumns();
