const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"]
  }
});

const PORT = process.env.PORT || 3000;
const AUTH_PASSWORD = 'Scamboy1176$';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Life OS"');
    return res.status(401).send('Authentication required');
  }
  const auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const pass = auth[1];
  if (pass !== AUTH_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Life OS"');
    return res.status(401).send('Authentication required');
  }
  next();
};

// Middleware
// Use JSON parser for everything EXCEPT Stripe webhooks (which need raw body)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cors());

// Stripe Webhook for Digital Fulfillment
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`💰 Payment received! Session ID: ${session.id}`);
    
    // Fulfill the order (Send Email)
    if (session.payment_status === 'paid') {
      try {
        await fulfillOrder(session);
      } catch (e) {
        console.error('Fulfillment failed:', e);
      }
    }
  }

  res.json({received: true});
});

async function fulfillOrder(session) {
  const nodemailer = require('nodemailer');
  const customerEmail = session.customer_details?.email;
  
  if (!customerEmail) {
    console.log('No email found for session');
    return;
  }

  // Map Product IDs to Download URLs
  const productLinks = {
    'prod_U2gei9aH6saPPn': 'https://yyoxpcsspmjvolteknsn.supabase.co/storage/v1/object/public/akeems%20admin/music/Projects/Handsome/08%20A%20Few%20Things%20ft%20Jai%27len%20Josey.mp3', // A Few Things
    'prod_U2hjNyqhkO9Ypf': 'https://yyoxpcsspmjvolteknsn.supabase.co/storage/v1/object/public/akeems%20admin/music/Projects/Handsome/03%20Guap_Daddy_MASTER%20V2.mp3', // Daddy
    'prod_U2hj8wOvj69UGb': 'https://yyoxpcsspmjvolteknsn.supabase.co/storage/v1/object/public/akeems%20admin/music/Projects/Handsome/04%20Guap_Paysexual_MASTER%20V2.mp3', // Paysexual
    'prod_U2hjgkFg1a5NUj': 'https://yyoxpcsspmjvolteknsn.supabase.co/storage/v1/object/public/akeems%20admin/music/Projects/Handsome/02%20Guap_Champagne%20Showers_MASTER%20V2.mp3' // Champagne Showers
  };

  const productId = session.line_items?.data[0]?.price?.product;
  const downloadLink = productLinks[productId] || process.env.SONG_DOWNLOAD_URL || 'https://guap.dad'; // Fallback

  // Setup Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: '"Handsome" <music@handsome.com>',
    to: customerEmail,
    subject: 'Thank You! Here is your download 🎵',
    text: `Thanks for buying the new track!\n\nHere is your digital download link:\n${downloadLink}\n\nStay Hyphy,\nHandsome`,
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h1>Thank You! 🙏</h1>
        <p>Your support means the world to me.</p>
        <p>Here is your digital download of the new track:</p>
        <a href="${downloadLink}" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">DOWNLOAD SONG</a>
        <br><br>
        <p>Enjoy the vibes.</p>
        <p>- Handsome</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Fulfillment email sent to ${customerEmail} for product ${productId}`);
}

// Auth all API routes
// app.use('/api', authMiddleware); // Disabled for now

// Public status (no auth)
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Blog Posts API - now from Supabase
app.get('/api/blog/posts', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('blog_post')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ posts: posts || [] });
  } catch (e) {
    // Fallback to local file
    try {
      const data = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
      res.json({ posts: data.posts || [] });
    } catch (err) {
      res.json({ posts: [], error: err.message });
    }
  }
});

app.post('/api/blog/voice-drop', async (req, res) => {
  try {
    const { transcript, title, tags = [] } = req.body;
    const blogData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
    
    const newPost = {
      id: 'post_' + Date.now(),
      title: title || 'Voice Drop ' + new Date().toLocaleDateString(),
      content: transcript,
      tags,
      source: 'voice-drop',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    blogData.posts.push(newPost);
    blogData.voice_drops.push(newPost);
    blogData.sync_status.last_voice_drop_processed = new Date().toISOString();
    
    await fs.writeFile(path.join(DATA_DIR, 'blog-posts.json'), JSON.stringify(blogData, null, 2));
    
    res.json({ success: true, post: newPost });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/blog/publish', async (req, res) => {
  try {
    const { post_id } = req.body;
    const blogData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
    
    const postIndex = blogData.posts.findIndex(p => p.id === post_id);
    if (postIndex < 0) {
      return res.json({ success: false, error: 'Post not found' });
    }
    
    blogData.posts[postIndex].status = 'published';
    blogData.posts[postIndex].published_at = new Date().toISOString();
    
    await fs.writeFile(path.join(DATA_DIR, 'blog-posts.json'), JSON.stringify(blogData, null, 2));
    
    res.json({ success: true, post: blogData.posts[postIndex] });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/api/blog/suggestions', async (req, res) => {
  try {
    const blogData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
    res.json({ suggestions: blogData.blog_suggestions || [] });
  } catch (e) {
    res.json({ suggestions: [], error: e.message });
  }
});

app.get('/api/releases/upcoming', async (req, res) => {
  try {
    const calendarData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'content-calendar.json'), 'utf-8'));
    res.json({ releases: [] });
  } catch (e) {
    res.json({ releases: [], error: e.message });
  }
});

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
    // Fetch from Supabase shop
    const { data: items, error } = await supabase
      .from('shop_item')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedItems = (items || []).map(item => ({
      name: item.name,
      variant: item.category || '',
      stock: item.inventory_count?.toString() || '0',
      price: item.price || '0',
      status: item.available ? 'Available' : 'Unavailable',
      notes: item.description || ''
    }));
    
    res.json({ items: formattedItems });
  } catch (error) {
    // Fallback to local file
    try {
      const inventoryPath = path.join(WORKSPACE_DIR, 'INVENTORY.md');
      const content = await fs.readFile(inventoryPath, 'utf8');
      const items = [];
      const lines = content.split('\n');
      let parsingTable = false;
      for (const line of lines) {
        if (line.includes('| Item Name |')) { parsingTable = true; continue; }
        if (parsingTable && line.startsWith('| ---')) continue;
        if (parsingTable && line.startsWith('|')) {
          const parts = line.split('|').map(p => p.trim()).filter(p => p);
          if (parts.length >= 6) {
            items.push({ name: parts[0].replace(/\*\*/g, ''), variant: parts[1], stock: parts[2], price: parts[3], status: parts[4], notes: parts[5] });
          }
        } else if (parsingTable && line.trim() === '') { parsingTable = false; }
      }
      res.json({ items, raw: content });
    } catch (e) { res.json({ items: [], raw: '' }); }
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

// ─── ADDED ENDPOINTS (must be before catch-all) ───

// Projects endpoint
app.get('/api/projects', async (req, res) => {
  try {
    const projectsDir = path.join(WORKSPACE_DIR, 'projects');
    const files = await fs.readdir(projectsDir);
    const projects = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        projects.push({ id: file.replace('.md', ''), title: file.replace('.md', '').replace(/-/g, ' '), status: 'active', lastModified: new Date().toISOString() });
      }
    }
    res.json({ projects });
  } catch (error) { res.json({ projects: [] }); }
});

// Google Calendar endpoints
app.get('/api/google-calendar/status', async (req, res) => {
  try {
    const calendarClient = require('./google-calendar-client.js');
    await new Promise(r => setTimeout(r, 1500));
    const isAuth = calendarClient.googleCalendar.isAuthenticated();
    if (isAuth) {
      const events = await calendarClient.getUpcomingEvents('primary', 7);
      res.json({ connected: true, events: events.events || [] });
    } else { res.json({ connected: false }); }
  } catch (error) { res.json({ connected: false, error: error.message }); }
});

app.get('/api/google-calendar/upcoming', async (req, res) => {
  try {
    const calendarClient = require('./google-calendar-client.js');
    await new Promise(r => setTimeout(r, 1500));
    const isAuth = calendarClient.googleCalendar.isAuthenticated();
    if (isAuth) {
      const days = parseInt(req.query.days) || 7;
      const events = await calendarClient.getUpcomingEvents('primary', days);
      res.json({ events: events.events || [] });
    } else { res.json({ events: [] }); }
  } catch (error) { res.json({ events: [], error: error.message }); }
});

app.get('/api/google-calendar/calendars', async (req, res) => {
  try {
    const calendarClient = require('./google-calendar-client.js');
    await new Promise(r => setTimeout(r, 1500));
    const isAuth = calendarClient.googleCalendar.isAuthenticated();
    if (isAuth) {
      const calendars = await calendarClient.getCalendarList();
      res.json({ calendars: calendars.calendars || [] });
    } else { res.json({ calendars: [] }); }
  } catch (error) { res.json({ calendars: [], error: error.message }); }
});

// Cortex endpoints
app.get('/api/cortex', async (req, res) => {
  const { section, limit = 50 } = req.query;
  try {
    const dbPath = path.join(DATA_DIR, 'cortex.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);
    let query = 'SELECT * FROM cortex_entries';
    if (section && section !== 'all_spark') { query += ' WHERE section = ?'; }
    query += ' ORDER BY created_at DESC LIMIT ?';
    const entries = db.prepare(query).all(section && section !== 'all_spark' ? [section, parseInt(limit)] : [parseInt(limit)]);
    db.close();
    res.json(entries);
  } catch (error) { res.json([]); }
});

app.get('/api/cortex/stats', async (req, res) => {
  try {
    const dbPath = path.join(DATA_DIR, 'cortex.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);
    const total = db.prepare('SELECT COUNT(*) as count FROM cortex_entries').get().count;
    const bySection = db.prepare('SELECT section, COUNT(*) as count FROM cortex_entries GROUP BY section').all();
    db.close();
    res.json({ total, bySection });
  } catch (error) { res.json({ total: 0, bySection: [] }); }
});

// Contacts CRM
app.get('/api/contacts', async (req, res) => {
  try {
    const dbPath = path.join(DATA_DIR, 'contacts.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);
    const { limit = 50, status, sort = 'interaction_count' } = req.query;
    
    let query = 'SELECT * FROM contacts';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY ${sort} DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const contacts = db.prepare(query).all(...params);
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM contacts').get().count,
      active: db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'active'").get().count,
      new: db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'new'").get().count,
      ignored: db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'ignored'").get().count
    };
    db.close();
    res.json({ contacts, stats });
  } catch (error) { res.json({ contacts: [], stats: { total: 0 }, error: error.message }); }
});

app.post('/api/contacts/:id/decide', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;
    const dbPath = path.join(DATA_DIR, 'contacts.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);
    
    // Update contact status
    db.prepare('UPDATE contacts SET status = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?').run(decision, id);
    
    // Record decision
    db.prepare('INSERT INTO decisions (contact_id, decision, reason) VALUES (?, ?, ?)').run(id, decision, reason);
    
    db.close();
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.get('/api/contacts/nudges', async (req, res) => {
  try {
    const dbPath = path.join(DATA_DIR, 'contacts.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);
    
    // Get contacts needing attention (active status, low scores)
    const nudges = db.prepare(`
      SELECT id, email, name, relationship_score, last_contacted, interaction_count
      FROM contacts 
      WHERE status = 'active' 
      ORDER BY relationship_score ASC, last_contacted ASC 
      LIMIT 10
    `).all();
    
    // Add reason for each nudge
    const results = nudges.map(c => {
      let reason = '';
      const now = Date.now();
      const last = c.last_contacted ? c.last_contacted * 1000 : 0;
      const daysSince = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : 999;
      
      if (daysSince > 60) reason = "Haven't been in touch in 2+ months";
      else if (daysSince > 30) reason = "Haven't been in touch in 30+ days";
      else if (c.interaction_count < 3) reason = "Low interaction count";
      else reason = "Relationship score needs a boost";
      
      return { ...c, reason, daysSince };
    });
    
    db.close();
    res.json({ nudges: results });
  } catch (error) { res.json({ nudges: [], error: error.message }); }
});

app.post('/api/contacts/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const dbPath = path.join(DATA_DIR, 'contacts.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);
    
    if (priority !== undefined) {
      db.prepare('UPDATE contacts SET priority = ? WHERE id = ?').run(priority, id);
    }
    
    // Recalculate score
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    const recencyScore = contact.last_contacted ? Math.max(0, 40 - Math.floor((Date.now() / 1000 - contact.last_contacted) / 86400)) : 0;
    const frequencyScore = Math.min(30, (contact.interaction_count || 0) * 5);
    const priorityScore = (4 - (contact.priority || 3)) * 10;
    const newScore = Math.min(100, recencyScore + frequencyScore + priorityScore);
    
    db.prepare('UPDATE contacts SET relationship_score = ? WHERE id = ?').run(newScore, id);
    
    db.close();
    res.json({ success: true, score: newScore });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

// Calendar merged
app.get('/api/calendar/merged', async (req, res) => {
  const { start, end } = req.query;
  const events = [];
  try {
    const calendarClient = require('./google-calendar-client.js');
    await new Promise(r => setTimeout(r, 500));
    const isAuth = calendarClient.googleCalendar.isAuthenticated();
    if (isAuth && start && end) {
      const googleEvents = await calendarClient.getEvents('primary', parseInt(start), parseInt(end));
      if (googleEvents.success && googleEvents.events) {
        googleEvents.events.forEach(e => events.push({ id: e.id, title: e.summary, start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date, source: 'google' }));
      }
    }
    res.json({ events });
  } catch (error) { res.json({ events: [] }); }
});

// Finance endpoints
app.get('/api/finances/recurring', (req, res) => { res.json({ recurring: [] }); });
app.get('/api/finances/email-detected', (req, res) => { res.json({ expenses: [] }); });
app.get('/api/opportunities', (req, res) => { res.json({ opportunities: [] }); });

// Content endpoints
app.get('/api/content/calendar/all', async (req, res) => {
  try {
    const calendarPath = path.join(DATA_DIR, 'content-calendar.json');
    const fsSync = require('fs');
    if (fsSync.existsSync(calendarPath)) {
      const data = JSON.parse(fsSync.readFileSync(calendarPath, 'utf8'));
      res.json({ events: data.calendar || [] });
    } else {
      res.json({ events: [] });
    }
  } catch (e) {
    res.json({ events: [], error: e.message });
  }
});
app.get('/api/content/automation', (req, res) => { res.json({ automations: [] }); });

// Inventory
app.get('/api/inventory/all', async (req, res) => {
  try {
    // Fetch shop items from Supabase
    const { data: shopItems } = await supabase
      .from('shop_item')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Fetch giveaway inventory
    let giveawayItems = [];
    let grouped = {};
    try {
      const giveawayData = await fs.readFile(path.join(DATA_DIR, 'giveaway_inventory.json'), 'utf8');
      giveawayItems = JSON.parse(giveawayData);
      grouped = {
        mysteryPack: giveawayItems.filter(i => i.notes?.includes('Mystery pack')),
        streamRewards: giveawayItems.filter(i => i.notes?.includes('Stream reward')),
        special: giveawayItems.filter(i => i.notes?.includes('Special')),
        available: giveawayItems.filter(i => i.status === 'available'),
        all: giveawayItems
      };
    } catch (e) { giveawayItems = []; }
    
    const shopFormatted = (shopItems || []).map(item => ({
      id: item.id, name: item.name, sku: item.stripe_product_id, qty: item.inventory_count,
      price: item.price, category: item.category, type: 'shop'
    }));
    
    const giveawayFormatted = giveawayItems.map(item => ({
      id: item.id, name: item.name, sku: item.sku, qty: item.qty,
      size: item.size, notes: item.notes, type: 'giveaway'
    }));
    
    const stats = { shop: shopFormatted.length, giveaway: giveawayFormatted.length, personal: 0, bundles: 0 };
    res.json({ items: [...shopFormatted, ...giveawayFormatted], stats, grouped });
  } catch (error) { res.json({ items: [], stats: { shop: 0, giveaway: 0, personal: 0, bundles: 0 }, grouped: {} }); }
});

// Favicon
app.get('/favicon.ico', (req, res) => { res.status(204).end(); });

// Giveaway Inventory endpoint
app.get('/api/giveaway/inventory', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'giveaway_inventory.json'), 'utf8');
    const items = JSON.parse(data);
    
    // Group by status/notes
    const grouped = {
      mysteryPack: items.filter(i => i.notes?.includes('Mystery pack')),
      streamRewards: items.filter(i => i.notes?.includes('Stream reward')),
      special: items.filter(i => i.notes?.includes('Special')),
      available: items.filter(i => i.status === 'available'),
      all: items
    };
    
    res.json({ items, grouped });
  } catch (error) {
    res.json({ items: [], grouped: {}, error: error.message });
  }
});

// Supabase shop endpoint
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://yyoxpcsspmjvolteknsn.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM'
);

app.get('/api/shop/items', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('shop_item')
      .select('*')
      .eq('available', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ items: items || [] });
  } catch (error) {
    res.json({ items: [], error: error.message });
  }
});

// Stripe/Shop endpoint - lazy load
app.get('/api/shop/products', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const products = await stripe.products.list({ active: true, expand: ['data.default_price'] });
    const items = products.data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.images?.[0] || '',
      price: p.default_price?.unit_amount ? p.default_price.unit_amount / 100 : 0,
      currency: p.default_price?.currency || 'usd'
    }));
    res.json({ items });
  } catch (error) {
    res.json({ items: [], error: error.message });
  }
});

app.get('/api/shop/orders', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const orders = await stripe.orders.list({ limit: 10 });
    res.json({ orders: orders.data });
  } catch (error) {
    res.json({ orders: [], error: error.message });
  }
});

// Moods endpoint
const moodsData = {
  moods: {
    ready: { label: 'Ready', gif: '/moods/ready.gif' },
    focused: { label: 'Focused', gif: '/moods/focused.gif' },
    working: { label: 'Working', gif: '/moods/working.gif' },
    resting: { label: 'Resting', gif: '/moods/resting.gif' },
    thinking: { label: 'Thinking', gif: '/moods/thinking.gif' },
    excited: { label: 'Excited', gif: '/moods/excited.gif' },
    creative: { label: 'Creative', gif: '/moods/creative.gif' }
  },
  agents: {
    clawdette: { name: 'Clawdette', currentMood: 'ready' },
    'knowledge-knaight': { name: 'Knowledge Knaight', currentMood: 'ready' }
  }
};

app.get('/api/moods', (req, res) => {
  res.json(moodsData);
});

app.post('/api/moods/:agent', async (req, res) => {
  const { agent } = req.params;
  const { mood } = req.body;
  if (moodsData.agents[agent]) {
    moodsData.agents[agent].currentMood = mood;
  }
  res.json({ success: true });
});

// Discord Webhook Endpoint
app.post('/api/discord/webhook', async (req, res) => {
  const { content, embed } = req.body;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL; // Ensure this is set in .env

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL not set');
    return res.status(500).json({ error: 'Webhook URL not configured' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        embeds: embed ? [embed] : []
      })
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Drive Endpoints
app.get('/api/drive/status', async (req, res) => {
  const driveClient = require('./google-drive-client.js');
  driveClient.init();
  res.json({ authenticated: driveClient.isAuthenticated() });
});

app.get('/api/drive/files', async (req, res) => {
  const driveClient = require('./google-drive-client.js');
  driveClient.init();
  
  const folderId = req.query.folderId || 'root';
  const result = await driveClient.listFiles(folderId);
  res.json(result);
});

app.get('/api/drive/guapdad', async (req, res) => {
  const driveClient = require('./google-drive-client.js');
  driveClient.init();
  
  const result = await driveClient.listGuapDadFiles();
  res.json(result);
});

// Serve React (MUST BE LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Life OS Dashboard running on port ${PORT}`);
});