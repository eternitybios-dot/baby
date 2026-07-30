import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "@/lib/supabase/config";

let client: SupabaseClient | null = null;
let clientFingerprint = "";

export function getSupabaseClient(config: SupabaseConfig): SupabaseClient {
  const fingerprint = `${config.url}|${config.anonKey}`;
  if (client && clientFingerprint === fingerprint) return client;

  client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "sukusuku-auth",
    },
  });
  clientFingerprint = fingerprint;
  return client;
}

export function resetSupabaseClient(): void {
  client = null;
  clientFingerprint = "";
}
