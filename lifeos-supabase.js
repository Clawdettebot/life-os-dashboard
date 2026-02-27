/**
 * Life OS Supabase Client
 * Single source of truth for all Life OS data
 * Uses embedded credentials for out-of-box functionality
 */

const config = require('./supabase-config');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.LIFEOS_SUPABASE_URL || config.lifeos.url;
const supabaseKey = process.env.LIFEOS_SUPABASE_ANON_KEY || config.lifeos.anonKey;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Life OS Supabase not configured. Using fallback.');
}

const lifeos = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// For backward compatibility and specialized use cases
const supabase = lifeos;

// ============================================
// TASKS
// ============================================

async function getTasks(filters = {}) {
  if (!lifeos) return [];

  let query = lifeos
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
  if (!lifeos) throw new Error('Supabase not configured');

  const { data, error } = await lifeos
    .from('lifeos_tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateTask(id, updates) {
  if (!lifeos) throw new Error('Supabase not configured');

  const { data, error } = await lifeos
    .from('lifeos_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteTask(id) {
  if (!lifeos) throw new Error('Supabase not configured');

  const { error } = await lifeos
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
  if (!lifeos) return [];

  const { data, error } = await lifeos
    .from('lifeos_habits')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

async function checkinHabit(habitId, date = new Date().toISOString().split('T')[0], note = '') {
  if (!lifeos) throw new Error('Supabase not configured');

  // Insert check-in
  const { error: checkinError } = await lifeos
    .from('lifeos_habit_checkins')
    .upsert({ habit_id: habitId, date, completed: true, note });

  if (checkinError) throw checkinError;

  // Update streak
  const habit = await lifeos.from('lifeos_habits').select('*').eq('id', habitId).single();
  if (habit.data) {
    const newStreak = (habit.data.streak_current || 0) + 1;
    const longestStreak = Math.max(newStreak, habit.data.streak_longest || 0);

    await lifeos
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
  if (!lifeos) return [];

  let query = lifeos
    .from('lifeos_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (section) query = query.eq('section', section);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createNote(note) {
  if (!lifeos) throw new Error('Supabase not configured');

  const { data, error } = await lifeos
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
  if (!lifeos) return [];

  let query = lifeos
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
  if (!lifeos) throw new Error('Supabase not configured');

  const { data, error } = await lifeos
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
  if (!lifeos) return {};

  const { data, error } = await lifeos
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
  if (!lifeos) throw new Error('Supabase not configured');

  const { data, error } = await lifeos
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
  if (!lifeos) return [];

  let query = lifeos
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
  if (!lifeos) return [];

  const { data, error } = await lifeos
    .from('lifeos_memory')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function createMemory(entry) {
  if (!lifeos) throw new Error('Supabase not configured');

  const { data, error } = await lifeos
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
  if (!lifeos) return [];

  const { data, error } = await lifeos
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
  if (!lifeos) return [];

  let query = lifeos
    .from('lifeos_content_schedule')
    .select('*')
    .order('scheduled_at', { ascending: true });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

module.exports = {
  lifeos,
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
