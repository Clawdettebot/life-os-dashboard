/**
 * Vector Embeddings Service for Cortex
 * Generates and manages embeddings for semantic search
 * NOW USING SUPABASE
 */

const cortexOps = require('./cortex-supabase-ops.js');
const axios = require('axios');

class EmbeddingService {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'openai',
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      model: config.model || 'text-embedding-3-small',
      dimensions: config.dimensions || 1536,
      ...config
    };
  }

  /**
   * Generate embedding for text
   */
  async generate(text) {
    if (this.config.provider === 'openai') {
      return await this.generateOpenAI(text);
    }
    throw new Error(`Unknown provider: ${this.config.provider}`);
  }

  async generateOpenAI(text) {
    const response = await axios.post('https://api.openai.com/v1/embeddings', {
      input: text.substring(0, 8000),
      model: this.config.model,
      dimensions: this.config.dimensions
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data[0].embedding;
  }

  /**
   * Process entries without embeddings
   */
  async processMissing() {
    const entries = await cortexOps.getNeedingEmbeddings();
    console.log(`Found ${entries.length} entries needing embeddings`);

    for (const entry of entries) {
      try {
        const text = `${entry.title} ${entry.content || ''}`.substring(0, 8000);
        const embedding = await this.generate(text);
        
        await cortexOps.updateEmbedding(entry.id, embedding);
        console.log(`✅ Embedded: ${entry.title}`);
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`⚠️ Failed to embed ${entry.title}: ${e.message}`);
      }
    }

    console.log('✨ Embedding run complete');
  }

  /**
   * Search by similarity
   */
  async search(query, limit = 10) {
    const queryEmbedding = await this.generate(query);
    return await cortexOps.searchByEmbedding(queryEmbedding, limit);
  }
}

module.exports = EmbeddingService;

// Run if called directly
if (require.main === module) {
  const service = new EmbeddingService();
  service.processMissing().catch(console.error);
}
