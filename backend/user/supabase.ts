import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secret } from 'encore.dev/config';

const supabaseUrl = secret("SupabaseUrl");
const supabaseKey = secret("SupabaseKey");

let cachedClient: SupabaseClient | null = null;
let lastCreated = 0;
const CACHE_TTL = 60 * 60 * 1000;

function getSupabase(): SupabaseClient {
  const now = Date.now();
  if (!cachedClient || now - lastCreated > CACHE_TTL) {
    cachedClient = createClient(supabaseUrl(), supabaseKey());
    lastCreated = now;
  }
  return cachedClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  }
});
