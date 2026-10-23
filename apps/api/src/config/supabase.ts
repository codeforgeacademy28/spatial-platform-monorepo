import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().trim().min(1).default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().trim().min(1).default('local-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1).default('local-service-role'),
});

const env = supabaseEnvSchema.parse(process.env);

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type SupabaseClientConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export function getSupabaseConfig(): SupabaseClientConfig {
  return {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Runtime guard for durable project persistence. The client has harmless local
 * placeholders so the API can start in local-only mode, but those placeholders
 * must never be mistaken for a configured production database.
 */
export function getSupabasePersistenceReadiness(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !/^https?:\/\//i.test(url)) missing.push('SUPABASE_URL');
  if (!serviceRoleKey || serviceRoleKey === 'local-service-role') missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return { configured: missing.length === 0, missing };
}

export function assertSupabasePersistenceReady(): void {
  const readiness = getSupabasePersistenceReadiness();
  if (!readiness.configured) {
    throw new Error(`Supabase persistence is enabled but required server configuration is missing or invalid: ${readiness.missing.join(', ')}.`);
  }
}
