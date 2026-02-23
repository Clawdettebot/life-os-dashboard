/**
 * Vector Embeddings Service for Cortex
 * Generates and manages embeddings for semantic search
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class EmbeddingService {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'openai', // openai, ollama, local
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      model: config.model || 'text-embedding-3-small',
      dimensions: config.dimensions || 1536,
      ollamaUrl: config.ollamaUrl || 'http://localhost:11434',
      ...config
    };
    
    this.db = new sqlite3.Database(path.join(__dirname, 'data', 'cortex.db'));
  }

  /**
   * Generate embedding for text
   */
  async generate(text) {
    switch (this.config.provider) {
      case 'openai':
        return await this.generateOpenAI(text);
      case 'ollama':
        return await this.generateOllama(text);
      case 'mock':
        return this.generateMock(text);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * OpenAI Embeddings API
   */
  async generateOpenAI(text) {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const axios = require('axios');
    
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text.substring(0, 8000), // OpenAI token limit
        model: this.config.model
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  }

  /**
   * Ollama local embeddings (free, runs locally)
   */
  async generateOllama(text) {
    const axios = require('axios');
    
    const response = await axios.post(
      `${this.config.ollamaUrl}/api/embeddings`,
      {
        model: this.config.model || 'nomic-embed-text',
        prompt: text.substring(0, 8000)
      }
    );

    return response.data.embedding;
  }

  /**
   * Mock embedding for testing
   */
  generateMock(text) {
    // Generate deterministic pseudo-random vector based on text
    const vector = [];
    const seed = text.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    for (let i = 0; i < this.config.dimensions; i++) {
      const x = Math.sin(seed + i) * 10000;
      vector.push(x - Math.floor(x));
    }
    
    return vector;
  }

  /**
   * Store embedding for an entry
   */
  async storeEmbedding(entryId, embedding) {
    const buffer = Buffer.from(JSON.stringify(embedding));
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE cortex_entries SET embedding = ? WHERE id = ?',
        [buffer, entryId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  /**
   * Search by semantic similarity
   */
  async search(query, options = {}) {
    const { section, limit = 10 } = options;
    
    // Generate query embedding
    const queryEmbedding = await this.generate(query);
    
    // Get all entries with embeddings
    let sql = 'SELECT id, title, content, section, category, embedding FROM cortex_entries WHERE embedding IS NOT NULL';
    const params = [];
    
    if (section) {
      sql += ' AND section = ?';
      params.push(section);
    }
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Calculate cosine similarity for each row
        const results = rows.map(row => {
          const embedding = JSON.parse(row.embedding.toString());
          const similarity = this.cosineSimilarity(queryEmbedding, embedding);
          
          return {
            id: row.id,
            title: row.title,
            content: row.content?.substring(0, 200) + '...',
            section: row.section,
            category: row.category,
            similarity
          };
        });
        
        // Sort by similarity and return top results
        results.sort((a, b) => b.similarity - a.similarity);
        resolve(results.slice(0, limit));
      });
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate embeddings for all entries without them
   */
  async backfillEmbeddings() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, title, content FROM cortex_entries WHERE embedding IS NULL',
        [],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log(`🔧 Backfilling ${rows.length} entries...`);
          
          for (const row of rows) {
            try {
              const text = `${row.title}\n\n${row.content}`;
              const embedding = await this.generate(text);
              await this.storeEmbedding(row.id, embedding);
              console.log(`✅ Embedded: ${row.title.substring(0, 50)}...`);
            } catch (e) {
              console.error(`❌ Failed to embed ${row.id}:`, e.message);
            }
          }
          
          console.log('🔧 Backfill complete!');
          resolve(true);
        }
      );
    });
  }
}

module.exports = EmbeddingService;
