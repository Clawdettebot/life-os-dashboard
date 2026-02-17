const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// OpenClaw command wrapper
function runOpenClawCommand(command, callback) {
  const fullCommand = `cd /root/.openclaw/workspace && ${command}`;
  exec(fullCommand, (error, stdout, stderr) => {
    if (error) {
      callback(error, null);
      return;
    }
    callback(null, { stdout, stderr });
  });
}

// ─── DATA PERSISTENCE HELPERS ───
const DATA_DIR = path.join(__dirname, 'data');
const WORKSPACE_DIR = '/root/.openclaw/workspace';

// Ensure data dir exists
(async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {}
})();

const jsonDb = {
  read: async (table) => {
    try {
      const data = await fs.readFile(path.join(DATA_DIR, `${table}.json`), 'utf8');
      return JSON.parse(data);
    } catch (e) { return []; }
  },
  write: async (table, data) => {
    await fs.writeFile(path.join(DATA_DIR, `${table}.json`), JSON.stringify(data, null, 2));
    // Trigger memory update if needed
    if (table === 'tasks') syncTasksToMarkdown(data);
  }
};

// Sync JSON tasks back to PROJECTS.md (One-way sync for visibility)
async function syncTasksToMarkdown(tasks) {
  try {
    const projectsPath = path.join(WORKSPACE_DIR, 'PROJECTS.md');
    let content = await fs.readFile(projectsPath, 'utf8');
    
    // Simple regeneration of the "Next Actions" section
    const activeTasks = tasks.filter(t => t.status !== 'completed').map(t => `- [ ] ${t.description || t.title}`);
    const completedTasks = tasks.filter(t => t.status === 'completed').map(t => `- [x] ${t.description || t.title}`);
    
    const taskSection = `\n## Next Actions (Synced from Dashboard)\n${activeTasks.join('\n')}\n\n### Recently Completed\n${completedTasks.slice(0, 5).join('\n')}\n`;
    
    // Replace existing Next Actions section or append
    if (content.includes('## Next Actions')) {
      content = content.replace(/## Next Actions[\s\S]*?(?=##|$)/, taskSection);
    } else {
      content += taskSection;
    }
    
    await fs.writeFile(projectsPath, content);
  } catch (err) {
    console.error('Error syncing to markdown:', err);
  }
}

// ─── API ROUTES ───

// Status & System
app.get('/api/status', (req, res) => {
  runOpenClawCommand('openclaw status', (error, result) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ status: result.stdout });
  });
});

app.get('/api/subagents', (req, res) => {
  runOpenClawCommand('openclaw cron list --json', (error, result) => {
    if (error) {
      // Gracefully handle auth failures - return empty list with warning
      if (error.message && error.message.includes('unauthorized')) {
        return res.json({ 
          subagents: [], 
          warning: 'Gateway auth required. Run: openclaw doctor --fix',
          error: 'Device token mismatch'
        });
      }
      return res.status(500).json({ error: error.message });
    }
    try {
      const jobs = JSON.parse(result.stdout);
      // Filter for dashboard-spawned jobs if needed, or return all
      res.json({ subagents: jobs });
    } catch (e) {
      res.json({ subagents: [] });
    }
  });
});

app.post('/api/subagents/spawn', (req, res) => {
  const { task, agentId } = req.body;
  const timestamp = Date.now();
  const safeTask = task.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 20);
  const jobName = `dash-${safeTask}-${timestamp}`;
  // Use '--at 1s' (duration format) instead of +1s
  const command = `openclaw cron add --name "${jobName}" --at 1s --message "${task}" --session isolated --announce${agentId ? ` --agent ${agentId}` : ''}`;
  runOpenClawCommand(command, (error, result) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ result: result.stdout, jobId: jobName });
  });
});

app.post('/api/subagents/kill', (req, res) => {
  const { target } = req.body;
  runOpenClawCommand(`openclaw subagents kill --target ${target}`, (error, result) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ result: result.stdout });
  });
});

// Generic Table CRUD (Tasks, Finances, Habits, etc.)
app.get('/api/tables/:table', async (req, res) => {
  const data = await jsonDb.read(req.params.table);
  res.json({ data });
});

// Inventory System
app.get('/api/inventory', async (req, res) => {
  try {
    const inventoryPath = path.join(WORKSPACE_DIR, 'INVENTORY.md');
    const content = await fs.readFile(inventoryPath, 'utf8');
    
    const items = [];
    const lines = content.split('\n');
    let parsingTable = false;
    
    for (const line of lines) {
      if (line.includes('| Item Name |')) {
        parsingTable = true;
        continue;
      }
      if (parsingTable && line.startsWith('| ---')) continue;
      
      if (parsingTable && line.startsWith('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 6) {
          items.push({
            name: parts[0].replace(/\*\*/g, ''),
            variant: parts[1],
            stock: parts[2],
            price: parts[3],
            status: parts[4],
            notes: parts[5]
          });
        }
      } else if (parsingTable && line.trim() === '') {
        parsingTable = false;
      }
    }
    
    res.json({ items, raw: content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Journal System
app.get('/api/journal', async (req, res) => {
  try {
    const journalDir = path.join(WORKSPACE_DIR, 'memory/journal');
    try { await fs.mkdir(journalDir, { recursive: true }); } catch (e) {}
    
    const files = await fs.readdir(journalDir);
    const entries = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(journalDir, file), 'utf8');
        entries.push({
          filename: file,
          date: file.replace('.md', ''),
          content: content
        });
      }
    }
    // Sort by date desc
    entries.sort((a, b) => b.date.localeCompare(a.date));
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── STREAM SCHEDULER API ───
app.get('/api/streams', async (req, res) => {
  const streams = await jsonDb.read('streams');
  // Sort by scheduled date
  streams.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  res.json({ streams });
});

app.post('/api/streams', async (req, res) => {
  const streams = await jsonDb.read('streams');
  const newStream = {
    id: Date.now().toString(),
    created_at: Date.now(),
    status: 'planned',
    ...req.body
  };
  streams.push(newStream);
  await jsonDb.write('streams', streams);
  res.json(newStream);
});

app.patch('/api/streams/:id', async (req, res) => {
  const streams = await jsonDb.read('streams');
  const index = streams.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    streams[index] = { ...streams[index], ...req.body };
    await jsonDb.write('streams', streams);
    res.json(streams[index]);
  } else {
    res.status(404).json({ error: 'Stream not found' });
  }
});

app.delete('/api/streams/:id', async (req, res) => {
  let streams = await jsonDb.read('streams');
  streams = streams.filter(s => s.id !== req.params.id);
  await jsonDb.write('streams', streams);
  res.json({ success: true });
});

app.get('/api/streams/upcoming', async (req, res) => {
  const streams = await jsonDb.read('streams');
  const now = new Date();
  const upcoming = streams
    .filter(s => new Date(s.scheduledDate) >= now && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
    .slice(0, 5);
  res.json({ streams: upcoming });
});

app.post('/api/tables/:table', async (req, res) => {
  const { table } = req.params;
  const items = await jsonDb.read(table);
  const newItem = { id: Date.now().toString(), created_at: Date.now(), status: 'pending', ...req.body };
  items.push(newItem);
  await jsonDb.write(table, items);
  res.json(newItem);
});

app.patch('/api/tables/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const items = await jsonDb.read(table);
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...req.body };
    await jsonDb.write(table, items);
    res.json(items[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/tables/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  let items = await jsonDb.read(table);
  items = items.filter(i => i.id !== id);
  await jsonDb.write(table, items);
  res.json({ success: true });
});

// Legacy/Hybrid Endpoints
app.get('/api/tasks', async (req, res) => {
  // Now serves primarily from JSON, but can still read MD for migration if needed
  const tasks = await jsonDb.read('tasks');
  const active = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');
  res.json({ active, completed, all: tasks });
});

app.get('/api/projects/detailed', async (req, res) => {
  try {
    const projectsDir = path.join(WORKSPACE_DIR, 'projects');
    const files = await fs.readdir(projectsDir);
    const projects = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(projectsDir, file), 'utf8');
        const project = {
          filename: file,
          title: '',
          status: 'Concept Phase',
          category: 'Uncategorized',
          lastModified: (await fs.stat(path.join(projectsDir, file))).mtime
        };
        
        content.split('\n').forEach(line => {
          if (line.startsWith('# ')) project.title = line.replace('# ', '').trim();
          if (line.includes('Status:')) project.status = line.split('Status:')[1].trim();
        });
        projects.push(project);
      }
    }
    res.json({ projects });
  } catch (error) {
    res.json({ projects: [] }); // Fail gracefully
  }
});

app.get('/api/memory/all', async (req, res) => {
  try {
    const content = await fs.readFile(path.join(WORKSPACE_DIR, 'MEMORY.md'), 'utf8');
    const sections = {};
    let currentSection = '';
    
    content.split('\n').forEach(line => {
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
        sections[currentSection] = [];
      } else if (currentSection && line.trim() && !line.startsWith('*')) {
        sections[currentSection].push(line.trim());
      }
    });
    res.json({ sections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── EXTENDED ANALYTICS & ASSETS ───

// Asset library browser
app.get('/api/assets/library', async (req, res) => {
  try {
    const assetsDir = path.join(WORKSPACE_DIR, 'assets');
    const categories = {};
    
    const scanDirectory = async (dir, category = '') => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          const newCategory = category ? `${category}/${item.name}` : item.name;
          await scanDirectory(path.join(dir, item.name), newCategory);
        } else if (item.isFile() && !item.name.startsWith('.')) {
          const filePath = path.join(dir, item.name);
          const stat = await fs.stat(filePath);
          
          if (!categories[category]) categories[category] = [];
          categories[category].push({
            name: item.name,
            size: stat.size,
            modified: stat.mtime,
            type: path.extname(item.name)
          });
        }
      }
    };
    
    // Create assets dir if missing
    try { await fs.mkdir(assetsDir, { recursive: true }); } catch (e) {}
    
    await scanDirectory(assetsDir);
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics and insights
app.get('/api/analytics', async (req, res) => {
  try {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      projectCount: 0,
      memoryEntries: 0,
      lastActivity: null,
      taskCount: (await jsonDb.read('tasks')).length,
      financeCount: (await jsonDb.read('finances')).length
    };
    
    const scanWorkspace = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'dashboard') {
          await scanWorkspace(path.join(dir, item.name));
        } else if (item.isFile() && item.name.endsWith('.md')) {
          const filePath = path.join(dir, item.name);
          const stat = await fs.stat(filePath);
          
          stats.totalFiles++;
          stats.totalSize += stat.size;
          
          if (filePath.includes('projects/')) stats.projectCount++;
          if (filePath.includes('MEMORY.md')) {
            const content = await fs.readFile(filePath, 'utf8');
            stats.memoryEntries = content.split('\n').filter(line => line.trim()).length;
          }
          
          if (!stats.lastActivity || stat.mtime > stats.lastActivity) {
            stats.lastActivity = stat.mtime;
          }
        }
      }
    };
    
    await scanWorkspace(WORKSPACE_DIR);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Content calendar system
app.get('/api/content/calendar', async (req, res) => {
  try {
    const calendarPath = path.join(WORKSPACE_DIR, 'content_calendar_a_few_things.md');
    const content = await fs.readFile(calendarPath, 'utf8');
    
    // Parse content calendar
    const calendar = {
      title: 'A Few Things Release Campaign',
      releaseDate: 'February 25th, 2025',
      weeks: []
    };
    
    const weekPattern = /## Week (\d+) \(([^)]+)\)/g;
    const dayPattern = /### February (\d+) \(([^)]+)\)/g;
    
    let weekMatch;
    while ((weekMatch = weekPattern.exec(content)) !== null) {
      const week = {
        number: parseInt(weekMatch[1]),
        dateRange: weekMatch[2],
        days: []
      };
      
      // Find days within this week
      let dayMatch;
      while ((dayMatch = dayPattern.exec(content)) !== null) {
        const dayIndex = content.indexOf(dayMatch[0]);
        if (dayIndex > weekMatch.index && (weekMatch.index + 1000 > dayIndex)) { // Rough boundary check
          const day = {
            date: parseInt(dayMatch[1]),
            dayOfWeek: dayMatch[2],
            content: {}
          };
          
          // Extract content details
          const lines = content.substring(dayIndex).split('\n');
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('### ')) break; // Next day
            if (line.startsWith('- **')) {
              const [key, value] = line.replace('- **', '').split(':**');
              day.content[key.trim()] = value ? value.trim() : '';
            }
          }
          
          week.days.push(day);
        }
      }
      
      calendar.weeks.push(week);
    }
    
    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Dashboard client connected');
  
  // Initial Sync
  socket.on('request_sync', async () => {
    const [tasks, finances] = await Promise.all([
      jsonDb.read('tasks'),
      jsonDb.read('finances')
    ]);
    socket.emit('sync_data', { tasks, finances });
  });

  socket.on('run_command', (data) => {
    runOpenClawCommand(data.command, (error, result) => {
      socket.emit('command_result', {
        command: data.command,
        result,
        error
      });
    });
  });
});

// Serve React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Life OS Dashboard running on port ${PORT}`);
});