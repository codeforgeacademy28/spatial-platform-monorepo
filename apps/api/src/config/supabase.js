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
export function getSupabaseConfig() {
    return {
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    };
}
//# sourceMappingURL=supabase.js.map