import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

/**
 * Browser-side Supabase client — safe to use in "use client" components.
 * Uses @supabase/ssr for cookie-based session management with Next.js.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton instance for convenience.
 * Components that need reactive auth should use createClient() directly.
 */
export const supabase = createClient();
