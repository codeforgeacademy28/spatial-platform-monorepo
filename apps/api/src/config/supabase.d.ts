export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export type SupabaseClientConfig = {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
};
export declare function getSupabaseConfig(): SupabaseClientConfig;
//# sourceMappingURL=supabase.d.ts.map