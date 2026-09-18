import WebSocket from "ws";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase's realtime client (initialised inside createClient()) expects a
// global WebSocket. Netlify Functions run Node < 22 where it doesn't exist.
// We don't use realtime server-side, but the constructor still checks for it,
// so we polyfill the global before any createClient() call.
// ---------------------------------------------------------------------------
const g = globalThis as { WebSocket?: unknown };
if (typeof g.WebSocket === "undefined") {
  g.WebSocket = WebSocket;
}

let _client: SupabaseClient | null = null;

/**
 * Lazily construct the service-role Supabase client.
 * Bypasses RLS — NEVER import this into frontend code.
 *
 * Created on first access so missing env vars surface inside the handler
 * where they can be caught and returned as a readable JSON error.
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
  });
  return _client;
}