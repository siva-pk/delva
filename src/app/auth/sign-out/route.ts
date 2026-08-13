import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * POST-only: a GET sign-out can be fired by any image tag on any page.
 *
 * Local session history is deliberately left in place. Signing out stops sync;
 * it is not a request to erase what is on this device.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
