/**
 * Labrina - Social Media Maven
 * Posts content, tracks stats, updates Life OS
 */

const { Events } = require('discord.js');
const { CronJob } = require('cron');

class Labrina {
  constructor(bot) {
    this.bot = bot;
    this.name = 'Labrina';
    this.role = 'Social Media Maven';
    this.active = true;
    
    // Daily social stats - 10 AM Pacific
    this.dailyStatsCron = new CronJob('0 18 * * *', () => this.dailyStats());
    
    // Content schedule check - noon Pacific
    this.scheduleCheckCron = new CronJob('0 17 * * *', () => this.checkSchedule());
  }
  
  start() {
    this.dailyStatsCron.start();
    this.scheduleCheckCron.start();
    console.log('📱 Labrina started - Stats: 6PM UTC, Schedule: 5PM UTC');
  }
  
  stop() {
    this.dailyStatsCron.stop();
    this.scheduleCheckCron.stop();
    console.log('📱 Labrina stopped');
  }
  
  // Daily stats report
  async dailyStats() {
    try {
      // Use Supabase to get stats history
      const axios = require('axios');
      const stats = await this.getSocialStats();
      
      // Update Life OS dashboard
      await this.updateLifeOSStats(stats);
      
      // Report to round table
      const report = this.formatStatsReport(stats);
      await this.sendToRoundTable(report);
      await this.sendDM(report);
    } catch (e) {
      console.log('Daily stats failed:', e.message);
    }
  }
  
  // Check content schedule
  async checkSchedule() {
    try {
      // Read content calendar from Life OS
      const axios = require('axios');
      const response = await axios.get(`${this.bot.config.apiUrl}/api/content/calendar`);
      const calendar = response.data;
      
      // Find content for today/tomorrow
      const upcoming = this.findUpcomingContent(calendar);
      
      if (upcoming.length > 0) {
        const report = `📅 **Upcoming Content**\n${upcoming.map(c => `- ${c.title}`).join('\n')}`;
        await this.sendToRoundTable(report);
      }
    } catch (e) {
      console.log('Schedule check failed:', e.message);
    }
  }
  
  // Get social stats (from Supabase or API)
  async getSocialStats() {
    // TODO: Connect to social APIs when credentials provided
    // For now, return mock or stored data
    return {
      twitter: { followers: 0, engagement: 0 },
      instagram: { followers: 0, engagement: 0 },
      youtube: { subscribers: 0, views: 0 }
    };
  }
  
  // Update Life OS with stats
  async updateLifeOSStats(stats) {
    try {
      const axios = require('axios');
      
      // Store in Supabase
      await axios.post(`${this.bot.config.apiUrl}/api/social/stats`, {
        date: new Date().toISOString(),
        stats: stats
      });
    } catch (e) {
      console.log('Update Life OS failed:', e.message);
    }
  }
  
  // Find upcoming content
  findUpcomingContent(calendar) {
    if (!calendar || !calendar.weeks) return [];
    
    const now = new Date();
    const upcoming = [];
    
    for (const week of calendar.weeks || []) {
      for (const day of week.days || []) {
        const dayDate = new Date(2025, 1, day.date); // Feb 2025
        const diffDays = Math.ceil((dayDate - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 2 && day.content?.release) {
          upcoming.push({
            title: day.content.release || 'Release',
            date: day.date,
            platform: day.content.platform || 'All'
          });
        }
      }
    }
    
    return upcoming;
  }
  
  // Format stats report
  formatStatsReport(stats) {
    let msg = `📊 **Social Stats** - ${new Date().toLocaleDateString()}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (stats.twitter?.followers) {
      msg += `🐦 Twitter: ${stats.twitter.followers.toLocaleString()} followers\n`;
    }
    if (stats.instagram?.followers) {
      msg += `📸 Instagram: ${stats.instagram.followers.toLocaleString()} followers\n`;
    }
    if (stats.youtube?.subscribers) {
      msg += `📺 YouTube: ${stats.youtube.subscribers.toLocaleString()} subs\n`;
    }
    
    if (!stats.twitter?.followers && !stats.instagram?.followers) {
      msg += `⚠️ Social APIs not configured yet.\n`;
      msg += `Add credentials to enable tracking.`;
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
  
  // Send DM
  async sendDM(message) {
    try {
      const user = await this.bot.client.users.fetch(process.env.OWNER_ID);
      if (user) await user.send(message);
    } catch (e) {
      console.log('DM send failed:', e.message);
    }
  }
  
  // Post content (called by me or schedule)
  async postContent(platform, message, options = {}) {
    try {
      // Use Discord message to post (or integrate with social APIs)
      const channel = await this.bot.client.channels.fetch(options.channelId || this.bot.config.roundTableChannel);
      if (channel) {
        await channel.send(`[CROSS-POST] ${message}`);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = Labrina;
