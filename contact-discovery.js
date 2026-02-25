/**
 * Contact Discovery Pipeline
 * Scans Gmail and Calendar for contacts, filters noise, builds CRM
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'contacts.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    company TEXT,
    role TEXT,
    priority INTEGER DEFAULT 3,
    relationship_score INTEGER DEFAULT 50,
    interaction_count INTEGER DEFAULT 0,
    last_contacted INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    status TEXT DEFAULT 'new',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    type TEXT,
    subject TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    body TEXT,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
  );

  CREATE TABLE IF NOT EXISTS skip_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT UNIQUE NOT NULL,
    reason TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    decision TEXT,
    reason TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
  CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
  CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
`);

// Load credentials
const CREDENTIALS_FILE = path.join(DATA_DIR, 'google-credentials.json');
const TOKEN_FILE = path.join(DATA_DIR, 'google-calendar-token.json');

function loadOAuth2Client() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  
  // Handle both "web" and "installed" formats
  const creds = credentials.web || credentials.installed;
  
  const oauth2Client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    creds.redirect_uris[0]
  );
  
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

// Filters
const SKIP_DOMAINS = [
  'noreply@', 'no-reply@', 'notifications@', 'newsletter@', 
  'updates@', 'digest@', 'bounce@', 'mailer@', 'automated@',
  'mailchimp.com', 'substack.com', 'beehiiv.com', 'convertkit.com',
  'sendgrid.net', 'mailgun.org', 'amazonses.com', 'guapdad@',
  'kayak@', 'account.', 'support@', 'help@', 'info@'
];

const SKIP_PATTERNS = [
  /newsletter/i, /digest/i, /unsubscribe/i, /weekly digest/i,
  /monthly digest/i, /no.?reply/i, /automated/i, /system.?message/i,
  /^guapdad/i
];

const COMPANY_DOMAINS = [
  'google.com', 'meta.com', 'amazon.com', 'apple.com', 'microsoft.com',
  'netflix.com', 'spotify.com', 'twitter.com', 'x.com', 'tiktok.com',
  'youtube.com', 'instagram.com', 'linkedin.com', 'twitch.tv'
];

function shouldSkipEmail(email) {
  if (!email) return true;
  const lower = email.toLowerCase();
  
  // Check skip domains
  for (const domain of SKIP_DOMAINS) {
    if (lower.includes(domain)) return true;
  }
  
  // Check skip patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(lower)) return true;
  }
  
  return false;
}

function isCompanyEmail(email) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return COMPANY_DOMAINS.includes(domain);
}

function extractNameFromEmail(email) {
  const local = email.split('@')[0];
  // Try to parse common patterns like firstname.lastname
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return local.charAt(0).toUpperCase() + local.slice(1);
}

async function scanGmailForContacts(oauth2Client, maxResults = 500) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const contacts = new Map();
  
  console.log('📧 Scanning Gmail for contacts...');
  
  // Get all messages (sent + received)
  const query = 'newer_than:30d';
  
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults
    });
    
    const messages = response.data.messages || [];
    console.log(`   Found ${messages.length} recent messages`);
    
    for (const msg of messages) {
      try {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        const headers = full.data.payload?.headers || [];
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;
        
        const from = getHeader('From') || '';
        const to = getHeader('To') || '';
        
        // Extract emails using regex
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const fromEmails = from.match(emailRegex) || [];
        const toEmails = to.match(emailRegex) || [];
        
        // Process "From" (people who sent to you)
        for (const email of fromEmails) {
          if (shouldSkipEmail(email) || isCompanyEmail(email)) continue;
          
          if (!contacts.has(email)) {
            const name = extractNameFromEmail(email);
            contacts.set(email, { email, name, company: null, role: null });
          }
          const c = contacts.get(email);
          c.received = (c.received || 0) + 1;
        }
        
        // Process "To" (people you sent to)
        for (const email of toEmails) {
          if (shouldSkipEmail(email) || isCompanyEmail(email)) continue;
          
          if (!contacts.has(email)) {
            const name = extractNameFromEmail(email);
            contacts.set(email, { email, name, company: null, role: null });
          }
          const c = contacts.get(email);
          c.sent = (c.sent || 0) + 1;
        }
        
      } catch (e) {
        // Skip individual message errors
      }
    }
  } catch (e) {
    console.error('Gmail scan error:', e.message);
  }
  
  console.log(`   Found ${contacts.size} potential contacts`);
  return Array.from(contacts.values());
}

async function scanCalendarForContacts(oauth2Client) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const contacts = new Map();
  
  console.log('📅 Scanning Calendar for contacts...');
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: now.toISOString(),
      singleEvents: true,
      maxResults: 500
    });
    
    const events = response.data.items || [];
    console.log(`   Found ${events.length} recent events`);
    
    for (const event of events) {
      // Skip large meetings
      const attendees = event.attendees || [];
      if (attendees.length > 10) continue;
      
      for (const attendee of attendees) {
        const email = attendee.email;
        if (shouldSkipEmail(email) || isCompanyEmail(email)) continue;
        
        if (!contacts.has(email)) {
          const name = extractNameFromEmail(email);
          contacts.set(email, { email, name, company: null, role: null });
        }
        const c = contacts.get(email);
        c.meetings = (c.meetings || 0) + 1;
      }
    }
  } catch (e) {
    console.error('Calendar scan error:', e.message);
  }
  
  console.log(`   Found ${contacts.size} calendar contacts`);
  return Array.from(contacts.values());
}

function saveContacts(contacts) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO contacts (email, name, company, role, status)
    VALUES (?, ?, ?, ?, 'new')
  `);
  
  const update = db.prepare(`
    UPDATE contacts SET 
      interaction_count = interaction_count + ?,
      last_contacted = strftime('%s', 'now'),
      updated_at = strftime('%s', 'now')
    WHERE email = ?
  `);
  
  let newCount = 0;
  let updatedCount = 0;
  
  for (const c of contacts) {
    const received = c.received || 0;
    const sent = c.sent || 0;
    const meetings = c.meetings || 0;
    const total = received + sent + meetings;
    
    if (total > 0) {
      const existing = db.prepare('SELECT id FROM contacts WHERE email = ?').get(c.email);
      
      if (existing) {
        update.run(total, c.email);
        updatedCount++;
      } else {
        insert.run(c.email, c.name, c.company, c.role);
        newCount++;
      }
    }
  }
  
  console.log(`   Saved ${newCount} new contacts, updated ${updatedCount} existing`);
}

function calculateRelationshipScore(contact) {
  // Score based on: recency (40%), frequency (30%), priority (30%)
  const now = Date.now();
  const lastContacted = contact.last_contacted ? contact.last_contacted * 1000 : 0;
  
  // Recency score (0-40) - more recent = higher
  let recencyScore = 0;
  if (lastContacted > 0) {
    const daysSince = (now - lastContacted) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) recencyScore = 40;
    else if (daysSince < 14) recencyScore = 30;
    else if (daysSince < 30) recencyScore = 20;
    else if (daysSince < 60) recencyScore = 10;
  }
  
  // Frequency score (0-30) - more interactions = higher
  const interactions = contact.interaction_count || 0;
  let frequencyScore = 0;
  if (interactions > 20) frequencyScore = 30;
  else if (interactions > 10) frequencyScore = 25;
  else if (interactions > 5) frequencyScore = 20;
  else if (interactions > 2) frequencyScore = 15;
  else if (interactions > 0) frequencyScore = 10;
  
  // Priority score (0-30)
  const priority = contact.priority || 3;
  const priorityScore = (4 - priority) * 10;
  
  return Math.min(100, recencyScore + frequencyScore + priorityScore);
}

function updateRelationshipScores() {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  
  for (const contact of contacts) {
    const score = calculateRelationshipScore(contact);
    db.prepare('UPDATE contacts SET relationship_score = ? WHERE id = ?').run(score, contact.id);
  }
  
  console.log(`   Updated relationship scores for ${contacts.length} contacts`);
}

function getContactsNeedingAttention(limit = 10) {
  return db.prepare(`
    SELECT * FROM contacts 
    WHERE status = 'active' 
    ORDER BY relationship_score ASC, last_contacted ASC 
    LIMIT ?
  `).all(limit);
}

function getContactStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  const active = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'active'").get().count;
  const newContacts = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'new'").get().count;
  const ignored = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'ignored'").get().count;
  
  // Contacts needing attention
  const needingAttention = getContactsNeedingAttention(10);
  
  return { total, active, new: newContacts, ignored, needingAttention };
}

async function runContactDiscovery() {
  console.log('\n🧑‍💼 Contact Discovery Pipeline');
  console.log('==============================');
  
  try {
    const oauth2Client = loadOAuth2Client();
    
    // Scan Gmail
    const gmailContacts = await scanGmailForContacts(oauth2Client);
    
    // Scan Calendar
    const calendarContacts = await scanCalendarForContacts(oauth2Client);
    
    // Merge contacts (gmail + calendar)
    const merged = new Map();
    
    for (const c of gmailContacts) {
      merged.set(c.email, c);
    }
    for (const c of calendarContacts) {
      if (merged.has(c.email)) {
        const existing = merged.get(c.email);
        merged.set(c.email, { ...existing, ...c });
      } else {
        merged.set(c.email, c);
      }
    }
    
    // Save to database
    saveContacts(Array.from(merged.values()));
    
    // Update relationship scores
    updateRelationshipScores();
    
    // Print stats
    const stats = getContactStats();
    console.log('\n📊 Contact Stats:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   New: ${stats.new}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Ignored: ${stats.ignored}`);
    
  } catch (e) {
    console.error('Pipeline error:', e);
  }
}

// CLI
if (require.main === module) {
  runContactDiscovery().then(() => process.exit(0));
}

module.exports = { runContactDiscovery, getContactStats };
