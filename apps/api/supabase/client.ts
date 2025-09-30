import { createClient, SupabaseClient } from '@supabase/supabase-js';

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const url = process.env.SUPABASE_URL?.trim();
const serviceRole = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

export function getAdminSupabaseClient(): SupabaseClient {
  if (!url || !serviceRole) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE are required for server-side Supabase operations.');
  }
  const g = global as any;
  if (!g.__supabaseAdmin) {
    g.__supabaseAdmin = createClient(url, serviceRole, { auth: { persistSession: false } });
  }
  return g.__supabaseAdmin as SupabaseClient;
}

export function getAnonSupabaseClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) are required for anon client');
  }
  const g = global as any;
  if (!g.__supabaseAnon) {
    g.__supabaseAnon = createClient(url, anonKey);
  }
  return g.__supabaseAnon as SupabaseClient;
}
