import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secret } from 'encore.dev/config';

const supabaseUrl = secret("SupabaseUrl");
const supabaseKey = secret("SupabaseKey");

let cachedClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl(), supabaseKey(), {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          'Connection': 'keep-alive'
        }
      }
    });
  }
  return cachedClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  }
});
