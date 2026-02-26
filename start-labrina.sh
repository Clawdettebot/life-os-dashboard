#!/bin/bash
# Labrina Discord Bot Setup Script

echo "💃 Setting up Labrina Discord Bot..."

# Set environment variables
export LABRINA_DISCORD_TOKEN="MTQ3NjQ3MDIyNTk0Mjc0NTExOQ.Gdbc5T.rnpezC6t2_2d3kMWLi6czkYUpOcn39qDRJZaT4"
export LABRINA_CHANNEL_ID="1476470225942745119"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Start with PM2
echo "🚀 Starting Labrina with PM2..."
cd /root/.openclaw/workspace/dashboard
pm2 start labrina/index.js --name labrina --interpreter node

# Wait a moment
sleep 2

# Save PM2 config
pm2 save

echo "✅ Labrina is running!"
echo ""
echo "📋 Bot Status:"
pm2 status labrina
echo ""
echo "📝 View logs: pm2 logs labrina"
echo "🛑 Stop bot: pm2 stop labrina"
echo "🔄 Restart bot: pm2 restart labrina"
