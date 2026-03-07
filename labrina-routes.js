

// ============================================================
// LABRINA SOCIAL ROUTES
// ============================================================

// Get Labrina ideas from lifeos_notes
app.get('/api/labrina/ideas', async (req, res) => {
  try {
    const { data, error } = await lifeos
      .from('lifeos_notes')
      .select('*')
      .eq('section', 'labrina-ideas')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ ideas: data || [] });
  } catch (e) {
    res.json({ error: e.message, ideas: [] });
  }
});

// Delete/Archive Labrina idea
app.delete('/api/labrina/ideas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await lifeos
      .from('lifeos_notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Promote idea to blog draft
app.post('/api/labrina/ideas/:id/to-blog', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the idea
    const { data: idea, error: fetchError } = await lifeos
      .from('lifeos_notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Create blog post
    const { data: blogPost, error: blogError } = await lifeos
      .from('blog_posts')
      .insert([{
        title: idea.title,
        content: idea.content,
        status: 'draft',
        author: 'Labrina',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (blogError) throw blogError;
    
    // Delete the idea
    await lifeos.from('lifeos_notes').delete().eq('id', id);
    
    res.json({ success: true, blogPost });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Drive Labrina-post folder route
app.get('/api/drive/labrina-post', async (req, res) => {
  const { day } = req.query;
  // Placeholder - would integrate with Google Drive API
  res.json({ 
    folderId: '1NOjjvIkQHp8WKipM18iOizMyIUtUKvEF',
    day: day || 'monday',
    files: [] 
  });
});
