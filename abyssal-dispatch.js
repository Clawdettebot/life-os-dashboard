/**
 * Abyssal Dispatch Generator
 * Daily digest system for Milord - 10am PST
 */

require('dotenv').config();
const axios = require('axios');
const { lifeos } = require('./lifeos-supabase.js');

// ============================================
// CONTENT GATHERERS
// ============================================

/**
 * Get Word of the Day from dictionary API
 */
async function getWordOfTheDay() {
  try {
    const response = await axios.get('https://api.wordnik.com/v4/words.json/wordOfTheDay', {
      params: { api_key: process.env.WORDNIK_API_KEY || 'demo' }
    });
    return {
      word: response.data.word,
      definition: response.data.definitions?.[0]?.definition || 'No definition available',
      partOfSpeech: response.data.definitions?.[0]?.partOfSpeech || '',
      example: response.data.examples?.[0]?.text || ''
    };
  } catch (e) {
    // Fallback: random interesting word
    return {
      word: 'Ephemeral',
      definition: 'Lasting for a very short time',
      partOfSpeech: 'adjective',
      example: 'The ephemeral beauty of a sunset'
    };
  }
}

/**
 * Get Tagalog lesson - common phrase/word
 */
function getTagalogLesson() {
  const lessons = [
    { phrase: 'Kamusta?', meaning: 'How are you?', usage: 'Casual greeting' },
    { phrase: 'Mabuti naman', meaning: 'I\'m fine', response: 'Reply to Kamusta' },
    { phrase: 'Salamat', meaning: 'Thank you', usage: 'Express gratitude' },
    { phrase: 'Walang anuman', meaning: 'You\'re welcome', response: 'Reply to Salamat' },
    { phrase: 'Paalam', meaning: 'Goodbye', usage: 'When leaving' },
    { phrase: 'Opo', meaning: 'Yes', usage: 'Formal yes (respectful)' },
    { phrase: 'Hindi', meaning: 'No', usage: 'Negative response' },
    { phrase: 'I love you', meaning: 'Mahal kita', usage: 'Express love' },
    { phrase: 'Masarap', meaning: 'Delicious', usage: 'Food compliments' },
    { phrase: 'Gutom na ako', meaning: 'I\'m hungry', usage: 'Before eating' }
  ];
  return lessons[Math.floor(Math.random() * lessons.length)];
}

/**
 * Get French lesson - common phrase/word
 */
function getFrenchLesson() {
  const lessons = [
    { phrase: 'Bonjour', meaning: 'Hello/Good day', usage: 'Formal greeting' },
    { phrase: 'Comment allez-vous?', meaning: 'How are you?', usage: 'Formal' },
    { phrase: 'Je vais bien', meaning: 'I\'m fine', response: 'Reply to Comment allez-vous' },
    { phrase: 'Merci', meaning: 'Thank you', usage: 'Express gratitude' },
    { phrase: 'S\'il vous plaît', meaning: 'Please', usage: 'Polite request' },
    { phrase: 'Oui', meaning: 'Yes', usage: 'Affirmative' },
    { phrase: 'Non', meaning: 'No', usage: 'Negative' },
    { phrase: 'Excusez-moi', meaning: 'Excuse me', usage: 'Get attention/apology' },
    { phrase: 'Je t\'aime', meaning: 'I love you', usage: 'Romantic' },
    { phrase: 'C\'est la vie', meaning: 'That\'s life', usage: ' shrug' }
  ];
  return lessons[Math.floor(Math.random() * lessons.length)];
}

/**
 * Get current events from news API
 */
async function getCurrentEvents(count = 3) {
  try {
    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: process.env.NewsData_API_KEY || 'demo',
        language: 'en',
        category: 'top,politics,technology,entertainment'
      }
    });
    
    return (response.data.results || []).slice(0, count).map(article => ({
      title: article.title,
      description: article.description,
      source: article.source_id,
      url: article.link,
      image: article.image_url
    }));
  } catch (e) {
    // Fallback events
    return [
      { title: 'AI continues transforming creative industries', description: 'New tools emerge for artists and musicians', source: 'Tech Crunch', url: '#', image: null },
      { title: 'Hip-hop scene sees surge in independent releases', description: 'Artists bypassing labels for direct fan engagement', source: 'Billboard', url: '#', image: null },
      { title: 'Streaming platforms update their algorithms', description: 'What this means for independent artists', source: 'Music Biz', url: '#', image: null }
    ];
  }
}

/**
 * Generate rant ideas based on current trends
 */
function getRantIdeas() {
  const ideas = [
    'Why streaming royalties are still a joke',
    'The death of the album as an art form',
    'Why social media is killing creativity',
    'Artists need to start owning their masters',
    'The myth of the overnight success',
    'Why feature fees are out of control',
    'The labels aren\'t the real enemies - it\'s the system',
    'Why playlisting is both a blessing and a curse',
    'The importance of staying true to your sound',
    'Why collaboration > competition'
  ];
  // Shuffle and pick 3
  return ideas.sort(() => 0.5 - Math.random()).slice(0, 3);
}

/**
 * Generate viral content prompt for music promotion
 */
function getViralPrompt() {
  const prompts = [
    {
      hook: 'POV: You finally understand the lyrics',
      angle: 'Dive into the deeper meaning of your most complex song',
      format: 'React/reaction video with lyric breakdown',
      hashtags: '#hiphop #lyrics #pov'
    },
    {
      hook: 'Things I wish I knew before signing',
      angle: 'Behind-the-scenes of your artist journey',
      format: 'Talking head with B-roll',
      hashtags: '#artistlife #musicindustry #lessonslearned'
    },
    {
      hook: 'This song saved my life',
      angle: 'Personal story behind your most emotional track',
      format: 'Acoustic version + storytelling',
      hashtags: '#mentalhealth #musictherapy #real'
    },
    {
      hook: 'Replying to comments about my flow',
      angle: 'Interactive engagement with fan questions',
      format: 'Stitch/reply video',
      hashtags: '#fyp #flow #hiphop'
    },
    {
      hook: 'I made this beat in 10 minutes',
      angle: 'Show your production skills',
      format: 'Timelbeat creation video',
      hashtags: '#producer #beatmaker #fromscratch'
    }
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Get stream schedule from calendar
 */
async function getStreamSchedule() {
  try {
    // Would integrate with Google Calendar
    // For now, return placeholder
    return [
      { day: 'Monday', time: '8PM PST', activity: 'Chat & Chill' },
      { day: 'Wednesday', time: '7PM PST', activity: 'Studio Session' },
      { day: 'Friday', time: '9PM PST', activity: 'Freestyle Friday' }
    ];
  } catch (e) {
    return [];
  }
}

/**
 * Get brain prompts for audio dumps
 */
function getBrainPrompts() {
  const prompts = [
    'What\'s something you believed 5 years ago that you no longer believe?',
    'Describe your perfect day from start to finish.',
    'What\'s a skill you want to learn and why?',
    'Talk about a moment that changed your perspective on life.',
    'If you could give advice to your younger self, what would it be?',
    'What\'s a trend you don\'t understand? Rant about it.',
    'Describe your creative process from idea to finished song.',
    'What\'s something you\'re currently obsessed with?',
    'Talk about a person who influenced your career.',
    'What\'s your vision for the next 5 years?'
  ];
  return prompts.sort(() => 0.5 - Math.random()).slice(0, 5);
}

/**
 * Get inspirational quote
 */
function getQuote() {
  const quotes = [
    { text: 'The sky is not the limit, the mind is.', author: 'Unknown' },
    { text: 'Grind in silence, let success make the noise.', author: 'Papoose' },
    { text: 'Your only limit is your mind.', author: 'DJ Khaled' },
    { text: 'Turn your wounds into wisdom.', author: 'Oprah Winfrey' },
    { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
    { text: 'It\'s not about the money, it\'s about the mission.', author: 'J. Cole' },
    { text: 'Stay true to yourself, the rest will follow.', author: 'Eminem' },
    { text: 'Dream big, work hard, stay focused.', author: 'Unknown' }
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// ============================================
// MAIN GENERATOR
// ============================================

async function generateDailyDigest() {
  console.log('🔱 Generating The Abyssal Dispatch...');
  
  const date = new Date().toISOString().split('T')[0];
  
  // Gather all content in parallel
  const [wordOfDay, tagalog, french, events, schedule] = await Promise.all([
    getWordOfTheDay(),
    Promise.resolve(getTagalogLesson()),
    Promise.resolve(getFrenchLesson()),
    getCurrentEvents(3),
    getStreamSchedule()
  ]);
  
  const rantIdeas = getRantIdeas();
  const viralPrompt = getViralPrompt();
  const brainPrompts = getBrainPrompts();
  const quote = getQuote();
  
  // Build the digest object
  const digest = {
    date,
    generated_at: new Date().toISOString(),
    
    // Word of the Day
    word_of_the_day: wordOfDay,
    
    // Language Lessons
    tagalog_lesson: tagalog,
    french_lesson: french,
    
    // Current Events
    current_events: events,
    
    // Rant Ideas
    rant_ideas: rantIdeas,
    
    // Viral Content Prompt
    viral_prompt: viralPrompt,
    
    // Stream Schedule
    stream_schedule: schedule,
    
    // Brain Prompts
    brain_prompts: brainPrompts,
    
    // Inspirational Quote
    quote,
    
    // Design card rotation (0-4)
    card_design: Math.floor(Math.random() * 5)
  };
  
  // Save to Supabase
  const { data, error } = await supabase
    .from('abyssal_dispatches')
    .insert([{
      date,
      content: digest,
      card_design: digest.card_design,
      status: 'generated'
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving digest:', error);
    return { error: error.message };
  }
  
  console.log('✅ Abyssal Dispatch generated:', date);
  return data;
}

// Run if called directly
if (require.main === module) {
  generateDailyDigest()
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(e => console.error(e));
}

module.exports = { generateDailyDigest, getWordOfTheDay, getTagalogLesson, getFrenchLesson, getCurrentEvents, getRantIdeas, getViralPrompt, getStreamSchedule, getBrainPrompts, getQuote };
