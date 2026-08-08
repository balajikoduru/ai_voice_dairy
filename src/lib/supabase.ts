import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service role key. The browser never
 * talks to Supabase directly — all reads/writes go through API routes, so
 * tables stay locked behind RLS and no client-side policies are needed.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — see .env.example"
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const AUDIO_BUCKET = "audio";
