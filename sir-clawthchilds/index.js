/**
 * Sir Clawthchilds - Financial Knaight
 * Scans emails for financial transactions, tracks recurring payments
 */

const { Events } = require('discord.js');
const { CronJob } = require('cron');

class SirClawthchilds {
  constructor(bot) {
    this.bot = bot;
    this.name = 'Sir Clawthchilds';
    this.role = 'Financial Knaight';
    this.active = true;
    
    // Track known subscriptions to detect changes
    this.knownSubscriptions = new Map();
    
    // Email sources to monitor
    this.emailSources = {
      twitch: { domain: 'twitch.tv', keywords: ['payout', 'subscription', 'bits'] },
      stripe: { domain: 'stripe.com', keywords: ['charge', 'payout', 'refund'] },
      chase: { domain: 'chase.com', keywords: ['transaction', 'alert', 'statement'] },
      cashapp: { domain: 'cash.app', keywords: ['payment', 'cash', 'bitcoin'] },
      shopify: { domain: 'shopify.com', keywords: ['order', 'payout', 'subscription'] },
      att: { domain: 'att.com', keywords: ['bill', 'payment', 'charge'] },
      tmobile: { domain: 't-mobile.com', keywords: ['bill', 'payment', 'device'] },
      zillow: { domain: 'zillow.com', keywords: ['payment', 'rent', 'listing'] },
      apple: { domain: 'apple.com', keywords: ['receipt', 'subscription', 'itunes'] },
      venmo: { domain: 'venmo.com', keywords: ['payment', 'charged', 'received'] },
      paypal: { domain: 'paypal.com', keywords: ['payment', 'sent', 'received'] }
    };
    
    // Daily scan at 9 AM Pacific
    this.dailyCron = new CronJob('0 17 * * *', () => this.dailyScan());
    
    // Weekly report on Mondays at 9 AM Pacific
    this.weeklyCron = new CronJob('0 17 * * 1', () => this.weeklyReport());
  }
  
  start() {
    this.dailyCron.start();
    this.weeklyCron.start();
    console.log('👑 Sir Clawthchilds started - Daily: 5PM UTC, Weekly: Mondays 5PM UTC');
  }
  
  stop() {
    this.dailyCron.stop();
    this.weeklyCron.stop();
    console.log('👑 Sir Clawthchilds stopped');
  }
  
  // Daily scan of recent emails
  async dailyScan() {
    try {
      const transactions = await this.scanEmails(1); // Last 1 day
      const summary = this.formatDailySummary(transactions);
      
      await this.sendToRoundTable(summary);
      await this.sendDM(summary);
      
      // Update finance API with new recurring payments
      await this.updateFinances(transactions);
    } catch (e) {
      console.log('Daily scan failed:', e.message);
    }
  }
  
  // Weekly financial report
  async weeklyReport() {
    try {
      const transactions = await this.scanEmails(7); // Last 7 days
      const report = this.formatWeeklyReport(transactions);
      
      await this.sendToRoundTable(report);
      await this.sendDM(report);
    } catch (e) {
      console.log('Weekly report failed:', e.message);
    }
  }
  
  // Scan emails for financial transactions
  async scanEmails(days = 1) {
    const transactions = [];
    const seen = new Set(); // Deduplicate
    
    // This would integrate with Gmail API in production
    // For now, using mock data structure
    try {
      // Fetch from finance endpoint
      const axios = require('axios');
      const response = await axios.get(`${this.bot.config.apiUrl}/api/finances/email-detected`);
      const emails = response.data.expenses || [];
      
      for (const email of emails) {
        const key = `${email.merchant}-${email.amount}`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        const parsed = this.parseTransaction(email);
        if (parsed) transactions.push(parsed);
      }
    } catch (e) {
      console.log('Email scan error:', e.message);
    }
    
    return transactions;
  }
  
  // Parse email into transaction
  parseTransaction(email) {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    
    // Extract amount
    const amountMatch = (subject + body).match(/\$[\d,]+\.?\d*/);
    if (!amountMatch) return null;
    
    const amount = parseFloat(amountMatch[0].replace('$', '').replace(',', ''));
    
    // Ignore tiny amounts
    if (amount < 1) return null;
    
    // Detect type
    let type = 'expense';
    if (subject.includes('refund') || subject.includes('payout') || subject.includes('deposit')) {
      type = 'income';
    } else if (subject.includes('subscription') || subject.includes('monthly') || subject.includes('yearly')) {
      type = 'subscription';
    }
    
    // Detect merchant
    let merchant = 'Unknown';
    for (const [name, info] of Object.entries(this.emailSources)) {
      if (from.includes(info.domain)) {
        merchant = name.charAt(0).toUpperCase() + name.slice(1);
        break;
      }
    }
    
    return {
      merchant,
      amount,
      type,
      date: email.date,
      subject: email.subject,
      source: this.detectSource(from)
    };
  }
  
  // Detect which financial source
  detectSource(from) {
    const sources = {
      'twitch': ['twitch', 'twitch.tv'],
      'stripe': ['stripe'],
      'chase': ['chase'],
      'cashapp': ['cash.app', 'square'],
      'shopify': ['shopify'],
      'att': ['att.com', 'at&t'],
      'tmobile': ['t-mobile', 'tmobile'],
      'zillow': ['zillow'],
      'apple': ['apple.com', 'itunes'],
      'venmo': ['venmo'],
      'paypal': ['paypal']
    };
    
    for (const [source, domains] of Object.entries(sources)) {
      if (domains.some(d => from.includes(d))) return source;
    }
    return 'other';
  }
  
  // Check if recurring (seen before with same merchant + amount)
  isRecurring(transaction) {
    const key = `${transaction.merchant}-${transaction.amount}`;
    return this.knownSubscriptions.has(key);
  }
  
  // Update finances API with new recurring payments
  async updateFinances(transactions) {
    try {
      const axios = require('axios');
      const recurring = transactions.filter(t => 
        t.type === 'subscription' || this.isRecurring(t)
      );
      
      // Get existing recurring
      const existing = await axios.get(`${this.bot.config.apiUrl}/api/finances/recurring`);
      const existingList = existing.data.recurring || [];
      
      // Add new recurring payments
      for (const payment of recurring) {
        const exists = existingList.find(r => 
          r.merchant === payment.merchant && r.amount === payment.amount
        );
        
        if (!exists && payment.amount < 500) { // Flag large amounts
          // Would POST to API in production
          console.log(`New recurring: ${payment.merchant} - $${payment.amount}`);
        }
        
        // Track it
        this.knownSubscriptions.set(
          `${payment.merchant}-${payment.amount}`,
          { ...payment, status: 'active' }
        );
      }
    } catch (e) {
      console.log('Update finances failed:', e.message);
    }
  }
  
  // Format daily summary (bougie/mouthy style)
  formatDailySummary(transactions) {
    const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const subscriptions = transactions.filter(t => t.type === 'subscription');
    
    let msg = `📊 **DAILY FINANCIAL BRIEF**\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `💰 **Income:** $${income.toFixed(2)}\n`;
    msg += `💸 **Expenses:** $${expenses.toFixed(2)}\n`;
    msg += `📈 **Net:** $${(income - expenses).toFixed(2)}\n\n`;
    
    if (subscriptions.length > 0) {
      msg += `🔄 **Subscriptions Detected:** ${subscriptions.length}\n`;
      for (const sub of subscriptions.slice(0, 3)) {
        msg += `- ${sub.merchant}: $${sub.amount}\n`;
      }
    }
    
    if (expenses > 100) {
      msg += `\n⚠️ Might I remind you that spending $${expenses.toFixed(2)} in a day is... ambitious?`;
    }
    
    return msg;
  }
  
  // Format weekly report
  formatWeeklyReport(transactions) {
    const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    
    let msg = `👑 **WEEKLY FINANCIAL REPORT**\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `💰 **Income:** $${income.toFixed(2)}\n`;
    msg += `💸 **Expenses:** $${expenses.toFixed(2)}\n`;
    msg += `📈 **Net:** $${(income - expenses).toFixed(2)}\n\n`;
    
    const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0;
    msg += `💡 **Savings Rate:** ${savingsRate}%\n\n`;
    
    if (savingsRate < 10) {
      msg += `*Might I suggest... living within your means?* 🤨`;
    } else if (savingsRate > 30) {
      msg += `*Quite frugal of you. I suppose that's... acceptable.* 👍`;
    }
    
    return msg;
  }
  
  // Send to round table
  async sendToRoundTable(message) {
    try {
      const channel = await this.bot.client.channels.fetch(this.bot.config.roundTableChannel);
      if (channel) await channel.send(message);
    } catch (e) {
      console.log('Round table send failed:', e.message);
    }
  }
  
  // Send DM to user
  async sendDM(message) {
    try {
      const user = await this.bot.client.users.fetch(process.env.OWNER_ID);
      if (user) await user.send(message);
    } catch (e) {
      console.log('DM send failed:', e.message);
    }
  }
}

module.exports = SirClawthchilds;
