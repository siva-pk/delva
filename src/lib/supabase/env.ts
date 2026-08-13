/**
 * Supabase environment, read once and validated loudly.
 *
 * Both values are safe to expose to the browser — the anon key is only useful
 * in combination with row-level security, which is on from the first table
 * (see docs/BUILD-PLAN.md, D-02).
 */
/**
 * Whether sync is even possible. Callers use this to hide or explain sync
 * features rather than to gate the app — the timer works regardless.
 *
 * Both names are written out in full because Next inlines `process.env.FOO`
 * for the browser by literal match; a computed lookup would be `undefined`
 * client-side.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill both in.",
    );
  }

  return { url, anonKey };
}
