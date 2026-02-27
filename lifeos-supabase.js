const { createClient } = require('@supabase/supabase-js');

const LIFEOS_SUPABASE_URL = 'https://pvavybczlrhwagasriwu.supabase.co';
const LIFEOS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YXZ5YmN6bHJod2FnYXNyaXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzUyMzIsImV4cCI6MjA3MDgxMTIzMn0.Y0vL36TCuE8QYFpEbVBKzLYazowtYneUpOkSTk3RkZg';

const lifeos = createClient(LIFEOS_SUPABASE_URL, LIFEOS_SUPABASE_ANON_KEY);
module.exports = { lifeos };
