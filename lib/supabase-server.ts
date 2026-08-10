import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  // Do not throw during static tooling. Routes will fail with a readable error when used.
}

export function supabaseAnonServer(accessToken?: string) {
  return createClient(url || '', anon || '', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

export function supabaseAdmin() {
  return createClient(url || '', service || '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function assertServerConfig() {
  if (!url || !anon || !service) throw new Error('Supabase-Serverkonfiguration fehlt.');
}
