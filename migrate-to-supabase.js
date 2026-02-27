/**
 * Migration Script: JSON → Supabase
 * Run once to migrate all existing data
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DATA_DIR = '/root/.openclaw/workspace/dashboard/data';

const supabase = createClient(
  process.env.LIFEOS_SUPABASE_URL,
  process.env.LIFEOS_SUPABASE_ANON_KEY
);

async function migrateTasks() {
  console.log('📋 Migrating tasks...');
  
  try {
    const tasks = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'tasks.json'), 'utf8'));
    
    for (const task of tasks) {
      // Convert timestamp if it's in milliseconds
      let createdAt = task.created_at || task.createdAt;
      if (createdAt && typeof createdAt === 'number') {
        createdAt = new Date(createdAt).toISOString();
      } else if (!createdAt) {
        createdAt = new Date().toISOString();
      }
      
      const { error } = await supabase.from('lifeos_tasks').insert({
        title: task.title || task.text || 'Untitled',
        description: task.description || task.notes || null,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date || task.dueDate || null,
        tags: task.tags || [],
        source: task.source || 'migration',
        created_at: createdAt
      });
      
      if (error) console.log('  ⚠️ Error migrating task:', (task.title || task.text || 'Untitled').substring(0, 30), error.message);
    }
    
    console.log(`  ✅ Migrated ${tasks.length} tasks`);
  } catch (e) {
    console.log('  ⚠️ No tasks file found');
  }
}

async function migrateHabits() {
  console.log('🏃 Migrating habits...');
  
  try {
    const habits = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'habits.json'), 'utf8'));
    
    for (const habit of habits) {
      const { error } = await supabase.from('lifeos_habits').insert({
        name: habit.name || habit.title || 'Untitled',
        icon: habit.icon || 'check',
        color: habit.color || '#3b82f6',
        streak_current: habit.streak?.current || 0,
        streak_longest: habit.streak?.longest || 0,
        last_completed: habit.streak?.last_completed || null
      });
      
      if (error) console.log('  ⚠️ Error migrating habit:', habit.name, error.message);
    }
    
    console.log(`  ✅ Migrated ${habits.length} habits`);
  } catch (e) {
    console.log('  ⚠️ No habits file found');
  }
}

async function migrateProjects() {
  console.log('📁 Migrating projects...');
  
  try {
    const projects = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'projects.json'), 'utf8'));
    
    // Map priority text to integer
    const priorityMap = { 'low': 3, 'medium': 5, 'high': 8, 'urgent': 10 };
    
    for (const project of projects) {
      // Convert priority if it's text
      let priority = project.priority || 5;
      if (typeof priority === 'string') {
        priority = priorityMap[priority.toLowerCase()] || 5;
      }
      
      const { error } = await supabase.from('lifeos_projects').insert({
        name: project.name || project.title || 'Untitled',
        description: project.description || null,
        status: project.status || 'active',
        category: project.category || null,
        priority: priority,
        progress: project.progress || 0,
        tags: project.tags || []
      });
      
      if (error) console.log('  ⚠️ Error migrating project:', (project.name || project.title || 'Untitled').substring(0, 30), error.message);
    }
    
    console.log(`  ✅ Migrated ${projects.length} projects`);
  } catch (e) {
    console.log('  ⚠️ No projects file found');
  }
}

async function migrateCortex() {
  console.log('🧠 Migrating cortex entries...');
  
  try {
    const cortex = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'cortex.json'), 'utf8'));
    
    for (const entry of cortex) {
      const { error } = await supabase.from('lifeos_cortex').insert({
        title: entry.title || 'Untitled',
        content: entry.content || null,
        section: entry.section || 'all_spark',
        category: entry.category || null,
        content_type: entry.content_type || 'note',
        source_url: entry.source_url || null,
        source_platform: entry.source_platform || null,
        tags: entry.tags || [],
        metadata: entry.metadata || {},
        created_at: entry.created_at ? new Date(entry.created_at).toISOString() : new Date().toISOString()
      });
      
      if (error) console.log('  ⚠️ Error migrating entry:', entry.title, error.message);
    }
    
    console.log(`  ✅ Migrated ${cortex.length} cortex entries`);
  } catch (e) {
    console.log('  ⚠️ No cortex file found');
  }
}

async function initAgents() {
  console.log('🤖 Initializing agents...');
  
  const agents = [
    { agent_id: 'clawdette', name: 'Clawdette', title: 'Queen / CEO', emoji: '🦐', status: 'online', location: 'cloud' },
    { agent_id: 'claudnelius', name: 'Claudnelius', title: 'Code Magician', emoji: '🧙‍♂️', status: 'offline', location: 'local' },
    { agent_id: 'knowledge_knaight', name: 'Knowledge Knaight', title: 'Research & Knowledge', emoji: '📚', status: 'online', location: 'cloud' },
    { agent_id: 'knaight_of_affairs', name: 'Knaight of Affairs', title: 'Calendar & Schedule', emoji: '📅', status: 'online', location: 'cloud' },
    { agent_id: 'sir_clawthchilds', name: 'Sir Clawthchilds', title: 'Finance & Scanning', emoji: '💰', status: 'online', location: 'cloud' },
    { agent_id: 'labrina', name: 'Labrina', title: 'Social Media', emoji: '📱', status: 'online', location: 'cloud' }
  ];
  
  for (const agent of agents) {
    const { error } = await supabase.from('lifeos_agents').upsert(agent);
    if (error) console.log('  ⚠️ Error adding agent:', agent.name, error.message);
  }
  
  console.log(`  ✅ Initialized ${agents.length} agents`);
}

async function run() {
  console.log('🚀 Starting migration to Supabase...\n');
  
  await migrateTasks();
  await migrateHabits();
  await migrateProjects();
  await migrateCortex();
  await initAgents();
  
  console.log('\n✨ Migration complete!');
  console.log('👉 Update your API endpoints to use Supabase');
}

run().catch(console.error);
