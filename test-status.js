const { lifeos } = require('./lifeos-supabase.js');

async function testStatus() {
    console.log("Testing inserting 'backlog' status...");
    const { data, error } = await lifeos.from('lifeos_tasks').insert({
        title: 'Test Kanban Task',
        status: 'backlog',
        created_at: new Date().toISOString()
    }).select();

    if (error) {
        console.error("Error inserting 'backlog':", error.message);
    } else {
        console.log("Success:", data);
        // Cleanup
        await lifeos.from('lifeos_tasks').delete().eq('id', data[0].id);
    }
}

testStatus();
