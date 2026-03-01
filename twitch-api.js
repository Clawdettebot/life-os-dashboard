// ══════════════════════════════════════════════════════════════
// TWITCH OAUTH API
// ══════════════════════════════════════════════════════════════
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/api/twitch/callback';
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || (() => { try { return require("./data/twitch-credentials.json").client_id; } catch(e) { return null; } })();
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || (() => { try { return require("./data/twitch-credentials.json").client_secret; } catch(e) { return null; } })();

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
    'channel:read:schedule',
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

    res.redirect('/?twitch=connected');
  } catch (error) {
    console.error('Twitch auth error:', error.message);
    res.redirect('/?twitch=error');
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

  const { title, startTime, endTime, categoryId } = req.body;

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

    // Create scheduled stream
    const response = await axios.post('https://api.twitch.tv/helix/schedule/segment', {
      broadcaster_id: broadcasterId,
      title: title,
      start_time: startTime,
      duration: endTime ? Math.round((new Date(endTime) - new Date(startTime)) / 60000) + 'm' : '60m',
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
