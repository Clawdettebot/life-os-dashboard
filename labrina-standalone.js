/**
 * Labrina - Standalone Social Media Maven
 * Posts content, tracks stats, updates Life OS
 */

const { Client, GatewayIntentBits, Events, ChannelType } = require('discord.js');
const { CronJob } = require('cron');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.knaight') });

// Config
const CONFIG = {
  token: process.env.LABRINA_TOKEN,
  channelId: process.env.LABRINA_CHANNEL_ID || '1476071526909345884', // Updated to correct channel
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  permissions: '536988672'
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged intent enabled
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions
  ]
});

console.log('💃 Labrina starting...');

// Gemini Helper
async function callGemini(prompt, chatHistory = "") {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "I need my API key to think! (Check .env.knaight)";

    const systemPrompt = `You are Labrina, the Social Media Maven for the Creative Empire.
Identity: Vibrant, professional, slightly witty, emojis encouraged.
Role: Manage social posts, track stats, engage with the community.
Context: You are talking to Handsome (User) or his team in your dedicated channel.
Style: Keep it short and punchy. No long paragraphs unless asked.

Chat History:
${chatHistory}

User: ${prompt}
Labrina:`;

    // Using stable 'gemini-1.5-flash' - no 'latest', no 'exp'
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      contents: [{
        parts: [{ text: systemPrompt + "\n" + prompt }]
      }],
      tools: [{ googleSearchRetrieval: {} }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.error('Gemini Unexpected Response:', JSON.stringify(response.data));
      return "I'm thinking... but the thoughts aren't forming. (API Error)";
    }
  } catch (e) {
    console.error('Gemini API Error:', e.response ? JSON.stringify(e.response.data) : e.message);
    return `My brain is buffering... (${e.message})`;
  }
}

client.once('ready', () => {
  console.log(`✅ Labrina logged in as ${client.user.tag}`);
  console.log(`📢 Will post to channel: ${CONFIG.channelId}`);
  
  // Daily stats job - 6PM UTC (10AM Pacific)
  const dailyStats = new CronJob('0 18 * * *', async () => {
    console.log('📱 Running daily social stats...');
    const channel = await client.channels.fetch(CONFIG.channelId);
    if (channel) {
      channel.send('📊 **Daily Social Stats Report**\n\n(No data yet - PostBridge API needed)');
    }
  });
  dailyStats.start();
  
  // Hourly schedule check
  const hourlyCheck = new CronJob('0 * * * *', () => {
    console.log('⏰ Hourly schedule check...');
  });
  hourlyCheck.start();
});

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Check if mentioned OR starts with a command prefix
  const isMentioned = message.mentions.has(client.user);
  const isCommand = message.content.trim().startsWith('!');

  // ONLY respond if mentioned OR using a command
  if (isMentioned || isCommand) {
    try {
      await message.channel.sendTyping();

      // Simple commands
      const content = message.content.toLowerCase();
      
      if (content === '!stats') {
        await message.reply('📊 Fetching your social stats... (PostBridge API needed)');
        return;
      }
      
      if (content === '!schedule') {
        await message.reply('📅 Checking your content schedule...');
        return;
      }

      // 🧠 MEMORY UPDATE: Fetch recent chat context
      const history = await message.channel.messages.fetch({ limit: 10 });
      const context = history.reverse().map(msg => {
        const role = msg.author.bot ? 'Labrina' : 'User';
        return `${role}: ${msg.content}`;
      }).join('\n');

      // Call Gemini API for chat with Context
      const response = await callGemini(message.content, context);
      
      // Reply with AI response
      await message.reply(response);

    } catch (err) {
      console.error('Error handling message:', err);
    }
  }
});

client.login(CONFIG.token).catch(err => {
  console.error('❌ Failed to login:', err.message);
});
