#!/bin/bash
# Agent memory library - source this in your agent scripts

MEMORY_DIR="/root/.openclaw/workspace/agent-memory"

# Write to agent's daily log
agent_log() {
    local agent=$1
    local message=$2
    local log_file="$MEMORY_DIR/memory/$agent/$(date +%Y-%m-%d).md"
    mkdir -p "$(dirname $log_file)"
    echo "[$(date +%H:%M:%S)] $message" >> "$log_file"
}

# Write to shared brain JSON
shared_brain_write() {
    local file=$1
    local key=$2
    local data=$3
    local brain_file="$MEMORY_DIR/shared-brain/$file"
    
    # Simple JSON append (would need jq for proper JSON handling)
    echo "Would write: $key -> $data to $brain_file"
}

# Save to knowledge database
kb_save() {
    local content=$1
    local agent=$2
    sqlite3 "$MEMORY_DIR/databases/knowledge.db" \
        "INSERT INTO chunks (content, agent_id) VALUES ('$content', '$agent');"
}

# Query knowledge database
kb_search() {
    local query=$1
    # For now just does text search - would need embeddings for semantic
    sqlite3 "$MEMORY_DIR/databases/knowledge.db" \
        "SELECT content FROM chunks WHERE content LIKE '%$query%' LIMIT 5;"
}

# Track LLM usage
track_usage() {
    local model=$1
    local prompt_tokens=$2
    local completion_tokens=$3
    local cost=$4
    sqlite3 "$MEMORY_DIR/databases/llm-usage.db" \
        "INSERT INTO usage (model, prompt_tokens, completion_tokens, cost) VALUES ('$model', $prompt_tokens, $completion_tokens, $cost);"
}

echo "✅ Agent memory library loaded"
