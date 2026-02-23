const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Beehiiv API client
const BEEHIIV_CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/beehiiv-config.json'), 'utf-8'));

const beehiiv = {
  config: BEEHIIV_CONFIG,
  
  // Headers for all requests
  headers: {
    'Authorization': `Bearer ${BEEHIIV_CONFIG.api_key}`,
    'Content-Type': 'application/json'
  },

  // Create a post
  async createPost(options) {
    const {
      title,
      body_content,
      blocks,
      post_template_id,
      status = 'draft'
    } = options;

    const url = BEEHIIV_CONFIG.endpoints.create_post.replace(
      '{publication_id}',
      BEEHIIV_CONFIG.publication_id
    );

    const payload = {
      title,
      status
    };

    if (post_template_id) payload.post_template_id = post_template_id;
    if (body_content) payload.body_content = body_content;
    if (blocks) payload.blocks = blocks;

    try {
      const response = await axios.post(url, payload, { headers: this.headers });
      return { success: true, post: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get all posts
  async getPosts(limit = 25) {
    const url = BEEHIIV_CONFIG.endpoints.get_posts.replace(
      '{publication_id}',
      BEEHIIV_CONFIG.publication_id
    ) + `?limit=${limit}`;

    try {
      const response = await axios.get(url, { headers: this.headers });
      return { success: true, posts: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Convert voice note transcript to blog post format
  transcriptToBlogPost(transcript, options = {}) {
    const {
      title,
      author = BEEHIIV_CONFIG.sync_settings.default_author,
      tags = []
    } = options;

    // Split transcript into paragraphs
    const paragraphs = transcript
      .split(/\n+/)
      .filter(p => p.trim().length > 0)
      .map(p => p.trim());

    // Create blocks format for Beehiiv
    const blocks = [
      {
        type: 'heading',
        level: 1,
        text: title || 'New Post'
      },
      {
        type: 'paragraph',
        plaintext: `By ${author}`
      }
    ];

    paragraphs.forEach(para => {
      blocks.push({
        type: 'paragraph',
        plaintext: para
      });
    });

    return { title, blocks, author, tags };
  },

  // Create HTML body content for Beehiiv
  transcriptToHtml(transcript, options = {}) {
    const { title, author = 'Guapdad 4000' } = options;
    
    const paragraphs = transcript
      .split(/\n+/)
      .filter(p => p.trim().length > 0)
      .map(p => `<p>${p.trim()}</p>`)
      .join('\n');

    return `
<table>
  <tbody>
    <tr>
      <td style="padding: 20px;">
        <h1>${title || 'New Post'}</h1>
        <p style="color: #666; font-style: italic;">By ${author}</p>
        ${paragraphs}
      </td>
    </tr>
  </tbody>
</table>`;
  }
};

module.exports = { beehiiv };
