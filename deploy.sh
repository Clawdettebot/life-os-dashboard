#!/bin/bash
# LifeOS Dashboard Deploy Script
# Usage: ./deploy.sh [branch]
# Defaults to main branch

BRANCH=${1:-main}
cd /opt/life-os-dashboard

echo "📦 Pulling latest from $BRANCH..."
git fetch upstream
git checkout $BRANCH
git pull upstream $BRANCH

echo "🔨 Rebuilding client..."
cd client
npm run build

echo "🔄 Restarting server..."
cd ..
pkill -f "node.*server" || true
sleep 1
nohup node server.js > dashboard.log 2>&1 &
sleep 2

# Verify
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed - check dashboard.log"
    exit 1
fi
