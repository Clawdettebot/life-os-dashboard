# Agent Framework Template

This is the template for creating new agents in the Life OS system.

## Agent Structure

Each agent should have:

### 1. SOUL.md
- Identity & personality
- Core expertise & responsibilities  
- Communication style
- Workflow steps
- Limitations

### 2. DOJO.md
- Mistakes made & lessons learned
- Processing rules
- Edge cases to handle
- Efficiency tips

### 3. Configuration
- `.env.{agent-name}` - API keys and secrets
- Channel permissions in Discord
- Cron jobs (if applicable)

### 4. Communication
- Defined message formats
- Inter-agent protocols
- Error handling

## Current Agents

### Knowledge Knaight
- **Status:** Active
- **Channels:** #cortex (input), #round-table (reporting)
- **Specialty:** URL processing, knowledge extraction
- **Files:** 
  - `/dashboard/knowledge-knaight/SOUL.md`
  - `/dashboard/knowledge-knaight/DOJO.md`

### Knaight of Affairs
- **Status:** Active
- **Channels:** #round-table (reporting)
- **Specialty:** Calendar monitoring, reminders, schedule optimization
- **Monitors:** Google Calendar, Content Calendar, Stream Schedule, Tasks
- **Files:**
  - `/dashboard/knaight-of-affairs/SOUL.md`
  - `/dashboard/knaight-of-affairs/DOJO.md`

### Sir Clawthchilds
- **Status:** Active
- **Channels:** #round-table, DMs
- **Specialty:** Financial scanning, email parsing, recurring payments
- **Monitors:** Twitch, Stripe, Chase, Cash App, etc.
- **Files:**
  - `/dashboard/sir-clawthchilds/SOUL.md`
  - `/dashboard/sir-clawthchilds/DOJO.md`

### Claudnelius
- **Status:** Coming Soon
- **Channels:** #round-table
- **Specialty:** Code generation, UI design, building tools
- **Uses:** Gemini API
- **Files:**
  - `/dashboard/claudnelius/SOUL.md`
  - `/dashboard/claudnelius/DOJO.md`

## Adding New Agents

1. Create agent directory: `/dashboard/{agent-name}/`
2. Create SOUL.md and DOJO.md
3. Create `.env.{agent-name}` config (if needed)
4. Create bot/worker script (or add personality to existing bot)
5. Add to PM2 startup
6. Define communication protocol

## Inter-Agent Communication

Agents can communicate via:
- Discord DMs (using sessions_send)
- Shared database (Supabase)
- File-based message queues in `/dashboard/data/`

### Message Protocol
```json
{
  "from": "agent-name",
  "to": "target-agent", 
  "action": "task|query|response",
  "payload": {},
  "replyTo": "message-id"
}
```
