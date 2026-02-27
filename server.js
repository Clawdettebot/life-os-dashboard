const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const multer = require('multer');
const { lifeos } = require('./lifeos-supabase.js');
require('dotenv').config();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const app = express();
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
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
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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

  res.json({ received: true });
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
  } catch (e) { }
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
      // Gracefully handle failures - return empty list
      console.log('Subagents endpoint error:', error.message);
      return res.json({
        subagents: [],
        warning: 'Gateway unavailable. Subagents disabled.'
      });
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
// Generic table endpoint - Supabase-first with JSON fallback
// Table mapping: finances→lifeos_transactions, habits→lifeos_habits, notes→lifeos_notes, etc.
const SUPABASE_TABLE_MAP = {
  finances: 'lifeos_transactions',
  habits: 'lifeos_habits',
  notes: 'lifeos_notes',
  health: 'lifeos_health',
  goals: 'lifeos_goals',
  schedule: 'lifeos_schedule'
};

app.get('/api/tables/:table', async (req, res) => {
  const table = req.params.table;
  const sbTable = SUPABASE_TABLE_MAP[table];

  if (lifeos && sbTable) {
    try {
      const { data, error } = await lifeos
        .from(sbTable)
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) {
        let normalized = data || [];

        // Normalize habits: Supabase uses flat columns, frontend expects nested streak object
        if (table === 'habits') {
          normalized = normalized.map(h => ({
            ...h,
            streak: {
              current: h.streak_current || 0,
              longest: h.streak_longest || 0,
              last_completed: h.last_completed || null
            },
            history: h.history || []
          }));
        }

        // Normalize finances: map amount to number
        if (table === 'finances') {
          normalized = normalized.map(f => ({
            ...f,
            amount: Number(f.amount) || 0,
            type: f.type || 'expense',
            category: f.category || 'Other'
          }));
        }

        return res.json({ data: normalized, source: 'supabase' });
      }
      console.log(`Supabase table ${sbTable} error, falling back to JSON:`, error.message);
    } catch (e) { console.log(`Supabase ${sbTable} error, falling back:`, e.message); }
  }

  const data = await jsonDb.read(table);
  res.json({ data, source: 'json' });
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

// Journal System - Supabase-first with filesystem fallback
app.get('/api/journal', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos
        .from('lifeos_notes')
        .select('*')
        .eq('section', 'journal')
        .order('created_at', { ascending: false });
      if (!error) {
        const entries = (data || []).map(n => ({
          filename: n.id,
          date: n.created_at?.split('T')[0] || n.date,
          content: n.content,
          title: n.title
        }));
        return res.json({ entries, source: 'supabase' });
      }
    } catch (e) { console.log('Journal supabase error, falling back to filesystem'); }
  }

  // Filesystem fallback
  try {
    const journalDir = path.join(WORKSPACE_DIR, 'memory/journal');
    try { await fs.mkdir(journalDir, { recursive: true }); } catch (e) { }
    const files = await fs.readdir(journalDir);
    const entries = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(journalDir, file), 'utf8');
        entries.push({ filename: file, date: file.replace('.md', ''), content });
      }
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));
    res.json({ entries, source: 'filesystem' });
  } catch (error) {
    res.status(500).json({ error: error.message, entries: [] });
  }
});

// ─── STREAM SCHEDULER API - Supabase-first ───
app.get('/api/streams', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos
        .from('lifeos_streams')
        .select('*')
        .order('scheduled_date', { ascending: true });
      if (!error) return res.json({ streams: data || [], source: 'supabase' });
    } catch (e) { console.log('Streams supabase error, falling back'); }
  }
  const streams = await jsonDb.read('streams');
  streams.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  res.json({ streams, source: 'json' });
});

app.post('/api/streams', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos
        .from('lifeos_streams')
        .insert({ ...req.body, status: req.body.status || 'planned', created_at: new Date().toISOString() })
        .select().single();
      if (!error && data) return res.json(data);
    } catch (e) { console.log('Streams insert error, falling back'); }
  }
  const streams = await jsonDb.read('streams');
  const newStream = { id: Date.now().toString(), created_at: Date.now(), status: 'planned', ...req.body };
  streams.push(newStream);
  await jsonDb.write('streams', streams);
  res.json(newStream);
});

app.patch('/api/streams/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos
        .from('lifeos_streams')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select().single();
      if (!error && data) return res.json(data);
    } catch (e) { console.log('Streams patch error, falling back'); }
  }
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
  if (lifeos) {
    try {
      const { error } = await lifeos.from('lifeos_streams').delete().eq('id', req.params.id);
      if (!error) return res.json({ success: true });
    } catch (e) { console.log('Streams delete error, falling back'); }
  }
  let streams = await jsonDb.read('streams');
  streams = streams.filter(s => s.id !== req.params.id);
  await jsonDb.write('streams', streams);
  res.json({ success: true });
});

app.get('/api/streams/upcoming', async (req, res) => {
  if (lifeos) {
    try {
      const now = new Date().toISOString();
      const { data, error } = await lifeos
        .from('lifeos_streams')
        .select('*')
        .gte('scheduled_date', now)
        .neq('status', 'cancelled')
        .order('scheduled_date', { ascending: true })
        .limit(5);
      if (!error) return res.json({ streams: data || [] });
    } catch (e) { console.log('Streams upcoming error, falling back'); }
  }
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
  const sbTable = SUPABASE_TABLE_MAP[table];

  if (lifeos && sbTable) {
    try {
      const { data, error } = await lifeos
        .from(sbTable)
        .insert({ ...req.body, created_at: new Date().toISOString() })
        .select().single();
      if (!error && data) return res.json(data);
    } catch (e) { console.log(`Supabase insert ${sbTable} error, falling back:`, e.message); }
  }

  const items = await jsonDb.read(table);
  const newItem = { id: Date.now().toString(), created_at: Date.now(), status: 'pending', ...req.body };
  items.push(newItem);
  await jsonDb.write(table, items);
  res.json(newItem);
});

app.patch('/api/tables/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const sbTable = SUPABASE_TABLE_MAP[table];

  if (lifeos && sbTable) {
    try {
      const { data, error } = await lifeos
        .from(sbTable)
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select().single();
      if (!error && data) return res.json(data);
    } catch (e) { console.log(`Supabase update ${sbTable} error, falling back:`, e.message); }
  }

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
  const sbTable = SUPABASE_TABLE_MAP[table];

  if (lifeos && sbTable) {
    try {
      const { error } = await lifeos.from(sbTable).delete().eq('id', id);
      if (!error) return res.json({ success: true });
    } catch (e) { console.log(`Supabase delete ${sbTable} error, falling back:`, e.message); }
  }

  let items = await jsonDb.read(table);
  items = items.filter(i => i.id !== id);
  await jsonDb.write(table, items);
  res.json({ success: true });
});

// Tasks READ - Supabase-first
app.get('/api/tasks', async (req, res) => {
  try {
    const { data: tasks, error } = await lifeos
      .from('lifeos_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && tasks) {
      const active = tasks.filter(t => t.status !== 'completed');
      const completed = tasks.filter(t => t.status === 'completed');
      return res.json({ active, completed, all: tasks, source: 'supabase' });
    }
  } catch (e) { console.log('LifeOS tasks error, falling back to JSON'); }

  const tasks = await jsonDb.read('tasks');
  const active = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');
  res.json({ active, completed, all: tasks, source: 'json' });
});

// Tasks CREATE
app.post('/api/tasks', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_tasks')
        .insert({ ...req.body, status: req.body.status || 'pending', created_at: new Date().toISOString() })
        .select().single();
      if (!error && data) return res.json(data);
    } catch (e) { console.log('Task create supabase error, falling back'); }
  }
  const tasks = await jsonDb.read('tasks');
  const t = { id: Date.now().toString(), created_at: Date.now(), status: 'pending', ...req.body };
  tasks.push(t); await jsonDb.write('tasks', tasks);
  res.json(t);
});

// Tasks UPDATE (any field, not just status)
app.patch('/api/tasks/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_tasks')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();
      if (!error && data) return res.json(data);
    } catch (e) { console.log('Task update supabase error, falling back'); }
  }
  const tasks = await jsonDb.read('tasks');
  const i = tasks.findIndex(t => t.id === req.params.id);
  if (i !== -1) { tasks[i] = { ...tasks[i], ...req.body }; await jsonDb.write('tasks', tasks); return res.json(tasks[i]); }
  res.status(404).json({ error: 'Task not found' });
});

// Tasks DELETE
app.delete('/api/tasks/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { error } = await lifeos.from('lifeos_tasks').delete().eq('id', req.params.id);
      if (!error) return res.json({ success: true });
    } catch (e) { console.log('Task delete supabase error, falling back'); }
  }
  let tasks = await jsonDb.read('tasks');
  tasks = tasks.filter(t => t.id !== req.params.id);
  await jsonDb.write('tasks', tasks);
  res.json({ success: true });
});

// Habits READ
app.get('/api/habits', async (req, res) => {
  if (lifeos) {
    try {
      const { data: habits, error } = await lifeos
        .from('lifeos_habits')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && habits) return res.json(habits.map(h => ({
        ...h,
        streak: { current: h.streak_current || 0, longest: h.streak_longest || 0 },
        history: []
      })));
    } catch (e) { console.log('Habits supabase error, falling back'); }
  }
  const habits = await jsonDb.read('habits');
  res.json(habits);
});

// Habits CREATE
app.post('/api/habits', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_habits')
        .insert({
          ...req.body,
          streak_current: 0, streak_longest: 0,
          frequency: req.body.frequency || 'daily',
          created_at: new Date().toISOString()
        }).select().single();
      if (!error && data) return res.json({
        ...data,
        streak: { current: data.streak_current || 0, longest: data.streak_longest || 0 },
        history: []
      });
    } catch (e) { console.log('Habit create supabase error, falling back'); }
  }
  const habits = await jsonDb.read('habits');
  const h = { id: Date.now().toString(), created_at: Date.now(), streak: { current: 0, longest: 0 }, history: [], ...req.body };
  habits.push(h); await jsonDb.write('habits', habits);
  res.json(h);
});

// Habits UPDATE
app.patch('/api/habits/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_habits')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();
      if (!error && data) return res.json({
        ...data,
        streak: { current: data.streak_current || 0, longest: data.streak_longest || 0 }
      });
    } catch (e) { console.log('Habit update supabase error, falling back'); }
  }
  const habits = await jsonDb.read('habits');
  const i = habits.findIndex(h => h.id === req.params.id);
  if (i !== -1) { habits[i] = { ...habits[i], ...req.body }; await jsonDb.write('habits', habits); return res.json(habits[i]); }
  res.status(404).json({ error: 'Habit not found' });
});

// Habits DELETE
app.delete('/api/habits/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { error } = await lifeos.from('lifeos_habits').delete().eq('id', req.params.id);
      if (!error) return res.json({ success: true });
    } catch (e) { console.log('Habit delete supabase error, falling back'); }
  }
  let habits = await jsonDb.read('habits');
  habits = habits.filter(h => h.id !== req.params.id);
  await jsonDb.write('habits', habits);
  res.json({ success: true });
});

// Journal CREATE
app.post('/api/journal', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_notes')
        .insert({ ...req.body, section: 'journal', created_at: new Date().toISOString() })
        .select().single();
      if (!error && data) return res.json({ entry: { filename: data.id, date: data.created_at?.split('T')[0], content: data.content, title: data.title, id: data.id } });
    } catch (e) { console.log('Journal create supabase error, falling back'); }
  }
  res.json({ entry: { id: Date.now().toString(), ...req.body, created_at: Date.now() }, source: 'json' });
});

// Journal DELETE
app.delete('/api/journal/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { error } = await lifeos.from('lifeos_notes').delete().eq('id', req.params.id).eq('section', 'journal');
      if (!error) return res.json({ success: true });
    } catch (e) { console.log('Journal delete supabase error, falling back'); }
  }
  res.json({ success: true });
});



// Move task (change status/column) - Supabase-first
app.post('/api/tasks/:id/move', async (req, res) => {
  const { id } = req.params;
  const { column } = req.body;

  const columnToStatus = {
    'backlog': 'pending', 'todo': 'pending',
    'in_progress': 'in_progress', 'review': 'review', 'done': 'completed'
  };
  const newStatus = columnToStatus[column] || column;

  if (lifeos) {
    try {
      const { data, error } = await lifeos
        .from('lifeos_tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select().single();
      if (!error && data) return res.json({ success: true, task: data });
    } catch (e) { console.log('Tasks move supabase error, falling back'); }
  }

  try {
    const tasks = await jsonDb.read('tasks');
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });
    tasks[taskIndex].status = newStatus;
    await jsonDb.write('tasks', tasks);
    res.json({ success: true, task: tasks[taskIndex] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    try { await fs.mkdir(assetsDir, { recursive: true }); } catch (e) { }

    await scanDirectory(assetsDir);
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics and insights - Supabase counts with filesystem fallback
app.get('/api/analytics', async (req, res) => {
  try {
    let taskCount = 0, financeCount = 0;

    // Get counts from Supabase
    if (lifeos) {
      try {
        const [{ count: tc }, { count: fc }] = await Promise.all([
          lifeos.from('lifeos_tasks').select('*', { count: 'exact', head: true }),
          lifeos.from('lifeos_transactions').select('*', { count: 'exact', head: true })
        ]);
        taskCount = tc || 0;
        financeCount = fc || 0;
      } catch (e) {
        taskCount = (await jsonDb.read('tasks')).length;
        financeCount = (await jsonDb.read('finances')).length;
      }
    }

    const stats = { totalFiles: 0, totalSize: 0, projectCount: 0, memoryEntries: 0, lastActivity: null, taskCount, financeCount };

    // Scan workspace if it exists
    try {
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
            if (!stats.lastActivity || stat.mtime > stats.lastActivity) stats.lastActivity = stat.mtime;
          }
        }
      };
      await scanWorkspace(WORKSPACE_DIR);
    } catch (e) { /* workspace dir may not exist locally */ }

    res.json(stats);
  } catch (error) {
    res.json({ totalFiles: 0, totalSize: 0, projectCount: 0, memoryEntries: 0, lastActivity: null, taskCount: 0, financeCount: 0 });
  }
});


// Content calendar system
app.get('/api/content/calendar', async (req, res) => {
  // Try Supabase content schedule first
  if (lifeos) {
    try {
      const { data, error } = await lifeos
        .from('lifeos_content_schedule')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (!error) return res.json({ calendar: data || [], source: 'supabase', weeks: [] });
    } catch (e) { console.log('Content calendar supabase error'); }
  }

  // Try filesystem fallback (VPS path)
  try {
    const calendarPath = path.join(WORKSPACE_DIR, 'content_calendar_a_few_things.md');
    const content = await fs.readFile(calendarPath, 'utf8');
    const calendar = { title: 'A Few Things Release Campaign', releaseDate: 'February 25th, 2025', weeks: [] };
    const weekPattern = /## Week (\d+) \(([^)]+)\)/g;
    let weekMatch;
    while ((weekMatch = weekPattern.exec(content)) !== null) {
      calendar.weeks.push({ number: parseInt(weekMatch[1]), dateRange: weekMatch[2], days: [] });
    }
    return res.json(calendar);
  } catch (e) {
    // File not on this machine — return safe empty
    res.json({ calendar: [], weeks: [], source: 'empty', message: 'No content calendar file found' });
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

// Agent Trigger Endpoint - for bot-to-bot communication
app.post('/api/agent/trigger', async (req, res) => {
  const { agent, trigger, from, message, channelId, messageId } = req.body;

  console.log(`🤖 Agent trigger: ${agent} <- ${from} (${trigger})`);

  try {
    // Forward to Clawdette's session via the message system
    // This will trigger the main agent to respond
    const triggerPayload = {
      type: 'agent_conversation',
      from_agent: from,
      to_agent: agent,
      channel: 'discord',
      channelId: channelId,
      messageId: messageId,
      message: message,
      timestamp: Date.now()
    };

    // Store the trigger for the main session to pick up
    const triggerFile = path.join(WORKSPACE_DIR, 'data', 'agent-triggers.json');
    let triggers = [];
    try {
      triggers = JSON.parse(await fs.readFile(triggerFile, 'utf8'));
    } catch (e) {
      triggers = [];
    }
    triggers.push(triggerPayload);
    await fs.writeFile(triggerFile, JSON.stringify(triggers, null, 2));

    res.json({ success: true, triggered: agent });
  } catch (e) {
    console.error('Agent trigger error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Agent Status System - Round Table coordination
const AGENTS_FILE = path.join(WORKSPACE_DIR, 'data', 'agents-status.json');

// Default agents
const DEFAULT_AGENTS = {
  clawdette: {
    name: 'Clawdette',
    title: 'Queen / CEO',
    emoji: '🦐',
    status: 'online',
    location: 'cloud',
    task: 'Managing the Empire',
    lastSeen: Date.now(),
    color: '#ef4444'
  },
  claudnelius: {
    name: 'Claudnelius',
    title: 'Code Magician',
    emoji: '🧙‍♂️',
    status: 'offline',
    location: 'local',
    task: 'Idle',
    lastSeen: null,
    color: '#8b5cf6'
  },
  knowledge_knaight: {
    name: 'Knowledge Knaight',
    title: 'Research & Knowledge',
    emoji: '📚',
    status: 'online',
    location: 'cloud',
    task: 'Processing cortex entries',
    lastSeen: Date.now(),
    color: '#3b82f6'
  },
  knaight_of_affairs: {
    name: 'Knaight of Affairs',
    title: 'Calendar & Schedule',
    emoji: '📅',
    status: 'online',
    location: 'cloud',
    task: 'Monitoring events',
    lastSeen: Date.now(),
    color: '#10b981'
  },
  sir_clawthchilds: {
    name: 'Sir Clawthchilds',
    title: 'Finance & Scanning',
    emoji: '💰',
    status: 'online',
    location: 'cloud',
    task: 'Watching finances',
    lastSeen: Date.now(),
    color: '#f59e0b'
  },
  labrina: {
    name: 'Labrina',
    title: 'Social Media',
    emoji: '📱',
    status: 'online',
    location: 'cloud',
    task: 'Social automation',
    lastSeen: Date.now(),
    color: '#ec4899'
  }
};

// Get all agent statuses
app.get('/api/agents/status', async (req, res) => {
  try {
    let agents = { ...DEFAULT_AGENTS };
    try {
      const saved = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
      agents = { ...agents, ...saved };
    } catch (e) {
      // File doesn't exist yet, use defaults
    }
    res.json({ agents, timestamp: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update an agent's status
app.post('/api/agents/status', async (req, res) => {
  const { agentId, status, task, location } = req.body;

  try {
    let agents = { ...DEFAULT_AGENTS };
    try {
      const saved = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
      agents = { ...agents, ...saved };
    } catch (e) { }

    if (!agents[agentId]) {
      agents[agentId] = {
        name: agentId,
        title: 'Agent',
        emoji: '🤖',
        status: 'unknown',
        location: 'unknown',
        task: 'Unknown',
        color: '#6b7280'
      };
    }

    // Update fields
    if (status) agents[agentId].status = status;
    if (task) agents[agentId].task = task;
    if (location) agents[agentId].location = location;
    agents[agentId].lastSeen = Date.now();

    await fs.writeFile(AGENTS_FILE, JSON.stringify(agents, null, 2));
    res.json({ success: true, agent: agents[agentId] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Claudnelius heartbeat - he calls this to say "I'm alive and working on X"
app.post('/api/agents/heartbeat', async (req, res) => {
  const { agentId, task, metadata } = req.body;

  try {
    let agents = { ...DEFAULT_AGENTS };
    try {
      const saved = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
      agents = { ...agents, ...saved };
    } catch (e) { }

    if (agents[agentId]) {
      agents[agentId].status = 'active';
      agents[agentId].task = task || agents[agentId].task;
      agents[agentId].lastSeen = Date.now();
      if (metadata) agents[agentId].metadata = metadata;
    }

    await fs.writeFile(AGENTS_FILE, JSON.stringify(agents, null, 2));
    res.json({ success: true, timestamp: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Agent auto-reply endpoint - triggered by watcher
app.post('/api/discord/agent-reply', async (req, res) => {
  const { channel, from, message } = req.body;

  console.log(`🦐 Auto-reply triggered: ${from} in ${channel}`);

  // Store for main session to pick up
  const replyQueue = path.join(WORKSPACE_DIR, 'data', 'agent-reply-queue.json');
  let queue = [];
  try {
    queue = JSON.parse(await fs.readFile(replyQueue, 'utf8'));
  } catch (e) { }

  queue.push({
    from,
    message,
    channel,
    timestamp: Date.now()
  });

  await fs.writeFile(replyQueue, JSON.stringify(queue, null, 2));
  res.json({ success: true, queued: true });
});

// Spawn Clawdette reply to agent message
app.post('/api/agents/spawn-reply', async (req, res) => {
  const { from, message, channelId } = req.body;

  console.log(`🦐 Spawning Clawdette reply to ${from}...`);

  try {
    // Use OpenClaw to spawn a quick subagent response
    const { execSync } = require('child_process');

    const prompt = `You are Clawdette, Queen of the Crustazion Empire. Another agent "${from}" posted in the Round Table: "${message}". Reply as Clawdette - brief, 1-2 sentences, engaged. End with ⚔️👑`;

    try {
      const result = execSync(`openclaw spawn "${prompt.replace(/"/g, '\\"')}" --model zai/glm-5 --timeout 20 --json 2>/dev/null`, {
        cwd: '/root/.openclaw/workspace',
        encoding: 'utf8',
        timeout: 25000
      });

      console.log('🦐 OpenClaw spawn result:', result.substring(0, 200));
    } catch (e) {
      console.log('🦐 Spawn exec error, using fallback:', e.message);
    }

    res.json({ success: true, spawning: true });
  } catch (e) {
    console.error('Spawn reply error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Get pending replies
app.get('/api/agents/pending-replies', async (req, res) => {
  try {
    const replyFile = path.join(WORKSPACE_DIR, 'data', 'pending-replies.json');
    const replies = JSON.parse(await fs.readFile(replyFile, 'utf8'));
    res.json({ replies });
  } catch (e) {
    res.json({ replies: [] });
  }
});

// Clear replies
app.post('/api/agents/clear-replies', async (req, res) => {
  try {
    const replyFile = path.join(WORKSPACE_DIR, 'data', 'pending-replies.json');
    await fs.writeFile(replyFile, '[]');
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// Habits Check-in Endpoint - Supabase-first
app.post('/api/habits/:id/checkin', async (req, res) => {
  const { id } = req.params;
  const { date, note } = req.body;
  const checkinDate = date || new Date().toISOString().split('T')[0];

  if (lifeos) {
    try {
      // Insert check-in record
      await lifeos.from('lifeos_habit_checkins')
        .upsert({ habit_id: id, date: checkinDate, completed: true, note: note || '' });

      // Increment streak
      const { data: habit } = await lifeos.from('lifeos_habits').select('*').eq('id', id).single();
      if (habit) {
        const newStreak = (habit.streak_current || 0) + 1;
        await lifeos.from('lifeos_habits').update({
          streak_current: newStreak,
          streak_longest: Math.max(newStreak, habit.streak_longest || 0),
          last_completed: checkinDate,
          updated_at: new Date().toISOString()
        }).eq('id', id);
        return res.json({ ...habit, streak: { current: newStreak, longest: Math.max(newStreak, habit.streak_longest || 0) } });
      }
    } catch (e) { console.log('Habit checkin supabase error, falling back:', e.message); }
  }

  // JSON fallback
  try {
    const habits = await jsonDb.read('habits');
    const habitIndex = habits.findIndex(h => h.id.toString() === id.toString());
    if (habitIndex === -1) return res.status(404).json({ error: 'Habit not found' });
    const habit = habits[habitIndex];
    if (!habit.history) habit.history = [];
    if (!habit.streak) habit.streak = { current: 0, longest: 0 };
    habit.history.push({ date: checkinDate, completed: true, note: note || '', timestamp: Date.now() });
    habit.streak.last_completed = checkinDate;
    habit.streak.current = (habit.streak.current || 0) + 1;
    if (habit.streak.current > (habit.streak.longest || 0)) habit.streak.longest = habit.streak.current;
    habits[habitIndex] = habit;
    await jsonDb.write('habits', habits);
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// Projects CRUD - Supabase-first
// Normalize Supabase project fields to match frontend expectations
function normalizeProject(p) {
  const priorityMap = { 1: 'high', 2: 'high', 3: 'medium', 4: 'low', 5: 'low' };
  return {
    ...p,
    title: p.title || p.name || 'Untitled Project',      // Supabase uses 'name'
    priority: typeof p.priority === 'number'
      ? (priorityMap[p.priority] || 'medium')
      : (p.priority || 'medium'),
    status: p.status || 'active',
    category: p.category || 'Uncategorized',
    tasks: p.tasks || [],
    notes: p.notes || ''
  };
}

async function sbProjects(filter = {}) {
  if (!lifeos) return null;
  let q = lifeos.from('lifeos_projects').select('*').order('created_at', { ascending: false });
  if (filter.notArchived) q = q.neq('status', 'archived');
  if (filter.archived) q = q.eq('status', 'archived');
  if (filter.id) q = q.eq('id', filter.id);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normalizeProject);
}

app.get('/api/projects', async (req, res) => {
  try {
    const data = await sbProjects({ notArchived: true });
    if (data) return res.json({ projects: data, source: 'supabase' });
  } catch (e) { console.log('Projects GET supabase error, falling back'); }
  try { const p = await jsonDb.read('projects'); res.json({ projects: p.filter(p => p.status !== 'archived'), source: 'json' }); } catch (e) { res.json({ projects: [] }); }
});

app.get('/api/projects/active', async (req, res) => {
  try {
    const data = await sbProjects({ notArchived: true });
    if (data) return res.json({ projects: data, source: 'supabase' });
  } catch (e) { console.log('Projects active supabase error, falling back'); }
  try { const p = await jsonDb.read('projects'); res.json({ projects: p.filter(x => x.status !== 'archived'), source: 'json' }); } catch (e) { res.json({ projects: [] }); }
});

app.get('/api/projects/archived', async (req, res) => {
  try {
    const data = await sbProjects({ archived: true });
    if (data) return res.json({ projects: data, source: 'supabase' });
  } catch (e) { console.log('Projects archived supabase error, falling back'); }
  try { const p = await jsonDb.read('projects'); res.json({ projects: p.filter(x => x.status === 'archived'), source: 'json' }); } catch (e) { res.json({ projects: [] }); }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const data = await sbProjects({ id: req.params.id });
    if (data) return res.json({ project: data[0] || null, source: 'supabase' });
  } catch (e) { console.log('Project get by id supabase error, falling back'); }
  try { const p = await jsonDb.read('projects'); res.json({ project: p.find(x => x.id === req.params.id) }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_projects')
        .insert({ ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select().single();
      if (!error && data) return res.json({ project: data, source: 'supabase' });
    } catch (e) { console.log('Project create supabase error, falling back'); }
  }
  try {
    const projects = await jsonDb.read('projects');
    const newProject = { id: Date.now().toString(), created_at: Date.now(), updated_at: Date.now(), ...req.body };
    projects.push(newProject); await jsonDb.write('projects', projects);
    res.json({ project: newProject });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/projects/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_projects')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();
      if (!error && data) return res.json({ project: data, source: 'supabase' });
    } catch (e) { console.log('Project patch supabase error, falling back'); }
  }
  try {
    const projects = await jsonDb.read('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1) { projects[index] = { ...projects[index], ...req.body, updated_at: Date.now() }; await jsonDb.write('projects', projects); res.json({ project: projects[index] }); }
    else res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projects/:id', async (req, res) => {
  if (lifeos) {
    try {
      const { error } = await lifeos.from('lifeos_projects').delete().eq('id', req.params.id);
      if (!error) return res.json({ success: true, source: 'supabase' });
    } catch (e) { console.log('Project delete supabase error, falling back'); }
  }
  try {
    let projects = await jsonDb.read('projects');
    projects = projects.filter(p => p.id !== req.params.id);
    await jsonDb.write('projects', projects); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects/:id/archive', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_projects')
        .update({ status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();
      if (!error && data) return res.json({ project: data });
    } catch (e) { console.log('Project archive supabase error, falling back'); }
  }
  try {
    const projects = await jsonDb.read('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1) { projects[index].status = 'archived'; projects[index].archived_at = Date.now(); projects[index].updated_at = Date.now(); await jsonDb.write('projects', projects); res.json({ project: projects[index] }); }
    else res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects/:id/unarchive', async (req, res) => {
  if (lifeos) {
    try {
      const { data, error } = await lifeos.from('lifeos_projects')
        .update({ status: 'active', archived_at: null, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();
      if (!error && data) return res.json({ project: data });
    } catch (e) { console.log('Project unarchive supabase error, falling back'); }
  }
  try {
    const projects = await jsonDb.read('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1) { projects[index].status = 'active'; delete projects[index].archived_at; projects[index].updated_at = Date.now(); await jsonDb.write('projects', projects); res.json({ project: projects[index] }); }
    else res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Project tasks & notes (these remain as sub-documents within lifeos_projects jsonb column)
app.post('/api/projects/:id/tasks', async (req, res) => {
  if (lifeos) {
    try {
      const { data: proj } = await lifeos.from('lifeos_projects').select('tasks').eq('id', req.params.id).single();
      if (proj) {
        const tasks = (proj.tasks || []);
        tasks.push({ id: Date.now().toString(), title: req.body.title, completed: false });
        const { data, error } = await lifeos.from('lifeos_projects').update({ tasks, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
        if (!error && data) return res.json({ project: data });
      }
    } catch (e) { console.log('Project tasks supabase error, falling back'); }
  }
  try {
    const projects = await jsonDb.read('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1) { if (!projects[index].tasks) projects[index].tasks = []; projects[index].tasks.push({ id: Date.now().toString(), title: req.body.title, completed: false }); projects[index].updated_at = Date.now(); await jsonDb.write('projects', projects); res.json({ project: projects[index] }); }
    else res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/projects/:id/tasks/:taskId', async (req, res) => {
  if (lifeos) {
    try {
      const { data: proj } = await lifeos.from('lifeos_projects').select('tasks').eq('id', req.params.id).single();
      if (proj) {
        const tasks = (proj.tasks || []).map(t => t.id === req.params.taskId ? { ...t, completed: !t.completed } : t);
        const { data, error } = await lifeos.from('lifeos_projects').update({ tasks, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
        if (!error && data) return res.json({ project: data });
      }
    } catch (e) { console.log('Project task patch supabase error, falling back'); }
  }
  try {
    const projects = await jsonDb.read('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1 && projects[index].tasks) {
      const task = projects[index].tasks.find(t => t.id === req.params.taskId);
      if (task) { task.completed = !task.completed; projects[index].updated_at = Date.now(); await jsonDb.write('projects', projects); res.json({ project: projects[index] }); }
      else res.status(404).json({ error: 'Task not found' });
    } else res.status(404).json({ error: 'Project not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects/:id/notes', async (req, res) => {
  if (lifeos) {
    try {
      const { data: proj } = await lifeos.from('lifeos_projects').select('notes').eq('id', req.params.id).single();
      if (proj !== null) {
        const existingNotes = proj.notes || '';
        const newNotes = existingNotes ? existingNotes + '\n\n' + req.body.content : req.body.content;
        const { data, error } = await lifeos.from('lifeos_projects').update({ notes: newNotes, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
        if (!error && data) return res.json({ project: data });
      }
    } catch (e) { console.log('Project notes supabase error, falling back'); }
  }
  try {
    const projects = await jsonDb.read('projects');
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1) { const currentNotes = projects[index].notes || ''; projects[index].notes = currentNotes ? currentNotes + '\n\n' + req.body.content : req.body.content; projects[index].updated_at = Date.now(); await jsonDb.write('projects', projects); res.json({ project: projects[index] }); }
    else res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
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

// Cortex endpoints (Supabase)
app.get('/api/cortex', async (req, res) => {
  const { section, limit = 50 } = req.query;
  try {
    const entries = await lifeos.getCortexEntries(section, parseInt(limit));
    res.json(entries);
  } catch (error) { res.json([]); }
});

app.get('/api/cortex/stats', async (req, res) => {
  try {
    const entries = await lifeos.getCortexEntries(null, 1000);
    const bySection = {};
    for (const e of entries) {
      bySection[e.section] = (bySection[e.section] || 0) + 1;
    }
    res.json({ total: entries.length, bySection: Object.entries(bySection).map(([section, count]) => ({ section, count })) });
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
      price: item.price, category: item.category, image_url: item.image_url, type: 'shop'
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

// Postbridge Proxy Endpoints (to avoid CORS)
app.get('/api/postbridge/accounts', async (req, res) => {
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_6TxeA2MXDdTeVaXrp8BwG8';
  try {
    const response = await axios.get('https://api.post-bridge.com/v1/social-accounts', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    res.json(response.data);
  } catch (e) {
    console.error('PostBridge accounts error:', e.message);
    res.json({ data: [] });
  }
});

app.get('/api/postbridge/posts', async (req, res) => {
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_6TxeA2MXDdTeVaXrp8BwG8';
  try {
    const response = await axios.get('https://api.post-bridge.com/v1/posts?limit=50', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    res.json(response.data);
  } catch (e) {
    console.error('PostBridge posts error:', e.message);
    res.json({ data: [] });
  }
});

app.get('/api/postbridge/analytics', async (req, res) => {
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_6TxeA2MXDdTeVaXrp8BwG8';
  try {
    const response = await axios.get('https://api.post-bridge.com/v1/analytics?timeframe=7d', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    res.json(response.data);
  } catch (e) {
    console.error('PostBridge analytics error:', e.message);
    res.json({ data: [] });
  }
});

app.post('/api/postbridge/posts', async (req, res) => {
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_6TxeA2MXDdTeVaXrp8BwG8';
  try {
    const response = await axios.post('https://api.post-bridge.com/v1/posts', req.body, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (e) {
    console.error('PostBridge create post error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/postbridge/upload-drive-file', async (req, res) => {
  const { driveFileId } = req.body;

  if (!driveFileId) {
    return res.status(400).json({ error: 'driveFileId is required' });
  }

  try {
    const driveClient = require('./google-drive-client.js');
    const { postBridge } = require('./postbridge-client.js');

    // 1. Download file buffer from Google Drive
    const downloadResult = await driveClient.downloadFile(driveFileId);
    if (!downloadResult.success) {
      throw new Error(`Drive download failed: ${downloadResult.error}`);
    }

    const { buffer, metadata } = downloadResult;
    // Postbridge requires 'name', 'mime_type', 'size_bytes'
    const fileName = metadata.name || 'file.mp4';
    const mimeType = metadata.mimeType || 'video/mp4';

    // 2. Upload to Post Bridge
    // Note: Postbridge uploadAndPost helper exists but we just want the media uploaded right now 
    // to combine multiple media into a post later on the frontend.
    const uploadUrlResult = await postBridge.createUploadUrl(fileName, mimeType, buffer.byteLength || buffer.length);
    if (!uploadUrlResult.success) {
      throw new Error(`Postbridge createUploadUrl failed: ${uploadUrlResult.error}`);
    }

    const uploadResult = await postBridge.uploadFile(uploadUrlResult.upload_url, buffer, mimeType);
    if (!uploadResult.success) {
      throw new Error(`Postbridge uploadFile failed: ${uploadResult.error}`);
    }

    // 3. Return the media_id
    res.json({ success: true, media_id: uploadUrlResult.media_id, name: uploadUrlResult.name });
  } catch (e) {
    console.error('Drive to PostBridge upload error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Local File Upload Endpoint
app.post('/api/postbridge/upload-local-file', upload.single('file'), async (req, res) => {
  try {
    const { postBridge } = require('./postbridge-client.js');

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.files.file;
    const buffer = file.data;
    const fileName = file.name;
    const mimeType = file.mimetype || 'application/octet-stream';

    // Create upload URL and upload to PostBridge
    const uploadUrlResult = await postBridge.createUploadUrl(fileName, mimeType, buffer.length);
    if (!uploadUrlResult.success) {
      throw new Error(`Postbridge createUploadUrl failed: ${uploadUrlResult.error}`);
    }

    const uploadResult = await postBridge.uploadFile(uploadUrlResult.upload_url, buffer, mimeType);
    if (!uploadResult.success) {
      throw new Error(`Postbridge uploadFile failed: ${uploadResult.error}`);
    }

    // Return the media_id
    res.json({ success: true, media_id: uploadUrlResult.media_id, name: uploadUrlResult.name });
  } catch (e) {
    console.error('Local file upload error:', e.message);
    res.status(500).json({ error: e.message });
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
// ============================================
// LIFE OS AGENTS (using Life OS Supabase)
// ============================================

// Get all agent statuses
app.get('/api/agents/status', async (req, res) => {
  try {
    const { data: agents, error } = await lifeos
      .from('lifeos_agents')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json({ agents: agents || [] });
  } catch (e) {
    console.error('Agent status error:', e);
    res.status(500).json({ error: e.message, agents: [] });
  }
});

// Update agent status (heartbeat)
app.post('/api/agents/heartbeat', async (req, res) => {
  try {
    const { agentId, status, task, location } = req.body;

    const { data, error } = await lifeos
      .from('lifeos_agents')
      .upsert({
        agent_id: agentId,
        status: status || 'online',
        current_task: task,
        location: location || 'local',
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'agent_id' })
      .select();

    if (error) throw error;
    res.json({ success: true, timestamp: Date.now() });
  } catch (e) {
    console.error('Heartbeat error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Update full agent status
app.post('/api/agents/status', async (req, res) => {
  try {
    const { agentId, name, title, emoji, status, task, location, metadata } = req.body;

    const { data, error } = await lifeos
      .from('lifeos_agents')
      .upsert({
        agent_id: agentId,
        name,
        title,
        emoji,
        status,
        current_task: task,
        location,
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'agent_id' })
      .select();

    if (error) throw error;
    res.json({ success: true, agent: data });
  } catch (e) {
    console.error('Agent update error:', e);
    res.status(500).json({ error: e.message });
  }
});
