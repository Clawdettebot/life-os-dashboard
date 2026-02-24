/**
 * Knaight of Affairs - Schedule Guardian
 * Runs on existing Knowledge Knaight bot as secondary personality
 */

const { Events } = require('discord.js');

// Cron scheduler for periodic checks
const { CronJob } = require('cron');

class KnaightOfAffairs {
  constructor(bot) {
    this.bot = bot;
    this.name = 'Knaight of Affairs';
    this.role = 'Schedule Guardian';
    this.active = true;
    
    // Morning scan time (8 AM Pacific = 4 PM UTC)
    this.morningCron = new CronJob('0 16 * * *', () => this.morningBrief());
    
    // Hourly check for upcoming events
    this.hourlyCron = new CronJob('0 * * * *', () => this.hourlyCheck());
  }
  
  start() {
    this.morningCron.start();
    this.hourlyCron.start();
    console.log('📅 Knaight of Affairs started - Morning: 4PM UTC, Hourly checks');
  }
  
  stop() {
    this.morningCron.stop();
    this.hourlyCron.stop();
    console.log('📅 Knaight of Affairs stopped');
  }
  
  // Morning Brief - 8 AM Pacific
  async morningBrief() {
    try {
      const events = await this.getCalendarEvents(7);
      const streams = events.filter(e => 
        e.title?.toLowerCase().includes('stream') || 
        e.title?.toLowerCase().includes('live')
      );
      const meetings = events.filter(e => 
        e.title?.toLowerCase().includes('meeting') ||
        e.title?.toLowerCase().includes('call') ||
        e.title?.toLowerCase().includes('standup')
      );
      
      const message = this.formatMorningBrief(events.length, streams.length, meetings.length);
      await this.sendToRoundTable(message);
      await this.sendDM(message);
    } catch (e) {
      console.log('Morning brief failed:', e.message);
    }
  }
  
  // Hourly check for upcoming events
  async hourlyCheck() {
    try {
      const events = await this.getCalendarEvents(1);
      const urgent = events.filter(e => this.isUrgent(e));
      
      for (const event of urgent) {
        const message = this.formatUrgentAlert(event);
        await this.sendToRoundTable(message);
      }
    } catch (e) {
      console.log('Hourly check failed:', e.message);
    }
  }
  
  // Get calendar events from API
  async getCalendarEvents(days = 7) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.bot.config.apiUrl}/api/google-calendar/upcoming?days=${days}`);
      return response.data.events || [];
    } catch (e) {
      return [];
    }
  }
  
  // Check if event is urgent (< 1 hour)
  isUrgent(event) {
    if (!event.start) return false;
    const eventTime = new Date(event.start);
    const now = new Date();
    const diff = eventTime - now;
    const hours = diff / (1000 * 60 * 60);
    return hours > 0 && hours <= 1;
  }
  
  // Format morning brief
  formatMorningBrief(totalEvents, streamCount, meetingCount) {
    return `📅 **DAILY BRIEF**
━━━━━━━━━━━━━━━━━━━━━
**Events today:** ${totalEvents}
**Streams:** ${streamCount}
**Meetings:** ${meetingCount}

I'll post reminders before your streams and meetings.`;
  }
  
  // Format urgent alert
  formatUrgentAlert(event) {
    const time = new Date(event.start).toLocaleTimeString('en-US', { 
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit'
    });
    return `⏰ **URGENT: ${event.title}**
Time: ${time} Pacific
${event.location || ''}`;
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

module.exports = KnaightOfAffairs;
