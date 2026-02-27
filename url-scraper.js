/**
 * Knowledge Knaight - URL Scraper
 * Fetches and extracts content from URLs
 */

const axios = require('axios');
const cheerio = require('cheerio');

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const SCRAPER_CONFIG = {
  timeout: 15000,
  maxContentLength: 5 * 1024 * 1024, // 5MB
  userAgent: 'Mozilla/5.0 (compatible; KnowledgeKnaight/1.0; +https://lifeos.blog)',
  
  // Supported platforms with special handlers
  platforms: {
    youtube: {
      patterns: ['youtube.com', 'youtu.be'],
      extract: extractYouTube
    },
    twitter: {
      patterns: ['twitter.com', 'x.com'],
      extract: extractTwitter
    },
    instagram: {
      patterns: ['instagram.com'],
      extract: extractInstagram
    },
    tiktok: {
      patterns: ['tiktok.com'],
      extract: extractTikTok
    },
    github: {
      patterns: ['github.com'],
      extract: extractGitHub
    },
    reddit: {
      patterns: ['reddit.com'],
      extract: extractReddit
    },
    medium: {
      patterns: ['medium.com'],
      extract: extractMedium
    },
    generic: {
      patterns: ['.*'],
      extract: extractGeneric
    }
  }
};

// ─────────────────────────────────────────────────────────────
// MAIN SCRAPER
// ─────────────────────────────────────────────────────────────

async function scrapeURL(url) {
  console.log(`🔗 Scraping: ${url}`);
  
  try {
    // Detect platform
    const platform = detectPlatform(url);
    console.log(`📱 Platform: ${platform.name}`);
    
    // Fetch content
    const response = await fetchURL(url);
    
    // Extract based on platform
    const extracted = await platform.extract(url, response);
    
    return {
      success: true,
      url,
      platform: platform.name,
      ...extracted
    };
  } catch (error) {
    console.error(`❌ Scraping failed: ${error.message}`);
    return {
      success: false,
      url,
      error: error.message
    };
  }
}

// ─────────────────────────────────────────────────────────────
// URL FETCHER
// ─────────────────────────────────────────────────────────────

async function fetchURL(url) {
  const response = await axios.get(url, {
    timeout: SCRAPER_CONFIG.timeout,
    maxContentLength: SCRAPER_CONFIG.maxContentLength,
    headers: {
      'User-Agent': SCRAPER_CONFIG.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    },
    validateStatus: (status) => status < 500
  });
  
  return {
    status: response.status,
    headers: response.headers,
    data: response.data
  };
}

// ─────────────────────────────────────────────────────────────
// PLATFORM DETECTION
// ─────────────────────────────────────────────────────────────

function detectPlatform(url) {
  const hostname = new URL(url).hostname.replace('www.', '');
  
  for (const [name, config] of Object.entries(SCRAPER_CONFIG.platforms)) {
    for (const pattern of config.patterns) {
      if (hostname.includes(pattern)) {
        return { name, ...config };
      }
    }
  }
  
  return { name: 'generic', ...SCRAPER_CONFIG.platforms.generic };
}

// ─────────────────────────────────────────────────────────────
// PLATFORM-SPECIFIC EXTRACTORS
// ─────────────────────────────────────────────────────────────

async function extractYouTube(url, response) {
  const $ = cheerio.load(response.data);
  
  const title = $('meta[name="title"]').attr('content') || 
                $('title').text() ||
                $('h1').first().text();
  
  const description = $('meta[name="description"]').attr('content') ||
                      $('meta[property="og:description"]').attr('content');
  
  const channel = $('link[itemprop="name"]').attr('content') ||
                  $('a.yt-user-name').text();
  
  const videoId = extractYouTubeID(url);
  const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    author: cleanText(channel),
    thumbnail,
    type: 'video',
    embedUrl: `https://www.youtube.com/embed/${videoId}`
  };
}

async function extractTwitter(url, response) {
  const $ = cheerio.load(response.data);
  
  const title = $('meta[property="og:title"]').attr('content') ||
                $('title').text();
  
  const description = $('meta[property="og:description"]').attr('content') ||
                      $('meta[name="description"]').attr('content');
  
  const author = title.split(' on ')[0] || 'Twitter User';
  const images = [];
  
  $('meta[property="og:image"]').each((i, el) => {
    images.push($(el).attr('content'));
  });
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    author: cleanText(author),
    images,
    type: 'social'
  };
}

async function extractInstagram(url, response) {
  const $ = cheerio.load(response.data);
  
  const title = $('meta[property="og:title"]').attr('content') ||
                $('title').text();
  
  const description = $('meta[property="og:description"]').attr('content');
  const image = $('meta[property="og:image"]').attr('content');
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    images: [image],
    type: 'social'
  };
}

async function extractTikTok(url, response) {
  const $ = cheerio.load(response.data);
  
  const title = $('meta[property="og:title"]').attr('content') ||
                $('title').text();
  
  const description = $('meta[property="og:description"]').attr('content');
  const video = $('meta[property="og:video"]').attr('content');
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    video,
    type: 'video'
  };
}

async function extractGitHub(url, response) {
  const $ = cheerio.load(response.data);
  
  const title = $('meta[property="og:title"]').attr('content') ||
                $('title').text();
  
  const description = $('meta[name="description"]').attr('content') ||
                      $('meta[property="og:description"]').attr('content');
  
  const stars = $('span[data-content="Stars"]').text() ||
                $('a[href*="/stargazers"]').text();
  
  const language = $('span[itemprop="programmingLanguage"]').text();
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    metadata: {
      stars: cleanText(stars),
      language: cleanText(language)
    },
    type: 'code'
  };
}

async function extractReddit(url, response) {
  const $ = cheerio.load(response.data);
  
  const title = $('meta[property="og:title"]').attr('content') ||
                $('shreddit-title').attr('content') ||
                $('title').text();
  
  const description = $('meta[property="og:description"]').attr('content') ||
                      $('div[data-click-id="text"]').text();
  
  const author = $('a[data-click-id="user"]').text() ||
                 $('span[data-click-id="username"]').text();
  
  const upvotes = $('shreddit-post').attr('score') ||
                  $('div[data-click-id="upvote"]').parent().text();
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    author: cleanText(author),
    metadata: {
      upvotes: cleanText(upvotes)
    },
    type: 'social'
  };
}

async function extractMedium(url, response) {
  const $ = cheerio.load(response.data);
  
  const title = $('meta[property="og:title"]').attr('content') ||
                $('h1').first().text();
  
  const description = $('meta[property="og:description"]').attr('content') ||
                      $('meta[name="description"]').attr('content');
  
  const author = $('meta[name="author"]').attr('content') ||
                 $('a[data-user-id]').text();
  
  const content = $('article').text() ||
                   $('div.section-content').text();
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    author: cleanText(author),
    content: cleanText(content.substring(0, 5000)),
    type: 'article'
  };
}

async function extractGeneric(url, response) {
  const $ = cheerio.load(response.data);
  
  // Remove unwanted elements
  $('script, style, nav, footer, header, aside').remove();
  
  const title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text() ||
                $('h1').first().text();
  
  const description = $('meta[property="og:description"]').attr('content') ||
                      $('meta[name="description"]').attr('content') ||
                      $('meta[name="twitter:description"]').attr('content');
  
  const image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content');
  
  // Extract main content
  const content = extractMainContent($);
  
  // Extract links
  const links = [];
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text();
    if (href && text && href.startsWith('http')) {
      links.push({ url: href, text: cleanText(text) });
    }
  });
  
  return {
    title: cleanText(title),
    description: cleanText(description),
    images: image ? [image] : [],
    content: cleanText(content),
    links: links.slice(0, 10),
    type: 'article'
  };
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function extractYouTubeID(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function extractMainContent($) {
  // Try common content selectors
  const selectors = [
    'article',
    'main',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '#content',
    '.post',
    '.article'
  ];
  
  for (const selector of selectors) {
    const content = $(selector).text();
    if (content && content.length > 200) {
      return content.substring(0, 5000);
    }
  }
  
  // Fallback to body
  return $('body').text().substring(0, 5000);
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

// ─────────────────────────────────────────────────────────────
// BATCH SCRAPER
// ─────────────────────────────────────────────────────────────

async function scrapeMultiple(urls, options = {}) {
  const results = [];
  const concurrency = options.concurrency || 3;
  const delay = options.delay || 1000;
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => scrapeURL(url))
    );
    results.push(...batchResults);
    
    // Delay between batches
    if (i + concurrency < urls.length) {
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  return results;
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  scrapeURL,
  scrapeMultiple,
  fetchURL,
  detectPlatform,
  SCRAPER_CONFIG
};
