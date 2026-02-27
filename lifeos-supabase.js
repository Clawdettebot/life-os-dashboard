/**
 * Life OS Supabase Client
 * Single source of truth for all Life OS data
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.LIFEOS_SUPABASE_URL;
const supabaseKey = process.env.LIFEOS_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Life OS Supabase not configured. Using fallback.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ============================================
// TASKS
// ============================================

async function getTasks(filters = {}) {
  if (!supabase) return [];
  
  let query = supabase
    .from('lifeos_tasks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createTask(task) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('lifeos_tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateTask(id, updates) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('lifeos_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function deleteTask(id) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('lifeos_tasks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// HABITS
// ============================================

async function getHabits() {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('lifeos_habits')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

async function checkinHabit(habitId, date = new Date().toISOString().split('T')[0], note = '') {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Insert check-in
  const { error: checkinError } = await supabase
    .from('lifeos_habit_checkins')
    .upsert({ habit_id: habitId, date, completed: true, note });
  
  if (checkinError) throw checkinError;
  
  // Update streak
  const habit = await supabase.from('lifeos_habits').select('*').eq('id', habitId).single();
  if (habit.data) {
    const newStreak = (habit.data.streak_current || 0) + 1;
    const longestStreak = Math.max(newStreak, habit.data.streak_longest || 0);
    
    await supabase
      .from('lifeos_habits')
      .update({ 
        streak_current: newStreak,
        streak_longest: longestStreak,
        last_completed: date,
        updated_at: new Date().toISOString()
      })
      .eq('id', habitId);
  }
  
  return true;
}

// ============================================
// NOTES
// ============================================

async function getNotes(section = null) {
  if (!supabase) return [];
  
  let query = supabase
    .from('lifeos_notes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (section) query = query.eq('section', section);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createNote(note) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('lifeos_notes')
    .insert(note)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// CORTEX
// ============================================

async function getCortexEntries(section = null, limit = 50) {
  if (!supabase) return [];
  
  let query = supabase
    .from('lifeos_cortex')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (section) query = query.eq('section', section);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createCortexEntry(entry) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('lifeos_cortex')
    .insert(entry)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// AGENTS
// ============================================

async function getAgentStatus() {
  if (!supabase) return {};
  
  const { data, error } = await supabase
    .from('lifeos_agents')
    .select('*');
  
  if (error) throw error;
  
  // Convert to object keyed by agent_id
  const agents = {};
  for (const agent of data || []) {
    agents[agent.agent_id] = agent;
  }
  return agents;
}

async function updateAgentStatus(agentId, updates) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('lifeos_agents')
    .upsert({ 
      agent_id: agentId, 
      ...updates,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// PROJECTS
// ============================================

async function getProjects(status = null) {
  if (!supabase) return [];
  
  let query = supabase
    .from('lifeos_projects')
    .select('*')
    .order('priority', { ascending: false });
  
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================
// MEMORY
// ============================================

async function getMemory(limit = 30) {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('lifeos_memory')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

async function createMemory(entry) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('lifeos_memory')
    .insert(entry)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// TRANSACTIONS
// ============================================

async function getTransactions(limit = 100) {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('lifeos_transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// ============================================
// CONTENT SCHEDULE
// ============================================

async function getContentSchedule(status = null) {
  if (!supabase) return [];
  
  let query = supabase
    .from('lifeos_content_schedule')
    .select('*')
    .order('scheduled_at', { ascending: true });
  
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

module.exports = {
  supabase,
  // Tasks
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  // Habits
  getHabits,
  checkinHabit,
  // Notes
  getNotes,
  createNote,
  // Cortex
  getCortexEntries,
  createCortexEntry,
  // Agents
  getAgentStatus,
  updateAgentStatus,
  // Projects
  getProjects,
  // Memory
  getMemory,
  createMemory,
  // Transactions
  getTransactions,
  // Content
  getContentSchedule
};
