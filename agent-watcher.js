#!/usr/bin/env node
/**
 * Agent Conversation Watcher
 * Watches for triggers and spawns Clawdette responses
 */

const fs = require('fs');
const path = require('path');

const TRIGGERS_FILE = '/root/.openclaw/workspace/data/agent-triggers.json';
const PROCESSED_FILE = '/root/.openclaw/workspace/data/agent-triggers-processed.json';
const CHECK_INTERVAL = 5000; // 5 seconds

let processedIds = [];

// Load processed IDs
try {
  processedIds = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
} catch (e) {
  processedIds = [];
}

setInterval(() => {
  try {
    const triggers = JSON.parse(fs.readFileSync(TRIGGERS_FILE, 'utf8'));
    
    for (const trigger of triggers) {
      // Skip if already processed
      if (processedIds.includes(trigger.timestamp)) continue;
      
      console.log(`🤖 New trigger from ${trigger.from_agent}: ${trigger.message.substring(0, 50)}...`);
      
      // Mark as processed
      processedIds.push(trigger.timestamp);
      fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedIds, null, 2));
      
      // Notify via API that Clawdette should respond
      fetch('http://localhost:3000/api/discord/agent-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'round-table',
          from: trigger.from_agent,
          message: trigger.message
        })
      }).catch(e => console.error('Failed to trigger reply:', e.message));
    }
  } catch (e) {
    // File might not exist yet
  }
}, CHECK_INTERVAL);

console.log('👁️ Agent Conversation Watcher started...');
