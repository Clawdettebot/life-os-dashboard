/**
 * Discord Bot Integration for Knowledge Knaight
 * Run this as a separate process or integrate into main server
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();
const axios = require('axios');

class KnowledgeKnaightBot {
  constructor(config) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
      ]
    });
    
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:3000',
      allowedChannels: config.allowedChannels || [],
      ...config
    };
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on(Events.Ready, () => {
      console.log(`🤖 Knowledge Knaight logged in as ${this.client.user.tag}`);
    });

    this.client.on(Events.MessageCreate, async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;
      
      // Check if in allowed channel
      if (this.config.allowedChannels.length > 0 && 
          !this.config.allowedChannels.includes(message.channelId)) {
        return;
      }

      // Handle commands
      if (message.content.startsWith('!')) {
        await this.handleCommand(message);
        return;
      }

      // Auto-process URLs
      await this.processURLs(message);
    });
  }

  async handleCommand(message) {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
      switch (command) {
        case 'ingest':
          if (args.length === 0) {
            await message.reply('Usage: `!ingest <url> [section]`');
            return;
          }
          await this.handleIngest(message, args);
          break;

        case 'cortex':
          if (args.length === 0) {
            await message.reply('Usage: `!cortex <search query>`');
            return;
          }
          await this.handleSearch(message, args);
          break;

        case 'stats':
          await this.handleStats(message);
          break;

        case 'help':
          await this.handleHelp(message);
          break;

        default:
          // Unknown command
          break;
      }
    } catch (e) {
      console.error('Command error:', e);
      await message.reply('❌ An error occurred. Please try again.');
    }
  }

  async handleIngest(message, args) {
    const url = args[0];
    const section = args[1]; // Optional

    // React with processing emoji
    await message.react('🧠');

    try {
      // Call the webhook endpoint
      const response = await axios.post(`${this.config.apiUrl}/api/discord/webhook`, {
        content: url,
        author: {
          id: message.author.id,
          username: message.author.username
        },
        channel_id: message.channelId,
        attachments: message.attachments.map(a => ({
          filename: a.name,
          url: a.url,
          content_type: a.contentType
        }))
      });

      const results = response.data.results || [];
      
      for (const result of results) {
        if (result.status === 'success') {
          await message.reply(
            `✅ **${result.title}**\n` +
            `📁 Section: \`${result.section}\`\n` +
            `🔗 <${result.url}>`
          );
        } else if (result.status === 'error') {
          await message.reply(`❌ Failed to process: ${result.error}`);
        } else if (result.status === 'stored') {
          await message.reply(
            `📎 **${result.filename}** stored\n` +
            `_Note: ${result.note}_`
          );
        }
      }

    } catch (e) {
      console.error('Ingest error:', e);
      await message.reply('❌ Failed to ingest. The knowledge base may be unavailable.');
    }
  }

  async handleSearch(message, args) {
    const query = args.join(' ');
    
    await message.react('🔍');

    try {
      const response = await axios.post(`${this.config.apiUrl}/api/discord/command`, {
        command: 'cortex',
        args: [query],
        user_id: message.author.id
      });

      const { results = [] } = response.data;

      if (results.length === 0) {
        await message.reply(`No results found for "${query}"`);
        return;
      }

      let reply = `🔍 **Search Results for "${query}":**\n\n`;
      
      results.forEach((result, i) => {
        reply += `${i + 1}. **${result.title}**\n`;
        reply += `   📁 ${result.section} | 🔗 <${result.url}>\n`;
        reply += `   _${result.preview}_\n\n`;
      });

      await message.reply(reply.substring(0, 2000)); // Discord message limit

    } catch (e) {
      console.error('Search error:', e);
      await message.reply('❌ Search failed. Please try again.');
    }
  }

  async handleStats(message) {
    try {
      const response = await axios.post(`${this.config.apiUrl}/api/discord/command`, {
        command: 'stats',
        args: [],
        user_id: message.author.id
      });

      const { stats = {} } = response.data;
      
      let reply = '🧠 **Cortex Statistics**\n\n';
      
      const sectionNames = {
        emerald_tablets: '📜 Emerald Tablets',
        hitchhiker_guide: '📘 Hitchhiker\'s Guide',
        all_spark: '⚡ The All Spark',
        howls_kitchen: '🍳 Howl\'s Kitchen'
      };

      for (const [section, count] of Object.entries(stats)) {
        const name = sectionNames[section] || section;
        reply += `${name}: **${count}** entries\n`;
      }

      const total = Object.values(stats).reduce((a, b) => a + b, 0);
      reply += `\n📊 **Total: ${total}** knowledge entries`;

      await message.reply(reply);

    } catch (e) {
      console.error('Stats error:', e);
      await message.reply('❌ Failed to retrieve stats.');
    }
  }

  async handleHelp(message) {
    const helpText = `
🧠 **Knowledge Knaight Commands**

\`!ingest <url> [section]\` - Add URL to your knowledge base
\`!cortex <query>\` - Search your knowledge base
\`!stats\` - View Cortex statistics
\`!help\` - Show this help message

**Auto-processing:** Just drop a URL in this channel and I'll automatically extract and categorize it!

**Sections:**
📜 Emerald Tablets - History & culture
📘 Hitchhiker's Guide - Survival knowledge  
⚡ The All Spark - Ideas & inspiration
🍳 Howl's Kitchen - Recipes & restaurants
    `;

    await message.reply(helpText);
  }

  async processURLs(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.content.match(urlRegex);

    if (!urls || urls.length === 0) return;

    // React to show we're processing
    await message.react('🧠');

    try {
      const response = await axios.post(`${this.config.apiUrl}/api/discord/webhook`, {
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username
        },
        channel_id: message.channelId,
        attachments: Array.from(message.attachments.values()).map(a => ({
          filename: a.name,
          url: a.url,
          content_type: a.contentType
        }))
      });

      const results = response.data.results || [];
      
      // Remove processing reaction
      await message.reactions.cache.get('🧠')?.remove();

      // Add success reaction
      const successCount = results.filter(r => r.status === 'success').length;
      if (successCount > 0) {
        await message.react('✅');
      }

      // Send summary if multiple URLs
      if (results.length > 1) {
        const summary = results.map(r => 
          r.status === 'success' ? `✅ ${r.title}` : `❌ ${r.url}`
        ).join('\n');
        
        await message.reply(`**Processed ${results.length} items:**\n${summary}`);
      }

    } catch (e) {
      console.error('Auto-process error:', e);
      await message.reactions.cache.get('🧠')?.remove();
      await message.react('❌');
    }
  }

  login(token) {
    return this.client.login(token);
  }
}

// Export for use as module
module.exports = KnowledgeKnaightBot;

// Run standalone if called directly
if (require.main === module) {
  const bot = new KnowledgeKnaightBot({
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    allowedChannels: process.env.ALLOWED_CHANNELS?.split(',') || []
  });

  // Bot invite URL with proper permissions
  console.log('🤖 Knowledge Knaight starting...');
  console.log('Invite bot with:');
  console.log(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_APP_ID || '1473691851201712189'}&permissions=8&scope=bot%20applications.commands`);
  
  bot.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('❌ Failed to login:', err.message);
    console.log('Make sure DISCORD_TOKEN is set in your .env file');
    process.exit(1);
  });
}
