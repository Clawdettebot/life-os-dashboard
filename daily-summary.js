/**
 * Daily Summary Generator
 * Creates a daily digest of all system stats
 * NOW USING SUPABASE
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/root/.openclaw/workspace/dashboard/.env' });

const DASHBOARD_DIR = '/root/.openclaw/workspace/dashboard';
const OUTPUT_FILE = `${DASHBOARD_DIR}/data/pending-daily-summary.md`;

// Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.LIFEOS_SUPABASE_URL,
  process.env.LIFEOS_SUPABASE_ANON_KEY
);

async function generateDailySummary() {
  const today = new Date().toISOString().split('T')[0];
  const sections = [];
  
  // 1. Cortex - New entries in last 24h
  const cortexEntries = await getCortexNewEntries();
  sections.push(`## 🧠 Cortex Knowledge Base`);
  sections.push(`- **New entries:** ${cortexEntries.count}`);
  if (cortexEntries.bySection.length) {
    sections.push(`  - ${cortexEntries.bySection.join(', ')}`);
  }
  sections.push('');
  
  // 2. Finance - Email-detected expenses
  const finance = await getFinanceSummary();
  sections.push(`## 💰 Finance`);
  sections.push(`- **Expenses detected:** ${finance.expenseCount} (${finance.expenseTotal})`);
  sections.push(`- **Pending opportunities:** ${finance.opportunities}`);
  sections.push('');
  
  // 3. Tasks - Quick status
  const tasks = await getTasksSummary();
  sections.push(`## 📋 Tasks`);
  sections.push(`- **Total:** ${tasks.total} | **Done:** ${tasks.done} | **Pending:** ${tasks.pending}`);
  if (tasks.dueToday.length) {
    sections.push(`- **Due today:** ${tasks.dueToday.join(', ')}`);
  }
  sections.push('');
  
  // 4. Upcoming releases (next 7 days)
  const releases = getUpcomingReleases();
  if (releases.length) {
    sections.push(`## 🎵 Upcoming Releases`);
    releases.forEach(r => sections.push(`- **${r.name}** - ${r.date} (${r.daysLeft} days)`));
    sections.push('');
  }
  
  // 5. System status
  const system = getSystemStatus();
  sections.push(`## ⚙️ System`);
  sections.push(`- **Dashboard:** ${system.dashboardStatus}`);
  sections.push(`- **Last backup:** ${system.lastBackup}`);
  
  // Build the markdown
  const summary = `# 📊 Daily Summary - ${today}
Generated: ${new Date().toISOString()}

${sections.join('\n')}

---
*Powered by Clawdette 🤖*
`;
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, summary);
  console.log(`Daily summary written to ${OUTPUT_FILE}`);
  return summary;
}

async function getCortexNewEntries() {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('lifeos_cortex')
      .select('section')
      .gte('created_at', yesterday);
    
    if (error) throw error;
    
    const bySection = {};
    for (const entry of data || []) {
      bySection[entry.section] = (bySection[entry.section] || 0) + 1;
    }
    
    const sectionStrings = Object.entries(bySection).map(([s, c]) => `${c} ${s}`);
    
    return { 
      count: data?.length || 0, 
      bySection: sectionStrings 
    };
  } catch (e) {
    console.error('Cortex summary error:', e.message);
    return { count: 0, bySection: [] };
  }
}

async function getFinanceSummary() {
  try {
    const { data: transactions, error } = await supabase
      .from('lifeos_transactions')
      .select('*')
      .eq('type', 'expense');
    
    if (error) throw error;
    
    const total = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Opportunities from JSON for now (can migrate later)
    let opportunities = 0;
    try {
      const oppData = fs.readFileSync(`${DASHBOARD_DIR}/data/opportunities.json`, 'utf8');
      const opp = JSON.parse(oppData);
      opportunities = opp.filter(o => o.status === 'pending').length;
    } catch (e) {}
    
    return {
      expenseCount: transactions?.length || 0,
      expenseTotal: `$${total.toFixed(2)}`,
      opportunities
    };
  } catch (e) {
    return { expenseCount: 0, expenseTotal: '$0', opportunities: 0 };
  }
}

async function getTasksSummary() {
  try {
    const { data: tasks, error } = await supabase
      .from('lifeos_tasks')
      .select('*');
    
    if (error) throw error;
    
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: tasks?.length || 0,
      done: (tasks || []).filter(t => t.status === 'done').length,
      pending: (tasks || []).filter(t => t.status !== 'done' && t.status !== 'archived').length,
      dueToday: (tasks || []).filter(t => t.due_date === today).map(t => t.title)
    };
  } catch (e) {
    return { total: 0, done: 0, pending: 0, dueToday: [] };
  }
}

function getUpcomingReleases() {
  const releases = [
    { name: 'A Few Things ft Jai\'Len', date: '2026-02-25' },
    { name: 'Hermes Fleece', date: '2026-03-25' },
    { name: '3 Hoes + HANDSOME DSP', date: '2026-04-22' }
  ];
  
  const today = new Date();
  const upcoming = releases.filter(r => {
    const releaseDate = new Date(r.date);
    const daysLeft = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  }).map(r => ({
    ...r,
    daysLeft: Math.ceil((new Date(r.date) - today) / (1000 * 60 * 60 * 24))
  }));
  
  return upcoming;
}

function getSystemStatus() {
  return {
    dashboardStatus: '✅ Online',
    lastBackup: 'Not configured'
  };
}

// Run if called directly
if (require.main === module) {
  generateDailySummary().then(summary => {
    console.log(summary);
  }).catch(console.error);
}

module.exports = { generateDailySummary };
