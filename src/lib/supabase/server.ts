import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const cookieStorePromise = cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      async getAll() {
        try {
          const store = await cookieStorePromise;
          return store.getAll().map(({ name, value }) => ({ name, value }));
        } catch (error) {
          console.warn("Unable to read cookies in server client", error);
          return null;
        }
      },
      async setAll(cookieList: { name: string; value: string; options: CookieOptionsWithName }[]) {
        try {
          const store = await cookieStorePromise;
          cookieList.forEach(({ name, value, options }) => {
            store.set({
              name,
              value,
              ...options,
            });
          });
        } catch (error) {
          console.warn("Unable to set cookies in server client", error);
        }
      },
    },
  });
}
