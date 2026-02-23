const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://yyoxpcsspmjvolteknsn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage configuration
const STORAGE_BUCKET = 'akeems admin';
const STORAGE_PATHS = {
  blog: 'photos/Blog',
  events: 'photos/Events',
  merch: 'photos/Merch',
  music: 'photos/Music',
  portfolio: 'photos/Portfolio',
  samva: 'photos/Samva',
  shop: 'photos/Shop',
  art: 'art',
  music_audio: 'music',
  videos: 'videos'
};

// Helper functions for guap.dad content management
const guapDad = {
  // MUSIC - Read from existing Supabase tables (track, music_project)
  async getMusicProjects(type = null) {
    let query = supabase
      .from('music_project')
      .select('*')
      .order('release_date', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    return { data, error };
  },

  async getProjectById(projectId) {
    const { data, error } = await supabase
      .from('music_project')
      .select('*')
      .eq('id', projectId)
      .single();
    return { data, error };
  },

  async getTracksByProject(projectId) {
    const { data, error } = await supabase
      .from('track')
      .select('*')
      .eq('music_project_id', projectId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  async getTrackById(trackId) {
    const { data, error } = await supabase
      .from('track')
      .select('*')
      .eq('id', trackId)
      .single();
    return { data, error };
  },

  async getAllTracks() {
    const { data, error } = await supabase
      .from('track')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // BLOG POSTS (using blog_post table)
  async getBlogPosts(limit = 10, status = null) {
    let query = supabase
      .from('blog_post')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    return { data, error };
  },

  async getPublishedPosts(limit = 10) {
    const { data, error } = await supabase
      .from('blog_post')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  async createBlogPost(post) {
    const { data, error } = await supabase
      .from('blog_post')
      .insert([{
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || null,
        author: post.author || 'Akim',
        slug: post.slug || post.title.toLowerCase().replace(/\s+/g, '-'),
        featured_image: post.featured_image || null,
        status: post.status || 'draft',
        published_at: post.status === 'published' ? new Date().toISOString() : null,
        elements: post.elements || null,
        is_premium: post.is_premium || false,
        premium_tier: post.premium_tier || 'free',
        discord_enabled: post.discord_enabled !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    return { data, error };
  },

  async updateBlogPost(id, updates) {
    const updateData = { ...updates, updated_at: new Date().toISOString() };
    
    if (updates.status === 'published' && !updates.published_at) {
      updateData.published_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('blog_post')
      .update(updateData)
      .eq('id', id);
    return { data, error };
  },

  async deleteBlogPost(id) {
    const { data, error } = await supabase
      .from('blog_post')
      .delete()
      .eq('id', id);
    return { data, error };
  },

  // SHOP ITEMS (using shop_item table)
  async getShopItems() {
    const { data, error } = await supabase
      .from('shop_item')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getAvailableItems() {
    const { data, error } = await supabase
      .from('shop_item')
      .select('*')
      .eq('available', true)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createShopItem(item) {
    const { data, error } = await supabase
      .from('shop_item')
      .insert([{
        name: item.name,
        description: item.description,
        price: item.price ? String(item.price) : null,
        images: item.images || null,
        purchase_link: item.purchase_link,
        category: item.category || null,
        available: item.available !== false,
        featured: item.featured || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    return { data, error };
  },

  async updateShopItem(id, updates) {
    const updateData = { ...updates, updated_at: new Date().toISOString() };
    
    if (updates.price !== undefined) {
      updateData.price = String(updates.price);
    }
    
    const { data, error } = await supabase
      .from('shop_item')
      .update(updateData)
      .eq('id', id);
    return { data, error };
  },

  async deleteShopItem(id) {
    const { data, error } = await supabase
      .from('shop_item')
      .delete()
      .eq('id', id);
    return { data, error };
  },

  // Storage/Images - Using 'akeems admin' bucket
  async uploadToShop(fileName, fileBuffer, contentType) {
    const path = `${STORAGE_PATHS.shop}/${fileName}`;
    const { data, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true
      });
    
    if (error) return { error };
    
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    
    return { url: publicUrl, error: null };
  },

  async uploadToMerch(fileName, fileBuffer, contentType) {
    const path = `${STORAGE_PATHS.merch}/${fileName}`;
    const { data, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true
      });
    
    if (error) return { error };
    
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    
    return { url: publicUrl, error: null };
  },

  async uploadToBlog(fileName, fileBuffer, contentType) {
    const path = `${STORAGE_PATHS.blog}/${fileName}`;
    const { data, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true
      });
    
    if (error) return { error };
    
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    
    return { url: publicUrl, error: null };
  },

  getPublicUrl(subfolder, fileName) {
    const path = `${STORAGE_PATHS[subfolder] || subfolder}/${fileName}`;
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    return publicUrl;
  },

  // Test connection
  async testConnection() {
    const start = Date.now();
    const { data, error } = await supabase.from('blog_post').select('count').limit(1);
    const latency = Date.now() - start;
    return {
      connected: !error,
      latency: latency + 'ms',
      error: error?.message || null
    };
  }
};

module.exports = { supabase, guapDad, STORAGE_BUCKET, STORAGE_PATHS };
