// FILE: server/src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL and Service Key must be provided in environment variables.");
}

// The service_role key has admin privileges and is safe to use on the server.
// It bypasses any Row Level Security policies.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);