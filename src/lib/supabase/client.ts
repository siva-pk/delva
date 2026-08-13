import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

/**
 * Browser-side Supabase client.
 *
 * Nothing in the critical path of the timer may await this — the server is
 * durability and scheduled jobs, never the thing standing between a tap and a
 * running block. See CLAUDE.md, "local-first as engineering, not marketing".
 */
export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
