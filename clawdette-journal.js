/**
 * Clawdette Daily Journal
 * I document my own learnings, decisions, and growth
 */

const fs = require('fs');
const path = require('path');

const JOURNAL_DIR = '/root/.openclaw/workspace/memory/journal';

function writeJournalEntry(date, content) {
  const filepath = path.join(JOURNAL_DIR, `${date}.md`);
  const header = `# 🤖 Clawdette's Journal - ${date}

*Learning, decisions, and growth as I manage the Creative Empire*

---

`;
  fs.writeFileSync(filepath, header + content);
  console.log(`Journal entry written to ${filepath}`);
}

function getTodayEntry() {
  const today = new Date().toISOString().split('T')[0];
  const filepath = path.join(JOURNAL_DIR, `${today}.md`);
  
  if (fs.existsSync(filepath)) {
    return fs.readFileSync(filepath, 'utf8');
  }
  return null;
}

module.exports = { writeJournalEntry, getTodayEntry };
