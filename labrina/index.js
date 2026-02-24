/**
 * Labrina - Social Media Maven
 * Pulls social stats, schedules posts, monitors content
 */

const { Events } = require('discord.js');
const { CronJob } = require('cron');

class Labrina {
  constructor(bot) {
    this.bot = bot;
    this.name = 'Labrina';
    this.role = 'Social Media Maven';
    this.active = true;
    
    // Social platforms
    this.platforms = ['twitter', 'instagram', 'youtube'];
    
    // Daily stats check at 10 AM Pacific
    this.dailyStatsCron = new CronJob('0 18 * * *', () => this.dailyStats());
    
    // Content check at noon Pacific
    this.contentCheckCron = new CronJob('0 17 * * *', () => this.checkContent());
  }
  
  start() {
    this.dailyStatsCron.start();
    this.contentCheckCron.start();
    console.log('📱 Labrina started - Stats: 6PM UTC, Content: 5PM UTC');
  }
  
  stop() {
    this.dailyStatsCron.stop();
    this.contentCheckCron.stop();
    console.log('📱 Labrina stopped');
  }
  
  // Daily social stats report
  async dailyStats() {
    try {
      const stats = await this.fetchSocialStats();
      const report = this.formatStatsReport(stats);
      
      await this.sendToRoundTable(report);
      await this.sendDM(report);
    } catch (e) {
      console.log('Daily stats failed:', e.message);
    }
  }
  
  // Check Google Drive for new content
  async checkContent() {
    try {
      const content = await this.checkDriveContent();
      if (content.length > 0) {
        const report = this.formatContentReport(content);
        await this.sendToRoundTable(report);
      }
    } catch (e) {
      console.log('Content check failed:', e.message);
    }
  }
  
  // Fetch social stats from PostBridge
  async fetchSocialStats() {
    const stats = {};
    
    // Check for PostBridge credentials
    if (!process.env.POSTBRIDGE_API_KEY) {
      console.log('Labrina: PostBridge API key not configured');
      return null;
    }
    
    try {
      const axios = require('axios');
      
      // Twitter stats
      try {
        const twitter = await axios.get('https://api.postbridge.io/v1/twitter/me', {
          headers: { 'Authorization': `Bearer ${process.env.POSTBRIDGE_API_KEY}` }
        });
        stats.twitter = twitter.data;
      } catch (e) {
        stats.twitter = { error: e.message };
      }
      
      // Instagram stats
      try {
        const instagram = await axios.get('https://api.postbridge.io/v1/instagram/me', {
          headers: { 'Authorization': `Bearer ${process.env.POSTBRIDGE_API_KEY}` }
        });
        stats.instagram = instagram.data;
      } catch (e) {
        stats.instagram = { error: e.message };
      }
      
      // YouTube stats
      try {
        const youtube = await axios.get('https://api.postbridge.io/v1/youtube/me', {
          headers: { 'Authorization': `Bearer ${process.env.POSTBRIDGE_API_KEY}` }
        });
        stats.youtube = youtube.data;
      } catch (e) {
        stats.youtube = { error: e.message };
      }
      
    } catch (e) {
      console.log('PostBridge fetch error:', e.message);
    }
    
    return stats;
  }
  
  // Check Google Drive for new content
  async checkDriveContent() {
    const content = [];
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.log('Labrina: Google Drive not configured');
      return content;
    }
    
    // This would use Google Drive API in production
    // For now, returns empty - needs credentials
    
    return content;
  }
  
  formatStatsReport(stats) {
    if (!stats) {
      return `📊 **Social Stats**
━━━━━━━━━━━━━━━━━━━━
⚠️ PostBridge API not configured.
Reply with API keys to enable.`;
    }
    
    let msg = `📊 **Social Stats** - ${new Date().toLocaleDateString()}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (stats.twitter && !stats.twitter.error) {
      msg += `🐦 **Twitter:** ${stats.twitter.followers || 'N/A'} followers\n`;
    }
    if (stats.instagram && !stats.instagram.error) {
      msg += `📸 **Instagram:** ${stats.instagram.followers || 'N/A'} followers\n`;
    }
    if (stats.youtube && !stats.youtube.error) {
      msg += `📺 **YouTube:** ${stats.youtube.subscribers || 'N/A'} subscribers\n`;
    }
    
    return msg;
  }
  
  formatContentReport(content) {
    let msg = `📁 **New Content Found**\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    for (const item of content) {
      msg += `- ${item.name} (${item.type})\n`;
    }
    
    return msg;
  }
  
  async sendToRoundTable(message) {
    try {
      const channel = await this.bot.client.channels.fetch(this.bot.config.roundTableChannel);
      if (channel) await channel.send(message);
    } catch (e) {
      console.log('Round table send failed:', e.message);
    }
  }
  
  async sendDM(message) {
    try {
      const user = await this.bot.client.users.fetch(process.env.OWNER_ID);
      if (user) await user.send(message);
    } catch (e) {
      console.log('DM send failed:', e.message);
    }
  }
}

module.exports = Labrina;
