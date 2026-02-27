/**
 * Cortex Supabase Operations
 * Replaces SQLite operations with Supabase calls
 */

const cortexClient = require('./cortex-supabase.js');

// Get entries needing enhancement
async function getNeedingEnhancement() {
  return await cortexClient.getNeedingEnhancement();
}

// Get entries needing embeddings
async function getNeedingEmbeddings() {
  return await cortexClient.getNeedingEmbeddings();
}

// Update entry content
async function updateContent(id, content, metadata = {}) {
  return await cortexClient.update(id, { content, metadata });
}

// Update entry embedding
async function updateEmbedding(id, embedding) {
  return await cortexClient.updateEmbedding(id, embedding);
}

// Create new entry
async function createEntry(entry) {
  return await cortexClient.create(entry);
}

// Get all entries
async function getAll(limit = 100) {
  return await cortexClient.getAll(limit);
}

module.exports = {
  getNeedingEnhancement,
  getNeedingEmbeddings,
  updateContent,
  updateEmbedding,
  createEntry,
  getAll
};
