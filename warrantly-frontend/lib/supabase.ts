import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mepgtjhxcrwimgdykocy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lcGd0amh4Y3J3aW1nZHlrb2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDE4MzEsImV4cCI6MjA2NjUxNzgzMX0.qCBQKEDqV39TjX1nmiZqUCxqo7YuHMXEF1IW9fQ6bAg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
