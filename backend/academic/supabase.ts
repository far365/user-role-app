import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secret } from 'encore.dev/config';

const supabaseUrl = secret("SupabaseUrl");
const supabaseKey = secret("SupabaseKey");

let cachedClient: SupabaseClient | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

function createFreshClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Connection': 'keep-alive'
      }
    }
  });
}

async function healthCheck(client: SupabaseClient): Promise<boolean> {
  try {
    const { error } = await client.from('course_setup').select('count', { count: 'exact', head: true }).limit(0);
    return !error;
  } catch {
    return false;
  }
}

async function getSupabase(): Promise<SupabaseClient> {
  const now = Date.now();
  
  if (!cachedClient) {
    cachedClient = createFreshClient();
    lastHealthCheck = now;
    return cachedClient;
  }

  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    const healthy = await healthCheck(cachedClient);
    if (!healthy) {
      console.warn('[Supabase] Health check failed, recreating client');
      cachedClient = createFreshClient();
    }
    lastHealthCheck = now;
  }

  return cachedClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = cachedClient || createFreshClient();
    const value = (client as any)[prop];
    
    if (typeof value === 'function') {
      return (...args: any[]) => {
        return getSupabase().then(c => (c as any)[prop](...args));
      };
    }
    
    return value;
  }
});
