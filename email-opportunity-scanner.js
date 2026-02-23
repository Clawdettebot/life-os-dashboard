/**
 * Email Opportunity Scanner
 * Scans Gmail for money opportunities: payments, refunds, bonuses, urgent follow-ups
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, 'data/google-credentials.json');
const TOKEN_FILE = path.join(__dirname, 'data/google-calendar-token.json');
const OPPORTUNITIES_FILE = path.join(__dirname, 'data/opportunities.json');

// Opportunity types
const OPPORTUNITY_TYPES = {
  refund: {
    keywords: ['refund', 'reimbursement', 'money back', 'credited', 'reversed'],
    priority: 'medium',
    color: '#4caf50'
  },
  payment_received: {
    keywords: ['payment received', 'payment sent', 'paid', 'deposit', 'direct deposit', 'ACH credit'],
    priority: 'high',
    color: '#2196f3'
  },
  bonus: {
    keywords: ['bonus', 'commission', 'earnings', 'payout', 'profit share', 'royalty'],
    priority: 'medium',
    color: '#ff9800'
  },
  urgent: {
    keywords: ['urgent', 'action required', 'verify', 'confirm your account', 'suspended', 'unauthorized'],
    priority: 'high',
    color: '#f44336'
  },
  follow_up: {
    keywords: ['follow up', 'pending', 'awaiting', 'invoice sent', 'payment pending'],
    priority: 'low',
    color: '#9c27b0'
  }
};

// Search queries
const OPPORTUNITY_QUERIES = [
  'subject:(refund OR reimbursement OR "money back" OR "credited to") newer_than:30d',
  'subject:("payment received" OR "paid" OR "deposit" OR "direct deposit") newer_than:14d',
  'subject:(bonus OR commission OR earnings OR payout) newer_than:30d',
  'subject:(urgent OR "action required" OR "verify your account" OR suspended) newer_than:7d',
  'subject:("follow up" OR "pending payment" OR "invoice sent") newer_than:14d'
];

class EmailOpportunityScanner {
  constructor() {
    this.gmail = null;
    this.opportunities = [];
  }

  async initialize() {
    console.log('📧 Initializing Gmail client for opportunities...');
    
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE));
    const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE));
    
    const oauth2Client = new google.auth.OAuth2(
      creds.installed.client_id,
      creds.installed.client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oauth2Client.setCredentials(tokens);
    
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Load existing opportunities
    if (fs.existsSync(OPPORTUNITIES_FILE)) {
      this.opportunities = JSON.parse(fs.readFileSync(OPPORTUNITIES_FILE));
    }
    
    console.log('✅ Gmail client ready');
  }

  /**
   * Detect opportunity type from subject/body
   */
  detectType(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    
    for (const [type, config] of Object.entries(OPPORTUNITY_TYPES)) {
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          return type;
        }
      }
    }
    return null;
  }

  /**
   * Extract amount from text
   */
  extractAmount(text) {
    if (!text) return null;
    
    const patterns = [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /(?:amount|total|paid|refund|credited)[\s:]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
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

  /**
   * Get plain text from email
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
    } catch (e) {}
    return '';
  }

  /**
   * Extract title from email
   */
  extractTitle(from, subject, type) {
    const typeLabels = {
      refund: 'Refund',
      payment_received: 'Payment Received',
      bonus: 'Earnings/Bonus',
      urgent: 'Urgent Action Required',
      follow_up: 'Follow Up'
    };
    
    if (from) {
      const match = from.match(/<?([a-zA-Z0-9\s\.]+)?@([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})>?/);
      if (match) {
        const name = match[1] || match[2].split('.')[0];
        return `${typeLabels[type] || 'Opportunity'}: ${name.replace(/[.\-_]/g, ' ')}`;
      }
    }
    
    return typeLabels[type] || 'Opportunity';
  }

  /**
   * Scan emails for opportunities
   */
  async scan() {
    console.log('🔍 Scanning emails for opportunities...');
    
    const newOpportunities = [];
    
    for (const query of OPPORTUNITY_QUERIES) {
      console.log(`  Searching: ${query.substring(0, 50)}...`);
      
      try {
        const response = await this.gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 30
        });
        
        const messages = response.data.messages || [];
        console.log(`    Found ${messages.length} messages`);
        
        for (const msg of messages) {
          // Check if already processed
          if (this.opportunities.some(o => o.emailId === msg.id)) continue;
          
          try {
            const fullMsg = await this.gmail.users.messages.get({
              userId: 'me',
              id: msg.id
            });
            
            const headers = fullMsg.data.payload.headers;
            const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
            
            const from = getHeader('From');
            const subject = getHeader('Subject');
            const date = getHeader('Date');
            const body = await this.getEmailBody(fullMsg.data);
            
            const type = this.detectType(subject, body);
            if (!type) continue;
            
            const amount = this.extractAmount(subject + ' ' + body);
            
            const opportunity = {
              id: `opp_${msg.id.substring(0, 8)}_${Date.now()}`,
              type: type,
              title: this.extractTitle(from, subject, type),
              description: subject,
              amount: amount,
              source: from,
              subject: subject,
              emailId: msg.id,
              action: 'none',
              status: 'pending',
              priority: OPPORTUNITY_TYPES[type].priority,
              reminderDate: null,
              created_at: Date.now(),
              emailDate: new Date(date).getTime()
            };
            
            newOpportunities.push(opportunity);
            this.opportunities.push(opportunity);
            
          } catch (e) {
            console.error(`  Error: ${e.message}`);
          }
        }
      } catch (e) {
        console.error(`  Search error: ${e.message}`);
      }
    }
    
    return newOpportunities;
  }

  /**
   * Save opportunities
   */
  async save() {
    fs.writeFileSync(OPPORTUNITIES_FILE, JSON.stringify(this.opportunities, null, 2));
    console.log(`💾 Saved ${this.opportunities.length} opportunities`);
  }

  /**
   * Run scanner
   */
  async run() {
    await this.initialize();
    
    const newOpps = await this.scan();
    await this.save();
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  New opportunities: ${newOpps.length}`);
    
    const byType = {};
    for (const opp of newOpps) {
      byType[opp.type] = (byType[opp.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }
    
    return newOpps;
  }
}

// Run if executed directly
if (require.main === module) {
  const scanner = new EmailOpportunityScanner();
  scanner.run()
    .then(opps => {
      console.log(`\n✅ Scan complete! Found ${opps.length} opportunities`);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = EmailOpportunityScanner;
