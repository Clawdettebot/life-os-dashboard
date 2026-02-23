/**
 * Smart Email Expense Scanner
 * Enhanced context extraction without AI dependency
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, 'data/google-credentials.json');
const TOKEN_FILE = path.join(__dirname, 'data/google-calendar-token.json');
const FINANCES_FILE = path.join(__dirname, 'data/finances.json');

// Enhanced categories with more keywords
const CATEGORY_KEYWORDS = {
  streaming: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'paramount', 'apple tv', 'youtube premium', 'twitch', 'peacock', 'crunchyroll'],
  tech: ['aws', 'digitalocean', 'github', 'figma', 'adobe', 'apple', 'google cloud', 'heroku', 'vercel', 'netlify', 'microsoft', 'github', 'notion', 'raycast', 'output', 'streamlabs', 'streamelements'],
  utilities: ['electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att', 't-mobile', 'comcast', 'spectrum', 'pg&e', 'xfinity'],
  insurance: ['geico', 'state farm', 'allstate', 'progressive', 'insurance', 'liberty', 'metlife'],
  shopping: ['amazon', 'ebay', 'etsy', 'walmart', 'target', 'costco', 'best buy', 'nordstrom', 'supreme', 'kith'],
  food: ['doordash', 'uber eats', 'grubhub', 'postmates', 'instacart', 'whole foods', 'trader joe', 'mcdonalds', 'burger king', 'wendys', 'chipotle'],
  finance: ['bank', 'chase', 'wells fargo', 'citi', 'capital one', 'amex', 'discover', 'schwab'],
  transfer: ['zelle', 'venmo', 'cash app', 'cashapp', 'paypal', 'western union', 'moneygram', 'ach', 'direct deposit'],
  music: ['distrokid', 'distrokid', 'spotify for artists', 'apple music for artists', 'tidal', 'royalty', 'beat', 'production', 'verse', 'feature', 'collab', 'collaboration', 'master', 'publishing', 'ascap', 'bmi', 'sesac'],
  fitness: ['gym', 'planet fitness', 'classpass', 'peloton', 'crossfit', 'equinox', 'la fitness'],
  education: ['coursera', 'udemy', 'skillshare', 'masterclass', 'linkedin learning', 'skillshare'],
  marketing: ['facebook ads', 'google ads', 'instagram ads', 'tiktok ads', 'promoted', 'sponsor'],
};

const SKIP_PATTERNS = [
  /failed|unsuccessful|cancelled|declined|denied|insufficient/i,
  /payment failed|transaction failed|charge failed|declined/i,
  /retry|attempt|expired.*card/i,
];

// Known vendors for smart matching
const VENDOR_PATTERNS = {
  'McDonalds': { keywords: ['mcdonalds', 'mcdonald', 'big mac'], category: 'music', tags: ['collab', 'brand-deal'] },
  'Spotify': { keywords: ['spotify'], category: 'streaming' },
  'Netflix': { keywords: ['netflix'], category: 'streaming' },
  'Amazon': { keywords: ['amazon', 'amzn'], category: 'shopping' },
  'Google': { keywords: ['google play', 'google payments', 'google storage'], category: 'tech' },
  'Apple': { keywords: ['apple.com', 'apple music', 'itunes'], category: 'tech' },
  'J.P. Morgan': { keywords: ['j.p. morgan', 'chase', 'alerts no reply'], category: 'transfer' },
  'Zelle': { keywords: ['zelle'], category: 'transfer' },
};

const EXPENSE_QUERIES = [
  'subject:(invoice OR receipt OR "payment" OR charged OR "bill" OR statement) newer_than:60d',
  'subject:(subscription OR "recurring" OR "monthly charge") newer_than:60d',
  'subject:("payment received" OR "you received" OR "sent to you") newer_than:60d',
  'subject:("due date" OR "payment due" OR "past due") newer_than:30d',
];

class SmartExpenseScanner {
  constructor() {
    this.gmail = null;
    this.finances = [];
    this.scannedEmails = new Set();
  }

  async initialize() {
    console.log('📧 Initializing...');
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE));
    const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE));
    
    const oauth2Client = new google.auth.OAuth2(
      creds.installed.client_id,
      creds.installed.client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oauth2Client.setCredentials(tokens);
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    if (fs.existsSync(FINANCES_FILE)) {
      this.finances = JSON.parse(fs.readFileSync(FINANCES_FILE));
    }
    console.log('✅ Ready\n');
  }

  /**
   * Smart vendor detection
   */
  detectVendor(from, subject, body) {
    const text = `${from} ${subject} ${body}`.toLowerCase();
    
    // Check known vendors
    for (const [vendor, info] of Object.entries(VENDOR_PATTERNS)) {
      for (const kw of info.keywords) {
        if (text.includes(kw)) {
          return { vendor, ...info };
        }
      }
    }
    
    // Extract from email
    if (from) {
      const match = from.match(/<?([a-zA-Z0-9\s\.]+)?@([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})>?/);
      if (match) {
        const name = match[1] || match[2].split('.')[0];
        return { vendor: name.replace(/[.\-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
      }
    }
    return { vendor: 'Unknown' };
  }

  /**
   * Smart category detection
   */
  detectCategory(from, subject, body, detectedVendor) {
    const text = `${from} ${subject} ${body}`.toLowerCase();
    
    // Check vendor override
    if (detectedVendor?.category) return detectedVendor.category;
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) return category;
      }
    }
    return 'other';
  }

  /**
   * Detect type (income vs expense)
   */
  detectType(subject, body, from) {
    const text = `${subject} ${body} ${from}`.toLowerCase();
    
    // Zelle-specific: check if sent or received
    if (/zelle/i.test(text)) {
      // If you SENT money (outgoing)
      if (/you sent|you requested|sent \$(?!.*to you)|payment sent|you paid|you initiated/i.test(text)) {
        return 'expense';
      }
      // If you RECEIVED money (incoming)
      if (/you received|received a payment|payment sent to you|sent to you/i.test(text)) {
        return 'income';
      }
    }
    
    // Income patterns
    if (/you received|received a payment|payment sent to you|direct deposit|ach credit|invoice paid|payment from|paid by/i.test(text)) {
      return 'income';
    }
    // Expense patterns
    if (/you paid|charged to|your order|subscription|billed to/i.test(text)) {
      return 'expense';
    }
    return 'expense'; // default
  }

  /**
   * Detect recurring
   */
  detectRecurring(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    if (/monthly|every month|each month|recurring|auto-renew/i.test(text)) return { is_recurring: true, frequency: 'monthly' };
    if (/yearly|annual|every year/i.test(text)) return { is_recurring: true, frequency: 'yearly' };
    if (/weekly|every week/i.test(text)) return { is_recurring: true, frequency: 'weekly' };
    return { is_recurring: false, frequency: null };
  }

  /**
   * Extract context/description from body
   */
  extractContext(subject, body) {
    const lines = body.split('\n').filter(l => l.trim().length > 10);
    
    // Look for description lines
    const descriptionPatterns = [
      /(?:description|for|from|re:|subject)[\s:]+(.+)/i,
      /(?:transaction|payment)[\s]+(?:for|of)[\s]+(.+)/i,
    ];
    
    for (const line of lines.slice(0, 10)) {
      for (const pattern of descriptionPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 5 && match[1].length < 100) {
          return match[1].trim();
        }
      }
    }
    return '';
  }

  extractAmount(text) {
    if (!text) return null;
    const patterns = [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    ];
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const amounts = matches.map(m => parseFloat(m[1].replace(/,/g, '')));
        return Math.max(...amounts);
      }
    }
    return null;
  }

  shouldSkip(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    return SKIP_PATTERNS.some(p => p.test(text));
  }

  async getEmailBody(message) {
    try {
      if (message.payload.body.data) return Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      if (message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
      }
    } catch (e) {}
    return '';
  }

  isDuplicate(subject, amount) {
    return this.finances.some(f => 
      f.emailSubject === subject && Math.abs(f.amount - amount) < 0.01
    );
  }

  async scanExpenses() {
    console.log('🔍 Scanning emails with smart context extraction...\n');
    const allExpenses = [];
    
    for (const query of EXPENSE_QUERIES) {
      console.log(`  Query: ${query.substring(0, 35)}...`);
      
      try {
        const response = await this.gmail.users.messages.list({
          userId: 'me', q: query, maxResults: 25,
        });
        
        const messages = response.data.messages || [];
        console.log(`    Found ${messages.length} messages`);
        
        for (const msg of messages) {
          try {
            const fullMsg = await this.gmail.users.messages.get({ userId: 'me', id: msg.id });
            const headers = fullMsg.data.payload.headers;
            const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
            
            const from = getHeader('From');
            const subject = getHeader('Subject');
            const date = getHeader('Date');
            const body = await this.getEmailBody(fullMsg.data);
            
            if (this.shouldSkip(subject, body)) continue;
            
            const amount = this.extractAmount(subject + ' ' + body);
            if (!amount || amount <= 0) continue;
            if (this.isDuplicate(subject, amount)) continue;
            
            const vendorInfo = this.detectVendor(from, subject, body);
            const category = this.detectCategory(from, subject, body, vendorInfo);
            const type = this.detectType(subject, body, from);
            const recurring = this.detectRecurring(subject, body);
            const context = this.extractContext(subject, body);
            
            const expense = {
              id: `email_${msg.id.substring(0, 8)}_${Date.now()}`,
              title: vendorInfo.vendor,
              amount,
              type,
              category,
              vendor: vendorInfo.vendor,
              date: new Date(date).getTime(),
              source: 'email',
              emailSubject: subject,
              emailFrom: from,
              recurring,
              tags: vendorInfo.tags || ['email-detected'],
              notes: context,
              description: '',
              created_at: Date.now(),
              detected_at: Date.now(),
            };
            
            allExpenses.push(expense);
            this.scannedEmails.add(msg.id);
            console.log(`    → ${expense.title} (${type}, $${amount})`);
            
          } catch (e) {
            console.error(`    Error: ${e.message}`);
          }
        }
      } catch (e) {
        console.error(`  Query error: ${e.message}`);
      }
    }
    return allExpenses;
  }

  async saveExpenses(expenses) {
    if (expenses.length === 0) return [];
    this.finances = [...this.finances, ...expenses];
    fs.writeFileSync(FINANCES_FILE, JSON.stringify(this.finances, null, 2));
    return expenses;
  }

  async run() {
    await this.initialize();
    const newExpenses = await this.scanExpenses();
    if (newExpenses.length > 0) await this.saveExpenses(newExpenses);
    
    console.log(`\n✅ Found ${newExpenses.length} new expenses`);
    return newExpenses;
  }
}

if (require.main === module) {
  const scanner = new SmartExpenseScanner();
  scanner.run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = SmartExpenseScanner;
