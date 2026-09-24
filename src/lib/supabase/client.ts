import { AuthClient } from "@supabase/auth-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * The app only talks to Supabase Auth directly (data goes through our API), so
 * instead of the full supabase-js bundle (auth + postgrest + realtime + storage,
 * ~120 KB gzip) we build the same auth client supabase-js would, with the same
 * options and storage key so existing sessions stay valid.
 */
export const supabase = {
  auth: new AuthClient({
    url: `${supabaseUrl}/auth/v1`,
    headers: { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
    storageKey: `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "implicit",
  }),
};

/** Storage is only needed when uploading a file, so it is loaded on demand. */
export async function getStorageClient() {
  const { StorageClient } = await import("@supabase/storage-js");
  return new StorageClient(`${supabaseUrl}/storage/v1`, {
    Authorization: `Bearer ${supabaseKey}`,
    apikey: supabaseKey,
  });
}
