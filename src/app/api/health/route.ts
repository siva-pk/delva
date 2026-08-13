import { supabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Deployment check, not a user-facing surface. Confirms the app booted and that
 * the configured Supabase project answers with the configured key.
 *
 * This has to issue a real request. `auth.getUser()` looks like it would do the
 * job and does not — with no session cookie it returns `AuthSessionMissingError`
 * without touching the network, so it reports healthy against a project that
 * does not exist. `/rest/v1/` needs a valid `apikey`, so a 200 proves URL, key
 * and network together.
 */
export async function GET() {
  let url: string;
  let anonKey: string;

  try {
    ({ url, anonKey } = supabaseEnv());
  } catch {
    return Response.json(
      { ok: false, supabase: "unconfigured" },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // 401 here means the key is wrong, not that the project is down.
      return Response.json(
        { ok: false, supabase: "rejected", status: response.status },
        { status: 503 },
      );
    }

    return Response.json({ ok: true, supabase: "reachable" });
  } catch (error) {
    // Deliberately not echoed to the caller: this endpoint is public and
    // uncached, and once it touches a table the driver's error text can carry
    // column and constraint names.
    console.error("[health] Supabase unreachable:", error);
    return Response.json(
      { ok: false, supabase: "unreachable" },
      { status: 503 },
    );
  }
}
