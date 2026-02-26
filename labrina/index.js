/**
 * Labrina - Social Media Maven
 * Posts content, tracks stats, updates Life OS
 * Manages Content Scheduler & sends post reminders
 * NOW WITH CHAT! 💬 (Powered by Gemini)
 */

const { Events } = require('discord.js');
const { CronJob } = require('cron');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Supabase Setup for Blog
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://yyoxpcsspmjvolteknsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM';
const supabase = createClient(supabaseUrl, supabaseKey);

class Labrina {
  constructor(bot) {
    this.bot = bot;
    this.name = 'Labrina';
    this.role = 'Social Media Maven';
    this.active = true;
    
    // Daily social stats - 10 AM Pacific (6PM UTC)
    this.dailyStatsCron = new CronJob('0 18 * * *', () => this.dailyStats());
    
    // Content schedule check - every hour to send reminders
    this.reminderCheckCron = new CronJob('0 * * * *', () => this.checkReminders());
    
    // Morning schedule preview - 9 AM Pacific (5PM UTC)
    this.scheduleCheckCron = new CronJob('0 17 * * *', () => this.checkSchedule());
  }
  
  start() {
    this.dailyStatsCron.start();
    this.reminderCheckCron.start();
    this.scheduleCheckCron.start();
    console.log('📱 Labrina started - Stats: 6PM UTC, Reminders: Hourly, Schedule: 5PM UTC');
  }
  
  stop() {
    this.dailyStatsCron.stop();
    this.scheduleCheckCron.stop();
    console.log('📱 Labrina stopped');
  }

  // Handle incoming chat messages
  async handleMessage(message) {
    // Show typing indicator
    await message.channel.sendTyping();

    try {
      // Check for special commands first
      const content = message.content.toLowerCase();
      const rawContent = message.content;

      if (content === '!schedule' || content === '!calendar') {
        await this.checkSchedule();
        await message.reply("Here's the upcoming schedule! 📅 (See above)");
        return;
      }

      // Blog Commands
      if (content.startsWith('!drafts')) {
        await this.listDrafts(message);
        return;
      }

      if (content.startsWith('!publish')) {
        const id = rawContent.split(' ')[1];
        await this.publishDraft(message, id);
        return;
      }

      if (content.startsWith('!save')) {
        // Usage: !save [Title] | [Content]
        const parts = rawContent.replace('!save', '').split('|');
        if (parts.length < 2) {
          await message.reply("Usage: `!save Title | Content`");
          return;
        }
        const title = parts[0].trim();
        const contentBody = parts.slice(1).join('|').trim();
        await this.saveDraft(message, title, contentBody);
        return;
      }

      // Check for POST command
      if (content.startsWith('!post')) {
        const postContent = message.content.replace('!post', '').trim();
        if (!postContent) {
          await message.reply("What do you want me to post? Usage: `!post [content]`");
          return;
        }
        
        await message.reply("🚀 Sending to Postbridge...");
        const result = await this.postSocial(postContent);
        
        if (result.success) {
          await message.reply("✅ Posted successfully! 🐦");
        } else {
          await message.reply(`❌ Post failed: ${result.error}`);
        }
        return;
      }

      // Check for Accounts command
      if (content === '!accounts') {
        await message.reply("📋 Fetching your connected accounts...");
        const accounts = await this.getAccounts();
        
        if (!accounts || accounts.length === 0) {
          await message.reply("❌ No accounts found.");
          return;
        }
        
        let reply = "📱 **Connected Accounts:**\n\n";
        accounts.forEach(acc => {
          reply += `**${acc.platform}**: ${acc.username || acc.name || 'ID: ' + acc.id}\n`;
        });
        
        await message.reply(reply);
        return;
      }

      // Check for Video Post command
      if (content.startsWith('!postvideo')) {
        // Check for attachments
        const attachments = Array.from(message.attachments.values());
        const videoAttachment = attachments.find(a => a.contentType?.startsWith('video/'));
        
        let caption = message.content.replace('!postvideo', '').trim();
        
        if (!videoAttachment && !caption) {
          await message.reply("Usage: `!postvideo [caption]` (attach a video to the message)");
          return;
        }

        const videoUrl = videoAttachment ? videoAttachment.url : null;
        
        if (!videoUrl) {
          await message.reply("❌ No video attached! Attach a video to post.");
          return;
        }

        await message.reply("🎬 Uploading video to Postbridge...");
        
        // Detect platforms from caption or default to all
        const platforms = caption.includes('#tiktok') ? ['tiktok'] : 
                         caption.includes('#twitter') ? ['twitter'] : 
                         caption.includes('#instagram') ? ['instagram'] : ['twitter', 'instagram', 'tiktok'];
        
        const result = await this.postVideo(caption, videoUrl, platforms);
        
        if (result.success) {
          await message.reply(`✅ Video posted! ID: ${result.postId}`);
        } else {
          await message.reply(`❌ Failed: ${result.error}`);
        }
        return;
      }

      // 🧠 MEMORY UPDATE: Fetch recent chat context
      const history = await message.channel.messages.fetch({ limit: 50 });
      const context = history.reverse().map(msg => {
        const role = msg.author.bot ? 'Labrina' : 'User';
        // Skip system/error messages to keep context clean
        if (msg.content.includes('Error processing')) return null;
        return `${role}: ${msg.content}`;
      }).filter(Boolean).join('\n');

      // Call Gemini API for chat with Context
      const response = await this.callGemini(message.content, context);
      
      // Reply with AI response (handle length limits)
      await this.safeReply(message, response);
      
    } catch (e) {
      console.error('Labrina chat error:', e);
      await message.reply("My wifi is acting up... 📶 (Error processing message)");
    }
  }

  // Helper: Send message without hitting Discord limits
  async safeReply(message, text) {
    const MAX_LEN = 1900; // Leave room for formatting
    if (text.length <= MAX_LEN) {
      await message.reply(text);
    } else {
      // Split into chunks
      const chunks = text.match(/.{1,1900}/g);
      await message.reply(chunks[0] + "\n\n_(Message too long, sending rest...)_");
      for (let i = 1; i < chunks.length; i++) {
        await message.channel.send(chunks[i]);
      }
    }
  }

  async callGemini(prompt, chatHistory = "") {
    try {
      // Try ZAI first, fall back to Gemini
      const zaiKey = process.env.ZAI_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      
      let apiKey = zaiKey || geminiKey;
      let useZAI = !!zaiKey;
      
      if (!apiKey) return "I need my API key to think! (Add ZAI_API_KEY or GEMINI_API_KEY to .env)";

      // Load Identity, Lessons & Brand Context
      let identity = '';
      let lessons = '';
      let brandContext = '';
      try {
        const soulPath = path.join(__dirname, 'SOUL.md');
        identity = await fs.readFile(soulPath, 'utf8');
      } catch (e) { identity = "Labrina: Social Media Maven."; }

      try {
        const dojoPath = path.join(__dirname, 'DOJO.md');
        lessons = await fs.readFile(dojoPath, 'utf8');
      } catch (e) { lessons = "No lessons recorded yet."; }

      try {
        const brandPath = path.join(__dirname, 'brand-context.md');
        brandContext = await fs.readFile(brandPath, 'utf8');
      } catch (e) { brandContext = "No brand context yet."; }

      const systemPrompt = `You are Labrina, the Social Media Maven for the Creative Empire.

${identity}

RECENT CHAT HISTORY:
${chatHistory}

YOUR PAST LESSONS (DOJO):
${lessons}

IMPORTANT INSTRUCTIONS:
- You have access to your SOUL and DOJO files.
- If you make a mistake, admit it, learn from it, and update your DOJO.md.
- If you are confused, ask for clarification.
- ALWAYS reference your DOJO to avoid repeating past errors.
- Follow the user's tone preference (e.g., if they say "no emojis", don't use emojis).

User: ${prompt}`;

      let response;
      if (useZAI) {
        // ZAI uses OpenAI-compatible API
        response = await axios.post('https://api.z.ai/api/coding/paas/v4/chat/completions', {
          model: 'glm-5',
          messages: [{ role: 'user', content: systemPrompt }],
          max_tokens: 4096
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        if (response.data.choices && response.data.choices.length > 0) {
          return response.data.choices[0].message.content;
        } else {
          console.error('ZAI Unexpected Response:', JSON.stringify(response.data));
          return "I'm thinking... but the thoughts aren't forming. (ZAI API Format Error)";
        }
      } else {
        // Fall back to Gemini
        response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          contents: [{
            parts: [{ text: systemPrompt }]
          }]
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.candidates && response.data.candidates.length > 0) {
          return response.data.candidates[0].content.parts[0].text;
        } else {
          console.error('Gemini Unexpected Response:', JSON.stringify(response.data));
          return "I'm thinking... but the thoughts aren't forming. (API Format Error)";
        }
      }
    } catch (e) {
      console.error('API Error:', e.response ? JSON.stringify(e.response.data) : e.message);
      return `My brain is buffering... (${e.response ? e.response.status : 'Network'} Error)`;
    }
  }
  
  // Daily stats report
  async dailyStats() {
    try {
      const stats = await this.getSocialStats();
      await this.updateLifeOSStats(stats);
      const report = this.formatStatsReport(stats);
      await this.sendToRoundTable(report);
      await this.sendDM(report);
    } catch (e) {
      console.log('Daily stats failed:', e.message);
    }
  }
  
  // Check for upcoming posts and send reminders
  async checkReminders() {
    try {
      const response = await axios.get(`${this.bot.config.apiUrl}/api/content/calendar/all`);
      const { events = [] } = response.data;
      
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      const upcoming = events.filter(post => {
        if (post.status !== 'pending') return false;
        const postDate = new Date(post.date);
        return postDate > now && postDate <= oneHourFromNow;
      });
      
      for (const post of upcoming) {
        const timeStr = new Date(post.date).toLocaleTimeString('en-US', { 
          hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
        });
        
        const emoji = this.getPlatformEmoji(post.platform);
        const reminder = `⏰ **Post Reminder** ${emoji}\n`
          + `**${post.title}**\n`
          + `Platform: ${post.platform}\n`
          + `Time: ${timeStr} PT\n`
          + `Type: ${post.content_type}`;
        
        await this.sendToRoundTable(reminder);
        await this.sendDM(reminder);
      }
    } catch (e) {
      console.log('Reminder check failed:', e.message);
    }
  }
  
  getPlatformEmoji(platform) {
    const emojis = { instagram: '📸', tiktok: '🎵', twitter: '🐦', threads: '🧵', youtube: '📺' };
    return emojis[platform] || '📱';
  }

  async checkSchedule() {
    try {
      const response = await axios.get(`${this.bot.config.apiUrl}/api/content/calendar/all`);
      const { events = [] } = response.data;
      
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const upcoming = events.filter(post => {
        if (post.status !== 'pending') return false;
        const postDate = new Date(post.date);
        return postDate >= now && postDate <= tomorrow;
      });
      
      if (upcoming.length > 0) {
        let report = `📅 **Today's Content Schedule**\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        for (const post of upcoming) {
          const time = new Date(post.date).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
          });
          const emoji = this.getPlatformEmoji(post.platform);
          report += `${emoji} **${time} PT** - ${post.title}\n`;
          report += `   📂 ${post.content_type}\n\n`;
        }
        await this.sendToRoundTable(report);
      }
    } catch (e) {
      console.log('Schedule check failed:', e.message);
    }
  }
  
  async getSocialStats() {
    return {
      twitter: { followers: 0, engagement: 0 },
      instagram: { followers: 0, engagement: 0 },
      youtube: { subscribers: 0, views: 0 }
    };
  }
  
  async updateLifeOSStats(stats) {
    try {
      await axios.post(`${this.bot.config.apiUrl}/api/social/stats`, {
        date: new Date().toISOString(),
        stats: stats
      });
    } catch (e) {}
  }
  
  formatStatsReport(stats) {
    let msg = `📊 **Social Stats** - ${new Date().toLocaleDateString()}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (stats.twitter?.followers) msg += `🐦 Twitter: ${stats.twitter.followers.toLocaleString()} followers\n`;
    if (stats.instagram?.followers) msg += `📸 Instagram: ${stats.instagram.followers.toLocaleString()} followers\n`;
    if (stats.youtube?.subscribers) msg += `📺 YouTube: ${stats.youtube.subscribers.toLocaleString()} subs\n`;
    if (!stats.twitter?.followers && !stats.instagram?.followers) {
      msg += `⚠️ Social APIs not configured yet.\nAdd credentials to enable tracking.`;
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
      const user = await this.bot.client.users.fetch(process.env.USER_ID);
      if (user) await user.send(message);
    } catch (e) {
      console.log('DM send failed:', e.message);
    }
  }

  // Send message to Clawdette (Master Agent)
  async messageClawdette(message) {
    try {
      // Using sessions_send if available, or just DM the user (since user IS Clawdette)
      // For now, let's just DM the user "from Labrina" to simulate it.
      await this.sendDM(`📢 **Labrina Report:** ${message}`);
    } catch (e) {
      console.log('Message to Clawdette failed:', e.message);
    }
  }

  // Save to File System
  async updateFile(filename, content) {
    try {
      const filePath = path.join(__dirname, filename);
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`Labrina updated ${filename}`);
      return true;
    } catch (e) {
      console.error('File write error:', e);
      return false;
    }
  }

  // Post to Socials via Postbridge
  async postSocial(content, platforms = ['twitter']) {
    try {
      const apiKey = process.env.POSTBRIDGE_API_KEY;
      if (!apiKey) return { success: false, error: 'Missing POSTBRIDGE_API_KEY' };

      const response = await axios.post('https://api.postbridge.cloud/v1/posts', {
        text: content,
        platforms: platforms
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      return { success: true, data: response.data };
    } catch (e) {
      console.error('Postbridge Error:', e.response ? e.response.data : e.message);
      return { success: false, error: e.message };
    }
  }

  // Post Video via Postbridge
  async postVideo(caption, videoUrl, platforms = ['twitter']) {
    try {
      const apiKey = process.env.POSTBRIDGE_API_KEY;
      if (!apiKey) return { success: false, error: 'Missing POSTBRIDGE_API_KEY' };

      // Step 1: Get social accounts
      const accountsRes = await axios.get('https://api.postbridge.cloud/v1/social-accounts', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const accounts = accountsRes.data.data;
      
      // Get IDs for requested platforms
      const accountIds = accounts
        .filter(a => platforms.includes(a.platform))
        .map(a => a.id);
      
      if (accountIds.length === 0) return { success: false, error: 'No accounts found for platforms: ' + platforms.join(', ') };

      // Step 2: Create media upload URL (mock - we need actual file size/type)
      // For Discord attachments, we can try to fetch the file to get size, or just guess
      // Since we can't easily get file size from a URL, we'll use media_urls instead
      
      const postRes = await axios.post('https://api.postbridge.cloud/v1/posts', {
        caption: caption,
        media_urls: [videoUrl],
        social_accounts: accountIds,
        platform_configurations: {
          twitter: { caption: caption },
          tiktok: { caption: caption }
        }
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });

      return { success: true, data: postRes.data, postId: postRes.data.id };
    } catch (e) {
      console.error('Postbridge Video Error:', e.response ? JSON.stringify(e.response.data) : e.message);
      return { success: false, error: e.message };
    }
  }

  // Get Social Accounts
  async getAccounts() {
    try {
      const apiKey = process.env.POSTBRIDGE_API_KEY;
      const response = await axios.get('https://api.postbridge.cloud/v1/social-accounts', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.data.data;
    } catch (e) {
      console.error('Get Accounts Error:', e.response ? e.response.data : e.message);
      return [];
    }
  }

  // Blog Functions (Supabase)
  async listDrafts(message) {
    try {
      const { data, error } = await supabase
        .from('blog_post')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        await message.reply("No drafts found!");
        return;
      }

      let reply = "📝 **Recent Drafts:**\n\n";
      data.forEach(post => {
        reply += `**${post.title}**\n`;
        reply += `ID: \`${post.id}\` | Created: ${new Date(post.created_at).toLocaleDateString()}\n`;
        reply += `${post.content.substring(0, 100)}...\n\n`;
      });

      await message.reply(reply);
    } catch (e) {
      await message.reply(`Error fetching drafts: ${e.message}`);
    }
  }

  async saveDraft(message, title, contentBody) {
    try {
      const { data, error } = await supabase
        .from('blog_post')
        .insert([
          {
            title: title,
            content: contentBody,
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      await message.reply(`✅ Draft saved! Title: "${title}"`);
    } catch (e) {
      await message.reply(`Error saving draft: ${e.message}`);
    }
  }

  async publishDraft(message, id) {
    try {
      const { data, error } = await supabase
        .from('blog_post')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;

      await message.reply(`🚀 Post Published! ID: ${id}`);
    } catch (e) {
      await message.reply(`Error publishing: ${e.message}`);
    }
  }
}

module.exports = Labrina;