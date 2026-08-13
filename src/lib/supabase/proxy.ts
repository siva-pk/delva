import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";

/**
 * Refreshes the Supabase auth cookie so Server Components see a live session.
 *
 * Deliberately never redirects. Delva works signed-out — an unauthenticated
 * request is the normal case, not an error, and bouncing it to a sign-in page
 * would make an account a requirement, which is Gate 1 (BUILD-PLAN), not now.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  let url: string;
  let anonKey: string;
  try {
    ({ url, anonKey } = supabaseEnv());
  } catch {
    // Not configured yet (B-02). The app still works; it just cannot sync.
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching auth here is what performs the refresh. Errors are non-fatal:
  // a failed refresh means signed-out, and signed-out is a supported state.
  await supabase.auth.getUser();

  return response;
}
