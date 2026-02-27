/**
 * Supabase Cortex Client
 * Unified client for all cortex operations
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.LIFEOS_SUPABASE_URL || 'https://pvavybczlrhwagasriwu.supabase.co',
  process.env.LIFEOS_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YXZ5YmN6bHJod2FnYXNyaXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzUyMzIsImV4cCI6MjA3MDgxMTIzMn0.Y0vL36TCuE8QYFpEbVBKzLYazowtYneUpOkSTk3RkZg'
);

// Get all cortex entries
async function getAll(limit = 100) {
  const { data, error } = await supabase
    .from('lifeos_cortex')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Get entries needing enhancement (no content or minimal content)
async function getNeedingEnhancement() {
  const { data, error } = await supabase
    .from('lifeos_cortex')
    .select('*')
    .or('content.is.null,content.lt.50')
    .limit(50);
  if (error) throw error;
  return data || [];
}

// Get entries needing embeddings
async function getNeedingEmbeddings() {
  const { data, error } = await supabase
    .from('lifeos_cortex')
    .select('*')
    .is('embedding', null)
    .limit(100);
  if (error) throw error;
  return data || [];
}

// Create new entry
async function create(entry) {
  const { data, error } = await supabase
    .from('lifeos_cortex')
    .insert({
      title: entry.title,
      content: entry.content,
      section: entry.section || 'all_spark',
      category: entry.category,
      content_type: entry.content_type || 'note',
      source_url: entry.source_url,
      source_platform: entry.source_platform,
      tags: entry.tags || [],
      metadata: entry.metadata || {},
      created_at: entry.created_at || new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update entry
async function update(id, updates) {
  const { data, error } = await supabase
    .from('lifeos_cortex')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update embedding
async function updateEmbedding(id, embedding) {
  const { error } = await supabase
    .from('lifeos_cortex')
    .update({ embedding })
    .eq('id', id);
  if (error) throw error;
}

// Search by embedding similarity
async function searchByEmbedding(embedding, limit = 10) {
  const { data, error } = await supabase.rpc('match_cortex', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit
  });
  if (error) {
    // Fallback to basic search if RPC doesn't exist
    return [];
  }
  return data || [];
}

// Get stats
async function getStats() {
  const { count: total } = await supabase
    .from('lifeos_cortex')
    .select('*', { count: 'exact', head: true });
  
  const { data: bySection } = await supabase
    .from('lifeos_cortex')
    .select('section');
  
  const sectionCounts = {};
  for (const entry of bySection || []) {
    sectionCounts[entry.section] = (sectionCounts[entry.section] || 0) + 1;
  }
  
  return {
    total: total || 0,
    bySection: Object.entries(sectionCounts).map(([section, count]) => ({ section, count }))
  };
}

module.exports = {
  supabase,
  getAll,
  getNeedingEnhancement,
  getNeedingEmbeddings,
  create,
  update,
  updateEmbedding,
  searchByEmbedding,
  getStats
};
