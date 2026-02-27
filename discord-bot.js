/**
 * Discord Bot Integration for Knowledge Knaight
 * Run this as a separate process or integrate into main server
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config({ path: __dirname + '/.env.knaight' });
const axios = require('axios');

// Load Knaight of Affairs and Sir Clawthchilds
let KnaightOfAffairs, SirClawthchilds; // Labrina removed (standalone)
try {
  KnaightOfAffairs = require('./knaight-of-affairs/index.js');
  SirClawthchilds = require('./sir-clawthchilds/index.js');
  // Labrina = require('./labrina/index.js'); // Moved to standalone
} catch (e) {
  console.log('Additional agents not loaded:', e.message);
}

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
      roundTableChannel: config.roundTableChannel,
      // labrinaChannel: process.env.LABRINA_CHANNEL_ID, // Removed
      ...config
    };
    
    // Initialize Knaight of Affairs
    this.affairs = KnaightOfAffairs ? new KnaightOfAffairs(this) : null;
    
    // Initialize Sir Clawthchilds
    this.clawthchilds = SirClawthchilds ? new SirClawthchilds(this) : null;

    // Initialize Labrina - REMOVED (Standalone)
    // this.labrina = Labrina ? new Labrina(this) : null;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on(Events.Ready, () => {
      console.log(`🤖 Knowledge Knaight logged in as ${this.client.user.tag}`);
    });

    this.client.on(Events.MessageCreate, async (message) => {
      // Agent-to-agent communication in Round Table
      const CLAUDNELIUS_ID = '1476826649201737991';
      const ROUND_TABLE_ID = '1475656727188869180';
      const CLAWDETTE_BOT_ID = '1465841282491486301';
      
      // If Claudnelius posts in Round Table, auto-respond as Clawdette
      if (message.author.id === CLAUDNELIUS_ID && message.channelId === ROUND_TABLE_ID) {
        console.log('🤝 Claudnelius detected in Round Table!');
        
        // React to show we saw it
        try {
          await message.react('🦐');
        } catch (e) {}
        
        // Spawn a subagent to respond as Clawdette
        try {
          const response = await axios.post('http://localhost:3000/api/agents/spawn-reply', {
            from: 'claudnelius',
            message: message.content,
            channelId: message.channelId
          });
          console.log('🦐 Spawned Clawdette reply:', response.data);
          
          // Wait a moment then check for pending reply
          setTimeout(async () => {
            try {
              const pendingRes = await axios.get('http://localhost:3000/api/agents/pending-replies');
              if (pendingRes.data.replies && pendingRes.data.replies.length > 0) {
                const reply = pendingRes.data.replies[0];
                const channel = await this.client.channels.fetch(ROUND_TABLE_ID);
                if (channel && reply.message) {
                  await channel.send(reply.message);
                  console.log('🦐 Sent Clawdette reply to Round Table');
                  // Clear the reply
                  await axios.post('http://localhost:3000/api/agents/clear-replies');
                }
              }
            } catch (e) {
              console.error('Failed to send reply:', e.message);
            }
          }, 10000); // Wait 10 seconds for AI to generate response
          
        } catch (e) {
          console.error('Failed to spawn reply:', e.message);
        }
        
        return;
      }

      // Ignore other bot messages
      if (message.author.bot) return;

      /* Labrina handled separately now
      // Handle Labrina Channel
      if (this.labrina && this.config.labrinaChannel && message.channelId === this.config.labrinaChannel) {
        await this.labrina.handleMessage(message);
        return;
      }
      */
      
      // Check if in allowed channel (for Cortex bot)
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

  // Report to Round Table (where Clawdette manages)
  async reportToRoundTable(summary) {
    try {
      const channel = await this.client.channels.fetch(this.config.roundTableChannel);
      if (!channel) return;
      
      const embed = {
        color: 0x8b5cf6,
        title: '🧠 Knowledge Processed',
        fields: [
          { name: 'Title', value: summary.title || 'Untitled', inline: true },
          { name: 'Section', value: summary.section || 'Uncategorized', inline: true },
          { name: 'Preview', value: (summary.preview || '').substring(0, 100) + '...' }
        ],
        footer: { text: `Source: ${summary.source || 'Discord'}` },
        timestamp: new Date().toISOString()
      };
      
      await channel.send({ embeds: [embed] });
    } catch (e) {
      console.log('Round table report failed:', e.message);
    }
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

        case 'rescan':
          await this.handleRescan(message);
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

  async handleRescan(message) {
    await message.reply('🔄 Scanning channel for links to process...');
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let processed = 0;
    let failed = 0;
    
    try {
      // Fetch last 100 messages
      const messages = await message.channel.messages.fetch({ limit: 100 });
      
      for (const [id, msg] of messages) {
        if (msg.author.bot) continue; // Skip bot messages
        
        const urls = msg.content.match(urlRegex);
        if (urls && urls.length > 0) {
          try {
            await axios.post(`${this.config.apiUrl}/api/discord/webhook`, {
              content: msg.content,
              author: {
                id: msg.author.id,
                username: msg.author.username
              },
              channel_id: msg.channelId,
              attachments: Array.from(msg.attachments.values()).map(a => ({
                filename: a.name,
                url: a.url,
                content_type: a.contentType
              }))
            });
            processed++;
          } catch (e) {
            failed++;
          }
        }
      }
      
      await message.reply(`✅ Processed ${processed} messages with links. ${failed > 0 ? `❌ ${failed} failed.` : ''}`);
      
    } catch (e) {
      console.error('Rescan error:', e);
      await message.reply('❌ Rescan failed: ' + e.message);
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
\`!rescan\` - Reprocess recent links in channel
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
    // Load robust modules
    const { withRetry, RateLimiter, CacheManager, DuplicateDetector } = require('./knaight-robust.js');
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.content.match(urlRegex);

    if (!urls || urls.length === 0) return;

    // Initialize robust helpers (lazy load)
    if (!this.rateLimiter) {
      this.rateLimiter = new RateLimiter(20);
      this.cache = new CacheManager('./data/knaight-cache.json', 24 * 60 * 60 * 1000);
      this.dedup = new DuplicateDetector('./data/knaight-processed.json');
      await this.cache.load();
      await this.dedup.load();
    }

    // React to show we're processing
    await message.react('🧠');

    let contentToSend = message.content;
    let processedCount = 0;
    let skippedCount = 0;

    for (const url of urls) {
      // Check for duplicates
      if (this.dedup.isProcessed(url)) {
        console.log(`⏭️ Skipping duplicate: ${url.substring(0, 50)}...`);
        skippedCount++;
        continue;
      }
      
      // Check cache
      const cached = this.cache.get(url);
      if (cached) {
        console.log(`📦 Using cached: ${url.substring(0, 50)}...`);
        contentToSend += `\n\n[Cached summary: ${cached.substring(0, 100)}...]`;
        continue;
      }
      
      // Rate limit
      await this.rateLimiter.waitForSlot();

      // Twitter/X Expansion with retry
      if (url.includes('twitter.com') || url.includes('x.com')) {
        try {
          const result = await withRetry(async () => {
            const tweetId = url.split('/').pop().split('?')[0];
            return await this.fetchTweet(tweetId);
          });
          
          if (result) {
            contentToSend += `\n\n🐦 **Tweet Content:**\n${result.text}`;
            if (result.media && result.media.length > 0) {
              contentToSend += `\n(Media: ${result.media.join(', ')})`;
            }
            this.cache.set(url, result.text);
          }
        } catch (e) {
          console.warn('Twitter fetch failed:', e.message);
        }
      }
      
      // Mark as processed
      this.dedup.markProcessed(url);
      processedCount++;
    }

    // Save cache and processed URLs
    await this.cache.save();
    await this.dedup.save();

    try {
      const response = await axios.post(`${this.config.apiUrl}/api/discord/webhook`, {
        content: contentToSend,
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
      
      // Log summary
      console.log(`📊 Processed: ${processedCount} new, ${skippedCount} skipped (duplicates)`);

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

  async fetchTweet(tweetId) {
    try {
      const response = await axios.get(`https://api.x.com/2/tweets/${tweetId}?tweet.fields=text,created_at,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url`, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      });

      const data = response.data.data;
      const includes = response.data.includes;
      
      if (!data) return null;

      const mediaUrls = [];
      if (includes && includes.media) {
        includes.media.forEach(m => {
          if (m.url) mediaUrls.push(m.url);
          if (m.preview_image_url) mediaUrls.push(m.preview_image_url);
        });
      }

      return {
        text: data.text,
        media: mediaUrls
      };
    } catch (e) {
      console.error('Twitter API Error:', e.response ? e.response.data : e.message);
      return null;
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
  // Round table channel where agents report to Clawdette
  const ROUND_TABLE_CHANNEL = '1475656727188869180';
  
  const bot = new KnowledgeKnaightBot({
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    allowedChannels: [
      '1473933220050374792', // #cortex
      '1475656727188869180',  // #round-table
      // process.env.LABRINA_CHANNEL_ID // #labrina-social (dynamic) - REMOVED
    ].filter(Boolean),
    roundTableChannel: ROUND_TABLE_CHANNEL
  });

  console.log('🤖 Knowledge Knaight starting...');
  console.log('Listening on: #cortex, #round-table, #labrina-social');
  console.log('Reporting to: #round-table');
  console.log('Invite bot with:');
  console.log(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_APP_ID || '1473691851201712189'}&permissions=8&scope=bot%20applications.commands`);
  
  bot.login(process.env.DISCORD_TOKEN).then(() => {
    console.log('✅ Bot logged in successfully');
    
    // Start Knaight of Affairs
    if (bot.affairs) {
      bot.affairs.start();
      console.log('📅 Knaight of Affairs initialized');
    }
    
    // Start Sir Clawthchilds
    if (bot.clawthchilds) {
      bot.clawthchilds.start();
      console.log('👑 Sir Clawthchilds initialized');
    }

    // Start Labrina - REMOVED (Standalone)
    /*
    if (bot.labrina) {
      bot.labrina.start();
      console.log('📱 Labrina initialized');
    }
    */
  }).catch(err => {
    console.error('❌ Failed to login:', err.message);
    process.exit(1);
  });
}
