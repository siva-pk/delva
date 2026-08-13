import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CurrentUser = { id: string; email: string | null } | null;

/**
 * The signed-in user, or null. Null is a normal, fully supported state — never
 * treat it as an error or a reason to redirect.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  } catch {
    // Sync being unavailable must never take the app down with it.
    return null;
  }
}
