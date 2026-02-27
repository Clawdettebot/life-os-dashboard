/**
 * Supabase Configuration
 * Contains credentials and connection info for Life OS
 * This file should be shared with Claudnelius
 */

module.exports = {
  // Life OS Supabase (for tasks, habits, cortex, memory, agents)
  lifeos: {
    url: 'https://pvavybczlrhwagasriwu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YXZ5YmN6bHJod2FnYXNyaXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzUyMzIsImV4cCI6MjA3MDgxMTIzMn0.Y0vL36TCuE8QYFpEbVBKzLYazowtYneUpOkSTk3RkZg'
  },
  
  // Website Supabase (for shop, blog, inventory)
  website: {
    url: 'https://yyoxpcsspmjvolteknsn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM'
  }
};
