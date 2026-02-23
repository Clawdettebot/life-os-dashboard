/**
 * Weekly Finance
 * Generates weekly summary of expenses, opportunities, and upcoming bills
 * Sends to Discord Report Generator
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const FINANCES_FILE = path.join(__dirname, 'data/finances.json');
const OPPORTUNITIES_FILE = path.join(__dirname, 'data/opportunities.json');
const CREDENTIALS_FILE = path.join(__dirname, 'data/google-credentials.json');
const TOKEN_FILE = path.join(__dirname, 'data/google-calendar-token.json');

class WeeklyReport {
  constructor() {
    this.finances = [];
    this.opportunities = [];
  }

  loadData() {
    if (fs.existsSync(FINANCES_FILE)) {
      this.finances = JSON.parse(fs.readFileSync(FINANCES_FILE));
    }
    if (fs.existsSync(OPPORTUNITIES_FILE)) {
      this.opportunities = JSON.parse(fs.readFileSync(OPPORTUNITIES_FILE));
    }
  }

  getLastWeekRange() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start: weekAgo.getTime(), end: now.getTime() };
  }

  generate() {
    this.loadData();
    
    const { start, end } = this.getLastWeekRange();
    const weekExpenses = this.finances.filter(f => 
      f.type === 'expense' && f.date >= start && f.date <= end
    );
    const weekIncome = this.finances.filter(f => 
      f.type === 'income' && f.date >= start && f.date <= end
    );
    
    // Email-detected this week
    const emailExpenses = weekExpenses.filter(f => f.source === 'email');
    
    // Recurring expenses
    const recurring = this.finances.filter(f => f.recurring?.is_recurring);
    const monthlyRecurring = recurring.filter(f => f.recurring.frequency === 'monthly');
    const monthlyTotal = monthlyRecurring.reduce((sum, f) => sum + Number(f.amount), 0);
    
    // Upcoming bills (next 7 days)
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const upcomingBills = recurring
      .map(exp => {
        let nextDue = exp.date;
        const freq = exp.recurring?.frequency;
        while (nextDue < now) {
          if (freq === 'monthly') nextDue += 30 * 24 * 60 * 60 * 1000;
          else if (freq === 'yearly') nextDue += 365 * 24 * 60 * 60 * 1000;
          else break;
        }
        return { ...exp, nextDue };
      })
      .filter(exp => exp.nextDue - now < sevenDays)
      .sort((a, b) => a.nextDue - b.nextDue);
    
    // Pending opportunities
    const pendingOpps = this.opportunities.filter(o => o.status === 'pending');
    const urgentOpps = pendingOpps.filter(o => o.priority === 'high');
    
    // Build report
    const totalExpenses = weekExpenses.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalIncome = weekIncome.reduce((sum, f) => sum + Number(f.amount), 0);
    
    // Category breakdown
    const byCategory = weekExpenses.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + Number(f.amount);
      return acc;
    }, {});
    
    const report = {
      period: `Week of ${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      summary: {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses,
        newExpensesFound: emailExpenses.length,
        recurringMonthly: monthlyTotal
      },
      upcomingBills,
      pendingOpportunities: pendingOpps.length,
      urgentOpportunities: urgentOpps.length,
      byCategory,
      generatedAt: Date.now()
    };
    
    return report;
  }

  formatDiscordMessage(report) {
    const { summary, upcomingBills, pendingOpportunities, urgentOpportunities, byCategory } = report;
    
    let message = `📊 **WEEKLY FINANCE REPORT** — ${report.period}\n\n`;
    
    // Summary
    message += `**💰 Summary**\n`;
    message += `• Income: $${summary.income.toLocaleString()}\n`;
    message += `• Expenses: $${summary.expenses.toLocaleString()}\n`;
    message += `• Net: $${summary.net.toLocaleString()}\n`;
    message += `• Email expenses found: ${summary.newExpensesFound}\n`;
    message += `• Monthly recurring: $${summary.recurringMonthly.toFixed(2)}\n\n`;
    
    // Upcoming bills
    if (upcomingBills.length > 0) {
      message += `📅 **Upcoming Bills (7 days)**\n`;
      const total = upcomingBills.reduce((sum, b) => sum + Number(b.amount), 0);
      upcomingBills.forEach(bill => {
        const date = new Date(bill.nextDue).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        message += `• ${bill.title}: $${Number(bill.amount).toFixed(2)} (${date})\n`;
      });
      message += `**Total due: $${total.toFixed(2)}**\n\n`;
    }
    
    // Opportunities
    if (pendingOpportunities > 0) {
      message += `💡 **Money Opportunities**\n`;
      message += `• ${pendingOpportunities} pending action`;
      if (urgentOpportunities > 0) {
        message += ` (${urgentOpportunities} urgent!)`;
      }
      message += `\n`;
      if (urgentOpportunities > 0) {
        message += `⚠️ Check your dashboard for urgent items!\n`;
      }
      message += `\n`;
    }
    
    // Category breakdown
    if (Object.keys(byCategory).length > 0) {
      message += `📈 **Expenses by Category**\n`;
      const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
      sorted.forEach(([cat, amount]) => {
        message += `• ${cat}: $${amount.toFixed(2)}\n`;
      });
    }
    
    message += `\n🔗 View details: https://lifeos.blog`;
    
    return message;
  }

  async sendToDiscord(report) {
    const message = this.formatDiscordMessage(report);
    console.log('Report:\n', message);
    
    // Would send to Discord here
    return message;
  }
}

// Run if executed directly
if (require.main === module) {
  const reporter = new WeeklyReport();
  const report = reporter.generate();
  reporter.sendToDiscord(report).then(msg => {
    console.log('\n✅ Report generated!');
    process.exit(0);
  });
}

module.exports = WeeklyReport;
