/**
 * Abyssal Dispatch Generator v2.0
 * Daily digest system for Milord - 10am PST
 * 
 * IMPROVEMENTS v2:
 * - Real internet sources for news/trends
 * - Dynamic themed days (not same template)
 * - Milord-specific content from his projects
 * - Actionable items from his task system
 * - Personal context from Cortex
 */

require('dotenv').config();
const axios = require('axios');
const { lifeos } = require('./lifeos-supabase.js');

// ============================================
// CONFIGURATION
// ============================================

const THEMES = [
  'creative',      // Focus on creative/content ideas
  'business',      // Focus on industry/business news
  'learning',      // Focus on language/education
  'community',     // Focus on social/trends
  'deep_dive'      // Focus on long-form content prompts
];

// ============================================
// REAL NEWS FETCHERS
// ============================================

/**
 * Get trending tech/creative news from multiple real sources
 */
async function getRealNews(count = 4) {
  const events = [];
  
  // Try Brave Search for trending topics
  try {
    const braveResponse = await axios.get('https://api.brave.com/res/v1/web/search', {
      params: {
        q: 'hip hop music news 2026',
        count: 5
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    
    if (braveResponse.data?.web?.results) {
      events.push(...braveResponse.data.web.results.slice(0, 3).map(r => ({
        title: r.title,
        description: r.description?.substring(0, 120) || '',
        source: new URL(r.url).hostname.replace('www.', ''),
        url: r.url
      })));
    }
  } catch (e) { console.log('Brave search error:', e.message); }
  
  // Try Hacker News for tech/creative
  try {
    const hnResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', { timeout: 5000 });
    const topIds = hnResponse.data.slice(0, 10);
    
    const stories = await Promise.all(
      topIds.slice(0, 2).map(id => 
        axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
      )
    );
    
    stories.filter(Boolean).forEach(s => {
      if (s.data && !events.find(e => e.title === s.data.title)) {
        events.push({
          title: s.data.title,
          description: s.data.text?.substring(0, 100) || 'Click to read more...',
          source: 'Hacker News',
          url: s.data.url || `https://news.ycombinator.com/item?id=${s.data.id}`
        });
      }
    });
  } catch (e) { console.log('HN error:', e.message); }
  
  // Fallback: Only use if we got real data
  if (events.length > 0) {
    return events.slice(0, count);
  }
  
  // Ultimate fallback - meaningful placeholders
  return [{
    title: 'Checking trends...',
    description: 'Could not fetch live news. Open the app to refresh.',
    source: 'System',
    url: '#'
  }];
}

/**
 * Get Word of the Day with real definition
 */
async function getWordOfTheDay() {
  // Try Dictionary API first
  try {
    const response = await axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/ephemeral', { timeout: 3000 });
    if (response.data?.[0]?.meanings?.[0]) {
      const m = response.data[0].meanings[0];
      return {
        word: 'Ephemeral',
        definition: m.definitions?.[0]?.definition || 'Lasting for a very short time',
        partOfSpeech: m.partOfSpeech || 'adjective'
      };
    }
  } catch (e) { console.log('Dictionary API error:', e.message); }
  
  // Fallback
  return {
    word: 'Ephemeral',
    definition: 'Lasting for a very short time',
    partOfSpeech: 'adjective'
  };
}

/**
 * Get random creative prompt based on theme
 */
function getCreativePrompt(theme) {
  const prompts = {
    creative: [
      { type: 'content', prompt: 'Record a 60-second behind-the-scenes of your creative process', platform: 'TikTok/IG' },
      { type: 'content', prompt: 'Do a lyric breakdown of your most complex verse', platform: 'YouTube' },
      { type: 'content', prompt: 'Share your top 3 production tips in under 2 minutes', platform: 'TikTok' },
      { type: 'brainstorm', prompt: 'Brainstorm 5 new merch concepts for your brand' },
      { type: 'brainstorm', prompt: 'Think of 3 collabs that would surprise people' }
    ],
    business: [
      { type: 'action', prompt: 'Review and respond to pending business emails', deadline: 'Today' },
      { type: 'action', prompt: 'Check streaming royalties dashboard', deadline: 'Weekly' },
      { type: 'action', prompt: 'Update project tracker with new deliverables', deadline: 'Today' },
      { type: 'insight', prompt: 'Read one article about music industry trends' },
      { type: 'strategy', prompt: 'Plan next month\'s content calendar' }
    ],
    learning: [
      { type: 'language', prompt: 'Practice 10 Tagalog phrases with audio recording', duration: '15 min' },
      { type: 'language', prompt: 'Watch one video in Tagalog without subtitles', duration: '20 min' },
      { type: 'skill', prompt: 'Study one new production technique', duration: '30 min' },
      { type: 'reading', prompt: 'Read 10 pages of current book', duration: '20 min' }
    ],
    community: [
      { type: 'social', prompt: 'Engage with 5 fan comments/messages', platform: 'All' },
      { type: 'social', prompt: 'Post one interactive poll for your audience', platform: 'Twitter/IG' },
      { type: 'collab', prompt: 'Reach out to one potential collaborator', deadline: 'This week' },
      { type: 'engagement', prompt: 'Go live and answer fan questions', duration: '30 min' }
    ],
    deep_dive: [
      { type: 'reflection', prompt: 'Record a voice memo: "What I learned this month"' },
      { type: 'writing', prompt: 'Write 500 words about your creative vision' },
      { type: 'vision', prompt: 'Describe where you want to be in 5 years' },
      { type: 'story', prompt: 'Tell the story of how you got started in music' }
    ]
  };
  
  const themePrompts = prompts[theme] || prompts.creative;
  return themePrompts.sort(() => 0.5 - Math.random()).slice(0, 3);
}

/**
 * Get actionable tasks from Milord's actual task system
 */
async function getActionableTasks() {
  try {
    const { data, error } = await lifeos
      .from('lifeos_tasks')
      .select('*')
      .neq('status', 'completed')
      .order('priority', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    return (data || []).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority || 'medium',
      due_date: t.due_date,
      status: t.status
    }));
  } catch (e) {
    console.log('Task fetch error:', e.message);
    return [];
  }
}

/**
 * Get recent Cortex entries for context
 */
async function getCortexContext() {
  try {
    const { data } = await lifeos
      .from('lifeos_cortex')
      .select('id, title, category, tags')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return data || [];
  } catch (e) {
    return [];
  }
}

/**
 * Get stream schedule
 */
async function getStreamSchedule() {
  // Would integrate with Google Calendar
  return [
    { day: 'Monday', time: '8PM PST', activity: 'Chat & Chill' },
    { day: 'Wednesday', time: '7PM PST', activity: 'Studio Session' },
    { day: 'Friday', time: '9PM PST', activity: 'Freestyle Friday' }
  ];
}

/**
 * Generate rant topic based on current events
 */
async function getRantTopic() {
  const topics = [
    { topic: 'The music industry still doesn\'t respect independent artists', angle: 'Streaming royalties need to change' },
    { topic: 'AI can\'t replace authentic creative expression', angle: 'Why human artistry matters' },
    { topic: 'Social media algorithms are killing creativity', angle: 'The pressure to perform vs create' },
    { topic: 'The myth of the "overnight success"', angle: 'Years of grinding nobody sees' },
    { topic: 'Why collaboration beats competition', angle: 'The power of community' }
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Get random inspirational quote - less generic
 */
function getQuote() {
  const quotes = [
    { text: 'The underground will always be the foundation.', author: 'Various' },
    { text: 'Build your own table, don\'t wait for a seat.', author: 'Milord Akeem' },
    { text: 'The machine serves those who build it.', author: 'Crustazion Empire' },
    { text: 'Your network is your net worth, but your art is your soul.', author: 'Unknown' },
    { text: 'Done is better than perfect.', author: 'Meta' },
    { text: 'The best time to start was yesterday. The next best time is now.', author: 'Unknown' }
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// ============================================
// MAIN GENERATOR v2
// ============================================

async function generateDailyDigest() {
  console.log('🔱 Generating The Abyssal Dispatch v2...');
  
  const date = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  // Rotate themes based on day of week
  const themeIndex = new Date().getDay() % THEMES.length;
  const theme = THEMES[themeIndex];
  
  // Gather content in parallel
  const [wordOfDay, events, tasks, cortex, schedule, rant, quote] = await Promise.all([
    getWordOfTheDay(),
    getRealNews(3),
    getActionableTasks(),
    getCortexContext(),
    getStreamSchedule(),
    getRantTopic(),
    Promise.resolve(getQuote())
  ]);
  
  const creativePrompts = getCreativePrompt(theme);
  
  // Build themed digest
  const digest = {
    date,
    day_of_week: dayOfWeek,
    theme,
    theme_label: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Day`,
    
    // Real-time data
    word_of_the_day: wordOfDay,
    current_events: events,
    
    // Milord's data
    actionable_tasks: tasks,
    cortex_context: cortex,
    stream_schedule: schedule,
    
    // Creative
    creative_prompts: creativePrompts,
    rant_topic: rant,
    quote,
    
    // Metadata
    generated_at: new Date().toISOString(),
    version: '2.0'
  };
  
  // Save to Supabase
  const { data, error } = await lifeos
    .from('abyssal_dispatches')
    .insert([{
      date,
      content: digest,
      status: 'generated'
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving digest:', error);
    return { error: error.message };
  }
  
  console.log('✅ Abyssal Dispatch v2 generated:', date, '- Theme:', theme);
  return data;
}

// Run if called directly
if (require.main === module) {
  generateDailyDigest()
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(e => console.error(e));
}

module.exports = { 
  generateDailyDigest, 
  getWordOfTheDay, 
  getRealNews, 
  getCreativePrompt,
  getActionableTasks,
  getCortexContext,
  getStreamSchedule,
  getRantTopic,
  getQuote,
  THEMES
};
