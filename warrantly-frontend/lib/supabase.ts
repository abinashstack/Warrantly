import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL ?? 'https://mepgtjhxcrwimgdykocy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lcGd0amh4Y3J3aW1nZHlrb2N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk0MTgzMSwiZXhwIjoyMDY2NTE3ODMxfQ.XkII5tvb8MerXDjEg3Wh7qjQ7DFVmbm11LLTjciBqbQ'
);
