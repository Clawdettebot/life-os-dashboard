const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const multer = require('multer');
const { lifeos, website, getCortexEntries, getCortexTags, CORTEX_TAGS, createCortexEntry } = require('./lifeos-supabase.js');
const EmbeddingService = require('./embedding-service-supabase.js');
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

// PostBridge SMS API
const POSTBRIDGE_API = 'pb_live_SBr3HYyJLnXSXKgT7GqFZN';
const POSTBRIDGE_BASE = 'https://api.post-bridge.com/v1';

app.post('/api/sms/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message required' });
    }

    const response = await fetch('https://api.postbridge.io/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTBRIDGE_API}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, message })
    });

    const data = await response.json();
    res.json({ success: true, result: data });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/sms/schedule', async (req, res) => {
  try {
    const { to, message, send_at } = req.body;
    if (!to || !message || !send_at) {
      return res.status(400).json({ error: 'Phone, message, and send_at required' });
    }

    const response = await fetch('https://api.postbridge.io/scheduled', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTBRIDGE_API}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, message, send_at })
    });

    const data = await response.json();
    res.json({ success: true, result: data });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POSTBRIDGE SOCIAL API - Labrina's Powers
// ══════════════════════════════════════════════════════════════

// Get connected social accounts
app.get('/api/social/accounts', async (req, res) => {
  try {
    const response = await fetch(`${POSTBRIDGE_BASE}/social-accounts?limit=50`, {
      headers: {
        'Authorization': `Bearer ${POSTBRIDGE_API}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Create a post to social media
app.post('/api/social/post', async (req, res) => {
  try {
    const { caption, social_accounts, scheduled_at, media, platform_configurations } = req.body;

    if (!caption || !social_accounts) {
      return res.status(400).json({ error: 'Caption and social_accounts required' });
    }

    const payload = { caption, social_accounts };
    if (scheduled_at) payload.scheduled_at = scheduled_at;
    if (media) payload.media = media;
    if (platform_configurations) payload.platform_configurations = platform_configurations;

    const response = await fetch(`${POSTBRIDGE_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTBRIDGE_API}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.json({ success: true, post: data });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// Get post results / analytics
app.get('/api/social/analytics', async (req, res) => {
  try {
    const { timeframe = '30d', platform } = req.query;
    let url = `${POSTBRIDGE_BASE}/analytics?timeframe=${timeframe}`;
    if (platform) url += `&platform=${platform}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${POSTBRIDGE_API}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Get posts
app.get('/api/social/posts', async (req, res) => {
  try {
    const { status, platform, limit = 10, offset = 0 } = req.query;
    let url = `${POSTBRIDGE_BASE}/posts?limit=${limit}&offset=${offset}`;
    if (status) url += `&status=${status}`;
    if (platform) url += `&platform=${platform}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${POSTBRIDGE_API}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Upload media for posts
app.post('/api/social/media/upload', async (req, res) => {
  try {
    const { name, mime_type, size_bytes } = req.body;

    // Get upload URL
    const response = await fetch(`${POSTBRIDGE_BASE}/media/create-upload-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTBRIDGE_API}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, mime_type, size_bytes })
    });

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
// END POSTBRIDGE API
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// VOICE RECORDER API
// ══════════════════════════════════════════════════════════════

// Get all recordings
app.get('/api/recordings', async (req, res) => {
  try {
    const { data, error } = await lifeos
      .from('recordings')
      .select('*')
      .order('recorded_at', { ascending: false });
    if (error) throw error;
    res.json({ recordings: data || [] });
  } catch (e) { res.json({ recordings: [], error: e.message }); }
});

// Create new recording
app.post('/api/recordings', async (req, res) => {
  try {
    const { title, description } = req.body;
    const { data, error } = await lifeos
      .from('recordings')
      .insert([{ title, description, status: 'recording' }])
      .select()
      .single();
    if (error) throw error;
    res.json({ recording: data });
  } catch (e) { res.json({ error: e.message }); }
});

// Update recording status
app.patch('/api/recordings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await lifeos
      .from('recordings')
      .update({
        status
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ recording: data });
  } catch (e) { res.json({ error: e.message }); }
});

// Save transcript
app.post('/api/transcripts', async (req, res) => {
  try {
    const { recording_id, content } = req.body;
    const { data, error } = await lifeos
      .from('transcripts')
      .insert([{ recording_id, content }])
      .select()
      .single();
    if (error) throw error;
    res.json({ transcript: data });
  } catch (e) { res.json({ error: e.message }); }
});

// Save analysis
app.post('/api/analysis', async (req, res) => {
  try {
    const { recording_id, tasks, ideas, projects, summary, key_topics } = req.body;
    const { data, error } = await lifeos
      .from('recording_analysis')
      .insert([{
        recording_id,
        tasks: tasks || [],
        ideas: ideas || [],
        projects: projects || [],
        summary,
        key_topics: key_topics || []
      }])
      .select()
      .single();
    if (error) throw error;

    // Update recording status
    await lifeos.from('recordings').update({ status: 'analyzed' }).eq('id', recording_id);

    res.json({ analysis: data });
  } catch (e) { res.json({ error: e.message }); }
});

// Get recording with transcript and analysis
app.get('/api/recordings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: recording } = await lifeos.from('recordings').select('*').eq('id', id).single();
    const { data: transcript } = await lifeos.from('transcripts').select('*').eq('recording_id', id).single();
    const { data: analysis } = await lifeos.from('recording_analysis').select('*').eq('recording_id', id).single();
    res.json({ recording, transcript: transcript || null, analysis: analysis || null });
  } catch (e) { res.json({ error: e.message }); }
});

// Upload audio file
const recordingsUpload = multer({ dest: '/tmp/' });
app.post('/api/recordings/:id/upload', recordingsUpload.single('audio'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[UPLOAD] Recording ID: ${id}, File:`, req.file);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Move to permanent storage (copy + delete because cross-device rename fails)
    const destPath = `/mnt/7DC21CFC5AB9C3AB/Apps/code/life-os-dashboard/data/recordings/${req.file.filename}`;
    require('fs').mkdirSync(require('path').dirname(destPath), { recursive: true });
    require('fs').copyFileSync(req.file.path, destPath);
    require('fs').unlinkSync(req.file.path); // Clean up temp file
    console.log(`[UPLOAD] File copied to: ${destPath}`);

    // Update status only (file_path column may not exist in Supabase)
    const updateResult = await lifeos.from('recordings').update({
      status: 'transcribing'
    }).eq('id', id);
    console.log(`[UPLOAD] DB status update:`, updateResult.error ? updateResult.error.message : 'ok');

    res.json({ success: true, path: destPath });
  } catch (e) {
    console.error(`[UPLOAD] Error:`, e);
    res.json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
// END VOICE RECORDER API
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ROYAL CONCH TRANSCRIPTION PIPELINE
// ══════════════════════════════════════════════════════════════

// Get all transcripts (for Royal Conch display)
app.get('/api/transcripts', async (req, res) => {
  try {
    const { data: transcripts, error } = await lifeos
      .from('transcripts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ transcripts: transcripts || [] });
  } catch (e) { res.json({ error: e.message, transcripts: [] }); }
});

// Get transcript by recording ID
app.get('/api/recordings/:id/transcript', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: transcript } = await lifeos
      .from('transcripts')
      .select('*')
      .eq('recording_id', id)
      .single();
    res.json({ transcript });
  } catch (e) { res.json({ transcript: null }); }
});

// Transcribe audio using local Whisper
app.post('/api/recordings/:id/transcribe', async (req, res) => {
  try {
    const { id } = req.params;

    // Get recording info
    const { data: recording } = await lifeos
      .from('recordings')
      .select('*')
      .eq('id', id)
      .single();

    if (!recording) {
      return res.json({ error: 'Recording not found' });
    }

    // Look for audio file in local recordings directory
    const recordingsDir = '/mnt/7DC21CFC5AB9C3AB/Apps/code/life-os-dashboard/data/recordings';
    const files = await fs.readdir(recordingsDir);
    // Find files that start with the recording ID (multer generates unique filenames)
    const audioFile = files.find(f => f.includes(id) || f.startsWith(id.split('-')[0]));

    if (!audioFile) {
      // Try to find any recently modified file as fallback
      const recentFiles = files
        .map(f => ({ name: f, mtime: require('fs').statSync(path.join(recordingsDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime);

      if (recentFiles.length === 0) {
        return res.json({ error: 'Recording not found or no audio file' });
      }
      var audioPath = path.join(recordingsDir, recentFiles[0].name);
      console.log(`[TRANSCRIBE] Using recent file: ${recentFiles[0].name}`);
    } else {
      var audioPath = path.join(recordingsDir, audioFile);
    }

    // Check if file exists
    try {
      await fs.access(audioPath);
    } catch {
      return res.json({ error: 'Audio file not found on disk' });
    }

    // Run Whisper transcription
    console.log(`🎙️ Starting transcription for ${id}...`);

    const { exec: execAsync } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(execAsync);

    // Use local whisper CLI - output JSON for easy parsing
    const whisperCmd = `whisper "${audioPath}" --model base --language en --output_format json --output_dir /tmp`;

    let whisperOutput = '';
    try {
      const { stdout, stderr } = await execPromise(whisperCmd, { timeout: 600000 }); // 10min timeout
      whisperOutput = stdout + stderr;
    } catch (whisperErr) {
      console.error('Whisper error:', whisperErr.message);
      return res.json({ error: `Whisper failed: ${whisperErr.message}` });
    }

    // Find the generated JSON file
    const baseName = path.basename(audioPath, path.extname(audioPath));
    const jsonPath = `/tmp/${baseName}.json`;

    let transcriptText = '';
    try {
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const whisperResult = JSON.parse(jsonContent);
      transcriptText = whisperResult.text || '';
    } catch {
      // Try to find any json file
      const files = await fs.readdir('/tmp');
      const matchingFile = files.find(f => f.startsWith(baseName) && f.endsWith('.json'));
      if (matchingFile) {
        const jsonContent = await fs.readFile(`/tmp/${matchingFile}`, 'utf-8');
        const whisperResult = JSON.parse(jsonContent);
        transcriptText = whisperResult.text || '';
      }
    }

    if (!transcriptText) {
      return res.json({ error: 'No transcript generated' });
    }

    // Calculate word count
    const wordCount = transcriptText.split(/\s+/).filter(w => w.length > 0).length;

    // Save transcript to database
    const { data: transcriptData, error: transcriptError } = await lifeos
      .from('transcripts')
      .insert([{
        recording_id: id,
        content: transcriptText
      }])
      .select()
      .single();

    if (transcriptError) throw transcriptError;

    // Update recording status
    await lifeos.from('recordings').update({
      status: 'transcribed'
    }).eq('id', id);

    console.log(`✅ Transcription complete: ${wordCount} words`);

    res.json({
      success: true,
      transcript: transcriptData,
      wordCount
    });

  } catch (e) {
    console.error('Transcription error:', e);
    res.json({ error: e.message });
  }
});

// Analyze transcript - extract tasks, ideas, blog topics
app.post('/api/recordings/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;

    // Get transcript
    const { data: transcript } = await lifeos
      .from('transcripts')
      .select('*')
      .eq('recording_id', id)
      .single();

    if (!transcript) {
      return res.json({ error: 'No transcript found' });
    }

    const transcriptText = transcript.content;

    // Use Ollama for intelligent analysis
    const analysisPrompt = `You are a helpful assistant that analyzes voice transcripts and extracts structured information. 

Analyze this transcript and extract:
1. TASKS - Action items, things to do, follow-ups (prefix with "[TASK]")
2. IDEAS - Business ideas, creative concepts, project ideas (prefix with "[IDEA]")
3. BLOG TOPICS - Interesting topics worth writing about (prefix with "[BLOG]")
4. SOLID ENTRIES - Facts, knowledge, or insights worth saving to a knowledge base (prefix with "[KNOWLEDGE]")
5. SUMMARY - A brief 2-3 sentence summary of what this recording was about

Return your response as a JSON object with this exact structure:
{
  "tasks": ["task 1", "task 2"],
  "ideas": ["idea 1", "idea 2"],
  "blogTopics": ["topic 1", "topic 2"],
  "knowledge": ["knowledge item 1", "knowledge item 2"],
  "summary": "brief summary here"
}

Transcript:
${transcriptText}`;

    let analysisResult = null;

    try {
      // Try Minimax API
      const minimaxKey = process.env.MINIMAX_API_KEY;
      if (minimaxKey) {
        const mmResponse = await axios.post('https://api.minimax.chat/v1/text/chatcompletion_pro', {
          model: 'MiniMax-M2.5',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.3
        }, {
          headers: { 'Authorization': `Bearer ${minimaxKey}`, 'Content-Type': 'application/json' }
        });

        const responseText = mmResponse.data.choices?.[0]?.message?.content || '';
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        }
      } else {
        throw new Error('No Minimax API key');
      }
    } catch (ollamaErr) {
      console.log('AI not available, using rule-based analysis');

      // Fallback: Rule-based extraction
      const lines = transcriptText.split(/[.!?\n]+/).filter(l => l.trim().length > 10);

      const tasks = [];
      const ideas = [];
      const blogTopics = [];
      const knowledge = [];

      const taskKeywords = ['todo', 'task', 'need to', 'have to', 'should', 'must', 'remember to', 'don\'t forget', 'follow up', 'schedule', 'call', 'email', 'fix', 'update', 'create', 'build', 'make', 'remind me', 'add to task', 'action item'];
      const ideaKeywords = ['idea', 'concept', 'what if', 'could', 'would be cool', 'we should', 'think about', 'new', 'build', 'start', 'launch', 'thought of', 'realized', 'journal'];
      const blogKeywords = ['story', 'blog', 'post', 'write about', 'explain', 'teach', 'how to', 'why i', 'my thoughts on', 'opinion on', 'blog about', 'write a post'];

      for (const line of lines) {
        const lower = line.toLowerCase();

        if (taskKeywords.some(k => lower.includes(k))) {
          tasks.push(line.trim());
        } else if (ideaKeywords.some(k => lower.includes(k))) {
          ideas.push(line.trim());
        } else if (blogKeywords.some(k => lower.includes(k))) {
          blogTopics.push(line.trim());
        } else if (line.length > 30 && line.length < 200) {
          knowledge.push(line.trim());
        }
      }

      analysisResult = {
        tasks: tasks.slice(0, 5),
        ideas: ideas.slice(0, 5),
        blogTopics: blogTopics.slice(0, 5),
        knowledge: knowledge.slice(0, 5),
        summary: transcriptText.substring(0, 200) + '...'
      };
    }

    console.log(`[ANALYSIS] Result:`, JSON.stringify(analysisResult));

    // Save analysis to database
    const { data: analysisData, error: analysisError } = await lifeos
      .from('recording_analysis')
      .insert([{
        recording_id: id,
        tasks: analysisResult.tasks || [],
        ideas: analysisResult.ideas || [],
        summary: analysisResult.summary || ''
      }])
      .select()
      .single();

    if (analysisError) throw analysisError;

    // Save extracted items to Cortex (properly categorized)
    const cortexEntries = [];
    console.log(`[CORTEX] Saving tasks: ${JSON.stringify(analysisResult.tasks)}`);
    console.log(`[CORTEX] Saving ideas: ${JSON.stringify(analysisResult.ideas)}`);

    // Save TASKS as tasks
    for (const task of analysisResult.tasks || []) {
      try {
        const { data: cortexTask, error: taskErr } = await lifeos.from('lifeos_cortex').insert([{
          title: `Task: ${task.substring(0, 50)}`,
          content: task,
          section: 'all_spark',
          category: 'project'
        }]).select().single();
        if (taskErr) {
          console.error('[CORTEX] Task save error:', taskErr.message);
        } else {
          cortexEntries.push({ type: 'task', id: cortexTask?.id });
          console.log(`[CORTEX] Task saved: ${cortexTask?.id}`);
        }
      } catch (e) { console.error('Task save error:', e.message); }
    }

    // Save IDEAS to Cortex
    for (const idea of analysisResult.ideas || []) {
      try {
        const { data: cortexIdea, error: ideaErr } = await lifeos.from('lifeos_cortex').insert([{
          title: `Idea: ${idea.substring(0, 50)}`,
          content: idea,
          section: 'all_spark',
          category: 'idea'
        }]).select().single();
        if (ideaErr) {
          console.error('[CORTEX] Idea save error:', ideaErr.message);
        } else {
          cortexEntries.push({ type: 'idea', id: cortexIdea?.id });
          console.log(`[CORTEX] Idea saved: ${cortexIdea?.id}`);
        }
      } catch (e) { console.error('Idea save error:', e.message); }
    }

    // Save BLOG TOPICS to Idea Bank
    for (const topic of analysisResult.blogTopics || []) {
      try {
        const { data: blogIdea, error: blogErr } = await lifeos.from('lifeos_cortex').insert([{
          title: `Blog: ${topic.substring(0, 50)}`,
          content: topic,
          section: 'all_spark',
          category: 'content'
        }]).select().single();
        if (blogErr) {
          console.error('[CORTEX] Blog save error:', blogErr.message);
        } else {
          cortexEntries.push({ type: 'blog', id: blogIdea?.id });
          console.log(`[CORTEX] Blog saved: ${blogIdea?.id}`);
        }
      } catch (e) { console.error('Blog save error:', e.message); }
    }

    // Save KNOWLEDGE to Cortex (solid entries)
    for (const item of analysisResult.knowledge || []) {
      try {
        const { data: cortexItem, error: knowErr } = await lifeos.from('lifeos_cortex').insert([{
          title: `Knowledge: ${item.substring(0, 50)}`,
          content: item,
          section: 'all_spark',
          category: 'tech'
        }]).select().single();
        if (knowErr) {
          console.error('[CORTEX] Knowledge save error:', knowErr.message);
        } else {
          cortexEntries.push({ type: 'knowledge', id: cortexItem?.id });
          console.log(`[CORTEX] Knowledge saved: ${cortexItem?.id}`);
        }
      } catch (e) { console.error('Knowledge save error:', e.message); }
    }

    // Update recording status
    await lifeos.from('recordings').update({
      status: 'analyzed'
    }).eq('id', id);

    console.log(`✅ Analysis complete: ${cortexEntries.length} items saved to Cortex`);

    res.json({
      success: true,
      analysis: analysisData,
      cortexEntries
    });

  } catch (e) {
    console.error('Analysis error:', e);
    res.json({ error: e.message });
  }
});

// Full pipeline: transcribe + analyze in one call
app.post('/api/recordings/:id/process', async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Transcribe
    const transcriptRes = await axios.post(`http://localhost:3000/api/recordings/${id}/transcribe`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (transcriptRes.data.error) {
      return res.json({ error: 'Transcription failed: ' + transcriptRes.data.error });
    }

    // Step 2: Analyze
    const analyzeRes = await axios.post(`http://localhost:3000/api/recordings/${id}/analyze`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });

    res.json({
      success: true,
      transcript: transcriptRes.data,
      analysis: analyzeRes.data
    });

  } catch (e) {
    res.json({ error: e.message });
  }
});

// Blog Posts API - now from Supabase
app.post('/api/blog/posts', async (req, res) => {
  try {
    const client = website || supabase;
    const { title, content: body, excerpt, status } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    const { data, error } = await client
      .from('blog_post')
      .insert([{
        title,
        content: body,
        excerpt: excerpt || (body ? body.substring(0, 150) + '...' : ''),
        status: status || 'draft',
        premium_tier: 'free_game',
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, post: data });
  } catch (e) {
    console.error('Blog create error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/blog/posts', async (req, res) => {
  try {
    const client = website || supabase;
    const { data: posts, error } = await client
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

    // Use the website Supabase (yyoxpcsspmjvolteknsn)
    const client = supabase;

    const slug = (title || 'voice-drop-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: newPost, error } = await client
      .from('blog_post')
      .insert([{
        title: title || 'Voice Drop ' + new Date().toLocaleDateString(),
        content: transcript || '',
        excerpt: (transcript || '').substring(0, 150) + '...',
        status: 'draft',
        premium_tier: 'free_game',
        slug: slug + '-' + Date.now()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      const blogData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
      const localPost = {
        id: 'post_' + Date.now(),
        title: title || 'Voice Drop ' + new Date().toLocaleDateString(),
        content: transcript,
        tags,
        source: 'voice-drop',
        status: 'draft',
        created_at: new Date().toISOString()
      };
      blogData.posts.push(localPost);
      blogData.voice_drops.push(localPost);
      await fs.writeFile(path.join(DATA_DIR, 'blog-posts.json'), JSON.stringify(blogData, null, 2));
      return res.json({ success: true, post: localPost, fallback: true });
    }

    res.json({ success: true, post: newPost });
  } catch (e) {
    console.error('Voice-drop error:', e);
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

// Delete blog post
app.delete('/api/blog/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = website || supabase;

    const { error } = await client
      .from('blog_post')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
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

app.get('/api/blog/ideas', async (req, res) => {
  try {
    const blogData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
    res.json({ ideas: blogData.ideas || [], data: blogData.ideas || [] });
  } catch (e) {
    res.json({ ideas: [], data: [] });
  }
});

app.post('/api/blog/ideas', async (req, res) => {
  try {
    const blogData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
    if (!blogData.ideas) blogData.ideas = [];
    const newIdea = { id: Date.now(), title: req.body.title || req.body.content || 'New Idea', created_at: new Date().toISOString(), status: 'raw' };
    blogData.ideas.push(newIdea);
    await fs.writeFile(path.join(DATA_DIR, 'blog-posts.json'), JSON.stringify(blogData, null, 2));
    res.json({ success: true, idea: newIdea });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// Delete blog idea
app.delete('/api/blog/ideas/:id', async (req, res) => {
  try {
    const blogData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'blog-posts.json'), 'utf-8'));
    if (!blogData.ideas) blogData.ideas = [];
    const id = req.params.id;
    blogData.ideas = blogData.ideas.filter(i => String(i.id) !== String(id));
    await fs.writeFile(path.join(DATA_DIR, 'blog-posts.json'), JSON.stringify(blogData, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
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

const RECIPES_FILE = path.join(__dirname, 'data', 'kitchen.json');

async function getRecipes() {
  try {
    const data = await fs.readFile(RECIPES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { recipes: [] };
  }
}

// GET /api/recipes - Get all recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const data = await getRecipes();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/recipes - Add a new recipe
app.post('/api/recipes', async (req, res) => {
  const { name, category, tags, description, ingredients, instructions, prep_time, cook_time, servings, source } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  try {
    const data = await getRecipes();
    const recipe = {
      id: 'recipe_' + Date.now(),
      name,
      category: category || 'Uncategorized',
      tags: tags || [],
      description: description || '',
      ingredients: ingredients || [],
      instructions: instructions || '',
      prep_time: prep_time || '',
      cook_time: cook_time || '',
      servings: servings || 1,
      source: source || '',
      created_at: new Date().toISOString()
    };

    data.recipes = data.recipes || [];
    data.recipes.push(recipe);
    await fs.writeFile(RECIPES_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true, recipe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// RESEARCH LINKS API - Save links for research
// ============================================
const RESEARCH_LINKS_FILE = path.join(__dirname, 'data', 'research-links.json');

async function getResearchLinks() {
  try {
    const data = await fs.readFile(RESEARCH_LINKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { links: [] };
  }
}

// GET /api/research/links - Get all saved links
app.get('/api/research/links', async (req, res) => {
  try {
    const data = await getResearchLinks();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/research/links - Save a new link (with optional scrape)
app.post('/api/research/links', async (req, res) => {
  const { url, title, description, tags, category, scrape } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  try {
    let content = '';

    // If scrape=true, fetch the actual content
    if (scrape) {
      try {
        const { default: puppeteer } = require('puppeteer');
        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Extract main content
        content = await page.evaluate(() => {
          // Remove scripts and styles
          document.querySelectorAll('script, style, nav, header, footer, .ad, .advertisement').forEach(el => el.remove());

          // Try to get main content
          const main = document.querySelector('article') ||
            document.querySelector('main') ||
            document.querySelector('.content') ||
            document.querySelector('#content') ||
            document.body;

          // Get text content
          return main ? main.innerText.substring(0, 10000) : ''; // Limit to 10k chars
        });

        await browser.close();
      } catch (scrapeErr) {
        console.error('Scrape error:', scrapeErr.message);
        content = '[Could not scrape content]';
      }
    }

    const data = await getResearchLinks();
    const link = {
      id: 'link_' + Date.now(),
      url,
      title: title || url,
      description: description || '',
      content: content, // The scraped text
      tags: tags || [],
      category: category || 'uncategorized',
      saved_at: new Date().toISOString()
    };

    data.links = data.links || [];
    data.links.push(link);
    await fs.writeFile(RESEARCH_LINKS_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true, link });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/research/scrape - Just scrape a URL, don't save
app.post('/api/research/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  try {
    const { default: puppeteer } = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const result = await page.evaluate(() => {
      // Get title
      const title = document.title;

      // Remove unwanted elements
      document.querySelectorAll('script, style, nav, header, footer, .ad, .advertisement, .sidebar, .comments').forEach(el => el.remove());

      // Get main content
      const main = document.querySelector('article') ||
        document.querySelector('main') ||
        document.querySelector('.content') ||
        document.body;

      const text = main ? main.innerText : '';

      return {
        title,
        content: text.substring(0, 15000) // 15k char limit
      };
    });

    await browser.close();
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message, hint: 'Site may be blocking scrapers' });
  }
});

// ============================================
// AGENT MESSAGES API - For Round Table Agent Channel
// ============================================

const MESSAGES_FILE = path.join(__dirname, 'data', 'agent-messages.json');

async function getMessages() {
  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { messages: [] };
  }
}

async function saveMessages(data) {
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(data, null, 2));
}

// GET /api/agents/messages - Get messages for a channel
app.get('/api/agents/messages', async (req, res) => {
  const { channel = 'round-table', limit = 50 } = req.query;

  try {
    const data = await getMessages();
    const messages = data.messages
      .filter(m => m.channel === channel)
      .slice(-parseInt(limit));
    res.json({ messages, channel });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/agents/messages - Send a message to a channel
app.post('/api/agents/messages', async (req, res) => {
  const { agentId, agentName, channel = 'round-table', content, color = '#fff' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  try {
    const data = await getMessages();
    const message = {
      id: 'msg_' + Date.now(),
      agentId,
      agentName: agentName || agentId,
      channel,
      content,
      color,
      timestamp: new Date().toISOString()
    };

    data.messages = data.messages || [];
    data.messages.push(message);
    await saveMessages(data);

    res.json({ success: true, message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/messages - Get last message for an agent
app.get('/api/messages', async (req, res) => {
  const { agent } = req.query;

  try {
    const data = await getMessages();
    let messages = data.messages;

    if (agent) {
      messages = messages.filter(m => m.agentId === agent);
    }

    const lastMsg = messages[messages.length - 1];
    res.json({ message: lastMsg?.content || '', messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(express.static(path.join(__dirname, 'client/build')));

// ============================================
// CORTEX TAGS API
// ============================================
const CORTEX_TAGS_FILE = path.join(__dirname, 'data', 'cortex-tags.json');

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
  tasks: 'lifeos_tasks',
  projects: 'lifeos_projects',
  finances: 'lifeos_transactions',
  habits: 'lifeos_habits',
  notes: 'lifeos_notes',
  health: 'lifeos_health',
  goals: 'lifeos_goals',
  schedule: 'lifeos_schedule',
  ideas: 'ideas'
};

// ══════════════════════════════════════════════════════════════
// TWITCH OAUTH API
// ══════════════════════════════════════════════════════════════
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/api/twitch/callback';
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || (() => { try { return require("./data/twitch-credentials.json").client_id; } catch (e) { return null; } })();
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || (() => { try { return require("./data/twitch-credentials.json").client_secret; } catch (e) { return null; } })();

// Store tokens in memory (for production, use a database)
let twitchTokens = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null
};

// Load saved token if exists
(async () => {
  try {
    const tokenData = await fs.readFile(path.join(__dirname, 'data', 'twitch-token.json'), 'utf8');
    const saved = JSON.parse(tokenData);
    twitchTokens = {
      accessToken: saved.access_token,
      refreshToken: saved.refresh_token,
      expiresAt: saved.expires_at
    };
    console.log('✓ Twitch token loaded');
  } catch (e) { /* No token saved yet */ }
})();

// Get OAuth authorization URL
app.get('/api/twitch/auth-url', (req, res) => {
  if (!TWITCH_CLIENT_ID) {
    return res.status(500).json({ error: 'Twitch Client ID not configured' });
  }

  const scopes = [
    'user:read:email',
    'channel:read:subscriptions',
    'channel:manage:schedule',
    'user:manage:whispers'
  ].join(' ');

  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}`;

  res.json({ authUrl });
});

// OAuth callback - exchange code for token (redirect version)
app.get('/api/twitch/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?twitch=error');

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    return res.redirect('/?twitch=error');
  }

  try {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TWITCH_REDIRECT_URI
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    twitchTokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000)
    };

    // Save token to file
    await fs.writeFile(path.join(__dirname, 'data', 'twitch-token.json'), JSON.stringify({
      access_token,
      refresh_token,
      expires_at: twitchTokens.expiresAt
    }, null, 2));

    // Return HTML that closes popup and redirects main window
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'twitch-connected' }, '*');
              window.opener.location.href = '/?twitch=connected';
            }
            window.close();
          </script>
        </head>
        <body>
          <p>Connected! Closing...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Twitch auth error:', error.message);
    // Return HTML that shows error and closes popup
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            if (window.opener) {
              window.opener.location.href = '/?twitch=error';
            }
          </script>
        </head>
        <body>
          <p>Error connecting. You can close this window.</p>
        </body>
      </html>
    `);
  }
});

// OAuth callback - exchange code for token (API version)
app.post('/api/twitch/auth-callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Twitch credentials not configured' });
  }

  try {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TWITCH_REDIRECT_URI
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    twitchTokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000)
    };

    // Save token
    await fs.writeFile(path.join(__dirname, 'data', 'twitch-token.json'), JSON.stringify({
      access_token,
      refresh_token,
      expires_at: twitchTokens.expiresAt
    }, null, 2));

    res.json({ success: true, expiresIn: expires_in });
  } catch (error) {
    console.error('Twitch token exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

// Get Twitch connection status
app.get('/api/twitch/status', async (req, res) => {
  if (!twitchTokens.accessToken || !twitchTokens.expiresAt || twitchTokens.expiresAt < Date.now()) {
    // Try to refresh
    if (twitchTokens.refreshToken) {
      const refreshed = await refreshTwitchToken();
      if (!refreshed) {
        return res.json({ connected: false });
      }
    } else {
      return res.json({ connected: false });
    }
  }

  try {
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${twitchTokens.accessToken}`
      }
    });

    res.json({
      connected: true,
      user: userResponse.data.data?.[0] || null
    });
  } catch (error) {
    console.error('Twitch status error:', error.message);
    res.json({ connected: false });
  }
});

// Refresh token if needed
async function refreshTwitchToken() {
  if (!twitchTokens.refreshToken || !TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    return false;
  }

  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        refresh_token: twitchTokens.refreshToken,
        grant_type: 'refresh_token'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    twitchTokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000)
    };

    // Save refreshed token
    await fs.writeFile(path.join(__dirname, 'data', 'twitch-token.json'), JSON.stringify({
      access_token,
      refresh_token,
      expires_at: twitchTokens.expiresAt
    }, null, 2));

    return true;
  } catch (error) {
    console.error('Twitch token refresh error:', error.message);
    return false;
  }
}

// Get scheduled streams from Twitch
app.get('/api/twitch/schedule', async (req, res) => {
  if (!twitchTokens.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Twitch' });
  }

  try {
    if (twitchTokens.expiresAt < Date.now()) {
      const refreshed = await refreshTwitchToken();
      if (!refreshed) {
        return res.status(401).json({ error: 'Twitch session expired' });
      }
    }

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${twitchTokens.accessToken}`
      }
    });

    if (!userResponse.data.data || userResponse.data.data.length === 0) {
      return res.json({ schedule: [], broadcaster: null });
    }

    const broadcaster = userResponse.data.data[0];
    const broadcasterId = broadcaster.id;

    // Get schedule
    const scheduleResponse = await axios.get('https://api.twitch.tv/helix/schedule', {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${twitchTokens.accessToken}`
      },
      params: {
        broadcaster_id: broadcasterId
      }
    });

    res.json({
      schedule: scheduleResponse.data.data?.segments || [],
      broadcaster: broadcaster
    });
  } catch (error) {
    console.error('Twitch schedule error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Twitch schedule' });
  }
});

// Create scheduled stream on Twitch
app.post('/api/twitch/schedule', async (req, res) => {
  if (!twitchTokens.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Twitch' });
  }

  const { title, startTime, endTime, categoryId, timezone } = req.body;

  if (!title || !startTime) {
    return res.status(400).json({ error: 'Title and start time are required' });
  }

  try {
    if (twitchTokens.expiresAt < Date.now()) {
      const refreshed = await refreshTwitchToken();
      if (!refreshed) {
        return res.status(401).json({ error: 'Twitch session expired' });
      }
    }

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${twitchTokens.accessToken}`
      }
    });

    const broadcasterId = userResponse.data.data[0]?.id;
    const tz = timezone || 'America/Los_Angeles';

    // Calculate duration in minutes
    let duration = '60';
    if (endTime) {
      duration = String(Math.round((new Date(endTime) - new Date(startTime)) / 60000));
    }

    // Create scheduled stream
    const response = await axios.post(
      `https://api.twitch.tv/helix/schedule/segment?broadcaster_id=${broadcasterId}&timezone=${tz}`,
      {
        title: title,
        start_time: startTime,
        duration: duration,
        category_id: categoryId
      }, {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${twitchTokens.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, segment: response.data.data });
  } catch (error) {
    console.error('Twitch schedule create error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create scheduled stream' });
  }
});

// Disconnect Twitch
app.post('/api/twitch/disconnect', async (req, res) => {
  twitchTokens = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  };
  try {
    await fs.unlink(path.join(__dirname, 'data', 'twitch-token.json'));
  } catch (e) { /* ignore */ }
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
// END TWITCH OAUTH API
// ══════════════════════════════════════════════════════════════
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
            title: f.description || 'Unknown',
            amount: Number(f.amount) || 0,
            type: f.type || 'expense',
            category: f.category || 'Other'
          }));
        }

        // Normalize notes: infer title from content
        if (table === 'notes') {
          normalized = normalized.map(n => {
            let inferTitle = 'Untitled Note';
            if (n.content) {
              const firstLine = n.content.split('\n')[0];
              inferTitle = firstLine.replace(/^#\s*/, '').substring(0, 40);
            }
            return { ...n, title: inferTitle };
          });
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
    // Fetch from Website Supabase
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
  // ══════════════════════════════════════════════════════════════
  // TWITCH OAUTH API
  // ══════════════════════════════════════════════════════════════
  // Disconnect Twitch
  app.post('/api/twitch/disconnect', async (req, res) => {
    twitchTokens = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null
    };
    try {
      await fs.unlink(path.join(__dirname, 'data', 'twitch-token.json'));
    } catch (e) { /* ignore */ }
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════════
  // END TWITCH OAUTH API
  // ══════════════════════════════════════════════════════════════
  const { table } = req.params;
  const sbTable = SUPABASE_TABLE_MAP[table];

  if (lifeos && sbTable) {
    try {
      let payload = { ...req.body };

      // For finances, allow amount, type, date fields
      if (table !== 'finances') {
        // Filter out fields that don't exist in Supabase for other tables
        const validFields = ['name', 'description', 'status', 'category', 'priority', 'progress', 'start_date', 'target_date', 'tags', 'links'];
        Object.keys(payload).forEach(k => { if (!validFields.includes(k)) delete payload[k]; });
      }

      // Map frontend fields for finances
      if (table === 'finances') {
        if (payload.title !== undefined) { payload.description = payload.title; }
        payload.type = payload.type || 'expense';
        payload.amount = Number(payload.amount) || 0;
      }

      if (table === 'notes' && payload.title !== undefined) { delete payload.title; }
      if (table === 'projects' && payload.title !== undefined) { payload.name = payload.title; delete payload.title; }

      const { data, error } = await lifeos
        .from(sbTable)
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select().single();
      if (error) console.error(`[DEBUG] Supabase insert error on ${sbTable}:`, error);
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
      let payload = { ...req.body };
      // Filter out fields that don't exist in Supabase
      const validFields = ['name', 'description', 'status', 'category', 'priority', 'progress', 'start_date', 'target_date', 'tags', 'links'];
      Object.keys(payload).forEach(k => { if (!validFields.includes(k)) delete payload[k]; });
      if (table === 'finances' && payload.title !== undefined) { payload.description = payload.title; delete payload.title; }
      if (table === 'notes' && payload.title !== undefined) { delete payload.title; }
      if (table === 'projects' && payload.title !== undefined) { payload.name = payload.title; delete payload.title; }
      const { data, error } = await lifeos
        .from(sbTable)
        .update({ ...payload, updated_at: new Date().toISOString() })
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
      if (error) console.error(`[DEBUG] Supabase insert error on tasks:`, error);
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
      if (error) console.error(`[DEBUG] Supabase insert error on habits:`, error);
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

  // ============================================
  // AGENTS API - Aliases for /api/agents/*
  // ============================================

  // GET /api/agents - Get all agent statuses (alias for /api/agents/status)
  app.get('/api/agents', async (req, res) => {
    try {
      let agents = { ...DEFAULT_AGENTS };
      try {
        const saved = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
        agents = { ...agents, ...saved };
      } catch (e) { }
      res.json({ agents, timestamp: Date.now() });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/agents - Register/update agent (alias for /api/agents/status)
  app.post('/api/agents', async (req, res) => {
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


  // PATCH /api/agents/:id - Update agent status
  app.patch('/api/agents/:id', async (req, res) => {
    const agentId = req.params.id;
    const updates = req.body;

    try {
      let agents = { ...DEFAULT_AGENTS };
      try {
        const saved = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
        agents = { ...agents, ...saved };
      } catch (e) { }

      if (!agents[agentId]) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Update allowed fields
      if (updates.status) agents[agentId].status = updates.status;
      if (updates.task) agents[agentId].task = updates.task;
      if (updates.location) agents[agentId].location = updates.location;
      if (updates.title) agents[agentId].title = updates.title;
      if (updates.emoji) agents[agentId].emoji = updates.emoji;
      if (updates.color) agents[agentId].color = updates.color;
      agents[agentId].lastSeen = Date.now();

      await fs.writeFile(AGENTS_FILE, JSON.stringify(agents, null, 2));
      res.json({ success: true, agent: agents[agentId] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/agents/:id - Remove/unregister agent
  app.delete('/api/agents/:id', async (req, res) => {
    const agentId = req.params.id;

    try {
      let agents = { ...DEFAULT_AGENTS };
      try {
        const saved = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
        agents = { ...agents, ...saved };
      } catch (e) { }

      if (!agents[agentId]) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      delete agents[agentId];

      await fs.writeFile(AGENTS_FILE, JSON.stringify(agents, null, 2));
      res.json({ success: true, message: `Agent ${agentId} removed` });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

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
    const data = await sbProjects(); // Now returns all projects
    if (data) return res.json({ projects: data, source: 'supabase' });
  } catch (e) { console.log('Projects GET supabase error, falling back'); }
  try { const p = await jsonDb.read('projects'); res.json({ projects: p, source: 'json' }); } catch (e) { res.json({ projects: [] }); }
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
      let payload = { ...req.body };
      // Filter out fields that don't exist in Supabase
      const validFields = ['name', 'description', 'status', 'category', 'priority', 'progress', 'start_date', 'target_date', 'tags', 'links'];
      Object.keys(payload).forEach(k => { if (!validFields.includes(k)) delete payload[k]; });
      if (payload.title !== undefined) { payload.name = payload.title; delete payload.title; }
      if (payload.priority) { const pMap = { high: 2, medium: 3, low: 4 }; payload.priority = pMap[payload.priority] || 3; }
      const { data, error } = await lifeos.from('lifeos_projects')
        .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select().single();
      if (error) console.error(`[DEBUG] Supabase insert error on projects:`, error);
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
      let payload = { ...req.body };
      // Filter out fields that don't exist in Supabase
      const validFields = ['name', 'description', 'status', 'category', 'priority', 'progress', 'start_date', 'target_date', 'tags', 'links'];
      Object.keys(payload).forEach(k => { if (!validFields.includes(k)) delete payload[k]; });
      if (payload.title !== undefined) { payload.name = payload.title; delete payload.title; }
      if (payload.priority) { const pMap = { high: 2, medium: 3, low: 4 }; payload.priority = pMap[payload.priority] || 3; }
      const { data, error } = await lifeos.from('lifeos_projects')
        .update({ ...payload, updated_at: new Date().toISOString() })
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
        .update({ status: 'archived', updated_at: new Date().toISOString() })
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
        .update({ status: 'active', updated_at: new Date().toISOString() })
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
// Get auth URL for re-authentication
app.get('/api/google-calendar/auth-url', async (req, res) => {
  try {
    const calendarClient = require('./google-calendar-client.js');
    const url = await calendarClient.getAuthUrl();
    res.json({ authUrl: url, instructions: 'Visit the URL, authorize, then POST to /api/google-calendar/auth-callback with {"code": "THE_CODE"}' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Exchange auth code for tokens
app.post('/api/google-calendar/auth-callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    const calendarClient = require('./google-calendar-client.js');
    await calendarClient.exchangeCode(code);
    res.json({ success: true, message: 'Google Calendar re-authenticated!' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

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
    const entries = await getCortexEntries(section, parseInt(limit));
    res.json(entries);
  } catch (error) { res.json([]); }
});


// Quick cortex search (limited results)
app.post('/api/cortex/quick', async (req, res) => {
  try {
    const { title, content: body, section, category, media_url } = req.body;
    if (!title || !section) {
      return res.status(400).json({ error: 'Title and section required' });
    }

    const { data, error } = await lifeos
      .from('lifeos_cortex')
      .insert([{
        title,
        content: body || '',
        section,
        category: category || '',
        content_type: 'note',
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, entry: data });
  } catch (e) {
    console.error('Cortex quick add error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cortex/quick', async (req, res) => {
  const { q = '' } = req.query;
  try {
    const entries = await getCortexEntries('main', 10);
    const filtered = entries.filter(e =>
      e.content.toLowerCase().includes(q.toLowerCase()) ||
      (e.title && e.title.toLowerCase().includes(q.toLowerCase()))
    );
    res.json(filtered.slice(0, 5));
  } catch (error) { res.json([]); }
});
// POST /api/cortex - Add entry with auto-link-scraping
app.post('/api/cortex', async (req, res) => {
  const { section, content, title, metadata } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  try {
    let finalContent = content;
    let scrapedData = null;

    // Auto-scrape any URLs in the content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);

    if (urls && urls.length > 0) {
      console.log(`🕷️ Found ${urls.length} URLs in cortex entry, scraping...`);

      for (const url of urls) {
        try {
          const { default: puppeteer } = require('puppeteer');
          const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

          const result = await page.evaluate(() => {
            const title = document.title;
            document.querySelectorAll('script, style, nav, header, footer, .ad, .sidebar, .comments').forEach(el => el.remove());
            const main = document.querySelector('article') || document.querySelector('main') || document.body;
            const text = main ? main.innerText.substring(0, 8000) : '';
            return { title, text };
          });

          await browser.close();

          scrapedData = scrapedData || {};
          scrapedData[url] = result;
          console.log(`🕷️ Scraped: ${result.title}`);
        } catch (e) {
          console.log(`🕷️ Failed to scrape ${url}: ${e.message}`);
        }
      }
    }

    // Create the cortex entry
    const entry = {
      section: section || 'general',
      content: finalContent,
      title: title || finalContent.substring(0, 100),
      metadata: {
        ...metadata,
        scraped: scrapedData,
        original_urls: urls || []
      },
      created_at: new Date().toISOString()
    };

    const result = await createCortexEntry(entry);
    res.json({ success: true, entry: result, scraped: !!scrapedData });
  } catch (error) {
    console.error('Cortex entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cortex/stats', async (req, res) => {
  try {
    const entries = await getCortexEntries(null, 1000);
    const bySection = {};
    for (const e of entries) {
      bySection[e.section] = (bySection[e.section] || 0) + 1;
    }
    res.json({ total: entries.length, bySection: Object.entries(bySection).map(([section, count]) => ({ section, count })) });
  } catch (error) { res.json({ total: 0, bySection: [] }); }
});

// Cortex tags endpoint - returns all predefined tags organized by section
// Hardcoded cortex tags - guaranteed to work
const HARDCODED_TAGS = {
  emerald_tablets: [
    { tag: 'history', color: 'gold', description: 'Historical events' },
    { tag: 'culture', color: 'purple', description: 'Cultural traditions' },
    { tag: 'timeline', color: 'blue', description: 'Chronological data' },
    { tag: 'person', color: 'pink', description: 'Notable individuals' },
    { tag: 'event', color: 'green', description: 'Happenings' },
    { tag: 'african_american', color: 'amber', description: 'African American history' },
    { tag: 'oakland', color: 'violet', description: 'Oakland-specific' }
  ],
  all_spark: [
    { tag: 'idea', color: 'cyan', description: 'Raw ideas' },
    { tag: 'project', color: 'purple', description: 'Projects in progress' },
    { tag: 'creative', color: 'rose', description: 'Creative works' },
    { tag: 'content', color: 'orange', description: 'Content ideas' },
    { tag: 'merch', color: 'lime', description: 'Merchandise' },
    { tag: 'startup', color: 'teal', description: 'Business ideas' }
  ],
  howls_kitchen: [
    { tag: 'recipe', color: 'red', description: 'Recipes' },
    { tag: 'review', color: 'teal', description: 'Restaurant reviews' },
    { tag: 'technique', color: 'purple', description: 'Cooking techniques' },
    { tag: 'restaurant', color: 'yellow', description: 'Restaurant info' }
  ],
  hitchhiker_guide: [
    { tag: 'survival', color: 'green', description: 'Survival skills' },
    { tag: 'diy', color: 'blue', description: 'DIY projects' },
    { tag: 'tech', color: 'purple', description: 'Tech knowledge' }
  ]
};

app.get('/api/cortex/tags', async (req, res) => {
  const { section } = req.query;
  if (section) {
    res.json({ [section]: HARDCODED_TAGS[section] || [] });
  } else {
    res.json(HARDCODED_TAGS);
  }
});
// Cortex media upload endpoint - uploads image/file to Supabase Storage
app.post('/api/cortex/media', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folder = 'cortex' } = req.query;
    const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads', folder);

    // Ensure directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = req.file.originalname.split('.').pop() || 'txt';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file locally
    await fs.writeFile(filepath, req.file.buffer);

    // Return the URL path
    const urlPath = `/api/uploads/${folder}/${filename}`;
    res.json({ url: urlPath, filename, success: true });
  } catch (error) {
    console.error('Media upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files
app.get('/api/uploads/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;
  const filepath = path.join(__dirname, 'data', 'uploads', folder, filename);
  res.sendFile(filepath);
});


// Cortex DELETE — LifeOS Supabase
app.delete('/api/cortex/:id', async (req, res) => {
  try {
    const { error } = await lifeos.from('lifeos_cortex').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

// Contacts CREATE — SQLite
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, priority } = req.body;
    if (!name && !email) return res.status(400).json({ error: 'Name or email required' });
    const dbPath = path.join(DATA_DIR, 'contacts.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);

    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, status, priority, relationship_score, interaction_count, created_at, updated_at)
      VALUES (?, ?, ?, 'new', ?, 50, 0, strftime('%s', 'now'), strftime('%s', 'now'))
    `);
    const result = stmt.run(name || '', email || '', phone || '', priority || 'medium');
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);

    db.close();
    res.json({ success: true, contact });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

// Contacts DELETE — SQLite
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const dbPath = path.join(DATA_DIR, 'contacts.db');
    const SQLite = require('better-sqlite3');
    const db = new SQLite(dbPath);
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ success: true });
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
  console.log('[DEBUG] inventory/all called');
  try {
    // Fetch shop items from Supabase
    console.log('[DEBUG] querying shop_item...');
    const result = await supabase
      .from('shop_item')
      .select('*')
      .order('created_at', { ascending: false });
    console.log('[DEBUG] shopItems result:', result);
    const { data: shopItems, error: shopError } = result;

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
  } catch (error) { console.log('[DEBUG] inventory error:', error); res.json({ items: [], stats: { shop: 0, giveaway: 0, personal: 0, bundles: 0 }, grouped: {} }); }
});

// Inventory CREATE — Website Supabase (shop_item)
app.post('/api/inventory', async (req, res) => {
  try {
    const { name, sku, qty, price, category, type, size, notes, image_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const { data, error } = await supabase
      .from('shop_item')
      .insert([{
        name,
        stripe_product_id: sku || null,
        inventory_count: qty || 0,
        price: price ? String(price) : '0',
        category: category || type || 'shop',
        description: notes || '',
        image_url: image_url || null,
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select().single();
    if (error) throw error;
    res.json({ success: true, item: { id: data.id, name: data.name, sku: data.stripe_product_id, qty: data.inventory_count, price: data.price, category: data.category, type: category || 'shop' } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Inventory UPDATE — Website Supabase (shop_item)
app.patch('/api/inventory/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    // Map frontend field names to Supabase columns
    if (updates.qty !== undefined) { updates.inventory_count = updates.qty; delete updates.qty; }
    if (updates.sku !== undefined) { updates.stripe_product_id = updates.sku; delete updates.sku; }
    if (updates.notes !== undefined) { updates.description = updates.notes; delete updates.notes; }
    if (updates.price !== undefined) { updates.price = String(updates.price); }
    const { data, error } = await supabase
      .from('shop_item')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ success: true, item: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Inventory DELETE — Website Supabase (shop_item)
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('shop_item').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
  'https://yyoxpcsspmjvolteknsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM'
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
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_SBr3HYyJLnXSXKgT7GqFZN';
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
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_SBr3HYyJLnXSXKgT7GqFZN';
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
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_SBr3HYyJLnXSXKgT7GqFZN';
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
  const API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_SBr3HYyJLnXSXKgT7GqFZN';
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

// ============================================
// OLLAMA LOCAL AI CHAT
// ============================================
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Get available models
app.get('/api/ollama/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
    res.json(response.data.models || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models', details: error.message });
  }
});

// Chat with a model
app.post('/api/ollama/chat', async (req, res) => {
  const { model, messages } = req.body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'Model and messages required' });
  }

  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/chat`, {
      model,
      messages,
      stream: false
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});

// Streaming chat
app.post('/api/ollama/chat/stream', async (req, res) => {
  const { model, messages } = req.body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'Model and messages required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/chat`, {
      model,
      messages,
      stream: true
    }, { responseType: 'stream' });

    response.data.on('data', (chunk) => {
      res.write(chunk.toString());
    });

    response.data.on('end', () => {
      res.write('[DONE]');
      res.end();
    });

    response.data.on('error', (err) => {
      res.write(`[ERROR]${err.message}`);
      res.end();
    });
  } catch (error) {
    res.write(`[ERROR]${error.message}`);
    res.end();
  }
});

// ============================================
// KNOWLEDGE KNIGHT CHAT
// ============================================
app.post('/api/knaight/chat', async (req, res) => {
  const { model, messages, section } = req.body;

  if (!model || !messages || messages.length === 0) {
    return res.status(400).json({ error: 'Model and messages required' });
  }

  try {
    const lastUserMessage = messages[messages.length - 1].content;
    const embeddingService = new EmbeddingService();

    // 1. Perform Semantic Search (RAG)
    let contextData = '';
    try {
      const searchResults = await embeddingService.search(lastUserMessage, 5);
      if (searchResults && searchResults.length > 0) {
        contextData = "RELEVANT CORTEX CONTEXT:\n" + searchResults.map(d =>
          `- [${d.section}] ${d.title}: ${d.content ? d.content.substring(0, 300) : ''}`
        ).join("\n\n");
      }
    } catch (e) {
      console.warn('Semantic search failed, falling back to recent data', e.message);
      // Fallback to recent entries if RAG fails
      const { data } = await supabase
        .from('lifeos_cortex')
        .select('title, content, section')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) {
        contextData = "RECENT CORTEX DATA:\n" + data.map(d => `- [${d.section}] ${d.title}: ${d.content?.substring(0, 200)}`).join("\n");
      }
    }

    const systemPrompt = `You are Knowledge Knaight, the Guardian of the Cortex (the user's second brain).
Personality: Analytical, precise, efficient, slightly mysterious.
Values clarity over volume.
Communication Style: Concise and direct. Uses emojis: 📜 (tablets/history), ⚡ (ideas/all spark), 🍳 (food/kitchen), 🛸 (tech/guide).

TOOLS AVAILABLE:
You can perform actions by including one of these commands in your response (exactly as shown):
- ACTION: ADD_TO_CORTEX | TITLE: [title] | CONTENT: [content] | SECTION: [section]
- ACTION: SEND_DISCORD | MESSAGE: [message]
- ACTION: SEARCH_WEB | QUERY: [query]

Sections: all_spark (ideas), emerald_tablets (history), howls_kitchen (food), hitchhikers_guide (tech).

If you use a tool, explain what you are doing.

${contextData ? `\n${contextData}\n` : ''}

Answer the user's quest. If context is provided, use it. If you add something to cortex, confirm it.`;

    // Initial chat call
    const chatResponse = await axios.post(`${OLLAMA_HOST}/api/chat`, {
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false
    });

    let assistantResponse = chatResponse.data.message.content;
    let toolResults = [];

    // 2. Simple Tool Execution Logic
    if (assistantResponse.includes('ACTION:')) {
      const lines = assistantResponse.split('\n');
      for (const line of lines) {
        if (line.includes('ACTION: ADD_TO_CORTEX')) {
          const title = line.match(/TITLE: (.*?)( \||$)/)?.[1];
          const content = line.match(/CONTENT: (.*?)( \||$)/)?.[1];
          const section = line.match(/SECTION: (.*?)( \||$)/)?.[1] || 'all_spark';

          if (title && content) {
            try {
              await lifeos.from('lifeos_cortex').insert({ title, content, section });
              toolResults.push(`✅ Successfully added "${title}" to ${section}`);
            } catch (err) {
              toolResults.push(`❌ Failed to add to cortex: ${err.message}`);
            }
          }
        } else if (line.includes('ACTION: SEND_DISCORD')) {
          const message = line.match(/MESSAGE: (.*?)( \||$)/)?.[1];
          if (message) {
            try {
              const { exec } = require('child_process');
              exec(`openclaw message send --channel discord --message "${message.replace(/"/g, '\\"')}"`);
              toolResults.push(`✅ Message sent to Discord`);
            } catch (err) {
              toolResults.push(`❌ Failed to send to Discord`);
            }
          }
        }
      }
    }

    // Append tool results to response if any
    if (toolResults.length > 0) {
      assistantResponse += "\n\n**System Actions:**\n" + toolResults.join("\n");
    }

    res.json({
      message: { role: 'assistant', content: assistantResponse },
      context: contextData // Send context back for frontend display
    });
  } catch (error) {
    console.error('Knaight Chat failed:', error.message);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});

// Send message to Discord
app.post('/api/discord/send', async (req, res) => {
  const { channelId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    // Use the message tool via subprocess
    const { execSync } = require('child_process');

    const cmd = channelId
      ? `openclaw message send --channel discord --target ${channelId} --message "${message.replace(/"/g, '\\"')}"`
      : `openclaw message send --channel discord --message "${message.replace(/"/g, '\\"')}"`;

    execSync(cmd, { encoding: 'utf8' });
    res.json({ success: true, message: 'Sent to Discord' });
  } catch (error) {
    console.error('Discord send error:', error.message);
    res.status(500).json({ error: 'Failed to send to Discord', details: error.message });
  }
});

// ============================================================
// ABYSSAL DISPATCH - Daily Digest System
// ============================================================

// Generate new dispatch
app.post('/api/abyssal-dispatch/generate', async (req, res) => {
  try {
    const { generateDailyDigest } = require('./abyssal-dispatch.js');
    require('./labrina-routes')
    const result = await generateDailyDigest();
    res.json({ success: true, dispatch: result });
  } catch (e) {
    console.error('Dispatch generation error:', e);
    res.json({ error: e.message });
  }
});

// Get today's dispatch
app.get('/api/abyssal-dispatch/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await lifeos
      .from('abyssal_dispatches')
      .select('*')
      .eq('date', today)
      .single();

    if (error || !data) {
      const { generateDailyDigest } = require('./abyssal-dispatch.js');
      require('./labrina-routes')
      const result = await generateDailyDigest();
      return res.json({ dispatch: result });
    }

    res.json({ dispatch: data });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Get dispatch by date
app.get('/api/abyssal-dispatch/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { data, error } = await lifeos
      .from('abyssal_dispatches')
      .select('*')
      .eq('date', date)
      .single();

    res.json({ dispatch: data || null });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Get all dispatches (for timeline)
app.get('/api/abyssal-dispatch', async (req, res) => {
  try {
    const { data, error } = await lifeos
      .from('abyssal_dispatches')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    res.json({ dispatches: data || [] });
  } catch (e) {
    res.json({ error: e.message, dispatches: [] });
  }
});

// Regenerate specific section
app.post('/api/abyssal-dispatch/regenerate-section', async (req, res) => {
  try {
    const { section } = req.body;
    const { getWordOfTheDay, getTagalogLesson, getFrenchLesson, getCurrentEvents, getRantIdeas, getViralPrompt, getBrainPrompts, getQuote } = require('./abyssal-dispatch.js');
    require('./labrina-routes')

    let newContent;
    switch (section) {
      case 'word': newContent = await getWordOfTheDay(); break;
      case 'tagalog': newContent = getTagalogLesson(); break;
      case 'french': newContent = getFrenchLesson(); break;
      case 'events': newContent = await getCurrentEvents(3); break;
      case 'rants': newContent = getRantIdeas(); break;
      case 'viral': newContent = getViralPrompt(); break;
      case 'prompts': newContent = getBrainPrompts(); break;
      case 'quote': newContent = getQuote(); break;
      default: return res.json({ error: 'Unknown section' });
    }

    res.json({ success: true, section, content: newContent });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ============================================
// STREAM CLIPPER API
// ============================================
const fsSync = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

// In-memory clip history (persists for server lifetime)
const clipHistory = [];

// Stream video file through server
app.get('/api/stream-clipper/stream', (req, res) => {
  const videoPath = req.query.path;
  if (!videoPath) return res.status(400).json({ error: 'No path provided' });

  try {
    const stat = fsSync.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fsSync.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fsSync.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Stream error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stream-clipper/videos', async (req, res) => {
  const videoPath = req.query.path || '/videos/livestreams';
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];

  try {
    if (!fsSync.existsSync(videoPath)) {
      return res.json({ videos: [], error: 'Path not found: ' + videoPath });
    }

    const files = fsSync.readdirSync(videoPath)
      .filter(f => videoExts.includes(path.extname(f).toLowerCase()))
      .map(f => {
        const stats = fsSync.statSync(path.join(videoPath, f));
        return { name: f, path: path.join(videoPath, f), size: stats.size, modified: stats.mtime };
      })
      .sort((a, b) => b.modified - a.modified);

    res.json({ videos: files });
  } catch (e) {
    res.json({ videos: [], error: e.message });
  }
});

// ffprobe metadata for a video file
app.get('/api/stream-clipper/probe', async (req, res) => {
  const videoPath = req.query.path;
  if (!videoPath) return res.status(400).json({ error: 'No path' });
  try {
    const cmd = `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`;
    const { stdout } = await execPromise(cmd);
    const info = JSON.parse(stdout);
    const videoStream = (info.streams || []).find(s => s.codec_type === 'video') || {};
    const format = info.format || {};
    res.json({
      duration: parseFloat(format.duration || 0),
      width: videoStream.width || 0,
      height: videoStream.height || 0,
      codec: videoStream.codec_name || 'unknown',
      bitrate: parseInt(format.bit_rate || 0),
      size: parseInt(format.size || 0)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export clip — uses stream copy (no re-encode = instant)
app.post('/api/stream-clipper/export', async (req, res) => {
  const { inputPath, outputName, startTime, endTime, outputDir: customDir } = req.body;

  // Validate required fields
  if (!inputPath || !outputName || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ error: 'Missing required fields: inputPath, outputName, startTime, endTime' });
  }
  if (!fsSync.existsSync(inputPath)) {
    return res.status(400).json({ error: `Input file not found: ${inputPath}` });
  }

  const defaultDir = path.join(process.env.HOME || '/home/falcon', 'Videos', 'clips');
  const outputDir = customDir && customDir.trim() ? customDir.trim() : defaultDir;
  // Sanitize output name (remove characters that could break the command)
  const safeName = outputName.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
  const outputPath = path.join(outputDir, `${safeName}.mp4`);

  if (!fsSync.existsSync(outputDir)) { fsSync.mkdirSync(outputDir, { recursive: true }); }

  const duration = endTime - startTime;
  if (duration <= 0) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // Use -c copy for instant stream-copy (no re-encoding). -avoid_negative_timestamps
  // fixes PTS issues common in live recordings.
  const ffmpegCmd = `ffmpeg -ss ${startTime} -i "${inputPath}" -t ${duration} -c copy -avoid_negative_timestamps 1 "${outputPath}" -y`;

  try {
    await execPromise(ffmpegCmd);
    const stats = fsSync.statSync(outputPath);
    const entry = {
      id: Date.now(),
      name: safeName,
      outputPath,
      sourceName: path.basename(inputPath),
      startTime,
      endTime,
      duration,
      size: stats.size,
      exportedAt: new Date().toISOString()
    };
    clipHistory.unshift(entry);
    if (clipHistory.length > 50) clipHistory.pop(); // Keep last 50
    res.json({ success: true, outputPath, clip: entry });
  } catch (e) {
    console.error('Export clip error:', e.message);
    console.error('Failed ffmpeg cmd:', ffmpegCmd);
    res.status(500).json({ error: e.message });
  }
});

// Get clip history
app.get('/api/stream-clipper/clips', (req, res) => {
  // Filter out clips whose files no longer exist
  const live = clipHistory.filter(c => fsSync.existsSync(c.outputPath));
  res.json({ clips: live });
});

// Thumbnail: extract a frame from the middle of the video
app.get('/api/stream-clipper/thumbnail', async (req, res) => {
  const videoPath = req.query.path;
  if (!videoPath) return res.status(400).json({ error: 'No path' });

  // Cache thumbs in /tmp by hashing the path
  const thumbName = Buffer.from(videoPath).toString('base64').replace(/[/+=]/g, '_') + '.jpg';
  const thumbPath = path.join('/tmp', 'lifeos_thumbs', thumbName);

  if (!fsSync.existsSync(path.join('/tmp', 'lifeos_thumbs'))) {
    fsSync.mkdirSync(path.join('/tmp', 'lifeos_thumbs'), { recursive: true });
  }

  if (fsSync.existsSync(thumbPath)) {
    // Serve cached thumbnail
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fsSync.createReadStream(thumbPath).pipe(res);
  }

  try {
    // Probe duration first so we can snapshot the midpoint
    const probeCmd = `ffprobe -v quiet -print_format json -show_format "${videoPath}"`;
    const { stdout } = await execPromise(probeCmd);
    const info = JSON.parse(stdout);
    const dur = parseFloat(info.format?.duration || 0);
    const seekTo = Math.max(1, Math.floor(dur / 2));

    const cmd = `ffmpeg -ss ${seekTo} -i "${videoPath}" -vframes 1 -q:v 5 -vf "scale=320:-1" "${thumbPath}" -y`;
    await execPromise(cmd);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fsSync.createReadStream(thumbPath).pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Waveform: return normalised peak amplitude array (N=200 buckets) for the timeline
app.get('/api/stream-clipper/waveform', async (req, res) => {
  const videoPath = req.query.path;
  const buckets = Math.min(parseInt(req.query.buckets || '200', 10), 500);
  if (!videoPath) return res.status(400).json({ error: 'No path' });

  try {
    // Use ffmpeg's astats filter to get RMS per frame, then downsample to buckets
    // We output one value per frame at 4fps, which is coarse but very fast
    const cmd = `ffmpeg -i "${videoPath}" -af "aresample=8000,astats=metadata=1:reset=1" -f null - 2>&1 | grep "RMS level" | awk '{print $NF}'`;
    const { stdout } = await execPromise(`bash -c '${cmd.replace(/'/g, "'\\''")}'`);

    const rawValues = stdout.trim().split('\n')
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && isFinite(v));

    if (rawValues.length === 0) {
      // Fallback: generate placeholder flat waveform
      return res.json({ peaks: Array(buckets).fill(0.1) });
    }

    // Convert dBFS to linear amplitude (dBFS is negative; 0 dBFS = max)
    const linear = rawValues.map(db => Math.pow(10, db / 20));
    const maxVal = Math.max(...linear, 0.0001);

    // Downsample into `buckets` bins by averaging
    const peaks = Array.from({ length: buckets }, (_, i) => {
      const start = Math.floor((i / buckets) * linear.length);
      const end = Math.floor(((i + 1) / buckets) * linear.length);
      const slice = linear.slice(start, end);
      if (slice.length === 0) return 0;
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      return Math.min(avg / maxVal, 1);
    });

    res.json({ peaks });
  } catch (e) {
    // Return flat waveform on error rather than crashing the UI
    res.json({ peaks: Array(buckets).fill(0.1), error: e.message });
  }
});

// Batch export: process a queue of {inputPath, outputName, startTime, endTime} jobs sequentially
app.post('/api/stream-clipper/batch-export', async (req, res) => {
  const { jobs, outputDir: customDir } = req.body;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({ error: 'No jobs provided' });
  }

  const defaultDir = path.join(process.env.HOME || '/home/falcon', 'Videos', 'clips');
  const outputDir = customDir && customDir.trim() ? customDir.trim() : defaultDir;
  if (!fsSync.existsSync(outputDir)) { fsSync.mkdirSync(outputDir, { recursive: true }); }

  const results = [];
  for (const job of jobs) {
    const { inputPath, outputName, startTime, endTime } = job;
    const outputPath = path.join(outputDir, `${outputName}.mp4`);
    const duration = endTime - startTime;
    const cmd = `ffmpeg -ss ${startTime} -i "${inputPath}" -t ${duration} -c copy -avoid_negative_timestamps 1 "${outputPath}" -y`;

    try {
      await execPromise(cmd);
      const stats = fsSync.statSync(outputPath);
      const entry = {
        id: Date.now() + results.length,
        name: outputName,
        outputPath,
        sourceName: path.basename(inputPath),
        startTime,
        endTime,
        duration,
        size: stats.size,
        exportedAt: new Date().toISOString()
      };
      clipHistory.unshift(entry);
      results.push({ ...entry, success: true });
    } catch (e) {
      results.push({ name: outputName, success: false, error: e.message });
    }
  }
  if (clipHistory.length > 50) clipHistory.length = 50;

  res.json({ results, successCount: results.filter(r => r.success).length });
});

// Download an exported clip as a browser file download
app.get('/api/stream-clipper/download', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'No path provided' });
  if (!fsSync.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  const filename = path.basename(filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'video/mp4');
  fsSync.createReadStream(filePath).pipe(res);
});

// Mobile clip export with crop filter (9:16 Dual Cam for Reels/Shorts/TikTok)
app.post('/api/stream-clipper/export-mobile', async (req, res) => {
  const {
    inputPath, outputName, startTime, endTime,
    topBox, bottomBox, videoWidth, videoHeight,
    outputDir: customDir
  } = req.body;

  if (!inputPath || outputName === undefined || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const defaultDir = path.join(process.env.HOME || '/home/falcon', 'Videos', 'clips');
  const outputDir = customDir && customDir.trim() ? customDir.trim() : defaultDir;
  if (!fsSync.existsSync(outputDir)) { fsSync.mkdirSync(outputDir, { recursive: true }); }

  const outputPath = path.join(outputDir, `${outputName}_dualcam.mp4`);
  const duration = endTime - startTime;

  const srcH = Math.round(parseFloat(videoHeight) || 1080);
  const srcW = Math.round(parseFloat(videoWidth) || 1920);

  // Parse Top Box Box Dimensions
  const tx = Math.max(0, Math.round(topBox.x * srcW));
  const ty = Math.max(0, Math.round(topBox.y * srcH));
  const tw = Math.min(srcW - tx, Math.round(topBox.w * srcW));
  const th = Math.min(srcH - ty, Math.round(topBox.h * srcH));

  // Parse Bottom Box Dimensions
  const bx = Math.max(0, Math.round(bottomBox.x * srcW));
  const by = Math.max(0, Math.round(bottomBox.y * srcH));
  const bw = Math.min(srcW - bx, Math.round(bottomBox.w * srcW));
  const bh = Math.min(srcH - by, Math.round(bottomBox.h * srcH));

  // The output width is 1080.
  // We calculate proportional output heights based on the actual aspect ratios.
  // (Both scales must be even numbers for h264 encode)
  const targetW = 1080;
  let topTargetH = Math.round(targetW * (th / tw));
  if (topTargetH % 2 !== 0) topTargetH += 1;

  let botTargetH = Math.round(targetW * (bh / bw));
  if (botTargetH % 2 !== 0) botTargetH += 1;

  // Final vstacked video will be exactly 1080x(topTargetH + botTargetH), 
  // which will functionally equal 1080x1920.

  const filterComplex = `[0:v]crop=${tw}:${th}:${tx}:${ty},scale=${targetW}:${topTargetH}:flags=bicubic[top]; [0:v]crop=${bw}:${bh}:${bx}:${by},scale=${targetW}:${botTargetH}:flags=bicubic[bottom]; [top][bottom]vstack[out]`;

  const ffmpegCmd = [
    `ffmpeg -ss ${startTime}`,
    `-i "${inputPath}"`,
    `-t ${duration}`,
    `-filter_complex "${filterComplex}"`,
    `-map "[out]"`,
    `-map 0:a?`,
    `-c:v libx264 -preset fast -crf 22`,
    `-c:a aac -b:a 192k`,
    `-movflags +faststart`,
    `"${outputPath}" -y`
  ].join(' ');

  try {
    await execPromise(ffmpegCmd);
    const stats = fsSync.statSync(outputPath);
    const entry = {
      id: Date.now(),
      name: outputName + '_mobile',
      outputPath,
      sourceName: path.basename(inputPath),
      startTime, endTime, duration,
      size: stats.size,
      exportedAt: new Date().toISOString(),
      isMobile: true
    };
    clipHistory.unshift(entry);
    if (clipHistory.length > 50) clipHistory.length = 50;
    res.json({ success: true, outputPath, clip: entry });
  } catch (e) {
    console.error('Mobile export error:', e.message);
    res.status(500).json({ error: e.message });
  }
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

// ============================================================
// ABYSSAL DISPATCH - Daily Cron Job (10am PST)
// ============================================================
const cron = require('cron');

function scheduleAbyssalDispatch() {
  // 10am PST = 18:00 UTC
  const job = new cron.CronJob('0 18 * * *', async () => {
    console.log('🔱 Generating Abyssal Dispatch...');
    try {
      const { generateDailyDigest } = require('./abyssal-dispatch.js');
      require('./labrina-routes')
      const result = await generateDailyDigest();
      console.log('✅ Abyssal Dispatch generated:', result?.date);
    } catch (e) {
      console.error('❌ Abyssal Dispatch failed:', e.message);
    }
  }, null, false, 'America/Los_Angeles');

  job.start();
  console.log('⏰ Abyssal Dispatch scheduled for 10am PST');
}

// Run on startup
setTimeout(scheduleAbyssalDispatch, 5000);

// Test: Create multiple dispatch entries
app.post('/api/abyssal-dispatch/create-test', async (req, res) => {
  try {
    const designs = [0, 1, 2, 3, 4];
    const dates = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'];

    for (let i = 0; i < dates.length; i++) {
      await lifeos.from('abyssal_dispatches').upsert({
        date: dates[i],
        content: {
          date: dates[i],
          word_of_the_day: { word: `Word${i + 1}`, definition: 'Definition here', partOfSpeech: 'noun' },
          tagalog_lesson: { phrase: 'Lesson phrase', meaning: 'Meaning' },
          french_lesson: { phrase: 'French phrase', meaning: 'Meaning' },
          current_events: [{ title: `Event ${i + 1}`, description: 'Description', source: 'Source' }],
          rant_ideas: ['Rant idea 1', 'Rant idea 2'],
          viral_prompt: { hook: 'Viral hook', format: 'Video' },
          stream_schedule: [{ day: 'Monday', time: '8PM', activity: 'Stream' }],
          brain_prompts: ['Prompt 1', 'Prompt 2'],
          quote: { text: 'Quote text', author: 'Author' }
        },
        card_design: designs[i],
        status: 'generated'
      }, { onConflict: 'date' });
    }
    res.json({ success: true, created: dates.length });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ============================================
// STREAM CLIPPER API
// ============================================

// Note: fs, path, exec already declared at top of file
// But need sync fs for this module
