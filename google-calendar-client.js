const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// OAuth2 client
let oauth2Client;

// Token storage path
const TOKEN_PATH = path.join(__dirname, 'data', 'google-calendar-token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'data', 'google-credentials.json');

// Initialize OAuth2 client
async function initOAuthClient() {
  try {
    // Check if credentials are stored
    const credsData = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(credsData);
    const { client_id, client_secret } = credentials.installed;
    
    // Use OOB redirect for VPS/headless environments
    oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      'urn:ietf:wg:oauth:2.0:oob' // Out-of-band for manual copy-paste
    );
    
    // Load saved tokens if they exist
    try {
      const tokenData = await fs.readFile(TOKEN_PATH, 'utf8');
      const tokens = JSON.parse(tokenData);
      oauth2Client.setCredentials(tokens);
      console.log('✅ Google Calendar: Tokens loaded from storage');
    } catch (e) {
      console.log('⚠️ Google Calendar: No saved tokens found, authentication required');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Google Calendar: Failed to initialize OAuth client:', error.message);
    return { success: false, error: error.message };
  }
}

// Store credentials (called when user provides credentials JSON)
async function storeCredentials(credentialsJson) {
  try {
    await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(credentialsJson, null, 2));
    console.log('✅ Google Calendar: Credentials stored');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to store credentials:', error);
    return { success: false, error: error.message };
  }
}

// Get authorization URL - supports manual code flow for headless/VPS setups
function getAuthUrl() {
  if (!oauth2Client) {
    return { success: false, error: 'OAuth client not initialized' };
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  // Use OOB (out-of-band) flow for headless/VPS - shows code to copy/paste
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob' // Out-of-band flow
  });
  
  return { 
    success: true, 
    url,
    instructions: 'After authorizing, Google will display a code. Copy that code and POST it to /api/google-calendar/auth-callback with {"code": "YOUR_CODE"}'
  };
}

// Exchange code for tokens
async function exchangeCode(code) {
  try {
    // Must specify the same redirect_uri used in getAuthUrl
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    });
    oauth2Client.setCredentials(tokens);
    
    // Save tokens
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('✅ Google Calendar: Tokens saved');
    
    return { success: true, tokens };
  } catch (error) {
    console.error('❌ Token exchange failed:', error);
    return { success: false, error: error.message };
  }
}

// Check if authenticated
function isAuthenticated() {
  if (!oauth2Client) return false;
  const creds = oauth2Client.credentials;
  return !!(creds && creds.access_token);
}

// Get calendar list
async function getCalendarList() {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();
    
    return { success: true, calendars: response.data.items };
  } catch (error) {
    console.error('❌ Failed to get calendars:', error);
    return { success: false, error: error.message };
  }
}

// Get events from a calendar
async function getEvents(calendarId = 'primary', timeMin, timeMax, maxResults = 100) {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const params = {
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    };
    
    if (timeMin) params.timeMin = new Date(timeMin).toISOString();
    if (timeMax) params.timeMax = new Date(timeMax).toISOString();
    
    const response = await calendar.events.list(params);
    
    return { success: true, events: response.data.items };
  } catch (error) {
    console.error('❌ Failed to get events:', error);
    return { success: false, error: error.message };
  }
}

// Create an event
async function createEvent(calendarId = 'primary', eventData) {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: new Date(eventData.start).toISOString(),
        timeZone: eventData.timeZone || 'America/Los_Angeles'
      },
      end: {
        dateTime: new Date(eventData.end).toISOString(),
        timeZone: eventData.timeZone || 'America/Los_Angeles'
      }
    };
    
    // Add recurrence if provided (RRULE string)
    if (eventData.recurrence) {
      event.recurrence = [eventData.recurrence];
    }
    
    // Add attendees if provided
    if (eventData.attendees && Array.isArray(eventData.attendees)) {
      event.attendees = eventData.attendees.map(email => ({ email }));
    }
    
    // Add reminders
    if (eventData.reminders) {
      event.reminders = {
        useDefault: false,
        overrides: eventData.reminders.map(r => ({
          method: r.method || 'popup',
          minutes: r.minutes
        }))
      };
    }
    
    const response = await calendar.events.insert({
      calendarId,
      resource: event
    });
    
    return { success: true, event: response.data };
  } catch (error) {
    console.error('❌ Failed to create event:', error);
    return { success: false, error: error.message };
  }
}

// Update an event
async function updateEvent(calendarId = 'primary', eventId, eventData) {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {};
    if (eventData.title) event.summary = eventData.title;
    if (eventData.description) event.description = eventData.description;
    if (eventData.location) event.location = eventData.location;
    if (eventData.start) event.start = { dateTime: new Date(eventData.start).toISOString() };
    if (eventData.end) event.end = { dateTime: new Date(eventData.end).toISOString() };
    
    const response = await calendar.events.patch({
      calendarId,
      eventId,
      resource: event
    });
    
    return { success: true, event: response.data };
  } catch (error) {
    console.error('❌ Failed to update event:', error);
    return { success: false, error: error.message };
  }
}

// Delete an event
async function deleteEvent(calendarId = 'primary', eventId) {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId,
      eventId
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete event:', error);
    return { success: false, error: error.message };
  }
}

// Get upcoming events (next 7 days by default)
async function getUpcomingEvents(calendarId = 'primary', days = 7) {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  
  return getEvents(calendarId, now, end);
}

// Sync local events to Google Calendar
async function syncEvents(localEvents, calendarId = 'primary') {
  const results = {
    created: 0,
    updated: 0,
    errors: []
  };
  
  for (const localEvent of localEvents) {
    try {
      if (localEvent.googleEventId) {
        // Update existing
        await updateEvent(calendarId, localEvent.googleEventId, localEvent);
        results.updated++;
      } else {
        // Create new
        const result = await createEvent(calendarId, localEvent);
        if (result.success) {
          localEvent.googleEventId = result.event.id;
          results.created++;
        }
      }
    } catch (error) {
      results.errors.push({ event: localEvent.title, error: error.message });
    }
  }
  
  return results;
}

// Disconnect / revoke tokens
async function disconnect() {
  try {
    if (oauth2Client && oauth2Client.credentials) {
      await oauth2Client.revokeCredentials();
    }
    // Delete stored tokens
    try {
      await fs.unlink(TOKEN_PATH);
    } catch (e) {
      // File might not exist
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Disconnect failed:', error);
    return { success: false, error: error.message };
  }
}

// Initialize on module load
initOAuthClient();

module.exports = {
  googleCalendar: {
    initOAuthClient,
    isAuthenticated
  },
  storeCredentials,
  getAuthUrl,
  exchangeCode,
  getCalendarList,
  getEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  syncEvents,
  disconnect
};