/**
 * Knowledge Knaight - Robust Version
 * Multi-provider AI, retry logic, caching, duplicate detection
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  // AI Providers (in priority order)
  aiProviders: [
    { name: 'zai', model: 'zai/glm-5', key: process.env.ZUKI_API_KEY || process.env.OPENAI_API_KEY },
    { name: 'openai', model: 'gpt-4o-mini', key: process.env.OPENAI_API_KEY },
    { name: 'gemini', model: 'gemini-2.0-flash-exp', key: process.env.GEMINI_API_KEY }
  ],
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // Start at 1s, doubles each retry
  
  // Rate limiting
  maxRequestsPerMinute: 20,
  
  // Caching
  cacheFile: path.join(__dirname, 'data', 'knaight-cache.json'),
  cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  
  // Deduplication
  processedFile: path.join(__dirname, 'data', 'knaight-processed.json'),
  
  // Health check
  healthCheckInterval: 60000, // 1 minute
};

// ─────────────────────────────────────────────────────────────
// AI PROVIDER WITH FALLBACKS
// ─────────────────────────────────────────────────────────────

class AIProvider {
  constructor(providers) {
    this.providers = providers.filter(p => p.key);
    this.currentIndex = 0;
  }
  
  async generate(prompt, systemPrompt = '') {
    let lastError;
    
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.providers[this.currentIndex];
      
      try {
        const result = await this._callProvider(provider, prompt, systemPrompt);
        console.log(`✅ AI response from ${provider.name}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ ${provider.name} failed: ${error.message}`);
        lastError = error;
        
        // Move to next provider
        this.currentIndex = (this.currentIndex + 1) % this.providers.length;
        
        // Wait before trying next
        await this._sleep(500);
      }
    }
    
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }
  
  async _callProvider(provider, prompt, systemPrompt) {
    switch (provider.name) {
      case 'zai':
      case 'openai':
        return await this._callOpenAI(provider, prompt, systemPrompt);
      case 'gemini':
        return await this._callGemini(provider, prompt, systemPrompt);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }
  
  async _callOpenAI(provider, prompt, systemPrompt) {
    const response = await axios.post('https://api.zukijourney.com/v1/chat/completions', {
      model: provider.model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${provider.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    return response.data.choices[0].message.content;
  }
  
  async _callGemini(provider, prompt, systemPrompt) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.key}`,
      {
        contents: [{
          parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
        }]
      },
      { timeout: 30000 }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  }
  
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ─────────────────────────────────────────────────────────────
// RETRY WITH BACKOFF
// ─────────────────────────────────────────────────────────────

async function withRetry(fn, maxRetries = CONFIG.maxRetries, initialDelay = CONFIG.retryDelay) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError;
}

// ─────────────────────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────────────────────

class RateLimiter {
  constructor(maxPerMinute) {
    this.maxPerMinute = maxPerMinute;
    this.requests = [];
  }
  
  async waitForSlot() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < 60000);
    
    if (this.requests.length >= this.maxPerMinute) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);
      console.log(`⏳ Rate limited, waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
    
    this.requests.push(Date.now());
  }
}

// ─────────────────────────────────────────────────────────────
// CACHE MANAGER
// ─────────────────────────────────────────────────────────────

class CacheManager {
  constructor(cacheFile, expiryMs) {
    this.cacheFile = cacheFile;
    this.expiryMs = expiryMs;
    this.cache = {};
  }
  
  async load() {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf8');
      this.cache = JSON.parse(data);
    } catch {
      this.cache = {};
    }
  }
  
  async save() {
    try {
      await fs.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error.message);
    }
  }
  
  get(key) {
    const entry = this.cache[key];
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.expiryMs) {
      delete this.cache[key];
      return null;
    }
    
    return entry.data;
  }
  
  set(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }
  
  has(key) {
    return this.get(key) !== null;
  }
}

// ─────────────────────────────────────────────────────────────
// DUPLICATE DETECTION
// ─────────────────────────────────────────────────────────────

class DuplicateDetector {
  constructor(processedFile) {
    this.processedFile = processedFile;
    this.processed = new Set();
  }
  
  async load() {
    try {
      const data = await fs.readFile(this.processedFile, 'utf8');
      const arr = JSON.parse(data);
      this.processed = new Set(arr);
    } catch {
      this.processed = new Set();
    }
  }
  
  async save() {
    try {
      await fs.writeFile(this.processedFile, JSON.stringify([...this.processed], null, 2));
    } catch (error) {
      console.warn('⚠️ Failed to save processed URLs:', error.message);
    }
  }
  
  isProcessed(url) {
    return this.processed.has(this._normalize(url));
  }
  
  markProcessed(url) {
    this.processed.add(this._normalize(url));
  }
  
  _normalize(url) {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }
}

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────

class HealthCheck {
  constructor(intervalMs) {
    this.intervalMs = intervalMs;
    this.lastCheck = Date.now();
    this.isHealthy = true;
    this.errors = [];
  }
  
  start() {
    setInterval(() => this.check(), this.intervalMs);
  }
  
  check() {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheck;
    
    // If no activity for 5+ minutes, might be stuck
    if (timeSinceLastCheck > 5 * 60 * 1000) {
      console.log('🏥 Health check: No recent activity');
    }
    
    this.lastCheck = now;
  }
  
  recordSuccess() {
    this.lastCheck = Date.now();
    this.isHealthy = true;
  }
  
  recordError(error) {
    this.errors.push({
      time: Date.now(),
      message: error.message
    });
    
    // Keep only last 10 errors
    if (this.errors.length > 10) {
      this.errors.shift();
    }
  }
  
  getStatus() {
    return {
      healthy: this.isHealthy,
      lastActivity: new Date(this.lastCheck).toISOString(),
      recentErrors: this.errors.slice(-3)
    };
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  AIProvider,
  withRetry,
  RateLimiter,
  CacheManager,
  DuplicateDetector,
  HealthCheck,
  CONFIG
};
