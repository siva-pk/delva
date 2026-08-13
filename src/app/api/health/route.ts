import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Deployment check, not a user-facing surface. Confirms the app booted and that
 * the configured Supabase project is reachable.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    // No tables yet (D-02). Hitting auth proves URL + key + network.
    const { error } = await supabase.auth.getUser();

    // "No session" is the expected answer for an anonymous request — only a
    // transport-level failure means Supabase is actually unreachable.
    const reachable = !error || error.status !== undefined;

    return Response.json(
      { ok: reachable, supabase: reachable ? "reachable" : "unreachable" },
      { status: reachable ? 200 : 503 },
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 503 },
    );
  }
}
