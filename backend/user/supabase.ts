import { createClient } from '@supabase/supabase-js';
import { secret } from 'encore.dev/config';

const supabaseUrl = secret("SupabaseUrl");
const supabaseKey = secret("SupabaseKey");

console.log("Hello");
console.log(supabaseUrl());

export const supabase = createClient(supabaseUrl(), supabaseKey());
