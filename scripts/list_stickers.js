const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yyoxpcsspmjvolteknsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM'
);

async function listStickers() {
  // Check typical casing combinations
  const paths = [
    'Photos/Blog/Stickers', 
    'photos/Blog/Stickers', 
    'Photos/blog/stickers',
    'photos/blog/stickers'
  ];
  
  for (const path of paths) {
    const { data, error } = await supabase.storage
      .from('akeems admin')
      .list(path, { limit: 100 });
      
    if (data && data.length > 0) {
      console.log(`\nFound in folder: '${path}'\n`);
      data.forEach(file => {
        if (file.name !== '.emptyFolderPlaceholder') {
          const { data: urlData } = supabase.storage
            .from('akeems admin')
            .getPublicUrl(`${path}/${file.name}`);
          console.log(urlData.publicUrl);
        }
      });
      return;
    }
  }
  console.log('No files found in: ' + paths.join(', '));
}

listStickers();
