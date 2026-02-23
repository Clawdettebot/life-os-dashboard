const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Content Extractor - Extracts text/content from various platforms
 */
class ContentExtractor {
  constructor() {
    this.platforms = {
      youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
      twitter: /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      instagram: /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
      tiktok: /tiktok\.com\/(?:@[\w.]+\/video\/(\d+)|v\/(\d+)|t\/(\w+))/,
      article: /https?:\/\/.+/
    };
  }

  detectPlatform(url) {
    for (const [platform, regex] of Object.entries(this.platforms)) {
      if (regex.test(url)) return platform;
    }
    return 'article';
  }

  async extract(url) {
    const platform = this.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return await this.extractYouTube(url);
      case 'twitter':
        return await this.extractTwitter(url);
      case 'instagram':
        return await this.extractInstagram(url);
      case 'tiktok':
        return await this.extractTikTok(url);
      default:
        return await this.extractArticle(url);
    }
  }

  async extractYouTube(url) {
    // Try multiple transcript APIs
    const videoId = this.extractYouTubeId(url);
    
    try {
      // Method 1: Using YouTube transcript API (requires API key)
      const transcript = await this.fetchYouTubeTranscript(videoId);
      
      return {
        platform: 'youtube',
        title: transcript.title || 'YouTube Video',
        content: transcript.text,
        author: transcript.author,
        duration: transcript.duration,
        url: url,
        metadata: {
          videoId,
          language: transcript.language,
          is_generated: transcript.is_generated
        }
      };
    } catch (e) {
      // Fallback: Basic metadata extraction
      const metadata = await this.fetchYouTubeMetadata(videoId);
      return {
        platform: 'youtube',
        title: metadata.title,
        content: metadata.description,
        author: metadata.author,
        url: url,
        metadata: { videoId, note: 'Transcript unavailable, using description' }
      };
    }
  }

  extractYouTubeId(url) {
    const match = url.match(this.platforms.youtube);
    return match ? match[1] : null;
  }

  async fetchYouTubeTranscript(videoId) {
    // Placeholder - integrate with youtube-transcript-api or similar
    // This would call an external service or use yt-dlp
    throw new Error('Transcript extraction not yet implemented');
  }

  async fetchYouTubeMetadata(videoId) {
    // Basic oEmbed approach
    try {
      const response = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      return {
        title: response.data.title,
        author: response.data.author_name,
        description: ''
      };
    } catch (e) {
      return { title: 'YouTube Video', author: 'Unknown', description: '' };
    }
  }

  async extractTwitter(url) {
    const tweetId = this.extractTweetId(url);
    
    // Try to fetch thread using nitter or similar
    try {
      const thread = await this.fetchTwitterThread(tweetId);
      
      return {
        platform: 'twitter',
        title: `Thread by @${thread.author}`,
        content: thread.tweets.map(t => t.text).join('\n\n---\n\n'),
        author: thread.author,
        url: url,
        metadata: {
          tweetId,
          tweetCount: thread.tweets.length,
          is_thread: thread.tweets.length > 1
        }
      };
    } catch (e) {
      return {
        platform: 'twitter',
        title: 'Twitter/X Post',
        content: 'Content extraction failed. URL stored for manual review.',
        url: url,
        metadata: { tweetId, error: e.message }
      };
    }
  }

  extractTweetId(url) {
    const match = url.match(this.platforms.twitter);
    return match ? match[1] : null;
  }

  async fetchTwitterThread(tweetId) {
    // Placeholder - would use Twitter API or scraping service
    // For now, return single tweet structure
    throw new Error('Twitter thread extraction requires API integration');
  }

  async extractArticle(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('title').text() ||
                    'Untitled Article';

      // Extract main content
      const content = this.extractArticleContent($);

      // Extract author
      const author = $('meta[name="author"]').attr('content') ||
                     $('meta[property="og:author"]').attr('content') ||
                     'Unknown Author';

      // Extract publish date
      const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                          $('meta[name="publishedDate"]').attr('content');

      // Extract description
      const description = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content');

      return {
        platform: 'article',
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        url: url,
        metadata: {
          publishDate,
          description: description?.trim(),
          wordCount: content.split(/\s+/).length
        }
      };
    } catch (e) {
      return {
        platform: 'article',
        title: 'Article Link',
        content: `URL: ${url}\n\nExtraction failed: ${e.message}`,
        url: url,
        metadata: { error: e.message }
      };
    }
  }

  extractArticleContent($) {
    // Try common content selectors
    const selectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main',
      '.content',
      '#content'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 200) {
        return element.text().trim();
      }
    }

    // Fallback: extract paragraphs
    return $('p').map((i, el) => $(el).text()).get().join('\n\n');
  }

  async extractInstagram(url) {
    // Limited without API - store URL with metadata
    return {
      platform: 'instagram',
      title: 'Instagram Post',
      content: 'Instagram content requires API access for full extraction.',
      url: url,
      metadata: { note: 'Store URL for manual review or API integration' }
    };
  }

  async extractTikTok(url) {
    // Limited without API - store URL with metadata
    return {
      platform: 'tiktok',
      title: 'TikTok Video',
      content: 'TikTok content requires API access for full extraction.',
      url: url,
      metadata: { note: 'Store URL for manual review or API integration' }
    };
  }
}

module.exports = ContentExtractor;
