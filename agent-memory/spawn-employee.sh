#!/bin/bash
# spawn-employee.sh - Inject persistent memory into agents before they start
# Run this before ANY agent starts!

AGENT_NAME=$1
MEMORY_DIR="/root/.openclaw/workspace/agent-memory"
SHARED_DIR="$MEMORY_DIR/shared-brain"
AGENT_MEM_DIR="$MEMORY_DIR/memory/$AGENT_NAME"
DATABASES_DIR="$MEMORY_DIR/databases"

echo "============================================="
echo "🚀 SPAWNING: $AGENT_NAME"
echo "============================================="

# 1. Load agent identity
if [ -f "$MEMORY_DIR/agents/$AGENT_NAME/identity.md" ]; then
  echo "📋 Loading identity..."
  cat "$MEMORY_DIR/agents/$AGENT_NAME/identity.md"
  echo "---"
fi

# 2. Load last 2 days of personal memory logs
if [ -d "$AGENT_MEM_DIR" ]; then
  echo "📓 Loading recent memory logs..."
  for log in $(ls -t "$AGENT_MEM_DIR"/*.md 2>/dev/null | head -2); do
    echo "=== $(basename $log) ==="
    cat "$log"
    echo ""
  done
fi

# 3. Load relevant shared brain files
echo "🧠 Loading shared brain..."
for brain_file in intel-feed.json agent-handoffs.json research-findings.json; do
  if [ -f "$SHARED_DIR/$brain_file" ]; then
    echo "=== $brain_file ==="
    cat "$SHARED_DIR/$brain_file"
    echo ""
  fi
done

# 4. Load today's running log
TODAY_LOG="$AGENT_MEM_DIR/$(date +%Y-%m-%d).md"
if [ -f "$TODAY_LOG" ]; then
  echo "📝 Today's log so far:"
  cat "$TODAY_LOG"
fi

echo "============================================="
echo "✅ Memory loaded. Agent ready to work!"
echo "============================================="
