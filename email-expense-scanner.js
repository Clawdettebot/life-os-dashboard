/**
 * Email Expense Scanner
 * Scans Gmail for money-related emails and extracts expense data
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, 'data/google-credentials.json');
const TOKEN_FILE = path.join(__dirname, 'data/google-calendar-token.json');
const FINANCES_FILE = path.join(__dirname, 'data/finances.json');

// Categories and vendor mapping
const CATEGORY_KEYWORDS = {
  streaming: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'paramount', 'apple tv', 'youtube premium', 'twitch', 'peacock'],
  tech: ['aws', 'digitalocean', 'github', 'figma', 'adobe', 'apple', 'google cloud', 'heroku', 'vercel', 'netlify', 'microsoft'],
  utilities: ['electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att', 't-mobile', 'comcast', 'spectrum', 'pg&e'],
  insurance: ['geico', 'state farm', 'allstate', 'progressive', 'insurance', 'liberty'],
  shopping: ['amazon', 'ebay', 'etsy', 'walmart', 'target', 'costco', 'best buy'],
  food: ['doordash', 'uber eats', 'grubhub', 'postmates', 'instacart', 'whole foods', 'trader joe'],
  finance: ['bank', 'chase', 'wells fargo', 'citi', 'capital one', 'amex', 'discover'],
  transfer: ['zelle', 'venmo', 'cash app', 'cashapp', 'paypal', 'western union', 'moneygram', 'ach'],
  fitness: ['gym', 'planet fitness', 'classpass', 'peloton', 'crossfit'],
  education: ['coursera', 'udemy', 'skillshare', 'masterclass', 'linkedin learning'],
};

// Search queries for expense detection
const EXPENSE_QUERIES = [
  'subject:(invoice OR receipt OR "payment" OR charged OR "bill" OR statement) newer_than:30d',
  'subject:(subscription OR "recurring" OR "monthly charge") newer_than:30d',
  'from:(amazon.com OR Netflix OR Spotify OR "Apple.com") subject:(receipt OR invoice OR charge) newer_than:30d',
  'subject:("due date" OR "payment due" OR "past due") newer_than:30d',
];

// Money regex patterns
const MONEY_PATTERNS = [
  /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,           // $XX.XX
  /(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:USD|dollars?)/gi, // XX.XX dollars
  /(?:total|amount|charged|payment|due)[\s:]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
];

// Recurring patterns
const RECURRING_PATTERNS = [
  /monthly|every month|each month/i,
  /yearly|annual|every year/i,
  /weekly|every week/i,
  /quarterly|every 3 months/i,
];

// Negative patterns - skip these
const SKIP_PATTERNS = [
  /failed|unsuccessful|cancelled|declined|denied|insufficient| declined/i,
  /payment failed|payment failed|transaction failed|charge failed/i,
  /retry|attempt/i,
  /over limit|exceeded/i,
];

// Income patterns - these indicate money coming IN
const INCOME_PATTERNS = [
  /you received|received a payment|payment sent to you/i,
  /payment from|paid you|from:/i,
  /deposit|direct deposit|ach credit/i,
  /invoice paid|payment received/i,
  /thanks for your order|order confirmed|receipt/i,
];

// Expense patterns
const EXPENSE_PATTERNS = [
  /you paid|payment made|payment processed/i,
  /charged to|debited from/i,
  /your order|order #/i,
];

class EmailExpenseScanner {
  constructor() {
    this.gmail = null;
    this.finances = [];
    this.scannedEmails = new Set();
  }

  async initialize() {
    console.log('📧 Initializing Gmail client...');
    
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE));
    const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE));
    
    const oauth2Client = new google.auth.OAuth2(
      creds.installed.client_id,
      creds.installed.client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oauth2Client.setCredentials(tokens);
    
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Load existing finances
    if (fs.existsSync(FINANCES_FILE)) {
      this.finances = JSON.parse(fs.readFileSync(FINANCES_FILE));
    }
    
    console.log('✅ Gmail client ready');
  }

  /**
   * Extract amount from email text
   */
  extractAmount(text) {
    if (!text) return null;
    
    for (const pattern of MONEY_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        // Get the largest amount (likely the total)
        const amounts = matches.map(m => parseFloat(m[1].replace(/,/g, '')));
        return Math.max(...amounts);
      }
    }
    return null;
  }

  /**
   * Check if email should be skipped (failed payments, etc)
   */
  shouldSkip(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(text)) return true;
    }
    return false;
  }

  /**
   * Check if this is a Zelle transaction
   */
  isZelle(from, subject, body) {
    const text = `${from} ${subject} ${body}`.toLowerCase();
    return ZELLE_PATTERNS.some(p => p.test(text));
  }

  /**
   * Detect category based on sender and keywords
   */
  detectCategory(from, subject, body) {
    // Check for Zelle - categorize as transfer
    if (this.isZelle(from, subject, body)) {
      return 'transfer';
    }
    
    const searchText = `${from} ${subject} ${body}`.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword)) {
          return category;
        }
      }
    }
    return 'other';
  }

  /**
   * Extract vendor name from sender
   */
  extractVendor(from, subject) {
    if (!from) return 'Unknown';
    
    // Extract domain or name from email
    const match = from.match(/<?([a-zA-Z0-9\s\.]+)?@([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})>?/);
    if (match) {
      const name = match[1] || match[2].split('.')[0];
      return name.replace(/[.\-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Fallback to subject keywords
    const subjectKeywords = ['Netflix', 'Spotify', 'Amazon', 'Apple', 'Google', 'Microsoft'];
    for (const kw of subjectKeywords) {
      if (subject.toLowerCase().includes(kw.toLowerCase())) {
        return kw;
      }
    }
    
    return 'Unknown';
  }

  /**
   * Extract vendor name from email body
   */
  extractVendorFromBody(body) {
    if (!body) return 'Unknown';
    
    // Look for common merchant patterns in body
    const patterns = [
      /from[:\s]+([A-Za-z0-9\s]+?)(?:\n|,|\.|—|-|$)/i,
      /merchant[:\s]+([A-Za-z0-9\s]+?)(?:\n|,|\.|—|-|$)/i,
      /company[:\s]+([A-Za-z0-9\s]+?)(?:\n|,|\.|—|-|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match && match[1]) {
        const vendor = match[1].trim();
        if (vendor.length > 2 && vendor.length < 30) {
          return vendor.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
    }
    
    return 'Unknown';
  }

  /**
   * Check if email is recurring
   */
  detectRecurring(subject, body) {
    const text = `${subject} ${body}`;
    
    for (const pattern of RECURRING_PATTERNS) {
      if (pattern.test(text)) {
        if (pattern.test(/monthly|every month|each month/i)) return 'monthly';
        if (pattern.test(/yearly|annual|every year/i)) return 'yearly';
        if (pattern.test(/weekly|every week/i)) return 'weekly';
        if (pattern.test(/quarterly|every 3 months/i)) return 'quarterly';
      }
    }
    return null;
  }

  /**
   * Parse date from email
   */
  extractDate(dateHeader) {
    if (!dateHeader) return Date.now();
    
    try {
      const parsed = new Date(dateHeader);
      return parsed.getTime();
    } catch {
      return Date.now();
    }
  }

  /**
   * Get plain text from email payload
   */
  async getEmailBody(message) {
    try {
      if (message.payload.body.data) {
        return Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      }
      
      if (message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
      }
    } catch (e) {
      // Ignore
    }
    return '';
  }

  /**
   * Scan emails and extract expenses
   */
  async scanExpenses() {
    console.log('🔍 Scanning emails for expenses...');
    
    const allExpenses = [];
    
    for (const query of EXPENSE_QUERIES) {
      console.log(`  Searching: ${query.substring(0, 50)}...`);
      
      try {
        const response = await this.gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 50,
        });
        
        const messages = response.data.messages || [];
        console.log(`    Found ${messages.length} messages`);
        
        for (const msg of messages) {
          if (this.scannedEmails.has(msg.id)) continue;
          
          try {
            const fullMsg = await this.gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
            });
            
            const headers = fullMsg.data.payload.headers;
            const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
            
            const from = getHeader('From');
            const subject = getHeader('Subject');
            const date = getHeader('Date');
            const body = await this.getEmailBody(fullMsg.data);
            
            // Skip failed/unsuccessful payments
            if (this.shouldSkip(subject, body)) {
              console.log(`  Skipping failed payment: ${subject.substring(0, 50)}`);
              continue;
            }
            
            const amount = this.extractAmount(subject + ' ' + body);
            
            // Check if Zelle - determine type based on context
            let type = 'expense';
            if (this.isZelle(from, subject, body)) {
              // If it says "received" or "sent to you" it's income, otherwise expense
              if (/received|requested|sent to you|deposit/i.test(subject + body)) {
                type = 'income';
              }
            } else {
              // Check for income patterns
              for (const pattern of INCOME_PATTERNS) {
                if (pattern.test(subject + body)) {
                  type = 'income';
                  break;
                }
              }
            }
            
            if (amount && amount > 0) {
              // Better vendor extraction - look in body too
              const vendor = this.extractVendor(from, subject) || this.extractVendorFromBody(body);
              
              const expense = {
                id: `email_${msg.id.substring(0, 8)}`,
                title: vendor,
                amount: amount,
                type: type,
                category: this.detectCategory(from, subject, body),
                vendor: vendor,
                date: this.extractDate(date),
                source: 'email',
                emailSubject: subject,
                emailFrom: from,
                recurring: this.detectRecurring(subject, body) ? {
                  is_recurring: true,
                  frequency: this.detectRecurring(subject, body),
                } : { is_recurring: false, frequency: null },
                tags: ['email-detected'],
                notes: `From: ${subject}`,
                created_at: Date.now(),
                detected_at: Date.now(),
              };
              
              // Check if already exists
              const exists = this.finances.some(f => 
                f.source === 'email' && 
                f.emailSubject === expense.emailSubject &&
                Math.abs(f.amount - expense.amount) < 0.01
              );
              
              if (!exists) {
                allExpenses.push(expense);
                this.scannedEmails.add(msg.id);
              }
            }
          } catch (e) {
            console.error(`  Error processing message: ${e.message}`);
          }
        }
      } catch (e) {
        console.error(`  Search error: ${e.message}`);
      }
    }
    
    return allExpenses;
  }

  /**
   * Save expenses to file
   */
  async saveExpenses(expenses) {
    if (expenses.length === 0) {
      console.log('No new expenses found');
      return [];
    }
    
    this.finances = [...this.finances, ...expenses];
    fs.writeFileSync(FINANCES_FILE, JSON.stringify(this.finances, null, 2));
    
    console.log(`💾 Saved ${expenses.length} new expenses`);
    return expenses;
  }

  /**
   * Run the scanner
   */
  async run() {
    await this.initialize();
    
    const newExpenses = await this.scanExpenses();
    
    if (newExpenses.length > 0) {
      await this.saveExpenses(newExpenses);
      
      console.log('\n📊 Summary:');
      console.log(`  New expenses found: ${newExpenses.length}`);
      
      const byCategory = {};
      for (const exp of newExpenses) {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      }
      
      for (const [cat, total] of Object.entries(byCategory)) {
        console.log(`  ${cat}: $${total.toFixed(2)}`);
      }
      
      const total = newExpenses.reduce((sum, e) => sum + e.amount, 0);
      console.log(`  Total: $${total.toFixed(2)}`);
    } else {
      console.log('No new expenses found');
    }
    
    return newExpenses;
  }
}

// Run if executed directly
if (require.main === module) {
  const scanner = new EmailExpenseScanner();
  scanner.run()
    .then(expenses => {
      console.log(`\n✅ Scan complete! Found ${expenses.length} expenses`);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = EmailExpenseScanner;
