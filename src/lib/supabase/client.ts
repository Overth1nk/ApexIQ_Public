import { createBrowserClient } from "@supabase/ssr";

let browserSupabase: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!browserSupabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    browserSupabase = createBrowserClient(supabaseUrl, supabaseKey);
  }

  return browserSupabase;
}
