/**
 * Daily Summary Generator
 * Creates a daily digest of all system stats
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = '/root/.openclaw/workspace/dashboard';
const OUTPUT_FILE = `${DASHBOARD_DIR}/data/pending-daily-summary.md`;

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
  const finance = getFinanceSummary();
  sections.push(`## 💰 Finance`);
  sections.push(`- **Expenses detected:** ${finance.expenseCount} (${finance.expenseTotal})`);
  sections.push(`- **Pending opportunities:** ${finance.opportunities}`);
  sections.push('');
  
  // 3. Tasks - Quick status
  const tasks = getTasksSummary();
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
    const db = require('sqlite3').verbose();
    const cortexDb = new db.Database(`${DASHBOARD_DIR}/data/cortex.db`);
    
    return new Promise((resolve) => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      
      cortexDb.get(
        `SELECT COUNT(*) as count FROM cortex_entries WHERE created_at > ?`,
        [yesterday],
        (err, row) => {
          if (err) {
            cortexDb.close();
            resolve({ count: 0, bySection: [] });
            return;
          }
          
          cortexDb.all(
            `SELECT section, COUNT(*) as count FROM cortex_entries WHERE created_at > ? GROUP BY section`,
            [yesterday],
            (err2, rows) => {
              cortexDb.close();
              const bySection = rows ? rows.map(r => `${r.count} ${r.section}`) : [];
              resolve({ count: row?.count || 0, bySection });
            }
          );
        }
      );
    });
  } catch (e) {
    return { count: 0, bySection: [] };
  }
}

function getFinanceSummary() {
  try {
    const finances = JSON.parse(fs.readFileSync(`${DASHBOARD_DIR}/data/finances.json`, 'utf8'));
    const expenses = finances.filter(f => f.type === 'expense');
    const opportunitiesRaw = fs.readFileSync(`${DASHBOARD_DIR}/data/opportunities.json`, 'utf8');
    const opportunities = opportunitiesRaw ? JSON.parse(opportunitiesRaw) : [];
    
    const total = expenses.reduce((sum, f) => sum + (f.amount || 0), 0);
    
    return {
      expenseCount: expenses.length,
      expenseTotal: `$${total.toFixed(2)}`,
      opportunities: opportunities.filter(o => o.status === 'pending').length
    };
  } catch (e) {
    return { expenseCount: 0, expenseTotal: '$0', opportunities: 0 };
  }
}

function getTasksSummary() {
  try {
    const tasks = JSON.parse(fs.readFileSync(`${DASHBOARD_DIR}/data/tasks.json`, 'utf8'));
    return {
      total: tasks.length,
      done: tasks.filter(t => t.status === 'done').length,
      pending: tasks.filter(t => t.status !== 'done').length,
      dueToday: tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0]).map(t => t.title)
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
