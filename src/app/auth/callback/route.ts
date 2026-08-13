import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing. Exchanges the one-time code for a session cookie.
 *
 * On failure it returns to `/` with a flag rather than to an error page: the
 * app works signed-out, so a failed sign-in is a degraded state, not a dead end.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only ever a path on this origin — an absolute URL here would be an open
  // redirect handed to us by whoever composed the link.
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?auth=failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
