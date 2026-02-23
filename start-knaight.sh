#!/bin/bash
# Knowledge Knaight Bot Setup Script

echo "🧠 Setting up Knowledge Knaight Discord Bot..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules/discord.js" ]; then
    echo "📦 Installing Discord.js..."
    npm install discord.js
fi

# Start with PM2
echo "🚀 Starting bot with PM2..."
pm2 start discord-bot.js --name knowledge-knaight

# Save PM2 config
pm2 save

echo "✅ Knowledge Knaight is running!"
echo ""
echo "📋 Bot Status:"
pm2 status knowledge-knaight
echo ""
echo "📝 View logs: pm2 logs knowledge-knaight"
echo "🛑 Stop bot: pm2 stop knowledge-knaight"
echo "🔄 Restart bot: pm2 restart knowledge-knaight"
