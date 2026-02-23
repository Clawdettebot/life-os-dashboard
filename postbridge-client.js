const axios = require('axios');

// Post Bridge API client for social media posting
// API Docs: https://api.post-bridge.com/v1
// API Key: pb_live_6TxeA2MXDdTeVaXrp8BwG8
// Supports: Bluesky, Facebook, Instagram, LinkedIn, Pinterest, Threads, TikTok, Twitter, YouTube

const POSTBRIDGE_API_KEY = process.env.POSTBRIDGE_API_KEY || 'pb_live_6TxeA2MXDdTeVaXrp8BwG8';
const POSTBRIDGE_BASE_URL = 'https://api.post-bridge.com/v1';

const postBridge = {
  // Headers for all requests
  headers: {
    'Authorization': `Bearer ${POSTBRIDGE_API_KEY}`,
    'Content-Type': 'application/json'
  },

  // Get social accounts
  async getSocialAccounts(platforms = []) {
    try {
      let url = `${POSTBRIDGE_BASE_URL}/social-accounts`;
      if (platforms.length > 0) {
        url += '?' + platforms.map(p => `platform=${p}`).join('&');
      }
      
      const response = await axios.get(url, { headers: this.headers });
      return { success: true, accounts: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Create upload URL for media
  async createUploadUrl(fileName, mimeType, sizeBytes) {
    try {
      const response = await axios.post(
        `${POSTBRIDGE_BASE_URL}/media/create-upload-url`,
        {
          name: fileName,
          mime_type: mimeType,
          size_bytes: sizeBytes
        },
        { headers: this.headers }
      );
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Upload file to signed URL
  async uploadFile(uploadUrl, fileBuffer, mimeType) {
    try {
      await axios.put(uploadUrl, fileBuffer, {
        headers: { 'Content-Type': mimeType }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Create a post
  async createPost(options) {
    const {
      caption,
      socialAccountIds,
      mediaIds = [],
      mediaUrls = [],
      scheduledAt = null, // null = post immediately
      isDraft = false,
      platformConfigurations = {},
      processingEnabled = true
    } = options;

    try {
      const payload = {
        caption,
        social_accounts: socialAccountIds,
        is_draft: isDraft,
        processing_enabled: processingEnabled
      };

      if (mediaIds.length > 0) payload.media = mediaIds;
      if (mediaUrls.length > 0) payload.media_urls = mediaUrls;
      if (scheduledAt) payload.scheduled_at = scheduledAt;
      if (Object.keys(platformConfigurations).length > 0) {
        payload.platform_configurations = platformConfigurations;
      }

      const response = await axios.post(
        `${POSTBRIDGE_BASE_URL}/posts`,
        payload,
        { headers: this.headers }
      );
      
      return { success: true, post: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Schedule a post
  async schedulePost(options, scheduleTime) {
    return this.createPost({ ...options, scheduledAt: scheduleTime });
  },

  // Update a post
  async updatePost(postId, updates) {
    try {
      const response = await axios.patch(
        `${POSTBRIDGE_BASE_URL}/posts/${postId}`,
        updates,
        { headers: this.headers }
      );
      return { success: true, post: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Delete a post
  async deletePost(postId) {
    try {
      await axios.delete(
        `${POSTBRIDGE_BASE_URL}/posts/${postId}`,
        { headers: this.headers }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get posts
  async getPosts(filters = {}) {
    try {
      let url = `${POSTBRIDGE_BASE_URL}/posts`;
      const params = [];
      
      if (filters.platform) params.push(`platform=${filters.platform}`);
      if (filters.status) params.push(`status=${filters.status}`);
      if (filters.limit) params.push(`limit=${filters.limit}`);
      if (filters.offset) params.push(`offset=${filters.offset}`);
      
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await axios.get(url, { headers: this.headers });
      return { success: true, posts: response.data.data, meta: response.data.meta };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get post results (delivery status)
  async getPostResults(postId) {
    try {
      const response = await axios.get(
        `${POSTBRIDGE_BASE_URL}/post-results?post_id=${postId}`,
        { headers: this.headers }
      );
      return { success: true, results: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Full workflow: Upload media + create post
  async uploadAndPost(fileBuffer, fileName, mimeType, postOptions) {
    // Step 1: Get upload URL
    const uploadUrlResult = await this.createUploadUrl(fileName, mimeType, fileBuffer.length);
    if (!uploadUrlResult.success) return uploadUrlResult;

    // Step 2: Upload file
    const uploadResult = await this.uploadFile(uploadUrlResult.upload_url, fileBuffer, mimeType);
    if (!uploadResult.success) return uploadResult;

    // Step 3: Create post with media
    return this.createPost({
      ...postOptions,
      mediaIds: [uploadUrlResult.media_id]
    });
  },

  // Templates for common posts
  templates: {
    // Stream announcement
    streamLive: (platform, startTime, imageUrl) => ({
      caption: `🔴 LIVE NOW on ${platform}!\n\nCome hang out - link in bio`,
      mediaUrls: imageUrl ? [imageUrl] : [],
      hashtags: ['#live', '#streaming', '#guapdad']
    }),

    // Stream starting soon (scheduled)
    streamStarting: (platform, startTime, imageUrl) => ({
      caption: `Going live on ${platform} at ${startTime}! 🎥\n\nSet your reminders`,
      mediaUrls: imageUrl ? [imageUrl] : [],
      hashtags: ['#livestream', '#comingsoon', '#guapdad']
    }),

    // New merch drop
    newMerch: (productName, price, link, imageUrl) => ({
      caption: `New drop! 🛍️ ${productName} - $${price}\n\nLink in bio to cop! 🔗`,
      mediaUrls: imageUrl ? [imageUrl] : [],
      hashtags: ['#guapdad', '#merch', '#limited', '#newdrop'],
      link
    }),

    // TikTok/Instagram Reel as DRAFT (for adding sound)
    videoDraft: (caption, videoUrl, platform) => ({
      caption,
      mediaUrls: [videoUrl],
      isDraft: true, // Important: saves as draft so user can add sound
      platformConfigurations: platform === 'tiktok' ? {
        tiktok: { draft: true }
      } : platform === 'instagram' ? {
        instagram: { placement: 'reels' }
      } : {}
    }),

    // New blog post
    newBlog: (title, excerpt, link, imageUrl) => ({
      caption: `New blog post ✍️\n\n${title}\n\n${excerpt.substring(0, 100)}...`,
      mediaUrls: imageUrl ? [imageUrl] : [],
      hashtags: ['#guapdad', '#blog', '#read'],
      link
    }),

    // New music release
    newMusic: (trackName, releaseDate, link, coverArt) => ({
      caption: `🎵 OUT NOW 🎵\n\n${trackName}\n\nStream everywhere! Link in bio 🔗`,
      mediaUrls: coverArt ? [coverArt] : [],
      hashtags: ['#guapdad', '#newmusic', '#outnow', '#streaming'],
      link
    }),

    // Behind the scenes
    bts: (caption, imageUrl) => ({
      caption: `Behind the scenes 📸\n\n${caption}`,
      mediaUrls: imageUrl ? [imageUrl] : [],
      hashtags: ['#bts', '#behindthescenes', '#guapdad']
    })
  }
};

module.exports = { postBridge };
