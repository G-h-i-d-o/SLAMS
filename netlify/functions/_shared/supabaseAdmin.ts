import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

let _client: SupabaseClient | null = null;

/**
 * Lazily construct the service-role Supabase client.
 * Bypasses RLS — NEVER import this into frontend code.
 *
 * We pass `ws` as the realtime transport so the constructor doesn't
 * crash on Netlify Functions (which run Node < 22 without a native
 * WebSocket global). We don't use realtime here, but Supabase's
 * SupabaseClient constructor initialises a RealtimeClient regardless,
 * so it needs a valid WebSocket implementation to even instantiate.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Netlify environment (Functions scope)."
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: WebSocket as any,
    },
  });
  return _client;
}